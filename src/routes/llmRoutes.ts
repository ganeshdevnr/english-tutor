import { Router } from 'express';
import * as llmController from '../controllers/llmController';
import { validateParams } from '../middleware/validate';
import Joi from 'joi';

const router = Router();

/**
 * Validation schema for user ID parameter
 */
const userIdSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid user ID format',
    'any.required': 'User ID is required',
  }),
});

/**
 * @swagger
 * /api/llm/users/{userId}:
 *   get:
 *     summary: Get user information by ID
 *     description: Fetch user details for LLM service (no authentication required)
 *     tags: [LLM]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     role:
 *                       type: string
 *                     emailVerified:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: User not found
 */
router.get('/users/:userId', validateParams(userIdSchema), llmController.getUserById);

export default router;
