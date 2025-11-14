import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as chatService from '../services/chatService';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Send a message
 * POST /api/chat/message
 */
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const { message, conversationId } = req.body;

  const result = await chatService.sendMessage({
    userId: req.user.userId,
    message,
    conversationId,
  });

  sendCreated(res, result);
});

/**
 * Get conversation history
 * GET /api/chat/history
 */
export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const { conversations, total } = await chatService.getConversationHistory(
    req.user.userId,
    page,
    limit
  );

  sendPaginated(res, conversations, page, limit, total);
});

/**
 * Get a specific conversation
 * GET /api/chat/conversations/:conversationId
 */
export const getConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const { conversationId } = req.params;

  const conversation = await chatService.getConversation(req.user.userId, conversationId);

  sendSuccess(res, conversation);
});

/**
 * Create a new conversation
 * POST /api/chat/conversations
 */
export const createConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const { title, firstMessage } = req.body;

  const conversation = await chatService.createConversation(
    req.user.userId,
    title,
    firstMessage
  );

  sendCreated(res, conversation);
});

/**
 * Delete a conversation
 * DELETE /api/chat/conversations/:conversationId
 */
export const deleteConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const { conversationId } = req.params;

  await chatService.deleteConversation(req.user.userId, conversationId);

  sendNoContent(res);
});

/**
 * Delete a message
 * DELETE /api/chat/messages/:messageId
 */
export const deleteMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const { messageId } = req.params;

  await chatService.deleteMessage(req.user.userId, messageId);

  sendNoContent(res);
});
