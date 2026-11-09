# 0012. UI polish: the app's own name as the wordmark, cards on phones, a real chart, and a visible Admin link

Date: 2026-10-24
Status: Accepted. Owner decisions from the 2026-10 UX polish pass. The address-in-toast call from the same pass is [ADR 0011](0011-create-event-returns-address.md).

## Context
A UX audit on 2026-10-23 found four questions that were product calls, not fixes:
- The app had no visible name on its pages and no share metadata. The requirements give the product no name, so any name would be invented.
- The admin events table needed a sideways scroll on a phone to reach the Registered count and the Trend button.
- The registration trend was a plain table of dates and counts.
- The public nav shows an Admin link, while [ADR 0009](0009-security-scope.md) leaves authentication out of scope.

## Decision
- **Name (G3, option A).** The existing name "Event Registration" is the text wordmark, linking home. No new name, no logo mark. The existing SVG favicon stays. The page carries a meta description, a theme colour and a generated 1200x630 share image. Roboto is self-hosted through `@fontsource/roboto`.
- **Admin table on phones (G4, option A).** Below MUI's `sm` breakpoint each event is a card (`AdminEventCards.tsx`); from `sm` up it is the table.
- **Trend chart (R9, option 1).** The trend dialog draws a line chart with `@mui/x-charts`, loaded lazily the first time Trend opens. This adds a dependency.
- **Admin link (R10, option 1).** The link stays visible in the public nav. Hiding it would be cosmetic, not security, and a password gate would reverse ADR 0009.

## Consequences
- Easier: the app names itself the same way on every page and in link previews; staff on a phone read every column without scrolling sideways; the trend reads at a glance.
- Harder: two renderings of the events list (cards and table) to keep in step. The chart adds about 322 kB (101 kB gzipped) as a separate chunk, fetched only on the first Trend open; the main bundle grew from 592.9 kB to 606.6 kB across the pass.
- Open: `og:image` is a relative path until the app has a deployed URL, so a link-preview crawler cannot fetch it yet. The plain-language server-error copy (EVT-UX-6) still guesses a cause and waits on the owner's wording.
