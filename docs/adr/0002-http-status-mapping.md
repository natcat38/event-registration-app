# 0002. HTTP status mapping

Date: 2026-09-22
Status: Accepted

## Context
The spec defines four status codes (200, 421, 400, 500) but does not say which failure goes in 421 versus 400. Every route needs one consistent rule, decided once, not per endpoint.

## Decision
- 200: success. `POST /api/admin/events` answers 200 with an empty body, because the spec says its response is nil.
- 421: the request itself fails validation before anything is looked up: bad shape or format, unparsable JSON, a body over the size limit, a malformed uuid or path segment, out-of-range values, a deadline after the event date. Everything the zod schema rejects.
- 400: a request that passes validation but fails against stored or external data: unknown event (register or trend), unknown handler, duplicate event name, postal code not found in OneMap, handler already has an open event, event closed, event full, email already registered for this event.
- 500: anything unexpected, including any OneMap failure.
- Outside the spec's table, all documented in the README: 404 for unknown routes (JSON `{ message: 'Not found' }`); 503 from `/health` when the database is down; 429 from the rate limiter, which is mounted only when `RATE_LIMIT_ENABLED=true`.
- Every error body is `{ message: string, errors?: Record<string, string[]> }`, except `/health`, which is an operations endpoint outside the product contract (ADR 0010). `errors` is keyed by the offending field for both 421 and 400 so the form can show the message under the right input: duplicate name to `name`, postal miss to `postalCode`, handler busy or unknown to `handlerUuid`, deadline rule to `deadline`, duplicate email to `emailAddress`. No stack trace ever leaves the process.

## Consequences
- Easier: one rule answers "421 or 400" for every endpoint: could the schema reject it alone (421), or did it need the database or OneMap to fail (400)? This is the most literal reading of the spec's "validation error" and keeps both write endpoints consistent.
- Easier: a fixed error shape means the frontend has one error-rendering path.
- Harder: 400 covers several ideas (not found, conflict, closed) under one code; accepted because the spec itself only gives four codes to work with.
- Risk: an API client that treats a duplicate name or an unknown postal code as a validation error expects 421 there. The README's status table states the rule so the disagreement is at least visible.
