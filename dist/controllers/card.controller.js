"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardController = void 0;
const card_service_1 = require("../services/card.service");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
exports.CardController = {
    async createCard(req, res) {
        try {
            const { word, definition, wordListId, wordDetails } = req.body;
            const card = await card_service_1.cardService.createCard({
                word,
                definition,
                userId: req.user.id,
                wordListId,
                wordDetails,
            });
            return (0, response_1.sendResponse)(res, card, 'success', 'Card created successfully', 201);
        }
        catch (error) {
            logger_1.logger.error('Create card error:', error);
            // Handle unique constraint error
            if (error instanceof Error && error.message.includes('Unique constraint failed')) {
                return (0, response_1.sendResponse)(res, null, 'error', 'A card with this word already exists in your collection', 400);
            }
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to create card', 500);
        }
    },
    async getCards(req, res) {
        try {
            const { wordListId } = req.query;
            const cards = await card_service_1.cardService.getCards(req.user.id, wordListId);
            return (0, response_1.sendResponse)(res, cards, 'success', 'Cards retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Get cards error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to get cards', 500);
        }
    },
    async getCard(req, res) {
        try {
            const { id } = req.params;
            const card = await card_service_1.cardService.getCard(id, req.user.id);
            if (!card) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Card not found', 404);
            }
            return (0, response_1.sendResponse)(res, card, 'success', 'Card retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Get card error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to get card', 500);
        }
    },
    async updateCard(req, res) {
        try {
            const { id } = req.params;
            const { word, definition, wordDetails } = req.body;
            const card = await card_service_1.cardService.updateCard(id, req.user.id, {
                word,
                definition,
                wordDetails,
            });
            if (!card) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Card not found', 404);
            }
            return (0, response_1.sendResponse)(res, card, 'success', 'Card updated successfully');
        }
        catch (error) {
            logger_1.logger.error('Update card error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to update card', 500);
        }
    },
    async deleteCard(req, res) {
        try {
            const { id } = req.params;
            const card = await card_service_1.cardService.deleteCard(id, req.user.id);
            if (!card) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Card not found', 404);
            }
            return (0, response_1.sendResponse)(res, card, 'success', 'Card deleted successfully');
        }
        catch (error) {
            logger_1.logger.error('Delete card error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to delete card', 500);
        }
    },
    async updateCardProgress(req, res) {
        try {
            const { id } = req.params;
            const { isSuccess } = req.body;
            const card = await card_service_1.cardService.updateCardProgress(req.user.id, id, isSuccess);
            if (!card) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Card not found', 404);
            }
            return (0, response_1.sendResponse)(res, card, 'success', 'Card progress updated successfully');
        }
        catch (error) {
            logger_1.logger.error('Update card progress error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to update card progress', 500);
        }
    },
    async getTodayCards(req, res) {
        try {
            const result = await card_service_1.cardService.getTodayCards(req.user.id);
            return (0, response_1.sendResponse)(res, result, 'success', 'Today cards fetched successfully');
        }
        catch (error) {
            logger_1.logger.error('Get today cards error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch today cards', 500);
        }
    },
    async getStats(req, res) {
        try {
            const result = await card_service_1.cardService.getStats(req.user.id);
            return (0, response_1.sendResponse)(res, result || {}, 'success', 'Card stats fetched successfully');
        }
        catch (error) {
            logger_1.logger.error('Get card stats error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch card stats', 500);
        }
    },
    async getUpcomingCards(req, res) {
        try {
            const days = req.query.days ? parseInt(req.query.days) : 7;
            const startDays = req.query.startDays ? parseInt(req.query.startDays) : -14;
            const result = await card_service_1.cardService.getUpcomingCards(req.user.id, days, startDays);
            return (0, response_1.sendResponse)(res, result || {}, 'success', 'Upcoming cards fetched successfully');
        }
        catch (error) {
            logger_1.logger.error('Get upcoming cards error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch upcoming cards', 500);
        }
    },
    async addToReview(req, res) {
        try {
            const { cardIds } = req.body;
            if (!Array.isArray(cardIds)) {
                return (0, response_1.sendResponse)(res, null, 'error', 'cardIds must be an array', 400);
            }
            const result = await card_service_1.cardService.addToReview(req.user.id, cardIds);
            return (0, response_1.sendResponse)(res, result, 'success', 'Cards added to review successfully');
        }
        catch (error) {
            logger_1.logger.error('Add to review error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to add cards to review', 500);
        }
    },
    async reviewCard(req, res) {
        try {
            const { cardId, isSuccess } = req.body;
            if (typeof isSuccess !== 'boolean') {
                return (0, response_1.sendResponse)(res, null, 'error', 'isSuccess must be a boolean', 400);
            }
            const card = await card_service_1.cardService.reviewCard(req.user.id, cardId, isSuccess);
            if (!card) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Card not found', 404);
            }
            return (0, response_1.sendResponse)(res, card, 'success', 'Card reviewed successfully');
        }
        catch (error) {
            logger_1.logger.error('Review card error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to review card', 500);
        }
    },
    async getReviewHistory(req, res) {
        try {
            const { startDate, endDate, days } = req.query;
            const result = await card_service_1.cardService.getReviewHistory(req.user.id, startDate, endDate, days ? parseInt(days) : 30);
            return (0, response_1.sendResponse)(res, result, 'success', 'Review history fetched successfully');
        }
        catch (error) {
            logger_1.logger.error('Get review history error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to fetch review history', 500);
        }
    },
    async importCards(req, res) {
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
            const results = await card_service_1.cardService.importCards(userId, req.file.buffer, wordListId);
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
        }
        catch (error) {
            console.error('Error importing cards:', error);
            return res.status(500).json({
                error: 'Failed to import cards',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },
};
