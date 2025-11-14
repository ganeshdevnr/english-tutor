import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

/**
 * Extend Express Request to include request ID
 */
export interface RequestWithId extends Request {
  id?: string;
  startTime?: number;
}

/**
 * Request ID middleware
 * Generates unique ID for each request for tracking
 */
export function requestId(req: RequestWithId, res: Response, next: NextFunction): void {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}

/**
 * Request logger middleware
 * Logs incoming requests and responses
 */
export function requestLogger(req: RequestWithId, res: Response, next: NextFunction): void {
  req.startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.userId,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || Date.now());

    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: (req as any).user?.userId,
    });
  });

  next();
}

/**
 * Sanitize request body for logging
 * Removes sensitive fields like passwords
 */
export function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken'];

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }

  return sanitized;
}

/**
 * Request body logger middleware
 * Logs request body (with sensitive data redacted)
 */
export function bodyLogger(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug('Request body', {
      requestId: (req as RequestWithId).id,
      body: sanitizeBody(req.body),
    });
  }

  next();
}
