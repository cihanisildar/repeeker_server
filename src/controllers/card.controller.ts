import { Response } from 'express';
import { cardService } from '../services/card.service';
import { logger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '../types/express';
import { Request } from 'express';

export const CardController = {
  async createCard(req: AuthenticatedRequest, res: Response) {
    try {
      const { word, definition, wordListId, wordDetails } = req.body;
      const card = await cardService.createCard({
        word,
        definition,
        userId: req.user.id,
        wordListId,
        wordDetails,
      });
      return sendResponse(res, card, 'success', 'Card created successfully', 201);
    } catch (error) {
      logger.error('Create card error:', error);
      
      // Handle unique constraint error
      if (error instanceof Error && error.message.includes('Unique constraint failed')) {
        return sendResponse(res, null, 'error', 'A card with this word already exists in your collection', 400);
      }
      
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to create card', 500);
    }
  },

  async getCards(req: AuthenticatedRequest, res: Response) {
    try {
      const { wordListId } = req.query;
      const cards = await cardService.getCards(req.user.id, wordListId as string);
      return sendResponse(res, cards, 'success', 'Cards retrieved successfully');
    } catch (error) {
      logger.error('Get cards error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get cards', 500);
    }
  },

  async getCard(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const card = await cardService.getCard(id, req.user.id);

      if (!card) {
        return sendResponse(res, null, 'error', 'Card not found', 404);
      }

      return sendResponse(res, card, 'success', 'Card retrieved successfully');
    } catch (error) {
      logger.error('Get card error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get card', 500);
    }
  },

  async updateCard(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { word, definition, wordDetails } = req.body;

      const card = await cardService.updateCard(id, req.user.id, {
        word,
        definition,
        wordDetails,
      });

      if (!card) {
        return sendResponse(res, null, 'error', 'Card not found', 404);
      }

      return sendResponse(res, card, 'success', 'Card updated successfully');
    } catch (error) {
      logger.error('Update card error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to update card', 500);
    }
  },

  async deleteCard(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const card = await cardService.deleteCard(id, req.user.id);

      if (!card) {
        return sendResponse(res, null, 'error', 'Card not found', 404);
      }

      return sendResponse(res, card, 'success', 'Card deleted successfully');
    } catch (error) {
      logger.error('Delete card error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to delete card', 500);
    }
  },

  async updateCardProgress(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { isSuccess } = req.body;

      const card = await cardService.updateCardProgress(req.user.id, id, isSuccess);

      if (!card) {
        return sendResponse(res, null, 'error', 'Card not found', 404);
      }

      return sendResponse(res, card, 'success', 'Card progress updated successfully');
    } catch (error) {
      logger.error('Update card progress error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to update card progress', 500);
    }
  },

  async getTodayCards(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await cardService.getTodayCards(req.user.id);
      return sendResponse(res, result, 'success', 'Today cards fetched successfully');
    } catch (error) {
      logger.error('Get today cards error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch today cards', 500);
    }
  },

  async getStats(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await cardService.getStats(req.user.id);
      return sendResponse(res, result || {}, 'success', 'Card stats fetched successfully');
    } catch (error) {
      logger.error('Get card stats error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch card stats', 500);
    }
  },

  async getUpcomingCards(req: AuthenticatedRequest, res: Response) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const startDays = req.query.startDays ? parseInt(req.query.startDays as string) : -14;
      const result = await cardService.getUpcomingCards(req.user.id, days, startDays);
      return sendResponse(res, result || {}, 'success', 'Upcoming cards fetched successfully');
    } catch (error) {
      logger.error('Get upcoming cards error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch upcoming cards', 500);
    }
  },

  async addToReview(req: AuthenticatedRequest, res: Response) {
    try {
      const { cardIds } = req.body;
      
      if (!Array.isArray(cardIds)) {
        return sendResponse(res, null, 'error', 'cardIds must be an array', 400);
      }

      const result = await cardService.addToReview(req.user.id, cardIds);
      return sendResponse(res, result, 'success', 'Cards added to review successfully');
    } catch (error) {
      logger.error('Add to review error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to add cards to review', 500);
    }
  },

  async reviewCard(req: AuthenticatedRequest, res: Response) {
    try {
      const { cardId, isSuccess } = req.body;
      
      if (typeof isSuccess !== 'boolean') {
        return sendResponse(res, null, 'error', 'isSuccess must be a boolean', 400);
      }

      const card = await cardService.reviewCard(req.user.id, cardId, isSuccess);
      
      if (!card) {
        return sendResponse(res, null, 'error', 'Card not found', 404);
      }

      return sendResponse(res, card, 'success', 'Card reviewed successfully');
    } catch (error) {
      logger.error('Review card error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to review card', 500);
    }
  },

  async getReviewHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate, days } = req.query;
      const result = await cardService.getReviewHistory(
        req.user.id,
        startDate as string,
        endDate as string,
        days ? parseInt(days as string) : 30
      );

      return sendResponse(res, result, 'success', 'Review history fetched successfully');
    } catch (error) {
      logger.error('Get review history error:', error);
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch review history', 500);
    }
  },

  async importCards(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate file type
      if (!req.file.mimetype.includes('spreadsheet') && 
          !req.file.mimetype.includes('excel') && 
          !req.file.mimetype.includes('csv')) {
        return res.status(400).json({ 
          error: 'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file' 
        });
      }

      const wordListId = req.body.wordListId;
      const results = await cardService.importCards(userId, req.file.buffer, wordListId);
      
      if (results.failed > 0) {
        return res.status(207).json({
          message: 'Import completed with some errors',
          ...results
        });
      }

      return res.json({
        message: 'Import completed successfully',
        ...results
      });
    } catch (error) {
      console.error('Error importing cards:', error);
      return res.status(500).json({ 
        error: 'Failed to import cards',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
}; 