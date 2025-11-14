import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import config from './config';
import { setupSwagger } from './config/swagger';
import routes, { healthRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestId, requestLogger, bodyLogger } from './middleware/requestLogger';
import { generalRateLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Compression middleware
  app.use(compression());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request ID and logging
  app.use(requestId);
  app.use(requestLogger);

  // HTTP request logging (Morgan)
  if (config.app.env === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim()),
        },
      })
    );
  }

  // Body logging (debug only)
  if (config.app.env === 'development') {
    app.use(bodyLogger);
  }

  // Rate limiting
  app.use(generalRateLimiter);

  // Swagger API Documentation
  setupSwagger(app);

  // Health check route (mounted at root)
  app.use('/health', healthRoutes);

  // API routes
  app.use(config.app.apiPrefix, routes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp;
