import { Router } from 'express';
import { ReviewSessionController } from '../controllers/review-session.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';
import { validateBody, validateQuery, createPaginationValidator } from '../middlewares/validation.middleware';
import { 
  ReviewSessionCreateSchema, 
  ReviewSessionUpdateSchema,
  ReviewSessionQuerySchema 
} from '../schemas';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/review-sessions:
 *   post:
 *     tags: [Review Sessions]
 *     summary: Create a new review session
 *     description: Create a custom review session with specified cards
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardIds
 *             properties:
 *               cardIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["card1", "card2", "card3"]
 *               mode:
 *                 type: string
 *                 enum: [flashcard, multiple-choice]
 *                 default: flashcard
 *               isRepeat:
 *                 type: boolean
 *                 default: false
 *               maxCards:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *               sessionType:
 *                 type: string
 *                 enum: [daily, custom, failed_cards]
 *                 default: custom
 *     responses:
 *       201:
 *         description: Review session created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', withAuth(ReviewSessionController.createReviewSession));

/**
 * @swagger
 * /api/review-sessions/daily:
 *   post:
 *     tags: [Review Sessions]
 *     summary: Create a daily review session
 *     description: Create an optimized daily review session with smart card selection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maxReviews:
 *                 type: integer
 *                 default: 50
 *                 minimum: 1
 *                 maximum: 100
 *               maxNewCards:
 *                 type: integer
 *                 default: 20
 *                 minimum: 0
 *                 maximum: 50
 *               prioritizeOverdue:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Daily review session created successfully
 *       200:
 *         description: No cards available for review today
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.post('/daily', withAuth(ReviewSessionController.createDailyReviewSession));

/**
 * @swagger
 * /api/review-sessions/failed-cards:
 *   post:
 *     tags: [Review Sessions]
 *     summary: Create a failed cards review session
 *     description: Create a review session focused on recently failed cards
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *           minimum: 1
 *           maximum: 30
 *         description: Number of days to look back for failed cards
 *     responses:
 *       201:
 *         description: Failed cards review session created successfully
 *       200:
 *         description: No failed cards found for review session
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.post('/failed-cards', withAuth(ReviewSessionController.createFailedCardsSession));

/**
 * @swagger
 * /api/review-sessions/complete:
 *   post:
 *     tags: [Review Sessions]
 *     summary: Complete a review session
 *     description: Mark a review session as completed with optional results
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *               results:
 *                 type: object
 *                 properties:
 *                   cardsReviewed:
 *                     type: integer
 *                     minimum: 0
 *                   correctAnswers:
 *                     type: integer
 *                     minimum: 0
 *                   timeSpent:
 *                     type: integer
 *                     minimum: 0
 *                     description: Time spent in seconds
 *     responses:
 *       200:
 *         description: Review session completed successfully
 *       400:
 *         description: Invalid input or session already completed
 *       404:
 *         description: Review session not found
 *       401:
 *         description: Unauthorized
 */
router.post('/complete', withAuth(ReviewSessionController.completeReviewSession));

/**
 * @swagger
 * /api/review-sessions:
 *   get:
 *     tags: [Review Sessions]
 *     summary: Get user's review sessions
 *     description: Retrieve review sessions for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of sessions to return
 *     responses:
 *       200:
 *         description: Review sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', withAuth(ReviewSessionController.getReviewSessions));

/**
 * @swagger
 * /api/review-sessions/{sessionId}/progress:
 *   get:
 *     tags: [Review Sessions]
 *     summary: Get review session progress
 *     description: Get progress information for a specific review session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Review session ID
 *     responses:
 *       200:
 *         description: Session progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: string
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                 completedAt:
 *                   type: string
 *                   format: date-time
 *                 isCompleted:
 *                   type: boolean
 *                 totalCards:
 *                   type: integer
 *                 mode:
 *                   type: string
 *                 isRepeat:
 *                   type: boolean
 *       404:
 *         description: Review session not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:sessionId/progress', withAuth(ReviewSessionController.getSessionProgress));

export default router; 