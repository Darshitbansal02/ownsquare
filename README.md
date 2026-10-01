# OwnSquare

**One property. Many owners.** An academic fractional real estate investment portal for Admin, Broker and Investor roles.

**Current status:** contract-first documentation only. The application, dependency manifests, seed script, tests and deployments have not been built. Setup commands below are the planned scaffold contract, not commands that work yet.

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

Proposed, pending team sign-off: React/Vite, React Router, TanStack Query, Tailwind/shadcn/ui, React Hook Form/Zod, Recharts; Node.js/Express, Mongoose/MongoDB Atlas replica set, bcrypt/JWT; Cloudinary; signed academic mock or Razorpay test mode. Next.js/Stripe remain source-allowed alternatives requiring coordinated contract changes.

## Features

**Planned P0:** three-role auth/RBAC; draft-to-sale property lifecycle; searchable marketplace/detail/calculator; atomic investments and funding commission; wallet/append-only ledger; investor portfolio; admin sale/exact payouts; broker/admin dashboards and user management.

**Planned P1:** password reset, KYC/gate, cumulative ownership cap, withdrawals, enquiries and in-app notifications. P2 refresh tokens/rent/secondary market/audit/dark mode require separate extension approval. Nothing here is claimed implemented.

Scope/acceptance: [PRD.md](PRD.md). Primary authority: [source problem statement](docs/PS1_Fractional_Real_Estate_Investment_Portal.md).

## Architecture

Frontend -> one API client -> routes/middleware -> controllers -> services -> Mongoose -> MongoDB replica set.

Server is authoritative for all money and ownership. Integer paise, one ledger service, conditional inventory updates, wallet serialization, transactional rollback and unique payout/payment/idempotency constraints.

[ARCHITECTURE.md](ARCHITECTURE.md) | [DATABASE.md](DATABASE.md) | [BUSINESS_RULES.md](BUSINESS_RULES.md) | [CONTRACTS.md](CONTRACTS.md)

## Local Setup

**Not runnable until scaffolding is implemented.** Chetan must replace this status with verified instructions after package scripts exist.

Planned prerequisites: approved Node 22+/npm, transaction-capable Atlas/local replica set, configured Cloudinary; test/mock payment configuration.

```powershell
git clone <repository-url>
Set-Location .\OwnSquare
Copy-Item .\client\.env.example .\client\.env
Copy-Item .\server\.env.example .\server\.env
# Fill local configuration and secrets.
npm install
npm run seed --workspace server
npm run dev --workspace server
```

Second terminal, repository root:

```powershell
npm run dev --workspace client
```

Planned local URLs: frontend http://localhost:5173; backend http://localhost:5000; API `/api/v1`. See [deployment/local setup](docs/DEPLOYMENT.md) for future build/start/health contracts and failure checks.

## Environment Variables

[client/.env.example](client/.env.example) contains public API URL only. [server/.env.example](server/.env.example) documents runtime/database/JWT/CORS, Cloudinary, mock/Razorpay test keys, initial fee/cap settings, P1 gates, mail and operator-supplied seed passwords.

Complete inventory: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Never commit filled env files or put server secrets in VITE_ variables. Empty secrets are intentional.

## Test Credentials

No accounts exist yet. These are proposed fictional seed identities, not working credentials:

| Role | Planned email | Password supplied by operator |
|---|---|---|
| Admin | admin@demo.com | `<SEED_ADMIN_PASSWORD>` |
| Broker | rohit@demo.com | `<SEED_BROKER_PASSWORD>` |
| Investor | aman@demo.com | `<SEED_INVESTOR_PASSWORD>` |

Seed also needs a second broker for ownership tests and at least five investors (Aman, Priya, Karan, Isha, Neha). Use strong local demo passwords; share actual academic evaluator credentials through an approved demo handoff only after seed verification, never reuse real account passwords or fabricate credentials as already provisioned.

## API Documentation

- [API_DESIGN.md](API_DESIGN.md): all methods, access, requests, responses, validations and supporting endpoints.
- [docs/API_EXAMPLES.md](docs/API_EXAMPLES.md): realistic illustrative JSON, integer paise, not live responses.
- [docs/ERROR_CODES.md](docs/ERROR_CODES.md): one error catalog.
- [docs/USER_FLOWS.md](docs/USER_FLOWS.md): lifecycle/sequences.
- Planned Postman export: `<postman-collection-path-or-url>`; Chetan owns verification/export.

## Seed Data

Planned `npm run seed --workspace server`: >=8 properties: 2 partly funded LIVE, 1 FUNDED, 1 HOLDING, 1 SOLD, 1 PENDING_APPROVAL, 1 REJECTED, 1 DRAFT; >=5 investors and two brokers for scope testing. Historical top-ups/debits/commissions/payouts must reconcile, not just decorative statuses. Include source Noida example and loss/rounding fixtures in tests.

No blanket DB reset; academic fixture scope only. [TESTING.md](TESTING.md) defines invariants.

## Known Limitations

- Documentation only; no app, dependencies, scripts, test execution, live links or video yet.
- D1-D9 design choices await actual team approval; see [CONTRACTS.md](CONTRACTS.md).
- P1 implementation availability must match server capabilities/UI; password-reset example is disabled until mail configuration exists.
- No real payments, identity verification, bank transfer or guaranteed investment return.
- P2 schema/API/security additions are not implemented/finalized.

## Demo Video

`<demo-video-url>` - not recorded yet.

Required 3-5 minute journey: broker approval/listing -> admin review -> investor test top-up/20-unit purchase -> final funding/commission -> HOLDING -> INR 1.4 crore sale/INR 2,74,400 Aman payout -> portfolio/ledger. Include final-units concurrency proof with exactly one winner and one HTTP 409.

## Development and Submission

[UI_UX.md](UI_UX.md), [TESTING.md](TESTING.md), [PROMPTS.md](PROMPTS.md), [CHANGELOG.md](CHANGELOG.md). Maintain real prompt/contribution history, PR reviews, env examples, fresh setup evidence, Postman coverage and honest limitations.

**This is an academic project. No real money or securities are involved.**
