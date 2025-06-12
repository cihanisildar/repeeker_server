import { Router } from 'express';
import { TestSessionController } from '../controllers/test-session.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';

const router = Router();

router.use(authMiddleware);

router.post('/', withAuth(TestSessionController.createTestSession));
router.get('/', withAuth(TestSessionController.getTestSessions));
router.get('/:id', withAuth(TestSessionController.getTestSession));
router.post('/:sessionId/results', withAuth(TestSessionController.submitTestResult));

export default router; 