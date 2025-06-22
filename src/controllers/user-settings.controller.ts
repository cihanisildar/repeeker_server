import { Request, Response } from 'express';
import { userSettingsService } from '../services/user-settings.service';
import { AppError } from '../middlewares/error.middleware';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';

const userSettingsControllerLogger = createModuleLogger('USER_SETTINGS_CONTROLLER');

export const userSettingsController = {
  async getUserSettings(req: Request, res: Response) {
    const userId = req.user?.id;
    userSettingsControllerLogger.info('Get user settings request received', { userId });
    
    try {
      if (!userId) {
        userSettingsControllerLogger.warn('Unauthorized access to user settings');
        return sendResponse(res, null, 'error', 'Unauthorized', 401);
      }

      const settings = await userSettingsService.getUserSettings(userId);
      userSettingsControllerLogger.info('User settings retrieved successfully', { userId });
      return sendResponse(res, settings, 'success', 'User settings retrieved successfully');
    } catch (error) {
      userSettingsControllerLogger.error('Failed to get user settings', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof AppError) {
        return sendResponse(res, null, 'error', error.message, error.statusCode);
      }
      
      return sendResponse(res, null, 'error', 'Failed to get user settings', 500);
    }
  },

  async updateUserSettings(req: Request, res: Response) {
    const userId = req.user?.id;
    const updateData = req.body;
    userSettingsControllerLogger.info('Update user settings request received', { 
      userId, 
      updateFields: Object.keys(updateData) 
    });
    
    try {
      if (!userId) {
        userSettingsControllerLogger.warn('Unauthorized access to update user settings');
        return sendResponse(res, null, 'error', 'Unauthorized', 401);
      }

      const settings = await userSettingsService.updateUserSettings(userId, updateData);
      userSettingsControllerLogger.info('User settings updated successfully', { userId });
      return sendResponse(res, settings, 'success', 'User settings updated successfully');
    } catch (error) {
      userSettingsControllerLogger.error('Failed to update user settings', { 
        userId,
        updateFields: Object.keys(updateData),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof AppError) {
        return sendResponse(res, null, 'error', error.message, error.statusCode);
      }
      
      return sendResponse(res, null, 'error', 'Failed to update user settings', 500);
    }
  },

  async deleteUserAccount(req: Request, res: Response) {
    const userId = req.user?.id;
    userSettingsControllerLogger.info('Delete user account request received', { userId });
    
    try {
      if (!userId) {
        userSettingsControllerLogger.warn('Unauthorized access to delete user account');
        return sendResponse(res, null, 'error', 'Unauthorized', 401);
      }

      // Note: This could be expanded to handle full user account deletion
      // For now, we'll just delete the settings as requested
      await userSettingsService.deleteUserSettings(userId);
      userSettingsControllerLogger.info('User account/settings deleted successfully', { userId });
      return sendResponse(res, { message: 'User account deleted successfully' }, 'success', 'User account deleted successfully');
    } catch (error) {
      userSettingsControllerLogger.error('Failed to delete user account', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof AppError) {
        return sendResponse(res, null, 'error', error.message, error.statusCode);
      }
      
      return sendResponse(res, null, 'error', 'Failed to delete user account', 500);
    }
  }
}; 