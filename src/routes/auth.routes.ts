import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '@/utils/express';

const router = Router();

// Test route to verify auth routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working', timestamp: new Date().toISOString() });
});

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/oauth', AuthController.oauthLogin);
router.post('/sync-google-user', AuthController.syncGoogleUser);
router.get('/test-google-user', AuthController.testGoogleUserCreate);
router.get('/me', withAuth(AuthController.getCurrentUser));
router.get('/test-db', AuthController.testDatabase);
router.get('/debug-token', AuthController.debugToken);
router.get('/check-secrets', AuthController.checkSecrets);

export default router; 