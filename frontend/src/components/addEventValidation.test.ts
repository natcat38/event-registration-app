import { describe, expect, it } from 'vitest';
import { validate } from './addEventValidation';

const validForm = {
  name: 'Party',
  dateTime: '2026-05-01T10:00',
  postalCode: '018956',
  deadline: '2026-04-30',
  capacity: '50',
  handlerUuid: 'h-1',
};

describe('validate', () => {
  it('rejects a postal code with the wrong number of digits', () => {
    const errors = validate({ ...validForm, postalCode: '12345' });
    expect(errors.postalCode).toEqual(['Postal code must be 6 digits.']);
  });

  it('accepts a 6-digit postal code', () => {
    const errors = validate({ ...validForm, postalCode: '018956' });
    expect(errors.postalCode).toBeUndefined();
  });

  it('rejects a capacity of 0', () => {
    const errors = validate({ ...validForm, capacity: '0' });
    expect(errors.capacity).toEqual(['Capacity must be a whole number between 1 and 99999.']);
  });

  it('rejects a capacity above the maximum', () => {
    const errors = validate({ ...validForm, capacity: '100000' });
    expect(errors.capacity).toEqual(['Capacity must be a whole number between 1 and 99999.']);
  });

  it('accepts a capacity of 50', () => {
    const errors = validate({ ...validForm, capacity: '50' });
    expect(errors.capacity).toBeUndefined();
  });
});
