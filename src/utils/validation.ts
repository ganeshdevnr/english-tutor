import Joi from 'joi';
import { ValidationError } from './errors';

/**
 * Validation schemas for request payloads
 */

// Authentication schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name must not exceed 100 characters',
    'any.required': 'Name is required',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

// Chat schemas
export const sendMessageSchema = Joi.object({
  message: Joi.string().min(1).max(10000).required().messages({
    'string.min': 'Message cannot be empty',
    'string.max': 'Message must not exceed 10000 characters',
    'any.required': 'Message is required',
  }),
  conversationId: Joi.string().uuid().optional().messages({
    'string.guid': 'Invalid conversation ID format',
  }),
});

export const createConversationSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().messages({
    'string.min': 'Title cannot be empty',
    'string.max': 'Title must not exceed 200 characters',
  }),
  firstMessage: Joi.string().min(1).max(10000).optional().messages({
    'string.min': 'First message cannot be empty',
    'string.max': 'First message must not exceed 10000 characters',
  }),
});

export const getHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
  }),
});

export const conversationIdSchema = Joi.object({
  conversationId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid conversation ID format',
    'any.required': 'Conversation ID is required',
  }),
});

export const messageIdSchema = Joi.object({
  messageId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid message ID format',
    'any.required': 'Message ID is required',
  }),
});

/**
 * Generic validation function
 */
export function validate<T>(schema: Joi.ObjectSchema, data: unknown): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    throw new ValidationError(errorMessage);
  }

  return value as T;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
