import rateLimit from 'express-rate-limit';
import config from '../config';
import { TooManyRequestsError, ErrorCodes } from '../utils/errors';

/**
 * General rate limiter for all routes
 * Limits requests per IP address
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  handler: (_req, _res) => {
    throw new TooManyRequestsError(
      'Too many requests, please try again later',
      ErrorCodes.RATE_LIMIT_EXCEEDED
    );
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  skipSuccessfulRequests: false,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res) => {
    throw new TooManyRequestsError(
      'Too many authentication attempts. Please try again in 15 minutes',
      ErrorCodes.RATE_LIMIT_EXCEEDED
    );
  },
});

/**
 * Rate limiter for chat endpoints
 * Allows more requests but still prevents abuse
 */
export const chatRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: 'Too many messages sent, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res) => {
    throw new TooManyRequestsError(
      'You are sending messages too quickly. Please wait a moment',
      ErrorCodes.RATE_LIMIT_EXCEEDED
    );
  },
});

/**
 * Rate limiter for registration endpoint
 * Very strict to prevent spam account creation
 */
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registrations per hour per IP
  skipSuccessfulRequests: false,
  message: 'Too many accounts created from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res) => {
    throw new TooManyRequestsError(
      'Too many registration attempts. Please try again later',
      ErrorCodes.RATE_LIMIT_EXCEEDED
    );
  },
});

/**
 * Dynamic rate limiter based on user authentication
 * Authenticated users get higher limits
 */
export function createDynamicRateLimiter(
  authenticatedMax: number,
  unauthenticatedMax: number,
  windowMs: number
) {
  return rateLimit({
    windowMs,
    max: (req) => {
      // Check if user is authenticated
      const authHeader = req.headers.authorization;
      return authHeader ? authenticatedMax : unauthenticatedMax;
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res) => {
      throw new TooManyRequestsError(
        'Rate limit exceeded',
        ErrorCodes.RATE_LIMIT_EXCEEDED
      );
    },
  });
}
