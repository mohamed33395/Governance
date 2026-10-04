import { z } from 'zod';

export const reviewSchema = z.object({
  name: z.string().min(1, 'required').max(191),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(191).optional().or(z.literal('')),
  comment: z.string().min(1, 'required').max(2000),
});
export type ReviewValues = z.infer<typeof reviewSchema>;
