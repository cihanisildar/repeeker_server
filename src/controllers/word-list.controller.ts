import { Request, Response } from 'express';
import { wordListService } from '../services/word-list.service';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';

const wordListControllerLogger = createModuleLogger('WORDLIST_CONTROLLER');

export const WordListController = {
  async createWordList(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { name, description } = req.body;
    wordListControllerLogger.info('Create word list request received', { userId, name });
    
    try {
      if (!userId) {
        wordListControllerLogger.warn('Create word list request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const wordList = await wordListService.createWordList({
        name,
        description,
        isPublic: false,
        userId,
      });
      
      wordListControllerLogger.info('Word list created successfully', { 
        userId, 
        wordListId: wordList.id, 
        name 
      });
      return sendResponse(res, wordList, 'success', 'Word list created successfully', 201);
    } catch (error) {
      wordListControllerLogger.error('Failed to create word list', { 
        userId,
        name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to create word list', 500);
    }
  },

  async getWordLists(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    wordListControllerLogger.debug('Get word lists request received', { userId });
    
    try {
      if (!userId) {
        wordListControllerLogger.warn('Get word lists request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const wordLists = await wordListService.getWordLists(userId);
      wordListControllerLogger.debug('Word lists retrieved successfully', { 
        userId, 
        count: wordLists.length 
      });
      return sendResponse(res, wordLists, 'success', 'Word lists retrieved successfully');
    } catch (error) {
      wordListControllerLogger.error('Failed to get word lists', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get word lists', 500);
    }
  },

  async getWordList(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { id } = req.params;
    wordListControllerLogger.debug('Get word list request received', { userId, wordListId: id });
    
    try {
      if (!userId) {
        wordListControllerLogger.warn('Get word list request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const wordList = await wordListService.getWordList(id, userId);

      if (!wordList) {
        wordListControllerLogger.warn('Word list not found', { userId, wordListId: id });
        return sendResponse(res, null, 'error', 'Word list not found', 404);
      }

      wordListControllerLogger.debug('Word list retrieved successfully', { userId, wordListId: id });
      return sendResponse(res, wordList, 'success', 'Word list retrieved successfully');
    } catch (error) {
      wordListControllerLogger.error('Failed to get word list', { 
        userId,
        wordListId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get word list', 500);
    }
  },

  async updateWordList(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, description } = req.body;
    wordListControllerLogger.info('Update word list request received', { userId, wordListId: id, name });
    
    try {
      if (!userId) {
        wordListControllerLogger.warn('Update word list request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const wordList = await wordListService.updateWordList(id, userId, {
        name,
        description,
      });

      if (!wordList) {
        wordListControllerLogger.warn('Word list not found for update', { userId, wordListId: id });
        return sendResponse(res, null, 'error', 'Word list not found', 404);
      }

      wordListControllerLogger.info('Word list updated successfully', { userId, wordListId: id });
      return sendResponse(res, wordList, 'success', 'Word list updated successfully');
    } catch (error) {
      wordListControllerLogger.error('Failed to update word list', { 
        userId,
        wordListId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to update word list', 500);
    }
  },

  async deleteWordList(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.id;
    const { id } = req.params;
    wordListControllerLogger.info('Delete word list request received', { userId, wordListId: id });
    
    try {
      if (!userId) {
        wordListControllerLogger.warn('Delete word list request without authentication');
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const wordList = await wordListService.deleteWordList(id, userId);

      if (!wordList) {
        wordListControllerLogger.warn('Word list not found for deletion', { userId, wordListId: id });
        return sendResponse(res, null, 'error', 'Word list not found', 404);
      }

      wordListControllerLogger.info('Word list deleted successfully', { userId, wordListId: id });
      return sendResponse(res, wordList, 'success', 'Word list deleted successfully');
    } catch (error) {
      wordListControllerLogger.error('Failed to delete word list', { 
        userId,
        wordListId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to delete word list', 500);
    }
  },
}; 