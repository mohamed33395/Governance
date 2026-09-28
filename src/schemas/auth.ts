import { z } from 'zod';
import { email, password, phone } from './shared';

export const loginSchema = z.object({ email, password: z.string().min(1, 'required') });
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(1, 'required').max(150),
    email,
    phone,
    company_name: z.string().min(1, 'required').max(191),
    password,
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: 'pwMismatch' });
export type RegisterValues = z.infer<typeof registerSchema>;

export const forgotSchema = z.object({ email });
export type ForgotValues = z.infer<typeof forgotSchema>;

export const resetSchema = z
  .object({
    token: z.string().min(1, 'required'),
    email,
    password,
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: 'pwMismatch' });
export type ResetValues = z.infer<typeof resetSchema>;
