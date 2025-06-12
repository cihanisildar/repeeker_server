import { Router } from 'express';
import { WordListController } from '../controllers/word-list.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';

const router = Router();

router.use(authMiddleware);

router.post('/', withAuth(WordListController.createWordList));
router.get('/', withAuth(WordListController.getWordLists));
router.get('/:id', withAuth(WordListController.getWordList));
router.put('/:id', withAuth(WordListController.updateWordList));
router.delete('/:id', withAuth(WordListController.deleteWordList));

export default router; 