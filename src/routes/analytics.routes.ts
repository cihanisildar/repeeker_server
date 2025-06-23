import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/analytics/velocity:
 *   get:
 *     tags: [Analytics]
 *     summary: Get learning velocity trends
 *     description: Retrieve learning velocity data over time
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: daily
 *         description: Time period for grouping data
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *           maximum: 365
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: Learning velocity data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   period:
 *                     type: string
 *                   cardsLearned:
 *                     type: integer
 *                   reviewsCompleted:
 *                     type: integer
 *                   averageAccuracy:
 *                     type: number
 *                   timeSpent:
 *                     type: integer
 */
router.get('/velocity', withAuth(AnalyticsController.getLearningVelocity));

/**
 * @swagger
 * /api/analytics/difficult-cards:
 *   get:
 *     tags: [Analytics]
 *     summary: Get consistently difficult cards
 *     description: Retrieve cards that are frequently failed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Maximum number of difficult cards to return
 *     responses:
 *       200:
 *         description: List of difficult cards with suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   word:
 *                     type: string
 *                   definition:
 *                     type: string
 *                   failureRate:
 *                     type: number
 *                   consecutiveFailures:
 *                     type: integer
 *                   lastReviewed:
 *                     type: string
 *                     format: date-time
 *                   suggestedAction:
 *                     type: string
 *                     enum: [review_again, break_down, add_examples, practice_more]
 */
router.get('/difficult-cards', withAuth(AnalyticsController.getDifficultCards));

/**
 * @swagger
 * /api/analytics/optimal-times:
 *   get:
 *     tags: [Analytics]
 *     summary: Get optimal review times
 *     description: Retrieve analysis of best times for reviewing based on performance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Optimal review times analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   hour:
 *                     type: integer
 *                   accuracy:
 *                     type: number
 *                   reviewCount:
 *                     type: integer
 *                   averageResponseTime:
 *                     type: integer
 */
router.get('/optimal-times', withAuth(AnalyticsController.getOptimalReviewTimes));

/**
 * @swagger
 * /api/analytics/insights:
 *   get:
 *     tags: [Analytics]
 *     summary: Get personalized learning insights
 *     description: Retrieve AI-generated insights about learning patterns and suggestions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Personalized learning insights
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [streak_breaking, difficulty_pattern, time_optimization, progress_plateau]
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   severity:
 *                     type: string
 *                     enum: [low, medium, high]
 *                   actionable:
 *                     type: boolean
 *                   suggestions:
 *                     type: array
 *                     items:
 *                       type: string
 */
router.get('/insights', withAuth(AnalyticsController.getLearningInsights));

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     tags: [Analytics]
 *     summary: Get comprehensive learning dashboard
 *     description: Retrieve all analytics data in one comprehensive response
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Complete learning dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 velocity:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LearningVelocity'
 *                 difficultCards:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DifficultCard'
 *                 optimalTimes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OptimalReviewTime'
 *                 insights:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LearningInsight'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalCards:
 *                       type: integer
 *                     averageAccuracy:
 *                       type: number
 *                     streakDays:
 *                       type: integer
 *                     nextReviewCount:
 *                       type: integer
 */
router.get('/dashboard', withAuth(AnalyticsController.getLearningDashboard));

export default router; 