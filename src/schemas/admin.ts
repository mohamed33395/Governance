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
});
export type ConsultantValues = z.input<typeof consultantSchema>;
