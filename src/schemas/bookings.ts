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
  note: z.string().max(2000).optional().or(z.literal('')), // stored on the submission history entry
  // file validated by <FileDrop>: pdf/doc/docx ≤ 20 MB
});
export type ReportUploadValues = z.input<typeof reportUploadSchema>;

// RPT-04a/b/c — the optional reviewer note sent with a decision
export const reportReviewSchema = z.object({
  note: z.string().max(2000).optional().or(z.literal('')),
});
export type ReportReviewValues = z.input<typeof reportReviewSchema>;
