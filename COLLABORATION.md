# Team Ownership and Integration Agreement

Contract-first development: ownership makes someone accountable; it does not permit changing another developer's interface or shared infrastructure without notice. No application implementation is authorized by this documentation delivery.

## Ownership principles

- Exactly one write owner per planned source file. Other developers request a change or coordinate a narrowly scoped PR; reviewers are not competing write owners.
- Do not refactor another developer's module during feature development unless explicitly coordinated.
- No independent wallet/ledger/status-machine/constants implementations.
- Paths below are planned files/directories, not a claim they currently exist. Match the [architecture](ARCHITECTURE.md) and [API contract](API_DESIGN.md) when scaffolding.

## Dhruv - Backend Lead

**Primary:** models, core financial services, transaction correctness.

**May modify / exact ownership:**

- `server/src/models/**` (all nine collections).
- `server/src/services/propertyLifecycle.service.js`, `investment.service.js`, `payout.service.js`, `ledger.service.js`, `wallet.service.js`, `withdrawal.service.js`, `portfolio.service.js`, `upload.service.js`, `notification.service.js`, `publicStats.service.js`.
- Corresponding `server/src/routes/`, `controllers/`, `validators/` modules named `investments`, `wallet`, `portfolio`, `transactions`, `uploads`, `publicStats`.
- `server/src/config/db.js`, `cloudinary.js`; `server/src/middlewares/validate.js`, `error.js`, `rateLimit.js`; `server/src/utils/**`.
- `shared/constants.js`, `shared/errorCodes.js` (contract files in code, change notification mandatory); unit tests adjacent to these owned modules.

**Features:** atomic investments, cache/ledger reconciliation, payouts/remainders, funding commission, cancellation/refunds, wallet top-up and withdrawal core, public platform aggregate.

**Normally not:** frontend pages/API client; auth/role middleware; admin HTTP adapters; Devang's draft CRUD; bootstrap/manifests/seed.

**Dependencies:** Devang's verified current-user context; Darshit's settings and sale/admin requests; Chetan's Atlas/test/seed readiness; Deepti's checkout DTO requirements.

**Handoff:** exported service signatures and session ownership; errors; tests for rollback, final-unit race, wallet overspend, payout exactness/replay; indexes; example requests.

**Done:** service tests and cross-module concurrency tests pass; no direct untracked money writes; exact paise sums; callable via documented endpoints.

## Deepti - Frontend Lead

**Primary:** shared UI/design system, public and investor experiences.

**May modify / exact ownership:**

- `client/src/components/**`, `layouts/**`, `hooks/**` except auth hooks.
- `client/src/pages/public/**`, `investor/**`, `errors/**`; includes Investor dashboard/portfolio/holding detail/wallet/KYC/enquiries so no required screen is ownerless.
- `client/src/styles/**`, `client/src/utils/formatINR.js` and display-only calculator helpers.
- UI configuration such as Tailwind/components theme files; coordinate dependencies through Chetan.
- Component/UI tests adjacent to owned modules.

**Features:** landing/marketplace/property detail/checkout; investor pages; role-aware layout, charts, statuses, loading/empty/error states, responsive accessibility.

**Normally not:** server domain logic, shared enum definitions, auth provider/guards, admin/broker pages, central routes/API client/manifests.

**Dependencies:** Chetan's API wrappers; Dhruv's portfolio/wallet/investment DTOs; Devang's property/auth context; Darshit's KYC behavior.

**Handoff:** reusable component props, loading/error/empty examples, viewport evidence, endpoint requirements, keyboard flows and exact submitted payloads.

**Done:** no frontend-only financial authority; 360px/tablet/desktop UX; confirmation/pending/shortfall handling; integrated server data.

## Devang - Full-Stack Auth + Broker

**Primary:** identity, RBAC, broker workflows and their shared auth surfaces.

**May modify / exact ownership:**

- `server/src/routes/`, `controllers/`, `validators/` modules named `auth`, `profile`, `properties`, `broker`, `enquiries`, `notifications`.
- `server/src/services/auth.service.js`, `profile.service.js`, `property.service.js` (draft CRUD/public queries only), `broker.service.js`, `enquiry.service.js`.
- `server/src/middlewares/auth.js`, `role.js`, `ownership.js`.
- `client/src/pages/auth/**`, `broker/**`, `profile/**`, `notifications/**`.
- `client/src/context/AuthContext.jsx`, `client/src/hooks/useAuth.js`, `client/src/routes/ProtectedRoute.jsx`, `RoleRoute.jsx`.
- `client/src/features/broker/PropertyWizard.jsx` (admin may reuse its props, not fork it); tests adjacent to these modules.

**Features:** signup/login/logout/reset, current-user/session invalidation, profile/password, broker drafts/submission/analytics, participant enquiry HTTP APIs, notification reads. Notification event persistence is Dhruv's service, not a second implementation.

**Normally not:** financial models/services/constants, admin adapters, shared theme, API client/bootstrap.

**Dependencies:** Dhruv's User/Property models and lifecycle/notification services; Deepti's components/layout; Darshit's broker approvals; Chetan's route/API integration.

**Handoff:** middleware user-context shape (`req.user` persisted current User), registration/login DTOs, route guards, wizard reusable interface, ownership tests and token invalidation proof.

**Done:** direct wrong-role/foreign-broker/inactive-token tests pass; draft saves/resubmit work; no stale-role trust or browser-only RBAC.

## Darshit - Full-Stack Admin

**Primary:** administrative HTTP orchestration and all admin UI.

**May modify / exact ownership:**

- `server/src/routes/`, `controllers/`, `validators/` modules named `admin`, `propertyAdmin`, `kyc`.
- `server/src/services/admin.service.js`, `kyc.service.js` (no duplicate finance/status machine).
- `client/src/pages/admin/**` including dashboard/property management/create modal/sale/user/KYC/withdrawal/settings views.
- Tests adjacent to these owned modules.

**Features:** admin lists/stats/users/settings; broker approval; private KYC submit/review endpoints; property approval/rejection/acquisition/cancel adapters; payout preview/sale UI; withdrawal processing adapters.

**Normally not:** core ledger/payout/investment/lifecycle logic, model schema, broker wizard implementation, auth/ownership middleware or shared layouts.

**Dependencies:** Dhruv's finance/lifecycle/withdrawal services; Devang's auth guards and reusable wizard; Deepti's components; Chetan's API modules.

**Handoff:** admin query/filter contracts, preview-to-confirm payload, private KYC handling, refusal of repeated operations, API authorization and UI test evidence.

**Done:** ADMIN is enforced server-side; preview matches execution math; errors are explicit; no balance edit/status shortcut.

## Chetan - Integration + QA Lead

**Primary:** composition, consistency, seeds, tests, deployment and README.

**May modify / exact ownership:**

- `client/src/api/**`, `client/src/main.jsx`, `client/src/routes/AppRoutes.jsx`.
- `server/src/app.js`, `index.js`, `config/env.js`; package/workspace manifests and lockfiles.
- `server/scripts/seed.js`, `tests/**`, Postman collection, CI/deployment configuration.
- Root/client/server `.env.example`, `.gitignore`, README, testing/deployment docs and operational documentation stewardship.

**Features:** endpoint wiring/providers, contracts-to-client mapping, coherent seed/fixtures, integration/e2e verification, build/deploy coordination and final proof.

**Normally not:** developer-owned domain logic/pages/models; fixes are assigned back to owner unless a surgical cross-module patch is explicitly coordinated.

**Dependencies:** each owner delivers a stable export/DTO/test handoff; no speculative adapters around undocumented responses.

**Handoff:** setup/build/seed instructions verified from a fresh environment, actual test evidence, Postman environment without secrets, deployment health and release checklist.

**Done:** core demo works end-to-end, source requirements trace, env/links accurate, all features use one API client and error envelope.

## Shared file policy

**CONTRACT FILES:** [PRD.md](PRD.md), [API_DESIGN.md](API_DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE.md](DATABASE.md), [BUSINESS_RULES.md](BUSINESS_RULES.md), [CONTRACTS.md](CONTRACTS.md), [UI_UX.md](UI_UX.md).

No developer may silently change a contract. Required process:

1. Announce the proposal and reason in the team channel/issue.
2. Update affected documentation, preserving source authority.
3. Notify affected owners and obtain explicit agreement.
4. Update every dependent code/API/example/fixture/environment surface.
5. Test integration and affected failure paths.
6. Commit the contract change separately, with migration/compatibility impact.

Contract stewardship (single editor for accepted changes):

| Contract | Editor | Required reviewers |
|---|---|---|
| PRD | Chetan | All impacted owners |
| API_DESIGN | Chetan | Endpoint owner + consuming UI owner |
| ARCHITECTURE | Chetan | All five for layer/stack changes |
| DATABASE, BUSINESS_RULES | Dhruv | Devang/Darshit/Chetan as affected |
| CONTRACTS | Chetan | Dhruv plus every affected owner |
| UI_UX | Deepti | Devang/Darshit/Chetan for shared changes |

Additional shared implementation files: package manifests/lockfiles, env examples, app/bootstrap/route registries (Chetan write owner); auth context/guards (Devang); constants/error catalog/ledger/models (Dhruv); shared UI/theme/layouts (Deepti). Shared means coordinated consumption, not multiple unannounced writers.

PROMPTS and CHANGELOG are team-wide append-only contributions in small commits; resolve concurrent additions by preserving all genuine entries. Do not fabricate history. The source Markdown stays unchanged.

## Dependency and handoff order

| Producer | Consumer | Prerequisite contract/export |
|---|---|---|
| Chetan | All | Scaffold, environment validation, registry composition, Atlas readiness |
| Dhruv | Devang/Darshit | Models/constants/errors, lifecycle exports |
| Devang | All protected modules | authenticate/role/ownership and current-user context |
| Deepti | Devang/Darshit | Shared UI props/theme/layout |
| Devang | Deepti/Chetan | Property listing/detail/draft and auth endpoints |
| Dhruv | Deepti/Darshit/Chetan | Ledger, investment, wallet, portfolio and payout contracts |
| Darshit | Devang/Deepti/Dhruv | Admin approval/settings/KYC review integration |
| All owners | Chetan | Tests, error shapes, endpoint exports, no outstanding contract ambiguity |

Coding can proceed against approved DTOs in parallel; production UI must not ship stubbed backend responses. Do not merge circular dependencies by bypassing RBAC/transactions.

## Branch and merge policy

| Owner | Feature branch |
|---|---|
| Dhruv | `feature/backend-investment` (separate financial subfeatures allowed) |
| Deepti | `feature/frontend-marketplace` |
| Devang | `feature/auth-broker` |
| Darshit | `feature/admin` |
| Chetan | `feature/integration-qa` |

- Never directly push feature work to main. Protect main, use PRs.
- Pull latest main before development/integration; test before merging/pushing reconciled changes.
- Small meaningful commits, e.g. `feat(wallet): verify test top-up once`; no giant final dump.
- No unrelated changes in another developer's PR. Cross-owner edits need owner agreement.
- At least one affected-owner review; financial/schema/auth changes also need Chetan integration evidence.
- Merge shared foundation contracts/scaffold first, then module handoffs, then end-to-end releases. Preserve each member's genuine GitHub-authored contribution.
- No secrets, destructive seed scripts, generated builds, fake test results, or blanket exception suppression.
- A breaking contract PR lists dependent changes and migration/seed effects; merge its coordinated consumers together.

## Team approvals before coding

Review D1-D9 in [CONTRACTS.md](CONTRACTS.md): stack/token strategy, mock/test provider, cache/idempotency/reservations, commission expense/rounding, cap defaults, P1 gates, supporting endpoints and role-change/accounting policies. Record real approvals in a PR/changelog. None have been fabricated here.

## INTEGRATION CHECKLIST

Before merging ANY feature into main:

- [ ] Source priority and acceptance criteria identified; D1-D9 decisions relevant to this feature approved.
- [ ] Branch up to date; touched files within ownership or explicit owner permission recorded; no unrelated refactor.
- [ ] Changed contracts announced, separately committed, and every dependent document/client/API/schema/fixture updated.
- [ ] Endpoints/methods, request fields, DTOs, enums, paise/date/pagination/error envelopes match the canonical contracts.
- [ ] Server auth/current-user/role/ownership and body/query/header validation tested, not just hidden UI controls.
- [ ] Money uses the sole ledger helper and correct MongoDB session; unsafe values, retry/replay, rollback and duplicate operations tested where applicable.
- [ ] Financial change proves exact conservation and relevant concurrency tests; no over-funding, overspending or double credit.
- [ ] UI has loading/empty/error/success, confirmation/pending behavior and responsive/accessibility evidence.
- [ ] Required targeted tests/lint/build pass; failures documented and resolved, not silently waived.
- [ ] Seed/demo/Postman/env/deployment changes coherent; no real secrets/identity data/payment keys in repository or logs.
- [ ] Actual prompt and changelog entry appended; README/limitations accurate.
- [ ] Producer export handoff and consumer integration verified by Chetan; affected owner reviewed; PR ready.
