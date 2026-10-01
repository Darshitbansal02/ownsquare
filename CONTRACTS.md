# OwnSquare - Integration Contract

Status: documentation-first draft for team sign-off; no application has been implemented.

## Authority and change control

The [problem statement](docs/PS1_Fractional_Real_Estate_Investment_Portal.md) is the primary source of truth. This file fixes shared vocabulary; [API_DESIGN.md](API_DESIGN.md) fixes transport; [DATABASE.md](DATABASE.md) fixes persistence; [BUSINESS_RULES.md](BUSINESS_RULES.md) fixes money and state transitions. Do not silently change any of them. Follow [COLLABORATION.md](COLLABORATION.md).

P0 means mandatory, P1 means should have, P2 means bonus. A screen listed by the source still needs a route and appropriate UI state; a P1/P2 feature must not be advertised as operational until integrated. No fake backend, auth, database, holdings, or payouts.

## Single-source constants

Planned canonical location: `shared/constants.js`, owned by Dhruv and reviewed by affected owners. Server and client import the same definitions. Do not create frontend-specific spellings or duplicate enum lists in application modules.

| Constant | Exact values |
|---|---|
| ROLES | `ADMIN`, `BROKER`, `INVESTOR` |
| PROPERTY_STATUS | `DRAFT`, `PENDING_APPROVAL`, `LIVE`, `FUNDED`, `HOLDING`, `SOLD`, `REJECTED`, `CANCELLED` |
| PROPERTY_TYPES | `APARTMENT`, `VILLA`, `COMMERCIAL`, `PLOT`, `WAREHOUSE` |
| TRANSACTION_TYPES | `TOPUP`, `INVESTMENT`, `PAYOUT`, `REFUND`, `COMMISSION`, `WITHDRAWAL`, `FEE` |
| TRANSACTION_DIRECTIONS | `CREDIT`, `DEBIT` |
| INVESTMENT_STATUS | `ACTIVE`, `EXITED`, `REFUNDED` |
| KYC_STATUS | `NOT_SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED` |
| WITHDRAWAL_STATUS | `PENDING`, `APPROVED`, `REJECTED` |
| ENQUIRY_STATUS | `OPEN`, `CLOSED` |
| NOTIFICATION_TYPES | `PROPERTY_APPROVED`, `PROPERTY_REJECTED`, `FUNDING_COMPLETE`, `PAYOUT_CREDITED`, `KYC_APPROVED`, `KYC_REJECTED`, `WITHDRAWAL_APPROVED`, `WITHDRAWAL_REJECTED`, `ENQUIRY_REPLY` |

Notification and enquiry enums complete source-unspecified implementation details; they are proposed for sign-off, not additional product scope.

## Naming and transport

| Area | Agreement |
|---|---|
| API | `/api/v1`; plural kebab-case resources; exact endpoint list in API design; no alternate `/invest`, `/purchase`, or `/exit` endpoints |
| Models/collections | PascalCase singular model names; lowercase plural collections: `User/users`, `Property/properties`, `Investment/investments`, `Transaction/transactions`, `Payout/payouts`, `Withdrawal/withdrawals`, `Enquiry/enquiries`, `Notification/notifications`, `Settings/settings` |
| Fields/variables | camelCase; `investorId`, `brokerId`, `propertyId`, `unitPrice`, `unitsSold`, `payoutAmount`; never `sharesSold`, `pricePerShare`, or `ownerPercent` aliases |
| Files | Server `investment.service.js`, `auth.controller.js`, `auth.routes.js`, `auth.schema.js`; React components/pages PascalCase `.jsx`; hooks `usePortfolio.js` |
| Identifiers | JSON IDs are 24-character ObjectId strings; primary key `_id`, references `...Id`; no mixed `id`/`_id` for database objects |
| Errors | Upper snake case, centralized in planned `shared/errorCodes.js`; catalog in [docs/ERROR_CODES.md](docs/ERROR_CODES.md) |
| Dates | Persist UTC BSON Date; JSON ISO 8601 UTC, e.g. `2026-10-01T06:30:00.000Z`; localize only for display |
| Units | Positive safe integers for requests; zero permitted for aggregate counts; never fractional units |
| Money | Nonnegative safe-integer paise; positive ledger amounts plus direction; no negative balances, float storage, rupee-valued API amounts, or client-authoritative amounts |
| Percentages | Numeric percentages, e.g. `2` means 2%, not 0.02; settings accept at most two decimal places; server converts fee rates to integer basis points before calculation |
| Auth | Proposed P0 bearer access JWT: `Authorization: Bearer <accessToken>`; never query-string tokens; P2 refresh token only in httpOnly cookie |
| Uploads | Multipart only at `/uploads`; domain endpoints use JSON Cloudinary media objects; dummy KYC only |

Safe integer ceiling is `Number.MAX_SAFE_INTEGER`; multiplication and payout intermediates use exact integer arithmetic, then check safe range before storage/JSON conversion. `BigInt` is never returned directly in JSON.

## Response conventions

Every domain success includes all three keys:

```json
{ "success": true, "data": {}, "message": "Operation completed" }
```

Every error includes `details`, even when empty:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_UNITS",
    "message": "Only 0 units remain",
    "details": [
      { "field": "remainingUnits", "message": "Current availability", "value": 0 }
    ]
  }
}
```

Details are `{ field: string, message: string, value?: string | number | boolean }[]`; never include passwords, tokens, private KYC URLs, stack traces, or gateway secrets.

HTTP: `200` read/update/action/replay, `201` create, `400` validation, `401` unauthenticated/inactive, `403` forbidden, `404` missing/not visible, `409` business conflict, `413` file too large, `415` unsupported media, `429` rate limit, `500` unexpected error, `503` unavailable dependency. No business failure with HTTP 200.

List data always:

```json
{ "items": [], "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
```

`page` starts at 1; `limit` defaults to 20, maximum 100. An empty collection has `totalPages: 0`. Out-of-range positive pages return an empty page with unchanged totals. Reject invalid page/limit/sort rather than silently coercing. `sort=-createdAt` defaults; sort and filter fields are allowlisted per endpoint. Apply a stable `_id` tiebreaker. Date range is `from` inclusive, `to` exclusive, ISO UTC. Search is trimmed literal text, length 1-100 when supplied; escape regex metacharacters.

## Shared DTOs

Use these response names in every module. Full field definitions are in the database contract; private fields never leak through raw Mongoose serialization.

| DTO | Public contract |
|---|---|
| UserDTO | `_id, name, email, phone, role, isActive, brokerApproved, kyc: {status, reason}, createdAt, updatedAt`; current user/admin only |
| MediaDTO | `{url, publicId, name}`; server-approved Cloudinary asset, not an arbitrary submitted URL |
| PropertyDTO | Property schema fields except internal guards; `brokerId` string, `fundingPct`, `investorCount`, `remainingUnits`; financial amounts in paise |
| InvestmentDTO | `_id, investorId, propertyId, units, amount, status, payoutAmount, ownershipPct, createdAt, updatedAt`; excludes idempotency metadata |
| TransactionDTO | `_id, userId, type, direction, amount, balanceAfter, refType, refId, gatewayOrderId?, gatewayPaymentId?, createdAt` |
| WalletDTO | `{balance, reservedBalance, availableBalance}` in paise |
| PayoutDTO | `_id, propertyId, salePrice, platformFeePct, platformFee, distributable, items: [{investorId, units, amount}], executedBy, executedAt` |
| PayoutPreviewDTO | `{propertyId, salePrice, platformFeePct, platformFee, distributable, items: [{investorId, units, amount}], totalPayout, remainder, remainderInvestorId}` |
| HoldingDTO | `{property, units, ownershipPct, invested, estimatedValue, payoutAmount, status, roiPct}`; one row per investor/property |
| PortfolioDTO | `{totalInvested, currentValue, totalPayouts, overallRoiPct, wallet, holdings, allocation: [{propertyId, title, amount}]}` |
| WithdrawalDTO | `_id, userId, amount, status, bankDetails, reason, processedBy, createdAt, updatedAt`; own/admin only |
| SettingsDTO | `{platformFeePct, brokerCommissionPct, maxOwnershipPct}`; account configuration remains internal |
| EnquiryDTO | `_id, propertyId, investorId, brokerId, messages: [{from, text, at}], status, createdAt, updatedAt` |
| NotificationDTO | `_id, userId, type, title, body, link, read, createdAt, updatedAt` |

Missing optional scalar fields serialize as `null`; optional gateway fields may be omitted; lists always serialize as arrays. `roiPct` is `null` where invested denominator is zero, not infinity. Property documents are public property disclosures; KYC documents are private and restricted to their investor/admin.

For incomplete private drafts without totalUnits, `fundingPct`, `remainingUnits` and `investorCount` are 0; unitPrice remains null until valuation/totalUnits are complete. Do not divide by a null/zero denominator.

## Frontend routes

Public: `/`, `/properties`, `/properties/:id`, `/login`, `/signup`, `/forgot-password` (P1), `/reset/:token` (P1).

Investor: `/investor`, `/investor/portfolio`, `/investor/portfolio/:propertyId` (holding detail), `/investor/invest/:id`, `/investor/wallet`, `/investor/kyc` (P1), `/investor/enquiries` (P1).

Broker: `/broker`, `/broker/properties`, `/broker/properties/new`, `/broker/properties/:id/edit`, `/broker/properties/:id`.

Admin: `/admin`, `/admin/properties`, `/admin/properties/:id/sell`, `/admin/users`, `/admin/kyc` (P1), `/admin/withdrawals` (P1), `/admin/settings`.

Shared authenticated: `/profile`, `/notifications` (P1). Error: `/403`, wildcard 404. Role routing is UX, never the security boundary.

## Decisions requiring team approval before implementation

These recommendations complete gaps in the source; do not silently treat them as already approved.

| ID | Recommendation / question | Sign-off |
|---|---|---|
| D1 | React + Vite, JavaScript ES modules, React Router, TanStack Query, Tailwind + shadcn/ui; Express + Mongoose + Zod; shared workspace imports. Next.js remains source-allowed if contracts are revised together. | All five |
| D2 | P0 bearer JWT, 15-minute expiry, in-memory client token with login after reload; persist server session version for logout/password change invalidation. P2 refresh rotation needs a separately approved persistence design. | Devang, Deepti, Chetan |
| D3 | Start with clearly labelled signed mock top-ups; support Razorpay test-mode adapter, no live payments. Stripe is an alternative, not a second simultaneous implementation. | Dhruv, Chetan |
| D4 | Multiple investment documents plus unique per-investor idempotency keys; ledger plus synchronized user balance cache and walletVersion serialization; pending withdrawals reserve available balance. | Dhruv, Darshit, Chetan |
| D5 | Floor percentage fees to paise; assign payout remainder to largest holder, ties by ascending investorId; broker commission is a separately budgeted platform expense on funding, never a hidden investor-principal deduction. Source does not specify commission funding. | Dhruv, Darshit |
| D6 | Settings defaults 2% platform fee, 1% broker commission, 49% ownership cap (P1); new cap blocks further purchases but does not confiscate existing holdings. | Dhruv, Darshit |
| D7 | KYC, withdrawals, enquiries, notifications and password reset are planned P1; P0 release may disable them explicitly, with server gates and truthful UI. Do not omit mandatory P0 screens/actions. | All five |
| D8 | Supporting `/uploads`, profile/password APIs, `/wallet/withdrawals`, `/admin/properties`, `/platform/stats` and `/health` fill required source UI/operations gaps; public property detail hides never-published assets except from owning broker/admin. | Devang, Dhruv, Darshit, Deepti, Chetan |
| D9 | Block role changes while incompatible holdings, pending withdrawals or broker listings exist; credit platform fee to a configured seeded ADMIN accounting user, without granting it investor wallet access. | Darshit, Dhruv, Devang |

Approval is recorded in the contract-change PR and engineering changelog. No application code is part of this documentation delivery.
