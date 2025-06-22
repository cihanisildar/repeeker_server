import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { authLogger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';

export const authService = {
  async register(data: {
    name?: string;
    email: string;
    password: string;
  }) {
    authLogger.info('User registration attempt', { email: data.email, hasName: !!data.name });
    
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

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
      );

      authLogger.info('User registered successfully', { userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
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

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
      );

      authLogger.info('User logged in successfully', { userId: user.id, email: user.email });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        },
        token,
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
    name?: string;
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
          name: oauthData.name || '',
          password: '', // No password for OAuth users
        });
        authLogger.info('Created new user for OAuth', { userId: user.id, email: oauthData.email });
      } else {
        authLogger.info('Found existing user for OAuth login', { userId: user.id, email: oauthData.email });
      }
      
      // Generate custom JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
      );

      authLogger.info('OAuth login successful', { userId: user.id, email: user.email, provider: oauthData.provider });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        },
        token,
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
    name?: string;
    image?: string;
  }) {
    authLogger.info('Starting NextAuth user sync', {
      googleId: nextAuthUser.id,
      email: nextAuthUser.email,
      name: nextAuthUser.name,
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
            name: nextAuthUser.name || '',
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
          name: user.name,
          googleId: user.googleId
        });
        
        // Update user info if needed (e.g., name or image changed)
        if (user.name !== nextAuthUser.name || user.image !== nextAuthUser.image || user.googleId !== nextAuthUser.id) {
          authLogger.debug('Updating user info during sync', { userId: user.id });
          try {
            user = await userRepository.update(user.id, {
              name: nextAuthUser.name || user.name,
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