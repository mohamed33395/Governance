import { z } from 'zod';

// Messages are translation keys — rendered through t().
export const trainingSessionSchema = z.object({
  starts_at: z.string().min(1, 'required'),
  duration_minutes: z
    .number({ error: 'required' })
    .int('training.invalidDuration')
    .min(15, 'training.invalidDuration')
    .max(480, 'training.invalidDuration'),
  meeting_url: z.url({ error: 'training.invalidUrl' }).optional().or(z.literal('')),
  notes: z.string().max(2000, 'maxLength').optional().or(z.literal('')),
});

export type TrainingSessionValues = z.input<typeof trainingSessionSchema>;
