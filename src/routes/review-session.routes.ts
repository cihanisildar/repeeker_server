import { Router } from 'express';
import { ReviewSessionController } from '../controllers/review-session.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';

const router = Router();

router.use(authMiddleware);

// Create a new review session
router.post('/', withAuth(ReviewSessionController.createReviewSession));

// Complete a review session
router.patch('/', withAuth(ReviewSessionController.completeReviewSession));

// Get all review sessions for the current user
router.get('/', withAuth(ReviewSessionController.getReviewSessions));

export default router; 