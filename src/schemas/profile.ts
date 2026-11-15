import { z } from 'zod';
import { email, password, phone } from './shared';

export const clientProfileSchema = z.object({
  name: z.string().min(1, 'required').max(150),
  email,
  phone,
  company_name: z.string().min(1, 'required').max(191),
});
export type ClientProfileValues = z.infer<typeof clientProfileSchema>;

export const adminProfileSchema = clientProfileSchema.omit({ company_name: true }).extend({
  company_name: z.string().max(191).optional().or(z.literal('')),
  title: z.string().max(150).optional().or(z.literal('')),
  specialization: z.string().max(150).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
  // consultant payout financials (price entered in SAR, sent as halalas;
  // union order matters — '' must match before coerce turns it into 0)
  consultation_price_sar: z.union([z.literal(''), z.coerce.number().min(0, 'invalidNumber')]).optional(),
  iban: z.string().max(34).optional().or(z.literal('')),
  bank_name: z.string().max(150).optional().or(z.literal('')),
  account_name: z.string().max(150).optional().or(z.literal('')),
});
export type AdminProfileValues = z.input<typeof adminProfileSchema>;

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'required'),
    password,
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: 'pwMismatch' });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
