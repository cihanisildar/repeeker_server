import jwt from 'jsonwebtoken';
import { createModuleLogger } from '../utils/logger';

const tokenLogger = createModuleLogger('TOKEN_SERVICE');

export interface TokenPayload {
  id: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  rp_accessToken: string;
  rp_refreshToken: string;
}

export const tokenService = {
  generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
    const tokenPayload: TokenPayload = {
      ...payload,
      type: 'access'
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET as string,
      { 
        expiresIn: '15m', // Short-lived access token
        issuer: 'repeeker-server',
        audience: 'repeeker-client'
      }
    );

    tokenLogger.debug('Generated access token', { userId: payload.id, email: payload.email });
    return token;
  },

  generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
    const tokenPayload: TokenPayload = {
      ...payload,
      type: 'refresh'
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET as string,
      { 
        expiresIn: '7d', // Longer-lived refresh token
        issuer: 'repeeker-server',
        audience: 'repeeker-client'
      }
    );

    tokenLogger.debug('Generated refresh token', { userId: payload.id, email: payload.email });
    return token;
  },

  generateTokenPair(payload: Omit<TokenPayload, 'type'>): TokenPair {
    return {
      rp_accessToken: this.generateAccessToken(payload),
      rp_refreshToken: this.generateRefreshToken(payload)
    };
  },

  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET as string,
        {
          issuer: 'repeeker-server',
          audience: 'repeeker-client'
        }
      ) as TokenPayload;

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      tokenLogger.debug('Access token verified successfully', { userId: decoded.id });
      return decoded;
    } catch (error) {
      tokenLogger.warn('Access token verification failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  },

  verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET as string,
        {
          issuer: 'repeeker-server',
          audience: 'repeeker-client'
        }
      ) as TokenPayload;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      tokenLogger.debug('Refresh token verified successfully', { userId: decoded.id });
      return decoded;
    } catch (error) {
      tokenLogger.warn('Refresh token verification failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  },

  // Legacy method for backward compatibility
  verifyLegacyToken(token: string): { id: string; email: string } {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as { id: string; email: string };

      tokenLogger.debug('Legacy token verified successfully', { userId: decoded.id });
      return decoded;
    } catch (error) {
      tokenLogger.warn('Legacy token verification failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }
}; 