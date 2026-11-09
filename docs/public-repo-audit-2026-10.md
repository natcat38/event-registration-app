# Public repo audit, October 2026: findings and outcomes

A read-only audit of the public `main` on 2026-10-22 raised the findings below.
Each was rechecked against `main` on 2026-11-09. The UX pass from the same month
is recorded separately in [ux-audit-2026-10.md](ux-audit-2026-10.md).

| ID | Finding | Outcome |
|---|---|---|
| 1 | No way to see the app without running it: no deploy, and the trend chart has no screenshot. | Open: [#7](https://github.com/natcat38/event-registration-app/issues/7). Capturing the chart needs the owner's OneMap account. |
| 2 | Wording read as a graded exercise: "the specification", "testers", "a reviewer", "graded contract" across the README, ADRs and code comments, plus an AGENTS.md rule about an unnamed company. | Fixed (owner decision 2026-11-09): neutral wording throughout ("the requirements", "the API contract", "a new reader"); the AGENTS.md line is removed; ADR 0006 renamed to `0006-validation-rules-beyond-the-requirements.md`. Git history is unchanged. |
| 3 | `docs/ARCHITECTURE.md` and ADR 0003 said both packages run the same fixtures; the two `dates.test.ts` files are written separately. | Fixed: both now say each package tests the same boundary cases on its own, and that a change to one copy must be mirrored by hand. |
| 4 | Admin routes have no authentication or throttle, and each create calls OneMap. | No change: out of scope by design and stated in the README and ADR 0009. Matters only if the app is deployed. |
| 5 | The rate limit (10000 per minute, off by default) is decorative. | No change: the README and ADR 0009 state the number and why it is off by default. |
