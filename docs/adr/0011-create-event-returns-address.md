# 0011. Create-event returns the resolved address

Date: 2026-10-28
Status: Accepted. Supersedes the empty-body rule for `POST /api/admin/events` in [ADR 0002](0002-http-status-mapping.md).

## Context
ADR 0002 made `POST /api/admin/events` answer 200 with an empty body, because the spec says its response is nil. The address is looked up from the postal code on the server (ADR 0005) and was never shown to staff. A valid but wrong postal code created an event at the wrong place and nobody saw it until the public page listed it.

## Decision
`POST /api/admin/events` answers 200 with `{ "address": "<OneMap address>" }`. The Add Event success message shows that address, so staff can spot a wrong postal code straight away. Every other rule in ADR 0002 (status codes, error body shape) is unchanged.

## Consequences
- Easier: staff confirm where the event is without opening the public page. No new endpoint and no extra OneMap call; the lookup already happens during the create.
- Harder: the response no longer matches the spec's "nil" literally. A client that ignores the body is unaffected; one that asserts an empty body would fail.
- Risk: the address is only shown after the event exists, so a wrong postal code is caught after creation, not before. A preview endpoint before submit was considered and not chosen (it costs one more OneMap call per check against the free-tier limit).
