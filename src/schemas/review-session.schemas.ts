import { z } from 'zod';
import { IdSchema, PaginationSchema, TestResultSchema } from './common.schemas';

// ReviewSession schemas
export const ReviewSessionCreateSchema = z.object({
  mode: z.enum(['flashcard', 'multiple-choice']),
  cardIds: z.array(IdSchema).min(1, 'At least one card is required'),
  isRepeat: z.boolean().default(false),
});

export const ReviewSessionUpdateSchema = z.object({
  sessionId: IdSchema,
  completedAt: z.date().optional(),
  cards: z.any().optional(), // JSON field, can be more specific based on your needs
  results: z.array(TestResultSchema).optional(),
});

export const ReviewSessionQuerySchema = PaginationSchema.extend({
  completed: z.coerce.boolean().optional(),
});

// Type exports
export type ReviewSessionCreate = z.infer<typeof ReviewSessionCreateSchema>;
export type ReviewSessionUpdate = z.infer<typeof ReviewSessionUpdateSchema>;
export type ReviewSessionQuery = z.infer<typeof ReviewSessionQuerySchema>; 