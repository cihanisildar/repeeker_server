import { Request, Response } from 'express';
import { wordListService } from '../services/word-list.service';
import { logger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '@/types/express';

export const WordListController = {
  async createWordList(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const { name, description } = req.body;
      const wordList = await wordListService.createWordList({
        name,
        description,
        isPublic: false,
        userId: req.user.id,
      });
      return sendResponse(res, wordList, 'success', 'Word list created successfully', 201);
    } catch (error) {
      logger.error('Create word list error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to create word list', 500);
    }
  },

  async getWordLists(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const wordLists = await wordListService.getWordLists(req.user.id);
      return sendResponse(res, wordLists, 'success', 'Word lists retrieved successfully');
    } catch (error) {
      logger.error('Get word lists error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get word lists', 500);
    }
  },

  async getWordList(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const { id } = req.params;
      const wordList = await wordListService.getWordList(id, req.user.id);

      if (!wordList) {
        return sendResponse(res, null, 'error', 'Word list not found', 404);
      }

      return sendResponse(res, wordList, 'success', 'Word list retrieved successfully');
    } catch (error) {
      logger.error('Get word list error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get word list', 500);
    }
  },

  async updateWordList(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const { id } = req.params;
      const { name, description } = req.body;

      const wordList = await wordListService.updateWordList(id, req.user.id, {
        name,
        description,
      });

      if (!wordList) {
        return sendResponse(res, null, 'error', 'Word list not found', 404);
      }

      return sendResponse(res, wordList, 'success', 'Word list updated successfully');
    } catch (error) {
      logger.error('Update word list error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to update word list', 500);
    }
  },

  async deleteWordList(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendResponse(res, null, 'error', 'Not authenticated', 401);
      }

      const { id } = req.params;
      const wordList = await wordListService.deleteWordList(id, req.user.id);

      if (!wordList) {
        return sendResponse(res, null, 'error', 'Word list not found', 404);
      }

      return sendResponse(res, wordList, 'success', 'Word list deleted successfully');
    } catch (error) {
      logger.error('Delete word list error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to delete word list', 500);
    }
  },
}; 