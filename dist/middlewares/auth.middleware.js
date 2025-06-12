"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        logger_1.logger.debug('Auth header:', authHeader);
        if (!authHeader) {
            logger_1.logger.debug('No auth header found');
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        logger_1.logger.debug('Extracted token:', token);
        if (!token) {
            logger_1.logger.debug('No token found in auth header');
            return res.status(401).json({ message: 'No token provided' });
        }
        logger_1.logger.debug('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Secret is set' : 'Secret is not set');
        const decoded = jsonwebtoken_1.default.verify(token, process.env.NEXTAUTH_SECRET);
        logger_1.logger.debug('Decoded token:', decoded);
        req.user = decoded;
        next();
    }
    catch (error) {
        logger_1.logger.error('Auth middleware error:', error);
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.logger.error('JWT Error details:', {
                name: error.name,
                message: error.message
            });
        }
        res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
