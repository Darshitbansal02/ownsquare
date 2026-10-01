# P0/P1 continuation — 2026-10-01

Devang explicitly requested completion of Prompt 2 across the existing working tree, followed by Prompt 3 only after P0/P1 acceptance. All prior uncommitted changes were preserved. Cross-owner implementation is user-authorized work; it does not represent approvals or contributions by Dhruv, Deepti, Darshit or Chetan. D1–D9 and financial/auth changes still need actual affected-owner review before merge.

## Implemented continuation

- Shared Settings, Payout and Withdrawal persistence; snapshot-validated immutable investment confirmation; append-only ledger insertion and user walletVersion serialization. Settings have an internal version guard for concurrent last-admin protection.
- Signed, expiring, user/order/payment/amount-bound academic mock top-ups. Only `PAYMENT_PROVIDER=mock` is implemented; choosing Razorpay fails startup explicitly. No fallback or live payment adapter.
- Atomic investment eligibility, cumulative ownership cap, KYC gate, inventory claim, debit, confirmation snapshot, funding commission and broker/investor notifications. UUID request replay returns the original snapshot after sale/refund.
- Shared lifecycle approval/rejection/acquisition/cancellation and refund service. Shared exact payout preview/execution, aggregate holder rounding, per-investment allocation, one sale and one fee credit.
- Wallet, investment history, portfolio, ledger, admin users/settings/stats/property lists, private dummy KYC and reserved withdrawal endpoints through the existing authentication and central API client.
- Public marketplace/detail/calculator, investor dashboard/checkout/portfolio/holding/wallet/KYC/enquiries, admin dashboard/property/user/KYC/withdrawal/settings/sale screens. Existing broker wizard and auth surfaces are reused.
- Comprehensive non-destructive demo seed and Postman collection covering the 47 documented P0/P1 endpoints.

## Service ownership handoff

Dhruv: `ledger.service.js` exports `post`, `walletState`, `walletDTO`, `serializeWallet`; callers supply a transaction session. `inTransaction(work)` uses snapshot reads, majority writes, five bounded transient retries with backoff and separate unknown-commit retries. No provider I/O belongs inside these callbacks.

`invest(user, body, key, env)` returns `{data,replayed}`. `previewPayout(id,salePrice)` is read-only. `executePayout(user,id,body,env)` returns `{property,payout}`. `requestWithdrawal(user,body)` and `reviewWithdrawal(user,id,body,env)` return `{withdrawal,wallet}`. Lifecycle exports extend the original submission service: `reviewProperty` and `changePropertyStatus`. Portfolio returns the contracted DTO.

Darshit: `admin.service.js` and `kyc.service.js` provide review/user orchestration. Chetan: `financeRoutes(env,uploads)` composes these service adapters at `/api/v1`; `createApp` mounts it and capability flags reflect validated environment booleans. Deepti/Devang: one API client contains all wrappers; no page-specific transport.

Private KYC is uploaded as Cloudinary `authenticated` media. Attachment checks server-fetched owner/purpose/format/size metadata, persists canonical provider URLs, and administrator review returns signed download URLs expiring after ten minutes. Public property DTOs never include KYC. Withdrawal responses mask the account number to its last four digits. This is a privacy clarification relative to the illustrative API example showing a full dummy account number.

## Verified automated evidence

Baseline before continuation: 16 checks, lint and build passed. After integration: 25 automated checks pass (18 server, 7 client), lint and build pass. Real isolated MongoDB replica sets, actual bcrypt/JWT and signed mock payment verification are used. External SMTP/Cloudinary transports alone are substituted in integration tests.

Financial evidence includes source Noida fee/payout/37.2% ROI; immutable replay after sale; repeated final-block races with exactly one 201 and one 409 INSUFFICIENT_UNITS/remainingUnits=0; duplicate payment/sale; concurrent wallet spending/reservations/cap; KYC states and persisted deactivation; exact loss/tiny/tie payouts and ledger reconciliation; refund/commission/payout/withdrawal failure rollback; and repeatable eight-state seed without new financial posts.

Failure injection deliberately emits sanitized `Request failed { name: 'Error' }` logs. Those expected failures are asserted as HTTP 500 with complete rollback, not waived test failures.

## Setup and seed

Use Node 22+ compatible with the lockfile (tested Node 24.12), `npm ci`, and a transaction-capable MongoDB URI. Preserve existing `.env` files. Fill `server/.env` from the example only if missing; generate distinct strong JWT and mock-payment secrets. Set exact CLIENT_URL and client VITE_API_BASE_URL.

`npm run seed --workspace server` requires three strong SEED_* passwords, configured Cloudinary, and `SEED_MEDIA_DIR` containing at least three owned dummy JPG/PNG/WebP images under 5 MB each. The seed uploads real media, submits/reviews dummy KYC, runs the property/investment/sale services, and posts labelled academic seed top-ups through the sole ledger. It does not pretend those seed credits were gateway payments. Never supply real identity or bank data. Existing fixture accounts/passwords/settings are preserved; incompatible roles/settings fail visibly. A configured ownership cap below 40% cannot accommodate the source example and is not silently overwritten.

Accounts: admin@demo.com; rohit@demo.com, other-broker@demo.com; aman@demo.com, priya@demo.com, karan@demo.com, isha@demo.com, neha@demo.com. Passwords come from the operator, are never logged, and are not included here. Seed verifies balances, inventory and sold payout totals. Rerun uses fixed investment intents and top-up causes. Existing demo activity is preserved, so rerun need not restore original statuses.

Start API: `npm run dev --workspace server`. Start UI separately: `npm run dev --workspace client`. Run `npm test`, `npm run lint`, `npm run build`. Import `docs/OwnSquare.postman_collection.json`, set local variables and the appropriate role token. Generate a UUID once per purchase intent. Regenerate the collection with `node server/scripts/export-postman.js`.

## Remaining acceptance and external limits

Browser integration/visual checks are in progress. Real Cloudinary upload/private unauthenticated-denial and real SMTP email delivery have not been verified without operator configuration. Automated transport substitutes do not establish provider success. No deployment, demo video, PR, commit, push or merge is claimed. P2 refresh rotation remains gated on completion of P0/P1 acceptance; rental/secondary/audit/dark mode remain separate future changes.
