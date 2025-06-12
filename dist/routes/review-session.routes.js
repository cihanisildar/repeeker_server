"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_session_controller_1 = require("../controllers/review-session.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const express_2 = require("../utils/express");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Create a new review session
router.post('/', (0, express_2.withAuth)(review_session_controller_1.ReviewSessionController.createReviewSession));
// Complete a review session
router.patch('/', (0, express_2.withAuth)(review_session_controller_1.ReviewSessionController.completeReviewSession));
// Get all review sessions for the current user
router.get('/', (0, express_2.withAuth)(review_session_controller_1.ReviewSessionController.getReviewSessions));
exports.default = router;
