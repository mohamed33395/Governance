import { z } from 'zod';

// price is entered in SAR, converted to halalas on submit (price = Math.round(price_sar * 100))
export const packageSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-_]+$/, 'invalidSlug'),
  name_ar: z.string().min(1, 'required').max(100),
  name_en: z.string().min(1, 'required').max(100),
  description_ar: z.string().max(500).optional().or(z.literal('')),
  description_en: z.string().max(500).optional().or(z.literal('')),
  features: z.array(z.object({ ar: z.string().min(1, 'required'), en: z.string().min(1, 'required') })).default([]),
  price_sar: z.coerce.number().min(0, 'invalidPrice'),
  billing_period_days: z.coerce.number().int().min(1).default(30),
  consultations_unlimited: z.boolean().default(false),
  consultations_limit: z.coerce.number().int().min(1).nullable().default(null),
  documents_unlimited: z.boolean().default(false),
  documents_limit: z.coerce.number().int().min(0).nullable().default(null),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});
export type PackageValues = z.input<typeof packageSchema>;
