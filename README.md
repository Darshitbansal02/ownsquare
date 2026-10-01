# OwnSquare

**One property. Many owners.** An academic fractional real estate investment portal for Admin, Broker and Investor roles.


**Current status:** P0/P1 application modules are implemented on `features/full-stack-auth-broker` using real MongoDB/authentication and transactional financial writes. Automated financial acceptance passes. Browser and external-provider acceptance are recorded in the [continuation handoff](docs/P0_P1_IMPLEMENTATION.md). There is no deployment.

Implementation boundaries and integration exports: [Auth + Broker handoff](docs/AUTH_BROKER_HANDOFF.md). Shared design decisions remain recommendations for team review; this implementation does not record other members' approval.

## Team

| Member | Responsibility | GitHub username | Roll number |
|---|---|---|---|
| Dhruv | Backend Lead: models, investment, payouts, ledger, transaction integrity | `<dhruv-github>` | `<roll-number>` |
| Deepti | Frontend Lead: UI/design system, public and investor pages, layouts | `<deepti-github>` | `<roll-number>` |
| Devang | Full-Stack Auth + Broker: JWT/RBAC, auth and broker modules | `<devang-github>` | `<roll-number>` |
| Darshit | Full-Stack Admin: reviews/users/KYC/withdrawals/sale UI | `<darshit-github>` | `<roll-number>` |
| Chetan | Integration + QA: API wiring, seed/tests/deploy/README | `<chetan-github>` | `<roll-number>` |

Ownership, dependencies and merge gates: [COLLABORATION.md](COLLABORATION.md).

## Live Links

| Deliverable | Placeholder |
|---|---|
| Frontend | `<frontend-live-url>` |
| Backend | `<backend-live-url>` |
| API health | `<backend-live-url>/health` |
| Postman/Swagger | `<verified-api-documentation-url>` |

Do not interpret these placeholders as deployments.

## Tech Stack

Implemented: React/Vite, React Router, TanStack Query, scoped CSS and accessible SVG charts; Express, Mongoose/MongoDB replica set, Zod, bcrypt/JWT, Cloudinary, optional Nodemailer and signed academic mock payments. The lockfile pins the installed dependency graph. No Tailwind/shadcn, Recharts or live gateway is claimed.

## Features

**Implemented P0:** three-role auth/RBAC; draft-to-sale property lifecycle; searchable marketplace/detail/calculator; atomic investments and funding commission; wallet/append-only ledger; investor portfolio; admin sale/exact payouts; broker/admin dashboards and user management.

**Implemented P1:** optional password reset, private dummy KYC/gate, cumulative ownership cap, reserved withdrawals, enquiries and transactional in-app notifications. Real Cloudinary and SMTP checks require operator credentials. P2 refresh rotation follows P0/P1 acceptance; rent/secondary market/audit/dark mode are separate future work.

Scope/acceptance: [PRD.md](PRD.md). Primary authority: [source problem statement](docs/PS1_Fractional_Real_Estate_Investment_Portal.md).

## Architecture

Frontend -> one API client -> routes/middleware -> controllers -> services -> Mongoose -> MongoDB replica set.

Server is authoritative for all money and ownership. Integer paise, one ledger service, conditional inventory updates, wallet serialization, transactional rollback and unique payout/payment/idempotency constraints.

[ARCHITECTURE.md](ARCHITECTURE.md) | [DATABASE.md](DATABASE.md) | [BUSINESS_RULES.md](BUSINESS_RULES.md) | [CONTRACTS.md](CONTRACTS.md)

## Local Setup

Use Node 22+ compatible with the lockfile (tested Node 24.12) and a MongoDB replica set. Cloudinary is needed for media attachment/submission and the comprehensive seed; SMTP is required only when password reset is enabled.

Planned prerequisites: approved Node 22+/npm, transaction-capable Atlas/local replica set, configured Cloudinary; test/mock payment configuration.

```powershell
git clone https://github.com/DevangMittal23/OwnSquare.git
Set-Location .\OwnSquare
if (!(Test-Path .\client\.env)) { Copy-Item .\client\.env.example .\client\.env }
if (!(Test-Path .\server\.env)) { Copy-Item .\server\.env.example .\server\.env }
# Set MONGO_URI, distinct generated JWT_SECRET and MOCK_PAYMENT_SECRET,
# Cloudinary credentials and strong SEED_* passwords. SMTP is optional.
# Set SEED_MEDIA_DIR to three owned dummy images (JPG/PNG/WebP).
npm ci
npm run seed --workspace server
npm run dev --workspace server
```

Second terminal, repository root:

```powershell
npm run dev --workspace client
```

Local frontend http://localhost:5173; backend http://localhost:5000; API `/api/v1`. Match CLIENT_URL to the browser origin. `seed` creates eight academic accounts and eight property states with reconciling financial history. It preserves existing accounts/passwords/settings and never drops a database. `seed:auth` remains an account-only alternative. Newly registered brokers require administrator approval.

Checks: `npm test`, `npm run lint`, `npm run build`. The integration suite downloads MongoDB on its first run and starts an isolated local replica set; it never uses your configured database. Test doubles cover SMTP delivery and Cloudinary transport only, not auth or MongoDB. Real-provider verification needs operator credentials. Client tokens are held in memory: reloading requires sign-in, per D2.

## Environment Variables

[client/.env.example](client/.env.example) contains the public API URL only. [server/.env.example](server/.env.example) documents runtime/database/JWT/CORS, Cloudinary, signed mock payments, initial fee/cap settings, P1 gates, mail and seed configuration. PAYMENT_PROVIDER accepts `mock` only; unsupported adapters fail startup.

Complete inventory: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Never commit filled env files or put server secrets in VITE_ variables. Empty secrets are intentional.

## Test Credentials

Run `seed` to create these fictional identities with your operator-supplied passwords:

| Role | Planned email | Password supplied by operator |
|---|---|---|
| Admin | admin@demo.com | `<SEED_ADMIN_PASSWORD>` |
| Broker | rohit@demo.com | `<SEED_BROKER_PASSWORD>` |
| Investor | aman@demo.com | `<SEED_INVESTOR_PASSWORD>` |

The full seed also creates other-broker@demo.com and investors priya@demo.com, karan@demo.com, isha@demo.com and neha@demo.com. Use strong local demo passwords; never reuse real account passwords. Existing passwords are preserved on rerun.

## API Documentation

- [API_DESIGN.md](API_DESIGN.md): all methods, access, requests, responses, validations and supporting endpoints.
- [docs/API_EXAMPLES.md](docs/API_EXAMPLES.md): realistic illustrative JSON, integer paise, not live responses.
- [docs/ERROR_CODES.md](docs/ERROR_CODES.md): one error catalog.
- [docs/USER_FLOWS.md](docs/USER_FLOWS.md): lifecycle/sequences.
- [Importable Postman collection](docs/OwnSquare.postman_collection.json): all 47 documented P0/P1 endpoints; set your local variables and appropriate role token.

## Seed Data

`npm run seed --workspace server` creates 8 properties: 2 partly funded LIVE, 1 FUNDED, 1 HOLDING, 1 SOLD, 1 PENDING_APPROVAL, 1 REJECTED and 1 DRAFT; 5 investors, 2 brokers and 1 admin. Financial writes run through the shared ledger/services, with labelled academic seed top-ups. The source Noida example is included; loss/rounding fixtures are verified in integration tests. The repeated-seed test confirms no duplicate financial entries.

No blanket DB reset; academic fixture scope only. [TESTING.md](TESTING.md) defines invariants.

## Known Limitations

- Real Cloudinary public/private delivery and SMTP reset email remain unverified without operator configuration. Tests replace external transports only; real DB/auth/financial flows are exercised.
- D1-D9 design choices await actual team approval; see [CONTRACTS.md](CONTRACTS.md).
- All P1 capabilities follow validated server flags. Password reset defaults to disabled until SMTP is configured; KYC, withdrawals and ownership caps default to enabled.
- No real payments, identity verification, bank transfer or guaranteed investment return.
- P2 schema/API/security additions are not implemented/finalized.

## Demo Video

`<demo-video-url>` - not recorded yet.

Required 3-5 minute journey: broker approval/listing -> admin review -> investor test top-up/20-unit purchase -> final funding/commission -> HOLDING -> INR 1.4 crore sale/INR 2,74,400 Aman payout -> portfolio/ledger. Include final-units concurrency proof with exactly one winner and one HTTP 409.

## Development and Submission

[UI_UX.md](UI_UX.md), [TESTING.md](TESTING.md), [PROMPTS.md](PROMPTS.md), [CHANGELOG.md](CHANGELOG.md). Maintain real prompt/contribution history, PR reviews, env examples, fresh setup evidence, Postman coverage and honest limitations.

**This is an academic project. No real money or securities are involved.**


