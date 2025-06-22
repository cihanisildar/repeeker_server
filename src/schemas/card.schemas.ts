import { z } from 'zod';
import { IdSchema, PaginationSchema } from './common.schemas';

// Card-specific enums
export const ReviewStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'PAUSED']);

// Card schemas
export const CardCreateSchema = z.object({
  word: z.string().min(1, 'Word is required').max(100, 'Word too long'),
  definition: z.string().min(1, 'Definition is required').max(1000, 'Definition too long'),
  wordListId: IdSchema.optional(),
});

export const CardUpdateSchema = z.object({
  word: z.string().min(1, 'Word is required').max(100, 'Word too long').optional(),
  definition: z.string().min(1, 'Definition is required').max(1000, 'Definition too long').optional(),
  wordListId: IdSchema.optional(),
  reviewStatus: ReviewStatusSchema.optional(),
}).partial();

export const CardResponseSchema = z.object({
  id: IdSchema,
  word: z.string(),
  definition: z.string(),
  reviewStatus: ReviewStatusSchema,
  viewCount: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  lastReviewed: z.date().nullable(),
  nextReview: z.date(),
  reviewStep: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: IdSchema,
  wordListId: IdSchema.nullable(),
});

// Query schemas
export const CardQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  wordListId: IdSchema.optional(),
  reviewStatus: ReviewStatusSchema.optional(),
});

// Type exports
export type CardCreate = z.infer<typeof CardCreateSchema>;
export type CardUpdate = z.infer<typeof CardUpdateSchema>;
export type CardResponse = z.infer<typeof CardResponseSchema>;
export type CardQuery = z.infer<typeof CardQuerySchema>; 