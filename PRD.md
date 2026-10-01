# OwnSquare - Product Requirements Document

Status: pre-implementation. Primary authority: [Fractional Real Estate Investment Portal](docs/PS1_Fractional_Real_Estate_Investment_Portal.md). This PRD preserves source priorities; proposed implementation details require [contract sign-off](CONTRACTS.md).

## Overview and problem

"One property. Many owners." Whole-property ownership is inaccessible to many buyers. OwnSquare enables multiple investors to buy fixed units in a property, track fractional holdings and receive their exact proportional proceeds when the property sells. It is an academic PropTech/FinTech MERN project with real application persistence/authentication but no real money or securities.

## Goals

1. Complete sourcing -> approval -> fundraising -> acquisition/holding -> sale -> payout.
2. Correct ownership, over-funding prevention, loss handling and exact paise reconciliation.
3. Distinct Admin, Broker and Investor permissions enforced by the server.
4. Clear funding progress, portfolio metrics and append-only financial statements.
5. A responsive, deployed or flawlessly locally runnable product with reproducible seed/demo/testing evidence.

Non-goals for P0: real investment offerings, real KYC verification, real bank transfers, live gateway charges, guaranteed returns, secondary trading and rental distribution.

## Roles and responsibilities

| Role | Responsibilities |
|---|---|
| Admin | Seeded, never self-registered; approve brokers/KYC; create/review properties; manage users/settings; confirm acquisition/cancellation; record sales/payouts; approve withdrawals; see platform analytics |
| Broker | Register and await approval; create/edit drafts, upload media/documents, submit/resubmit; track own funding/investors/commission; answer own property enquiries |
| Investor | Register; complete enabled KYC; top up; browse/filter/calculate; buy units; track holdings/ROI/payouts; request enabled withdrawals and raise enquiries |

Admin and Broker cannot invest. Investor cannot approve properties, see another investor's private records or invoke admin actions. Brokers cannot view/edit another broker's unpublished property/analytics. Hiding controls is not authorization.

## Source requirement traceability

| ID | Priority | Requirement | Implementation owner / acceptance |
|---|---|---|---|
| AUTH-1 | P0 | Investor/Broker signup; admin seeded | Devang; role validation, hash, no admin signup |
| AUTH-2 | P0 | JWT login/logout, protected routes, role redirects | Devang; direct API RBAC and invalidation |
| AUTH-3 | P1 | Forgot/reset via email | Devang; hashed expiring one-use token |
| AUTH-4 | P2 | httpOnly refresh-token rotation | Devang; separate reviewed token-storage contract |
| PROP-1 | P0 | Complete property data/media/financials | Devang (broker), Darshit (admin entry), Dhruv (model); draft wizard and >=3-image submit |
| PROP-2 | P0 | Full status machine including REJECTED/CANCELLED | Dhruv core, Devang/Darshit endpoints; illegal transitions rejected |
| PROP-3 | P0 | Admin review/reason, broker corrections/resubmit | Darshit/Devang; persist/display reason |
| PROP-4 | P0 | Search/filter/sort/paginated marketplace | Deepti UI, Devang API; city/type/unit price/status/funding filters |
| PROP-5 | P0 | Detail/gallery/metrics/map/docs/calculator | Deepti; server-derived funding/investor count |
| INV-1 | P0 | Unit checkout, ownership summary, confirm/debit | Deepti UI, Dhruv service; server amount |
| INV-2 | P0 | Atomic over-funding prevention | Dhruv; simultaneous final-unit test |
| INV-3 | P0 | Auto FUNDED and broker commission | Dhruv; one transaction, once-only credit |
| INV-4 | P1 | Configurable cumulative ownership cap | Dhruv/Darshit; aggregate repeated purchases |
| WAL-1 | P0 | Test/mock top-up, wallet, history | Dhruv API, Deepti UI; exactly-once credit |
| WAL-2 | P1 | Withdrawal request/admin processing | Dhruv core, Darshit admin, Deepti UI; reservation/once-only debit |
| PORT-1 | P0 | Portfolio totals, value, payouts, ROI, table/donut | Dhruv API, Deepti UI; no double counting |
| PAY-1 | P0 | Sale, exact proportional payouts, wallet credit | Dhruv core, Darshit UI; unique payout and exact sum |
| PAY-2 | P2 | Monthly rental distribution | Dhruv/Darshit; schema/API extension approval first |
| KYC-1 | P1 | Dummy docs, approve/reject, investment gate | Darshit API, Deepti UI, Dhruv gate; no real IDs |
| ADM-1 | P0 | Admin KPIs/charts/approval queues | Darshit; ledger-backed fees and correct counts |
| ADM-2 | P0 | User search/filter, activate/deactivate, brokers | Darshit; inactive tokens fail 401 |
| BRK-1 | P0 | Own dashboard/funding/investors/commission | Devang; owner-scoped API |
| ENQ-1 | P1 | Investor-to-broker enquiry threads | Devang API, Deepti investor UI; participant isolation |
| NOTIF-1 | P1 | In-app approval/funding/payout notifications | Devang UI/API, Dhruv event persistence; own reads only |
| SEC-1 | P2 | Secondary unit market | New reviewed contract before implementation |
| AUD-1 | P2 | Admin audit log | Darshit; additive reviewed schema |

Source-wide P0 expectations also include validation, errors, security middleware, media integration, seed data, responsive UI and submission documentation. Admin settings and shared profile/password screens are required page surfaces; ownership cap enforcement remains P1.

## Lifecycles

- Property: DRAFT -> PENDING_APPROVAL -> LIVE -> FUNDED -> HOLDING -> SOLD. PENDING_APPROVAL -> REJECTED -> corrected submission. LIVE -> CANCELLED with full refunds.
- Investor: register -> enabled KYC approval -> test wallet top-up -> browse -> choose units -> confirm -> portfolio -> sale payout -> enabled withdrawal.
- Broker: register -> admin approval -> draft -> complete wizard -> submit -> admin review -> live fundraising -> commission at FUNDED -> holding/sale tracking.
- Admin: review accounts/listings -> monitor funds -> confirm acquisition -> preview sale -> confirm exact distribution -> reconcile.

Full failure paths and sequences: [docs/USER_FLOWS.md](docs/USER_FLOWS.md).

## Required pages/screens

| Area / routes | Mandatory contents | Priority |
|---|---|---|
| `/` | Hero, how it works, featured LIVE assets, raised/investor stats, FAQ, signup CTA, footer disclaimer | P0 |
| `/properties` | Grid/list, filters/search/sort/pagination; image/title/city/unit price/funding/expected return | P0 |
| `/properties/:id` | Gallery, overview, metrics, funding, investor count, docs, map, amount/years return calculator, login-gated CTA | P0 |
| `/login`, `/signup` | Investor/Broker signup selection, validation, password visibility, role redirect | P0 |
| `/forgot-password`, `/reset/:token` | Email/reset forms and truthful feedback | P1 |
| `/investor` | Invested/current value/payouts/ROI/wallet KPIs, allocation donut, recent ledger, recommendations | P0 |
| `/investor/portfolio`, `/investor/portfolio/:propertyId` | Units, ownership, invested/value/status/payout/ROI; holding detail | P0 |
| `/investor/invest/:id` | Slider+input, unit/amount/ownership calc, wallet shortfall, terms checkbox, confirm, success | P0 |
| `/investor/wallet` | Balance, add test/mock money, full filtered ledger; withdrawal/request status when enabled | P0 wallet / P1 withdrawal |
| `/investor/kyc` | Dummy ID+selfie, status/rejection/resubmission | P1 |
| `/investor/enquiries` | Threads/replies | P1 |
| `/broker` | Listings/live/funded/raised/commission KPIs, funding chart, pending approvals | P0 |
| `/broker/properties` | Status/funding/actions; draft edit/view/submit | P0 |
| `/broker/properties/new`, `/broker/properties/:id/edit` | Basics -> Location -> Financials -> Media/docs -> Review; draft save at any step | P0 |
| `/broker/properties/:id` | Funding timeline, authorized investor list, enabled enquiries | P0 analytics / P1 enquiries |
| `/admin` | AUM/users/live/monthly raised/fees; funding/status charts; approval queues | P0 |
| `/admin/properties` | Status/broker/city filters, review/reason modal, lifecycle actions/detail | P0 |
| `/admin/properties/:id/sell` | Sale price, fee/rounding preview, investor table, explicit confirm and execution result | P0 |
| `/admin/users` | Search/role filter, activation/broker approval, KYC review link | P0 / P1 KYC |
| `/admin/kyc`, `/admin/withdrawals` | Private document review/request queue, approve/reject | P1 |
| `/admin/settings` | Fee/commission/cap percentages; validated persisted edits | P0 screen / P1 cap |
| `/profile` | Profile and change password | Required shared |
| `/notifications` plus dropdown | Own events/mark-read | P1 |
| `/403`, wildcard | Explicit access denied/not found | Required shared |
| Role-aware layout | Sidebar, topbar/wallet for investor, avatar/logout, enabled notifications | P0 / P1 notifications |

## Functional acceptance criteria

- **Core journey:** Rohit approved; Noida INR 1 crore / 1,000 units / INR 10,000 unit listing submitted/approved; Aman tops up INR 5 lakh, buys 20 units -> 2%, wallet INR 3 lakh; funding completes -> commission, acquisition -> HOLDING, sale INR 1.4 crore -> Aman INR 2,74,400 and 37.2% ROI after 2% fee.
- **Atomic investment:** a transaction fails completely if wallet, inventory, KYC, cap or status fails. Double-click/retry with one idempotency key creates one investment.
- **Payout conservation:** investor payouts sum exactly to distributable; distributable + fee == salePrice; duplicate execution returns 409 ALREADY_SOLD with no new rows.
- **Cancellation:** LIVE cancellation restores every invested paise and retains refund history.
- **Authorization:** investor admin calls 403; broker foreign asset 404; deactivated user 401 with otherwise-valid token.
- **Marketplace:** each documented filter affects server results; stable pagination/sort; no draft leakage.
- **Drafts:** partial save works at every step; incomplete submission fails with field-specific errors.
- **Data and UX:** Indian money grouping, role-consistent status chips, zero-investment empty state and negative loss ROI.
- **Seed:** >=8 properties across specified statuses and >=5 investors, coherent funding/ledger/payout history.

## Important edge cases

Final-unit race; concurrent debits on different assets; investment racing cancellation/edit; minUnits > remaining units; zero denominator ROI; repeated purchase aggregate cap; duplicate payment/order; duplicate sale/withdrawal review; settings changed after preview; failed transaction retry; expired/inactive JWT; foreign broker analytics; loss sale; remainder and equal-holder ties; valuation not divisible into whole-rupee units; uploaded content mismatch/oversize; unavailable provider.

Detailed measurable tests: [TESTING.md](TESTING.md).

## Non-functional and security requirements

- React or Next.js frontend, Node/Express or allowed Next handlers, MongoDB replica-set persistence; recommended stack in architecture is pending approval.
- Client and server validate every form/body; central sanitized errors, no silent failures.
- bcrypt cost 10-12; strong passwords; JWT role and current user checks; server ownership enforcement.
- Helmet, restrictive configured CORS, auth/investment rate limits, safe NoSQL queries/input sanitization; upload MIME/content whitelist and 5 MB maximum.
- Responsive at 360px mobile, tablet and desktop without page-level horizontal overflow; accessible keyboard/focus/labels and >=4.5:1 normal text contrast.
- Every data-driven surface has loading/empty/error/success states; financial submits disable while pending and require confirmation.
- Reusable components, service separation, env-only secrets, complete examples, existing project linters/formatters when scaffolded.
- No made-up throughput/SLA target. Measure realistic seed/workload behavior and record evidence; correctness takes priority.

## Payments and KYC

Test Razorpay/Stripe or clearly labelled mock only. Mock payment is permitted, mock auth/database/investments are not. Verify authoritative order/signature/owner and reject reused payments. P1 KYC uses dummy data, private media, server admin review and an explicit investment gate. Enabling/disabling P1 behavior must be agreed, configured server-side and reflected in UI.

## Delivery

GitHub contribution history from all five, runnable README, complete env examples, live frontend/backend or flawless local setup, seed/test accounts generated with operator-supplied passwords, Postman/Swagger covering endpoints, 3-5 minute walkthrough plus concurrency proof, maintained prompt log, documented limitations. Do not fabricate deployed URLs, videos, test results or credentials.
