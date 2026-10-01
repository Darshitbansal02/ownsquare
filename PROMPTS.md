# Development Prompt Log

Maintain during development: the hackathon evaluates prompt history and team understanding. Record genuine prompts, results and tests only; do not backfill fabricated historical prompts. This is an empty template, not evidence of implemented features.

Copy the following block for each real prompt; replace `Prompt ID` with a sequential identifier such as `P-001`. Dates are ISO dates; link resulting PR/commit in Notes when available.

## Prompt ID

Owner: `<team member>`

Date: `<YYYY-MM-DD>`

Feature: `<requirement ID and feature>`

Prompt:

```text
<Exact prompt or clearly marked faithful excerpt; redact secrets/private identity data.>
```

Files changed: `<actual repository paths, or none>`

Result: `<actual outcome, including incomplete work or failures>`

Tests: `<actual commands and results, or not run with reason>`

Notes: `<design decisions, review, integration impacts, PR/commit, lessons for viva>`

---

Do not mark a generated response as working until its owner can explain it and relevant checks pass. Important contract changes also need [COLLABORATION.md](COLLABORATION.md) approval, not just a prompt log entry.

## P-001 — Dhruv's scoped backend implementation

Owner: Dhruv

Date: 2026-10-01

Feature: backend foundation and financial increments

Prompt (faithful excerpt):

```text
Act as my senior backend engineering partner. I am Dhruv, OwnSquare's Backend
Lead. Implement my assigned scope—not the entire application. Read the source
specification and contracts first. Start with models, indexes, shared
constants/errors, database configuration, validation, and integer-money helpers.
Use integer paise, transactions, concurrency guards, idempotency, append-only
ledger entries and ownership checks. Add focused tests and genuine handoffs.
Create different branches for different features.
```

Result so far: read the source/contracts/environment/error catalog; repository
has no existing application. Dhruv explicitly approved the backend choices and
limited manifest/test-tooling exception recorded in [server/BACKEND_HANDOFF.md](server/BACKEND_HANDOFF.md).
Teammate sign-off is not inferred. Stacked branches and incremental commits
were expressly authorized; no push or merge into main.

Files changed/tests: actual feature results will be appended below.

Foundation result: added nine models/indexes, shared enums/errors, exact paise
helpers, database/index readiness, transaction/validation/error/rate-limit helpers,
and authorized backend dependency/lint/test configuration. Unit runner: 7/7 tests;
lint passed; dependency audit clean after updating new test tooling. No auth,
application bootstrap, frontend, seed or external provider was implemented.

Ledger/wallet increment: one posting/reconciliation helper, signed expiring mock
proofs, withdrawal reservations/processing, transactional notification persistence,
and owned wallet/transaction adapters. Real replica-set integration tests: 4/4;
unit tests: 12/12; lint passed. Initial database-binary download timeout was
resolved by a separate preparation command; no fake database/auth used as proof.

Lifecycle increment: state/version guards, broker ownership, submit completeness,
publication media-verifier dependency, rejection events and full-refund service.
Focused tests: 5/5 passed; lint initially caught loose null comparisons, corrected
to explicit null/undefined guards before commit. Full invested-refund verification
is scheduled against the real investment service, not fabricated holdings.

Investment increment: conditional inventory/version claim, sole-ledger debit,
KYC/aggregate caps, immutable request replay, transactional funding commission
and recipient events, plus owned investment adapters. Investment/lifecycle tests:
12/12 real replica-set tests passed, including five final-block races and injected
debit/commission/event/refund rollback. Lint passed; authenticated HTTP/browser
proof is still blocked by missing teammate modules.

Payout increment: authoritative shared calculation, aggregate-holder and row
remainders, guarded sale/fee posting, unique payout and atomic history updates.
Dhruv approved preserving the existing stateless preview API and handing price
reconfirmation to Darshit's UI rather than inventing a token contract. Seven
focused payout tests passed (3 unit, 4 real replica-set); lint passed.

Portfolio increment: historical per-property aggregation, noncash estimates,
realized payout/refund values, ledger-only payout totals and assigned summary
adapter. Five focused tests passed (2 unit, 3 real replica-set); lint passed.

Upload increment: Cloudinary adapter, byte/MIME/size checks, private authenticated
KYC URLs, server metadata ownership verification and owned multipart adapter.
Dhruv approved creator-or-ADMIN property media and strictly own-investor KYC.
Six tests passed after correcting Mongoose subdocument normalization; lint passed.
Media-provider tests use an explicit external double, not a live Cloudinary claim.

Notifications/statistics increment: recipient-only persistence/read helpers
(Devang still owns HTTP), truthful public aggregates/capabilities, optional-token
public adapter and explicit service composition handoff. Four focused replica-set
tests passed; lint and npm audit passed (zero vulnerabilities).

Final verification increment: exercised the full source crore-sale through actual
transactions and checked all wallet payouts/commission/fee conservation; added
payment expiry/currency/duplicate-order/payment proofs, withdrawal rollback,
owner-filtered ledger pagination, safe new-User serialization, exact UTC bounds,
standalone/missing-settings/closed-database refusal and sanitized 503 handling.
Final command `npm run test:backend`: 65/65 tests, 18 files, 32.04 seconds;
`npm run lint`, `npm audit` (0 vulnerabilities) and `git diff --check` passed.
See [server/BACKEND_HANDOFF.md](server/BACKEND_HANDOFF.md) for actual exports,
branch stack, approvals and missing-owner/provider/E2E handoffs. Main is untouched;
no push, fabricated teammate approval or operational whole-app claim.

## P-002 — Preserving the verified stack and documenting integration overlap

Owner: Dhruv

Date: 2026-10-01

Prompt/approval (faithful excerpt):

```text
Preserve the verified branches and document the conflicting files/interfaces
for Darshit/Chetan review before integration.
Continue.
```

Result: read locally tracked `origin/main` changes from merged PR #1 without
merging or overwriting them. Recorded overlapping models, error/validation APIs,
service signatures, financial write ownership, auth context, shared imports,
client tooling and append-only team log conflicts, with exact admin delegate
mappings and a reviewed integration gate.

Files changed: [server/BACKEND_HANDOFF.md](server/BACKEND_HANDOFF.md),
[PROMPTS.md](PROMPTS.md), [CHANGELOG.md](CHANGELOG.md).

Tests: documentation-only changes introduce no code behavior. Previous verified
65-test backend evidence remains scoped to the preserved stack, not tracked main;
any rerun is recorded separately below with its actual outcome.

Notes: no fresh fetch, merge, rebase, push, teammate module edit or fabricated
review approval. Cross-branch compatibility remains an explicit blocker.

Actual continuation rerun: `npm run test:backend` passed 65 tests in 18 files
(36.07 seconds, 19:22 local time); `npm run lint` and `git diff --check` passed;
`npm audit` reported 0 vulnerabilities. Tracked-main changes were not merged or
included in this verification.

## P-003 — Backend branch and PR publication

Owner: Dhruv

Date: 2026-10-01

Prompt (faithful excerpt):

```text
Now push all the branches with the message backend complete and also a good
PR request for each branch with a message.
```

Additional instruction: exclude attribution trailers from new publication text
and commits. Existing commits were not amended or rewritten.

Result: pushed the nine backend feature branches, verified their remote refs,
and created draft PRs #2 through #10 with "Backend complete" titles, feature
summaries, real test evidence and explicit integration limitations. PR bases
follow the dependency stack; only foundation targets main. Remote main was
unchanged and the tracked-main overlap remains an integration blocker.

Files changed: publication records in [server/BACKEND_HANDOFF.md](server/BACKEND_HANDOFF.md),
[PROMPTS.md](PROMPTS.md) and [CHANGELOG.md](CHANGELOG.md).

Verification: GitHub returned all nine draft PRs; each pushed feature ref matched
its local commit. Documentation-only publication does not require a new code
test run or claim that GitHub CI passed.
