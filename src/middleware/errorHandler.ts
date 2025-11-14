import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse, InternalServerError } from '../utils/errors';
import { logError } from '../utils/logger';
import config from '../config';

/**
 * Global error handling middleware
 * Catches all errors and sends appropriate responses
 */
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logError(error, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: (req as any).user?.userId,
  });

  // Handle AppError instances
  if (error instanceof AppError) {
    const errorResponse = formatErrorResponse(error, req.path);

    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle Prisma errors
  if (error.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    // Handle unique constraint violations
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field';
      const appError = new AppError(
        `${field} already exists`,
        409,
        'DUPLICATE_RESOURCE'
      );
      const errorResponse = formatErrorResponse(appError, req.path);
      res.status(409).json(errorResponse);
      return;
    }

    // Handle record not found
    if (prismaError.code === 'P2025') {
      const appError = new AppError('Resource not found', 404, 'NOT_FOUND');
      const errorResponse = formatErrorResponse(appError, req.path);
      res.status(404).json(errorResponse);
      return;
    }
  }

  // Handle Prisma validation errors
  if (error.constructor.name === 'PrismaClientValidationError') {
    const appError = new AppError('Invalid data provided', 400, 'VALIDATION_ERROR');
    const errorResponse = formatErrorResponse(appError, req.path);
    res.status(400).json(errorResponse);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const appError = new AppError('Invalid token', 401, 'TOKEN_INVALID');
    const errorResponse = formatErrorResponse(appError, req.path);
    res.status(401).json(errorResponse);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const appError = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
    const errorResponse = formatErrorResponse(appError, req.path);
    res.status(401).json(errorResponse);
    return;
  }

  // Handle validation errors from Joi
  if (error.name === 'ValidationError') {
    const appError = new AppError(error.message, 400, 'VALIDATION_ERROR');
    const errorResponse = formatErrorResponse(appError, req.path);
    res.status(400).json(errorResponse);
    return;
  }

  // Default to internal server error
  const internalError = new InternalServerError();
  const errorResponse = formatErrorResponse(internalError, req.path);

  // Don't expose internal error details in production
  if (config.app.env === 'production') {
    errorResponse.error.message = 'An unexpected error occurred';
  } else {
    errorResponse.error.details = {
      originalMessage: error.message,
      stack: error.stack,
    };
  }

  res.status(500).json(errorResponse);
}

/**
 * 404 Not Found handler
 * Should be registered after all routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error = new AppError(
    `Route ${req.method} ${req.path} not found`,
    404,
    'NOT_FOUND'
  );

  const errorResponse = formatErrorResponse(error, req.path);
  res.status(404).json(errorResponse);
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
