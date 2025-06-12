"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const user_service_1 = require("../services/user.service");
const error_middleware_1 = require("../middlewares/error.middleware");
exports.userController = {
    async createUser(req, res, next) {
        try {
            const user = await user_service_1.userService.createUser(req.body);
            res.status(201).json(user);
        }
        catch (error) {
            next(error);
        }
    },
    async getUserById(req, res, next) {
        try {
            const user = await user_service_1.userService.getUserById(req.params.id);
            if (!user) {
                throw new error_middleware_1.AppError(404, 'User not found');
            }
            res.json(user);
        }
        catch (error) {
            next(error);
        }
    },
    async updateUser(req, res, next) {
        try {
            const user = await user_service_1.userService.updateUser(req.params.id, req.body);
            if (!user) {
                throw new error_middleware_1.AppError(404, 'User not found');
            }
            res.json(user);
        }
        catch (error) {
            next(error);
        }
    },
    async deleteUser(req, res, next) {
        try {
            await user_service_1.userService.deleteUser(req.params.id);
            res.status(204).send();
        }
        catch (error) {
            next(error);
        }
    }
};
