import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

const TOKEN_URL = 'https://www.onemap.gov.sg/api/auth/post/getToken';
// 3 s per call: two calls with one retry each stay under the frontend's 15 s client timeout.
export const REQUEST_TIMEOUT_MS = 3000;
const RETRY_DELAY_MS = 300;

/** Runs `attempt` again once, after a short pause, on a thrown error or a 5xx/429 response. see docs/adr/0005 */
export async function withOneRetry<T extends { status: number }>(
  attempt: () => Promise<T>,
): Promise<T> {
  let reason: string;
  try {
    const first = await attempt();
    if (first.status < 500 && first.status !== 429) return first;
    reason = `status ${first.status}`;
  } catch (err) {
    reason = err instanceof Error ? err.message : 'unknown error';
  }
  logger.warn('OneMap call failed, retrying once', { reason });
  await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  return attempt();
}
const EXPIRY_BUFFER_SECONDS = 5 * 60;
// see docs/adr/0005: a missing or non-numeric expiry must not disable the cache forever.
const FALLBACK_TOKEN_LIFETIME_SECONDS = 15 * 60;

interface TokenState {
  token: string;
  expiresAtSeconds: number;
}

let cachedToken: TokenState | null = null;

function isTokenValid(state: TokenState | null, nowSeconds: number): state is TokenState {
  return state !== null && nowSeconds < state.expiresAtSeconds - EXPIRY_BUFFER_SECONDS;
}

// see docs/adr/0005: log only message and status, never the password or the bearer token.
export function upstreamFailure(message: string, err: unknown): Error {
  const e = err as { response?: { status?: unknown }; message?: unknown } | undefined;
  const status = typeof e?.response?.status === 'number' ? e.response.status : undefined;
  const reason = typeof e?.message === 'string' ? e.message : 'unknown error';
  logger.error(message, { status, reason });
  return new Error(status !== undefined ? `${message} (status ${status})` : message);
}

async function fetchToken(): Promise<TokenState> {
  let res;
  try {
    res = await withOneRetry(() =>
      axios.post(
        TOKEN_URL,
        { email: config.oneMap.email, password: config.oneMap.password },
        { timeout: REQUEST_TIMEOUT_MS },
      ),
    );
  } catch (err) {
    throw upstreamFailure('OneMap token request failed', err);
  }

  const body = res.data as { access_token?: unknown; expiry_timestamp?: unknown } | undefined;
  if (typeof body?.access_token !== 'string') {
    logger.error('OneMap token response missing access_token', { status: res.status });
    throw new Error('OneMap token response missing access_token');
  }

  const parsedExpiry = Number(body.expiry_timestamp);
  if (!Number.isFinite(parsedExpiry)) {
    logger.warn(
      'OneMap token expiry_timestamp missing or non-numeric; using a short fallback lifetime',
    );
    return {
      token: body.access_token,
      expiresAtSeconds: Date.now() / 1000 + FALLBACK_TOKEN_LIFETIME_SECONDS,
    };
  }
  return { token: body.access_token, expiresAtSeconds: parsedExpiry };
}

export async function getToken(): Promise<string> {
  const nowSeconds = Date.now() / 1000;
  if (!isTokenValid(cachedToken, nowSeconds)) {
    cachedToken = await fetchToken();
  }
  return cachedToken.token;
}

/** Test-only escape hatch; also used to drop a token OneMap has rejected. */
export function resetTokenCache(): void {
  cachedToken = null;
}
