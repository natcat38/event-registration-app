# 0003. Dates and Singapore time

Date: 2026-09-22
Status: Accepted

## Context
The event company operates in Singapore time, but MySQL and Sequelize work naturally in UTC. Every date field also needs one fixed meaning for "date-only" input, or the backend and frontend will disagree about whether an event is open.

## Decision
- Store all timestamps in UTC. Sequelize timezone is set to `+00:00`.
- `deadline` is accepted only as `YYYY-MM-DD` (a real calendar date); any other form is 421. It means 23:59:59.999 Singapore time on that date. This is what makes the echoed value round-trip exactly.
- A date-only `dateTime` means 00:00 Singapore time on that date.
- For `dateTime`: an ISO timestamp with an offset is taken as-is; one with no offset is treated as Singapore time (+08:00).
- Responses echo `deadline` as a `YYYY-MM-DD` Singapore calendar date, and echo `dateTime` and `createdAt` as ISO UTC.
- In the backend one `isOpen` definition serves both the TypeScript check and the SQL `where` fragment. The frontend keeps a deliberate copy for the status badge; each package's unit tests cover the same edge cases (the deadline day, the day after, full capacity) so a change to the rule fails on both sides.
- `now` is captured inside the locked transaction, after the row lock is taken, not at the moment the request arrives.
- The registration trend groups rows by `DATE(CONVERT_TZ(createdAt, '+00:00', '+08:00'))` and runs from the Singapore date of `createdAt` to the Singapore date of `deadline`, inclusive. Numeric offsets only: named zones return NULL without MySQL's timezone tables.

## Consequences
- Easier: one place per package defines "open," pinned by shared fixtures, so the badge and the backend check agree.
- Easier: storing UTC keeps every column and index behaviour independent of the server's local timezone setting.
- Harder: every date-only field needs its own conversion rule; a bug in the offset is not naturally visible in the raw stored value, only when rendered as a Singapore date.
- Risk: capturing `now` after the lock, rather than at request arrival, means two requests arriving one millisecond apart can see different `now` values under load; this is intentional and closes a real race, not a spec requirement.
