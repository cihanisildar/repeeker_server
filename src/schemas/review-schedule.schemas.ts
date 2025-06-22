import { z } from 'zod';

// ReviewSchedule schemas
export const ReviewScheduleCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').default('Default Schedule'),
  description: z.string().max(500, 'Description too long').optional(),
  intervals: z.array(z.number().positive()).min(1, 'At least one interval is required').default([1, 7, 30, 365]),
  isDefault: z.boolean().default(true),
});

export const ReviewScheduleUpdateSchema = ReviewScheduleCreateSchema.partial();

// Type exports
export type ReviewScheduleCreate = z.infer<typeof ReviewScheduleCreateSchema>;
export type ReviewScheduleUpdate = z.infer<typeof ReviewScheduleUpdateSchema>; 