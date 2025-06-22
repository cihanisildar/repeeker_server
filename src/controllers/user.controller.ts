import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { AppError } from '../middlewares/error.middleware';
import { createModuleLogger } from '../utils/logger';
import { sendResponse } from '../utils/response';

const userControllerLogger = createModuleLogger('USER_CONTROLLER');

export const userController = {
  async createUser(req: Request, res: Response) {
    const { email, password, name } = req.body;
    userControllerLogger.info('Create user request received', { email, hasName: !!name });
    
    try {
      const user = await userService.createUser(req.body);
      userControllerLogger.info('User created successfully', { userId: user.id, email });
      return sendResponse(res, user, 'success', 'User created successfully', 201);
    } catch (error) {
      userControllerLogger.error('Failed to create user', { 
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof AppError) {
        return sendResponse(res, null, 'error', error.message, error.statusCode);
      }
      
      return sendResponse(res, null, 'error', 'Failed to create user', 500);
    }
  },

  async getUserById(req: Request, res: Response) {
    const { id } = req.params;
    userControllerLogger.debug('Get user by ID request received', { userId: id });
    
    try {
      const user = await userService.getUserById(id);
      
      if (!user) {
        userControllerLogger.warn('User not found', { userId: id });
        return sendResponse(res, null, 'error', 'User not found', 404);
      }
      
      userControllerLogger.debug('User retrieved successfully', { userId: id });
      return sendResponse(res, user, 'success', 'User retrieved successfully');
    } catch (error) {
      userControllerLogger.error('Failed to get user by ID', { 
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof AppError) {
        return sendResponse(res, null, 'error', error.message, error.statusCode);
      }
      
      return sendResponse(res, null, 'error', 'Failed to get user', 500);
    }
  },

  async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const updateData = req.body;
    userControllerLogger.info('Update user request received', { 
      userId: id, 
      updateFields: Object.keys(updateData) 
    });
    
    try {
      const user = await userService.updateUser(id, updateData);
      
      if (!user) {
        userControllerLogger.warn('User not found for update', { userId: id });
        return sendResponse(res, null, 'error', 'User not found', 404);
      }
      
      userControllerLogger.info('User updated successfully', { userId: id });
      return sendResponse(res, user, 'success', 'User updated successfully');
    } catch (error) {
      userControllerLogger.error('Failed to update user', { 
        userId: id,
        updateFields: Object.keys(updateData),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof AppError) {
        return sendResponse(res, null, 'error', error.message, error.statusCode);
      }
      
      return sendResponse(res, null, 'error', 'Failed to update user', 500);
    }
  },

  async deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    userControllerLogger.info('Delete user request received', { userId: id });
    
    try {
      await userService.deleteUser(id);
      userControllerLogger.info('User deleted successfully', { userId: id });
      return sendResponse(res, null, 'success', 'User deleted successfully', 204);
    } catch (error) {
      userControllerLogger.error('Failed to delete user', { 
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof AppError) {
        return sendResponse(res, null, 'error', error.message, error.statusCode);
      }
      
      return sendResponse(res, null, 'error', 'Failed to delete user', 500);
    }
  }
}; 