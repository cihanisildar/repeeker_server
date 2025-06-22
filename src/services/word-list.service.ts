import { wordListRepository } from '../repositories/word-list.repository';
import { createModuleLogger } from '../utils/logger';

const wordListLogger = createModuleLogger('WORDLIST');

export const wordListService = {
  async createWordList(data: {
    name: string;
    description?: string;
    isPublic: boolean;
    userId: string;
  }) {
    wordListLogger.info('Creating new word list', { 
      userId: data.userId, 
      name: data.name, 
      isPublic: data.isPublic,
      hasDescription: !!data.description
    });
    
    try {
      const wordList = await wordListRepository.create(data);
      wordListLogger.info('Word list created successfully', { wordListId: wordList.id, userId: data.userId });
      return wordList;
    } catch (error) {
      wordListLogger.error('Failed to create word list', { 
        userId: data.userId,
        name: data.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getWordLists(userId: string) {
    wordListLogger.debug('Fetching word lists', { userId });
    
    try {
      const wordLists = await wordListRepository.findMany(userId);
      wordListLogger.debug('Word lists fetched successfully', { userId, count: wordLists.length });
      return wordLists;
    } catch (error) {
      wordListLogger.error('Failed to fetch word lists', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getWordList(id: string, userId: string) {
    wordListLogger.debug('Fetching word list by ID', { wordListId: id, userId });
    
    try {
      const wordList = await wordListRepository.findById(id, userId);

      if (!wordList) {
        wordListLogger.warn('Word list not found', { wordListId: id, userId });
        throw new Error('Word list not found');
      }

      wordListLogger.debug('Word list found', { wordListId: id, userId });
      return wordList;
    } catch (error) {
      wordListLogger.error('Failed to fetch word list', { 
        wordListId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async updateWordList(id: string, userId: string, data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }) {
    wordListLogger.info('Updating word list', { wordListId: id, userId, updateFields: Object.keys(data) });
    
    try {
      const updatedWordList = await wordListRepository.update(id, userId, data);

      if (!updatedWordList) {
        wordListLogger.warn('Word list not found for update', { wordListId: id, userId });
        throw new Error('Word list not found');
      }

      wordListLogger.info('Word list updated successfully', { wordListId: id, userId });
      return updatedWordList;
    } catch (error) {
      wordListLogger.error('Failed to update word list', { 
        wordListId: id,
        userId,
        updateFields: Object.keys(data),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async deleteWordList(id: string, userId: string) {
    wordListLogger.info('Deleting word list', { wordListId: id, userId });
    
    try {
      const wordList = await wordListRepository.delete(id, userId);
      if (!wordList) {
        wordListLogger.warn('Word list not found for deletion', { wordListId: id, userId });
        throw new Error('Word list not found');
      }
      
      wordListLogger.info('Word list deleted successfully', { wordListId: id, userId });
      return wordList;
    } catch (error) {
      wordListLogger.error('Failed to delete word list', { 
        wordListId: id,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },
}; 