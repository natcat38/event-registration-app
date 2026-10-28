import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { toApiError } from './client';

function axiosErrorWithBody(data: unknown, status = 421): AxiosError {
  const err = new AxiosError('Request failed');
  err.response = { data, status, statusText: '', headers: {}, config: {} as never };
  return err;
}

describe('toApiError', () => {
  it('reads message and errors from a JSON error body', () => {
    const err = axiosErrorWithBody({ message: 'Bad input.', errors: { name: ['Required.'] } });
    expect(toApiError(err)).toEqual({
      message: 'Bad input.',
      errors: { name: ['Required.'] },
      status: 421,
    });
  });

  it('reads message from a body with no errors field', () => {
    const err = axiosErrorWithBody({ message: 'Event not found.' });
    expect(toApiError(err)).toEqual({
      message: 'Event not found.',
      errors: undefined,
      status: 421,
    });
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

  it('says the server cannot be reached when there is no response', () => {
    const err = new AxiosError('Network Error');
    expect(toApiError(err)).toEqual({
      message: "Can't reach the server. Check your connection and retry.",
    });
  });

  it('replaces a bare "Internal server error" with plain copy and keeps the status', () => {
    const err = axiosErrorWithBody({ message: 'Internal server error' }, 500);
    expect(toApiError(err)).toEqual({
      message: 'The server ran into a problem. Please try again in a minute.',
      status: 500,
    });
  });

  it('maps a non-axios error to the generic message', () => {
    expect(toApiError(new Error('boom'))).toEqual({
      message: 'Something went wrong. Please try again.',
    });
  });
});
