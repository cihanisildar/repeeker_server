import { wordListRepository } from '../repositories/word-list.repository';
import { logger } from '../utils/logger';

export const wordListService = {
  async createWordList(data: {
    name: string;
    description?: string;
    isPublic: boolean;
    userId: string;
  }) {
    return wordListRepository.create(data);
  },

  async getWordLists(userId: string) {
    return wordListRepository.findMany(userId);
  },

  async getWordList(id: string, userId: string) {
    const wordList = await wordListRepository.findById(id, userId);

    if (!wordList) {
      throw new Error('Word list not found');
    }

    return wordList;
  },

  async updateWordList(id: string, userId: string, data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }) {
    const updatedWordList = await wordListRepository.update(id, userId, data);

    if (!updatedWordList) {
      throw new Error('Word list not found');
    }

    return updatedWordList;
  },

  async deleteWordList(id: string, userId: string) {
    const wordList = await wordListRepository.delete(id, userId);
    if (!wordList) {
      throw new Error('Word list not found');
    }
    return wordList;
  },
}; 