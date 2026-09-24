import { z } from 'zod';
import { parseDeadline, parseInstant, sgtDate } from '../utils/dates';

// see docs/adr/0006 for every rule here that goes beyond the spec.
const uuid = z.string().uuid().toLowerCase();

export const uuidParamSchema = z.object({ uuid });

export const registerSchema = z.object({
  eventUuid: uuid,
  emailAddress: z.string().trim().toLowerCase().max(254).email(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

const MAX_YEARS_AHEAD = 100;

export const createEventSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    dateTime: z.string(),
    postalCode: z.string().regex(/^\d{6}$/, 'Must be a 6-digit postal code'),
    deadline: z.string(),
    capacity: z.number().int().min(1).max(99999),
    handlerUuid: uuid,
  })
  .transform((raw, ctx) => {
    const dateTime = parseInstant(raw.dateTime);
    const deadline = parseDeadline(raw.deadline);
    if (!dateTime)
      ctx.addIssue({ code: 'custom', path: ['dateTime'], message: 'Invalid date/time' });
    if (!deadline)
      ctx.addIssue({ code: 'custom', path: ['deadline'], message: 'Must be a date (YYYY-MM-DD) or an ISO date-time' });
    if (!dateTime || !deadline) return z.NEVER;
    const max = new Date();
    max.setUTCFullYear(max.getUTCFullYear() + MAX_YEARS_AHEAD);
    if (dateTime > max)
      ctx.addIssue({
        code: 'custom',
        path: ['dateTime'],
        message: 'Date is too far in the future.',
      });
    if (deadline > max)
      ctx.addIssue({
        code: 'custom',
        path: ['deadline'],
        message: 'Date is too far in the future.',
      });
    if (sgtDate(deadline) > sgtDate(dateTime)) {
      ctx.addIssue({
        code: 'custom',
        path: ['deadline'],
        message: 'Registration deadline must be a date on or before the event date.',
      });
    }
    return { ...raw, dateTime, deadline };
  });
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const adminEventsQuerySchema = z.object({
  // An empty value means absent, like the other query params. see docs/adr/0006
  page: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z
      .string()
      .regex(/^\d+$/, 'page must be a positive integer')
      .default('1')
      .transform(Number)
      .pipe(z.number().int().min(1).max(1_000_000)),
  ),
  // Never 421 on this flag: a repeated key arrives as an array and simply means no filter.
  open: z
    .unknown()
    .optional()
    .transform((v) =>
      typeof v === 'string' && ['true', '1'].includes(v.toLowerCase()) ? true : undefined,
    ),
  search: z
    .string()
    .trim()
    .max(255)
    .optional()
    .transform((v) => v || undefined),
});
export type AdminEventsQuery = z.infer<typeof adminEventsQuerySchema>;
