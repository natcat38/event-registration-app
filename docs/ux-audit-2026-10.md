<!-- Moved into the repo on 2026-11-09 from the portfolio-wide UX polish folder (ux-polish-2026-10-23/reports/event-registration-app.md), which has been deleted. -->
# UX audit record, 2026-10-23 to 2026-11-09

The point-in-time record of the October 2026 UX polish pass, kept with the code. The audit and its Fix log are copied unchanged below. Paths such as `shots/...` and `UXP/...` point at the original audit folder, which no longer exists; key before/after screenshots are in `docs/screenshots/ux-audit-2026-10-*.png`. Binding decisions: [ADR 0011](adr/0011-create-event-returns-address.md), [ADR 0012](adr/0012-ui-polish-wordmark-phone-cards-chart-admin-link.md), [ADR 0013](adr/0013-onemap-failure-code-and-absolute-og-image.md).

Key screenshots (390 px phone):

- Add Event when OneMap fails: [before](screenshots/ux-audit-2026-10-add-fail-before-phone.png), [after](screenshots/ux-audit-2026-10-add-fail-after-phone.png)
- Public page: [before](screenshots/ux-audit-2026-10-pub-home-before-phone.png), [after](screenshots/ux-audit-2026-10-pub-home-after-phone.png)

---

# UX audit: event-registration-app

Code read at `main` `570e40f` (clone: `C:/Users/natal/Documents/Coding/event-registration-app`, left in place, no tracked file changed). Date 2026-10-23. No open issues. ROADMAP.md does not exist (stage not applicable). `docs/adr/0009-security-scope.md` already records "no authentication on `/api/admin`" as out of scope, so it is cited below and not re-reported.

## How it was run (and what was not)

Run per README with a separate Compose project (`-p evt-ux-audit`) because Natalie's older `event-registration-app_db_data` volume holds a different DB password (it was left untouched, and the Compose project and its volume I created were removed afterwards). Migrate and seed ran, then the real Express API on :8000 and Vite on :8001.

- **OneMap was NOT live.** The API refuses to start without credentials and the OneMap URLs are hard-coded (`backend/src/services/onemap.ts:12`, `onemapToken.ts:5`). I put dummy values in the gitignored `.env`. Result: every successful "Add Event" returns 500. I verified the validation (421) paths and the OneMap-failure path in the real UI. **The Add Event success path (dialog closes, table refreshes) is code-read only** (EVT-UX-9).
- Events and registrations were inserted by SQL into the scratch DB: 13 events (long 134-char name and long address, one-letter name, Chinese + Latin name, a full event, a closed event, 0/1/95 registrations, one event with an 83-day trend) and 327 registrations.
- **The registration form has no OneMap lookup.** The public form is Event select + email only. OneMap is called by the backend when staff create an event (postal code to address). I audited that flow as the "address lookup" flow.
- Flows walked at 1440x900, 390x844 and 320x640: public list, event select, details, register (empty, invalid email, duplicate email, success), thank-you, Back; admin list, search, no-match, open-only, page 2, Trend dialog (83 rows), Add Event (empty, bad postal code, OneMap failure, Escape with typed data); simulated slow load, load error and empty list with Playwright route interception; keyboard tab order. Probe scripts are in the session scratchpad (`scratchpad/evt/`). Screenshots: `UXP/shots/evt-*.png`.

## Verdict

The public flow is clean and fast: one screen at both sizes, errors inline, input kept, correct focus on the email field after a failed submit, contrast passes everywhere I measured. The admin side is where it feels clunky. A 10-column table is wedged into a 1152 px container, so every row wraps to 90-270 px, the page is 1.8 screens (2.0 on a phone), the app bar scrolls away, and on a phone the Status and "View Trend" columns sit off-screen to the right with no cue. The Trend dialog, which is the product's headline feature ("how fast each event is filling"), is a plain 83-row table with a scrolling header.
Biggest single win: rebuild the admin table for the real job (one line per row, "18 / 60" fill, a sticky bar), which fixes EVT-UX-1 to 4 together. The phone version needs Decision D2.

## Measurements

| Page / state | Desktop screens | Phone screens | Pinned bar after scroll |
| --- | --- | --- | --- |
| Public `/` (event selected) | 1.0 | 1.0 | n/a (fits) |
| Thank-you | 1.0 | 1.0 | n/a |
| Admin `/admin` page 1 (10 rows) | 1.8 (1650 px) | 2.0 (1682 px) | none (AppBar `position="static"`, `App.tsx:37`) |
| Admin table | rows 93-273 px; 10 columns; container 1152 px vs content 1157 px | container 358 px vs content 1157 px (3.2 screens wide) | n/a |
| Trend dialog, 83 rows | content 2797 px in a 720 px body | content 4483 px in a 632 px body (dates wrap) | header row `position: static` |

Other measurements: no horizontal page scroll at 390 or 320 (the table scrolls inside its own container). Contrast: white on #1976d2 4.60, link blue on white 4.60, error red on white 4.98, label grey on white 5.74, white on chip green 5.13, registration number on its grey tile 4.22 (24 px bold, large-text threshold 3:1). All pass. Inputs are 16 px. App bar 64 px (7.1% of 900) desktop, 56 px phone. Loading to loaded height shift on the public page: 240 to 224 px (negligible). Console: only the expected 421/400 responses.

## Findings

Sev: P0 blocks or confuses the main task; P1 clunky and noticeable; P2 polish. No P0 found.

| ID | Sev | Rule | What the user experiences | Evidence | Fix | Skill | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EVT-UX-1 | P1 | S-LAY-1, S-LAY-4 | On a phone the admin table shows only Name, Created On and part of Event Date Time. Status, Registrations and **View Trend** are 3 screens of sideways swipe away, and nothing hints that the table scrolls. | `shots/evt-admin-phone-full.png`; `AdminEventsTable.tsx:35-50` (10 columns, `overflowX: auto`); measured 358 vs 1157 px | Below `sm`, render each event as a card (name, status chip, "18 / 60 registered", event date, View Trend button). Blocked by **D2**. | impeccable `critique`/`adapt`, break-ui | M |
| EVT-UX-2 | P1 | S-LAY-1, S-LAY-5, S-A11Y-1 | On desktop the table is cramped: Name and Address are forced into 120 px columns, so rows run 93-273 px tall and only about 5 of 10 rows fit in the first screen. "Registration Deadline" and "No. of Registration" headers take 168 and 151 px for a date and a 2-digit number. "View Trend" wraps onto two lines (button 64x61 px). The table is 5 px wider than its box (1157 vs 1152), which gives a horizontal scrollbar on Windows. | `shots/evt-admin-desktop-full.png`; `AdminEventsTable.tsx:53-58, 59, 78-83`; `App.tsx:50` (`maxWidth="lg"`) | `Container maxWidth="xl"`; `whiteSpace: 'nowrap'` on date cells and the button; Name `minWidth: 220`; Address clamp to 2 lines with `title`; merge Capacity and No. of Registration into one "Registered" cell ("18 / 60" plus a thin `LinearProgress`, which also answers "how fast is it filling"); shorten headers. Target: rows under 60 px, all 10 rows in about 1.2 screens. | baseline-ui, impeccable `layout` | M |
| EVT-UX-3 | P1 | S-NAV-1, S-NAV-2 | On the 1.8-screen admin page the app bar, the "Add Event" button and the filters scroll away; to use Public/Admin or add an event after reading the table you scroll back up (Natalie's own example). Pagination is at y=1574, so paging needs a scroll down, then the page resets to the top. | `App.tsx:37` (`AppBar position="static"`); `evt-admin-desktop-full.png` | `position="sticky"` (64 px is 7.1% of 900, 56 px on phone, under the 10% guidance); `scroll-margin-top` on `#main` for the skip link target; optionally repeat the Pagination above the table. | web-design-guidelines | S |
| EVT-UX-4 | P1 | S-FB-1, S-PERF-1 | Every search keystroke (after 300 ms), checkbox toggle and page change replaces the whole table with a spinner. The page collapses from 1650 px to 900 px and the scroll position is lost, then the table jumps back: visible flicker and layout shift on each filter. | `AdminPage.tsx:62-76` (`loading &&` spinner, table unmounted); measured `docH` 900 during refetch; `shots/evt-adm-desktop-10-refetch.png` | Keep the previous rows mounted while loading: dim them (`opacity: .5`, `aria-busy`) and show a `LinearProgress` under the filters; reserve `minHeight` for the table area. `useAdminEvents.ts` already keeps `events` in state, so only the render condition changes. | vercel-react-best-practices | S |
| EVT-UX-5 | P1 | S-FB-2 | When the API is down or slow the public and admin pages show "Something went wrong. Please try again." with no button to try again and no hint that the server is unreachable. The page must be reloaded by hand. | `PublicPage.tsx:53`, `AdminPage.tsx:64`, `client.ts:26`; `shots/evt-pub-phone-10-error.png`, `evt-adm-desktop-9-error.png` | `<Alert action={<Button onClick={reload}>Retry</Button>}>`; in `toApiError`, when `err.response` is undefined return "Can't reach the server. Check your connection and retry." (`loadEvents` and the admin `refresh` already exist). | impeccable `harden` | S |
| EVT-UX-6 | P1 | S-FB-4, S-FB-2 | When OneMap fails (any failure is a 500 by design, README), Add Event shows the raw string **"Internal server error"** at the top of the dialog. Nothing says the address lookup failed, that the form data is safe, or that a retry may work. (Input is kept, which is good.) | `backend/src/middleware/errorHandler.ts:20`; `AddEventForm.tsx:52-55` prints `error.message` verbatim; `shots/evt-adm-desktop-8-add-onemap-fail.png`, `evt-adm-phone-8-add-onemap-fail.png` | In `toApiError`, map status 500 and 0 to plain copy such as "We couldn't save the event just now. The postal code check may be unavailable. Your details are kept; try again in a minute." (Natalie to approve wording; it makes a claim about cause.) Put it as the dialog's `Alert` with `role="alert"` and scroll it into view on phones. | impeccable `harden`, ux-copy | S |
| EVT-UX-7 | P1 | S-FB-4, S-LAY-2 | The staff member types a 6-digit postal code and gets no address until after pressing Add Event; the resolved address is never shown, even after success. A wrong-but-valid postal code creates the event at the wrong place and nobody sees it until the public page. | `AddEventForm.tsx:77-87` (plain text field, helper "6 digits"); address resolved only in `backend/src/services/events.ts`; `evt-adm-desktop-8-add-onemap-fail.png` | Needs a new read endpoint (for example `GET /api/admin/address?postalCode=`) and an inline "Address: 1 Raffles Place, Singapore 048616" under the field on blur. Blocked by **D5**. | impeccable `operate`, tdd | M |
| EVT-UX-8 | P1 | S-NAV-4, S-LAY-4, S-A11Y-1 | The Trend dialog is a bare table. With an 83-day event it is 2797 px of rows under a header that scrolls away, so you cannot tell which column is which after the first 20 rows. On a phone the date wraps ("2026-" / "10-21"), rows are 53 px and the body is 4483 px (5.3 screens) inside a small 326 px dialog. There is no total, peak day or "x of y seats" summary. | `TrendDialog.tsx:72-90` (no `stickyHeader`, no nowrap), `:26` (no `fullScreen`); `shots/evt-adm-phone-4-trend.png`, `evt-adm-desktop-4-trend.png`; measured rows 83 | `stickyHeader` plus `maxHeight`; `whiteSpace: 'nowrap'` on the date cell; `fullScreen` below `sm` (`useMediaQuery`); add one summary line above the table (total, peak day, seats left). | baseline-ui | S |
| EVT-UX-9 | P1 | S-FB-3 | (Code-read, not run live.) After Add Event succeeds the dialog closes and the table refetches, with no confirmation. The list keeps the current page and search, and new events sort by `createdAt` desc: if staff are on page 2 or have a search typed, the new event is not visible and they cannot tell it was saved. | `useAddEventForm.ts:91-93`; `useAdminEvents.ts:67` (`refresh` only bumps a key); `adminEvents.ts:57` | On success: reset to page 1, clear search, show a `Snackbar` "Event 'X' added" with the name. | impeccable `harden` | S |
| EVT-UX-10 | P2 | S-ID-1 | "Registration trend" has no visual: the shape of sign-ups over time is the one thing the product exists to show, and it is a column of numbers. | `TrendDialog.tsx`; README line 3 | Add a small area or bar chart above the table. Needs a charting dependency or hand-built SVG. Blocked by **D3**. | dataviz | M |
| EVT-UX-11 | P2 | S-LAY-1 | On the public page the selected event's name is only in the closed Select, truncated with an ellipsis ("Sustainability in Business Forum 2026: Climate Disclosure, Supply…", text 1069 px in a 536 px box, 294 px on phone). The details panel lists date, address and deadline but never the full name, so the registrant cannot confirm which event they are joining. The open menu on desktop is 1050 px wide. | `SelectedEventDetails.tsx:7-17`; `PublicPage.tsx:76-90`; `shots/evt-pub-desktop-3-selected-long.png`, `evt-pub-phone-5-bad-email.png` | Show the name as an `h2` in the details panel (wraps), set `MenuProps={{ PaperProps: { sx: { maxWidth: 'min(90vw, 600px)' }}}}`, `MenuItem` `whiteSpace: 'normal'`. | break-ui | S |
| EVT-UX-12 | P2 | S-NAV-3 | Search text, the Open Events filter and the page number live in component state, so reload or Back loses them and a filtered view cannot be shared. | `useAdminEvents.ts:9-12` | `useSearchParams` for `q`, `open`, `page` (the task-router UI already does this). | impeccable `operate` | S |
| EVT-UX-13 | P2 | S-A11Y-1, S-A11Y-6 | Phone targets are small: Register, Add Event and nav buttons are 37 px tall, open-event menu items 29-30 px, the checkbox row 42 px. The postal code field has no `inputMode="numeric"`, `maxLength={6}` or `autoComplete="postal-code"`, so phones show a full keyboard. All inputs are 16 px (good). | measured `evt-pub-phone` and `evt-adm-phone` (`navbtns` 65x37, options 30); `AddEventForm.tsx:77-87`; `AdminEventsTable.tsx:63-68` (`size="medium"`) | MUI theme: `MuiButton` `size: 'large'` under `sm` or `minHeight: 44`; `MenuItem` `minHeight: 44`; `slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }}`. | web-design-guidelines | S |
| EVT-UX-14 | P2 | S-NAV-3 | Public and Admin look identical in the app bar whichever page you are on (no active state, no `aria-current`). Separately, the **Admin link is shown to every public visitor** while ADR 0009 says admin has no authentication. | `App.tsx:42-47` | Use `NavLink` styling plus `aria-current="page"` (underline or lighter background). Whether to hide the link is **D4**. | impeccable `critique` | S |
| EVT-UX-15 | P2 | S-LAY-5, S-ID-1 | Dates come in two formats on one screen: "21 Oct 2026, 11:00 am" and raw "2027-01-11" (deadline, trend dates). | `AdminEventsTable.tsx:59`, `SelectedEventDetails.tsx:15`, `TrendDialog.tsx:84`; `utils/dates.ts:25` | Add `formatDate` next to `formatDateTime` (deadline is a Singapore calendar date: format with `timeZone: 'UTC'` on a `T00:00Z` parse to avoid day shifts) and use it in all three places. | baseline-ui | S |
| EVT-UX-16 | P2 | S-A11Y-3, S-FB-2 | The thank-you screen shows the registration number ("00013") with no label, and it is the only proof of registration: reloading redirects home and nothing is emailed. Focus stays on `<body>` after the route change, so keyboard and screen-reader users are not moved to the confirmation. The page does not repeat the event date or address. | `ThankYouPage.tsx:41-44, 23-26`; measured `activeElement` = BODY; `shots/evt-pub-desktop-6-thanks.png` | Label it "Registration number"; pass date and address in router state; add Copy and Print buttons; focus the `h1` on mount (`tabIndex={-1}` plus `useEffect`). Do not add "a confirmation email has been sent": the backend sends none. | impeccable `clarify` | S |
| EVT-UX-17 | P2 | S-FB-3 | Escape, backdrop click or Cancel silently discards a half-filled six-field Add Event form. On phones the dialog is a floating 326 px card rather than full screen. | `AddEventDialog.tsx:24-28`; measured "dialog closed on Esc with data" = true | If any field is non-empty, ask "Discard this event?" before closing; `fullScreen` under `sm`. | impeccable `harden` | S |
| EVT-UX-18 | P2 | S-ID-2, S-ID-1 | Branding is generic (see below). No font file is loaded (no `@fontsource` in `package.json`, no `<link>` in `index.html`), so MUI's Roboto stack falls back to Helvetica or Arial on machines without Roboto installed. | `frontend/index.html:3-6`, `package.json`, `main.tsx:9-22` | Add `theme-color` meta (S, unblocked). Name, logo, description and OG image are blocked by **D1**; self-hosting Roboto adds a dependency (`@fontsource/roboto`), so list it under D1 option B. | hallmark (options only) | S |

## Decisions for Natalie

**D1. Identity (blocks EVT-UX-18 name, logo, description, OG).** Protects: a recruiter opening the demo sees a product, not a template. Enables: tab, share and bookmark recognition. The brief forbids naming the client company, so any name is a neutral fictional one.
- A. Keep "Event Registration" and the blue square favicon; add only `theme-color`, a description and a self-hosted font. Cheapest; stays visibly generic.
- B. You pick a short fictional product name; agent adds a wordmark in the app bar, an SVG favicon and an OG image, and loads Roboto via `@fontsource`. Looks finished; one new small dependency.
- C. Present it as a portfolio piece (a one-line "built by Natalie" credit) with a link to the repo in the footer. Honest and recruiter-oriented; the page now carries a claim about authorship.

**D2. Admin events on a phone (blocks EVT-UX-1).** Protects: staff can read fill status and open Trend on a phone. Changes the look of the table view.
- A. Cards below `sm`, table above (clearest on phones; two renderings to maintain).
- B. Keep the table, freeze the Name column, add a right-edge fade and a "swipe for more" hint (smallest change; the Trend button is still off-screen).
- C. Show only Name, Status and a "View" button in the table on phones, with a details drawer per event (least width; adds a drawer to build).

**D3. Trend chart (blocks EVT-UX-10).** Adds either a dependency or hand-written chart code.
- A. `@mui/x-charts` (consistent with MUI; adds a package and its bundle weight, not measured here).
- B. Hand-built inline SVG area chart (no dependency; about 60 lines to maintain, no built-in tooltip).
- C. No chart; keep the table with sticky header and the summary line from EVT-UX-8.

**D4. Admin link for the public (EVT-UX-14).** ADR 0009 keeps authentication out of scope. This only concerns what the nav shows.
- A. Leave the Admin link visible (honest about the proof-of-concept scope).
- B. Hide the link from the public nav and keep `/admin` reachable by URL (cosmetic, not security).
- C. Add a simple shared-password gate (a real feature; reverses an ADR).

**D5. Address preview in Add Event (blocks EVT-UX-7).** Protects: wrong postal codes are caught before an event goes public. Costs a new endpoint and one OneMap call per check against the free-tier limits.
- A. No preview; show the resolved address in the success toast only (needs the create endpoint to return it; today the body is empty by ADR 0002).
- B. New `GET /api/admin/address` called on blur with a debounce, preview under the field.
- C. Preview on a "Check" button only (fewer OneMap calls, one more click).

## Branding status

| Item | Status |
| --- | --- |
| Name in header | Partial: plain text "Event Registration", no logo (`App.tsx:39-41`) |
| Favicon | Present: generic blue square with three bars (`public/favicon.svg`), default for a template |
| `<title>` | Present and per route ("Register / Admin: Events / Thank you | Event Registration") |
| Description, theme-color, OG image, manifest | Missing |
| Palette and type | Partial: MUI default blue and the Roboto stack with no font file loaded |

## Fix batches (non-blocked findings)

1. **Admin shell and table (one PR):** EVT-UX-2, 3, 4, 12, 14 (active state only), 15. Goal: the admin page is one dense, pinned, flicker-free screen.
2. **States and errors (one PR):** EVT-UX-5, 6, 8, 9, 17. Goal: every failure and every success says what happened and offers the next step.
3. **Public flow and touch polish (one PR):** EVT-UX-11, 13, 16, plus the `theme-color` part of 18. Goal: the registrant always knows which event they are in and has proof of registration.

Waiting on decisions: EVT-UX-1 (D2), 7 (D5), 10 (D3), 14 hide-link (D4), 18 identity (D1).

## Cleanup note

The two dev servers and the scratch Compose project (`evt-ux-audit`, volume removed) are stopped. The clone still has `node_modules/` and a gitignored `.env` with dummy OneMap values; `git status` is clean. A stopped container `event-registration-app-db-1` from the first (abandoned) compose attempt remains and can be removed with `docker rm event-registration-app-db-1`. Natalie's old volume `event-registration-app_db_data` was not touched.

## Fix log

- **PR #2** https://github.com/natcat38/event-registration-app/pull/2 (fix/ux-admin-shell). Merged 2026-10-23T18:39:23Z. Fixed EVT-UX-1 (D2 A), 2, 3, 4, 12, 14 (active state only, D4 A), 15. Desktop admin page 1.8 screens (1650 px) to 1.0 (902 px); rows 93-273 px to 53 px; pinned bar now 64 px (56 px phone); phone page 2.0 to 2.1 screens (cards add a fill bar and a 44 px button). Bundle unchanged (592.8 kB, gzip 185.5 kB).
- **PR #3** https://github.com/natcat38/event-registration-app/pull/3 (fix/ux-states-address). Merged 2026-10-28T04:42:58Z. Fixed EVT-UX-5, 6, 7 (R11 option 1: create returns `{ address }`, ADR 0011 supersedes part of ADR 0002, API tests added), 8, 9, 10 (R9 option 1: `@mui/x-charts`, lazy loaded), 17; added `.claude/worktrees/` to .gitignore. Bundle: main JS 592.92 kB (gzip 185.49) to 604.88 kB (gzip 189.31); chart chunk 321.58 kB (gzip 101.27) loads on first Trend open. EVT-UX-6 wording still needs Natalie's approval.
- **PR #4** https://github.com/natcat38/event-registration-app/pull/4 (fix/ux-public-brand). Merged 2026-10-28T04:52:28Z. Fixed EVT-UX-11, 13, 16, 18 (G3 A: text wordmark, existing SVG favicon kept, meta description, theme-color, generated 1200x630 OG image, `@fontsource/roboto`). R10 option 1: Admin link stays. Phone targets 37 px to 44 px; menu 1004 px to 600 px; focus on the confirmation heading. Bundle: main JS 604.88 kB to 606.58 kB, CSS 0.65 kB, fonts 66.3 kB (woff2). `og:image` is a relative path until the app has a deployed URL.
- Skipped: none. Left over: EVT-UX-18 favicon unchanged on purpose (already a plain shape in the app's blue).

---

## Owner decisions, 2026-11-09 (walkthrough of the open items)

| Item | Evidence | Decision |
|---|---|---|
| EVT-UX-6 error wording | The Add Event message said "The postal code check may be unavailable" on every 500, but `errorHandler.ts` returns 500 for any unexpected failure, so a database outage also blamed the postal check | Option 3: the backend names the cause. A OneMap failure is still a 500 (the spec allows four codes) with `code: "address_lookup_failed"` in the body. The UI names the postal check only for that code; any other 500 reads "We couldn't save the event just now. Your details are kept; try again in a minute." ADR 0013. |
| Relative `og:image` | `index.html` had `content="/og-image.png"`; LinkedIn, Facebook and Slack ignore relative OG image URLs. No deployed URL exists yet | Option 2: `vite.config.ts` prefixes `VITE_SITE_URL` at build time. Unset, the path stays relative (verified: `/og-image.png`); set to `https://events.example.test/`, the built page carries `https://events.example.test/og-image.png`. ADR 0013. |

## From the 2026-11-02 open-items sweep

The portfolio sweep found no open issues or PRs in this repo, so it recorded nothing specific to it.
