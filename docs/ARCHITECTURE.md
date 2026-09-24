# Architecture

Companion to the ADRs in `docs/adr/`. This page says how a request moves through the system, what the data model is, and what the wire contract guarantees.

## Request flow

A route parses and validates the request with a zod schema (421 on failure), then calls exactly one service function. The service holds the business rules and, for writes, runs inside a transaction with a row lock. The service reads or writes through a Sequelize model. The route sends back whatever the service returns; it holds no business logic of its own. See ADR 0001.

## Data model

```
handlers       uuid CHAR(36) PK · name VARCHAR(255) · createdAt · updatedAt
events         uuid PK · name VARCHAR(255) NOT NULL UNIQUE · dateTime DATETIME(3) NOT NULL
               · postalCode CHAR(6) NOT NULL · address VARCHAR(500) NOT NULL · deadline DATETIME(3) NOT NULL
               · capacity INT NOT NULL · registrationCount INT NOT NULL default 0
               · handlerUuid CHAR(36) NOT NULL FK -> handlers, indexed · createdAt · updatedAt
registrations  uuid PK · eventUuid CHAR(36) NOT NULL FK -> events · emailAddress VARCHAR(254) NOT NULL
               · registrationNo INT NOT NULL · createdAt · updatedAt
               UNIQUE (eventUuid, registrationNo) uniq_event_registration_no
               UNIQUE (eventUuid, emailAddress)   uniq_event_email
```

uuid columns are `CHAR(36) ascii_bin`. Text columns used in uniqueness or search are pinned to `utf8mb4_0900_ai_ci`. All timestamps are stored in UTC. `registrationCount` is a counter written inside the locked registration transaction. See ADR 0007.

## The open rule

`open = now <= deadline AND registrationCount < capacity`. One definition lives in the backend's `utils/dates.ts`, exporting both a TypeScript check and a Sequelize `where` fragment; the frontend keeps a deliberate copy for the status badge. Both packages run the same fixtures so the two cannot drift silently. See ADR 0003.

**Worked example.** Admin creates "Tech Summit" with `dateTime: "2026-04-25T18:00:00+08:00"`, `deadline: "2026-04-20"`, `capacity: 2`, on 2026-04-15.

1. `deadline` is date-only, so it is stored as `2026-04-20T15:59:59.999Z` (end of day, Singapore).
2. Public list on 2026-04-18 shows the event. Two people register: numbers `00001` and `00002`. `registrationCount` becomes 2.
3. A third register on 2026-04-18 finds `registrationCount == capacity` under the row lock and gets 400 "This event is full.".
4. On 2026-04-21 00:00 Singapore the event is closed by deadline even if seats remained.
5. Trend for this event: rows for 2026-04-15 through 2026-04-20 (Singapore dates, inclusive), `registrationCount` cumulative (0,0,0,2,2,2), `newRegistrationCount` (0,0,0,2,0,0). A registration at `2026-04-17T16:30:00Z` counts on 2026-04-18.

## API contract

All bodies are JSON. Success is 200. Every error body is `{ message: string, errors?: Record<string, string[]> }`. See ADR 0002.

### `GET /api/admin/events?page=1&search=&open=true`

| Field | Rule | Failure |
|---|---|---|
| `page` | integer >= 1, default 1, max 1000000 | 421 |
| `search` | trimmed, max 255 chars, matches name, address, or handler name | 421 if over length |
| `open` | `true` or `1` filters to open events; anything else means no filter | never 421 |

Response: `{ total, events: Event[] }`, page size 10, ordered `createdAt DESC, uuid ASC`.

### `POST /api/admin/events`

| Field | Rule | Failure |
|---|---|---|
| `name` | trimmed, 1-255, unique | empty or too long 421; duplicate 400 `errors.name` |
| `dateTime` | ISO 8601, Singapore if no offset, at most 100 years ahead | 421 `errors.dateTime` |
| `postalCode` | 6 digits, must resolve in OneMap | not 6 digits 421; not found 400 `errors.postalCode` |
| `deadline` | `YYYY-MM-DD` or an ISO date-time (only the Singapore date is kept), not after `dateTime`'s Singapore date, at most 100 years ahead | 421 `errors.deadline` |
| `capacity` | integer 1-99999 | 421 `errors.capacity` |
| `handlerUuid` | must exist and have no open event | malformed 421; unknown or busy 400 `errors.handlerUuid` |

Success: empty 200 body.

### `GET /api/admin/handlers`

Response: `{ uuid, name }[]` ordered by name. See ADR 0008.

### `GET /api/public/events`

Response: `{ uuid, name, dateTime, address, deadline }[]`, open events only, ordered `dateTime ASC`.

### `POST /api/public/register`

| Field | Rule | Failure |
|---|---|---|
| `eventUuid` | must be a real uuid, then a real event | malformed 421, unknown 400 "Event not found." |
| `emailAddress` | trimmed, lower-cased, valid, max 254 | 421 `errors.emailAddress` |
| event state | open, checked under the row lock | closed 400, full 400 |
| duplicate | same email already registered | 400 `errors.emailAddress` |

Response: `{ registrationNo: "00001" }`.

### `POST /api/admin/events/:uuid/trend`

| Field | Rule | Failure |
|---|---|---|
| `:uuid` | must be a real uuid, then a real event | malformed 421, unknown 400 "Event not found." |

Response: one row per Singapore calendar date from creation to deadline, `{ date, registrationCount, newRegistrationCount }[]`.

## Concurrency

Registration and event creation each run inside one transaction. `SELECT ... FOR UPDATE` locks the row that the rule depends on: the event row for registration, the handler row for creation. The rule is re-checked under that lock, right before the write. `now` is read inside the lock, not at request arrival, so a request that waited on the lock is judged at the moment it actually runs. A unique index backs each guarantee: `(eventUuid, registrationNo)` for the registration number, `events.name` for name uniqueness. One retry on `SequelizeDeadlockError`, then 500. See ADR 0004.

## Singapore time rules

All timestamps are stored in UTC; Sequelize's timezone is fixed at `+00:00`. `deadline` keeps only the Singapore date of its input, meaning 23:59:59.999 Singapore on that date. A date-only `dateTime` means 00:00 Singapore. Responses echo `deadline` as a Singapore calendar date and every other timestamp as ISO UTC. The trend groups rows by `CONVERT_TZ` with numeric offsets, since named zones return NULL without loaded timezone tables. See ADR 0003.

## Known limits and production additions

- No authentication on any route. The specification does not require it for this scope.
- No idempotency keys on write endpoints; a retried POST can create a duplicate attempt at the application layer, though the unique indexes still prevent duplicate data.
- No graceful shutdown handling.
- An OneMap outage turns every event creation into a 500; there is no fallback address source. See ADR 0005.
- The rate limiter on registration is off by default; it only activates with `RATE_LIMIT_ENABLED=true`. See ADR 0009.

See ADR 0009 for the full security scope and its stated production gaps.
