"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = require("../repositories/user.repository");
const error_middleware_1 = require("../middlewares/error.middleware");
exports.authService = {
    async register(data) {
        const existingUser = await user_repository_1.userRepository.findByEmail(data.email);
        if (existingUser) {
            throw new error_middleware_1.AppError(400, 'User already exists');
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const user = await user_repository_1.userRepository.create({
            ...data,
            password: hashedPassword,
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            token,
        };
    },
    async login(email, password) {
        const user = await user_repository_1.userRepository.findByEmail(email);
        if (!user || !user.password) {
            throw new error_middleware_1.AppError(401, 'Invalid credentials');
        }
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password);
        if (!isValidPassword) {
            throw new error_middleware_1.AppError(401, 'Invalid credentials');
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
        };
    },
    async getCurrentUser(userId) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw new error_middleware_1.AppError(404, 'User not found');
        }
        return user;
    },
};
