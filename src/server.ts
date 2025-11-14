import { createApp } from './app';
import config, { validateConfig } from './config';
import logger from './utils/logger';
import Database from './utils/database';

/**
 * Start the server
 */
async function startServer() {
  try {
    // Validate configuration
    logger.info('Validating configuration...');
    validateConfig();

    // Test database connection
    logger.info('Testing database connection...');
    const dbHealthy = await Database.healthCheck();

    if (!dbHealthy) {
      throw new Error('Database connection failed');
    }

    logger.info('Database connection successful');

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(config.app.port, () => {
      logger.info(`Server started successfully`, {
        port: config.app.port,
        environment: config.app.env,
        apiPrefix: config.app.apiPrefix,
      });

      logger.info(`Health check available at: http://localhost:${config.app.port}/health`);
      logger.info(`API available at: http://localhost:${config.app.port}${config.app.apiPrefix}`);
    });

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await Database.disconnect();
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forceful shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', { error });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection', { reason });
      gracefulShutdown('unhandledRejection');
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();
