import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';

export const authService = {
  async register(data: {
    name?: string;
    email: string;
    password: string;
  }) {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new AppError(400, 'User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  },

  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);

    if (!user || !user.password) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image
    };
  },

  async getCurrentUser(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  },
}; 