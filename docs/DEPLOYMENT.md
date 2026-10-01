# Deployment and Environment Contract

Owner: Chetan. Current state: documentation only; no package manifests, scripts, server, frontend or deployment exists yet. Commands below are the required future scaffold interface, NOT verified runnable commands today. Choose the D1 stack before implementing them.

## Planned targets

| Layer | Local | Deployment |
|---|---|---|
| Client | Vite on http://localhost:5173 | Vercel or Netlify, static SPA |
| Server | Express on http://localhost:5000 | Render or Railway, HTTPS |
| Database | Replica set, never standalone for finance | MongoDB Atlas replica set |
| Media | Configured Cloudinary | Cloudinary public property assets/private KYC |
| Payment | Signed academic mock or Razorpay test | Same test-only adapter, visibly labelled |
| Mail | Optional test SMTP | P1 configured Nodemailer SMTP |

Stripe test mode is source-allowed but not selected in the proposed contract. If selected, revise adapter/API/env/tests together; do not put Stripe keys into undocumented variables.

## Complete planned environment inventory

Client: [client/.env.example](../client/.env.example). Server: [server/.env.example](../server/.env.example). Each variable has an explanatory comment; no real credentials.

| Variable(s) | Requirement and handling |
|---|---|
| VITE_API_BASE_URL | Public full `/api/v1` URL; Vite build-time setting; must use deployed HTTPS server in production |
| NODE_ENV, PORT | Runtime mode/port; host may assign PORT |
| MONGO_URI | Required transaction-capable connection; credentials private |
| JWT_SECRET, JWT_EXPIRES_IN | Required strong generated secret and approved 15m policy; no placeholder secret allowed at startup |
| CLIENT_URL | Exact frontend origin for CORS/reset URL, no trailing path |
| CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET | Server account credentials; required for upload functionality |
| PAYMENT_PROVIDER | `mock` or `razorpay`; fail on unknown value |
| MOCK_PAYMENT_SECRET | Required only for mock; generate separately from JWT secret |
| RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET | Required only for razorpay; reject non-test key IDs/live payments |
| PLATFORM_FEE_PCT, BROKER_COMMISSION_PCT, MAX_OWNERSHIP_PCT | Initial Settings seed rates (2, 1, 49 recommended); not overrides of saved settings |
| KYC_ENABLED, WITHDRAWALS_ENABLED, ENQUIRIES_ENABLED | P1 server gates, literal true/false; default example true |
| NOTIFICATIONS_ENABLED, PASSWORD_RESET_ENABLED, OWNERSHIP_CAP_ENABLED | P1 server gates; reset example false until mail configured |
| SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM | Validate when password reset enabled; example SMTP_PORT 587/SMTP_SECURE false |
| SEED_ADMIN_PASSWORD, SEED_BROKER_PASSWORD, SEED_INVESTOR_PASSWORD | Seed-time only, strong operator-supplied demo passwords; do not bundle in frontend/logs/repository |

Server-owned feature flags are exposed as safe capabilities through GET `/api/v1/platform/stats`; client must not duplicate independent build flags. A disabled endpoint returns `503 FEATURE_DISABLED`. Changes to feature availability need team approval and matching UX/tests.

Generate secrets with a local secure generator; examples deliberately leave secrets empty. Fail startup/configuration validation for missing required variables and selected-provider credentials. Never silently use fallback secrets or switch providers on failure.

## Local development after scaffolding

Prerequisites: approved Node 22+ runtime/npm workspace configuration; Atlas URI or explicitly configured local replica set; Cloudinary account. Docker is optional, not assumed installed.

PowerShell commands from repository root:

```powershell
Copy-Item .\client\.env.example .\client\.env
Copy-Item .\server\.env.example .\server\.env
# Fill local secrets/configuration without committing them.
npm install
npm run seed --workspace server
npm run dev --workspace server
```

In a second terminal:

```powershell
npm run dev --workspace client
```

Future scripts: server `dev` watches entrypoint, `start` runs it, `seed` invokes `scripts/seed.js`; client `dev/build/preview` use Vite. Chetan owns these manifests and must verify the commands on a fresh checkout before claiming setup works.

Local replica set must be initialized before seed/tests. Transactions failing due to standalone MongoDB is a hard blocker, not permission to remove sessions.

## Frontend deployment

1. Set VITE_API_BASE_URL to `https://<backend-host>/api/v1` in provider build environment.
2. Install from committed lockfile (`npm ci` after one exists).
3. Build at root with `npm run build --workspace client`; output `client/dist`.
4. Configure SPA fallback to index for deep links (investor/broker/admin/public detail).
5. Deploy HTTPS; verify no server secrets in built assets and no browser mixed content.
6. Check auth redirect, deep-link guard, CORS and actual API requests.

## Backend deployment

1. Provider root is repository root so server can import the approved shared workspace.
2. Install locked dependencies; JavaScript Express server has no transpile build under proposed D1.
3. Start `npm run start --workspace server`; bind assigned PORT.
4. Configure all required server secrets in provider settings, never GitHub source or frontend build variables.
5. Set CLIENT_URL to exact deployed frontend origin. CORS allowlist that origin only; no wildcard with credentials.
6. Configure trusted proxy per provider before rate limiting, without blindly trusting arbitrary forwarded IP headers.
7. Restrict Atlas network access/credentials; initialize indexes and confirm transaction readiness.
8. Run seed deliberately against academic demo DB; never auto-seed/clear data on startup.
9. Confirm `/health` 200 and sanitized readiness payload; transaction/database failure gives 503.

The proposed bearer-token P0 does not require credentialed CORS. P2 cookies require coordinated credentials, secure/sameSite settings, CSRF policy and refresh persistence review.

## Atlas, media and test payments

- Atlas: least-privilege application DB user, separate demo/test databases, replica-set transaction support, backups as appropriate; never expose URI.
- Cloudinary: server-only keys; jpg/png/webp/pdf, max 5 MB; property documents public, KYC authenticated/private; attached assets checked for owner/purpose.
- Mock: signed expiring server-bound order/proof, explicit no-money labelling; no provider-error fallback.
- Razorpay: test keys only, trusted order fetch/captured verification, signature check, unique order and payment IDs. No real bank data or charges.
- Mail: reset links point to frontend `/reset/:token`, SMTP tested only when P1 enabled; raw reset token never logged.

## Seed safeguards

Use a dedicated academic DB. Seed is repeatable for the owned fixture set, checks target environment and refuses production/destructive resets by default. Do not implement a blanket dropDatabase. Seed credentials come from environment; documented email addresses are fictional demo accounts. Chetan validates ledger balances, holdings, payout sums and unique indexes before handing over accounts.

## Health and smoke verification

After the server is actually implemented/running:

```powershell
Invoke-RestMethod http://localhost:5000/health
Invoke-RestMethod http://localhost:5000/api/v1/platform/stats
```

Verify public marketplace, login each role, broker foreign-asset refusal, admin approval, wallet proof verification, one investment, sale preview/execution and repeat-sale rejection. Use [TESTING.md](../TESTING.md), not health alone, as financial verification.

## Deployment checklist

- [ ] Approved stack/provider/security decisions and matching manifests/lockfile.
- [ ] Clean install/build/start/seed commands verified, README updated with actual evidence.
- [ ] All required env values present; no committed secrets or live payment credentials.
- [ ] Atlas transaction readiness and unique indexes confirmed.
- [ ] Exact production CORS/HTTPS/deep-link behavior works.
- [ ] Cloudinary public/private media access tested with dummy KYC.
- [ ] Payment mode visibly test/mock; duplicate verification rejected.
- [ ] P1 flags match UI and server; disabled features honestly documented.
- [ ] All three role flows, financial invariants and concurrency test pass.
- [ ] Live URLs/video/Postman links populated only after actual verification.
- [ ] Health monitored, sanitized logs available, rollback is deployment rollback rather than financial-history deletion.
