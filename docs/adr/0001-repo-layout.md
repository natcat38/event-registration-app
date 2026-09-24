# 0001. Repo layout

Date: 2026-09-22
Status: Accepted

## Context
The system has two clients (an admin UI and a public UI) and one backend. The repo needs a layout that a reviewer recognises in seconds and that jest and Sequelize's own tooling can use with their default settings, without extra config.

## Decision
Two independent packages, no root `package.json`:
- `backend/` and `frontend/`, each with its own `package.json`, lint config, and test runner.
- Backend: `routes/` → `services/` → `models/`, no controllers layer. Routes parse and call one service function; services hold the business rules and the transactions; models are Sequelize definitions only.
- `migrations/` and `seeders/` sit at the backend package root, matching sequelize-cli's default lookup path. A three-line `.sequelizerc` points the CLI at `config/database.cjs`.
- Tests are colocated: `*.test.ts` next to the file it tests, `*.integration.test.ts` for tests that need a real database. jest's default match pattern finds both; `jest.config.js` only splits them into two projects.
- Frontend: `src/{api,components,pages,utils}`.

## Consequences
- Easier: a reviewer opens one folder and sees the whole request path; no hunting across a `tests/` tree that mirrors `src/`.
- Easier: `sequelize-cli` and jest both use their default lookup paths, so the README has nothing unusual to explain.
- Harder: no shared types package between backend and frontend, so the two sides can drift on a shape; accepted, since the spec's contract is small enough to keep in sync by hand.
- Riskier: a controllers-less routes layer means route files hold a small amount of parsing logic; kept thin on purpose, one call to a service per route.
