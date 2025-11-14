import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  TokenPayload,
  getTokenExpiry,
} from '../../utils/jwt';
import { UnauthorizedError } from '../../utils/errors';

describe('JWT Utils', () => {
  const mockPayload: TokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'user',
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
      expect(decoded.iat).toBeTruthy();
      expect(decoded.exp).toBeTruthy();
    });

    it('should throw UnauthorizedError for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyAccessToken(invalidToken)).toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for malformed token', () => {
      expect(() => verifyAccessToken('not-a-token')).toThrow(UnauthorizedError);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw UnauthorizedError for invalid refresh token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => verifyRefreshToken(invalidToken)).toThrow(UnauthorizedError);
    });
  });

  describe('getTokenExpiry', () => {
    it('should calculate expiry for seconds', () => {
      const before = new Date();
      const expiry = getTokenExpiry('30s');
      const after = new Date();

      const expectedMin = new Date(before.getTime() + 30 * 1000);
      const expectedMax = new Date(after.getTime() + 30 * 1000);

      expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(expiry.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });

    it('should calculate expiry for minutes', () => {
      const before = new Date();
      const expiry = getTokenExpiry('15m');
      const after = new Date();

      const expectedMin = new Date(before.getTime() + 15 * 60 * 1000);
      const expectedMax = new Date(after.getTime() + 15 * 60 * 1000);

      expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(expiry.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });

    it('should calculate expiry for hours', () => {
      const before = new Date();
      const expiry = getTokenExpiry('2h');
      const after = new Date();

      const expectedMin = new Date(before.getTime() + 2 * 60 * 60 * 1000);
      const expectedMax = new Date(after.getTime() + 2 * 60 * 60 * 1000);

      expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(expiry.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });

    it('should calculate expiry for days', () => {
      const before = new Date();
      const expiry = getTokenExpiry('7d');
      const after = new Date();

      const expectedMin = new Date(before.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expectedMax = new Date(after.getTime() + 7 * 24 * 60 * 60 * 1000);

      expect(expiry.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(expiry.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });
  });
});
