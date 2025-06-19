import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';

export const authService = {
  async register(data: {
    name?: string;
    email: string;
    password: string;
  }) {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
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

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.password) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      },
      token,
    };
  },

  async oauthLogin(oauthData: {
    email: string;
    name?: string;
    image?: string;
    provider: string;
    providerId: string;
  }) {
    logger.debug('OAuth login attempt:', oauthData);
    
    // First try to find user by email
    let user = await userRepository.findByEmail(oauthData.email);
    
    if (!user) {
      logger.debug('Creating new user for OAuth login');
      // Create new user if not found
      user = await userRepository.create({
        email: oauthData.email,
        name: oauthData.name || '',
        password: '', // No password for OAuth users
      });
      logger.debug('Created new user with ID:', user.id);
    } else {
      logger.debug('Found existing user with ID:', user.id);
    }
    
    // Generate custom JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image
      },
      token,
    };
  },

  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  },

  async syncNextAuthUser(nextAuthUser: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  }) {
    logger.debug('=== Starting NextAuth user sync ===');
    logger.debug('NextAuth user data:', {
      id: nextAuthUser.id,
      email: nextAuthUser.email,
      name: nextAuthUser.name,
      image: nextAuthUser.image
    });
    
    // Try to find user by email or Google ID
    logger.debug('Looking up user by email or Google ID:', { email: nextAuthUser.email, googleId: nextAuthUser.id });
    let user = await userRepository.findByEmailOrGoogleId(nextAuthUser.email, nextAuthUser.id);
    
    if (!user) {
      logger.debug('User not found, creating new user');
      // Create new user if not found
      try {
        user = await userRepository.create({
          email: nextAuthUser.email,
          name: nextAuthUser.name || '',
          password: '', // No password for OAuth users
          googleId: nextAuthUser.id, // Store the Google ID
        });
        logger.debug('Successfully created new user with ID:', user.id);
      } catch (createError) {
        logger.error('Error creating user:', createError);
        throw createError;
      }
    } else {
      logger.debug('Found existing user with ID:', user.id);
      logger.debug('Existing user data:', {
        id: user.id,
        email: user.email,
        name: user.name,
        googleId: user.googleId
      });
      
      // Update user info if needed (e.g., name or image changed)
      if (user.name !== nextAuthUser.name || user.image !== nextAuthUser.image || user.googleId !== nextAuthUser.id) {
        logger.debug('Updating user info');
        try {
          user = await userRepository.update(user.id, {
            name: nextAuthUser.name || user.name,
            image: nextAuthUser.image || user.image,
            googleId: nextAuthUser.id, // Ensure Google ID is set
          });
          logger.debug('Successfully updated user info');
        } catch (updateError) {
          logger.error('Error updating user info:', updateError);
          // Don't throw here, continue with existing user data
        }
      }
    }
    
    logger.debug('=== NextAuth user sync completed ===');
    return user;
  },
}; 