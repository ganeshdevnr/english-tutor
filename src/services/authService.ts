import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { prisma } from '../utils/database';
import config from '../config';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getTokenExpiry,
  TokenPayload,
} from '../utils/jwt';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ErrorCodes,
} from '../utils/errors';
import logger from '../utils/logger';

/**
 * User registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

/**
 * User login data
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Check if account is locked due to too many failed login attempts
 */
async function checkAccountLock(user: User): Promise<void> {
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingTime = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 1000 / 60
    );

    throw new UnauthorizedError(
      `Account is locked. Please try again in ${remainingTime} minutes`,
      ErrorCodes.ACCOUNT_LOCKED
    );
  }

  // Reset lock if expired
  if (user.lockedUntil && user.lockedUntil <= new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
      },
    });
  }
}

/**
 * Handle failed login attempt
 */
async function handleFailedLogin(userId: string, currentAttempts: number): Promise<void> {
  const attempts = currentAttempts + 1;

  if (attempts >= config.security.maxLoginAttempts) {
    const lockUntil = new Date(Date.now() + config.security.accountLockoutDuration);

    await prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: attempts,
        lockedUntil: lockUntil,
      },
    });

    logger.warn('Account locked due to too many failed login attempts', { userId });

    throw new UnauthorizedError(
      'Too many failed login attempts. Account locked for 15 minutes',
      ErrorCodes.ACCOUNT_LOCKED
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      loginAttempts: attempts,
    },
  });
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered', ErrorCodes.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, config.security.bcryptRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name,
        role: 'user',
        emailVerified: false,
      },
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getTokenExpiry(config.jwt.refreshExpiry),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error('Registration failed', { error, email: data.email });
    throw error;
  }
}

/**
 * Login user
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password', ErrorCodes.INVALID_CREDENTIALS);
    }

    // Check account lock
    await checkAccountLock(user);

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      await handleFailedLogin(user.id, user.loginAttempts);
      throw new UnauthorizedError('Invalid email or password', ErrorCodes.INVALID_CREDENTIALS);
    }

    // Reset login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: getTokenExpiry(config.jwt.refreshExpiry),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error('Login failed', { error, email: data.email });
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshTokenString: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  try {
    // Verify refresh token
    verifyRefreshToken(refreshTokenString);

    // Check if refresh token exists and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token', ErrorCodes.TOKEN_INVALID);
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedError('Refresh token has been revoked', ErrorCodes.TOKEN_INVALID);
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired', ErrorCodes.TOKEN_EXPIRED);
    }

    // Revoke old refresh token (token rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.user.id,
        expiresAt: getTokenExpiry(config.jwt.refreshExpiry),
      },
    });

    logger.info('Access token refreshed', { userId: storedToken.user.id });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    logger.error('Token refresh failed', { error });
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND);
    }

    return user;
  } catch (error) {
    logger.error('Failed to get user profile', { error, userId });
    throw error;
  }
}

/**
 * Logout user (revoke refresh token)
 */
export async function logout(refreshTokenString: string): Promise<void> {
  try {
    const token = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenString },
    });

    if (token && !token.revokedAt) {
      await prisma.refreshToken.update({
        where: { id: token.id },
        data: { revokedAt: new Date() },
      });

      logger.info('User logged out', { userId: token.userId });
    }
  } catch (error) {
    logger.error('Logout failed', { error });
    throw error;
  }
}

/**
 * Cleanup expired refresh tokens (can be run as a scheduled job)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });

    logger.info('Expired tokens cleaned up', { count: result.count });
    return result.count;
  } catch (error) {
    logger.error('Token cleanup failed', { error });
    throw error;
  }
}
