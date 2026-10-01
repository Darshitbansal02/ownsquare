# Financial and Lifecycle Rules

The [source specification](docs/PS1_Fractional_Real_Estate_Investment_Portal.md) is authoritative. Shared terminology is in [CONTRACTS.md](CONTRACTS.md). All financial decisions are made on the SERVER, not in React, request bodies, or browser storage.

## Money and formulas

Persist and transport integer paise: INR 1 = 100 paise; INR 1 crore = 1,000,000,000 paise. Percentages are rates, not monetary balances.

```text
unitPrice = valuation / totalUnits
amount = units * unitPrice
ownershipPct = units / totalUnits * 100
fundingPct = unitsSold / totalUnits * 100
projectedValue = amount * (1 + appreciationPct/100)^years
platformFee = salePrice * platformFeePct / 100
distributable = salePrice - platformFee
payout = floor(distributable * investorUnits / totalUnits)
remainder = distributable - sum(payouts)
ROI% = (payout - invested) / invested * 100
```

Storage implementation of fee formula: `platformFee = floor(salePrice * feeBasisPoints / 10000)`, using exact integer intermediates. Broker commission uses the same floor rule. Two-decimal rates become integer basis points without binary-float multiplication of monetary values. Reject unsafe totals before writing. This rounding policy is proposed decision D5.

Both `valuation % totalUnits === 0` and `unitPrice % 100 === 0` must hold: the source requires exact paise division and a whole-rupee unit price. `valuation > 0`, `totalUnits > 0`, `1 <= minUnits <= totalUnits`. No arbitrary universal INR 2 lakh minimum: the source's headline is illustrative; each property defines `minUnits`.

Projected value is an estimate only; calculator arithmetic may use decimal display math, rounded to paise for display. Never persist it as a cash transaction or promise guaranteed returns.

## Property state machine (P0)

| From | To | Actor and conditions |
|---|---|---|
| DRAFT | PENDING_APPROVAL | Owning approved broker or admin; complete fields, at least 3 images |
| REJECTED | PENDING_APPROVAL | Owning approved broker after corrections; admin may submit its own listing |
| PENDING_APPROVAL | LIVE | Admin; record approvedBy and liveAt |
| PENDING_APPROVAL | REJECTED | Admin; nonempty reason visible to broker |
| LIVE | FUNDED | Investment service only; unitsSold becomes totalUnits in the same transaction |
| FUNDED | HOLDING | Admin confirms acquisition |
| HOLDING | SOLD | Admin records positive salePrice and transactionally executes payout once |
| LIVE | CANCELLED | Admin refunds every ACTIVE investment atomically |

Every other transition fails `409 INVALID_PROPERTY_STATUS`. No direct create-LIVE, manual FUNDED, HOLDING before full funding, or repeated sale. Rejection is not cancellation. SOLD and CANCELLED are terminal.

Drafts may be incomplete and saved at any wizard step. Any supplied financial fields must be valid; partial drafts have nullable financial fields and cannot submit until complete. A draft/rejected property is editable by its broker or admin. PENDING_APPROVAL is locked during review. After LIVE, only admin may update description/images; valuation, totalUnits and unitPrice are immutable once any investment exists, including refunded/exited investments. Use an atomic status/version guard so editing cannot race with the first purchase.

## Investment eligibility and atomicity (P0; cap and KYC P1)

1. Authenticate an active INVESTOR on the server.
2. When KYC feature is enabled, require `kyc.status === APPROVED`; otherwise explicitly document that the P0 release has no KYC gate.
3. Require LIVE, safe positive integer units, `units >= minUnits`, enough remaining units and server-derived amount.
4. Ownership accumulates over every ACTIVE investment for this investor/property. If enabled, cap is the lower of property `maxUnitsPerInvestor` and `floor(totalUnits * maxOwnershipPct / 100)`. Null property cap means only the platform cap. Without P1 cap, availability is the limit.
5. Require available wallet balance >= amount, accounting for pending withdrawal reservations.
6. Run a MongoDB session transaction. Atomically claim units with a condition equivalent to `status: LIVE, unitsSold <= totalUnits - requestedUnits`, then `$inc` unitsSold. Enforce cumulative ownership under the same serialized transaction.
7. Debit via the sole ledger helper, create investment, and, when fully funded, set status FUNDED and fundedAt, credit broker commission exactly once, and create enabled notification records.
8. Commit everything or nothing; use bounded transaction retry for transient conflicts only. Never catch an error and return a success-shaped fallback.

For two buyers competing for the final available block, exactly one succeeds; after bounded conflict retry the loser returns `409 INSUFFICIENT_UNITS` with `details[{field: "remainingUnits", value: N}]`, even if the winner just changed the property to FUNDED. An ordinary first request against an already-funded property returns `409 ALREADY_FUNDED`. No oversold units, orphan debit, partial investment or duplicated commission.

### Double-click and request idempotency

Require `Idempotency-Key` on POST `/investments`: a caller-generated UUID retained during retries of the same confirmation. Persist key, propertyId and units with a unique `(investorId, idempotencyKey)` index. Same key and same request returns the original result with HTTP 200, without writing again; a different payload with the same key returns `409 IDEMPOTENCY_CONFLICT`. Authentication/isActive is checked before replay. A new key is a genuinely new purchase and repeats eligibility checks. Disabling the button alone is not sufficient.

## Ledger and wallet (P0)

One planned `ledger.service.js` posts all TOPUP, INVESTMENT, PAYOUT, REFUND, COMMISSION, WITHDRAWAL and FEE entries. Other modules call it; they must not directly mutate balances or create competing wallet helpers.

- Ledger is append-only: positive amount, CREDIT/DEBIT direction, immutable reference and balanceAfter. No update/delete routes or reversal by editing old rows; corrections need a reviewed compensating transaction.
- Canonical balance is sum(CREDIT) - sum(DEBIT). A user walletBalance cache is allowed only if updated with ledger insertion in the same transaction and reconciled against the ledger.
- All wallet-affecting actions serialize by updating the same user walletVersion within their session. This includes reservation creation/release, payouts and top-ups. Ledger aggregation alone does not prevent concurrent double spending.
- Available balance = balance - sum(PENDING withdrawal amounts); reservedBalance is that sum. No debit may spend reserved funds. Never allow a negative available balance.
- Owner/admin reads are filtered by userId. Admin accounting entries do not authorize investor wallet endpoints.
- Reconcile each `balanceAfter` in commit order (walletVersion), every user cache, and all investment/payout/refund references.

## Top-ups (P0)

Use test mode only. The server creates an order for a positive paise amount and binds it to the investor. Razorpay verification checks an HMAC signature with the secret on the server, the trusted order's owner/amount/currency and captured payment state; never trusts client amount.

For the recommended mock, order creation returns a server-signed expiring token containing userId, gatewayOrderId, gatewayPaymentId, amount and INR currency. Verification checks signature, expiry, current investor and identifiers, then credits its bound amount. Mock UI must explicitly say "Mock payment - no real money".

Unique gatewayPaymentId AND gatewayOrderId on TOPUP entries prevent reused payment and multiple credits for the same order. Duplicate verification returns `409 DUPLICATE_PAYMENT`. Signature/order failure is `400 PAYMENT_VERIFICATION_FAILED`. Provider failures return explicit errors, never fallback mock success. Live-mode keys are not permitted.

## Broker commission (P0)

Only an approved broker may create/submit listings. At full funding, commission is `floor(valuation * brokerCommissionBasisPoints / 10000)`; post CREDIT COMMISSION for the broker, referenced to that property, in the funding transaction. Unique commission reference prevents double posting. Admin-originated listings have no broker commission.

Source does not specify the expense's funding. Proposed D5: separately budgeted platform expense, not a withdrawal from investor principal and not silently deducted again at sale. Commission is a broker ledger earning, not permission to use investor top-up/withdrawal endpoints.

## Cancellation and refunds (P0)

Only LIVE can be cancelled. In one transaction, guard status, credit each ACTIVE investment's entire original amount through REFUND, mark it REFUNDED, set unitsSold to 0 and status CANCELLED, and preserve historical investment rows. Block simultaneous purchases with the same property write guard. Commission has not been paid on a LIVE asset. A second cancel is a state conflict; never refund twice.

## Sale, preview and payout (P0)

Preview is read-only and permitted only for fully owned HOLDING properties. Aggregate ACTIVE investments by investor before computing shares; require the aggregate unit sum equals totalUnits. Capture the current approved platformFeePct in execution; preview is not a committed quote.

1. Validate safe positive integer salePrice. A loss is allowed.
2. Calculate platformFee and distributable with integer arithmetic.
3. Floor each investor share; sum and calculate remainder.
4. Give the entire remainder to the largest aggregate holder. Ties use ascending investorId. Zero-value shares remain in payout items; do not post zero-amount ledger rows.
5. Assert sum(items.amount) == distributable and platformFee + distributable == salePrice. Preview remainderInvestorId is null when remainder is zero.
6. Execute in a single session: conditional HOLDING guard, unique payout propertyId, investor PAYOUT credits, platform FEE accounting credit when fee >0, investment EXITED updates with per-investment payoutAmount, property SOLD/salePrice/soldAt, enabled notifications.
7. When an investor has several investment rows, allocate their aggregated payout back proportionally by row units, floor, and assign that investor's sub-remainder to their largest row (tie ascending investment `_id`). Sum row payoutAmount must equal their payout item.

Second execution always returns `409 ALREADY_SOLD`; no duplicate ledger credit. A changed fee or sale price requires a refreshed preview and explicit confirmation. FEE belongs to the configured platform ADMIN accounting user, not an investor; no extra platform fee collection.

## Portfolio

Per property aggregate units and invested amounts; `ownershipPct = aggregateUnits / totalUnits * 100`. ACTIVE current value is estimated with appreciation since liveAt (elapsed years, 365.25 days/year); it is not cash. EXITED current value is realized payoutAmount. REFUNDED value equals returned principal and ROI is 0. Aggregate ROI uses the sum of these values minus original invested, divided by original invested, including historical holdings; zero investment gives `null`.

`totalInvested` includes historical investments; `totalPayouts` includes PAYOUT only, not refunds/commission/top-ups. Allocation chart covers ACTIVE original invested amounts only. Portfolio labels must distinguish estimates, realized sales, and refunds; never double-count a payout as both current active value and cash.

## P1 rules

| Feature | Rules |
|---|---|
| KYC | Dummy documents/selfie only; NOT_SUBMITTED/REJECTED -> PENDING on submission, admin -> APPROVED/REJECTED with reason for rejection; private media, no client approval |
| Withdrawals | Positive amount <= availableBalance; reserve on request; approve debits ledger and releases reservation atomically, reject releases it with reason; conditional PENDING guard; second processing is 409 |
| Settings | Rates 0-100, up to 2 decimals; maxOwnershipPct > 0 and <= 100; no retroactive fee/commission changes to committed transactions; existing holdings are not forcibly reduced |
| Enquiries | Investor opens against a published property with a broker; only that investor and property broker participate; broker ownership enforced on list and replies |
| Users | Deactivated users fail 401 even with valid JWT; admin cannot deactivate/demote the last active admin; incompatible role changes fail CONFLICT (proposed D9) |
| Notifications | Persist in the business transaction when enabled; email side effects occur after commit, never roll back completed money because email failed |

## Example from the source

| Item | Rupees | API/storage paise |
|---|---:|---:|
| Valuation; 1,000 units | 1,00,00,000 | 1,000,000,000 |
| Unit price | 10,000 | 1,000,000 |
| Aman: 20 units, 2% | 2,00,000 | 20,000,000 |
| Sale price | 1,40,00,000 | 1,400,000,000 |
| Platform fee, 2% | 2,80,000 | 28,000,000 |
| Distributable | 1,37,20,000 | 1,372,000,000 |
| Aman payout | 2,74,400 | 27,440,000 |
| Aman ROI | 37.2% | Not a cash amount |

Priya's 50 units receive 68,600,000 paise; Karan's 400 units receive 548,800,000 paise. All holders together must receive exactly 1,372,000,000 paise.
