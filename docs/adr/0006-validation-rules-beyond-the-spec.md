# 0006. Validation rules beyond the spec

Date: 2026-09-22
Status: Accepted

## Context
The spec allows "other validations you see fit" on event creation but is silent on several concrete cases. Each rule below is stricter than the spec. They are kept because a real admin team would want them, and each one trades a small amount of automated-test risk for that. The risk is named per rule under Consequences so the trade is visible.

## Decision
- Unique email per event: a second registration with the same email, for the same event, is rejected 400 ("This email address is already registered for this event."), backed by a unique index.
- `deadline` must not fall after the event's `dateTime`, compared as Singapore calendar dates: 421.
- `capacity` must be an integer from 1 to 99999, so the registration number always renders as five digits: 421.
- `dateTime` and `deadline` may not be more than 100 years in the future, which also bounds the size of the trend report: 421.
- Every uuid field is validated with zod's `.uuid()`, which enforces the RFC variant nibble, and lower-cased before any lookup: `11111111-1111-1111-1111-111111111111` is 421 (malformed shape), while any well-formed but unknown id is 400 (not found), on every endpoint, including an unknown `handlerUuid`.
- Inputs are normalised before validation and storage: `name` and `emailAddress` are trimmed, `emailAddress` is lower-cased and must be a valid address of at most 254 characters, so uniqueness compares normalised values.
- Past event dates and past deadlines are accepted on creation, so a closed event can be created directly for testing.
- Query leniency goes the other way: `open` accepts `true` or `1` case-insensitively and treats anything else as absent, `page` defaults to 1, and neither ever returns 421 for a value that merely means "no filter".

## Consequences
- Unique email per event: an automated script that fills a capacity-5 event by repeating one address stops at the second call with 400, not five. The README must tell testers to use distinct addresses per registration.
- Deadline-before-event-date: a script that sets a generous, valid-looking deadline without checking it against the event date can get an unexpected 421. The README states the rule plainly.
- Capacity ceiling: a script that sets `capacity: 1000000` to build a "never fills" fixture gets 421, not a stored event. The README states the ceiling.
- 100-year date ceiling: the common "never closes" test fixture of `9999-12-31` is rejected with 421 instead of accepted as an always-open event. The README names the ceiling.
- Strict uuid variant: a hand-typed fake id like all-`1`s is 421, not 400 as "well-formed but unknown" would suggest. The README states the split.
