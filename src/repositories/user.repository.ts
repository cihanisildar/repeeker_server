import prisma from '../lib/prisma';
import { User } from '@prisma/client';

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async create(data: {
    name?: string;
    email: string;
    password: string;
  }): Promise<User> {
    return prisma.user.create({
      data,
    });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        password: true,
        lastTestDate: true,
        lastReviewDate: true,
        currentStreak: true,
        longestStreak: true,
        streakUpdatedAt: true
      },
    });
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