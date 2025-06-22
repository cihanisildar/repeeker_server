import { Router } from 'express';
import { CardController } from '../controllers/card.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';
import multer from 'multer';
import { validateBody, validateQuery, validateParams, CommonParams } from '../middlewares/validation.middleware';
import { 
  CardCreateSchema, 
  CardUpdateSchema, 
  CardQuerySchema
} from '../schemas';

const router = Router();
const upload = multer();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/cards:
 *   post:
 *     tags: [Cards]
 *     summary: Create a new card
 *     description: Create a new flashcard for learning
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - word
 *               - definition
 *             properties:
 *               word:
 *                 type: string
 *                 example: "ubiquitous"
 *               definition:
 *                 type: string
 *                 example: "existing or being everywhere at the same time"
 *               wordListId:
 *                 type: string
 *                 example: "clp2h0001000008l7d8h9g2k1"
 *     responses:
 *       201:
 *         description: Card created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Card'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validateBody(CardCreateSchema), withAuth(CardController.createCard));

/**
 * @swagger
 * /api/cards:
 *   get:
 *     tags: [Cards]
 *     summary: Get user's cards
 *     description: Retrieve all cards belonging to the authenticated user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: wordListId
 *         schema:
 *           type: string
 *         description: Filter cards by word list ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of cards to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of cards to skip
 *     responses:
 *       200:
 *         description: List of cards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Card'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validateQuery(CardQuerySchema), withAuth(CardController.getCards));

/**
 * @swagger
 * /api/cards/today:
 *   get:
 *     tags: [Cards]
 *     summary: Get today's cards for review
 *     description: Retrieve cards scheduled for review today
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Today's cards for review
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Card'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/today', withAuth(CardController.getTodayCards));

/**
 * @swagger
 * /api/cards/stats:
 *   get:
 *     tags: [Cards]
 *     summary: Get card statistics
 *     description: Retrieve statistics about user's cards and learning progress
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Card statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCards:
 *                   type: integer
 *                   example: 150
 *                 cardsToReview:
 *                   type: integer
 *                   example: 25
 *                 completedCards:
 *                   type: integer
 *                   example: 75
 *                 successRate:
 *                   type: number
 *                   format: float
 *                   example: 0.75
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', withAuth(CardController.getStats));

/**
 * @swagger
 * /api/cards/upcoming:
 *   get:
 *     tags: [Cards]
 *     summary: Get upcoming cards for review
 *     description: Retrieve cards scheduled for future review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to look ahead
 *     responses:
 *       200:
 *         description: Upcoming cards for review
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Card'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/upcoming', withAuth(CardController.getUpcomingCards));

/**
 * @swagger
 * /api/cards/history:
 *   get:
 *     tags: [Cards]
 *     summary: Get review history
 *     description: Retrieve the user's card review history
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of history entries to return
 *     responses:
 *       200:
 *         description: Review history
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   cardId:
 *                     type: string
 *                   isSuccess:
 *                     type: boolean
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/history', withAuth(CardController.getReviewHistory));

/**
 * @swagger
 * /api/cards/add-to-review:
 *   post:
 *     tags: [Cards]
 *     summary: Add cards to review
 *     description: Add specific cards to the review queue
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardIds
 *             properties:
 *               cardIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["clp2h0001000008l7d8h9g2k1", "clp2h0001000008l7d8h9g2k2"]
 *     responses:
 *       200:
 *         description: Cards added to review successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Invalid card IDs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/add-to-review', withAuth(CardController.addToReview));

/**
 * @swagger
 * /api/cards/review:
 *   post:
 *     tags: [Cards]
 *     summary: Submit card review
 *     description: Submit a review result for a card
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardId
 *               - isSuccess
 *             properties:
 *               cardId:
 *                 type: string
 *                 example: "clp2h0001000008l7d8h9g2k1"
 *               isSuccess:
 *                 type: boolean
 *                 example: true
 *               timeSpent:
 *                 type: integer
 *                 description: Time spent in milliseconds
 *                 example: 5000
 *     responses:
 *       200:
 *         description: Review submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Review submitted successfully"
 *                 nextReview:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid review data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/review', withAuth(CardController.reviewCard));

/**
 * @swagger
 * /api/cards/{id}:
 *   get:
 *     tags: [Cards]
 *     summary: Get a specific card
 *     description: Retrieve a card by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     responses:
 *       200:
 *         description: Card details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Card'
 *       404:
 *         description: Card not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /api/cards/available:
 *   get:
 *     tags: [Cards]
 *     summary: Get available cards for a word list
 *     description: Retrieve cards that are not already in the specified word list and can be added to it
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: wordListId
 *         required: true
 *         schema:
 *           type: string
 *         description: Word list ID to exclude cards from
 *     responses:
 *       200:
 *         description: Available cards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Card'
 *       400:
 *         description: Missing wordListId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/available', withAuth(CardController.getAvailableCards));

router.get('/:id', validateParams(CommonParams.id), withAuth(CardController.getCard));

/**
 * @swagger
 * /api/cards/{id}:
 *   put:
 *     tags: [Cards]
 *     summary: Update a card
 *     description: Update an existing card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               word:
 *                 type: string
 *                 example: "ubiquitous"
 *               definition:
 *                 type: string
 *                 example: "existing or being everywhere at the same time"
 *     responses:
 *       200:
 *         description: Card updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Card'
 *       404:
 *         description: Card not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', validateParams(CommonParams.id), validateBody(CardUpdateSchema), withAuth(CardController.updateCard));

/**
 * @swagger
 * /api/cards/{id}:
 *   delete:
 *     tags: [Cards]
 *     summary: Delete a card
 *     description: Delete an existing card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     responses:
 *       200:
 *         description: Card deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Card not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', validateParams(CommonParams.id), withAuth(CardController.deleteCard));

/**
 * @swagger
 * /api/cards/{id}/progress:
 *   post:
 *     tags: [Cards]
 *     summary: Update card progress
 *     description: Update the learning progress for a specific card
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               viewCount:
 *                 type: integer
 *                 example: 5
 *               successCount:
 *                 type: integer
 *                 example: 3
 *               failureCount:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Card progress updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardProgress'
 *       404:
 *         description: Card not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/progress', withAuth(CardController.updateCardProgress));

/**
 * @swagger
 * /api/cards/import:
 *   post:
 *     tags: [Cards]
 *     summary: Import cards from file
 *     description: Import multiple cards from an uploaded file (CSV, Excel)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or Excel file containing cards data
 *               wordListId:
 *                 type: string
 *                 description: Optional word list ID to associate imported cards
 *     responses:
 *       200:
 *         description: Cards imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cards imported successfully"
 *                 imported:
 *                   type: integer
 *                   example: 25
 *                 failed:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: Invalid file or file format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/import', upload.single('file'), withAuth(CardController.importCards));

export default router; 