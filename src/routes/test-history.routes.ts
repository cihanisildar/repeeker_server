import { Router } from 'express';
import { TestSessionController } from '../controllers/test-session.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';
import { validateQuery } from '../middlewares/validation.middleware';
import { TestHistoryQuerySchema } from '../schemas';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/test-history:
 *   get:
 *     tags: [Test History]
 *     summary: Get user's test history
 *     description: Retrieve the complete test history for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of test sessions to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of test sessions to skip
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         description: Filter tests from this date onwards
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-01-31"
 *         description: Filter tests up to this date
 *     responses:
 *       200:
 *         description: Test history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "clp2h0001000008l7d8h9g2k1"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       totalQuestions:
 *                         type: integer
 *                         example: 20
 *                       correctAnswers:
 *                         type: integer
 *                         example: 17
 *                       accuracy:
 *                         type: number
 *                         format: float
 *                         example: 0.85
 *                       totalTime:
 *                         type: integer
 *                         description: Total time spent in milliseconds
 *                         example: 300000
 *                       results:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/TestResult'
 *                 totalSessions:
 *                   type: integer
 *                   example: 45
 *                 totalQuestions:
 *                   type: integer
 *                   example: 900
 *                 totalCorrect:
 *                   type: integer
 *                   example: 765
 *                 overallAccuracy:
 *                   type: number
 *                   format: float
 *                   example: 0.85
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validateQuery(TestHistoryQuerySchema), withAuth(TestSessionController.getTestHistory));

export default router; 