# Devang: auth and broker handoff

Implemented on `features/full-stack-auth-broker`. User Devang explicitly authorized the minimum shared foundation because the repository had documentation only. No other team member's approval or contribution is inferred. D1/D2/D7/D8 recommendations are used provisionally without changing endpoint/DTO contracts; team review remains a merge gate.

## Implemented scope

- Auth register/login/logout/me; bcrypt cost 12, 15-minute HS256 access JWT with issuer/audience, in-memory client token. Persisted user role/isActive/sessionVersion enforced on every protected request. Logout and password change/reset invalidate existing sessions.
- Profile name/phone; compare-and-set password changes; hashed expiring one-use reset tokens with SMTP gated by PASSWORD_RESET_ENABLED. Delivery failures are explicit, no raw token in API/log output.
- Public property listing/detail APIs; escaped literal search, allowlisted filters/sort, stable pagination. Draft/pending/rejected detail visible only to owner/admin; published history remains public.
- Broker/admin partial drafts, exact whole-rupee division, guarded transactional edits and submission with complete fields and >=3 verified images. Pending review is locked; rejected drafts resubmit and clear reason. Publication, acquisition, cancellation and sale are not implemented here.
- Broker owner-scoped dashboard/funding/investor aggregates and commission ledger reads. No financial writes or wallet endpoints.
- Participant-only enquiry creation/list/replies; reply notification commits within the transaction via the single notification service. Recipient-only paginated notification reads/idempotent mark-read.
- Cloudinary property uploads: MIME/signature checks, 5 MB maximum, uploader owner/purpose metadata verified when attached. Missing provider config returns an explicit 503. Real Cloudinary attachment must be checked with operator credentials; test fixtures substitute only this external transport.
- Full React auth/broker/profile/notification pages, reusable five-step wizard, protected/role routes, capability gates, accessible labels/errors, Indian money formatting, loading/empty/error/success. React state/request fencing and cache clearing prevent previous-account data reuse.

## Shared foundation created with permission

Workspaces/manifests/lockfile, Vite/Express bootstrap, central API client/route registry, shared constants/errors, environment validation/security/error/validation middleware, MongoDB readiness, User/Property/Investment/Transaction/Enquiry/Notification models and a submission-only lifecycle service. No duplicate ledger, payout, investment or complete status machine is introduced. Dhruv should take over shared models, lifecycle/notification/upload services; Chetan should take over bootstrap/manifests/client wiring. No production auth or database mock exists.

`propertyLifecycle.service.js` currently exports `submitProperty(user, id, verifyMedia)` only. Expand this shared service for admin/financial transitions rather than adding another state machine. Property edits/submission increment `version`; future investment/lifecycle writes must guard and update the same document within their transaction. `notification.service.js` exports `postNotification(event, session)` and is the single event insertion path. Financial services must pass their own session. Investment and Transaction models exist for read-side analytics and future integration, not as proof those financial services exist.

## Server exports

`createApp(env, {mailer?, uploadService?})` composes routes; production uses real Nodemailer/Cloudinary. Routes: `authRoutes(env, mailer?)`, `profileRoutes(env)`, `propertiesRoutes(env, verifyMedia)`, `brokerRoutes(env)`, `enquiriesRoutes(env)`, `notificationsRoutes(env)`. Middleware: `authenticate(env, {optional?})`, `requireRole(...roles)`, `requireApprovedBroker`, `requireOwnership`. `req.user` is the persisted current User; `req.property` is owner-scoped. Validated input is in `req.validated.body/query/params` (Express 5 query is read-only).

Error middleware handles ApiError with the canonical envelope and sanitizes unexpected failures. Keep one middleware chain; wrong-role checks precede resource lookup. `ApiError(code, message, details=[])` sets canonical HTTP status. `ROLES` and other enums are shared value maps. Central API client unwraps data, propagates error details, captures bearer synchronously for logout and only clears current-account sessions on UNAUTHORIZED (not INVALID_CREDENTIALS).

Frontend route/API/provider map: [FRONTEND_HANDOFF](../client/src/pages/auth/FRONTEND_HANDOFF.md). Central Routes keys only the protected subtree by `sessionKey`; login forms retain credential errors.

## Local configuration and limitations

Follow the implemented section in README. `JWT_SECRET` must be a strong generated value at least 32 chars, `JWT_EXPIRES_IN=15m`, `CLIENT_URL` an exact frontend origin. Replica set required; startup initializes unique indexes. Default auth rate limit: 30 requests per 15 minutes per IP. Hosting proxy trust must be configured by Chetan before deployment. Cloudinary credentials are optional for partial drafts but required for upload/verified media. SMTP configuration is required only when password reset is enabled.

`npm run seed:auth --workspace server` is a narrow, non-destructive academic account seed, not the source-required comprehensive eight-property/five-investor financial seed. It refuses production and preserves existing accounts. Admin/broker fixture approval is seed data; the real admin approval UI/API remains Darshit's module. Public/investor/admin application pages are explicitly shown as integration pending. No deploy/PR/push is part of this implementation.

Source docs describing future modules remain plans. Do not claim the complete application is finished when only this module is ready. Feature capabilities advertise KYC/withdrawals/ownership cap as false; their owners must implement/validate those services and synchronize the server flags before enabling them.

## Verified evidence (2026-10-01)

- `npm test`: 14 passing checks: 9 server checks, including isolated real MongoDB replica-set integration, and 5 client checks. Covers admin signup denial, normalized duplicate races, hashes, current-user role/activation/session invalidation, logout/password/reset replay, partial drafts/whole-rupee division/completeness/rejection resubmission, foreign broker refusal, real analytics/marketplace filters, enquiry participants/notification isolation, feature gates and upload role/approval/size/MIME/dependency failures.
- `npm run lint` and `npm run build`: passed. Production dependency `npm audit --omit=dev`: zero vulnerabilities after using patched Nodemailer 10.
- Real-API Chrome smoke: credential error remains visible, successful role login, partial wizard draft persistence, server-derived unit price, profile update, notifications empty state, logout, pending broker restriction and fresh login after reload; no browser exceptions. Wizard widths 360/768/1440 do not overflow. Public login/signup visual checks at those widths also passed.
- Design evaluation passed with the available model. Different-provider evaluation was unavailable. Populated funding/notification UI and real Cloudinary/SMTP require further integration verification; server analytics and notification behavior were verified with real database fixtures.
- Browser smoke scripts/screenshots live in the session temporary directory; permanent runnable security checks are adjacent to their owned source modules. No production fixture credentials, secret files or generated builds are tracked.
