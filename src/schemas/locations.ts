import { z } from 'zod';

export const locationSchema = z.object({
  name: z.string().min(1, 'required').max(150),
  city: z.string().max(100).optional().or(z.literal('')),
  address: z.string().min(1, 'required').max(255),
  latitude: z.coerce.number().min(-90).max(90).optional().or(z.literal('')),
  longitude: z.coerce.number().min(-180).max(180).optional().or(z.literal('')),
  is_default: z.boolean().default(false),
});
export type LocationValues = z.input<typeof locationSchema>;
