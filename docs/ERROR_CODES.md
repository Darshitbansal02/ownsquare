# Standard Error Catalog

Owner of canonical planned `shared/errorCodes.js`: Dhruv; Devang owns authentication mapping, Chetan verifies cross-module consistency. Do not introduce synonymous error names. Every response uses the envelope in [CONTRACTS.md](../CONTRACTS.md).

| Code | HTTP | Meaning / caller response |
|---|---:|---|
| VALIDATION_ERROR | 400 | Invalid body/query/path/header, unknown field, unsafe money or financial division; show field details |
| UNAUTHORIZED | 401 | Missing/expired/revoked token or deactivated user; clear session and login |
| INVALID_CREDENTIALS | 401 | Generic credential mismatch; never identify which credential |
| FORBIDDEN | 403 | Wrong role or forbidden permission; show access-denied screen |
| NOT_FOUND | 404 | Missing or not visible resource, including another broker's property |
| EMAIL_ALREADY_EXISTS | 409 | Registration email unique conflict |
| INVALID_RESET_TOKEN | 400 | Reset token invalid, expired or consumed |
| BROKER_NOT_APPROVED | 403 | Broker approval required before creating/submitting/uploading property assets |
| PROPERTY_IMMUTABLE | 403 | Published property edit forbidden or financial fields locked after any investment |
| INVALID_PROPERTY_STATUS | 409 | Illegal transition or action against unsuitable status |
| ALREADY_FUNDED | 409 | Ordinary new purchase of already-funded property |
| INSUFFICIENT_UNITS | 409 | Requested units no longer available; details must contain numeric remainingUnits |
| INSUFFICIENT_BALANCE | 409 | Available wallet below required amount; details include availableBalance and requiredAmount in paise |
| OWNERSHIP_LIMIT_EXCEEDED | 409 | Cumulative ownership exceeds enabled property/platform cap |
| KYC_REQUIRED | 403 | Investor KYC approval required when P1 gate is enabled |
| IDEMPOTENCY_CONFLICT | 409 | Existing Idempotency-Key reused with different propertyId/units |
| ALREADY_SOLD | 409 | Sale/payout already committed; never execute again |
| PREVIEW_STALE | 409 | Fee changed since preview; refresh preview and reconfirm |
| PAYMENT_VERIFICATION_FAILED | 400 | Signature/order/owner/currency/captured-state/expiry check failed |
| DUPLICATE_PAYMENT | 409 | Order or payment already credited |
| KYC_ALREADY_SUBMITTED | 409 | Cannot submit while PENDING or APPROVED |
| INVALID_KYC_STATUS | 409 | KYC review only allowed from PENDING |
| WITHDRAWAL_ALREADY_PROCESSED | 409 | Withdrawal is not PENDING |
| ENQUIRY_UNAVAILABLE | 409 | Asset has no broker or is not published |
| ENQUIRY_CLOSED | 409 | Thread cannot accept replies |
| UPLOAD_TOO_LARGE | 413 | File exceeds 5 MB |
| UNSUPPORTED_MEDIA_TYPE | 415 | Unsupported MIME or invalid content |
| RATE_LIMITED | 429 | Too many requests; include Retry-After header |
| FEATURE_DISABLED | 503 | Explicitly disabled P1/P2 capability, not a fake successful operation |
| CONFLICT | 409 | Other documented integrity conflict, incompatible role change or last-admin protection; provide safe explanation |
| SERVICE_UNAVAILABLE | 503 | Database/gateway/media/mail dependency not ready; do not silently mock |
| INTERNAL_ERROR | 500 | Unexpected server error; generic user message, repository-standard server logging |

Wrong role is FORBIDDEN before resource lookup. Correct-role caller accessing another owner's asset gets NOT_FOUND. Final-block concurrency loser gets INSUFFICIENT_UNITS even if the winner just set FUNDED; ordinary already-funded purchase gets ALREADY_FUNDED.

## Examples

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "units", "message": "Must be a positive integer" }
    ]
  }
}
```

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

Never echo raw MongoDB duplicate-key errors, stack traces, uploaded identity data, access tokens or provider secrets. Map known unique-index conflicts to EMAIL_ALREADY_EXISTS, DUPLICATE_PAYMENT, ALREADY_SOLD or the idempotency replay/conflict contract; unknown failures remain explicit INTERNAL_ERROR.
