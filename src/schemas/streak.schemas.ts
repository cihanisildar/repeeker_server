import { z } from 'zod';

// Streak schemas
export const StreakUpdateSchema = z.object({
  activityType: z.enum(['review', 'test']),
  force: z.boolean().default(false),
});

// Type exports
export type StreakUpdate = z.infer<typeof StreakUpdateSchema>; 