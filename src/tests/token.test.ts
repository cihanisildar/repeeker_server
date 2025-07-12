process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_SECRET = 'test-legacy-secret';

import { tokenService } from '../services/token.service';

describe('Token Service', () => {
  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = tokenService.generateAccessToken(testUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate token with correct payload', () => {
      const token = tokenService.generateAccessToken(testUser);
      const decoded = tokenService.verifyAccessToken(token);
      
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.type).toBe('access');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = tokenService.generateRefreshToken(testUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate token with correct payload', () => {
      const token = tokenService.generateRefreshToken(testUser);
      const decoded = tokenService.verifyRefreshToken(token);
      
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.type).toBe('refresh');
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = tokenService.generateTokenPair(testUser);
      
      expect(tokens.rp_accessToken).toBeDefined();
      expect(tokens.rp_refreshToken).toBeDefined();
      expect(typeof tokens.rp_accessToken).toBe('string');
      expect(typeof tokens.rp_refreshToken).toBe('string');
    });

    it('should generate valid tokens that can be verified', () => {
      const tokens = tokenService.generateTokenPair(testUser);
      
      const accessDecoded = tokenService.verifyAccessToken(tokens.rp_accessToken);
      const refreshDecoded = tokenService.verifyRefreshToken(tokens.rp_refreshToken);
      
      expect(accessDecoded.id).toBe(testUser.id);
      expect(accessDecoded.email).toBe(testUser.email);
      expect(accessDecoded.type).toBe('access');
      
      expect(refreshDecoded.id).toBe(testUser.id);
      expect(refreshDecoded.email).toBe(testUser.email);
      expect(refreshDecoded.type).toBe('refresh');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = tokenService.generateAccessToken(testUser);
      const decoded = tokenService.verifyAccessToken(token);
      
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.type).toBe('access');
    });

    it('should reject refresh token when verifying access token', () => {
      const refreshToken = tokenService.generateRefreshToken(testUser);
      
      expect(() => {
        tokenService.verifyAccessToken(refreshToken);
      }).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = tokenService.generateRefreshToken(testUser);
      const decoded = tokenService.verifyRefreshToken(token);
      
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.type).toBe('refresh');
    });

    it('should reject access token when verifying refresh token', () => {
      const accessToken = tokenService.generateAccessToken(testUser);
      
      expect(() => {
        tokenService.verifyRefreshToken(accessToken);
      }).toThrow();
    });
  });
}); 