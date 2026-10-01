# OwnSquare

**One property. Many owners.** An academic fractional real estate investment portal for Admin, Broker and Investor roles.

> **This is an academic project. No real money or securities are involved.**

## Current status

The financial backend, the authentication layer and the full frontend are merged on `main`. Automated verification passes against a real MongoDB replica set: **111 tests across 21 files**, lint clean, client builds.

**Not yet wired:** the public marketplace has no backend. `GET /properties` (list/detail) and the broker CRUD endpoints are documented but not implemented, so the marketplace, property detail and broker screens render from fixtures rather than live data. See [Known Limitations](#known-limitations) for the full honest list.

There is no deployment.

## Team

| Roll | Member | Responsibility | GitHub username |
|---:|---|---|---|
| 2415800027 | Chetan | Integration + QA: API wiring, seed/tests/deploy/README | [Chetansaraswat01](https://github.com/Chetansaraswat01) |
| 2415800028 | Darshit | Full-Stack Admin: reviews/users/KYC/withdrawals/sale UI | [Darshitbansal02](https://github.com/Darshitbansal02) |
| 2415800029 | Deepti | Frontend Lead: UI/design system, public and investor pages, layouts | [DeeptiYadav10648](https://github.com/DeeptiYadav10648) |
| 2415800030 | Devang | Full-Stack Auth + Broker: JWT/RBAC, auth and broker modules | [DevangMittal23](https://github.com/DevangMittal23) |
| 2415800031 | Dhruv | Backend Lead: models, investment, payouts, ledger, transaction integrity | [dhruvbhadhotiya](https://github.com/dhruvbhadhotiya) |

Ownership, dependencies and merge gates: [COLLABORATION.md](COLLABORATION.md).

## Live Links

| Deliverable | Status |
|---|---|
| Frontend | not deployed |
| Backend | not deployed |
| API health | `GET /health` once deployed |
| Postman collection | [docs/OwnSquare.postman_collection.json](docs/OwnSquare.postman_collection.json) (local import) |

Do not interpret this table as a deployment.

## Tech Stack

Frontend: React 19 + Vite 7, React Router 7, TanStack Query 5, Tailwind CSS 3.
Backend: Node.js + Express 5 (ES modules), Mongoose 8 against a MongoDB replica set, Zod, bcrypt, jsonwebtoken, cookie-parser, helmet, express-rate-limit, multer, Cloudinary SDK, Nodemailer.
Payments: signed academic mock gateway (Razorpay test keys are accepted by configuration but unverified).
Tests: Vitest + Supertest against `mongodb-memory-server` replica sets.

## Architecture

Frontend -> one API client -> routes/middleware -> controllers -> services -> Mongoose -> MongoDB replica set.

The server is authoritative for all money and ownership. Amounts are integer paise; `ledger.service.js` is the only writer of `Transaction` documents; wallet balances are a cache kept in step with the ledger inside the same transaction; inventory uses conditional atomic updates; payouts and cancellations run in single session transactions guarded by unique indexes.

There are **14 services and exactly one composition root** (`server/src/utils/backendServices.js`). No module writes a balance or posts a ledger row directly.

[ARCHITECTURE.md](ARCHITECTURE.md) | [DATABASE.md](DATABASE.md) | [BUSINESS_RULES.md](BUSINESS_RULES.md) | [CONTRACTS.md](CONTRACTS.md)

## Local Setup

Requires Node 22+ (verified on 24.20) and a **transaction-capable** MongoDB replica set. The server refuses to start against a standalone MongoDB, by design: financial writes depend on multi-document transactions.

```powershell
git clone https://github.com/dhruvbhadhotiya/OwnSquare.git
Set-Location .\OwnSquare
Copy-Item .\client\.env.example .\client\.env
Copy-Item .\server\.env.example .\server\.env
```

Fill `server/.env`: `MONGO_URI` (replica set), a generated `JWT_SECRET` (16+ chars) and `MOCK_PAYMENT_SECRET` (32+ chars), plus the three `SEED_*_PASSWORD` values. Fill `client/.env` with `VITE_API_BASE_URL=http://localhost:5000/api/v1`.

```powershell
npm install
npm run seed --workspace server
npm run dev --workspace server
```

Second terminal, repository root:

```powershell
npm run dev:client
```

Frontend http://localhost:5173, backend http://localhost:5000, API under `/api/v1`. `CLIENT_URL` must match the browser origin exactly.

Cloudinary is optional: without it, uploads return `503` and property publication refuses unverified media, while every other route keeps working. SMTP is required only to enable password reset.

### Checks

```powershell
npm run lint              # eslint server shared
npm run test --workspace server       # unit + integration
npm run test:integration --workspace server
npm run build             # client production build
```

The integration suite starts its own isolated replica set and never touches your configured database. External transports (SMTP, Cloudinary) are the only test doubles; authentication, MongoDB and all financial logic run for real.

## Environment Variables

[client/.env.example](client/.env.example) holds the public API URL only. [server/.env.example](server/.env.example) documents runtime, database, JWT, CORS, Cloudinary, mock payment, initial fee/cap rates, P1 feature gates, mail and seed passwords. Empty secrets are intentional; startup fails visibly on a missing or weak secret rather than falling back to a development default. Never commit a filled `.env` or place a server secret in a `VITE_` variable.

Complete inventory: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Test Credentials

These are **fictional academic demo accounts** on a throwaway demo database. They hold no money and no securities, and the same warning appears in the app footer.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.com` | `Admin@123` |
| Broker | `rohit@demo.com` | `Broker@123` |
| Broker | `other-broker@demo.com` | `Broker@123` |
| Investor | `aman@demo.com` | `Invest@123` |
| Investor | `priya@demo.com` | `Invest@123` |
| Investor | `karan@demo.com` | `Invest@123` |
| Investor | `isha@demo.com` | `Invest@123` |
| Investor | `neha@demo.com` | `Invest@123` |

```powershell
npm run seed --workspace server   # creates these accounts
```

Two accounts per role exist for isolation testing: `other-broker@demo.com` lets you check that a broker cannot reach another broker's asset, and five investors exercise the ownership cap and payout remainder rules.

**The passwords are operator-supplied, not hardcoded.** The seed reads `SEED_ADMIN_PASSWORD`, `SEED_BROKER_PASSWORD` and `SEED_INVESTOR_PASSWORD` from `server/.env` and applies the real password policy (8+ characters with a number and a symbol). Set them to the values above to reproduce this table, or choose your own — the demo passwords above are published deliberately so an evaluator can sign in, and must never be reused for a real account.

**Re-running the seed preserves existing passwords** rather than resetting them, so a half-seeded database is repaired instead of rewritten.

## Seed Data

The seed creates **8 properties** across statuses: 2 partly funded `LIVE`, 1 `FUNDED`, 1 `HOLDING`, 1 `SOLD`, 1 `PENDING_APPROVAL`, 1 `REJECTED`, 1 `DRAFT`, plus 5 investors, 2 brokers and 1 admin. It refuses to run when `NODE_ENV=production` and never drops a collection.

Every money movement is produced by the real services rather than hand-written rows, so the history reconciles by construction: mock-gateway top-ups, atomic investments with idempotency keys, broker commission credited once at funding, and the source INR 1.4 crore sale.

Verified seed output:

| Ledger entry | Count | Total (paise) |
|---|---:|---:|
| `TOPUP` credit | 5 | 3,370,000,000 |
| `INVESTMENT` debit | 19 | 3,370,000,000 |
| `COMMISSION` credit | 3 | 30,000,000 |
| `FEE` credit | 1 | 28,000,000 |
| `PAYOUT` credit | 5 | 1,372,000,000 |

The `SOLD` asset reproduces the source document exactly: fee `28,000,000`, distributable `1,372,000,000`, and payouts of `27,440,000` / `68,600,000` / `548,800,000` / `411,600,000` / `315,560,000`, summing to `1,372,000,000`.

Before reporting success the seed asserts ledger sequence order, wallet cache agreement, inventory against `unitsSold`, principal against `unitPrice`, and payout conservation. It fails loudly rather than leaving misleading data behind.

[TESTING.md](TESTING.md) defines the invariants.

## API Documentation

- [API_DESIGN.md](API_DESIGN.md): methods, access, requests, responses, validations.
- [docs/API_EXAMPLES.md](docs/API_EXAMPLES.md): illustrative JSON in integer paise.
- [docs/ERROR_CODES.md](docs/ERROR_CODES.md): single error catalog.
- [docs/USER_FLOWS.md](docs/USER_FLOWS.md): lifecycle sequences.
- [docs/OwnSquare.postman_collection.json](docs/OwnSquare.postman_collection.json): importable collection. **It was authored against the wider endpoint contract, so treat it as a work in progress: several requests target routes listed under Known Limitations below.**

## Known Limitations

Stated plainly, because a README that overclaims is worse than a short one.

- **No public property API.** `GET /properties` list and `GET /properties/:id` detail are documented but not implemented. The marketplace and property detail screens therefore have no live data source.
- **No broker module.** Broker draft CRUD, submission and analytics endpoints are not implemented; `property.service.js` does not exist on `main`. The broker screens render fixtures.
- **No enquiries, notification-read or profile endpoints**, though the frontend pages for them exist.
- **Uploads need Cloudinary.** Without credentials, `/uploads` returns `503` and publication is blocked, because media ownership cannot be verified without the provider.
- **Password reset needs SMTP** and is disabled by default. It is never faked: the endpoint reports `FEATURE_DISABLED` rather than pretending to send mail.
- **Razorpay is unverified.** `PAYMENT_PROVIDER` accepts `razorpay` and rejects non-`rzp_test_` keys, but only the signed mock path has been exercised.
- **`D1`-`D9` design decisions still await recorded team approval**, and `DATABASE.md` has been amended: refresh-token storage adds a tenth collection for `AUTH-4`.
- **No deployment, no demo video, no Postman verification against a live host.**
- No real payments, identity verification, bank transfer or guaranteed investment return. P2 rental distribution, secondary market and audit log are not implemented.

## Demo Video

`<demo-video-url>` - not recorded yet.

Required 3-5 minute journey: broker approval and listing -> admin review -> investor top-up and 20-unit purchase -> funding and commission -> `HOLDING` -> INR 1.4 crore sale with Aman's INR 2,74,400 payout -> portfolio and ledger. Must include the final-units concurrency proof: exactly one winner, one HTTP 409.

## Development and Submission

[UI_UX.md](UI_UX.md), [TESTING.md](TESTING.md), [COLLABORATION.md](COLLABORATION.md), [PROMPTS.md](PROMPTS.md), [CHANGELOG.md](CHANGELOG.md). Maintain genuine prompt and contribution history, PR reviews, env examples, fresh-setup evidence and honest limitations.

**This is an academic project. No real money or securities are involved.**
