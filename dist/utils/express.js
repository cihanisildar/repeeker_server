"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAuth = void 0;
const withAuth = (handler) => {
    return async (req, res, next) => {
        try {
            await handler(req, res);
        }
        catch (error) {
            next(error);
        }
    };
};
exports.withAuth = withAuth;
