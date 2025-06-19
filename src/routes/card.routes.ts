import { Router } from 'express';
import { CardController } from '../controllers/card.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';
import multer from 'multer';

const router = Router();
const upload = multer();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Define routes
router.post('/', withAuth(CardController.createCard));
router.get('/', withAuth(CardController.getCards));
router.get('/today', withAuth(CardController.getTodayCards));
router.get('/stats', withAuth(CardController.getStats));
router.get('/upcoming', withAuth(CardController.getUpcomingCards));
router.get('/history', withAuth(CardController.getReviewHistory));
router.post('/add-to-review', withAuth(CardController.addToReview));
router.post('/review', withAuth(CardController.reviewCard));
router.get('/:id', withAuth(CardController.getCard));
router.put('/:id', withAuth(CardController.updateCard));
router.delete('/:id', withAuth(CardController.deleteCard));
router.post('/:id/progress', withAuth(CardController.updateCardProgress));
router.post('/import', upload.single('file'), withAuth(CardController.importCards));

export default router; 