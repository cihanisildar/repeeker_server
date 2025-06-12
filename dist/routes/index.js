"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const word_list_routes_1 = __importDefault(require("./word-list.routes"));
const card_routes_1 = __importDefault(require("./card.routes"));
const test_session_routes_1 = __importDefault(require("./test-session.routes"));
const streak_routes_1 = __importDefault(require("./streak.routes"));
const review_session_routes_1 = __importDefault(require("./review-session.routes"));
const review_schedule_routes_1 = __importDefault(require("./review-schedule.routes"));
const router = (0, express_1.Router)();
// User routes
router.post('/users', user_controller_1.userController.createUser);
router.get('/users/:id', user_controller_1.userController.getUserById);
router.put('/users/:id', user_controller_1.userController.updateUser);
router.delete('/users/:id', user_controller_1.userController.deleteUser);
// Other routes
router.use('/auth', auth_routes_1.default);
router.use('/lists', word_list_routes_1.default);
router.use('/cards', card_routes_1.default);
router.use('/test-sessions', test_session_routes_1.default);
router.use('/streak', streak_routes_1.default);
router.use('/review-session', review_session_routes_1.default);
router.use('/review-schedule', review_schedule_routes_1.default);
exports.default = router;
