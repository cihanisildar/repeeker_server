import { z } from 'zod';

// WordDetails schemas
export const WordDetailsCreateSchema = z.object({
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  examples: z.array(z.string()).default([]),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export const WordDetailsUpdateSchema = WordDetailsCreateSchema.partial();

// Type exports
export type WordDetailsCreate = z.infer<typeof WordDetailsCreateSchema>;
export type WordDetailsUpdate = z.infer<typeof WordDetailsUpdateSchema>; 