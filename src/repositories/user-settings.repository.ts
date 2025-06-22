import prisma from '../lib/prisma';
import { UserSettings } from '@prisma/client';
import { createModuleLogger } from '../utils/logger';

const userSettingsRepositoryLogger = createModuleLogger('UserSettingsRepository');

export const userSettingsRepository = {
  async findByUserId(userId: string): Promise<UserSettings | null> {
    userSettingsRepositoryLogger.debug('Finding user settings by user ID', { userId });
    
    try {
      const settings = await prisma.userSettings.findUnique({
        where: { userId },
      });
      
      userSettingsRepositoryLogger.debug('User settings lookup result', { 
        userId, 
        found: !!settings,
        settingsId: settings?.id 
      });
      
      return settings;
    } catch (error) {
      userSettingsRepositoryLogger.error('Failed to find user settings by user ID', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async create(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    userSettingsRepositoryLogger.debug('Creating user settings', { 
      userId,
      fields: Object.keys(data)
    });
    
    try {
      const settings = await prisma.userSettings.create({
        data: {
          userId,
          ...data,
        },
      });
      
      userSettingsRepositoryLogger.info('Successfully created user settings', { 
        userId,
        settingsId: settings.id
      });
      
      return settings;
    } catch (error) {
      userSettingsRepositoryLogger.error('Failed to create user settings', { 
        userId,
        fields: Object.keys(data),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async update(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    userSettingsRepositoryLogger.debug('Updating user settings', { 
      userId,
      fields: Object.keys(data)
    });
    
    try {
      const settings = await prisma.userSettings.update({
        where: { userId },
        data,
      });
      
      userSettingsRepositoryLogger.info('Successfully updated user settings', { 
        userId,
        settingsId: settings.id,
        updatedFields: Object.keys(data)
      });
      
      return settings;
    } catch (error) {
      userSettingsRepositoryLogger.error('Failed to update user settings', { 
        userId,
        fields: Object.keys(data),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async upsert(userId: string, data: Partial<UserSettings>): Promise<UserSettings> {
    userSettingsRepositoryLogger.debug('Upserting user settings', { 
      userId,
      fields: Object.keys(data)
    });
    
    try {
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          ...data,
        },
      });
      
      userSettingsRepositoryLogger.info('Successfully upserted user settings', { 
        userId,
        settingsId: settings.id
      });
      
      return settings;
    } catch (error) {
      userSettingsRepositoryLogger.error('Failed to upsert user settings', { 
        userId,
        fields: Object.keys(data),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async delete(userId: string): Promise<UserSettings> {
    userSettingsRepositoryLogger.debug('Deleting user settings', { userId });
    
    try {
      const settings = await prisma.userSettings.delete({
        where: { userId },
      });
      
      userSettingsRepositoryLogger.warn('Successfully deleted user settings', { 
        userId,
        settingsId: settings.id
      });
      
      return settings;
    } catch (error) {
      userSettingsRepositoryLogger.error('Failed to delete user settings', { 
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },
}; 