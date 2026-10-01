# Dhruv backend handoff

This is a scoped backend contribution, not an operational whole application.
Auth, draft CRUD/public properties, admin HTTP adapters, application composition,
environment validation and seed remain with their assigned owners.

## Approval and ownership record — 2026-10-01

Dhruv explicitly approved the backend portion of D1 (Express/Mongoose/Zod,
JavaScript ES modules) and narrowly authorized manifests/lockfile/lint/test setup.
No frontend scaffold or app/bootstrap is authorized by this exception.
Dhruv approved D4–D6 as documented, D7 flag-gated KYC/caps/withdrawals/notifications,
his D8 supporting endpoints and D9's ADMIN fee account dependency.
D3 selects signed academic mock only for this increment; Razorpay is deferred,
not claimed implemented and must never be used as a silent fallback.
D2 remains Devang/Deepti/Chetan's decision; this work does not implement identity.
These are Dhruv's approvals, not fabricated teammate approval. Affected-owner
review remains required before merge.

Feature work uses stacked `feature/backend-*` branches, verified incremental
commits, no push, and no merge into main.

## Foundation exports

- `config/db.js`: `connectDatabase(uri)` returns `{connection, models}` only after
  replica-set/sharded-session readiness and index creation. No index dropping.
- `models/index.js`: `getModels(connection)` registers the nine canonical models.
- `utils/transaction.js`: `inTransaction(connection, work)` owns session lifecycle,
  retries transient transactions only, and separately retries uncertain commits.
  Nested finance helpers require the caller's active session.
- Shared enums/errors are in `shared/`; all amounts are safe-integer paise.
- Validators reject unknown fields; controllers consume `req.validated`.

## Integration obligations

Chetan must supply environment validation, real bootstrap/route mounting,
readiness/health, CORS/helmet, and seed Settings plus the ADMIN fee account.
Devang must supply persisted current-user authentication and role middleware;
there is no token decoder or test authentication substitute in this contribution.
Darshit must call the finance services, not mutate inventory/balances independently.

## Verification

Actual results are appended with each completed feature. No endpoint, deployment,
provider integration or teammate module is claimed verified before it exists.

- Foundation: `npm run test:unit --workspace server` passed 7 tests in 2 files;
  `npm run lint` passed. Node 24.20.0/npm 12.1.0, Vitest 5.0.3.
  The editor test tool did not discover tests; the package runner executed them.
  Initial Vitest 3 dependency audit reported 2 moderate development advisories;
  upgrading to Vitest 5 resolved them. Install audit now reports 0 vulnerabilities.
  Runtime minimum is Node 22.13 for current tooling. No replica-set tests yet.

- Ledger/wallet: 4 real MongoDB 7.0.24 replica-set integration tests passed:
  concurrent payment verification, reservation/review races, rejection release,
  rollback after ledger insertion, append-only guards, inactive actors and cache
  reconciliation. Unit suite now passes 12 tests; lint passes.
  First attempt ran no assertions because binary download exceeded setup timeout.
  Preparing the binary separately resolved this; use
  `npm run test:prepare-db --workspace server` on a fresh Windows machine.

## Wallet/session handoff

Factories receive `{connection, models}` from database readiness. Ledger exposes
`post(input, session)`, `lock(userId, session)`, `read(userId, session)` and
`list(actorId, validatedQuery)`. `post` is the sole balance/ledger writer.
`lock` serializes reservations; gaps in ledger walletVersion are expected.

`createWalletService({...db, ledger, payment:{provider:"mock",secret}})` supplies
`get(userId)`, `order(userId, amount)`, `verify(userId, proof)`.
The mock secret must have at least 32 characters; orders expire in ten minutes.
Provider selection other than the approved mock fails explicitly.

`createWithdrawalService({...db, ledger, notifications, features})` supplies
`request(userId,input)`, `process(adminId,withdrawalId,input)`,
`list(actorId,query,admin=false)`. Processing is simulated; no bank transfer.
Darshit owns the admin HTTP adapter. Notification persistence is introduced here
because withdrawal events must commit in the same transaction; its HTTP routes
remain Devang's.

`createWalletRouter({services,authenticate,requireRole})` mounts at
`/api/v1/wallet`; `createTransactionsRouter` with the same arguments mounts at
`/api/v1/transactions`. Auth functions are required, not substituted.
`requireRole(...roles)` must return middleware. Controllers use `req.user._id`
from Devang's verified persisted context; service methods recheck active role.
Authenticated HTTP integration remains blocked pending real auth/bootstrap.

## Lifecycle handoff

`createPropertyLifecycleService({...db,ledger,notifications,uploads})` supplies
`submit(actorId,propertyId)`, `approve(adminId,propertyId)`,
`reject(adminId,propertyId,reason)`, `changeStatus(adminId,propertyId,status)`.
Darshit/Devang own their HTTP adapters. Draft CRUD should reuse
`validatePropertyFinancials` from `utils/propertyValidation.js`, guard version
and historical investment existence, and never independently change lifecycle.
Submission/publication fail explicitly until upload ownership verification is
integrated; no arbitrary URL bypass is supplied.

- Lifecycle focused tests: 3 real replica-set tests and 2 validation unit tests
  passed. Foreign/incorrect-role submission, incomplete drafts, rejection/event
  atomicity and illegal/repeated cancellation tested. Full invested refunds and
  purchase/cancel races will be tested with the next investment increment.

## Investment handoff

`createInvestmentService({...db,ledger,notifications,features})` exposes
`invest(investorId,{propertyId,units},idempotencyKey)` returning `{data,replay}`,
and `list(investorId,validatedQuery)`. The router mounts at `/api/v1/investments`,
maps creation to 201 and replay to 200, and requires a UUID Idempotency-Key.
Snapshots remain unchanged after refund/exit. Roles/isActive are checked before
replay; KYC/cap are rechecked for new purchases, not old confirmations.

- Investment/lifecycle runner passed 12 real replica-set tests (9 investment,
  3 lifecycle); lint passed. Five synchronized final-10-unit rounds each produced
  one purchase, one `409 INSUFFICIENT_UNITS` with numeric remainingUnits=0,
  one debit and exactly one commission. Ordinary later purchase is ALREADY_FUNDED.
- Also verified different-property wallet overspend, concurrent same-key replay,
  aggregate cap races, reserved-balance spending, purchase/cancel races, refunds,
  and rollback after debit, funding event/commission and refund insertion.
- This is service-level persistence/concurrency evidence. Exact authenticated
  HTTP and two-browser-window proof still requires Devang/Chetan's integration.

## Payout handoff

`createPayoutService({...db,ledger,notifications})` exposes
`preview(adminId,propertyId,salePrice)` and
`execute(adminId,propertyId,{salePrice,expectedPlatformFeePct})`.
Darshit owns the preview/sale HTTP adapters. Both paths use `calculatePayout`.
Execution serializes against settings writes, guards HOLDING/version, and commits
the unique payout, wallet credits, row allocations, ADMIN fee and SOLD together.
Zero shares remain in DTOs but create no zero-value ledger entries.

Dhruv explicitly chose to keep the existing stateless preview API unchanged:
expectedPlatformFeePct detects fee drift; the server recomputes the submitted
salePrice but cannot prove it matches an earlier preview without a new token.
Darshit's UI must refresh and reconfirm when price changes. No preview-token
contract or undocumented field has been introduced.

- Payout tests: 3 calculation unit tests + 4 real replica-set tests passed; lint
  passed. Source 1.4-crore amounts/37.2% ROI, preview with no writes, concurrent/
  repeated sales, stale rate, loss/zero shares, exact row remainder and complete
  rollback after a payout credit were verified.

## Portfolio handoff

`createPortfolioService({...db,ledger})` exposes `summary(investorId)`.
The owned router mounts at `/api/v1/portfolio`, GET `/summary`.
Estimates use server time and 365.25-day years; they never post cash.
Current value excludes wallet cash; payout totals exclude refunds/top-ups.
Holdings aggregate repeated purchases, preserve EXITED/REFUNDED history, and
ACTIVE-only allocation uses original principal. Empty ROI is null.

- Five portfolio tests passed (2 unit, 3 real replica-set); lint passed.
  Verified repeated purchases, deterministic one-year estimates, refunds, loss
  payouts, empty portfolios, owner isolation and no wallet/value double count.

## Upload/media handoff

`createCloudinaryAdapter({cloudName,apiKey,apiSecret})` builds the real server SDK
adapter without globally mutating Cloudinary configuration.
`createUploadService({...db,features,mediaAdapter})` exposes
`upload(actorId,purpose,file)` and `verifyAttachments(ownerId,media,purpose,session?)`.
The owned router mounts at `/api/v1/uploads` and accepts only multipart
`file` + `purpose`. Byte/MIME detection and 5 MB limits precede provider upload.
Provider failures return explicit errors; no provider fallback exists.

Dhruv explicitly approved creator-owned or ADMIN-uploaded property assets,
but not another broker's assets. KYC remains strictly investor-owned.
Server-stamped Cloudinary context carries ownerId/purpose/name/MIME; attachment
verification retrieves that metadata and verifies canonical URL/resource/type.
KYC uses authenticated delivery with signed URLs. Those URLs must remain private
in Darshit's KYC/User DTO adapters and never be logged or exposed publicly.
Draft/KYC services must call this verifier on attachment, not accept arbitrary URLs.
Asset cleanup/deletion requires Chetan's coordinated maintenance policy; no
unrequested deletion endpoint or unsafe cleanup job is supplied.

- Upload tests: 6 passed (content/config, actual multipart parser, and three
  real-database ownership/lifecycle tests with an external media-provider double).
  Fixed Mongoose subdocument normalization exposed by the publication test.
  Lint passed. No actual Cloudinary network upload or private delivery access was
  verified: configured account credentials and consuming KYC routes are missing.

## Notifications, statistics and composition handoff

`createNotificationService({...db,features})` exposes
`record(event,session)` (transaction-only),
`list(actorId,validatedQuery)` and `markRead(actorId,notificationId)`.
Devang owns notification validators/controllers/routes; Darshit/Devang call
`record` in their KYC/enquiry transactions. Disabled event persistence is an
intentional no-op; disabled notification read endpoints fail FEATURE_DISABLED.
No email provider or competing event/finance writer was added.

`createPublicStatsService({...db,features,paymentProvider:"mock"})` returns
non-refunded principal, active registered investor count and explicit safe
capabilities only. `createPublicStatsRouter({services,authenticate})` mounts at
`/api/v1/platform`; GET `/stats` is public, but supplied tokens invoke real auth.
Neither secrets nor user/property/ledger records appear in this response.

`utils/backendServices.js`: `createBackendServices(db,{features,payment,mediaAdapter})`
constructs the single coordinated service set. Configuration is passed in from
Chetan's validated environment, never read from client requests or silently
defaulted. It does not create an Express app, listen, mount teammate routers,
seed records or supply authentication.

- Four focused notification/statistics replica-set tests passed; lint and
  `npm audit` passed (0 vulnerabilities). Tested recipient filtering, repeated
  mark-read, event rollback, disabled flags, ACTIVE/EXITED principal versus refunds,
  active investor counts and explicit configuration/composition.

## Final verification — 2026-10-01

Environment: Windows, Node 24.20.0, npm 12.1.0, Vitest 5.0.3,
isolated MongoDB 7.0.24 replica sets with real sessions/indexes.

| Command | Actual result |
|---|---|
| `npm run test:backend` | 65 tests passed in 18 files (26 unit/adapter, 39 database integration); final run 32.04 seconds |
| `npm run lint` | Passed |
| `npm audit` | 0 vulnerabilities |
| `git diff --check` | Passed |

Final verification strengthened ledger references, new-User JSON privacy,
ADMIN withdrawal queue defaults, provider-output error classification and DB
readiness failures. Date ranges compare instants, not differently precise ISO
strings; ledger `from` inclusive / `to` exclusive boundaries are tested.
Database tests reject standalone MongoDB, missing Settings and closed connections
without defaults/nontransactional writes. Driver dependency failures use safe 503
envelopes rather than success-shaped fallbacks.

The full source sale was executed through real investments/acquisition/payouts:
valuation 1,000,000,000 paise, 1,000 units, commission 10,000,000;
sale 1,400,000,000, fee 28,000,000, investor distribution 1,372,000,000.
Aman's actual wallet payout is 27,440,000 and portfolio ROI is 37.2%.
Ledger payout+fee entries sum exactly to the sale price.

Additional proof covers expiry/currency/owner/signature checks, duplicate order
and payment IDs, withdrawal-debit rollback with reservation/version preservation,
owner-first pagination, userId override refusal, and 201/200 envelope mapping.
Unit driver/controller doubles test policy/transport only, not authentication.
Media tests use an explicitly documented external-provider double; monetary
tests use neither a fake database nor fake ledger/payouts.

No server build/transpile or TypeScript script exists for this approved JavaScript
scope. Lint and runnable module tests are the actual checks; frontend build,
authenticated HTTP, browser demo, deployment and fresh application startup are
not claimed. The MongoDB binary is a reusable dependency cache, not committed;
each test's isolated replica set/data directory is stopped/cleaned by its harness.

## Route mounting matrix for Chetan

| Factory | Mount prefix | Owned paths |
|---|---|---|
| `createInvestmentsRouter` | `/api/v1/investments` | POST `/`, GET `/me` |
| `createWalletRouter` | `/api/v1/wallet` | GET `/`, POST `/topup/order`, POST `/topup/verify`, POST `/withdraw`, GET `/withdrawals` |
| `createPortfolioRouter` | `/api/v1/portfolio` | GET `/summary` |
| `createTransactionsRouter` | `/api/v1/transactions` | GET `/` |
| `createUploadsRouter` | `/api/v1/uploads` | POST `/` |
| `createPublicStatsRouter` | `/api/v1/platform` | GET `/stats` |

Factories accept `{services,authenticate,requireRole}`; public stats requires
`{services,authenticate}`. Mount the central error handler last. Express 5 handles
async controller rejection. No competing admin/property/notification route was
created. No JWT/auth placeholder, app/bootstrap, frontend or seed was created.

## Required teammate integration / remaining blockers

| Owner | Required next work |
|---|---|
| Chetan | Validate env; map explicit feature booleans and mock provider/secret; initialize DB/indexes; compose real auth/routes/error/CORS/helmet/health; seed Settings/ADMIN fee account and coherent ledger fixtures; update repository setup/status docs and client workspace; run authenticated HTTP/E2E |
| Devang | Persisted `req.user`, active/sessionVersion auth and `requireRole(...roles)`; auth/profile endpoints; draft/public property CRUD and historical-investment/version immutability guards; submission delegate; notification/enquiry adapters and event calls |
| Darshit | Settings/users/KYC/admin adapters; ADMIN fee-account and incompatible-role/last-admin restrictions; delegate acquisition/refunds/sale/withdrawal processing; private KYC DTOs and media verification; reconfirm price changes in sale UI |
| Deepti | Use server DTOs/flags, keep UUID for same confirmation retries, show authoritative shortfalls, clearly label mock money and distinguish estimate/sale/refund values |
| Affected reviewers | Review shared schemas/enums/errors and approved policy details before merge; approvals recorded here are Dhruv's only |

Feature configuration mapping: `KYC_ENABLED -> kyc`,
`WITHDRAWALS_ENABLED -> withdrawals`, `ENQUIRIES_ENABLED -> enquiries`,
`NOTIFICATIONS_ENABLED -> notifications`, `PASSWORD_RESET_ENABLED -> passwordReset`,
`OWNERSHIP_CAP_ENABLED -> ownershipCap`. All are explicit booleans.
`PAYMENT_PROVIDER` must be `mock` for this increment and `MOCK_PAYMENT_SECRET`
must be a separately generated strong secret. Cloudinary credentials remain
server-side. No new env variable or changed transport/schema field is required.

Not implemented by this scope: Razorpay adapter, real bank transfers, auth,
KYC/admin/property CRUD HTTP modules, frontend, seeds, email, P2 features or
abandoned-media cleanup policy. Exact edit-versus-first-purchase and authenticated
two-browser race proof require the missing owner modules. Service-side inventory,
wallet, cap, cancellation and payout races are verified.

## Stacked branch delivery

Each row's PR base should be its predecessor, not a duplicate giant diff to main.
Main remains unchanged; no push or merge was requested/performed.

1. `feature/backend-foundation`
2. `feature/backend-ledger-wallet`
3. `feature/backend-lifecycle-refunds`
4. `feature/backend-investments`
5. `feature/backend-payouts`
6. `feature/backend-portfolio`
7. `feature/backend-uploads`
8. `feature/backend-notifications-stats`
9. `feature/backend-verification` — contains the complete stack and final evidence.

## Integration blocker: tracked main overlap — 2026-10-01

At handoff, local `main` remains `6e2d5e4`, while the already tracked `origin/main`
is `c6a2699`, containing Darshit's merged PR #1:
`284194c` (admin implementation), `bc25247` (client scaffold), then the merge.
This inspection reads locally available Git objects; it is not a fresh fetch or
a claim about the latest GitHub state. The verified stack has not been merged
with or tested against these changes.

Dhruv explicitly chose to preserve the verified branches and defer reconciliation
to Darshit/Chetan review. The subsequent "continue" resumed this documentation
handoff, not permission to overwrite modules, merge, rebase or push.
Earlier "missing teammate modules" statements refer to the working feature stack;
some admin/auth/client files now exist on tracked main, but their integration is
not compatible or verified.

### Concrete overlapping files and required decisions

| Surface | Tracked main evidence | Verified stack interface / required reconciliation |
|---|---|---|
| Models | [models/index.js](src/models/index.js) re-exports global singleton models; overlapping User, Property, Investment, Transaction, Payout, Withdrawal and Settings files | `getModels(connection)` registers all nine canonical collections on the ready connection. Owners must agree on one registration/export strategy and check every consumer. Do not mix connections or keep duplicate schemas. |
| Investment persistence | [Investment.js](src/models/Investment.js) has an optional unvalidated `responseSnapshot` | Preserve the required validated immutable original snapshot, UUID/fingerprint rules and idempotency index; review existing fixtures/data before applying stricter schemas. |
| Settings persistence | [Settings.js](src/models/Settings.js) allows null fee-account reference | Seed and validate the ADMIN fee account before payouts; no missing-settings/fee-account fallback. Verify rate precision and singleton constraints across admin validators and seed. |
| Errors | [shared/errorCodes.js](../shared/errorCodes.js) maps names to strings; [ApiError.js](src/utils/ApiError.js) takes `(status,code,message,details)` and has static helpers | This stack maps codes to HTTP statuses and uses `new ApiError(code,message,details,options?)`. Agree on the canonical JavaScript interface and update every consumer together; public JSON codes/statuses stay unchanged. |
| Validation | [validate.js](src/middlewares/validate.js) consumes one full-request Zod schema and replaces request fields | This stack uses `{body,query,params}` schema maps, puts parsed data in `req.validated` and does not assign Express 5 query getters. Darshit must adapt owned validators/controllers or coordinate an explicit shared interface; do not silently skip validation. |
| Shared imports | Remote services/middleware use `../../shared/...` from inside `server/src/...` | That resolves to `server/shared`, not root `shared`. Chetan must coordinate consumer imports or an approved workspace export; this stack's nested modules use `../../../shared/...`. |
| Financial engines | [payout.service.js](src/services/payout.service.js) and [propertyLifecycle.service.js](src/services/propertyLifecycle.service.js) export class singletons and post balances/Transaction rows themselves | One agreed lifecycle/payout implementation must call the sole ledger service using the same session. No two monetary implementations or balance-writer compatibility shims. |
| Withdrawal processing | Tracked [admin.service.js](src/services/admin.service.js), lines 377–401, changes wallet cache/version and creates a transaction directly | Darshit's admin service/controller must delegate to `services.withdrawals.process(adminId,withdrawalId,input)`, preserving reservation serialization, history and atomic event behavior. Dhruv has not edited this teammate-owned module. |
| Authentication | Tracked `server/src/middlewares/auth.js` sets `req.user` from decoded claims and permits a signing-secret fallback; role middleware reads that context | Devang must deliver persisted current User, isActive/sessionVersion checks, current role and `_id`, with required validated secret. Do not treat tracked middleware as the verified auth interface or relax these services to accept stale identity claims. |
| Client/tooling | Tracked main adds a separate client package/lockfile and scaffold | Chetan must reconcile the client workspace/scripts/lockfile and existing UI ownership. Backend tests do not establish client build or whole-app compatibility. |
| Team logs | Both branches append [PROMPTS.md](../PROMPTS.md) and [CHANGELOG.md](../CHANGELOG.md) | Preserve both sets of genuine entries. Do not choose one side wholesale or fabricate review approval. |

These are integration-contract observations, not a completed security review,
approval of teammate implementations, or authorization to repair their modules.

### Exact admin delegate migration matrix

Darshit should receive the coordinated service set from Chetan's composition
instead of importing an independently constructed finance singleton.

| Existing tracked-main call | Verified service call |
|---|---|
| `propertyLifecycleService.approve(propertyId,adminId)` | `services.lifecycle.approve(adminId,propertyId)` |
| `propertyLifecycleService.reject(propertyId,reason,adminId)` | `services.lifecycle.reject(adminId,propertyId,reason)` |
| `propertyLifecycleService.updateStatus(propertyId,status,adminId)` | `services.lifecycle.changeStatus(adminId,propertyId,status)` |
| `payoutService.previewPayout(propertyId,salePrice)` | `services.payouts.preview(adminId,propertyId,salePrice)` |
| `payoutService.executePayout(propertyId,salePrice,expectedPlatformFeePct,adminId)` | `services.payouts.execute(adminId,propertyId,{salePrice,expectedPlatformFeePct})` |
| `adminService.processWithdrawal(withdrawalId,input,adminId)` | Delegate to `services.withdrawals.process(adminId,withdrawalId,input)` |

The documented HTTP methods, paths, request fields and success/error DTOs do not
change. Argument order, dependency injection and validation ownership must be
reconciled before mounting these adapters. KYC attachments must use
`services.uploads.verifyAttachments(investorId,media,"kyc",session)` and commit
enabled review events via `services.notifications.record(event,session)`.

### Merge/release gate

1. Darshit/Devang/Chetan review and agree on canonical models, error/validation
   interfaces, service injection and financial write ownership.
2. Reconcile in a separately authorized integration branch, preserving both
   owners' work and the existing feature commits. Local main is not updated here.
3. Validate existing data/fixtures against required schema/index constraints;
   reconcile wallets/ledger before traffic. No destructive data/index reset.
4. Test the combined real auth and admin adapters: invalid/inactive/revoked tokens,
   owner/role denial, withdrawal reservations, sale/refund rollback, stale preview,
   duplicate operations and final-unit HTTP races.
5. Run the delivered finance suite plus Chetan's combined HTTP/E2E/client checks.
   Only then claim integrated compatibility and prepare reviewed PRs.

No merge, rebase, fetch, push, teammate-source change or GitHub comment was made
as part of this overlap handoff.

Preserved-stack rerun on 2026-10-01 at 19:22 local time:
`npm run test:backend` passed all 65 tests in 18 files (36.07 seconds);
`npm run lint` passed; `npm audit` reported 0 vulnerabilities; and
`git diff --check` passed. This rerun deliberately excludes tracked-main changes
and does not satisfy the combined integration gate.
