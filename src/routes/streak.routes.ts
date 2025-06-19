import { Router } from 'express';
import { StreakController } from '../controllers/streak.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';

const router = Router();

router.use(authMiddleware);

router.get('/', withAuth(StreakController.getStreak));
router.post('/', withAuth(StreakController.updateStreak));

export default router; 