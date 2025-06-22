import { z } from 'zod';

// User settings schemas
export const UserSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  reviewReminders: z.boolean().default(true),
  publicProfile: z.boolean().default(false),
  shareStatistics: z.boolean().default(false),
});

export const UserSettingsUpdateSchema = UserSettingsSchema.partial();

export const UserSettingsResponseSchema = z.object({
  emailNotifications: z.boolean(),
  reviewReminders: z.boolean(),
  publicProfile: z.boolean(),
  shareStatistics: z.boolean(),
});

// Type exports
export type UserSettings = z.infer<typeof UserSettingsSchema>;
export type UserSettingsUpdate = z.infer<typeof UserSettingsUpdateSchema>;
export type UserSettingsResponse = z.infer<typeof UserSettingsResponseSchema>; 