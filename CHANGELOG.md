# Engineering Changelog

Record real changes only. Keep feature changes small and list breaking/integration effects explicitly. Team approvals and application test results must not be inferred from documentation creation.

## 2026-10-01

| Developer | Feature | Change | Breaking/integration impact |
|---|---|---|---|
| AI-assisted documentation setup; no individual team contribution attributed | Contract-first foundation | Created requested requirements, API/schema/business/UI/architecture contracts, ownership agreement, test/deployment plans, examples, log templates, env examples and gitignore | No application source added or existing source specification changed. D1-D9 need actual team sign-off before coding. Future modules must implement agreed DTOs/paise/enums/error/session semantics. |
| Darshit | Admin Full-Stack (Backend & Frontend) | Implemented admin routes, controllers, validators, services (admin, propertyAdmin, kyc), models, shared constants, and full admin UI pages (Dashboard, Properties, Sale/Payout, Users, KYC, Withdrawals, Settings) conforming to design system tokens | None. Matches all contracts and single-source enums exactly. Ready for integration. |

## Entry template

### `<YYYY-MM-DD>`

- Developer: `<actual author>`
- Feature: `<requirement ID / module>`
- Change: `<actual change>`
- Breaking/integration impact: `<affected contracts/consumers/migration, or none>`
- Verification: `<actual tests/build/PR evidence, or not run with reason>`

Do not use templates as completed entries; preserve all genuine team additions when resolving merge conflicts.

### 2026-10-01 - Dhruv: backend foundation

- Added canonical models/indexes, constants/errors, database readiness, strict
  request validation, exact integer-paise helpers and transaction boundaries.
- Dhruv authorized narrow backend manifests/test tooling and approved the scoped
  backend decisions recorded in [server/BACKEND_HANDOFF.md](server/BACKEND_HANDOFF.md).
  Affected teammates still need to review; their approvals are not inferred.
- Verification: 7 unit tests passed; lint passed; npm install audit reports no
  vulnerabilities after updating Vitest. No deployed/authenticated API claim.
- Branch: `feature/backend-foundation`; bootstrap/seed/auth remain owner handoffs.

### 2026-10-01 - Dhruv: ledger and wallet

- Single ledger writer with cache/sequence reconciliation, signed mock top-up
  orders, unique order/payment credits, withdrawal reservation/review and events.
- Added owned wallet/transactions adapters; real auth must be supplied by Devang.
- Verification: 4 replica-set tests and 12 unit tests pass; lint passes.
  Initial binary preparation timeout resolved before running financial assertions.
- Branch: `feature/backend-ledger-wallet`, stacked on foundation.

### 2026-10-01 - Dhruv: property lifecycle

- Added lifecycle service and shared draft/submit financial validators without
  taking over Devang's property CRUD or Darshit's admin adapters.
- Complete publication requires upload ownership verifier integration.
- Verification: 5 focused tests passed; corrected lint-reported comparisons.
- Branch: `feature/backend-lifecycle-refunds`; invested-refund race proof follows
  with the investment increment.

### 2026-10-01 - Dhruv: atomic investments

- Added idempotent investments, wallet/inventory serialization, KYC/ownership
  gates, commission/events, owned HTTP adapters and invested-refund race tests.
- Verification: 12 investment/lifecycle replica-set tests pass, including five
  exact final-block races; lint passes. HTTP/auth/browser integration not claimed.
- Branch: `feature/backend-investments`, stacked on lifecycle.

### 2026-10-01 - Dhruv: exact sale payouts

- Added shared preview/execution math, guarded one-time sales, aggregated and
  per-row remainder allocation, fee-account credit and rollback-safe history.
- No admin adapters taken over; sale-price reconfirmation remains the consuming
  UI's responsibility under the explicitly approved unchanged preview contract.
- Verification: 7 payout tests and lint pass.
- Branch: `feature/backend-payouts`, stacked on investments.

### 2026-10-01 - Dhruv: portfolio aggregation

- Added portfolio summary service/adapter with historical aggregation, ACTIVE
  allocation, safe noncash estimates, realized/refunded values and ledger totals.
- Verification: 5 focused portfolio tests and lint pass.
- Branch: `feature/backend-portfolio`, stacked on payouts.

### 2026-10-01 - Dhruv: uploads and media ownership

- Added real Cloudinary SDK adapter, content/size validation, private KYC delivery,
  metadata/URL ownership verifier and assigned multipart adapter.
- Recorded explicitly approved ADMIN-property-asset policy; KYC remains strict.
- Verification: 6 tests and lint pass. Provider double used; actual Cloudinary
  account/delivery and authenticated upload integration remain unverified.
- Branch: `feature/backend-uploads`, stacked on portfolio.

### 2026-10-01 - Dhruv: notifications and public statistics

- Added public principal/investor/capability aggregates and the assigned stats
  adapter; completed recipient notification and coordinated-service exports.
- Notification HTTP and actual app/auth composition remain teammate handoffs.
- Verification: 4 real replica-set tests, lint and dependency audit pass.
- Branch: `feature/backend-notifications-stats`, stacked on uploads.

### 2026-10-01 - Dhruv: final financial verification and handoff

- Strengthened domain ledger reference checks, private new-User JSON, ADMIN
  withdrawal defaults, provider-output classification, UTC range comparison and
  explicit disconnected-database handling.
- Added actual crore-sale/commission/payout/ROI proof, payment reuse/expiry,
  withdrawal rollback, ledger scoping and database-readiness regressions.
- Verification: full backend suite passes 65 tests in 18 files (26 unit/adapter,
  39 database integration); lint and diff check pass; dependency audit reports 0
  vulnerabilities. No server transpile/TS or frontend build is available.
- Branch: `feature/backend-verification`, contains the complete verified stack.
  Main unchanged; no push/merge. Auth/bootstrap/seed/admin/property/KYC/UI,
  live Cloudinary delivery and browser/HTTP integration remain explicit handoffs.
- Export/mount/policy/test evidence: [server/BACKEND_HANDOFF.md](server/BACKEND_HANDOFF.md).

### 2026-10-01 - Dhruv: preserved-stack integration overlap handoff

- Discovered already tracked `origin/main` at `c6a2699` includes Darshit's merged
  PR #1 and overlapping backend/shared implementations, plus client scaffolding.
  Local `main` remains `6e2d5e4`; no fresh remote state is inferred.
- Dhruv explicitly selected preservation and documented review rather than
  source reconciliation. Added the conflict matrix, exact admin service-call
  migration mapping and combined integration/release gates to
  [server/BACKEND_HANDOFF.md](server/BACKEND_HANDOFF.md).
- No teammate code changed; no merge/rebase/push or public contract change.
  Compatibility with tracked main is not verified and blocks integration.
- Documentation-only update; delivered backend verification remains separately
  scoped to the existing feature stack.
- Continuation rerun: 65 tests in 18 files pass (36.07 seconds); lint and
  whitespace check pass; dependency audit reports 0 vulnerabilities.
  These results exclude the deferred tracked-main integration.

### 2026-10-01 - Dhruv: backend feature publication

- Explicitly authorized pushing all nine backend feature branches and creating
  a PR for each. Published draft PRs #2 through #10 with "Backend complete"
  titles, feature-specific scope, test evidence and owner-review requirements.
- PR bases preserve the feature dependency stack. Verified pushed refs; remote
  main remained `c6a2699`. No merge, history rewrite or integration claim.
- Recorded publication in [server/BACKEND_HANDOFF.md](server/BACKEND_HANDOFF.md).
  New publication commit/text excludes attribution trailers at Dhruv's request.
- Documentation-only publication; prior backend evidence remains 65 passing
  tests, lint/whitespace pass and a clean dependency audit, not remote CI proof.
