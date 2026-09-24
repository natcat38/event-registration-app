# 0009. Security scope for a proof of concept

Date: 2026-09-22
Status: Accepted

## Context
The spec asks for "proper data validation" and "proper security practices" and states that authentication and authorisation are not required. The system needs a security posture sized for a proof of concept, not for production, without leaving obvious gaps.

## Decision
In scope: `helmet`; CORS restricted to the frontend's origin, read from an environment variable; `express.json({ limit: '100kb' })`, with an over-limit body mapped to 421; zod validation at every request boundary; all queries built through the ORM, parameterised; `LIKE` wildcard characters escaped in the admin search; `express-rate-limit` on `POST /api/public/register` at 10000 requests per minute per IP, mounted only when `RATE_LIMIT_ENABLED=true` (off by default and in tests, so no automated run can ever see a 429; the README says so); helmet's `crossOriginResourcePolicy` set to `cross-origin` and cors answering preflight for the configured frontend origin, so a browser on port 8001 can read responses from 8000; winston logs one line per request (method, path, status, duration) plus errors, and never an email address, the OneMap password, or a bearer token; generic 500 response bodies with no stack trace; secrets kept only in `.env`, never committed. No authentication anywhere, because the spec does not require it.
`trust proxy` is not set because the local setup has no reverse proxy; behind one it must be set so the rate limiter keys on the client address.
Out of scope, listed as production work: authentication on `/api/admin`, idempotency keys on write endpoints, per-route rate limits, graceful shutdown handling.

## Consequences
- Easier: each item on the in-scope list is a single, well-understood control; nothing here is bespoke or hard to explain.
- Harder: no rate limiting on admin routes and no idempotency mean a real deployment would need the production list before going live; the README says so.
- Risk: with the limiter off by default it protects nothing until an operator turns it on; accepted, because the alternative is a 429 the spec never defines reaching an automated test. The wiring is proven by one unit test that mounts it with the flag on.
