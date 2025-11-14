import jwt from 'jsonwebtoken';
import config from '../config';
import { UnauthorizedError, ErrorCodes } from './errors';

/**
 * JWT token payload interface
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Decoded token interface
 */
export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: TokenPayload): string {
  // @ts-expect-error - jsonwebtoken types have issues with string expiresIn
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  // @ts-expect-error - jsonwebtoken types have issues with string expiresIn
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token expired', ErrorCodes.TOKEN_EXPIRED);
    }
    throw new UnauthorizedError('Invalid access token', ErrorCodes.TOKEN_INVALID);
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token expired', ErrorCodes.TOKEN_EXPIRED);
    }
    throw new UnauthorizedError('Invalid refresh token', ErrorCodes.TOKEN_INVALID);
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Calculate token expiration date
 */
export function getTokenExpiry(expiryString: string): Date {
  const now = new Date();
  const match = expiryString.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error('Invalid expiry format');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      now.setSeconds(now.getSeconds() + value);
      break;
    case 'm':
      now.setMinutes(now.getMinutes() + value);
      break;
    case 'h':
      now.setHours(now.getHours() + value);
      break;
    case 'd':
      now.setDate(now.getDate() + value);
      break;
  }

  return now;
}
