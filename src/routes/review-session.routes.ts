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
 * /api/review-session:
 *   post:
 *     tags: [Review Session]
 *     summary: Create a new review session
 *     description: Start a new review session for practicing cards
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mode
 *               - cards
 *             properties:
 *               mode:
 *                 type: string
 *                 enum: [flashcard, multiple-choice]
 *                 example: "flashcard"
 *                 description: Review session mode
 *               cards:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["clp2h0001000008l7d8h9g2k1", "clp2h0001000008l7d8h9g2k2"]
 *                 description: Array of card IDs to include in the session
 *               isRepeat:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is a repeat session
 *     responses:
 *       201:
 *         description: Review session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewSession'
 *       400:
 *         description: Invalid session data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validateBody(ReviewSessionCreateSchema), withAuth(ReviewSessionController.createReviewSession));

/**
 * @swagger
 * /api/review-session:
 *   patch:
 *     tags: [Review Session]
 *     summary: Complete a review session
 *     description: Mark a review session as completed
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
 *                 example: "clp2h0001000008l7d8h9g2k1"
 *                 description: ID of the session to complete
 *               results:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cardId:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *                     timeSpent:
 *                       type: integer
 *                 description: Optional results data for the session
 *     responses:
 *       200:
 *         description: Review session completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewSession'
 *       400:
 *         description: Invalid session data or session already completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Review session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/', validateBody(ReviewSessionUpdateSchema), withAuth(ReviewSessionController.completeReviewSession));

/**
 * @swagger
 * /api/review-session:
 *   get:
 *     tags: [Review Session]
 *     summary: Get user's review sessions
 *     description: Retrieve review sessions for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of sessions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of sessions to skip
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *     responses:
 *       200:
 *         description: List of review sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReviewSession'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validateQuery(ReviewSessionQuerySchema), withAuth(ReviewSessionController.getReviewSessions));

export default router; 