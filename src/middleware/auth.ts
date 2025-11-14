import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError, ErrorCodes } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Extend Express Request to include user information
 */
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user info to request
 */
export function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided', ErrorCodes.UNAUTHORIZED);
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization header format', ErrorCodes.UNAUTHORIZED);
    }

    const token = parts[1];

    // Verify token
    const decoded = verifyAccessToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    logger.debug('User authenticated', { userId: decoded.userId });

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export function optionalAuthenticate(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const parts = authHeader.split(' ');

      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = verifyAccessToken(token);

        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }

    next();
  } catch {
    // Continue without authentication if token is invalid
    next();
  }
}

/**
 * Role-based authorization middleware
 * Requires specific role(s) to access the route
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(
          'Authentication required',
          ErrorCodes.UNAUTHORIZED
        );
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new UnauthorizedError(
          'Insufficient permissions',
          ErrorCodes.INSUFFICIENT_PERMISSIONS
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Verify user owns the resource
 * Use this middleware to ensure users can only access their own data
 */
export function requireOwnership(userIdParam: string = 'userId') {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError(
          'Authentication required',
          ErrorCodes.UNAUTHORIZED
        );
      }

      const resourceUserId = req.params[userIdParam] || req.body[userIdParam];

      if (!resourceUserId) {
        throw new UnauthorizedError(
          'Resource user ID not found',
          ErrorCodes.UNAUTHORIZED
        );
      }

      // Admin can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Regular users can only access their own resources
      if (req.user.userId !== resourceUserId) {
        throw new UnauthorizedError(
          'You can only access your own resources',
          ErrorCodes.INSUFFICIENT_PERMISSIONS
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
