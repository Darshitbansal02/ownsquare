# Test Strategy and Acceptance Evidence

Owner: Chetan for integration/e2e; each developer owns unit/component tests for their module. This is a plan: no test runner, test code or execution results exist yet. Documentation delivery does not claim application verification.

## Scope and layers

| Layer | Planned tools / purpose |
|---|---|
| Unit | Vitest or agreed existing runner; pure integer money/remainder/eligibility helpers |
| Server integration | Supertest plus a dedicated MongoDB replica set (Atlas test DB or MongoMemoryReplSet); real sessions/indexes, no standalone DB |
| UI component | Vitest + React Testing Library; form states/guards/formatting |
| E2E | Playwright; real application API/auth/persistence, multi-role browser contexts |
| Manual/API | Postman export; direct negative RBAC calls and 3-5 minute demo evidence |

Tooling is proposed, not added by this documentation task. Confirm D1 and add manifests before installing dependencies. No auth/database/payment-success stubs in end-to-end proof; the explicitly allowed signed mock gateway is the sole mock money provider.

Planned script interface after scaffolding: `npm run test:unit --workspace server`, `npm run test:integration --workspace server`, `npm run test:ui --workspace client`, `npm run test:e2e`, `npm run lint`, `npm run build --workspace client`. Run smallest relevant selectors first; shared finance/auth changes expand to the relevant integration suite. Chetan must replace these plans with actually verified scripts.

## Fixtures and isolation

- Dedicated replica-set test database, cleared only within explicitly owned fixture scope; no production destructive resets.
- >=8 source seed properties: 2 partly funded LIVE, 1 FUNDED, 1 HOLDING, 1 SOLD, 1 PENDING_APPROVAL, 1 REJECTED, 1 DRAFT.
- >=5 investors with coherent KYC/wallet/investments and two brokers for ownership isolation; seeded admin/settings.
- No real IDs/bank accounts or secrets. Strong test passwords supplied through seed environment.
- Unique indexes built before tests; flags tested enabled and disabled; deterministic dates and idempotency keys.
- Seed source example INR 1 crore, 1,000 units, INR 10,000/unit; a separate loss and rounding fixture.
- Verify historical sold fixture has payout/EXITED rows and matching ledger, FUNDED has commission, pending/draft have no fake investors.

## Test matrix

| Area | Cases and exact assertions |
|---|---|
| Authentication | Valid investor/broker signup 201; ADMIN signup 400; weak password 400; normalized duplicate email 409; bcrypt not plaintext; valid login correct role/DTO; wrong password generic 401; logout invalidates issued access tokens; profile cannot edit role/balance; reset token expiry/one-use/replay invalidation; no hashes/tokens in logs/DTO |
| RBAC | Investor approval/sale/admin list/settings 403; broker investing/wallet 403; admin investing 403; missing/expired token 401; role middleware uses persisted role/sessionVersion |
| Deactivated user | Issue valid JWT, deactivate via admin, then GET wallet/POST investment -> 401 UNAUTHORIZED, no writes |
| Property drafts | Save each partial wizard step including empty draft; submit incomplete -> 400 with field details; supplied invalid division rejected; >=3 images required; unitPrice server-computed; client status/unitsSold/approvedBy rejected |
| Property lifecycle | Every allowed transition tested; rejection requires reason/resubmit clears it; LIVE alone cancellation; FUNDED alone acquisition; HOLDING alone sale; invalid transitions -> 409; status updates cannot bypass sale |
| Property immutability | Broker edit after LIVE -> 403; financial changes after any investment -> 403; admin description/images allowed pre-terminal; edit vs first-investment race cannot change price underneath purchase |
| Broker ownership | Foreign draft/details/analytics/investors/edit/submit -> 404; broker list and enquiry lists contain only own assets; unapproved create/submit/upload -> 403 BROKER_NOT_APPROVED |
| Marketplace | Only LIVE/FUNDED; each city/type/price/status/funding filter, literal search and allowlisted sort work; stable pagination; no public unpublished detail; once-published historical detail works |
| Investments | Integer/min units/server amount, ownership %; availability and cap use aggregate repeat purchases; KYC enabled/disabled; shortfall -> 409 with paise details; non-LIVE fails; created row/debit/inventory consistent |
| Funding | Exactly full -> FUNDED/fundedAt and one broker commission; admin-created asset no commission; no commission on partial funding; no new investment afterwards |
| Wallet top-up | Order gives no credit; trusted signature/amount/owner/currency/captured state; mock proof tamper/expiry rejected; other investor's proof rejected; duplicate order/payment 409; provider failure explicit |
| Wallet spending | Concurrent purchases on different assets cannot overspend; reservations protect available funds; credits/debits use one helper/session |
| Ledger | Append-only no update/delete API; positive amount/direction; references/indexes valid; each balanceAfter reconciles in walletVersion order; sum ledger equals cache; no raw balance PATCH |
| Payout | Source INR 1.4 crore example exact 2% fee/37.2% Aman ROI; aggregated repeated investments; remainder/tie rule; zero shares; zero fee; loss sale; safe-integer limits; row allocations sum to investor payout |
| Duplicate payout | Execute twice and concurrently; first success, second 409 ALREADY_SOLD; one payout, one set of credits, one fee, no additional balances |
| Cancellation | Full refunds on LIVE, REFUNDED history, unitsSold 0; race with investment serialized; repeated cancel no new refunds |
| Portfolio | Empty totals/arrays/null ROI; active estimates vs realized EXITED vs REFUNDED; totalPayouts excludes refunds; active allocation only; no duplicate-value counting |
| KYC | Dummy docs/selfie required; private media; NOT_SUBMITTED/REJECTED -> PENDING; only ADMIN can review PENDING; rejection reason shown; nonapproved investor blocked when enabled |
| Withdrawals | Request <= available balance reserves but does not debit; simultaneous requests/spends cannot overreserve; admin approval one debit; reject releases; second review 409; own request history isolated |
| Admin | Status/broker/city property filters; stats definitions and UTC month; user filters/approval/activation; last active admin and incompatible role change guarded; settings rates precise; stale preview -> 409 PREVIEW_STALE |
| Enquiries | Property broker derived server-side; only initiator and property broker can read/reply; impersonated from/brokerId rejected; no-broker/unpublished property unavailable |
| Notifications | Own recipient-only read/list; repeated mark-read 200; approval/funding/payout event records consistent; disabled feature explicit |
| API validation | Unknown keys, null/type errors, ObjectId, unsafe/negative/fractional money, malformed UUID, percent precision/ranges, page/limit/date/sort, operator injection, literal regex metacharacters |
| Upload/security | Allowed actual jpg/png/webp/pdf <=5 MB; oversized 413, unsupported/mismatched content 415; private KYC unauthorized access blocked; restrictive CORS/helmet/rate limiting |
| Error handling | Every success/error envelope exact, details array present; correct statuses; no raw stack/provider secrets; unavailable DB/provider fails visibly, never fake success |
| UI | All required routes; auth role redirects; validation; skeleton/empty/error/success; Indian currency; negative ROI; unit input/slider, wallet shortfall, terms and confirm; pending disabled; server errors visible |
| Responsive/accessibility | 360/768/1440px, no page overflow; focus/labels/keyboard/modals, noncolor chips, contrast >=4.5:1; charts accessible text; reduced motion |
| Deployment | Clean locked install/build/start/seed, SPA deep links, HTTPS/CORS, `/health`, no secrets bundled, P1 capabilities synchronized |

## Mandatory final-unit concurrency proof

1. Prepare one LIVE fixture with exactly 10 units left; minUnits <=10. Two distinct active investors have sufficient available wallets, approved KYC if enabled, and cap headroom. Do not test an accidental cap/KYC failure instead of inventory.
2. Read starting property, wallets, ledger and investment counts.
3. Launch POST `/api/v1/investments` for 10 units from both investors concurrently, separate UUID Idempotency-Key headers, using a synchronization barrier. Real transaction sessions and indexes enabled.
4. Assert exact response multiset: one HTTP 201 and one HTTP 409 with code INSUFFICIENT_UNITS and numeric `remainingUnits: 0` in error.details.
5. Assert unitsSold == totalUnits and never exceeds it; status FUNDED; exactly one new investment/debit, only winner wallet changes; loser unchanged.
6. Assert broker commission exactly once and all changes committed together.
7. Repeat deterministic race several times with isolated fixtures; do not infer correctness from sequential requests.
8. Record the same behavior with two authenticated browser contexts/windows for the demo. API logs/test result supply exact HTTP/error proof.

An ordinary request to a previously FUNDED fixture separately tests ALREADY_FUNDED. The racing loser must not accidentally get that code instead of remaining-unit information.

## Further concurrency and failure injection

- One investor, two properties, total requested amount > available balance: at most affordable purchases commit, no negative balance.
- Two purchases by same investor/property crossing cumulative cap: no over-cap aggregate.
- Same Idempotency-Key concurrent submissions: one creation and one replay 200, or safely resolved retry; one investment/debit. Different payload with key -> IDEMPOTENCY_CONFLICT.
- Same gateway order/payment verified concurrently: one credit, other 409 DUPLICATE_PAYMENT.
- Sale/sale, withdrawal/withdrawal approval, cancel/invest and edit/invest races: state/uniqueness guards prevent partial/duplicate outcomes.
- Inject failures after inventory claim, ledger insert, investment creation, commission post, payout item credit and withdrawal debit. Assert complete rollback and retry correctness.
- Stop/unavailable database/provider errors are explicit; bounded retries do not invent successful writes.

## Measurable arithmetic tests

| Fixture | Expected |
|---|---|
| Source sale 1,400,000,000 paise, fee 2% | Fee 28,000,000; distributable 1,372,000,000 |
| Aman 20/1,000 units, invested 20,000,000 | Payout 27,440,000; ROI 37.2 |
| Priya 50/1,000; Karan 400/1,000 | 68,600,000 and 548,800,000 |
| 3 units, holders 1 and 2, sale 101 paise, fee 0 | Floor 33 and 67, remainder 1 goes to 2-unit holder -> 33 and 68 |
| Equal holders: 1/2 each, 101 paise, fee 0 | 50/50 floors, 1 paise to ascending investorId holder |
| Zero fee / zero individual share | Skip zero-amount ledger rows, still preserve exact payout items/sum |
| Price/unit not whole rupee | Reject valuation/totalUnits even if paise division is integer |
| Beyond safe integer / large multiplication | Reject unsafe persisted output; exact intermediates prevent overflow/precision loss |
| Sale below valuation | Negative ROI, accepted payout, minus sign/danger styling |

No invented coverage percentage is a source requirement. Every stated financial invariant and mandatory scenario needs direct evidence, not a proxy "test passed" claim.

## Release evidence

Record test command/environment/commit, result, failing cases, screenshots where useful, Postman export and concurrency artifact. P0 acceptance must pass before claiming a complete release; P1/P2 only appear as implemented if integrated/tested. README live URLs/accounts/video are filled from actual verified work, not this template.
