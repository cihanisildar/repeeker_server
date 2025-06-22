import { Router } from 'express';
import { ReviewScheduleController } from '../controllers/review-schedule.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';
import { validateBody } from '../middlewares/validation.middleware';
import { ReviewScheduleCreateSchema } from '../schemas';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/review-schedule:
 *   get:
 *     tags: [Review Schedule]
 *     summary: Get user's review schedule
 *     description: Retrieve the current review schedule configuration for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Review schedule configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewSchedule'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No review schedule found (will use default)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', withAuth(ReviewScheduleController.getSchedule));

/**
 * @swagger
 * /api/review-schedule:
 *   post:
 *     tags: [Review Schedule]
 *     summary: Create or update review schedule
 *     description: Create a new review schedule or update an existing one for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               intervals:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 3, 7, 14, 30, 90, 365]
 *                 description: Array of review intervals in days
 *               name:
 *                 type: string
 *                 example: "Custom Spaced Repetition"
 *                 description: Name for the schedule
 *               description:
 *                 type: string
 *                 example: "Optimized schedule for vocabulary learning"
 *                 description: Description of the schedule
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is the default schedule
 *     responses:
 *       200:
 *         description: Review schedule created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewSchedule'
 *       400:
 *         description: Invalid schedule data
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
router.post('/', validateBody(ReviewScheduleCreateSchema), withAuth(ReviewScheduleController.upsertSchedule));

export default router; 