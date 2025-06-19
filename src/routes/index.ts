import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import authRoutes from './auth.routes';
import wordListRoutes from './word-list.routes';
import cardRoutes from './card.routes';
import testSessionRoutes from './test-session.routes';
import testHistoryRoutes from './test-history.routes';
import streakRoutes from './streak.routes';
import reviewSessionRoutes from './review-session.routes';
import reviewScheduleRoutes from './review-schedule.routes';

const router = Router();

// User routes
router.post('/users', userController.createUser);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Other routes
router.use('/auth', authRoutes);
router.use('/lists', wordListRoutes);
router.use('/cards', cardRoutes);
router.use('/test-sessions', testSessionRoutes);
router.use('/test-history', testHistoryRoutes);
router.use('/streak', streakRoutes);
router.use('/review-session', reviewSessionRoutes);
router.use('/review-schedule', reviewScheduleRoutes);

export default router; 