import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { NotFoundError, ErrorCodes } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Get user information by ID
 * Used by LLM service to fetch user details
 *
 * @route GET /api/llm/users/:userId
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive fields like password, loginAttempts, etc.
      },
    });

    if (!user) {
      throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND);
    }

    logger.info('LLM service fetched user information', {
      userId: user.id,
      requestIp: req.ip,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    throw error;
  }
}
