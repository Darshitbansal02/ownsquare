# API Request / Response Examples

Illustrative contracts only: none are live requests, real credentials, existing records or test results. Monetary numbers are INTEGER PAISE. Use base URL `http://localhost:5000/api/v1` locally after implementation; deployed URL comes from configuration. See [API_DESIGN.md](../API_DESIGN.md) for full validations/access.

Example IDs: admin `000000000000000000000001`, Rohit broker `000000000000000000000002`, Aman `000000000000000000000003`, Priya `000000000000000000000004`, Karan `000000000000000000000005`, Isha `000000000000000000000006`, Neha `000000000000000000000007`. Property `100000000000000000000001`.

Cloudinary URLs/publicIds below represent already uploaded, owner-validated assets. Replace the cloud placeholder with actual verified academic assets. KYC URLs require authenticated delivery; these placeholders are not publicly accessible identity documents.

## 1. Login - P0

POST `/auth/login`, Content-Type application/json, no bearer header:

```json
{
  "email": "aman@demo.com",
  "password": "<operator-supplied-demo-password>"
}
```

HTTP 200:

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "000000000000000000000003",
      "name": "Aman",
      "email": "aman@demo.com",
      "phone": "0000000000",
      "role": "INVESTOR",
      "isActive": true,
      "brokerApproved": false,
      "kyc": { "status": "APPROVED", "reason": null },
      "createdAt": "2026-10-01T06:00:00.000Z",
      "updatedAt": "2026-10-01T06:25:00.000Z"
    },
    "accessToken": "<server-issued-access-token>",
    "expiresIn": 900
  },
  "message": "Logged in"
}
```

Phone is deliberately dummy. Actual account does not exist yet. JWT never contains passwordHash/private KYC media.

## 2. Create broker property - P0

POST `/properties`, Authorization `Bearer <brokerAccessToken>`:

```json
{
  "title": "2BHK, Sector 150, Noida",
  "description": "Academic listing of a residential apartment in Sector 150 with transport access and shared ownership units.",
  "type": "APARTMENT",
  "address": "Demo Block A, Sector 150",
  "city": "Noida",
  "state": "Uttar Pradesh",
  "pincode": "201310",
  "geo": { "lat": 28.4100, "lng": 77.4800 },
  "areaSqft": 1200,
  "images": [
    { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-1.jpg", "publicId": "demo/noida-1", "name": "Exterior" },
    { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-2.jpg", "publicId": "demo/noida-2", "name": "Living room" },
    { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-3.jpg", "publicId": "demo/noida-3", "name": "Bedroom" }
  ],
  "documents": [
    { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/disclosure.pdf", "publicId": "demo/disclosure", "name": "Dummy disclosure.pdf" },
    { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/valuation.pdf", "publicId": "demo/valuation", "name": "Dummy valuation.pdf" }
  ],
  "valuation": 1000000000,
  "totalUnits": 1000,
  "minUnits": 1,
  "maxUnitsPerInvestor": 490,
  "expectedAppreciationPct": 12,
  "rentalYieldPct": 3,
  "holdingPeriodMonths": 24
}
```

HTTP 201:

```json
{
  "success": true,
  "data": {
    "_id": "100000000000000000000001",
    "title": "2BHK, Sector 150, Noida",
    "description": "Academic listing of a residential apartment in Sector 150 with transport access and shared ownership units.",
    "type": "APARTMENT",
    "address": "Demo Block A, Sector 150",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "pincode": "201310",
    "geo": { "lat": 28.4100, "lng": 77.4800 },
    "areaSqft": 1200,
    "images": [
      { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-1.jpg", "publicId": "demo/noida-1", "name": "Exterior" },
      { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-2.jpg", "publicId": "demo/noida-2", "name": "Living room" },
      { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-3.jpg", "publicId": "demo/noida-3", "name": "Bedroom" }
    ],
    "documents": [
      { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/disclosure.pdf", "publicId": "demo/disclosure", "name": "Dummy disclosure.pdf" },
      { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/valuation.pdf", "publicId": "demo/valuation", "name": "Dummy valuation.pdf" }
    ],
    "valuation": 1000000000,
    "totalUnits": 1000,
    "unitPrice": 1000000,
    "minUnits": 1,
    "maxUnitsPerInvestor": 490,
    "unitsSold": 0,
    "expectedAppreciationPct": 12,
    "rentalYieldPct": 3,
    "holdingPeriodMonths": 24,
    "status": "DRAFT",
    "rejectionReason": null,
    "brokerId": "000000000000000000000002",
    "createdBy": "000000000000000000000002",
    "approvedBy": null,
    "salePrice": null,
    "liveAt": null,
    "fundedAt": null,
    "soldAt": null,
    "createdAt": "2026-10-01T06:10:00.000Z",
    "updatedAt": "2026-10-01T06:10:00.000Z",
    "fundingPct": 0,
    "investorCount": 0,
    "remainingUnits": 1000
  },
  "message": "Draft created"
}
```

This example shows the minimum three images; source walkthrough seed/demo should provide eight photos and two PDFs. Empty/partial draft saves are also permitted, with nullable unsupplied fields.

## 3. Submit and approve - P0

Broker first POST `/properties/100000000000000000000001/submit` with `{}`. Success returns PropertyDTO in PENDING_APPROVAL. Then ADMIN:

POST `/properties/100000000000000000000001/approve`, Authorization `Bearer <adminAccessToken>`, body `{}`.

HTTP 200:

```json
{
  "success": true,
  "data": {
    "_id": "100000000000000000000001",
    "title": "2BHK, Sector 150, Noida",
    "description": "Academic listing of a residential apartment in Sector 150 with transport access and shared ownership units.",
    "type": "APARTMENT",
    "address": "Demo Block A, Sector 150",
    "city": "Noida",
    "state": "Uttar Pradesh",
    "pincode": "201310",
    "geo": { "lat": 28.4100, "lng": 77.4800 },
    "areaSqft": 1200,
    "images": [
      { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-1.jpg", "publicId": "demo/noida-1", "name": "Exterior" },
      { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-2.jpg", "publicId": "demo/noida-2", "name": "Living room" },
      { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-3.jpg", "publicId": "demo/noida-3", "name": "Bedroom" }
    ],
    "documents": [
      { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/disclosure.pdf", "publicId": "demo/disclosure", "name": "Dummy disclosure.pdf" },
      { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/valuation.pdf", "publicId": "demo/valuation", "name": "Dummy valuation.pdf" }
    ],
    "valuation": 1000000000,
    "totalUnits": 1000,
    "unitPrice": 1000000,
    "minUnits": 1,
    "maxUnitsPerInvestor": 490,
    "unitsSold": 0,
    "expectedAppreciationPct": 12,
    "rentalYieldPct": 3,
    "holdingPeriodMonths": 24,
    "status": "LIVE",
    "rejectionReason": null,
    "brokerId": "000000000000000000000002",
    "createdBy": "000000000000000000000002",
    "approvedBy": "000000000000000000000001",
    "salePrice": null,
    "liveAt": "2026-10-01T06:30:00.000Z",
    "fundedAt": null,
    "soldAt": null,
    "createdAt": "2026-10-01T06:10:00.000Z",
    "updatedAt": "2026-10-01T06:30:00.000Z",
    "fundingPct": 0,
    "investorCount": 0,
    "remainingUnits": 1000
  },
  "message": "Property approved"
}
```

An investor using this endpoint receives 403 FORBIDDEN. Rejection instead uses POST `/properties/:id/reject` with `{"reason":"Please replace the incomplete valuation document."}`.

## 4. Wallet top-up order and verification - P0

Before Aman's purchase, POST `/wallet/topup/order`, Authorization `Bearer <investorAccessToken>`:

```json
{ "amount": 50000000 }
```

HTTP 201 (INR 5 lakh):

```json
{
  "success": true,
  "data": {
    "gatewayOrderId": "mock_order_demo_001",
    "amount": 50000000,
    "currency": "INR",
    "provider": "mock",
    "checkout": {
      "gatewayPaymentId": "mock_payment_demo_001",
      "mockOrderToken": "<server-signed-expiring-order-token>"
    }
  },
  "message": "Mock payment order created - no real money"
}
```

POST `/wallet/topup/verify` using the identifiers/proof returned by the server, no client amount:

```json
{
  "gatewayOrderId": "mock_order_demo_001",
  "gatewayPaymentId": "mock_payment_demo_001",
  "mockOrderToken": "<server-signed-expiring-order-token>"
}
```

HTTP 200, starting balance zero:

```json
{
  "success": true,
  "data": {
    "wallet": { "balance": 50000000, "reservedBalance": 0, "availableBalance": 50000000 },
    "transaction": {
      "_id": "400000000000000000000001",
      "userId": "000000000000000000000003",
      "type": "TOPUP",
      "direction": "CREDIT",
      "amount": 50000000,
      "balanceAfter": 50000000,
      "refType": "TopupOrder",
      "refId": "mock_order_demo_001",
      "gatewayOrderId": "mock_order_demo_001",
      "gatewayPaymentId": "mock_payment_demo_001",
      "createdAt": "2026-10-01T06:34:00.000Z"
    }
  },
  "message": "Mock wallet credit completed - no real money"
}
```

Razorpay test alternative body uses gatewaySignature instead of mockOrderToken; selected adapter verifies trusted order/captured payment/signature. Reuse of either order/payment returns 409 DUPLICATE_PAYMENT:

```json
{
  "success": false,
  "error": { "code": "DUPLICATE_PAYMENT", "message": "This order or payment has already been credited", "details": [] }
}
```

## 5. Investment - P0

Priya's 50 and Karan's 400 units are purchased through the same endpoint before this example, so pre-purchase unitsSold is 450. Aman has approved KYC and sufficient cap headroom.

POST `/investments`, Authorization `Bearer <investorAccessToken>`, Idempotency-Key `123e4567-e89b-42d3-a456-426614174000`:

```json
{ "propertyId": "100000000000000000000001", "units": 20 }
```

HTTP 201:

```json
{
  "success": true,
  "data": {
    "investment": {
      "_id": "200000000000000000000001",
      "investorId": "000000000000000000000003",
      "propertyId": "100000000000000000000001",
      "units": 20,
      "amount": 20000000,
      "status": "ACTIVE",
      "payoutAmount": 0,
      "ownershipPct": 2,
      "createdAt": "2026-10-01T06:35:00.000Z",
      "updatedAt": "2026-10-01T06:35:00.000Z"
    },
    "property": { "_id": "100000000000000000000001", "unitsSold": 470, "fundingPct": 47, "status": "LIVE" },
    "walletBalance": 30000000
  },
  "message": "You now own 2% of 2BHK, Sector 150, Noida"
}
```

Same key/body returns HTTP 200 with original committed data, no debit. Different units with that key -> 409 IDEMPOTENCY_CONFLICT.

Final-block concurrency loser, HTTP 409:

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

## 6. Payout preview - P0

Isha later buys 300 units and Neha 230, taking sold units to 1,000 -> FUNDED. Commission is 10,000,000 paise at 1%. Admin posts `/properties/:id/status` with `{"status":"HOLDING"}` after acquisition.

GET `/properties/100000000000000000000001/payout-preview?salePrice=1400000000`, Authorization `Bearer <adminAccessToken>`.

HTTP 200:

```json
{
  "success": true,
  "data": {
    "propertyId": "100000000000000000000001",
    "salePrice": 1400000000,
    "platformFeePct": 2,
    "platformFee": 28000000,
    "distributable": 1372000000,
    "items": [
      { "investorId": "000000000000000000000003", "units": 20, "amount": 27440000 },
      { "investorId": "000000000000000000000004", "units": 50, "amount": 68600000 },
      { "investorId": "000000000000000000000005", "units": 400, "amount": 548800000 },
      { "investorId": "000000000000000000000006", "units": 300, "amount": 411600000 },
      { "investorId": "000000000000000000000007", "units": 230, "amount": 315560000 }
    ],
    "totalPayout": 1372000000,
    "remainder": 0,
    "remainderInvestorId": null
  },
  "message": "Payout preview calculated"
}
```

Preview performs no writes. Every holder is under the proposed 49% cap. All payouts sum exactly to 1,372,000,000 paise.

## 7. Record sale - P0

POST `/properties/100000000000000000000001/sell`, Authorization `Bearer <adminAccessToken>`:

```json
{ "salePrice": 1400000000, "expectedPlatformFeePct": 2 }
```

HTTP 200:

```json
{
  "success": true,
  "data": {
    "property": {
      "_id": "100000000000000000000001",
      "title": "2BHK, Sector 150, Noida",
      "description": "Academic listing of a residential apartment in Sector 150 with transport access and shared ownership units.",
      "type": "APARTMENT",
      "address": "Demo Block A, Sector 150",
      "city": "Noida",
      "state": "Uttar Pradesh",
      "pincode": "201310",
      "geo": { "lat": 28.4100, "lng": 77.4800 },
      "areaSqft": 1200,
      "images": [
        { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-1.jpg", "publicId": "demo/noida-1", "name": "Exterior" },
        { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-2.jpg", "publicId": "demo/noida-2", "name": "Living room" },
        { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/noida-3.jpg", "publicId": "demo/noida-3", "name": "Bedroom" }
      ],
      "documents": [
        { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/disclosure.pdf", "publicId": "demo/disclosure", "name": "Dummy disclosure.pdf" },
        { "url": "https://res.cloudinary.com/<cloud-name>/image/upload/demo/valuation.pdf", "publicId": "demo/valuation", "name": "Dummy valuation.pdf" }
      ],
      "valuation": 1000000000,
      "totalUnits": 1000,
      "unitPrice": 1000000,
      "minUnits": 1,
      "maxUnitsPerInvestor": 490,
      "unitsSold": 1000,
      "expectedAppreciationPct": 12,
      "rentalYieldPct": 3,
      "holdingPeriodMonths": 24,
      "status": "SOLD",
      "rejectionReason": null,
      "brokerId": "000000000000000000000002",
      "createdBy": "000000000000000000000002",
      "approvedBy": "000000000000000000000001",
      "salePrice": 1400000000,
      "liveAt": "2026-10-01T06:30:00.000Z",
      "fundedAt": "2026-10-02T06:30:00.000Z",
      "soldAt": "2028-10-01T06:30:00.000Z",
      "createdAt": "2026-10-01T06:10:00.000Z",
      "updatedAt": "2028-10-01T06:30:00.000Z",
      "fundingPct": 100,
      "investorCount": 5,
      "remainingUnits": 0
    },
    "payout": {
      "_id": "300000000000000000000001",
      "propertyId": "100000000000000000000001",
      "salePrice": 1400000000,
      "platformFeePct": 2,
      "platformFee": 28000000,
      "distributable": 1372000000,
      "items": [
        { "investorId": "000000000000000000000003", "units": 20, "amount": 27440000 },
        { "investorId": "000000000000000000000004", "units": 50, "amount": 68600000 },
        { "investorId": "000000000000000000000005", "units": 400, "amount": 548800000 },
        { "investorId": "000000000000000000000006", "units": 300, "amount": 411600000 },
        { "investorId": "000000000000000000000007", "units": 230, "amount": 315560000 }
      ],
      "executedBy": "000000000000000000000001",
      "executedAt": "2028-10-01T06:30:00.000Z"
    }
  },
  "message": "Sale recorded and payouts credited"
}
```

Aman's wallet: 30,000,000 + 27,440,000 = 57,440,000 paise; holding ROI 37.2%. Second sale returns HTTP 409:

```json
{
  "success": false,
  "error": { "code": "ALREADY_SOLD", "message": "This property has already been sold", "details": [] }
}
```

## 8. Withdrawal request - P1

POST `/wallet/withdraw`, Authorization `Bearer <investorAccessToken>`, after the illustrated sale:

```json
{
  "amount": 10000000,
  "bankDetails": { "accountHolder": "Aman Demo", "accountNumber": "0000000000", "ifsc": "DEMO0000001" }
}
```

HTTP 201:

```json
{
  "success": true,
  "data": {
    "withdrawal": {
      "_id": "500000000000000000000001",
      "userId": "000000000000000000000003",
      "amount": 10000000,
      "status": "PENDING",
      "bankDetails": { "accountHolder": "Aman Demo", "accountNumber": "0000000000", "ifsc": "DEMO0000001" },
      "reason": null,
      "processedBy": null,
      "createdAt": "2028-10-01T06:35:00.000Z",
      "updatedAt": "2028-10-01T06:35:00.000Z"
    },
    "wallet": { "balance": 57440000, "reservedBalance": 10000000, "availableBalance": 47440000 }
  },
  "message": "Simulated withdrawal requested"
}
```

Admin PATCH `/admin/withdrawals/500000000000000000000001` with `{"status":"APPROVED"}` debits once; resulting WalletDTO balance/availableBalance 47,440,000, reservedBalance 0. Reject instead requires reason and releases reservation without debit.

## 9. KYC approval - P1

Before investing, investor uploads dummy ID+selfie via `/uploads` purpose kyc and POST `/kyc`. Pending queue GET `/admin/users?kycStatus=PENDING` is ADMIN only.

PATCH `/admin/kyc/000000000000000000000003`, Authorization `Bearer <adminAccessToken>`:

```json
{ "status": "APPROVED" }
```

HTTP 200:

```json
{
  "success": true,
  "data": {
    "_id": "000000000000000000000003",
    "name": "Aman",
    "email": "aman@demo.com",
    "phone": "0000000000",
    "role": "INVESTOR",
    "isActive": true,
    "brokerApproved": false,
    "kyc": { "status": "APPROVED", "reason": null },
    "createdAt": "2026-10-01T06:00:00.000Z",
    "updatedAt": "2026-10-01T06:25:00.000Z"
  },
  "message": "Dummy KYC approved"
}
```

Reject with `{"status":"REJECTED","reason":"Please upload a readable dummy ID."}`. Review from non-PENDING fails 409 INVALID_KYC_STATUS.

## 10. Standard empty page and validation

GET `/transactions?page=1&limit=20` for a new investor, HTTP 200:

```json
{
  "success": true,
  "data": { "items": [], "page": 1, "limit": 20, "total": 0, "totalPages": 0 },
  "message": "Transactions retrieved"
}
```

POST `/investments` with fractional units, HTTP 400:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "units", "message": "Must be a positive integer" }]
  }
}
```
