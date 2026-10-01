# User Flows and Sequences

Planned behavior from the [source](PS1_Fractional_Real_Estate_Investment_Portal.md). Authority: [business rules](../BUSINESS_RULES.md), [API design](../API_DESIGN.md). Arrows describe actual server/persistence work once implemented; no mock auth/database.

## Property lifecycle (P0)

```text
Broker -> POST /properties -> DRAFT
Broker -> PATCH /properties/:id -> saved draft
Broker -> POST /properties/:id/submit -> PENDING_APPROVAL
Admin  -> POST /properties/:id/approve -> LIVE
Admin  -> POST /properties/:id/reject -> REJECTED + reason
Broker -> edit rejected -> submit -> PENDING_APPROVAL
Investor purchases -> unitsSold == totalUnits -> FUNDED + commission
Admin -> POST /properties/:id/status {status:HOLDING} -> HOLDING
Admin -> payout-preview -> confirmation -> sell -> SOLD + payouts
Admin -> LIVE status CANCELLED -> full refunds -> CANCELLED
```

Incomplete submission returns field errors; illegal transition is 409. Admin may create its own draft and submit/approve through the same legal states. No bypass directly to LIVE/FUNDED/SOLD.

## Investor flow

```text
Public -> signup INVESTOR -> /investor
Investor -> dummy KYC upload/submission (when enabled)
Admin -> review -> APPROVED or REJECTED with reason
Investor -> wallet test/mock top-up -> verified credit
Investor -> marketplace filters -> property detail/calculator
Investor -> checkout -> terms + confirm -> server purchase
Server -> committed holding/wallet/ledger -> success
Investor -> portfolio/holding detail -> estimates and history
Admin sells -> payout -> wallet/realized ROI
Investor -> optional withdrawal or enquiry
```

No holdings shows a helpful browse CTA. Nonapproved KYC, cap or short wallet disables eligible UI action AND fails server checks. Inactive token -> 401/login. Admin/broker attempting investment -> 403.

## Broker flow

1. Register BROKER, sign in, see approval pending.
2. Admin approves via PATCH `/admin/users/:id`; refresh current user.
3. Use multi-step wizard; POST/PATCH draft at any step.
4. Supply financials/media/docs; server computes unitPrice.
5. Submit; pending review locks editing.
6. If rejected, read reason, correct and resubmit.
7. On approval, view LIVE funding chart and own investor list.
8. Reply to own property enquiries if P1 enabled.
9. On FUNDED, inspect once-only commission; continue tracking HOLDING/SOLD.

Other broker's draft/analytics returns 404. Public LIVE detail remains available; public access does not grant analytics/edit access.

## Admin flow

Seeded admin -> login -> KPIs/queues -> broker approval -> property review -> approve/reject -> monitor funds -> acquisition HOLDING -> preview sale/confirm -> payout/ledger. User activation/settings/KYC/withdrawal queues use protected endpoints. No self-registered admin.

Admin property table uses GET `/admin/properties`, not public marketplace filters to expose drafts. KYC queue uses GET `/admin/users?kycStatus=PENDING`.

## Wallet top-up flow (P0)

```text
Investor -> Client: choose rupee amount
Client -> Server POST /wallet/topup/order: integer paise
Server -> selected test/mock adapter: trusted order bound to investor
Adapter -> Client: checkout data, visibly mock/test
Client -> Server POST /wallet/topup/verify: proof and IDs
Server: verify signature/owner/amount/currency/payment state
Server -> Mongo transaction: unique order/payment + ledger credit + cache
Server -> Client: WalletDTO + TransactionDTO
Client: refetch wallet/ledger/dashboard
```

Order creation never credits balance. Invalid/expired proof fails; duplicate verification 409 DUPLICATE_PAYMENT; provider outage explicitly shown. No automatic mock fallback.

## Investment flow (P0)

```text
Client: units/ownership/amount preview, wallet shortfall, terms
Client: generate UUID Idempotency-Key, retain across retries
Client -> Server POST /investments {propertyId,units}
Server: active investor -> replay lookup -> session
Session: eligibility -> conditional inventory -> wallet debit -> investment
Session: if final units, FUNDED + commission + enabled notification
Session: commit all or rollback all
Server -> Client: 201 committed result / 200 replay / explicit error
Client: success + refresh affected datasets
```

Two final-block buyers: one 201, one 409 INSUFFICIENT_UNITS with remainingUnits. Repeated confirm with same key creates nothing twice. Network uncertainty retries same key; changed units requires a new key only after resolving prior operation.

## Sale/payout flow (P0)

1. Admin opens HOLDING property sale screen.
2. Enter positive salePrice in paise after UI conversion; lower-than-valuation price permitted.
3. GET `/properties/:id/payout-preview?salePrice=...`: show fee rate/fee/distributable/investor rows/remainder/exact sum.
4. Confirm the shown price/rate; POST `/properties/:id/sell` with salePrice and expectedPlatformFeePct.
5. If fee changed: PREVIEW_STALE -> refresh and reconfirm, no sale.
6. One transaction guards HOLDING, aggregates units, creates unique payout, credits wallets/FEE, updates rows/property/notifications.
7. Server returns SOLD/payout; admin and investors refresh dashboards/ledger.
8. Repeated sale -> 409 ALREADY_SOLD, never another credit.

Cancellation is separate: LIVE -> refunds and terminal CANCELLED; sale proceeds are not a refund.

## KYC flow (P1)

Investor dummy file -> POST `/uploads` purpose kyc -> private MediaDTO -> POST `/kyc` docs+selfie -> PENDING -> admin private review -> PATCH `/admin/kyc/:userId` APPROVED/REJECTED. Rejection requires reason, investor may reupload/resubmit. Pending/approved resubmission fails.

When KYC disabled, UI explains availability and server does not require it for P0 investing. Never let a UI toggle override an enabled server gate.

## Withdrawal flow (P1)

```text
Investor -> POST /wallet/withdraw: amount + dummy bankDetails
Transaction: serialize wallet, check available, create PENDING reservation
Client: show unchanged balance, reservedBalance, reduced availableBalance
Admin -> GET /admin/withdrawals -> review
Admin -> PATCH /admin/withdrawals/:id
  APPROVED: one ledger debit + release reservation + processed metadata
  REJECTED: reason + release reservation, no debit
Investor -> GET /wallet/withdrawals: own status/history
```

Concurrent investment cannot spend reserved amount; second processing is 409 WITHDRAWAL_ALREADY_PROCESSED. There is no real bank transfer.

## Enquiry flow (P1)

Investor property detail -> POST `/enquiries` propertyId/message -> server derives brokerId -> broker own thread list -> POST `/enquiries/:id/reply` -> investor response. Only initiator/property broker can see/reply; no client-provided author. No-broker/unpublished asset returns ENQUIRY_UNAVAILABLE.

## Shared profile, notifications and errors

GET `/auth/me` -> profile; PATCH `/auth/me` updates name/phone; POST `/auth/change-password` checks current password and invalidates sessions. Notifications list/read are recipient-only when enabled. Logout clears session/private caches after server invalidation.

404 is not-visible/missing, 403 is wrong role, 401 is missing/inactive/expired session. Every error uses the central envelope. Disabled P1 routes/UI are honest, never success-shaped fake features.
