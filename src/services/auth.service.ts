import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { authLogger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';
import { tokenService } from './token.service';

export const authService = {
  async register(data: {
    firstName?: string;
    lastName?: string;
    email: string;
    password: string;
  }) {
    authLogger.info('User registration attempt', { email: data.email, hasFirstName: !!data.firstName, hasLastName: !!data.lastName });
    
    try {
      const existingUser = await userRepository.findByEmail(data.email);

      if (existingUser) {
        authLogger.warn('Registration failed - user already exists', { email: data.email });
        throw new AppError(400, 'User already exists');
      }

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await userRepository.create({
        ...data,
        password: hashedPassword,
      });

      if (!user.email) {
        throw new AppError(400, 'User email is required for authentication');
      }

      const tokens = tokenService.generateTokenPair({
        id: user.id,
        email: user.email
      });

      authLogger.info('User registered successfully', { userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        ...tokens
      };
    } catch (error) {
      authLogger.error('Registration failed', { 
        email: data.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async login(email: string, password: string) {
    authLogger.info('User login attempt', { email });
    
    try {
      const user = await userRepository.findByEmail(email);

      if (!user || !user.password) {
        authLogger.warn('Login failed - invalid credentials', { email });
        throw new AppError(401, 'Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        authLogger.warn('Login failed - invalid password', { email, userId: user.id });
        throw new AppError(401, 'Invalid credentials');
      }

      if (!user.email) {
        throw new AppError(400, 'User email is required for authentication');
      }

      const tokens = tokenService.generateTokenPair({
        id: user.id,
        email: user.email
      });

      authLogger.info('User logged in successfully', { userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image
        },
        ...tokens
      };
    } catch (error) {
      authLogger.error('Login failed', { 
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async oauthLogin(oauthData: {
    email: string;
    firstName?: string;
    lastName?: string;
    image?: string;
    provider: string;
    providerId: string;
  }) {
    authLogger.info('OAuth login attempt', { email: oauthData.email, provider: oauthData.provider });
    
    try {
      // First try to find user by email
      let user = await userRepository.findByEmail(oauthData.email);
      
      if (!user) {
        authLogger.info('Creating new user for OAuth login', { email: oauthData.email, provider: oauthData.provider });
        // Create new user if not found
        user = await userRepository.create({
          email: oauthData.email,
          firstName: oauthData.firstName || '',
          lastName: oauthData.lastName || '',
          password: '', // No password for OAuth users
        });
        authLogger.info('Created new user for OAuth', { userId: user.id, email: oauthData.email });
      } else {
        authLogger.info('Found existing user for OAuth login', { userId: user.id, email: oauthData.email });
      }
      
      if (!user.email) {
        throw new AppError(400, 'User email is required for authentication');
      }

      const tokens = tokenService.generateTokenPair({
        id: user.id,
        email: user.email
      });

      authLogger.info('OAuth login successful', { userId: user.id, email: user.email, provider: oauthData.provider });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image
        },
        ...tokens
      };
    } catch (error) {
      authLogger.error('OAuth login failed', { 
        email: oauthData.email,
        provider: oauthData.provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async refreshToken(refreshToken: string) {
    authLogger.info('Token refresh attempt');
    
    try {
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      
      const user = await userRepository.findById(decoded.id);
      
      if (!user) {
        authLogger.warn('Refresh failed - user not found', { userId: decoded.id });
        throw new AppError(401, 'Invalid refresh token');
      }

      if (!user.email) {
        throw new AppError(400, 'User email is required for authentication');
      }

      const tokens = tokenService.generateTokenPair({
        id: user.id,
        email: user.email
      });

      authLogger.info('Token refresh successful', { userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image
        },
        ...tokens
      };
    } catch (error) {
      authLogger.error('Token refresh failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getCurrentUser(userId: string) {
    authLogger.debug('Fetching current user', { userId });
    
    try {
      const user = await userRepository.findById(userId);

      if (!user) {
        authLogger.warn('User not found for getCurrentUser', { userId });
        throw new AppError(404, 'User not found');
      }

      authLogger.debug('Current user fetched successfully', { userId });
      return user;
    } catch (error) {
      authLogger.error('Failed to fetch current user', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async syncNextAuthUser(nextAuthUser: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    image?: string;
  }) {
    authLogger.info('Starting NextAuth user sync', {
      googleId: nextAuthUser.id,
      email: nextAuthUser.email,
      firstName: nextAuthUser.firstName,
      lastName: nextAuthUser.lastName,
      hasImage: !!nextAuthUser.image
    });
    
    try {
      // Try to find user by email or Google ID
      authLogger.debug('Looking up user by email or Google ID', { email: nextAuthUser.email, googleId: nextAuthUser.id });
      let user = await userRepository.findByEmailOrGoogleId(nextAuthUser.email, nextAuthUser.id);
      
      if (!user) {
        authLogger.info('User not found, creating new user', { email: nextAuthUser.email, googleId: nextAuthUser.id });
        // Create new user if not found
        try {
          user = await userRepository.create({
            email: nextAuthUser.email,
            firstName: nextAuthUser.firstName || '',
            lastName: nextAuthUser.lastName || '',
            password: '', // No password for OAuth users
            googleId: nextAuthUser.id, // Store the Google ID
          });
          authLogger.info('Successfully created new user', { userId: user.id, email: nextAuthUser.email });
        } catch (createError) {
          authLogger.error('Error creating user during sync', { 
            email: nextAuthUser.email,
            googleId: nextAuthUser.id,
            error: createError instanceof Error ? createError.message : 'Unknown error'
          });
          throw createError;
        }
      } else {
        authLogger.debug('Found existing user', {
          userId: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          googleId: user.googleId
        });
        
        // Update user info if needed (e.g., firstName, lastName or image changed)
        if (user.firstName !== nextAuthUser.firstName || user.lastName !== nextAuthUser.lastName || user.image !== nextAuthUser.image || user.googleId !== nextAuthUser.id) {
          authLogger.debug('Updating user info during sync', { userId: user.id });
          try {
            user = await userRepository.update(user.id, {
              firstName: nextAuthUser.firstName || user.firstName,
              lastName: nextAuthUser.lastName || user.lastName,
              image: nextAuthUser.image || user.image,
              googleId: nextAuthUser.id, // Ensure Google ID is set
            });
            authLogger.debug('Successfully updated user info', { userId: user.id });
          } catch (updateError) {
            authLogger.error('Error updating user info during sync', { 
              userId: user.id,
              error: updateError instanceof Error ? updateError.message : 'Unknown error'
            });
            // Don't throw here, continue with existing user data
          }
        }
      }
      
      authLogger.info('NextAuth user sync completed successfully', { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      authLogger.error('NextAuth user sync failed', { 
        email: nextAuthUser.email,
        googleId: nextAuthUser.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },
}; 