"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = exports.AppError = void 0;
const logger_1 = require("../utils/logger");
const response_1 = require("../utils/response");
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
const errorMiddleware = (err, req, res, next) => {
    logger_1.logger.error('Error:', err);
    if (err instanceof AppError) {
        return (0, response_1.sendResponse)(res, null, 'error', err.message, err.statusCode);
    }
    if (err.name === 'ValidationError') {
        return (0, response_1.sendResponse)(res, null, 'error', err.message, 400);
    }
    if (err.name === 'UnauthorizedError') {
        return (0, response_1.sendResponse)(res, null, 'error', 'Unauthorized', 401);
    }
    return (0, response_1.sendResponse)(res, null, 'error', 'Internal server error', 500);
};
exports.errorMiddleware = errorMiddleware;
