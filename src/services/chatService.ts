import { Conversation, Message } from '@prisma/client';
import { prisma } from '../utils/database';
import { NotFoundError, ForbiddenError, ErrorCodes } from '../utils/errors';
import logger from '../utils/logger';
import * as agentClient from './agentClient';

/**
 * Send message data
 */
export interface SendMessageData {
  userId: string;
  message: string;
  conversationId?: string;
}

/**
 * Message response
 */
export interface MessageResponse {
  conversationId: string;
  userMessage: Message;
  assistantMessage: Message;
}

/**
 * Conversation with messages
 */
export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

/**
 * Generate conversation title from first message
 */
function generateConversationTitle(message: string): string {
  const maxLength = 50;
  const title = message.substring(0, maxLength);
  return title.length < message.length ? `${title}...` : title;
}

/**
 * Send a message and get AI response
 */
export async function sendMessage(data: SendMessageData): Promise<MessageResponse> {
  try {
    let conversation: Conversation;
    let conversationHistory: Message[] = [];

    if (data.conversationId) {
      // Verify conversation exists and belongs to user
      const existingConversation = await prisma.conversation.findUnique({
        where: { id: data.conversationId },
        include: { messages: { orderBy: { timestamp: 'asc' } } },
      });

      if (!existingConversation) {
        throw new NotFoundError(
          'Conversation not found',
          ErrorCodes.CONVERSATION_NOT_FOUND
        );
      }

      if (existingConversation.userId !== data.userId) {
        throw new ForbiddenError(
          'You do not have access to this conversation',
          ErrorCodes.FORBIDDEN
        );
      }

      conversation = existingConversation;
      conversationHistory = existingConversation.messages;
    } else {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          userId: data.userId,
          title: generateConversationTitle(data.message),
        },
      });

      logger.info('New conversation created', {
        conversationId: conversation.id,
        userId: data.userId,
      });
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: data.message,
        format: 'text',
        status: 'sent',
      },
    });

    // Get AI response from mock agent
    const agentResponse = await agentClient.sendMessage(
      data.userId,
      data.message,
      conversationHistory
    );

    // Save assistant message
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: agentResponse.content,
        format: agentResponse.format,
        status: 'sent',
        metadata: agentResponse.metadata,
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    logger.info('Message sent and response received', {
      conversationId: conversation.id,
      userId: data.userId,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
    });

    return {
      conversationId: conversation.id,
      userMessage,
      assistantMessage,
    };
  } catch (error) {
    logger.error('Send message failed', { error, userId: data.userId });
    throw error;
  }
}

/**
 * Get user's conversation history with pagination
 */
export async function getConversationHistory(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  conversations: Conversation[];
  total: number;
}> {
  try {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.conversation.count({
        where: { userId },
      }),
    ]);

    logger.info('Conversation history retrieved', {
      userId,
      page,
      limit,
      total,
    });

    return { conversations, total };
  } catch (error) {
    logger.error('Failed to get conversation history', { error, userId });
    throw error;
  }
}

/**
 * Get a specific conversation with all messages
 */
export async function getConversation(
  userId: string,
  conversationId: string
): Promise<ConversationWithMessages> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundError(
        'Conversation not found',
        ErrorCodes.CONVERSATION_NOT_FOUND
      );
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenError(
        'You do not have access to this conversation',
        ErrorCodes.FORBIDDEN
      );
    }

    logger.info('Conversation retrieved', {
      conversationId,
      userId,
      messageCount: conversation.messages.length,
    });

    return conversation;
  } catch (error) {
    logger.error('Failed to get conversation', { error, userId, conversationId });
    throw error;
  }
}

/**
 * Create a new conversation
 */
export async function createConversation(
  userId: string,
  title?: string,
  firstMessage?: string
): Promise<ConversationWithMessages> {
  try {
    const conversationData: any = {
      userId,
      title: title || 'New Conversation',
    };

    // If first message is provided, create it along with the conversation
    if (firstMessage) {
      conversationData.messages = {
        create: [
          {
            role: 'user',
            content: firstMessage,
            format: 'text',
            status: 'sent',
          },
        ],
      };

      // Use first message as title if no title provided
      if (!title) {
        conversationData.title = generateConversationTitle(firstMessage);
      }
    }

    const conversation = await prisma.conversation.create({
      data: conversationData,
      include: {
        messages: true,
      },
    });

    logger.info('Conversation created', {
      conversationId: conversation.id,
      userId,
    });

    return conversation;
  } catch (error) {
    logger.error('Failed to create conversation', { error, userId });
    throw error;
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<void> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundError(
        'Conversation not found',
        ErrorCodes.CONVERSATION_NOT_FOUND
      );
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenError(
        'You do not have access to this conversation',
        ErrorCodes.FORBIDDEN
      );
    }

    // Delete conversation (messages will be cascade deleted)
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    logger.info('Conversation deleted', {
      conversationId,
      userId,
    });
  } catch (error) {
    logger.error('Failed to delete conversation', { error, userId, conversationId });
    throw error;
  }
}

/**
 * Delete a specific message
 */
export async function deleteMessage(
  userId: string,
  messageId: string
): Promise<void> {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) {
      throw new NotFoundError('Message not found', ErrorCodes.MESSAGE_NOT_FOUND);
    }

    if (message.conversation.userId !== userId) {
      throw new ForbiddenError(
        'You do not have access to this message',
        ErrorCodes.FORBIDDEN
      );
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    logger.info('Message deleted', {
      messageId,
      userId,
      conversationId: message.conversationId,
    });
  } catch (error) {
    logger.error('Failed to delete message', { error, userId, messageId });
    throw error;
  }
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  userId: string,
  conversationId: string,
  title: string
): Promise<Conversation> {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundError(
        'Conversation not found',
        ErrorCodes.CONVERSATION_NOT_FOUND
      );
    }

    if (conversation.userId !== userId) {
      throw new ForbiddenError(
        'You do not have access to this conversation',
        ErrorCodes.FORBIDDEN
      );
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });

    logger.info('Conversation title updated', {
      conversationId,
      userId,
      newTitle: title,
    });

    return updated;
  } catch (error) {
    logger.error('Failed to update conversation title', {
      error,
      userId,
      conversationId,
    });
    throw error;
  }
}
