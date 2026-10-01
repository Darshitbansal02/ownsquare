# Shared UI / UX System

Owner: Deepti. Applies to Public, Investor, Broker and Admin; no independent admin theme. Baseline: [source design system](docs/PS1_Fractional_Real_Estate_Investment_Portal.md). Interfaces follow [CONTRACTS.md](CONTRACTS.md).

## Color tokens

| Token | Hex | Usage |
|---|---|---|
| primary | #0F2A4A | Sidebar, headings, primary actions |
| accent | #10B981 | Positive indicators, funding/success surfaces |
| gold | #D4A017 | Premium badges/highlights |
| background | #F7F8FA | Page canvas |
| surface | #FFFFFF | Cards/forms/tables |
| danger | #DC2626 | Error, rejected, negative ROI |
| warning | #F59E0B | Pending/KYC review |
| text | #111827 | Primary copy |
| textSecondary | #6B7280 | Supporting copy |

Color is not the only indicator. Bright emerald/gold/amber with white normal text may fail 4.5:1; use dark text on light tints or an approved darker button token and verify actual contrast. Preserve the source palette rather than silently choosing unreadable pairings.

## Typography and numbers

Inter body 400; Inter/Plus Jakarta Sans headings 600-700. Proposed sizes: body 16px, support 14px, KPI 28-36px, page heading 24-32px; line height 1.5 body. Tabular figures for every money/percentage/unit column.

Format paise by dividing by 100 only at display: `Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'})`. INR 1 crore displays as Indian-grouped currency; compact cards may use L/Cr with full value in accessible text/tooltip. Use the actual rupee glyph in application rendering; API fields remain paise. Never submit compact text as money.

## Spacing and surfaces

8-point spacing scale: 8/16/24/32/40/48; 4px permitted for tight icon alignment. Cards 12-16px radius, restrained shadow/border, consistent white surface. Forms/cards 16px padding mobile, 24px desktop. Avoid decoration that obscures ownership and funding.

## Shared components and contracts

| Component | Behavior |
|---|---|
| Button | primary/navy, secondary/outline, danger, text; consistent sizes; disabled/pending state; semantic button; loading label |
| Card / KpiCard | Title/value/supporting explanation, skeleton alternative; disclose estimated vs realized values |
| StatusChip | Receives canonical enum, displays human-readable label and icon/text; never mutates status |
| FundingBar | unitsSold/totalUnits, textual percent and remaining units; accessible progressbar; empty-safe |
| PropertyCard | Image/title/city/type/unit price, funding, expected appreciation; no guaranteed-return language |
| DataTable | Sticky header, allowlisted sort, pagination, row hover, explicit empty/error states; optional constrained local scroll on mobile, never page overflow |
| FormField | Visible label, help/error association, required indication, numeric/unit guidance; no placeholder-only labels |
| ConfirmModal | Summary, destructive/financial consequences, cancel/confirm; focus trap/restore, Escape unless submitting |
| Toast | Consistent success/error text; errors also appear inline where action is recoverable; accessible live region |
| Charts | Recharts funding line, allocation donut and property status chart; accessible legend/text/table; consistent colors |

Planned Deepti-owned components define props once; broker/admin import them. Devang's property wizard exposes a broker/admin mode for permitted operations without duplicating financial or media forms.

## Status styling

| Property status | Display / visual |
|---|---|
| DRAFT | Draft / gray |
| PENDING_APPROVAL | Pending approval / amber |
| LIVE | Live / blue |
| FUNDED | Funded / emerald |
| HOLDING | Holding / purple |
| SOLD | Sold / navy |
| REJECTED | Rejected / red; show reason |
| CANCELLED | Cancelled / gray; refund explanation |

KYC/withdrawals reuse pending amber, approved emerald, rejected red and not-submitted gray. Investment ACTIVE blue, EXITED navy, REFUNDED gray. Transaction direction labels Credit/Debit are always present; loss ROI is negative and red with a minus sign, not color alone.

## Forms and financial UX

- Validate on client for immediate feedback; display server field errors from the one error envelope. Preserve entered values after failure.
- Listing wizard: Basics -> Location -> Financials -> Media/docs -> Review; progress indicator and save draft at any step. unitPrice is read-only server-derived, with local preview explicitly provisional.
- Amount input converts decimal rupee text to exact paise using integer/string parsing, not unconstrained floating multiplication. Unit selector accepts integers only; show minUnits and available/cap maximum.
- Checkout: amount, units, ownership, projection assumption, current/available balance and shortfall; terms checkbox; confirm modal; retain Idempotency-Key during pending/retry. Disable when invalid/short balance/KYC blocked.
- Handle 409 availability by refreshing remaining units and preserving intent; never imply purchase succeeded. Network uncertainty uses same key on retry.
- Sale: positive price (loss allowed), current fee, distributable, per-investor payout, remainder assignment and exact total. Price or fee change refreshes preview; confirm only matching preview. Duplicate sale shows already sold, not success confetti.
- Mock/test wallet always labels "No real money"; KYC requests dummy documents only; withdrawals are simulated.
- Rejected listing/KYC/withdrawal displays the persisted reason and correct next action.

## Global and role layouts

Public header/footer; role-aware dashboard sidebar/topbar; investor wallet balance; notification dropdown only when enabled; avatar/profile/logout. Mobile collapsible sidebar with labelled toggle and keyboard focus. Separate role pages, not one giant conditional dashboard.

Auth success redirects by persisted role to `/admin`, `/broker`, `/investor`. Deep-link unauthorized users see `/403`; missing resources see 404. Token expiry/inactive user clears stale private caches. P1 disabled states explain unavailability; do not show working-looking fake controls.

## Data-driven states

| State | Required treatment |
|---|---|
| Loading | Skeleton matching layout; spinner for actions; no fake temporary numbers |
| Empty | Helpful explanation and next action, e.g. browse properties for zero holdings |
| Error | Clear inline message/retry; field errors tied to inputs; no swallowed provider failure |
| Success | Confirm actual committed operation and updated data; optional first-investment confetti |
| Stale/refetching | Preserve last verified data with refreshing indication; do not enable money action with unverified eligibility |

Charts and tables must handle zero values and ROI null. Financial completion invalidates/refetches wallet, portfolio, transactions, property and affected dashboards through Chetan's API integration.

## Responsive and accessibility acceptance

Test 360px mobile, 768px tablet, 1440px desktop. Single-column mobile, progressively expanded grids; no page horizontal scroll. Tables may use a bounded labelled scroll region or card adaptation. Keep critical amount/ownership/CTA visible without losing disclosures.

Normal text contrast >=4.5:1; keyboard navigation, visible focus ring, semantic landmarks/headings, labels, correct input autocomplete, alt text, non-color status, chart summaries, modal focus trapping and screen-reader error announcements. Proposed touch targets >=44px. Respect reduced motion; dark mode is P2 and must preserve all states/contrast.

Footer on public/auth/app shells: **"This is an academic project. No real money or securities are involved."**
