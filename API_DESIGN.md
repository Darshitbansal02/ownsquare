# REST API Design

Base URL: `/api/v1`. This is a planned integration contract, not a claim that endpoints currently exist. P0/P1/P2 labels follow the [source](docs/PS1_Fractional_Real_Estate_Investment_Portal.md). Schema fields and DTOs are defined in [DATABASE.md](DATABASE.md) and [CONTRACTS.md](CONTRACTS.md).

## Rules applying to every endpoint

- JSON requests/responses except multipart `/uploads`. Accept only documented fields; reject unknown fields, malformed ObjectIds and invalid types with `400 VALIDATION_ERROR`. Money in integer paise.
- Auth notation: Public = no token needed; Auth = active authenticated user; role names are exact enums. Bearer access JWT; invalid supplied tokens fail 401 even on optional-auth endpoints.
- Authentication checks persisted isActive and sessionVersion on every protected request. `401 UNAUTHORIZED` covers missing/expired/revoked token or inactive account; `403 FORBIDDEN` covers wrong role.
- Scoped records not owned by the caller return `404 NOT_FOUND` to avoid disclosure; collection queries filter by owner before pagination. Do not fetch a global list and filter in React.
- Success: `{success:true,data:<documented shape>,message:string}`. Errors: `{success:false,error:{code,message,details:[{field,message,value?}]}}`.
- Common errors: 400 VALIDATION_ERROR, 401 UNAUTHORIZED, 403 FORBIDDEN, 404 NOT_FOUND, 429 RATE_LIMITED, 500 INTERNAL_ERROR, 503 SERVICE_UNAVAILABLE. Each endpoint below adds its business-specific errors. Public endpoints do not require 401 unless a token is supplied.
- List queries: `page=1`, `limit=20` (max 100), `sort=-createdAt`, optional literal `search` only where listed; return `data:{items,page,limit,total,totalPages}`. Invalid sort/filter values are validation errors. Date filters `from` inclusive / `to` exclusive ISO UTC.
- All status changes use services, not free PATCH fields. Requests never supply computed amount, unitPrice, unitsSold, brokerId, investorId, payoutAmount or approvedBy.
- Safe text limits and full field constraints are in the database contract. API bodies cannot contain MongoDB operators.
- Success status is 200 unless marked 201. No 204: logout/mark-read also return the standard JSON envelope.

## Authentication

### POST /auth/register - P0

- Auth/role: Public; requested role INVESTOR or BROKER only.
- Params: none. Body: `{name,email,phone,password,role}`; all required. Password >=8 chars, at least one number and symbol; bcrypt 10-12. Normalize email.
- 201 data: `{user:UserDTO,accessToken,expiresIn:900}` for recommended 15-minute policy.
- Errors: 409 EMAIL_ALREADY_EXISTS; 400 VALIDATION_ERROR for ADMIN/weak password.
- Rules: no self-approved broker/KYC; isActive true, brokerApproved false; no admin registration.

### POST /auth/login - P0

- Auth/role: Public, any existing role. Body: `{email,password}` required.
- 200 data: `{user:UserDTO,accessToken,expiresIn:900}`.
- Errors: 401 INVALID_CREDENTIALS (generic email/password mismatch), 401 UNAUTHORIZED (inactive); auth rate limit 429.
- Rules: unapproved broker can sign in and see approval state, but cannot create/submit listings; never return hash.

### POST /auth/logout - P0

- Auth/role: Auth, any role. Body: empty object.
- 200 data: `{loggedOut:true}`.
- Rules: increment sessionVersion to invalidate this user's existing access sessions; client clears token/query cache. This is all-device logout under proposed D2. P2 also revokes/clears refresh cookie.

### GET /auth/me - P0

- Auth/role: Auth, any role. Params/body: none.
- 200 data: UserDTO, including current KYC status/reason.
- Rules: persisted user fields, never token-only identity.

### POST /auth/forgot-password - P1

- Auth/role: Public. Body: `{email}`.
- 200 data: `{requested:true}`, same message regardless of account existence.
- Errors: 503 SERVICE_UNAVAILABLE on actual mail dependency failure; common validation/rate limit.
- Rules: cryptographically random short-lived token (recommended 30 minutes), hash persisted, reset URL based on CLIENT_URL; do not return raw token or leak account existence.

### POST /auth/reset-password/:token - P1

- Auth/role: Public. Path: opaque token, validated length/format. Body: `{password}` meeting password policy.
- 200 data: `{reset:true}`.
- Errors: 400 INVALID_RESET_TOKEN if expired/used/invalid.
- Rules: atomically consume token, hash new password, invalidate sessions; concurrent second use fails.

## Properties

### GET /properties - P0

- Auth/role: Public. Query: pagination; `search`, `city`, `type`, `minPrice`, `maxPrice` (unitPrice in paise), `status` (LIVE or FUNDED; default both), `minFundingPct`, `maxFundingPct` (0-100). `sort`: `createdAt`, `unitPrice`, `expectedAppreciationPct`, `unitsSold`, each optional `-`.
- 200 data: paginated PropertyDTO.
- Errors: 400 VALIDATION_ERROR for inverted ranges, disallowed status/sort.
- Rules: no unpublished/rejected drafts in marketplace, regardless of role; admin uses its dedicated list. Funding filters compare unitsSold/totalUnits, not a trusted client value.

### GET /properties/:id - P0

- Auth/role: Public for once-published LIVE/FUNDED/HOLDING/SOLD/CANCELLED (liveAt exists); optional Auth ADMIN or owning BROKER for draft/pending/rejected.
- Path: property ObjectId. 200 data: PropertyDTO including fundingPct, investorCount, remainingUnits and documents.
- Errors: 404 NOT_FOUND for missing/not-visible property.
- Rules: do not expose investor identities, ledger or KYC in public detail. Historical detail remains viewable for portfolio links.

### POST /properties - P0

- Auth/role: ADMIN or approved BROKER.
- Body: any supplied draft fields from `{title,description,type,address,city,state,pincode,geo,areaSqft,images,documents,valuation,totalUnits,minUnits,maxUnitsPerInvestor,expectedAppreciationPct,rentalYieldPct,holdingPeriodMonths}`; empty draft allowed.
- 201 data: PropertyDTO.
- Errors: 403 BROKER_NOT_APPROVED; 400 VALIDATION_ERROR for invalid supplied financial/media fields.
- Rules: force DRAFT, unitsSold 0, createdBy authenticated user, brokerId self for broker/null for admin. If valuation and totalUnits supplied compute unitPrice, require exact whole-rupee division. Media must be server-approved uploads.

### PATCH /properties/:id - P0

- Auth/role: ADMIN or owning approved BROKER. Path: property ObjectId.
- Body: subset of same draft fields; at least one; no lifecycle/computed fields.
- 200 data: updated PropertyDTO.
- Errors: 403 BROKER_NOT_APPROVED; 403 PROPERTY_IMMUTABLE for broker edit of published property or attempted locked financial change; 409 INVALID_PROPERTY_STATUS for edit during pending review/terminal state.
- Rules: DRAFT/REJECTED permit owner edits; ADMIN alone may edit description/images on LIVE/FUNDED/HOLDING; recompute paired financials before first investment. Atomic version guard prevents edit/purchase races.

### POST /properties/:id/submit - P0

- Auth/role: owning approved BROKER; ADMIN for its own draft. Path: property ObjectId. Body: empty.
- 200 data: PropertyDTO.
- Errors: 400 VALIDATION_ERROR for incomplete details/<3 images; 403 BROKER_NOT_APPROVED; 409 INVALID_PROPERTY_STATUS.
- Rules: DRAFT/REJECTED -> PENDING_APPROVAL, validate complete financials/media; clear obsolete rejectionReason.

### POST /properties/:id/approve - P0

- Auth/role: ADMIN. Path: property ObjectId. Body: empty.
- 200 data: PropertyDTO.
- Errors: 409 INVALID_PROPERTY_STATUS; 400 VALIDATION_ERROR for corrupt/incomplete submission.
- Rules: PENDING_APPROVAL -> LIVE; set approvedBy/liveAt; notify broker if P1 enabled.

### POST /properties/:id/reject - P0

- Auth/role: ADMIN. Path: property ObjectId. Body: `{reason}` nonempty 1-2000 chars.
- 200 data: PropertyDTO.
- Errors: 409 INVALID_PROPERTY_STATUS.
- Rules: PENDING_APPROVAL -> REJECTED; persist reason; owning broker can correct/resubmit.

### POST /properties/:id/status - P0

- Auth/role: ADMIN. Path: property ObjectId. Body: `{status:"HOLDING"|"CANCELLED"}`.
- 200 data: `{property:PropertyDTO,refundedAmount:number,refundedInvestments:number}`; zero refund values for HOLDING.
- Errors: 409 INVALID_PROPERTY_STATUS.
- Rules: FUNDED -> HOLDING only; LIVE -> CANCELLED only, refunds and status atomic. Never manually set FUNDED/SOLD via this endpoint.

### GET /properties/:id/payout-preview - P0

- Auth/role: ADMIN. Path: property ObjectId. Query: `salePrice` positive safe-integer paise.
- 200 data: PayoutPreviewDTO.
- Errors: 409 ALREADY_SOLD or INVALID_PROPERTY_STATUS; 409 CONFLICT for inconsistent total holdings.
- Rules: HOLDING only, shared pure payout calculation; no writes, no notification, no fee debit.

### POST /properties/:id/sell - P0

- Auth/role: ADMIN. Path: property ObjectId. Body: `{salePrice,expectedPlatformFeePct}`; salePrice positive safe paise; expected rate from last preview.
- 200 data: `{property:PropertyDTO,payout:PayoutDTO}`.
- Errors: 409 ALREADY_SOLD, INVALID_PROPERTY_STATUS, PREVIEW_STALE (current fee differs), CONFLICT (inconsistent holdings).
- Rules: HOLDING -> SOLD, one transaction and unique payout; loss allowed; price in preview/confirmation must match submitted price. expectedPlatformFeePct is a stale-preview check, not authority to set fee.

### GET /properties/:id/investors - P0

- Auth/role: ADMIN or owning BROKER. Path: property ObjectId. Query: pagination; sort `units`, `createdAt`.
- 200 data: page of `{investorId,displayName,units,amount,ownershipPct}` aggregated by investor; displayName masked initials for broker; no emails/phone/KYC.
- Errors: 404 NOT_FOUND for other broker's asset.
- Rules: investment amounts/ownership are server aggregated; admin access does not make public detail expose this list.

### GET /broker/properties - P0

- Auth/role: BROKER. Query: pagination, `search`, `status` any PROPERTY_STATUS, `city`; sort `createdAt`, `unitsSold`, `title`.
- 200 data: `{items:PropertyDTO[],page,limit,total,totalPages,stats:{propertiesListed,liveProperties,fundedProperties,totalRaised,commissionEarned},fundingSeries:[{propertyId,points:[{date,amount}]}]}`.
- Rules: scoped to caller only; totalRaised is non-refunded principal on their listings; fundedProperties counts FUNDED/HOLDING/SOLD; commissionEarned from COMMISSION ledger. Analytics can combine this series with the authorized investors list.

## Investments and portfolio

### POST /investments - P0 (KYC/cap gates P1)

- Auth/role: INVESTOR. Header: `Idempotency-Key` UUID. Body: `{propertyId,units}`.
- 201 data: `{investment:InvestmentDTO,property:{_id,unitsSold,fundingPct,status},walletBalance:number}`.
- Replay: 200 with identical original data, no new financial writes.
- Errors: 403 KYC_REQUIRED; 409 INSUFFICIENT_UNITS (details includes remainingUnits), INSUFFICIENT_BALANCE (availableBalance, requiredAmount), OWNERSHIP_LIMIT_EXCEEDED, ALREADY_FUNDED, INVALID_PROPERTY_STATUS, IDEMPOTENCY_CONFLICT.
- Rules: all eligibility, authoritative arithmetic, conditional inventory, ledger and funding commission in one session. Concurrent final-block loser gets INSUFFICIENT_UNITS even after winner sets FUNDED.

### GET /investments/me - P0

- Auth/role: INVESTOR. Query: pagination, `propertyId`, `status` INVESTMENT_STATUS; sort `createdAt`, `amount`.
- 200 data: page of `{investment:InvestmentDTO,property:PropertyDTO}`.
- Rules: own records only, includes exited/refunded history.

### GET /portfolio/summary - P0

- Auth/role: INVESTOR. Params/body: none.
- 200 data: PortfolioDTO.
- Rules: server aggregates holdings, estimates, realized payouts and refunds using business rules; no double counting; empty portfolio uses zero totals, empty arrays, overallRoiPct null.

## Wallet and ledger

### GET /wallet - P0

- Auth/role: INVESTOR. Params/body: none. 200 data: WalletDTO.
- Rules: canonical/reconciled ledger balance; pending reservations included in availability, not debited twice.

### POST /wallet/topup/order - P0

- Auth/role: INVESTOR. Body: `{amount}` positive safe-integer paise.
- 201 data: `{gatewayOrderId,amount,currency:"INR",provider:"mock"|"razorpay",checkout:{gatewayPaymentId?,mockOrderToken?,keyId?}}`.
- Errors: 503 SERVICE_UNAVAILABLE if selected gateway fails.
- Rules: bind trusted order to caller and amount; server-minted mock paymentId and signed expiring token, or Razorpay test order; frontend clearly labels provider. No credit on order creation.

### POST /wallet/topup/verify - P0

- Auth/role: INVESTOR.
- Body (mock): `{gatewayOrderId,gatewayPaymentId,mockOrderToken}`.
- Body (Razorpay): `{gatewayOrderId,gatewayPaymentId,gatewaySignature}`.
- 200 data: `{wallet:WalletDTO,transaction:TransactionDTO}`.
- Errors: 400 PAYMENT_VERIFICATION_FAILED; 409 DUPLICATE_PAYMENT; 503 SERVICE_UNAVAILABLE.
- Rules: amount/currency/owner from trusted order/proof, validate signature and payment state; unique order/payment, credit exactly once transactionally. Mixed provider body or client amount rejected.

### POST /wallet/withdraw - P1

- Auth/role: INVESTOR. Body: `{amount,bankDetails:{accountHolder,accountNumber,ifsc}}`; dummy bank values only.
- 201 data: `{withdrawal:WithdrawalDTO,wallet:WalletDTO}`.
- Errors: 409 INSUFFICIENT_BALANCE.
- Rules: reserve in same serialized wallet transaction; no debit yet; no real bank transfer.

### GET /transactions - P0

- Auth/role: Auth any role; own ledger, ADMIN may view all.
- Query: pagination, `type` TRANSACTION_TYPES, `direction` CREDIT/DEBIT, `from`, `to`, `userId` ADMIN only; sort `createdAt`, `amount`.
- 200 data: paginated TransactionDTO.
- Errors: 403 FORBIDDEN for nonadmin userId override.
- Rules: immutable history; no PATCH/DELETE ledger endpoints.

## Admin, KYC and settings

### GET /admin/stats - P0

- Auth/role: ADMIN. Query: optional `from,to` for chart range.
- 200 data: `{aum,usersByRole:{ADMIN,BROKER,INVESTOR},liveProperties,fundsRaisedThisMonth,platformFeesEarned,fundsRaisedSeries:[{date,amount}],propertiesByStatus:[{status,count}],approvalQueue:{properties,brokers,kyc,withdrawals}}`.
- Rules: aum = valuation of FUNDED/HOLDING assets; month uses UTC calendar; fundsRaised sums INVESTMENT debits within range minus REFUND credits within range; fees from FEE ledger; approvalQueue counts, not leaked documents. P1 queues zero when disabled.

### GET /admin/users - P0 (KYC queue fields P1)

- Auth/role: ADMIN. Query: pagination, `search` name/email, `role`, `isActive`, `brokerApproved`, `kycStatus`; sort `createdAt`, `name`.
- 200 data: page of UserDTO with admin-only `kyc.docs`, `kyc.selfie`, `kyc.reviewedBy`, `kyc.reviewedAt` for private document review.
- Rules: no passwordHash/resetTokenHash; `/admin/users?kycStatus=PENDING` powers KYC queue, avoiding an undocumented queue endpoint.

### PATCH /admin/users/:id - P0

- Auth/role: ADMIN. Path: user ObjectId. Body: subset `{isActive,role,brokerApproved}` (at least one).
- 200 data: UserDTO.
- Errors: 409 CONFLICT for last active admin/incompatible role change; 400 VALIDATION_ERROR for approval of nonbroker.
- Rules: cannot edit balances/password/KYC via this route; role/isActive changes invalidate sessions. Preserve history and account references.

### POST /kyc - P1

- Auth/role: INVESTOR. Body: `{docs:MediaDTO[],selfie:MediaDTO}`; >=1 dummy ID document plus image selfie.
- 201 data: `{status:"PENDING",docs,selfie,reason:null}`.
- Errors: 409 KYC_ALREADY_SUBMITTED for PENDING/APPROVED.
- Rules: NOT_SUBMITTED/REJECTED -> PENDING; privately uploaded assets must belong to user. Never require real identity numbers.

### PATCH /admin/kyc/:userId - P1

- Auth/role: ADMIN. Path: investor ObjectId. Body: `{status:"APPROVED"|"REJECTED",reason?}`; reason required for rejection.
- 200 data: UserDTO.
- Errors: 409 INVALID_KYC_STATUS; 400 VALIDATION_ERROR for noninvestor.
- Rules: PENDING only; persist reviewer/time and notify investor.

### GET /admin/withdrawals - P1

- Auth/role: ADMIN. Query: pagination, `status` WITHDRAWAL_STATUS, `userId`, `from,to`; sort `createdAt`, `amount`.
- 200 data: paginated WithdrawalDTO.
- Rules: default PENDING queue; dummy bank details private, not exposed publicly.

### PATCH /admin/withdrawals/:id - P1

- Auth/role: ADMIN. Path: withdrawal ObjectId. Body: `{status:"APPROVED"|"REJECTED",reason?}`; rejection requires reason.
- 200 data: `{withdrawal:WithdrawalDTO,wallet:WalletDTO}` for that investor.
- Errors: 409 WITHDRAWAL_ALREADY_PROCESSED, INSUFFICIENT_BALANCE (integrity failure; investigate reservation).
- Rules: conditional PENDING; approval ledger debit and release atomic, rejection release atomic; cannot pay twice.

### GET /admin/settings - P0

- Auth/role: ADMIN. Params/body: none. 200 data: SettingsDTO.
- Rules: persisted singleton; missing configuration surfaces explicit server error.

### PATCH /admin/settings - P0 (ownership cap enforcement P1)

- Auth/role: ADMIN. Body: subset `{platformFeePct,brokerCommissionPct,maxOwnershipPct}`.
- 200 data: SettingsDTO.
- Errors: 400 VALIDATION_ERROR for out-of-range/rate precision.
- Rules: no historical recalculation; no feeAccountUserId modification through this API. New sale uses current fee, checked against preview.

## Enquiries and notifications

### POST /enquiries - P1

- Auth/role: INVESTOR. Body: `{propertyId,message}`.
- 201 data: EnquiryDTO.
- Errors: 409 ENQUIRY_UNAVAILABLE for no broker/unpublished asset.
- Rules: derive brokerId, investorId, initial author/time on server.

### GET /enquiries - P1

- Auth/role: INVESTOR or BROKER. Query: pagination, `propertyId`, `status` OPEN/CLOSED; sort `createdAt`, `updatedAt`.
- 200 data: paginated EnquiryDTO.
- Rules: own initiations or broker's property threads only.

### POST /enquiries/:id/reply - P1

- Auth/role: participating INVESTOR or owning BROKER. Path: enquiry ObjectId. Body: `{message}`.
- 200 data: EnquiryDTO.
- Errors: 409 ENQUIRY_CLOSED.
- Rules: server author/time; no impersonation or cross-broker access.

### GET /notifications - P1

- Auth/role: Auth any role. Query: pagination, `read` boolean; sort `createdAt`.
- 200 data: paginated NotificationDTO.
- Rules: recipient-only.

### PATCH /notifications/:id/read - P1

- Auth/role: Auth any role. Path: notification ObjectId. Body: empty.
- 200 data: NotificationDTO.
- Rules: recipient-only; repeated marking returns 200 without another event.

## Supporting contracts derived from required screens/operations (D8)

These fill omissions in the source's illustrative API list, not new product features. Team must approve them before implementation.

### PATCH /auth/me - Shared profile

- Auth/role: Auth any role. Body: subset `{name,phone}`.
- 200 data: UserDTO. Common validation errors.
- Rules: cannot self-edit role/email/approval/balance; email-change verification is out of scope.

### POST /auth/change-password - Shared profile

- Auth/role: Auth any role. Body: `{currentPassword,password}`.
- 200 data: `{changed:true}`.
- Errors: 401 INVALID_CREDENTIALS for wrong current password.
- Rules: strong password, invalidate sessions, require fresh login.

### POST /uploads - P0 property media, P1 KYC

- Auth/role: ADMIN/BROKER for purpose property; INVESTOR for purpose kyc; broker must be approved.
- Multipart fields: `file` (one), `purpose:"property"|"kyc"`.
- 201 data: MediaDTO.
- Errors: 413 UPLOAD_TOO_LARGE; 415 UNSUPPORTED_MEDIA_TYPE; 403 BROKER_NOT_APPROVED; 503 SERVICE_UNAVAILABLE.
- Rules: jpg/png/webp/pdf only, <=5 MB; verify content not only client MIME; private authenticated Cloudinary delivery for KYC; check signed asset metadata/owner when attached; clean abandoned assets through a coordinated maintenance policy.

### GET /wallet/withdrawals - P1 own request history

- Auth/role: INVESTOR. Query: pagination, status; sort `createdAt`.
- 200 data: paginated WithdrawalDTO.
- Rules: own requests only; supports wallet's pending/rejected/approved UI.

### GET /admin/properties - P0 all-property management

- Auth/role: ADMIN. Query: pagination, `search`, `status` any PROPERTY_STATUS, `brokerId`, `city`; sort `createdAt`, `title`, `unitsSold`.
- 200 data: paginated PropertyDTO, including unpublished assets.
- Rules: separate from the public LIVE/FUNDED marketplace; powers the required admin property table and approval queue.

### GET /platform/stats - P0 landing statistics and shared capabilities

- Auth/role: Public. Params/body: none.
- 200 data: `{totalRaised,investorCount,features:{kyc,withdrawals,enquiries,notifications,passwordReset,ownershipCap},paymentProvider:"mock"|"razorpay"}`.
- Rules: totalRaised is non-refunded invested principal including sold history; investorCount is active registered INVESTOR count. Feature values are server booleans from validated configuration; UI must not maintain independently conflicting flags. No user/financial records or secret configuration.

### GET /health - Operations, outside /api/v1

- Auth/role: Public. No params/body.
- 200 `{success:true,data:{status:"ok",database:"connected"},message:"Service healthy"}` when ready.
- 503 SERVICE_UNAVAILABLE when database/transaction readiness fails; sanitized details only, no connection strings.

P2 `/auth/refresh`, rental and secondary-market endpoints are intentionally not claimed as finalized contracts; approve their schema/security additions first.
