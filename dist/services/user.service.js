"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const user_repository_1 = require("../repositories/user.repository");
const error_middleware_1 = require("../middlewares/error.middleware");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.userService = {
    async createUser(userData) {
        const existingUser = await user_repository_1.userRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new error_middleware_1.AppError(400, 'Email already exists');
        }
        const hashedPassword = await bcryptjs_1.default.hash(userData.password, 10);
        return user_repository_1.userRepository.create({
            ...userData,
            password: hashedPassword,
        });
    },
    async getUserById(id) {
        return user_repository_1.userRepository.findById(id);
    },
    async updateUser(id, userData) {
        const user = await user_repository_1.userRepository.findById(id);
        if (!user) {
            throw new error_middleware_1.AppError(404, 'User not found');
        }
        if (userData.email) {
            const existingUser = await user_repository_1.userRepository.findByEmail(userData.email);
            if (existingUser && existingUser.id !== id) {
                throw new error_middleware_1.AppError(400, 'Email already exists');
            }
        }
        return user_repository_1.userRepository.update(id, userData);
    },
    async deleteUser(id) {
        const user = await user_repository_1.userRepository.findById(id);
        if (!user) {
            throw new error_middleware_1.AppError(404, 'User not found');
        }
        return user_repository_1.userRepository.delete(id);
    }
};
