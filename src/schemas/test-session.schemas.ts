import { z } from 'zod';
import { IdSchema, PaginationSchema, TestResultSchema } from './common.schemas';

export const TestSessionCreateSchema = z.object({
  cardIds: z.array(IdSchema).min(1, 'At least one card is required'),
});

export const TestSessionCompleteSchema = z.object({
  results: z.array(TestResultSchema).min(1, 'At least one result is required'),
});

// Single test result submission schema
export const TestResultSubmissionSchema = z.object({
  cardId: IdSchema,
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0, 'Time spent must be positive'),
  userAnswer: z.string().optional(),
});

// Test history schemas
export const TestHistoryQuerySchema = PaginationSchema.extend({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Type exports
export type TestSessionCreate = z.infer<typeof TestSessionCreateSchema>;
export type TestSessionComplete = z.infer<typeof TestSessionCompleteSchema>;
export type TestResultSubmission = z.infer<typeof TestResultSubmissionSchema>;
export type TestHistoryQuery = z.infer<typeof TestHistoryQuerySchema>; 