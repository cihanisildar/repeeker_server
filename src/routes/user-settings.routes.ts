import { Router } from "express";
import { userSettingsController } from "../controllers/user-settings.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { UserSettingsUpdateSchema } from "../schemas/user-settings.schemas";

const router = Router();

// Apply authentication to all user settings routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/user/settings:
 *   get:
 *     tags: [User Settings]
 *     summary: Get user settings
 *     description: Retrieve current user's settings
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "User settings retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     emailNotifications:
 *                       type: boolean
 *                       example: true
 *                     reviewReminders:
 *                       type: boolean
 *                       example: true
 *                     publicProfile:
 *                       type: boolean
 *                       example: false
 *                     shareStatistics:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/settings", userSettingsController.getUserSettings);

/**
 * @swagger
 * /api/user/settings:
 *   put:
 *     tags: [User Settings]
 *     summary: Update user settings
 *     description: Update current user's settings
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *                 example: true
 *                 description: Enable/disable email notifications
 *               reviewReminders:
 *                 type: boolean
 *                 example: true
 *                 description: Enable/disable review reminders
 *               publicProfile:
 *                 type: boolean
 *                 example: false
 *                 description: Make profile public or private
 *               shareStatistics:
 *                 type: boolean
 *                 example: false
 *                 description: Allow sharing of statistics
 *     responses:
 *       200:
 *         description: User settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "User settings updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     emailNotifications:
 *                       type: boolean
 *                       example: true
 *                     reviewReminders:
 *                       type: boolean
 *                       example: true
 *                     publicProfile:
 *                       type: boolean
 *                       example: false
 *                     shareStatistics:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Invalid input
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
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/settings", validateBody(UserSettingsUpdateSchema), userSettingsController.updateUserSettings);

/**
 * @swagger
 * /api/user/delete:
 *   delete:
 *     tags: [User Settings]
 *     summary: Delete user account
 *     description: Delete current user's account and all associated data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "User account deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "User account deleted successfully"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/delete", userSettingsController.deleteUserAccount);

export default router; 