import { z } from 'zod';

export const cancelBookingSchema = z.object({ reason: z.string().max(500).optional().or(z.literal('')) }); // client
export type CancelBookingValues = z.infer<typeof cancelBookingSchema>;

export const adminCancelSchema = z.object({ reason: z.string().min(1, 'required').max(500) }); // admin: required
export type AdminCancelValues = z.infer<typeof adminCancelSchema>;

export const completeBookingSchema = z.object({ notes: z.string().max(1000).optional().or(z.literal('')) });
export type CompleteBookingValues = z.infer<typeof completeBookingSchema>;

export const reportUploadSchema = z.object({
  title: z.string().min(1, 'required').max(191),
  summary: z.string().max(5000).optional().or(z.literal('')),
  notify_client: z.boolean().default(true),
  // file validated by <FileDrop>: pdf/doc/docx ≤ 20 MB
});
export type ReportUploadValues = z.input<typeof reportUploadSchema>;
