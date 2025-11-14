import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';
import Database from '../utils/database';
import config from '../config';

/**
 * Health check endpoint
 * GET /health
 */
export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  const dbHealthy = await Database.healthCheck();

  const health = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    service: 'english-tutor-backend',
    version: '1.0.0',
    environment: config.app.env,
    database: {
      status: dbHealthy ? 'connected' : 'disconnected',
    },
    uptime: process.uptime(),
  };

  const statusCode = dbHealthy ? 200 : 503;

  sendSuccess(res, health, statusCode);
});
