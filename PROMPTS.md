# Development Prompt Log

Maintain during development: the hackathon evaluates prompt history and team understanding. Record genuine prompts, results and tests only; do not backfill fabricated historical prompts. This is an empty template, not evidence of implemented features.

Copy the following block for each real prompt; replace `Prompt ID` with a sequential identifier such as `P-001`. Dates are ISO dates; link resulting PR/commit in Notes when available.

## Prompt ID

Owner: `<team member>`

Date: `<YYYY-MM-DD>`

Feature: `<requirement ID and feature>`

Prompt:

```text
<Exact prompt or clearly marked faithful excerpt; redact secrets/private identity data.>
```

Files changed: `<actual repository paths, or none>`

Result: `<actual outcome, including incomplete work or failures>`

Tests: `<actual commands and results, or not run with reason>`

Notes: `<design decisions, review, integration impacts, PR/commit, lessons for viva>`

---

Do not mark a generated response as working until its owner can explain it and relevant checks pass. Important contract changes also need [COLLABORATION.md](COLLABORATION.md) approval, not just a prompt log entry.

## P-001

Owner: Devang (AI-assisted implementation)

Date: 2026-10-01

Feature: AUTH-1/2/3, PROP-1/3/4, BRK-1, ENQ-1, NOTIF-1; shared profile/password

Prompt:

```text
i am Devang . implement my part as per the documents.
```

Additional explicit scope authorization: when asked whether to preserve ownership boundaries or create the missing minimum shared foundation, Devang selected “Also create the minimum shared foundation”. No approval from other team members is inferred.

Files changed: Devang server routes/controllers/validators/services/middleware and client auth/broker/profile/notification modules, user-authorized shared foundation/manifests/lockfile/models/bootstrap/API client, README and docs/AUTH_BROKER_HANDOFF.md. Existing product/API/schema/business contracts and source specification remain unchanged.

Result: runnable auth + broker branch using real MongoDB, real server authorization, owned partial drafts/submission/analytics, enquiries, notifications and optional SMTP reset. Other owners' financial/admin/public UI modules remain pending. No deployment, commit, push or PR created.

Tests: npm test passed 14 checks (9 server including real replica-set integration; 5 client). npm run lint and npm run build passed. Real API Chrome smoke passed login failure/success, partial draft saves and server unit price, profile, notification empty state, logout, unapproved broker state and reload requiring sign-in. Login/signup/wizard layout checked at 360/768/1440 pixels. Production npm audit reports 0 vulnerabilities after updating Nodemailer. Real Cloudinary/SMTP need operator credentials; integration tests substitute only their external transport.

Notes: integration signatures, ownership handoff, provisional D1/D2/D7/D8 choices and remaining limitations are documented in docs/AUTH_BROKER_HANDOFF.md. Frontend design evaluation passed using the available model; no different-provider evaluation was available.
