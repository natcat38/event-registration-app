import type { ZodType } from 'zod';
import { AppError } from '../utils/errors';

/** Parses `data` with `schema`; on failure throws a 421 with `{ field: [messages] }`. see docs/adr/0002 */
export function validate<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  const errors: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_';
    (errors[key] ??= []).push(issue.message);
  }
  throw new AppError(421, 'Validation failed', errors);
}
