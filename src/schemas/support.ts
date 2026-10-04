import { z } from 'zod';
import { email, phone } from './shared';

export const supportTicketCategory = z.enum([
  'general_inquiry',
  'booking_issue',
  'payment_issue',
  'technical',
  'consultant_complaint',
]);

export const supportTicketCreateSchema = z.object({
  category: supportTicketCategory,
  description: z.string().min(1, 'required').max(2000, 'maxLength'),
});
export type SupportTicketCreateValues = z.infer<typeof supportTicketCreateSchema>;

export const supportMessageSchema = z.object({
  body: z.string().min(1, 'required').max(2000, 'maxLength'),
  is_internal: z.boolean(),
});
export type SupportMessageValues = z.infer<typeof supportMessageSchema>;

export const supportTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});
export type SupportTicketStatusValues = z.infer<typeof supportTicketStatusSchema>;
