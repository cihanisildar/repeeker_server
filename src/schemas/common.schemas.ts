import { z } from 'zod';

// Common validation schemas
export const IdSchema = z.string().cuid();
export const EmailSchema = z.string().email();
export const PasswordSchema = z.string().min(6, 'Password must be at least 6 characters');
export const NameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long');

// Shared result schema (used by both test and review sessions)
export const TestResultSchema = z.object({
  cardId: IdSchema,
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0, 'Time spent must be positive'),
});

// Pagination schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Bulk operations schemas
export const BulkDeleteSchema = z.object({
  ids: z.array(IdSchema).min(1, 'At least one ID is required'),
});

export const FileUploadSchema = z.object({
  file: z.any(), // Will be validated by multer
});

// Response wrapper schemas
export const SuccessResponseSchema = z.object({
  status: z.literal('success'),
  message: z.string(),
  data: z.any(),
});

export const ErrorResponseSchema = z.object({
  status: z.literal('error'),
  message: z.string(),
  errors: z.array(z.string()).optional(),
});

export const PaginatedResponseSchema = z.object({
  status: z.literal('success'),
  message: z.string(),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Type exports
export type TestResult = z.infer<typeof TestResultSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type BulkDelete = z.infer<typeof BulkDeleteSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type PaginatedResponse = z.infer<typeof PaginatedResponseSchema>; 