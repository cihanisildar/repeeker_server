import prisma from '../lib/prisma';
import { WordList } from '@prisma/client';
import { createModuleLogger } from '../utils/logger';

const wordListRepositoryLogger = createModuleLogger('WordListRepository');

export const wordListRepository = {
  async create(data: {
    name: string;
    description?: string;
    isPublic: boolean;
    userId: string;
  }): Promise<WordList> {
    wordListRepositoryLogger.debug('Creating word list', { 
      name: data.name, 
      userId: data.userId, 
      isPublic: data.isPublic,
      hasDescription: !!data.description
    });
    
    try {
      const wordList = await prisma.wordList.create({
        data,
      });
      
      wordListRepositoryLogger.info('Successfully created word list', { 
        wordListId: wordList.id, 
        name: wordList.name, 
        userId: wordList.userId,
        isPublic: wordList.isPublic
      });
      
      return wordList;
    } catch (error) {
      wordListRepositoryLogger.error('Failed to create word list', { 
        name: data.name,
        userId: data.userId,
        isPublic: data.isPublic,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findMany(userId: string): Promise<WordList[]> {
    wordListRepositoryLogger.debug('Finding word lists for user', { userId });
    
    try {
      const wordLists = await prisma.wordList.findMany({
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
      
      const userOwnedCount = wordLists.filter(wl => wl.userId === userId).length;
      const publicCount = wordLists.filter(wl => wl.isPublic && wl.userId !== userId).length;
      
      wordListRepositoryLogger.debug('Successfully found word lists', { 
        userId, 
        totalCount: wordLists.length,
        userOwnedCount,
        publicCount
      });
      
      return wordLists;
    } catch (error) {
      wordListRepositoryLogger.error('Failed to find word lists', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async findById(id: string, userId: string): Promise<WordList | null> {
    wordListRepositoryLogger.debug('Finding word list by ID', { wordListId: id, userId });
    
    try {
      const wordList = await prisma.wordList.findFirst({
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
      
      wordListRepositoryLogger.debug('Word list lookup result', { 
        wordListId: id, 
        userId,
        found: !!wordList,
        name: wordList?.name,
        cardsCount: wordList?.cards.length || 0,
        isPublic: wordList?.isPublic,
        isOwner: wordList?.userId === userId
      });
      
      return wordList;
    } catch (error) {
      wordListRepositoryLogger.error('Failed to find word list by ID', { 
        wordListId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async update(id: string, userId: string, data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }): Promise<WordList | null> {
    wordListRepositoryLogger.debug('Updating word list', { 
      wordListId: id, 
      userId,
      name: data.name,
      isPublic: data.isPublic,
      hasDescription: !!data.description
    });
    
    try {
      const wordList = await prisma.wordList.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!wordList) {
        wordListRepositoryLogger.warn('Word list not found for update', { wordListId: id, userId });
        return null;
      }

      const updatedWordList = await prisma.wordList.update({
        where: { id },
        data,
      });
      
      wordListRepositoryLogger.info('Successfully updated word list', { 
        wordListId: id, 
        userId,
        name: updatedWordList.name,
        isPublic: updatedWordList.isPublic
      });
      
      return updatedWordList;
    } catch (error) {
      wordListRepositoryLogger.error('Failed to update word list', { 
        wordListId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async delete(id: string, userId: string): Promise<boolean> {
    wordListRepositoryLogger.debug('Deleting word list', { wordListId: id, userId });
    
    try {
      const wordList = await prisma.wordList.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!wordList) {
        wordListRepositoryLogger.warn('Word list not found for deletion', { wordListId: id, userId });
        return false;
      }

      await prisma.wordList.delete({
        where: { id },
      });
      
      wordListRepositoryLogger.info('Successfully deleted word list', { 
        wordListId: id, 
        userId,
        name: wordList.name
      });

      return true;
    } catch (error) {
      wordListRepositoryLogger.error('Failed to delete word list', { 
        wordListId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },
}; 