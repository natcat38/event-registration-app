# 0005. OneMap integration

Date: 2026-09-22
Status: Accepted

## Context
Event addresses come from a postal code lookup against OneMap. The spec links OneMap's token documentation directly, and a live check found that skipping the token changes what a "not found" response looks like.

## Decision
- Keep the token flow: fetch a bearer token, cache it with its expiry, and refresh it 5 minutes before expiry.
- Live finding, stated for the record: a search with no token still returns HTTP 200 on a no-match query, but the body carries "Authentication token missing" and `found: 0`. That is indistinguishable from a genuine miss unless a token is used. The token is required to tell a real "postal code not found" apart from an auth failure that looks like one.
- OneMap's search matches by prefix. Only accept a result whose `POSTAL` field equals the input exactly.
- A 401 or 403 from the search drops the cached token and retries the search once with a fresh token. A token response with a missing or non-numeric expiry is cached for 15 minutes rather than refused.
- Timeout every OneMap call at 3 seconds, and retry each call once after 300 ms on a network error, a 5xx or a 429. Two calls with one retry each stay under the frontend's 15 second client timeout.
- Any OneMap failure, of any kind, maps to 500. The cause is logged; the OneMap password and the bearer token are never written to any log.

## Consequences
- Easier: one clear rule ("token required, exact postal match, any failure is 500") replaces a set of special cases for OneMap's quirks.
- Harder: the token cache and its expiry buffer are code that would not exist if OneMap allowed anonymous, unambiguous lookups; kept anyway because the ambiguity above is real and verified live, not theoretical.
- Consequence: OneMap credentials are a hard prerequisite. Startup fails with a named error when they are blank, and the README makes registering a free OneMap account step one, so a reviewer never sees a 500 on every create.
- Risk: OneMap being slow or down turns every event creation into a 500, since there is no fallback address source; acceptable for a proof of concept, called out as a production gap.
