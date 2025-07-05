import { z } from 'zod';
import { IdSchema, EmailSchema, NameSchema } from './common.schemas';

// User schemas
export const UserCreateSchema = z.object({
  firstName: NameSchema.optional(),
  lastName: NameSchema.optional(),
  email: EmailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  image: z.string().url().optional(),
});

export const UserUpdateSchema = z.object({
  firstName: NameSchema.optional(),
  lastName: NameSchema.optional(),
  email: EmailSchema.optional(),
  image: z.string().url().optional(),
}).partial();

export const UserResponseSchema = z.object({
  id: IdSchema,
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  image: z.string().nullable(),
  currentStreak: z.number(),
  longestStreak: z.number(),
  lastTestDate: z.date().nullable(),
  lastReviewDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Type exports
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>; 