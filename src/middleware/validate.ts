import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

/**
 * Request validation middleware factory
 * Validates request body, query params, or route params against Joi schema
 */
export function validateRequest(schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = req[source];

      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errorMessage = error.details
          .map((detail) => detail.message)
          .join(', ');

        throw new ValidationError(errorMessage);
      }

      // Replace request data with validated and sanitized value
      req[source] = value;

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Validate request body
 */
export function validateBody(schema: Joi.ObjectSchema) {
  return validateRequest(schema, 'body');
}

/**
 * Validate query parameters
 */
export function validateQuery(schema: Joi.ObjectSchema) {
  return validateRequest(schema, 'query');
}

/**
 * Validate route parameters
 */
export function validateParams(schema: Joi.ObjectSchema) {
  return validateRequest(schema, 'params');
}
