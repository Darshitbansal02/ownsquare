# OwnSquare handoff to Antigravity

Prepared 2026-10-01 for Devang. This file describes actual local work and supplies continuation prompts. Read the code and rerun the checks before relying on earlier results.

## Workspace and Git state

- Repository: https://github.com/DevangMittal23/OwnSquare.git
- Local repository: `D:\Desktop\fullstack-exam\OwnSquare`
- Parent workspace: `D:\Desktop\fullstack-exam`
- Current branch: `features/full-stack-auth-broker`, tracking the same origin branch.
- **The implementation is still uncommitted.** README, PROMPTS and CHANGELOG are modified; application source, manifests, lockfile, shared modules and handoff documents are untracked. The remote repository alone will not contain this implementation. Open this local working tree or transfer these changes first.
- Preserve all existing changes. Do not reset/clean, replace the checkout with a fresh clone, or rebuild the scaffold from scratch. No implementation commit, PR, push, merge or deployment was performed by Codex.
- Local environment: Windows PowerShell; tested with Node 24.12.0/npm 11.6.2. Use a runtime compatible with the locked dependencies.
- Test API/Vite servers were stopped after verification. Session browser scripts/screenshots are temporary, not permanent acceptance artifacts.

## User intent and authorization

Devang's assignment is Full-Stack Auth + Broker. The original instruction was: “i am Devang . implement my part as per the documents.” The repository initially contained documentation only.

When asked whether to remain within Devang-owned files or create the missing minimum shared foundation, Devang explicitly selected: “Also create the minimum shared foundation”. This authorized the supporting models, manifests, shared utilities and application wiring. It does not establish approval or contributions from other team members.

Use the Ponytail approach: understand the actual flow, reuse existing code, prefer native/installed capabilities, add the minimum complete implementation, and retain security/validation/transaction guarantees. Avoid duplicate transports, models, enums, ledgers or status machines.

## Documents to read first

1. `docs/AUTH_BROKER_HANDOFF.md` and `client/src/pages/auth/FRONTEND_HANDOFF.md`: implementation exports, integration assumptions and verified limitations.
2. `docs/PS1_Fractional_Real_Estate_Investment_Portal.md`: authoritative examination specification.
3. `COLLABORATION.md`: owners, shared-file rules and integration gates.
4. `CONTRACTS.md`, `API_DESIGN.md`, `DATABASE.md`, `BUSINESS_RULES.md`: enums, DTOs, fields, paths, money and lifecycle rules.
5. `PRD.md`, `ARCHITECTURE.md`, `UI_UX.md`, `TESTING.md`, `docs/USER_FLOWS.md`, `docs/ERROR_CODES.md`, `docs/API_EXAMPLES.md`, `docs/DEPLOYMENT.md`.
6. `README.md`, `PROMPTS.md`, `CHANGELOG.md`, environment examples and actual package scripts.

Several original docs still describe a future application. README and the implementation handoffs distinguish implemented behavior from plans. D1–D9 were not recorded as approved by all required teammates. Do not invent sign-off, completed features, credentials, tests, contributions or live URLs.

## Actual implementation

### Runtime foundation

JavaScript ES modules, npm client/server workspaces, React/Vite/React Router/TanStack Query, Express 5, Mongoose 9, Zod 4, bcrypt 12 rounds, JWT, Helmet, restrictive CORS, auth rate limiting, Multer/Cloudinary and optional Nodemailer 10 SMTP. `package-lock.json` exists. UI uses scoped CSS; do not assume Tailwind/shadcn or Recharts is installed.

Foundation includes:

- `server/src/app.js`, `index.js`, `config/env.js`, `config/db.js`, `config/cloudinary.js`.
- `shared/constants.js`, `shared/errorCodes.js`, `ApiError`, DTO helpers, validation/error/rate-limit middleware.
- User, Property, Investment, Transaction, Enquiry and Notification models. **These are a minimum foundation, not proof all financial model requirements are complete.** Payout, Withdrawal and Settings models are absent.
- `client/src/api/client.js`, `main.jsx`, `routes/AppRoutes.jsx`, Vite setup and central provider composition.
- `server/scripts/seed-auth.js`: narrow account seed, not the required full financial/property seed.

### Devang features implemented

- Investor/Broker registration; seeded-only Admin; login/logout/me and role routing.
- JWT subject/role/sessionVersion, 15-minute expiry, HS256 issuer/audience checks. Authentication loads current User and enforces persisted role, activation and session version.
- Memory-only browser token. Reload requires login. Logout/password change/reset revoke existing sessions. Query caches/transient private state are cleared; old account responses cannot overwrite a newer account.
- Name/phone profile edits; compare-and-set password change; hashed expiring single-use reset tokens and SMTP feature gate.
- Public property listing/detail APIs with literal search, filters, stable pagination and draft visibility rules.
- Broker/admin partial draft creation/editing; exact whole-rupee unit division; verified property media; complete submission with >=3 images. Guarded writes increment property version. Rejected drafts can resubmit; pending review is locked.
- Broker dashboard, independent pending-approvals queue, property table/status filters, reusable five-step listing wizard, property detail, funding/investor analytics and commission reads.
- Participant-only enquiry creation/list/replies. Reply notification persists in the same MongoDB transaction.
- Recipient-only notification page/list/mark-read, capability gates, profile/password pages and accessible auth forms/password toggles.
- Property uploads inspect MIME/signatures/size and verify Cloudinary owner/purpose metadata when attaching. Real-provider success still needs credentials.

### Critical integration interfaces

- `createApp(env, {mailer?, uploadService?})`; normal runtime uses real providers. Test injections are external transport substitutes only.
- `authenticate(env, {optional?})`; `requireRole(...roles)`; `requireApprovedBroker`; `requireOwnership`.
- `req.user` is the persisted current User; `req.property` is scoped to owner/admin. Parsed input lives in `req.validated.body/query/params`; Express 5 query is read-only.
- `ApiError(code, message, details=[])` and canonical success/error envelopes. Correct-role foreign records return 404; wrong role returns 403; missing/inactive/revoked session returns 401.
- `propertyLifecycle.service.js` currently exports **submission only**: `submitProperty(user, id, verifyMedia)`. Extend this service for other transitions instead of introducing another status machine.
- `notification.service.js`: `postNotification(event, session)`. Domain event creators must pass their financial/business transaction session.
- `AuthProvider({api, queryClient, constants, features?, children})`, `useAuth`, ProtectedRoute and RoleRoute. Key only the protected subtree by `sessionKey`; public login forms must retain credential errors.
- The single API client unwraps success `data`, preserves error fields, synchronously captures the logout token, and ignores obsolete-account 401s. INVALID_CREDENTIALS does not clear the current session.
- Admin creation can reuse `PropertyWizard({mode:'admin', propertyId?, onSaved?, onSubmitted?})`.

Full route/export/API map is in FRONTEND_HANDOFF.md. Extend the existing client instead of adding fetch/axios instances per feature.

## Verified baseline

Before this handoff:

- `npm test`: **14 passing checks** — 9 server checks and 5 client checks.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm audit --omit=dev`: zero reported production dependency vulnerabilities at verification time.
- Server integration tests use an isolated real MongoDB replica set. SMTP and Cloudinary transport are substituted in those tests; auth/database are real.
- Chrome smoke against a real isolated API passed credential errors/success, partial draft persistence, server unit price, profile update, empty notifications, logout, pending broker restrictions and reload login, with no browser exceptions.
- Login/signup/wizard layout checked at 360/768/1440 without page overflow; design evaluation passed using the available model.

These checks do **not** prove complete financial flows, real SMTP delivery, real Cloudinary upload/attachment, populated funding/notification UI or deployment readiness. Rerun relevant checks after changes. MongoDB's first test download on Windows was about 752 MB; the binary is cached under root `node_modules/.cache/mongodb` in this workspace.

## Local run

From the repository root:

```powershell
npm ci
# client/.env was copied from its example locally; it contains only the API URL.
# If moving to another machine, copy it again.
Copy-Item .\client\.env.example .\client\.env
Copy-Item .\server\.env.example .\server\.env
# Configure server secrets locally. Never commit or print them.
npm run seed:auth --workspace server
npm run dev --workspace server
```

Second terminal:

```powershell
npm run dev --workspace client
```

Required: transaction-capable MongoDB URI; strong generated JWT_SECRET; JWT_EXPIRES_IN=15m; exact CLIENT_URL; public VITE_API_BASE_URL ending `/api/v1`. Cloudinary is required for upload/attachment/submission with media; SMTP is required only when password reset is enabled. `seed:auth` requires operator-supplied SEED_* passwords and creates admin, two approved academic brokers and an investor. It preserves existing accounts and refuses production. It does not implement real administrator broker approval.

Inspect existing `.env` files before copying; **do not overwrite filled user configuration**. The examples retain variables for future team modules that are not all consumed by the current runtime. `/platform/stats` currently advertises KYC, withdrawals and ownership cap as false, even though the original examples suggest future enabled values. Make validated server config and capability flags consistent when implementing those modules.

## Remaining work, in dependency order

| Order | Work | Primary owner |
|---|---|---|
| 1 | Finish/review shared models, exact money helpers, Settings/Payout/Withdrawal, immutable ledger posting and wallet serialization | Dhruv |
| 2 | Admin broker approval/users/settings and property approve/reject/acquire/cancel adapters; expand shared lifecycle service | Darshit + Dhruv |
| 3 | Signed mock or Razorpay test top-ups; wallet/transactions; atomic idempotent investments, cap/KYC gates, funding and once-only commission | Dhruv |
| 4 | Shared payout preview/execution, exact remainder/row allocation, refunds and correct portfolio aggregation | Dhruv + Darshit |
| 5 | Public landing/marketplace/detail/calculator; Investor dashboard/checkout/portfolio/holding/wallet; shared role layouts/components | Deepti |
| 6 | Admin dashboard/property review/sale/users/settings; private dummy KYC and withdrawal processing screens | Darshit |
| 7 | Devang provider integration, populated broker/enquiry/notification states and cross-module regressions; investor enquiry surface | Devang + Deepti |
| 8 | Full coherent seed, API/Postman, integration/E2E/concurrency proof, configuration/deployment, release docs | Chetan + all owners |

P0 financial behavior is absent, not partially operational. Admin/Investor frontend routes currently show explicit integration-pending states. Property approval, acquisition, cancellation and sale endpoints are absent. Auth account seeds cannot replace the required >=8 properties and >=5 investors with reconciling financial history.

P1 still needed: private dummy KYC with server investment gate, cumulative ownership cap, reserved withdrawals, complete investor enquiry UI and lifecycle/funding/payout notifications. Password reset code exists but real SMTP must be verified. Existing enquiry/notification gates must continue working.

P2 is separate: refresh rotation, rental distribution, secondary market, audit log, dark mode and optional email notifications. Do not implement these before P0/P1 acceptance or silently introduce their schema/security changes.

## Financial constraints the next agent must preserve

- Money is safe-integer paise, units are integers. Exact integer intermediates, including basis-point fees; no client-authoritative amounts and no BigInt JSON.
- One ledger posting service for every money movement. Ledger stays append-only; synchronized user cache and walletVersion serialize spending and withdrawal reservations.
- All inventory, wallet, investment, commission, payout/refund and enabled event writes share the same MongoDB transaction/session. Retry classified transient conflicts only. Provider/email calls stay outside retryable financial transactions.
- Conditional property writes prevent overselling/edit races. Review the existing version guards when integrating investment/lifecycle writes.
- Investment idempotency: UUID header, unique investor/key; identical replay returns original immutable data with 200, changed payload returns IDEMPOTENCY_CONFLICT. Review the current Mixed responseSnapshot schema and complete the documented validation requirements.
- Final-unit race: exactly one 201; loser 409 INSUFFICIENT_UNITS with numeric remainingUnits=0, even after winner changes status to FUNDED. Ordinary already-funded purchase is ALREADY_FUNDED.
- Unique payment order/payment IDs and commission/payout causes; no double credits or investor-principal commission deduction.
- LIVE cancellation refunds all ACTIVE rows atomically and retains history. HOLDING sale executes once; loss is allowed. Floor aggregate payouts and assign remainder to largest holder, tie ascending investorId. Allocate each investor's amount across investment rows with the documented tie rule.
- Source example: valuation 1,000,000,000 paise / 1,000 units; Aman buys20 units for20,000,000. Sale1,400,000,000; fee28,000,000; distributable1,372,000,000; Aman payout27,440,000 and ROI37.2%.
- No fake backend/auth/database/success responses. Test/mock payments are allowed when labelled and cryptographically verified. No real identity/bank data or live charges.

## Prompt 1 — finish and integrate Devang's part

```text
I am Devang. Continue the existing OwnSquare working tree at
D:\Desktop\fullstack-exam\OwnSquare on features/full-stack-auth-broker.
Read docs/ANTIGRAVITY_HANDOFF.md, both implementation handoffs, the source
specification and the shared contracts before editing. The current source
is uncommitted; preserve every existing change and build on it.

Finish the remaining integration and verification of my Full-Stack Auth +
Broker assignment. Inspect the current code rather than recreating it.
Rerun the baseline tests/build/lint. Verify complete listing creation,
media attachment, submission, rejection/resubmission, approval-state
refresh, populated broker analytics/investor lists, participant enquiry
replies, notification isolation, profile/password and reset behavior.
Use real MongoDB/auth. Verify Cloudinary and SMTP when configuration is
available; request only missing credentials/configuration and continue
independent work while waiting. Do not fabricate successful provider tests.

Integrate with available shared models, lifecycle/notification services,
admin broker approval and the single API client. If those teammates'
modules are still absent, deliver a precise callable handoff and test the
owned behavior without replacing their financial/admin implementation.
Keep memory-only JWT/session invalidation unless changing the documented
contract deliberately. Preserve ownership/RBAC, exact money parsing,
partial draft saves and asynchronous account isolation. Validate populated
screens at360/768/1440, including loading/empty/error/success and keyboard use.

Use the smallest complete solution and existing dependencies. Record real
prompt/change/test evidence and any unresolved integration dependency.
Do not push, merge or deploy without a separate request. Finish authorized
work; report actual results and concrete remaining gaps.
```

## Prompt 2 — complete the remaining P0/P1 application

```text
Continue OwnSquare in the existing local working tree. Read
docs/ANTIGRAVITY_HANDOFF.md and every authoritative requirement/contract,
then inspect actual code and Git state. Preserve the uncommitted auth/broker
implementation. My next objective is to complete the remaining P0 and P1
application features, reusing the existing foundation and documenting
cross-owner integration according to COLLABORATION.md. Do not invent
team sign-off or make silent breaking contract changes.

Implement in dependency order, finishing runnable vertical slices:
1. Complete shared persistence/settings and the one exact-money ledger,
   wallet serialization and transaction infrastructure.
2. Admin user/broker/settings APIs and legal property approve/reject,
   acquisition/cancellation transitions using the existing lifecycle service.
3. Verified signed academic mock or Razorpay test top-ups; real wallet/
   ledger APIs; atomic investments with UUID idempotency, concurrent inventory
   guards and once-only funding commission. No live payments.
4. Exact payout preview/sale/refunds, immutable histories and correct portfolio.
5. Complete public, investor and admin screens/routes/shared layouts,
   using the existing central API client and Devang's reusable wizard.
6. P1 private dummy KYC, cumulative ownership caps, reserved withdrawals,
   investor enquiry UI and transactionally consistent domain notifications.
   Synchronize validated server feature flags and advertised capabilities.
7. Non-destructive comprehensive seed, Postman/API coverage, integration/E2E
   checks, responsive/accessibility verification and accurate setup/release docs.

Follow exact API paths, enums, DTOs, paise, envelopes and ownership rules.
Complete existing model gaps; do not create competing models, ledgers,
transports or status machines. MongoDB must support transactions. Never
fake auth/data/financial success or downgrade transaction safety.

Prove final-unit races, concurrent spending/reservations, duplicate payment,
investment replay, duplicate sale, cancellation rollback and payout exactness.
Use the source Noida example, a loss sale and rounding/tie fixtures.
All investor payouts plus fee must exactly equal salePrice. Test foreign
broker, wrong-role, inactive/revoked-session and last-admin protections.

Build one slice at a time; rerun relevant tests before continuing. Preserve
the14-test baseline and add meaningful failure/concurrency evidence.
Document real results and remaining gaps. Ask only for required external
configuration or an actual unresolved contract decision; continue independent
work. Do not start P2 until P0/P1 acceptance passes. Do not push/merge/deploy
without a separate request or fabricate deployment/demo credentials.
```

## Prompt 3 — next feature: Devang's P2 refresh-token rotation

```text
After P0/P1 acceptance passes, implement AUTH-4 as the next focused feature:
secure refresh-token rotation. Read the existing auth/session code and
contracts first. Preserve current authorization and logout/password-change/
reset revocation semantics. Update the related contract documents and
handoff together; record which team reviews are still required.

Keep short-lived access tokens in memory. Store refresh credentials only in
secure/httpOnly cookies, with an explicit SameSite, CORS and CSRF design.
Persist hashed refresh sessions with bounded expiry, atomic one-use rotation,
reuse detection and family revocation. Never put raw refresh tokens in logs,
JSON responses or localStorage. Define and wire the approved refresh endpoint
through the single API client. Bound automatic refresh/retry behavior and
prevent concurrent refresh races or previous-account responses crossing login.

Make production HTTPS cookie behavior and local development behavior explicit.
Verify login/reload/expiry refresh, concurrent refresh, reuse attacks,
inactive/role-changed users, logout and password-reset revocation, and CSRF/
origin rejection. Do not start rental income, secondary trading, audit log
or dark mode in this same change. Finish this feature with tests, accurate
docs and a reviewable diff before proposing the next bonus feature.
```

After refresh rotation, consider admin audit history, rental distribution, dark mode, then secondary trading as separate scoped changes. Rental and secondary trading require new financial contracts, schema/indexes, ledger causes and concurrency proof; they are not UI-only additions.
