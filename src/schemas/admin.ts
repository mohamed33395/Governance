import { z } from 'zod';
import { email, password } from './shared';

export const roleSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/, 'invalidRoleName').max(100),
  permissions: z.array(z.string()).min(1, 'required'),
});
export type RoleValues = z.infer<typeof roleSchema>;

export const userSchema = z.object({
  name: z.string().min(1, 'required').max(150),
  email,
  phone: z.string().max(20).optional().or(z.literal('')),
  password: password.optional().or(z.literal('')),        // empty → set-password email
  password_confirmation: z.string().optional(),
  type: z.enum(['admin', 'consultant']).default('admin'),
  roles: z.array(z.string()).min(1, 'required'),
  is_active: z.boolean().default(true),
  title: z.string().max(150).optional().or(z.literal('')),
  specialization: z.string().max(150).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
});
export type UserValues = z.input<typeof userSchema>;

export const userRolesSchema = z.object({ roles: z.array(z.string()).min(1, 'required') });
export type UserRolesValues = z.infer<typeof userRolesSchema>;

export const consultantSchema = z.object({
  name: z.string().min(1, 'required').max(150),
  email,
  phone: z.string().max(20).optional().or(z.literal('')),
  title: z.string().max(150).optional().or(z.literal('')),
  specialization: z.string().max(150).optional().or(z.literal('')),
  bio: z.string().max(2000).optional().or(z.literal('')),
  password: password.optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  // payout financials — price is entered in SAR, converted to halalas on submit.
  // union order matters: '' must match before coerce turns it into 0.
  consultation_price_sar: z.union([z.literal(''), z.coerce.number().min(0, 'invalidNumber')]).optional(),
  platform_fee_percent: z.union([z.literal(''), z.coerce.number().min(0, 'invalidNumber').max(100, 'invalidNumber')]).optional(),
});
export type ConsultantValues = z.input<typeof consultantSchema>;

// SET-02 — platform settings (all keys optional on the wire, the form sends both)
export const settingsSchema = z.object({
  platform_fee_percent: z.coerce.number().min(0, 'invalidNumber').max(100, 'invalidNumber'),
  payout_auto_transfer: z.boolean().default(false),
});
export type SettingsValues = z.input<typeof settingsSchema>;

// PO-03 — release a payout (records the manual transfer / triggers the gateway)
export const payoutReleaseSchema = z.object({
  transfer_reference: z.string().max(150).optional().or(z.literal('')),
  note: z.string().max(1000).optional().or(z.literal('')),
});
export type PayoutReleaseValues = z.input<typeof payoutReleaseSchema>;
