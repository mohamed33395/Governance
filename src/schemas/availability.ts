import { z } from 'zod';
import { dateYmd, time } from './shared';

export const availabilitySchema = z
  .object({
    days: z
      .array(
        z.object({
          day_of_week: z.number().int().min(0).max(6),
          ranges: z.array(z.object({ start_time: time, end_time: time })),
        })
      )
      .max(7),
  })
  .superRefine((val, ctx) => {
    // per day: end > start, and no overlap (touching is allowed)
    val.days.forEach((day, di) => {
      const sorted = [...day.ranges].sort((a, b) => a.start_time.localeCompare(b.start_time));
      sorted.forEach((r, ri) => {
        if (r.end_time <= r.start_time) {
          ctx.addIssue({ code: 'custom', path: ['days', di, 'ranges', ri, 'end_time'], message: 'endAfterStart' });
        }
        const next = sorted[ri + 1];
        if (next && next.start_time < r.end_time) {
          ctx.addIssue({ code: 'custom', path: ['days', di, 'ranges', ri + 1, 'start_time'], message: 'overlap' });
        }
      });
    });
  });
export type AvailabilityValues = z.infer<typeof availabilitySchema>;

export const timeOffSchema = z
  .object({
    date: dateYmd,                                          // >= today (checked in the form with dayjs)
    full_day: z.boolean().default(true),
    start_time: time.optional().or(z.literal('')),
    end_time: time.optional().or(z.literal('')),
    reason: z.string().max(255).optional().or(z.literal('')),
  })
  .superRefine((val, ctx) => {
    if (!val.full_day) {
      if (!val.start_time) ctx.addIssue({ code: 'custom', path: ['start_time'], message: 'required' });
      if (!val.end_time) ctx.addIssue({ code: 'custom', path: ['end_time'], message: 'required' });
      if (val.start_time && val.end_time && val.end_time <= val.start_time) {
        ctx.addIssue({ code: 'custom', path: ['end_time'], message: 'endAfterStart' });
      }
    }
  });
export type TimeOffValues = z.input<typeof timeOffSchema>;
