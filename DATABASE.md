# MongoDB Schema Contract

MongoDB Atlas replica set is required for multi-document transactions. These are planned definitions, not existing models. Owner: Dhruv. No second schema, wallet collection or alternate holdings model may be introduced without the contract-change process.

Common conventions: `_id: ObjectId` required/generated; `createdAt, updatedAt: Date` required/server-managed for mutable collections. Ledger has createdAt only. Money is safe-integer paise, never floating-point storage. References are ObjectIds, JSON strings. Enums come from [CONTRACTS.md](CONTRACTS.md). `R` = required; `O` = optional; `S` = server-managed. Optional fields default to null unless specified.

## users / User

| Field | Type / presence | Default / constraints |
|---|---|---|
| name | String R | Trimmed, 2-100 chars |
| email | String R | Trimmed lowercase, valid email, <=254 chars, unique |
| phone | String R | String, 10-15 digits with optional leading `+`; not a number |
| passwordHash | String R S | bcrypt cost 10-12; select:false; never JSON |
| role | ROLES R | Registration permits INVESTOR/BROKER only; seeded ADMIN |
| isActive | Boolean R | true |
| brokerApproved | Boolean R S | false; only meaningful for BROKER |
| kyc.status | KYC_STATUS R S | NOT_SUBMITTED |
| kyc.docs | MediaDTO[] R | [] (dummy ID uploads) |
| kyc.selfie | MediaDTO O | null; dummy image |
| kyc.reason | String O S | null; required on REJECTED |
| kyc.reviewedBy, kyc.reviewedAt | User ObjectId / Date O S | null; reviewer must be ADMIN |
| walletBalance | Number R S | 0; >=0 safe paise; synchronized ledger cache only |
| walletVersion | Number R S | 0; safe integer monotonic serialization/snapshot sequence |
| sessionVersion | Number R S | 0; token claim match required; logout/password change increments |
| resetTokenHash, resetTokenExpiresAt | String / Date O S | null; P1 hash only, not raw reset token |
| createdAt, updatedAt | Date R S | timestamps |

Indexes: unique `{email:1}`; `{role:1,isActive:1}`; `{"kyc.status":1,createdAt:1}`; sparse resetTokenHash lookup. Expired reset tokens are rejected by service; do NOT use a TTL index that would delete the user document. Admin list/search never selects passwordHash/resetTokenHash.

## properties / Property

| Field | Type / presence | Default / constraints |
|---|---|---|
| title | String O in draft, R on submit | 3-150 chars |
| description | String O in draft, R on submit | 20-10000 chars |
| type | PROPERTY_TYPES O in draft, R on submit | No freeform aliases |
| address, city, state | String O in draft, R on submit | Trimmed; max 300/100/100 chars |
| pincode | String O in draft, R on submit | Six digits |
| geo | `{lat:Number,lng:Number}` O | Latitude -90..90, longitude -180..180 |
| areaSqft | Number O in draft, R on submit | Positive finite number |
| images, documents | MediaDTO[] R | []; >=3 images on submit; documents list may be empty |
| valuation | Number O in draft, R on submit | Positive safe-integer paise |
| totalUnits | Number O in draft, R on submit | Positive safe integer |
| unitPrice | Number O S, R on submit | valuation / totalUnits; safe integer, multiple of 100 |
| minUnits | Number O in draft, R on submit | Default 1 when financial step saved; 1..totalUnits |
| maxUnitsPerInvestor | Number O | P1; positive integer <= totalUnits; null means platform cap |
| unitsSold | Number R S | 0; integer 0..totalUnits when financials complete |
| expectedAppreciationPct | Number O in draft, R on submit | Finite 0-100 percentage (projection input) |
| rentalYieldPct | Number O in draft, R on submit | Finite 0-100 percentage; no rent distribution in P0 |
| holdingPeriodMonths | Number O in draft, R on submit | Positive integer |
| status | PROPERTY_STATUS R S | DRAFT |
| rejectionReason | String O S | Required for REJECTED |
| brokerId | User ObjectId O S | Required for broker-created property; null for admin-created |
| createdBy | User ObjectId R S | Authenticated creator; broker/admin |
| approvedBy | User ObjectId O S | ADMIN reviewer |
| salePrice | Number O S | Positive safe paise on SOLD |
| liveAt, fundedAt, soldAt | Date O S | Set by respective transitions |
| version | Number R S | 0; increment with guarded lifecycle/edit writes |
| createdAt, updatedAt | Date R S | timestamps |

Indexes: `{status:1,createdAt:-1,_id:-1}`, `{brokerId:1,status:1}`, `{city:1,type:1,status:1}`, `{unitPrice:1}`. Search initially uses escaped bounded literal matching on title/city/address; a MongoDB text/search index is an optional performance decision, not a different query contract.

Required-on-submit rules are enforced by submit service and validator, not by making draft saves impossible. Submitted/live financials are complete, valuation == totalUnits * unitPrice, unitsSold cannot exceed totalUnits. Client cannot set status, unitsSold, unitPrice, ownership, review fields or sale fields.

## investments / Investment

| Field | Type / presence | Default / constraints |
|---|---|---|
| investorId | User ObjectId R S | INVESTOR |
| propertyId | Property ObjectId R S | Property reference |
| units | Number R S | Positive safe integer |
| amount | Number R S | Positive safe paise; server units * unitPrice snapshot |
| status | INVESTMENT_STATUS R S | ACTIVE |
| payoutAmount | Number R S | 0; nonnegative safe paise; filled on sale |
| idempotencyKey | String R | Valid UUID from Idempotency-Key |
| requestFingerprint | `{propertyId:ObjectId,units:Number}` R S | Canonical payload for replay comparisons |
| responseSnapshot | Object R S | Immutable original success data: `{investment:InvestmentDTO,property:{_id,unitsSold,fundingPct,status},walletBalance}`; server-created and schema-validated |
| createdAt, updatedAt | Date R S | timestamps |

Indexes: `{investorId:1,propertyId:1,status:1}`, `{propertyId:1,status:1}`, unique `{investorId:1,idempotencyKey:1}`. Multiple rows per investor/property are intentional; aggregate for holdings and payouts. Historical rows survive sale/cancellation. Do not delete rows to reset funding. Replay reads responseSnapshot, not the later-mutated investment status/payoutAmount/updatedAt, so sale or refund cannot change the original confirmation.

## transactions / Transaction (append-only ledger)

| Field | Type / presence | Default / constraints |
|---|---|---|
| userId | User ObjectId R S | Wallet/accounting owner |
| type | TRANSACTION_TYPES R S | No aliases |
| direction | TRANSACTION_DIRECTIONS R S | Positive amount plus direction |
| amount | Number R S | >0 safe paise |
| balanceAfter | Number R S | >=0 safe paise |
| walletVersion | Number R S | Post-write user sequence |
| refType | String enum R S | `TopupOrder`, `Investment`, `Property`, `Payout`, `Withdrawal` |
| refId | String R S | ObjectId string for domain entities; provider/mock order ID for TopupOrder |
| gatewayOrderId | String O S | TOPUP only |
| gatewayPaymentId | String O S | TOPUP only |
| createdAt | Date R S | Immutable |

Indexes: `{userId:1,createdAt:-1,_id:-1}`; unique `{userId:1,walletVersion:1}`; partial unique `{gatewayPaymentId:1}` and `{gatewayOrderId:1}` where field is a string; unique `{userId:1,type:1,refType:1,refId:1}` for one posting of a type per cause/account.

Reference mapping: TOPUP -> TopupOrder; INVESTMENT/REFUND -> Investment; COMMISSION -> Property; PAYOUT/FEE -> Payout; WITHDRAWAL -> Withdrawal. Null gateway values must not collide: use partial indexes, not an ordinary nullable unique index. Zero payout shares create no zero-value ledger entry.

No updatedAt, mutation APIs or delete hooks. Only Dhruv's ledger service inserts within the caller's session and updates user cache/version. Commission and FEE are internal accounting credits, not investor principal.

## payouts / Payout

| Field | Type / presence | Default / constraints |
|---|---|---|
| propertyId | Property ObjectId R S | One payout per property |
| salePrice | Number R S | Positive safe paise |
| platformFeePct | Number R S | Rate snapshot, 0-100, <=2 decimals |
| platformFee, distributable | Number R S | Nonnegative safe paise |
| items | `{investorId:ObjectId,units:Number,amount:Number}[]` R S | One aggregate row per investor; amount >=0; units >0 |
| executedBy | User ObjectId R S | ADMIN |
| executedAt | Date R S | Execution timestamp |
| createdAt, updatedAt | Date R S | Immutable after insertion despite common timestamps |

Indexes: unique `{propertyId:1}`; `{executedAt:-1}`. Validate item units sum == property.totalUnits and item amount sum == distributable; distributable + platformFee == salePrice. No partial success or draft payout document that blocks retry after rollback.

## withdrawals / Withdrawal (P1)

| Field | Type / presence | Default / constraints |
|---|---|---|
| userId | User ObjectId R S | INVESTOR |
| amount | Number R | Positive safe paise |
| status | WITHDRAWAL_STATUS R S | PENDING |
| bankDetails | `{accountHolder:String,accountNumber:String,ifsc:String}` R | Dummy only; string account number; mask in normal UI/logs |
| reason | String O S | Required on REJECTED |
| processedBy | User ObjectId O S | ADMIN |
| processedAt | Date O S | Review time |
| createdAt, updatedAt | Date R S | timestamps |

Indexes: `{status:1,createdAt:1}`, `{userId:1,status:1}`. Creation and processing serialize on the user's walletVersion. Pending reservations are computed from this collection; no debit until approval. Real bank transfer is out of scope; approved means simulated academic processing.

## enquiries / Enquiry (P1)

| Field | Type / presence | Default / constraints |
|---|---|---|
| propertyId | Property ObjectId R S | Published broker-managed property |
| investorId | User ObjectId R S | Initiator |
| brokerId | User ObjectId R S | Derived from property, not client |
| messages | `{from:ObjectId,text:String,at:Date}[]` R | >=1; text 1-2000 chars; timestamp/server author |
| status | ENQUIRY_STATUS R S | OPEN |
| createdAt, updatedAt | Date R S | timestamps |

Indexes: `{investorId:1,updatedAt:-1}`, `{brokerId:1,propertyId:1,updatedAt:-1}`. Only participant investor/broker accesses thread. Admin is not implicitly granted this endpoint.

## notifications / Notification (P1)

| Field | Type / presence | Default / constraints |
|---|---|---|
| userId | User ObjectId R S | Recipient |
| type | NOTIFICATION_TYPES R S | Canonical event |
| title, body | String R S | Max 150/2000 chars; no secrets |
| link | String O S | Internal allowlisted frontend path, not arbitrary external URL |
| read | Boolean R | false |
| createdAt, updatedAt | Date R S | timestamps |

Indexes: `{userId:1,read:1,createdAt:-1}`. Mark-read is idempotent and owner-filtered. Domain notifications are committed with business data; delivery must not create a second financial action.

## settings / Settings (singleton)

| Field | Type / presence | Default / constraints |
|---|---|---|
| singletonKey | String R S | `platform`; unique |
| platformFeePct | Number R | 2; 0-100; <=2 decimal places |
| brokerCommissionPct | Number R | 1; 0-100; <=2 decimal places |
| maxOwnershipPct | Number R | 49; >0..100; <=2 decimal places, P1 gate |
| feeAccountUserId | User ObjectId R S | Seeded ADMIN internal fee account; not editable via general settings API |
| createdAt, updatedAt | Date R S | timestamps |

Index: unique `{singletonKey:1}`. Seed creates it once; missing settings is an explicit configuration error, not a silent service-specific default. Environment rates provide initial seed values only; changing environment does not overwrite persisted approved settings.

## Relationships

```text
User(BROKER) 1 ----< Property.brokerId
User(ADMIN/BROKER) 1 ----< Property.createdBy
User(INVESTOR) 1 ----< Investment >---- 1 Property
User 1 ----< Transaction (refType/refId -> cause)
Property 1 ---- 0..1 Payout ----< items >---- User(INVESTOR)
User(INVESTOR) 1 ----< Withdrawal
Property 1 ----< Enquiry >---- User(INVESTOR), User(BROKER)
User 1 ----< Notification
Settings(singleton) ---- User(ADMIN fee account)
```

MongoDB references are not foreign keys: services must validate existence, role and authorization. No destructive cascade deletion. Deactivate users instead of removing financial history. Media ownership is validated on upload/domain attachment; private KYC uses authenticated Cloudinary delivery.

## Transaction and integrity checklist

- Deployment must fail visibly if transaction-capable MongoDB is unavailable; never downgrade to nontransactional money writes.
- Build unique indexes before accepting traffic, including payment/payout/idempotency indexes.
- Use the same session for every read/write in an investment, cancellation, sale, wallet post or withdrawal processing operation.
- Atomic property guards handle inventory/status; user walletVersion guards handle spending/reservations.
- Settings rates are captured at funding/sale; posted amounts never recompute from later settings.
- Reconciliation and seed invariants are specified in [TESTING.md](TESTING.md).

P2 refresh-token sessions, audit logs, rental distribution and secondary market need separately reviewed extensions; these nine collections do not claim to implement them.
