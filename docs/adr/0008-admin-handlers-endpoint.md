# 0008. Extra endpoint: list handlers

Date: 2026-09-22
Status: Accepted

## Context
The admin "Add Event" form needs a handler to assign the event to, shown as a dropdown. The requirements describe the dropdown but defines no endpoint that returns the list of handlers to fill it.

## Decision
Add `GET /api/admin/handlers`, returning `{ uuid, name }[]`. This is the one endpoint in the system with no line in the requirements to point at; it exists purely to make the required form usable.

## Consequences
- Easier: the Add Event form can populate its handler dropdown from real data instead of a hard-coded list.
- Harder: nothing, in terms of the required API. The endpoint is additive. It adds a route and a read-only query, not a new behaviour that could conflict with an API client's expectations elsewhere.
- Risk: essentially none; an API client that only exercises the five required endpoints will simply never call this one.
