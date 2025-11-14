import { Router } from 'express';
import * as chatController from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { chatRateLimiter } from '../middleware/rateLimiter';
import {
  sendMessageSchema,
  createConversationSchema,
  getHistorySchema,
  conversationIdSchema,
  messageIdSchema,
} from '../utils/validation';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/chat/message:
 *   post:
 *     summary: Send a message
 *     description: Send a message to a conversation and receive AI assistant response
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - content
 *             properties:
 *               conversationId:
 *                 type: string
 *                 format: uuid
 *                 example: 123e4567-e89b-12d3-a456-426614174000
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 4000
 *                 example: Can you help me improve my English grammar?
 *               format:
 *                 type: string
 *                 enum: [text, markdown]
 *                 default: text
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 userMessage:
 *                   $ref: '#/components/schemas/Message'
 *                 assistantMessage:
 *                   $ref: '#/components/schemas/Message'
 *                 conversation:
 *                   $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.post(
  '/message',
  chatRateLimiter,
  validateBody(sendMessageSchema),
  chatController.sendMessage
);

/**
 * @swagger
 * /api/chat/history:
 *   get:
 *     summary: Get conversation history
 *     description: Retrieve all conversations for the authenticated user with pagination
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of conversations per page
 *     responses:
 *       200:
 *         description: Conversation history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conversation'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/history',
  validateQuery(getHistorySchema),
  chatController.getHistory
);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}:
 *   get:
 *     summary: Get a specific conversation
 *     description: Retrieve a single conversation with all its messages
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner of this conversation
 *       404:
 *         description: Conversation not found
 */
router.get(
  '/conversations/:conversationId',
  validateParams(conversationIdSchema),
  chatController.getConversation
);

/**
 * @swagger
 * /api/chat/conversations:
 *   post:
 *     summary: Create a new conversation
 *     description: Create a new chat conversation with optional title
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: English Grammar Practice
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Conversation'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/conversations',
  validateBody(createConversationSchema),
  chatController.createConversation
);

/**
 * @swagger
 * /api/chat/conversations/{conversationId}:
 *   delete:
 *     summary: Delete a conversation
 *     description: Delete a conversation and all its messages
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Conversation ID to delete
 *     responses:
 *       204:
 *         description: Conversation deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner of this conversation
 *       404:
 *         description: Conversation not found
 */
router.delete(
  '/conversations/:conversationId',
  validateParams(conversationIdSchema),
  chatController.deleteConversation
);

/**
 * @swagger
 * /api/chat/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     description: Soft delete a message (marks as deleted, doesn't remove from database)
 *     tags: [Chat]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Message ID to delete
 *     responses:
 *       204:
 *         description: Message deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner of this message
 *       404:
 *         description: Message not found
 */
router.delete(
  '/messages/:messageId',
  validateParams(messageIdSchema),
  chatController.deleteMessage
);

export default router;
