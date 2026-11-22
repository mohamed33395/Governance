import { z } from 'zod';

export const certificateSchema = z.object({
  name: z.string().min(1, 'required').max(191),
  issuer: z.string().max(191, 'maxLength').optional().or(z.literal('')),
  sort_order: z.coerce.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});
export type CertificateValues = z.input<typeof certificateSchema>;
