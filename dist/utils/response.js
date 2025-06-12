"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = (res, data, status = 'success', message = 'Operation completed successfully', statusCode = 200) => {
    const response = {
        data,
        status,
        message
    };
    return res.status(statusCode).json(response);
};
exports.sendResponse = sendResponse;
