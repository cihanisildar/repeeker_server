import { Router } from 'express';
import { TestSessionController } from '../controllers/test-session.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';

const router = Router();

router.use(authMiddleware);

router.get('/', withAuth(TestSessionController.getTestHistory));

export default router; 