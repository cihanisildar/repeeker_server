import { Router } from 'express';
import { StreakController } from '../controllers/streak.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';
import { validateBody } from '../middlewares/validation.middleware';
import { StreakUpdateSchema } from '../schemas';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/streak:
 *   get:
 *     tags: [Streak]
 *     summary: Get user's streak information
 *     description: Retrieve the current and longest streak for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User streak information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentStreak:
 *                   type: integer
 *                   example: 15
 *                   description: Current consecutive days streak
 *                 longestStreak:
 *                   type: integer
 *                   example: 42
 *                   description: Longest streak ever achieved
 *                 streakUpdatedAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00Z"
 *                   description: When the streak was last updated
 *                 lastTestDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: "2024-01-15T09:00:00Z"
 *                   description: Last test/review date
 *                 lastReviewDate:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   example: "2024-01-15T10:00:00Z"
 *                   description: Last review date
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', withAuth(StreakController.getStreak));

/**
 * @swagger
 * /api/streak:
 *   post:
 *     tags: [Streak]
 *     summary: Update user's streak
 *     description: Update the user's streak information when they complete a review or test
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               activityType:
 *                 type: string
 *                 enum: [review, test]
 *                 example: "review"
 *                 description: Type of activity that triggered the streak update
 *               force:
 *                 type: boolean
 *                 default: false
 *                 description: Force update the streak even if already updated today
 *     responses:
 *       200:
 *         description: Streak updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Streak updated successfully"
 *                 currentStreak:
 *                   type: integer
 *                   example: 16
 *                   description: Updated current streak
 *                 longestStreak:
 *                   type: integer
 *                   example: 42
 *                   description: Updated longest streak (if broken)
 *                 streakIncreased:
 *                   type: boolean
 *                   example: true
 *                   description: Whether the streak was increased
 *                 newRecord:
 *                   type: boolean
 *                   example: false
 *                   description: Whether a new longest streak record was set
 *       400:
 *         description: Invalid activity type or streak already updated today
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
router.post('/', validateBody(StreakUpdateSchema), withAuth(StreakController.updateStreak));

export default router; 