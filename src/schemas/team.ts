import { z } from 'zod';

export const teamMemberSchema = z.object({
  name: z.string().min(1, 'required').max(191),
  job_title: z.string().min(1, 'required').max(191),
  experience_years: z.coerce.number().int('invalidYears').min(0, 'invalidYears').max(60, 'invalidYears'),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});
export type TeamMemberValues = z.input<typeof teamMemberSchema>;
