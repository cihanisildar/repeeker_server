import { userSettingsRepository } from '../repositories/user-settings.repository';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middlewares/error.middleware';
import { createModuleLogger } from '../utils/logger';
import { UserSettingsUpdate } from '../schemas/user-settings.schemas';

const userSettingsLogger = createModuleLogger('USER_SETTINGS');

export const userSettingsService = {
  async getUserSettings(userId: string) {
    userSettingsLogger.info('Getting user settings', { userId });
    
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        userSettingsLogger.warn('User not found for settings retrieval', { userId });
        throw new AppError(404, 'User not found');
      }

      // Get settings or create default ones
      let settings = await userSettingsRepository.findByUserId(userId);
      
      if (!settings) {
        userSettingsLogger.info('Creating default settings for user', { userId });
        settings = await userSettingsRepository.create(userId, {
          emailNotifications: true,
          reviewReminders: true,
          publicProfile: false,
          shareStatistics: false,
        });
      }

      userSettingsLogger.info('User settings retrieved successfully', { userId, settingsId: settings.id });
      
      // Return only the settings fields without metadata
      return {
        emailNotifications: settings.emailNotifications,
        reviewReminders: settings.reviewReminders,
        publicProfile: settings.publicProfile,
        shareStatistics: settings.shareStatistics,
      };
    } catch (error) {
      userSettingsLogger.error('Failed to get user settings', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async updateUserSettings(userId: string, updateData: UserSettingsUpdate) {
    userSettingsLogger.info('Updating user settings', { 
      userId, 
      updateFields: Object.keys(updateData) 
    });
    
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        userSettingsLogger.warn('User not found for settings update', { userId });
        throw new AppError(404, 'User not found');
      }

      // Upsert settings (create if doesn't exist, update if exists)
      const settings = await userSettingsRepository.upsert(userId, updateData);

      userSettingsLogger.info('User settings updated successfully', { 
        userId, 
        settingsId: settings.id,
        updatedFields: Object.keys(updateData)
      });

      // Return only the settings fields without metadata
      return {
        emailNotifications: settings.emailNotifications,
        reviewReminders: settings.reviewReminders,
        publicProfile: settings.publicProfile,
        shareStatistics: settings.shareStatistics,
      };
    } catch (error) {
      userSettingsLogger.error('Failed to update user settings', { 
        userId,
        updateFields: Object.keys(updateData),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async deleteUserSettings(userId: string) {
    userSettingsLogger.info('Deleting user settings', { userId });
    
    try {
      // Check if user exists
      const user = await userRepository.findById(userId);
      if (!user) {
        userSettingsLogger.warn('User not found for settings deletion', { userId });
        throw new AppError(404, 'User not found');
      }

      // Delete settings if they exist
      const settings = await userSettingsRepository.findByUserId(userId);
      if (settings) {
        await userSettingsRepository.delete(userId);
        userSettingsLogger.info('User settings deleted successfully', { userId });
      } else {
        userSettingsLogger.info('No settings found to delete', { userId });
      }

      return { message: 'User settings deleted successfully' };
    } catch (error) {
      userSettingsLogger.error('Failed to delete user settings', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}; 