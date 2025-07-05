import prisma from '../lib/prisma';
import { User } from '@prisma/client';
import { createModuleLogger } from '../utils/logger';

const userRepositoryLogger = createModuleLogger('UserRepository');

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    userRepositoryLogger.debug('Finding user by email', { email });
    
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      userRepositoryLogger.debug('User email lookup result', { 
        email, 
        found: !!user,
        userId: user?.id 
      });
      
      return user;
    } catch (error) {
      userRepositoryLogger.error('Failed to find user by email', { 
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findByEmailOrGoogleId(email: string, googleId: string): Promise<User | null> {
    userRepositoryLogger.debug('Finding user by email or Google ID', { email, googleId });
    
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { googleId }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          emailVerified: true,
          image: true,
          password: true,
          googleId: true,
          lastTestDate: true,
          lastReviewDate: true,
          currentStreak: true,
          longestStreak: true,
          streakUpdatedAt: true
        },
      });
      
      userRepositoryLogger.debug('Email/Google ID lookup result', { 
        email, 
        googleId,
        found: !!user,
        userId: user?.id 
      });
      
      return user;
    } catch (error) {
      userRepositoryLogger.error('Failed to find user by email or Google ID', { 
        email,
        googleId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async create(data: {
    firstName?: string;
    lastName?: string;
    email: string;
    password: string;
    googleId?: string;
  }): Promise<User> {
    userRepositoryLogger.debug('Creating user', { 
      email: data.email, 
      firstName: data.firstName, 
      lastName: data.lastName,
      googleId: data.googleId,
      hasPassword: !!data.password
    });
    
    try {
      const user = await prisma.user.create({
        data,
      });
      
      userRepositoryLogger.info('Successfully created user', { 
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });
      
      return user;
    } catch (error) {
      userRepositoryLogger.error('Failed to create user', { 
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        googleId: data.googleId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findById(id: string): Promise<User | null> {
    userRepositoryLogger.debug('Finding user by ID', { userId: id });
    
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          emailVerified: true,
          image: true,
          password: true,
          googleId: true,
          lastTestDate: true,
          lastReviewDate: true,
          currentStreak: true,
          longestStreak: true,
          streakUpdatedAt: true
        },
      });
      
      userRepositoryLogger.debug('User ID lookup result', { 
        userId: id,
        found: !!user,
        email: user?.email 
      });
      
      return user;
    } catch (error) {
      userRepositoryLogger.error('Failed to find user by ID', { 
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findByIdOrGoogleId(id: string): Promise<User | null> {
    userRepositoryLogger.debug('Finding user by ID or Google ID', { id });
    
    try {
      // First try to find by DB ID
      let user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          emailVerified: true,
          image: true,
          password: true,
          googleId: true,
          lastTestDate: true,
          lastReviewDate: true,
          currentStreak: true,
          longestStreak: true,
          streakUpdatedAt: true
        },
      });

      // If not found by DB ID, try by Google ID
      if (!user) {
        userRepositoryLogger.debug('User not found by DB ID, trying Google ID', { id });
        user = await prisma.user.findUnique({
          where: { googleId: id },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            emailVerified: true,
            image: true,
            password: true,
            googleId: true,
            lastTestDate: true,
            lastReviewDate: true,
            currentStreak: true,
            longestStreak: true,
            streakUpdatedAt: true
          },
        });
      }

      userRepositoryLogger.debug('ID/Google ID lookup result', { 
        searchId: id,
        found: !!user,
        userId: user?.id,
        email: user?.email,
        foundBy: user ? (user.id === id ? 'DB_ID' : 'GOOGLE_ID') : 'NOT_FOUND'
      });
      
      return user;
    } catch (error) {
      userRepositoryLogger.error('Failed to find user by ID or Google ID', { 
        id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    userRepositoryLogger.debug('Updating user', { 
      userId: id,
      fields: Object.keys(data),
      hasPassword: !!data.password
    });
    
    try {
      const user = await prisma.user.update({
        where: { id },
        data,
      });
      
      userRepositoryLogger.info('Successfully updated user', { 
        userId: id,
        email: user.email,
        updatedFields: Object.keys(data)
      });
      
      return user;
    } catch (error) {
      userRepositoryLogger.error('Failed to update user', { 
        userId: id,
        fields: Object.keys(data),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async delete(id: string): Promise<User> {
    userRepositoryLogger.debug('Deleting user', { userId: id });
    
    try {
      const user = await prisma.user.delete({
        where: { id },
      });
      
      userRepositoryLogger.warn('Successfully deleted user', { 
        userId: id,
        email: user.email
      });
      
      return user;
    } catch (error) {
      userRepositoryLogger.error('Failed to delete user', { 
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },
}; 