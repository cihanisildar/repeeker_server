import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middlewares/error.middleware';
import { createModuleLogger } from '../utils/logger';
import bcrypt from 'bcryptjs';

const userLogger = createModuleLogger('USER');

export const userService = {
  async createUser(userData: { email: string; password: string; firstName?: string; lastName?: string }) {
    userLogger.info('Creating new user', { email: userData.email, hasFirstName: !!userData.firstName, hasLastName: !!userData.lastName });
    
    try {
      const existingUser = await userRepository.findByEmail(userData.email);
      if (existingUser) {
        userLogger.warn('User creation failed - email already exists', { email: userData.email });
        throw new AppError(400, 'Email already exists');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await userRepository.create({
        ...userData,
        password: hashedPassword,
      });

      userLogger.info('User created successfully', { userId: user.id, email: userData.email });
      return user;
    } catch (error) {
      userLogger.error('Failed to create user', { 
        email: userData.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async getUserById(id: string) {
    userLogger.debug('Fetching user by ID', { userId: id });
    
    try {
      const user = await userRepository.findById(id);
      if (user) {
        userLogger.debug('User found', { userId: id });
      } else {
        userLogger.warn('User not found', { userId: id });
      }
      return user;
    } catch (error) {
      userLogger.error('Failed to fetch user by ID', { 
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async updateUser(id: string, userData: Partial<{ email: string; firstName: string; lastName: string }>) {
    userLogger.info('Updating user', { userId: id, updateFields: Object.keys(userData) });
    
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        userLogger.warn('User update failed - user not found', { userId: id });
        throw new AppError(404, 'User not found');
      }

      if (userData.email) {
        const existingUser = await userRepository.findByEmail(userData.email);
        if (existingUser && existingUser.id !== id) {
          userLogger.warn('User update failed - email already exists', { userId: id, email: userData.email });
          throw new AppError(400, 'Email already exists');
        }
      }

      const updatedUser = await userRepository.update(id, userData);
      userLogger.info('User updated successfully', { userId: id });
      return updatedUser;
    } catch (error) {
      userLogger.error('Failed to update user', { 
        userId: id,
        updateFields: Object.keys(userData),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  async deleteUser(id: string) {
    userLogger.info('Deleting user', { userId: id });
    
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        userLogger.warn('User deletion failed - user not found', { userId: id });
        throw new AppError(404, 'User not found');
      }

      const result = await userRepository.delete(id);
      userLogger.info('User deleted successfully', { userId: id });
      return result;
    } catch (error) {
      userLogger.error('Failed to delete user', { 
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}; 