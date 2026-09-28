import { z } from 'zod';

// shared rules (messages are translation keys resolved at render time)
export const phone = z.string().regex(/^05\d{8}$/, 'invalidPhone');           // 05XXXXXXXX
export const password = z
  .string()
  .min(8, 'pwMin')
  .regex(/[a-z]/, 'pwLower')
  .regex(/[A-Z]/, 'pwUpper')
  .regex(/[0-9]/, 'pwNumber');
export const time = z.string().regex(/^([01]\d|2[0-3]):(00|30)$/, 'invalidTime'); // HH:MM, :00/:30 only
export const dateYmd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'invalidDate');
export const email = z.email('invalidEmail');
