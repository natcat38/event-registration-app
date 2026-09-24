import axios from 'axios';

jest.mock('axios');
jest.mock('../utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

import { lookupAddress, resetTokenCache } from './onemap';
import { logger } from '../utils/logger';

const TOKEN_RESPONSE = (expiresInSeconds: number) => ({
  status: 200,
  data: {
    access_token: 'token-abc',
    expiry_timestamp: String(Math.floor(Date.now() / 1000) + expiresInSeconds),
  },
});

const FOUND_RESPONSE = {
  status: 200,
  data: {
    found: 1,
    results: [{ ADDRESS: '10 BAYFRONT AVENUE SINGAPORE 018956', POSTAL: '018956' }],
  },
};

beforeEach(() => {
  // resetAllMocks (not clearAllMocks) so a once-queued mock value left over
  // from a test that didn't consume it can never leak into the next test.
  jest.resetAllMocks();
  resetTokenCache();
});

describe('lookupAddress', () => {
  it('returns the address when a result POSTAL matches exactly', async () => {
    mockedAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE(300));
    mockedAxios.get.mockResolvedValueOnce(FOUND_RESPONSE);

    const result = await lookupAddress('018956');

    expect(result).toBe('10 BAYFRONT AVENUE SINGAPORE 018956');
  });

  it('returns null when results only prefix-match (no exact POSTAL)', async () => {
    mockedAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE(300));
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        found: 1,
        results: [{ ADDRESS: '11 MARINA BOULEVARD SINGAPORE 018940', POSTAL: '018940' }],
      },
    });

    const result = await lookupAddress('018');

    expect(result).toBeNull();
  });

  it('returns null when OneMap finds nothing', async () => {
    mockedAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE(300));
    mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { found: 0, results: [] } });

    const result = await lookupAddress('999999');

    expect(result).toBeNull();
  });

  it('throws when OneMap returns an HTML 429 body instead of JSON', async () => {
    mockedAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE(300));
    mockedAxios.get.mockResolvedValueOnce({ status: 429, data: '<html>Too Many Requests</html>' });

    await expect(lookupAddress('018956')).rejects.toThrow();
  });

  it('throws when the search request times out', async () => {
    mockedAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE(300));
    mockedAxios.get.mockRejectedValue(
      Object.assign(new Error('timeout of 3000ms exceeded'), { code: 'ECONNABORTED' }),
    );

    await expect(lookupAddress('018956')).rejects.toThrow();
  });

  it('fetches the token once and reuses it across two lookups', async () => {
    mockedAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE(3600));
    mockedAxios.get.mockResolvedValue(FOUND_RESPONSE);

    await lookupAddress('018956');
    await lookupAddress('018956');

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('falls back to a short fixed lifetime (still cached) when expiry_timestamp is non-numeric', async () => {
    // A non-numeric expiry_timestamp used to produce expiresAtSeconds = NaN,
    // and `nowSeconds < NaN` is always false, so the cache was silently
    // disabled forever. It must instead fall back to a short but real
    // lifetime, so the very next call still reuses it, not fetch again.
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { access_token: 'token-abc', expiry_timestamp: 'not-a-number' },
    });
    mockedAxios.get.mockResolvedValue(FOUND_RESPONSE);

    await lookupAddress('018956');
    await lookupAddress('018956');

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('clears the cache and retries once on a 401, then succeeds', async () => {
    mockedAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE(3 * 24 * 3600));
    mockedAxios.get.mockResolvedValueOnce({ status: 401, data: { error: 'Token expired' } });
    mockedAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE(3 * 24 * 3600));
    mockedAxios.get.mockResolvedValueOnce(FOUND_RESPONSE);

    const result = await lookupAddress('018956');

    expect(result).toBe('10 BAYFRONT AVENUE SINGAPORE 018956');
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('never lets the OneMap password or bearer token reach the thrown error or the logger', async () => {
    const fakePassword = 'fake-onemap-password-should-never-log';
    const tokenErr = Object.assign(new Error('Request failed with status code 401'), {
      response: { status: 401 },
      config: { data: JSON.stringify({ email: 'onemap@example.com', password: fakePassword }) },
    });
    mockedAxios.post.mockRejectedValue(tokenErr);

    let thrown: unknown;
    try {
      await lookupAddress('018956');
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).not.toContain(fakePassword);
    expect(JSON.stringify((logger.error as jest.Mock).mock.calls)).not.toContain(fakePassword);

    resetTokenCache();
    jest.resetAllMocks();

    const fakeToken = 'fake-bearer-token-should-never-log';
    mockedAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE(300));
    const searchErr = Object.assign(new Error('Request failed with status code 500'), {
      response: { status: 500 },
      config: { headers: { Authorization: `Bearer ${fakeToken}` } },
    });
    mockedAxios.get.mockRejectedValue(searchErr);

    let thrownSearch: unknown;
    try {
      await lookupAddress('018956');
    } catch (err) {
      thrownSearch = err;
    }

    expect(thrownSearch).toBeInstanceOf(Error);
    expect((thrownSearch as Error).message).not.toContain(fakeToken);
    expect(JSON.stringify((logger.error as jest.Mock).mock.calls)).not.toContain(fakeToken);
  });
});

describe('lookupAddress retries once on a transient failure', () => {
  const TIMEOUT = Object.assign(new Error('timeout of 3000ms exceeded'), { code: 'ECONNABORTED' });

  it('returns the address when the first search times out and the second succeeds', async () => {
    mockedAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE(300));
    mockedAxios.get.mockRejectedValueOnce(TIMEOUT).mockResolvedValueOnce(FOUND_RESPONSE);
    await expect(lookupAddress('018956')).resolves.toBe('10 BAYFRONT AVENUE SINGAPORE 018956');
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('retries a 503 once and throws when both attempts fail', async () => {
    mockedAxios.post.mockResolvedValueOnce(TOKEN_RESPONSE(300));
    mockedAxios.get.mockResolvedValue({ status: 503, data: 'unavailable' });
    await expect(lookupAddress('018956')).rejects.toThrow('status 503');
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('retries the token request once on a network error', async () => {
    mockedAxios.post.mockRejectedValueOnce(TIMEOUT).mockResolvedValueOnce(TOKEN_RESPONSE(300));
    mockedAxios.get.mockResolvedValueOnce(FOUND_RESPONSE);
    await expect(lookupAddress('018956')).resolves.toBe('10 BAYFRONT AVENUE SINGAPORE 018956');
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });
});
