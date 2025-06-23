import { Response } from 'express';
import { cardService } from '../services/card.service';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';
import { AuthenticatedRequest } from '../types/express';
import { Request } from 'express';

const cardControllerLogger = createModuleLogger('CARD_CONTROLLER');

export const CardController = {
  async createCard(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { word, definition, wordListId, wordDetails } = req.body;
    cardControllerLogger.info('Create card request received', { userId, word, wordListId });
    
    try {
      const card = await cardService.createCard({
        word,
        definition,
        userId,
        wordListId,
        wordDetails,
      });
      cardControllerLogger.info('Card created successfully', { userId, cardId: card.id, word });
      return sendResponse(res, card, 'success', 'Card created successfully', 201);
    } catch (error) {
      cardControllerLogger.error('Failed to create card', { 
        userId,
        word,
        wordListId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Handle unique constraint error
      if (error instanceof Error && error.message.includes('Unique constraint failed')) {
        return sendResponse(res, null, 'error', 'A card with this word already exists in your collection', 400);
      }
      
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to create card', 500);
    }
  },

  async getCards(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { wordListId } = req.query;
    cardControllerLogger.debug('Get cards request received', { userId, wordListId });
    
    try {
      const cards = await cardService.getCards(userId, wordListId as string);
      cardControllerLogger.debug('Cards retrieved successfully', { userId, wordListId });
      return sendResponse(res, cards, 'success', 'Cards retrieved successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to get cards', { 
        userId,
        wordListId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get cards', 500);
    }
  },

  async getCard(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;
    cardControllerLogger.debug('Get card request received', { userId, cardId: id });
    
    try {
      const card = await cardService.getCard(id, userId);

      if (!card) {
        cardControllerLogger.warn('Card not found', { userId, cardId: id });
        return sendResponse(res, null, 'error', 'Card not found', 404);
      }

      cardControllerLogger.debug('Card retrieved successfully', { userId, cardId: id });
      return sendResponse(res, card, 'success', 'Card retrieved successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to get card', { 
        userId,
        cardId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get card', 500);
    }
  },

  async updateCard(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;
    const { word, definition, wordDetails } = req.body;
    cardControllerLogger.info('Update card request received', { userId, cardId: id, word });
    
    try {
      const card = await cardService.updateCard(id, userId, {
        word,
        definition,
        wordDetails,
      });

      if (!card) {
        cardControllerLogger.warn('Card not found for update', { userId, cardId: id });
        return sendResponse(res, null, 'error', 'Card not found', 404);
      }

      cardControllerLogger.info('Card updated successfully', { userId, cardId: id });
      return sendResponse(res, card, 'success', 'Card updated successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to update card', { 
        userId,
        cardId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to update card', 500);
    }
  },

  async deleteCard(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;
    cardControllerLogger.info('Delete card request received', { userId, cardId: id });
    
    try {
      const card = await cardService.deleteCard(id, userId);

      if (!card) {
        cardControllerLogger.warn('Card not found for deletion', { userId, cardId: id });
        return sendResponse(res, null, 'error', 'Card not found', 404);
      }

      cardControllerLogger.info('Card deleted successfully', { userId, cardId: id });
      return sendResponse(res, card, 'success', 'Card deleted successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to delete card', { 
        userId,
        cardId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to delete card', 500);
    }
  },

  async updateCardProgress(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { id } = req.params;
    const { isSuccess } = req.body;
    cardControllerLogger.info('Update card progress request received', { userId, cardId: id, isSuccess });
    
    try {
      const card = await cardService.updateCardProgress(userId, id, isSuccess);

      if (!card) {
        cardControllerLogger.warn('Card not found for progress update', { userId, cardId: id });
        return sendResponse(res, null, 'error', 'Card not found', 404);
      }

      cardControllerLogger.info('Card progress updated successfully', { userId, cardId: id, isSuccess });
      return sendResponse(res, card, 'success', 'Card progress updated successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to update card progress', { 
        userId,
        cardId: id,
        isSuccess,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to update card progress', 500);
    }
  },

  async getTodayCards(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    cardControllerLogger.debug('Get today cards request received', { userId, limit });
    
    try {
      const result = await cardService.getTodayCards(userId, limit);
      cardControllerLogger.debug('Today cards retrieved successfully', { userId, limit });
      return sendResponse(res, result, 'success', 'Today cards fetched successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to get today cards', { 
        userId,
        limit,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch today cards', 500);
    }
  },

  async getStats(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    cardControllerLogger.debug('Get card stats request received', { userId });
    
    try {
      const result = await cardService.getStats(userId);
      cardControllerLogger.debug('Card stats retrieved successfully', { userId });
      return sendResponse(res, result || {}, 'success', 'Card stats fetched successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to get card stats', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch card stats', 500);
    }
  },

  async getUpcomingCards(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const days = req.query.days ? parseInt(req.query.days as string) : 7;
    const startDays = req.query.startDays ? parseInt(req.query.startDays as string) : -14;
    cardControllerLogger.debug('Get upcoming cards request received', { userId, days, startDays });
    
    try {
      const result = await cardService.getUpcomingCards(userId, days, startDays);
      cardControllerLogger.debug('Upcoming cards retrieved successfully', { userId, days, startDays });
      return sendResponse(res, result || {}, 'success', 'Upcoming cards fetched successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to get upcoming cards', { 
        userId,
        days,
        startDays,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch upcoming cards', 500);
    }
  },

  async addToReview(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { cardIds } = req.body;
    cardControllerLogger.info('Add to review request received', { userId, cardCount: cardIds?.length });
    
    try {
      if (!Array.isArray(cardIds)) {
        cardControllerLogger.warn('Invalid cardIds format', { userId, cardIds });
        return sendResponse(res, null, 'error', 'cardIds must be an array', 400);
      }

      const result = await cardService.addToReview(userId, cardIds);
      cardControllerLogger.info('Cards added to review successfully', { userId, cardCount: cardIds.length });
      return sendResponse(res, result, 'success', 'Cards added to review successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to add cards to review', { 
        userId,
        cardIds,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to add cards to review', 500);
    }
  },

  async reviewCard(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { cardId, isSuccess, responseQuality } = req.body;
    cardControllerLogger.info('Review card request received', { userId, cardId, isSuccess, responseQuality });
    
    try {
      if (typeof isSuccess !== 'boolean') {
        cardControllerLogger.warn('Invalid isSuccess format', { userId, cardId, isSuccess });
        return sendResponse(res, null, 'error', 'isSuccess must be a boolean', 400);
      }

      // Validate responseQuality if provided
      if (responseQuality !== undefined && (typeof responseQuality !== 'number' || responseQuality < 0 || responseQuality > 3)) {
        cardControllerLogger.warn('Invalid responseQuality format', { userId, cardId, responseQuality });
        return sendResponse(res, null, 'error', 'responseQuality must be a number between 0 and 3 (0=Again, 1=Hard, 2=Good, 3=Easy)', 400);
      }

      const card = await cardService.reviewCard(userId, cardId, isSuccess, responseQuality);
      
      if (!card) {
        cardControllerLogger.warn('Card not found for review', { userId, cardId });
        return sendResponse(res, null, 'error', 'Card not found', 404);
      }

      cardControllerLogger.info('Card reviewed successfully', { userId, cardId, isSuccess, responseQuality });
      return sendResponse(res, card, 'success', 'Card reviewed successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to review card', { 
        userId,
        cardId,
        isSuccess,
        responseQuality,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to review card', 500);
    }
  },

  async getReviewHistory(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const { startDate, endDate, days } = req.query;
    const daysParam = days ? parseInt(days as string) : 30;
    cardControllerLogger.debug('Get review history request received', { userId, startDate, endDate, days: daysParam });
    
    try {
      const result = await cardService.getReviewHistory(
        userId,
        startDate as string,
        endDate as string,
        daysParam
      );

      cardControllerLogger.debug('Review history retrieved successfully', { userId });
      return sendResponse(res, result, 'success', 'Review history fetched successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to get review history', { 
        userId,
        startDate,
        endDate,
        days: daysParam,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch review history', 500);
    }
  },

  async importCards(req: Request, res: Response) {
    const userId = req.user?.id;
    const wordListId = req.body.wordListId;
    cardControllerLogger.info('Import cards request received', { 
      userId, 
      wordListId,
      hasFile: !!req.file,
      fileSize: req.file?.size,
      mimeType: req.file?.mimetype
    });
    
    try {
      if (!req.file) {
        cardControllerLogger.warn('Import cards request without file', { userId });
        return res.status(400).json({ error: 'No file provided' });
      }

      if (!userId) {
        cardControllerLogger.warn('Import cards request without authentication');
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Validate file type
      if (!req.file.mimetype.includes('spreadsheet') && 
          !req.file.mimetype.includes('excel') && 
          !req.file.mimetype.includes('csv')) {
        cardControllerLogger.warn('Invalid file type for import', { 
          userId, 
          mimeType: req.file.mimetype 
        });
        return res.status(400).json({ 
          error: 'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV file' 
        });
      }

      const results = await cardService.importCards(userId, req.file.buffer, wordListId);
      
      if (results.failed > 0) {
        cardControllerLogger.warn('Import completed with errors', { 
          userId, 
          success: results.success, 
          failed: results.failed,
          errorCount: results.errors.length
        });
        return res.status(207).json({
          message: 'Import completed with some errors',
          ...results
        });
      }

      cardControllerLogger.info('Import completed successfully', { 
        userId, 
        success: results.success 
      });
      return res.json({
        message: 'Import completed successfully',
        ...results
      });
    } catch (error) {
      cardControllerLogger.error('Card import failed', { 
        userId,
        wordListId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return res.status(500).json({ 
        error: 'Failed to import cards',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },

  async getAvailableCards(req: AuthenticatedRequest, res: Response) {
    const userId = req.user.id;
    const wordListId = req.query.wordListId as string;
    cardControllerLogger.debug('Get available cards request received', { userId, wordListId });
    
    try {
      if (!wordListId) {
        cardControllerLogger.warn('wordListId parameter missing', { userId });
        return sendResponse(res, null, 'error', 'wordListId parameter is required', 400);
      }

      const cards = await cardService.getAvailableCards(userId, wordListId);
      cardControllerLogger.debug('Available cards retrieved successfully', { userId, wordListId, count: cards.length });
      return sendResponse(res, cards, 'success', 'Available cards retrieved successfully');
    } catch (error) {
      cardControllerLogger.error('Failed to get available cards', { 
        userId,
        wordListId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return sendResponse(res, null, 'error', error instanceof Error ? error.message : 'Failed to get available cards', 500);
    }
  },
}; 