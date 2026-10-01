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
