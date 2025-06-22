import { z } from 'zod';
import { IdSchema, PaginationSchema } from './common.schemas';

// WordList schemas
export const WordListCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean().default(false),
});

export const WordListUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean().optional(),
}).partial();

export const WordListResponseSchema = z.object({
  id: IdSchema,
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: IdSchema,
  _count: z.object({
    cards: z.number(),
  }).optional(),
});

// Query schemas
export const WordListQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// Type exports
export type WordListCreate = z.infer<typeof WordListCreateSchema>;
export type WordListUpdate = z.infer<typeof WordListUpdateSchema>;
export type WordListResponse = z.infer<typeof WordListResponseSchema>;
export type WordListQuery = z.infer<typeof WordListQuerySchema>; 