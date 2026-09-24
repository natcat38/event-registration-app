import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { toApiError } from './client';

function axiosErrorWithBody(data: unknown): AxiosError {
  const err = new AxiosError('Request failed');
  err.response = { data, status: 421, statusText: '', headers: {}, config: {} as never };
  return err;
}

describe('toApiError', () => {
  it('reads message and errors from a JSON error body', () => {
    const err = axiosErrorWithBody({ message: 'Bad input.', errors: { name: ['Required.'] } });
    expect(toApiError(err)).toEqual({ message: 'Bad input.', errors: { name: ['Required.'] } });
  });

  it('reads message from a body with no errors field', () => {
    const err = axiosErrorWithBody({ message: 'Event not found.' });
    expect(toApiError(err)).toEqual({ message: 'Event not found.', errors: undefined });
  });

  it('maps a timeout to a fixed message', () => {
    const err = new AxiosError('timeout of 15000ms exceeded');
    err.code = 'ECONNABORTED';
    expect(toApiError(err)).toEqual({ message: 'The request timed out. Please try again.' });
  });

  it('maps an ETIMEDOUT timeout to the same fixed message', () => {
    const err = new AxiosError('connect ETIMEDOUT');
    err.code = 'ETIMEDOUT';
    expect(toApiError(err)).toEqual({ message: 'The request timed out. Please try again.' });
  });

  it('maps a network error with no response to the generic message', () => {
    const err = new AxiosError('Network Error');
    expect(toApiError(err)).toEqual({ message: 'Something went wrong. Please try again.' });
  });

  it('maps a non-axios error to the generic message', () => {
    expect(toApiError(new Error('boom'))).toEqual({
      message: 'Something went wrong. Please try again.',
    });
  });
});
