import { Router } from 'express';
import { WordListController } from '../controllers/word-list.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { withAuth } from '../utils/express';
import { validateBody, validateQuery, validateParams, CommonParams } from '../middlewares/validation.middleware';
import { 
  WordListCreateSchema, 
  WordListUpdateSchema, 
  WordListQuerySchema 
} from '../schemas';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/lists:
 *   post:
 *     tags: [Word Lists]
 *     summary: Create a new word list
 *     description: Create a new word list for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Vocabulary List"
 *               description:
 *                 type: string
 *                 example: "A collection of important words to learn"
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *     responses:
 *       201:
 *         description: Word list created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WordList'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validateBody(WordListCreateSchema), withAuth(WordListController.createWordList));

/**
 * @swagger
 * /api/lists:
 *   get:
 *     tags: [Word Lists]
 *     summary: Get user's word lists
 *     description: Retrieve all word lists belonging to the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of word lists
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WordList'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validateQuery(WordListQuerySchema), withAuth(WordListController.getWordLists));

/**
 * @swagger
 * /api/lists/{id}:
 *   get:
 *     tags: [Word Lists]
 *     summary: Get a specific word list
 *     description: Retrieve a word list by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Word list ID
 *     responses:
 *       200:
 *         description: Word list details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WordList'
 *       404:
 *         description: Word list not found
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
router.get('/:id', validateParams(CommonParams.id), withAuth(WordListController.getWordList));

/**
 * @swagger
 * /api/lists/{id}:
 *   put:
 *     tags: [Word Lists]
 *     summary: Update a word list
 *     description: Update an existing word list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Word list ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Vocabulary List"
 *               description:
 *                 type: string
 *                 example: "An updated collection of words"
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Word list updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WordList'
 *       404:
 *         description: Word list not found
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
router.put('/:id', validateParams(CommonParams.id), validateBody(WordListUpdateSchema), withAuth(WordListController.updateWordList));

/**
 * @swagger
 * /api/lists/{id}:
 *   delete:
 *     tags: [Word Lists]
 *     summary: Delete a word list
 *     description: Delete an existing word list
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Word list ID
 *     responses:
 *       200:
 *         description: Word list deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         description: Word list not found
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
router.delete('/:id', withAuth(WordListController.deleteWordList));

export default router; 