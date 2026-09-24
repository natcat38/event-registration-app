# AGENTS.md

Instructions for anyone, human or agent, working in this repo. Read this before touching code.

## What this is

An event registration service: staff create events and assign a handler; the public registers for open events. Two independent packages, `backend/` (Express 5 + Sequelize 6 + MySQL 8.4, TypeScript) and `frontend/` (React 19 + Vite + MUI, TypeScript). There is no root `package.json`; run every command inside the package folder.

## Structure

```
backend/
  config/database.cjs   sequelize-cli config; mirrors src/config.ts, keep both in sync
  migrations/           schema history (sequelize-cli)
  seeders/              five fixed handlers
  src/app.ts            express app: helmet, cors, json body, routers, 404, error handler
  src/server.ts         loads env, checks the database, listens on PORT
  src/config.ts         env vars to a typed object; throws on a bad port (server.ts turns that into a clean exit)
  src/models/           Sequelize models and associations
  src/routes/           thin routers; one service call per route
  src/services/         business rules and transactions
  src/middleware/       validate (zod to 421), requestLog (one line per request), errorHandler (AppError to status, else 500)
  src/validation/       zod schemas for every request
  src/utils/            dates (Singapore time rules), logger (winston), errors (AppError)
frontend/
  src/api/client.ts     axios instance and one typed function per endpoint
  src/pages/            one component per route, plus that route's hook and sub-components
  src/components/       dialogs, the form and its validation helper, the table, the status badge
  src/utils/            dates.ts (the frontend copy of the "is open" rule), useDocumentTitle
docs/adr/               one decision record per non-obvious choice; code comments point here
```

Tests sit next to the file they test: `foo.test.ts` (no database) and `foo.integration.test.ts` (real MySQL).

## Commands

Backend (`cd backend`):

```
npm run dev              start with reload on port 8000
npm run build            tsc to dist/
npm run lint             eslint
npm test                 unit tests with coverage, no database needed (NODE_ENV=test silences the logger)
npm run test:integration integration tests, needs the Compose database; files run one at a time because they share it
npm run db:migrate       apply migrations
npm run db:seed          insert the five handlers
```

Frontend (`cd frontend`): `npm run dev` (port 8001), `npm run build`, `npm run lint`, `npm test`.

Database: `docker compose up -d --wait` from the repo root. Copy `.env.example` to `.env` first and fill in the OneMap credentials.

## Conventions

- async/await only. `.then()`, `.catch()` and `.finally()` method chains fail lint.
- TypeScript strict. No `any`. No `console.*` in `src/`; use the winston logger.
- Validation happens once, at the route boundary, with zod. Services trust their inputs.
- Every write that can race runs inside one transaction with a `FOR UPDATE` lock. See ADR 0004.
- Status codes follow ADR 0002: 421 when the schema alone rejects the request, 400 when a valid request fails against stored or external data, 500 for anything unexpected.
- Dates: store UTC, reason in Singapore time. See ADR 0003.
- Comments are one line and point at an ADR when the reason is not obvious: `// see docs/adr/0004`.
- No source file over about 120 lines; test files may run to about 200. Split anything larger.
- Logging: one line per request (method, path, status, duration) plus errors. Never log an email address, the OneMap password, or a bearer token.
- Never name the client company that issued the brief, in any file, filename, commit message or repo description. Write "the client".
- Commits: one logical change each, message names the slice or the fix.
