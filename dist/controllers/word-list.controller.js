"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WordListController = void 0;
const word_list_service_1 = require("../services/word-list.service");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
exports.WordListController = {
    async createWordList(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const { name, description } = req.body;
            const wordList = await word_list_service_1.wordListService.createWordList({
                name,
                description,
                isPublic: false,
                userId: req.user.id,
            });
            return (0, response_1.sendResponse)(res, wordList, 'success', 'Word list created successfully', 201);
        }
        catch (error) {
            logger_1.logger.error('Create word list error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to create word list', 500);
        }
    },
    async getWordLists(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const wordLists = await word_list_service_1.wordListService.getWordLists(req.user.id);
            return (0, response_1.sendResponse)(res, wordLists, 'success', 'Word lists retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Get word lists error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to get word lists', 500);
        }
    },
    async getWordList(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const { id } = req.params;
            const wordList = await word_list_service_1.wordListService.getWordList(id, req.user.id);
            if (!wordList) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Word list not found', 404);
            }
            return (0, response_1.sendResponse)(res, wordList, 'success', 'Word list retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Get word list error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to get word list', 500);
        }
    },
    async updateWordList(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const { id } = req.params;
            const { name, description } = req.body;
            const wordList = await word_list_service_1.wordListService.updateWordList(id, req.user.id, {
                name,
                description,
            });
            if (!wordList) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Word list not found', 404);
            }
            return (0, response_1.sendResponse)(res, wordList, 'success', 'Word list updated successfully');
        }
        catch (error) {
            logger_1.logger.error('Update word list error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to update word list', 500);
        }
    },
    async deleteWordList(req, res) {
        try {
            if (!req.user) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const { id } = req.params;
            const wordList = await word_list_service_1.wordListService.deleteWordList(id, req.user.id);
            if (!wordList) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Word list not found', 404);
            }
            return (0, response_1.sendResponse)(res, wordList, 'success', 'Word list deleted successfully');
        }
        catch (error) {
            logger_1.logger.error('Delete word list error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to delete word list', 500);
        }
    },
};
