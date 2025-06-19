import { Router } from 'express';
import { ReviewScheduleController } from '../controllers/review-schedule.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';

const router = Router();

router.use(authMiddleware);

router.get('/', withAuth(ReviewScheduleController.getSchedule));
router.post('/', withAuth(ReviewScheduleController.upsertSchedule));

export default router; 