# 0013. A OneMap failure carries its own error code, and the share image URL is absolute at build time

Date: 2026-11-09
Status: Accepted. Refines the 500 row of [ADR 0002](0002-http-status-mapping.md) and the error body shape; the status codes are unchanged.

## Context
- **Error wording (UX audit EVT-UX-6).** When creating an event failed with a 500, the Add Event dialog said "We couldn't save the event just now. The postal code check may be unavailable." The backend answers 500 for every unexpected failure (`backend/src/middleware/errorHandler.ts`), not only OneMap, so a database outage also blamed the postal check. The owner chose to have the backend name the cause instead of guessing in the UI.
- **Share image.** `frontend/index.html` set `og:image` to `/og-image.png`. The Open Graph protocol requires a full URL, and LinkedIn, Facebook and Slack ignore a relative one. The app has no deployed URL yet.

## Decision
- A OneMap failure (network error, timeout, non-200, 429, malformed body, token failure) is wrapped in `AddressLookupError` in `createEvent`. The error handler answers it with **status 500** and the body `{ "message": "Address lookup failed.", "code": "address_lookup_failed" }`. It stays a 500 because the spec allows only 200, 421, 400 and 500 (ADR 0002); a 502 was considered and rejected for that reason.
- The error body becomes `{ message: string, errors?: Record<string, string[]>, code?: string }`. `code` appears only where the cause is known; every other 500 is unchanged.
- The UI keeps a 500's `code` (`toApiError`) and shows:
  - with `address_lookup_failed`: "We couldn't save the event because the postal code check is unavailable right now. Your details are kept; try again in a minute."
  - otherwise: "We couldn't save the event just now. Your details are kept; try again in a minute."
- `frontend/vite.config.ts` prefixes `VITE_SITE_URL` (trailing slashes trimmed) to the `og:image` path at build time. Unset, the path stays relative.

## Consequences
- The dialog never states a cause it does not know. Unit tests cover the wrap (`events.test.ts`), the handler body (`errorHandler.test.ts`), the client keeping `code` (`client.test.ts`), and both messages (`useAddEventForm.test.tsx`).
- An API client that only reads the status sees the same 500 as before; one that reads `code` can tell an address-lookup outage from anything else.
- Whoever deploys the frontend must set `VITE_SITE_URL` for link previews to show the image. The README's frontend section says so.
