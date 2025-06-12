"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
exports.AuthController = {
    async register(req, res) {
        try {
            const { name, email, password } = req.body;
            const result = await auth_service_1.authService.register({ name, email, password });
            return (0, response_1.sendResponse)(res, result, 'success', 'User registered successfully', 201);
        }
        catch (error) {
            logger_1.logger.error('Registration error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Registration failed', 500);
        }
    },
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await auth_service_1.authService.login(email, password);
            return (0, response_1.sendResponse)(res, result, 'success', 'Login successful');
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Login failed', 401);
        }
    },
    async getCurrentUser(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return (0, response_1.sendResponse)(res, null, 'error', 'Not authenticated', 401);
            }
            const user = await auth_service_1.authService.getCurrentUser(userId);
            return (0, response_1.sendResponse)(res, user, 'success', 'User retrieved successfully');
        }
        catch (error) {
            logger_1.logger.error('Get current user error:', error);
            return (0, response_1.sendResponse)(res, null, 'error', error instanceof Error ? error.message : 'Failed to get user', 500);
        }
    },
};
