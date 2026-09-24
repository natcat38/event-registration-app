# 0004. Concurrency

Date: 2026-09-22
Status: Accepted

## Context
Two operations can be hit by simultaneous requests and must not corrupt state: registering for an event near capacity, and creating an event for a handler who may already have one open. Application code alone cannot guarantee correctness under a race; the database has to enforce the final guarantee.

## Decision
- Registration: one transaction. `SELECT ... FOR UPDATE` locks the event row, re-checks the event is still open under that lock, sets `registrationNo = registrationCount + 1`, increments the counter, and inserts the registration row. A unique index on `(eventUuid, registrationNo)` backs the number.
- Event creation: locks the handler row, re-checks "this handler has no open event" under that lock, then inserts. A unique index on `events.name` backs name uniqueness.
- One retry on `SequelizeDeadlockError`, for both transactions.
- The OneMap postal-code lookup happens before the transaction starts and outside the lock, so a slow external call never holds a row lock.

## Consequences
- Easier: correctness under concurrency does not depend on application timing; the row lock plus the unique index catch every race, even ones the code did not anticipate.
- Proven, not assumed: integration tests fire 20 concurrent registrations at a capacity-5 event and assert exactly numbers 00001 through 00005 succeed; and fire 2 concurrent event creates for one handler and assert exactly one 200.
- Harder: every write path now needs a transaction and a lock, which is more code than a naive insert, and needs a deadlock-retry wrapper to stay correct under contention.
- Risk: the handler row lock serialises all creates for one handler for the length of the insert transaction; acceptable at this scale, would need revisiting under real load.
