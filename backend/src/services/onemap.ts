import axios, { type AxiosResponse } from 'axios';
import { logger } from '../utils/logger';
import {
  REQUEST_TIMEOUT_MS,
  getToken,
  resetTokenCache,
  upstreamFailure,
  withOneRetry,
} from './onemapToken';

export { resetTokenCache };

const SEARCH_URL = 'https://www.onemap.gov.sg/api/common/elastic/search';

async function search(postalCode: string, token: string): Promise<AxiosResponse> {
  try {
    return await axios.get(SEARCH_URL, {
      params: { searchVal: postalCode, returnGeom: 'N', getAddrDetails: 'Y', pageNum: 1 },
      headers: { Authorization: `Bearer ${token}` },
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true, // a 429 is an HTML page; status is checked below. see docs/adr/0005
    });
  } catch (err) {
    throw upstreamFailure('OneMap search request failed', err);
  }
}

/** OneMap postal lookup; null unless a result's `POSTAL` matches exactly (its search is prefix-based). see docs/adr/0005 */
export async function lookupAddress(postalCode: string): Promise<string | null> {
  const token = await getToken();
  let res = await withOneRetry(() => search(postalCode, token));

  // see docs/adr/0005: a rejected token is dropped and the lookup retried once.
  if (res.status === 401 || res.status === 403) {
    resetTokenCache();
    const freshToken = await getToken();
    res = await withOneRetry(() => search(postalCode, freshToken));
  }

  if (res.status !== 200 || typeof res.data !== 'object' || res.data === null) {
    logger.error('OneMap search returned a non-200 or non-JSON response', { status: res.status });
    throw new Error(`OneMap search returned status ${res.status}`);
  }

  const results = (res.data as { results?: unknown }).results;
  if (!Array.isArray(results)) {
    logger.error('OneMap search response malformed', { status: res.status });
    throw new Error('OneMap search response malformed');
  }

  const match = results.find(
    (r) => r && typeof r === 'object' && (r as { POSTAL?: unknown }).POSTAL === postalCode,
  );
  if (!match || typeof (match as { ADDRESS?: unknown }).ADDRESS !== 'string') return null;
  return (match as { ADDRESS: string }).ADDRESS;
}
