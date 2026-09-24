import { AppError } from '../utils/errors';
import { validate } from '../middleware/validate';
import {
  adminEventsQuerySchema,
  createEventSchema,
  registerSchema,
  uuidParamSchema,
} from './schemas';

const HANDLER = 'D39CF190-3B3B-42E1-BA29-AA1675F25A06';
const valid = {
  name: ' Tech Summit ',
  dateTime: '2026-04-25T18:00:00+08:00',
  postalCode: '018989',
  deadline: '2026-04-20',
  capacity: 100,
  handlerUuid: HANDLER,
};

function errorsOf(fn: () => unknown): Record<string, string[]> {
  try {
    fn();
  } catch (e) {
    if (e instanceof AppError) return e.errors ?? {};
    throw e;
  }
  throw new Error('expected a validation error');
}

describe('createEventSchema', () => {
  it('trims, lower-cases the uuid and converts the dates', () => {
    const out = validate(createEventSchema, valid);
    expect(out.name).toBe('Tech Summit');
    expect(out.handlerUuid).toBe(HANDLER.toLowerCase());
    expect(out.dateTime.toISOString()).toBe('2026-04-25T10:00:00.000Z');
    expect(out.deadline.toISOString()).toBe('2026-04-20T15:59:59.999Z');
  });
  it('rejects a full timestamp deadline', () => {
    expect(
      errorsOf(() => validate(createEventSchema, { ...valid, deadline: '2026-04-20T08:00:00Z' })),
    ).toHaveProperty('deadline');
  });
  it('rejects a deadline after the event date, compared as Singapore dates', () => {
    expect(
      errorsOf(() => validate(createEventSchema, { ...valid, deadline: '2026-04-26' })),
    ).toHaveProperty('deadline');
    expect(() => validate(createEventSchema, { ...valid, deadline: '2026-04-25' })).not.toThrow();
  });
  it('rejects capacity outside 1..99999, non-integers and strings', () => {
    for (const capacity of [0, 100000, 1.5, '10']) {
      expect(errorsOf(() => validate(createEventSchema, { ...valid, capacity }))).toHaveProperty(
        'capacity',
      );
    }
  });
  it('rejects dates more than 100 years ahead', () => {
    expect(
      errorsOf(() =>
        validate(createEventSchema, { ...valid, dateTime: '2200-01-01', deadline: '2199-12-31' }),
      ),
    ).toHaveProperty('dateTime');
  });
  it('accepts a past event', () => {
    expect(() =>
      validate(createEventSchema, { ...valid, dateTime: '2020-01-01', deadline: '2019-12-31' }),
    ).not.toThrow();
  });
  it('rejects a malformed uuid shape', () => {
    expect(
      errorsOf(() => validate(createEventSchema, { ...valid, handlerUuid: 'not-a-uuid' })),
    ).toHaveProperty('handlerUuid');
  });
});

describe('registerSchema', () => {
  it('normalises the email and the uuid', () => {
    const out = validate(registerSchema, {
      eventUuid: HANDLER,
      emailAddress: '  Ann@Example.COM ',
    });
    expect(out).toEqual({ eventUuid: HANDLER.toLowerCase(), emailAddress: 'ann@example.com' });
  });
  it('rejects a bad email', () => {
    expect(
      errorsOf(() => validate(registerSchema, { eventUuid: HANDLER, emailAddress: 'nope' })),
    ).toHaveProperty('emailAddress');
  });
});

describe('adminEventsQuerySchema', () => {
  it('defaults page to 1 and treats open loosely', () => {
    expect(validate(adminEventsQuerySchema, {})).toEqual({
      page: 1,
      open: undefined,
      search: undefined,
    });
    expect(validate(adminEventsQuerySchema, { open: 'TRUE' }).open).toBe(true);
    expect(validate(adminEventsQuerySchema, { open: '1' }).open).toBe(true);
    expect(validate(adminEventsQuerySchema, { open: 'false' }).open).toBeUndefined();
    expect(validate(adminEventsQuerySchema, { open: 'banana' }).open).toBeUndefined();
    expect(validate(adminEventsQuerySchema, { open: ['true', '1'] }).open).toBeUndefined();
  });
  it('bounds page and rejects garbage', () => {
    expect(validate(adminEventsQuerySchema, { page: '3' }).page).toBe(3);
    expect(validate(adminEventsQuerySchema, { page: '' }).page).toBe(1);
    for (const page of ['0', '-1', '1.5', 'abc', '1e3', '0x10', '99999999999999999999']) {
      expect(errorsOf(() => validate(adminEventsQuerySchema, { page }))).toHaveProperty('page');
    }
  });
  it('trims search, drops empty, rejects over 255', () => {
    expect(validate(adminEventsQuerySchema, { search: '  ' }).search).toBeUndefined();
    expect(validate(adminEventsQuerySchema, { search: ' x ' }).search).toBe('x');
    expect(
      errorsOf(() => validate(adminEventsQuerySchema, { search: 'a'.repeat(256) })),
    ).toHaveProperty('search');
  });
});

describe('uuidParamSchema', () => {
  it('lower-cases a valid uuid and rejects a bad variant nibble', () => {
    expect(validate(uuidParamSchema, { uuid: HANDLER }).uuid).toBe(HANDLER.toLowerCase());
    expect(
      errorsOf(() => validate(uuidParamSchema, { uuid: '11111111-1111-1111-1111-111111111111' })),
    ).toHaveProperty('uuid');
  });
});
