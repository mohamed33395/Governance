import { z } from 'zod';
import { email, phone } from './shared';

export const joinRequestSchema = z.object({
  name: z.string().min(1, 'required').max(191),
  email,
  phone,
  specialization: z.string().min(1, 'required').max(191),
  bio: z.string().max(5000).optional().or(z.literal('')),
  linkedin_url: z.string().max(500).optional().or(z.literal('')),
});
export type JoinRequestValues = z.infer<typeof joinRequestSchema>;
