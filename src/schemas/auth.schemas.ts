import { z } from 'zod';
import { EmailSchema, NameSchema, PasswordSchema } from './common.schemas';

// Auth schemas
export const RegisterSchema = z.object({
  firstName: NameSchema.optional(),
  lastName: NameSchema.optional(),
  email: EmailSchema,
  password: PasswordSchema,
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const OAuthLoginSchema = z.object({
  email: EmailSchema,
  firstName: NameSchema.optional(),
  lastName: NameSchema.optional(),
  image: z.string().url().optional(),
  provider: z.string().min(1, 'Provider is required'),
  providerId: z.string().min(1, 'Provider ID is required'),
});

export const GoogleUserSyncSchema = z.object({
  id: z.string().min(1, 'Google ID is required'),
  email: EmailSchema,
  firstName: NameSchema.optional(),
  lastName: NameSchema.optional(),
  image: z.string().url().optional(),
});

// Type exports
export type Register = z.infer<typeof RegisterSchema>;
export type Login = z.infer<typeof LoginSchema>;
export type OAuthLogin = z.infer<typeof OAuthLoginSchema>;
export type GoogleUserSync = z.infer<typeof GoogleUserSyncSchema>; 