"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const card_controller_1 = require("../controllers/card.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const express_2 = require("../utils/express");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)();
// Apply auth middleware to all routes
router.use(auth_middleware_1.authMiddleware);
// Define routes
router.post('/', (0, express_2.withAuth)(card_controller_1.CardController.createCard));
router.get('/', (0, express_2.withAuth)(card_controller_1.CardController.getCards));
router.get('/today', (0, express_2.withAuth)(card_controller_1.CardController.getTodayCards));
router.get('/stats', (0, express_2.withAuth)(card_controller_1.CardController.getStats));
router.get('/upcoming', (0, express_2.withAuth)(card_controller_1.CardController.getUpcomingCards));
router.get('/history', (0, express_2.withAuth)(card_controller_1.CardController.getReviewHistory));
router.post('/add-to-review', (0, express_2.withAuth)(card_controller_1.CardController.addToReview));
router.post('/review', (0, express_2.withAuth)(card_controller_1.CardController.reviewCard));
router.get('/:id', (0, express_2.withAuth)(card_controller_1.CardController.getCard));
router.put('/:id', (0, express_2.withAuth)(card_controller_1.CardController.updateCard));
router.delete('/:id', (0, express_2.withAuth)(card_controller_1.CardController.deleteCard));
router.post('/:id/progress', (0, express_2.withAuth)(card_controller_1.CardController.updateCardProgress));
router.post('/import', upload.single('file'), (0, express_2.withAuth)(card_controller_1.CardController.importCards));
exports.default = router;
