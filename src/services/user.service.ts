import { userRepository } from '../repositories/user.repository';
import { AppError } from '../middlewares/error.middleware';
import bcrypt from 'bcryptjs';

export const userService = {
  async createUser(userData: { email: string; password: string; name?: string }) {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError(400, 'Email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return userRepository.create({
      ...userData,
      password: hashedPassword,
    });
  },

  async getUserById(id: string) {
    return userRepository.findById(id);
  },

  async updateUser(id: string, userData: Partial<{ email: string; name: string }>) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (userData.email) {
      const existingUser = await userRepository.findByEmail(userData.email);
      if (existingUser && existingUser.id !== id) {
        throw new AppError(400, 'Email already exists');
      }
    }

    return userRepository.update(id, userData);
  },

  async deleteUser(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return userRepository.delete(id);
  }
}; 