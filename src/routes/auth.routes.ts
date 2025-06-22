import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authRateLimit } from "../middlewares/rate-limit.middleware";
import { withAuth } from "@/utils/express";
import { validateBody, CommonParams, validateParams } from "../middlewares/validation.middleware";
import { 
  RegisterSchema, 
  LoginSchema, 
  OAuthLoginSchema, 
  GoogleUserSyncSchema 
} from "../schemas";

const router = Router();

/**
 * @swagger
 * /api/auth/test:
 *   get:
 *     tags: [Authentication]
 *     summary: Test auth routes
 *     description: Verify that authentication routes are working
 *     responses:
 *       200:
 *         description: Auth routes are working
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Auth routes are working"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get("/test", (req, res) => {
  res.json({
    message: "Auth routes are working",
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", authRateLimit, validateBody(RegisterSchema), AuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     description: Authenticate user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", authRateLimit, validateBody(LoginSchema), AuthController.login);

/**
 * @swagger
 * /api/auth/oauth:
 *   post:
 *     tags: [Authentication]
 *     summary: OAuth login
 *     description: Authenticate user via OAuth (Google)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: OAuth token from provider
 *     responses:
 *       200:
 *         description: OAuth login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid OAuth token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/oauth", authRateLimit, validateBody(OAuthLoginSchema), AuthController.oauthLogin);

/**
 * @swagger
 * /api/auth/sync-google-user:
 *   post:
 *     tags: [Authentication]
 *     summary: Sync Google user
 *     description: Synchronize Google user data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - googleToken
 *             properties:
 *               googleToken:
 *                 type: string
 *                 description: Google authentication token
 *     responses:
 *       200:
 *         description: Google user synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid Google token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/sync-google-user", authRateLimit, validateBody(GoogleUserSyncSchema), AuthController.syncGoogleUser);

/**
 * @swagger
 * /api/auth/test-google-user:
 *   get:
 *     tags: [Authentication]
 *     summary: Test Google user creation
 *     description: Test endpoint for Google user creation
 *     responses:
 *       200:
 *         description: Test successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.get("/test-google-user", AuthController.testGoogleUserCreate);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user
 *     description: Get the currently authenticated user's information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me", withAuth(AuthController.getCurrentUser));

export default router;
