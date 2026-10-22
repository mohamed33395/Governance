import { z } from 'zod';
import { email } from './shared';

// specialization is a fixed list; 'other' reveals a free-text field (<=100 chars).
export const SPECIALIZATION_KINDS = ['licensed_consultant', 'certified_specialist', 'other'] as const;
export type SpecializationKind = (typeof SPECIALIZATION_KINDS)[number];

export const joinRequestSchema = z
  .object({
    name: z.string().min(1, 'required').max(191),
    email,
    phone_code: z.string().min(1, 'required').max(8),
    phone: z
      .string()
      .min(1, 'required')
      .regex(/^\d{6,15}$/, 'joinRequests.invalidPhone'),
    specialization_kind: z.enum(SPECIALIZATION_KINDS, { error: 'required' }),
    specialization_other: z.string().max(100, 'maxLength').optional().or(z.literal('')),
    bio: z.string().max(100, 'maxLength').optional().or(z.literal('')),
  })
  .superRefine((v, ctx) => {
    if (v.specialization_kind === 'other' && !v.specialization_other?.trim()) {
      ctx.addIssue({ code: 'custom', path: ['specialization_other'], message: 'required' });
    }
  });

export type JoinRequestValues = z.infer<typeof joinRequestSchema>;
