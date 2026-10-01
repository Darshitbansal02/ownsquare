# Application Architecture

Proposed implementation, pending D1-D9 sign-off in [CONTRACTS.md](CONTRACTS.md). No scaffolding/source is created by this documentation task.

## Layering

```text
React/Vite browser
  -> API client (configured base URL, bearer token, envelope/error mapping)
  -> Express routes
  -> authenticate -> requireRole -> requireOwnership -> validate
  -> controllers (HTTP orchestration)
  -> services (domain rules, transaction boundary)
  -> Mongoose models
  -> MongoDB Atlas replica set

Services -> Cloudinary / mock or Razorpay test adapter / P1 mail provider
```

| Layer | Responsibility / prohibited shortcuts |
|---|---|
| Frontend | Display data, validate UX, route by role, ask confirmation; never authoritative ownership/wallet/payout calculations |
| API client | One fetch/axios instance; base URL, token attachment, typed-by-contract DTO shapes, pagination, errors; no alternate per-module transport |
| Routes | Mount exact methods/paths and middleware; no embedded business arithmetic |
| Controllers | Read validated input, call service, choose success status/envelope; no direct balance/inventory mutation |
| Services | Eligibility, state machine, money, transaction sessions, provider verification; sole financial authority |
| Middleware | Current-user auth, role/ownership, validation, sanitization, limits, upload handling, central errors |
| Validators | Shared field rules and allowlisted bodies/query/headers, conditional draft/submit validation; no mass-assignment |
| Models | Schema/enums/indexes/references; no controller-dependent behavior or hidden financial side effects |
| Database | Persistence, unique constraints, atomic inventory/user guards and multi-document rollback |
| External services | Test payment verification, hosted media and optional mail; failures surfaced explicitly |

## Recommended stack

React + Vite, React Router, TanStack Query, Tailwind + shadcn/ui, React Hook Form + Zod, Recharts, react-hot-toast; Node.js + Express ES modules, Mongoose, bcrypt, jsonwebtoken, Zod, helmet, cors, express-rate-limit, safe input sanitization, multer, Cloudinary SDK, optional Razorpay/Nodemailer. Framer Motion/Swiper optional. Node 22+ and npm workspaces are recommendations, not currently installed manifests.

Next.js is source-allowed, but switching requires revising deployment/env/ownership together. Do not scaffold two frontends or duplicate server routes.

## Planned repository boundaries

```text
client/
  src/
    api/                 single client and endpoint modules (Chetan)
    components/
      ui/ charts/ property/  shared components (Deepti)
    layouts/             PublicLayout, DashboardLayout (Deepti)
    pages/
      public/ investor/ errors/ (Deepti)
      auth/ broker/ profile/ notifications/ (Devang)
      admin/             (Darshit)
    hooks/               shared data/UI hooks (Deepti)
    context/AuthContext.jsx   (Devang)
    routes/
      AppRoutes.jsx      route registry (Chetan)
      ProtectedRoute.jsx RoleRoute.jsx (Devang)
    utils/formatINR.js   display formatting (Deepti)
    main.jsx            application wiring (Chetan)
server/
  src/
    app.js index.js     bootstrap and route composition (Chetan)
    config/
      db.js cloudinary.js (Dhruv)
      env.js            env validation/composition (Chetan)
    models/             all nine models (Dhruv)
    routes/ controllers/ validators/
      auth, profile, properties, broker, enquiries, notifications (Devang)
      admin, propertyAdmin, kyc (Darshit)
      investments, wallet, portfolio, transactions, uploads, publicStats (Dhruv)
    middlewares/
      auth.js role.js ownership.js (Devang)
      validate.js error.js rateLimit.js (Dhruv)
    services/
      auth.service.js profile.service.js property.service.js
      broker.service.js enquiry.service.js (Devang)
      admin.service.js kyc.service.js (Darshit)
      propertyLifecycle.service.js investment.service.js payout.service.js
      ledger.service.js wallet.service.js withdrawal.service.js
      portfolio.service.js upload.service.js notification.service.js
      publicStats.service.js (Dhruv)
    utils/              money.js ApiError.js (Dhruv)
  scripts/seed.js        (Chetan)
shared/
  constants.js errorCodes.js (Dhruv, affected-owner review)
tests/                   integration/e2e fixtures (Chetan)
```

No ownership overlap: write owner above; reviewers in collaboration. Domain-owner unit tests stay beside their modules; Chetan owns cross-module integration/e2e tests. Planned `propertyAdmin.routes.js` and `properties.routes.js` share a URL prefix but not a source file. Chetan composes them without changing endpoint paths. Feature owners do not simultaneously edit app/route registry/package manifests.

## Authentication and authorization

Registration -> bcrypt -> persisted user -> JWT with sub/role/sessionVersion/exp -> in-memory client token -> role dashboard. Requests load current user; verify isActive/sessionVersion and use persisted role, not stale claim alone. Ownership middleware rejects foreign broker assets; services revalidate relevant mutable business state inside the transaction.

Logout increments sessionVersion and clears browser caches. Password change/reset also invalidates all access sessions. P0 reload requires login under D2; P2 refresh uses secure/httpOnly/sameSite cookie and separately approved rotation/revocation storage. If cookies are introduced, credentialed CORS/CSRF protection must be designed together.

## Property flow

Devang's draft service creates/edits validated broker/admin drafts. Dhruv's lifecycle service validates/guards submission, approval, rejection, acquisition and cancellation. Darshit's admin controllers call it; no second status machine. Public listing queries only LIVE/FUNDED. Analytics is broker scoped before query/aggregation.

## Investment transaction

Auth/validation -> idempotency lookup -> session -> LIVE/cap/KYC/availability -> conditional property increment -> serialized wallet debit -> Investment insert -> FUNDED transition and broker commission if final -> enabled notification persistence -> commit -> success.

Unique-key races are resolved by the agreed replay/conflict mapping; bounded MongoDB transient retries must re-read eligibility. Never perform gateway/email network requests inside retryable financial transactions. Final-block losers receive current remaining-unit information.

## Wallet/ledger flow

Wallet is derived from ledger, with a transactionally synchronized user cache. All money writes go through `ledger.post(..., session)`. The helper serializes on user walletVersion, validates availability/reservations, inserts positive immutable entry and updates cache. All participating services pass the same session.

Payment order -> trusted provider/signed mock proof -> verified order -> unique TOPUP ledger credit. Pending withdrawal creation/release also writes the user's serialization guard, even when no ledger row is posted. Admin approval calls Dhruv's withdrawal service rather than editing balance.

## Payout flow

Read-only pure preview -> admin confirmation -> current-fee check -> conditional HOLDING transaction -> aggregate holdings -> exact fee/shares/remainder -> unique Payout -> ledger credits -> per-row EXITED/payoutAmount -> SOLD -> commit. Preview and execution call one calculation helper. Platform FEE and broker COMMISSION use internal accounting owners, not investor permissions.

## KYC and uploads

Upload validates size/MIME/content -> server Cloudinary adapter -> MediaDTO with server-verifiable ownership metadata -> private dummy KYC submission or public property attachment. Investor KYC -> PENDING -> admin queue from `/admin/users?kycStatus=PENDING` -> approved/rejected state. Investment service applies enabled KYC gate regardless of frontend.

KYC media uses authenticated delivery, not public image URLs. No real identity data in fixtures. Property media/document URLs are public disclosures. Production upload deletion/cleanup must not break attachments.

## Admin and shared surfaces

Admin user/settings services are owned by Darshit; core transitions/sales/refunds/withdrawals delegate to Dhruv. Devang owns auth/profile/broker/enquiry/notification endpoints; Deepti owns shared/Investor UI; Chetan integrates all endpoint modules and registries. Dashboard aggregates use definitions in API design, not independent frontend formulas.

## Deployment

Browser -> Vercel/Netlify static client -> Render/Railway HTTPS Express -> Atlas replica set. Server alone talks to Cloudinary, Razorpay test/mock and mail provider. Frontend bundles only `VITE_` public configuration. Restrict CORS to CLIENT_URL; secrets remain server-side environment variables.

Build/seed/health commands are planned in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), not runnable until package manifests exist. Fail visibly for missing secrets or transaction readiness. Seed is an explicit operator action, never automatic on production startup. See the deployment document for env and readiness checks.

## Error and side-effect policy

Services throw ApiError codes; central middleware emits one envelope and sanitized logs. Retry only classified transient transaction errors, not arbitrary failures. Notification documents may commit in the transaction; mail dispatch follows commit with explicit delivery error reporting. Do not emit success before commit. Do not catch provider failures and substitute mock data.
