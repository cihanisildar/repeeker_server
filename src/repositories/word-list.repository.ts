import prisma from '../lib/prisma';
import { WordList } from '@prisma/client';

export const wordListRepository = {
  async create(data: {
    name: string;
    description?: string;
    isPublic: boolean;
    userId: string;
  }): Promise<WordList> {
    return prisma.wordList.create({
      data,
    });
  },

  async findMany(userId: string): Promise<WordList[]> {
    return prisma.wordList.findMany({
      where: {
        OR: [
          { userId },
          { isPublic: true },
        ],
      },
      include: {
        _count: {
          select: { cards: true },
        },
      },
    });
  },

  async findById(id: string, userId: string): Promise<WordList | null> {
    return prisma.wordList.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { isPublic: true },
        ],
      },
      include: {
        cards: true,
      },
    });
  },

  async update(id: string, userId: string, data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<WordList | null> {
    const wordList = await prisma.wordList.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!wordList) {
      return null;
    }

    return prisma.wordList.update({
      where: { id },
      data,
    });
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const wordList = await prisma.wordList.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!wordList) {
      return false;
    }

    await prisma.wordList.delete({
      where: { id },
    });

    return true;
  },
}; 