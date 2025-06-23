import { Router } from 'express';
import { TestSessionController } from '../controllers/test-session.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { testSessionRateLimit } from '../middlewares/rate-limit.middleware';
import { withAuth } from '../utils/express';
import { validateBody, validateQuery, validateParams, CommonParams } from '../middlewares/validation.middleware';
import { 
  TestSessionCreateSchema, 
  TestSessionCompleteSchema,
  TestResultSubmissionSchema,
  PaginationSchema 
} from '../schemas';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/test-sessions:
 *   post:
 *     tags: [Test Sessions]
 *     summary: Create a new test session
 *     description: Start a new test session with a set of cards
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["clp2h0001000008l7d8h9g2k1", "clp2h0001000008l7d8h9g2k2"]
 *                 description: Array of card IDs to include in the test
 *               wordListId:
 *                 type: string
 *                 example: "clp2h0001000008l7d8h9g2k3"
 *                 description: Optional word list ID to get cards from
 *               testType:
 *                 type: string
 *                 enum: [random, scheduled, wordlist]
 *                 default: random
 *                 description: Type of test to create
 *               maxCards:
 *                 type: integer
 *                 default: 20
 *                 example: 10
 *                 description: Maximum number of cards to include
 *     responses:
 *       201:
 *         description: Test session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestSession'
 *       400:
 *         description: Invalid test session data
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
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', testSessionRateLimit, validateBody(TestSessionCreateSchema), withAuth(TestSessionController.createTestSession));

/**
 * @swagger
 * /api/test-sessions:
 *   get:
 *     tags: [Test Sessions]
 *     summary: Get user's test sessions
 *     description: Retrieve test sessions for the authenticated user
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
 *         name: includeResults
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Whether to include test results in the response
 *     responses:
 *       200:
 *         description: List of test sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestSession'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validateQuery(PaginationSchema), withAuth(TestSessionController.getTestSessions));

/**
 * @swagger
 * /api/test-sessions/{id}:
 *   get:
 *     tags: [Test Sessions]
 *     summary: Get a specific test session
 *     description: Retrieve a test session by its ID with all results
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test session ID
 *     responses:
 *       200:
 *         description: Test session details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   $ref: '#/components/schemas/TestSession'
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TestResult'
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalQuestions:
 *                       type: integer
 *                       example: 10
 *                     correctAnswers:
 *                       type: integer
 *                       example: 8
 *                     accuracy:
 *                       type: number
 *                       format: float
 *                       example: 0.8
 *                     totalTime:
 *                       type: integer
 *                       description: Total time in milliseconds
 *                       example: 120000
 *                     averageTime:
 *                       type: number
 *                       format: float
 *                       description: Average time per question in milliseconds
 *                       example: 12000
 *       404:
 *         description: Test session not found
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
router.get('/:id', validateParams(CommonParams.id), withAuth(TestSessionController.getTestSession));

/**
 * @swagger
 * /api/test-sessions/{sessionId}/results:
 *   post:
 *     tags: [Test Sessions]
 *     summary: Submit test result
 *     description: Submit a result for a specific question in a test session
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardId
 *               - isCorrect
 *               - timeSpent
 *             properties:
 *               cardId:
 *                 type: string
 *                 example: "clp2h0001000008l7d8h9g2k1"
 *                 description: ID of the card that was tested
 *               isCorrect:
 *                 type: boolean
 *                 example: true
 *                 description: Whether the answer was correct
 *               timeSpent:
 *                 type: integer
 *                 example: 5000
 *                 description: Time spent on this question in milliseconds
 *               userAnswer:
 *                 type: string
 *                 example: "ubiquitous"
 *                 description: The answer provided by the user (optional)
 *     responses:
 *       201:
 *         description: Test result submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Test result submitted successfully"
 *                 result:
 *                   $ref: '#/components/schemas/TestResult'
 *                 sessionProgress:
 *                   type: object
 *                   properties:
 *                     completed:
 *                       type: integer
 *                       example: 5
 *                     total:
 *                       type: integer
 *                       example: 10
 *                     accuracy:
 *                       type: number
 *                       format: float
 *                       example: 0.8
 *       400:
 *         description: Invalid result data or result already submitted for this card
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Test session not found
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
router.post('/:sessionId/results', validateParams(CommonParams.sessionId), validateBody(TestResultSubmissionSchema), withAuth(TestSessionController.submitTestResult));

export default router; 