import prisma from '../lib/prisma';
import { User } from '@prisma/client';
import { logger } from '../utils/logger';

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findByEmailOrGoogleId(email: string, googleId: string): Promise<User | null> {
    logger.debug('UserRepository.findByEmailOrGoogleId called with:', { email, googleId });
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
          name: true,
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
      logger.debug('UserRepository.findByEmailOrGoogleId result:', user ? `User found: ${user.email}` : 'User not found');
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.findByEmailOrGoogleId:', error);
      throw error;
    }
  },

  async create(data: {
    name?: string;
    email: string;
    password: string;
    googleId?: string;
  }): Promise<User> {
    logger.debug('Creating user with data:', { email: data.email, name: data.name, googleId: data.googleId });
    try {
      const user = await prisma.user.create({
        data,
      });
      logger.debug('Successfully created user with ID:', user.id);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  },

  async findById(id: string): Promise<User | null> {
    logger.debug('UserRepository.findById called with ID:', id);
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
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
      logger.debug('UserRepository.findById result:', user ? `User found: ${user.email}` : 'User not found');
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.findById:', error);
      throw error;
    }
  },

  async findByIdOrGoogleId(id: string): Promise<User | null> {
    logger.debug('UserRepository.findByIdOrGoogleId called with ID:', id);
    try {
      // First try to find by DB ID
      let user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
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
        logger.debug('User not found by DB ID, trying Google ID');
        user = await prisma.user.findUnique({
          where: { googleId: id },
          select: {
            id: true,
            name: true,
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

      logger.debug('UserRepository.findByIdOrGoogleId result:', user ? `User found: ${user.email}` : 'User not found');
      return user;
    } catch (error) {
      logger.error('Error in UserRepository.findByIdOrGoogleId:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  },
}; 