# 0007. Schema management

Date: 2026-09-22
Status: Accepted

## Context
The database schema and its seed data need a repeatable setup step that a reviewer can run from a clean checkout. Sequelize offers two paths: call `sequelize.sync()` at startup, or manage the schema with versioned migration files.

## Decision
- Use `sequelize-cli` migrations and seeders. No call to `sequelize.sync()` anywhere in the codebase.
- Sequelize's own documentation treats `sync()` as a tool for prototyping only, and warns against using it once a schema needs to evolve safely; a versioned migration is the documented path for anything meant to run more than once.
- One seeder inserts five handlers with fixed, hard-coded uuids, so the README can list them by name and id for anyone who needs to create an event by hand.
- The migration pins `utf8mb4_0900_ai_ci` on `events.name`, so name-uniqueness behaviour does not depend on whatever collation the server happens to default to. uuid columns are `CHAR(36) ascii_bin`, so uuid lookups are case-sensitive and exact.

## Consequences
- Easier: `npm run db:migrate && npm run db:seed` is a repeatable, documented setup step; a reviewer never has to guess what state the schema is in.
- Easier: fixed seed uuids mean the README can show a real, working handler id in its examples.
- Harder: every schema change now needs a new migration file instead of an edit to a model; more ceremony than `sync()`, accepted because it is the documented, production-shaped approach.
- Risk: pinning collation explicitly is a small deviation from "whatever MySQL defaults to," but removes a real source of environment-dependent test flakiness.
