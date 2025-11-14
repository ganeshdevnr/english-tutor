import { validate, isValidUUID, isValidEmail, sanitizeString } from '../../utils/validation';
import { registerSchema, loginSchema, sendMessageSchema } from '../../utils/validation';
import { ValidationError } from '../../utils/errors';

describe('Validation Utils', () => {
  describe('validate', () => {
    it('should validate valid registration data', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const result = validate(registerSchema, data);

      expect(result).toEqual(data);
    });

    it('should throw ValidationError for invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User',
      };

      expect(() => validate(registerSchema, data)).toThrow(ValidationError);
    });

    it('should throw ValidationError for weak password', () => {
      const data = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      };

      expect(() => validate(registerSchema, data)).toThrow(ValidationError);
    });

    it('should validate login data', () => {
      const data = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      const result = validate(loginSchema, data);

      expect(result).toEqual(data);
    });

    it('should validate send message data', () => {
      const data = {
        message: 'Hello, this is a test message',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = validate(sendMessageSchema, data);

      expect(result).toEqual(data);
    });

    it('should strip unknown fields', () => {
      const data = {
        email: 'test@example.com',
        password: 'anypassword',
        unknownField: 'should be removed',
      };

      const result = validate(loginSchema, data);

      expect(result).not.toHaveProperty('unknownField');
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should return false for invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123-456-789')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
    });

    it('should return false for invalid email', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@invalid.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should remove angle brackets', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeString(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should trim whitespace', () => {
      const input = '  test  ';
      const result = sanitizeString(input);
      expect(result).toBe('test');
    });

    it('should handle normal text', () => {
      const input = 'Hello, world!';
      const result = sanitizeString(input);
      expect(result).toBe(input);
    });
  });
});
