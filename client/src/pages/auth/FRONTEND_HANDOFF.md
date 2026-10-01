# Devang frontend handoff

The pages use React, React Router and one injected API client. No transport, mock data, shared models, global routes or shared UI were introduced here. All page style rules are scoped under `.dv-page` and are imported by `DevangUI.jsx`.

## Provider and guards

`AuthContext.jsx` default exports `AuthProvider({ api, queryClient, constants, features?, children })`; named export `AuthContext`. `useAuth.js` default exports the context hook. The context exposes `api`, `constants`, `features`, `featuresLoading`, `featuresError`, `user`, `accessToken`, `sessionKey`, `loading`, `sessionError`, `login`, `register`, `logout`, `refreshUser`, `clearSession`.

Pass the canonical constants from `shared/constants.js`. `ROLES`, `PROPERTY_TYPES`, `PROPERTY_STATUS` may be value maps or arrays for selection lists. `PROPERTY_STATUS` is normally a value map. Capabilities are fetched from `api.platform.stats()` once per provider, or supplied by the same server-derived configuration.

`ProtectedRoute({ children? })` uses an Outlet when no child is supplied, preserves the attempted internal path and redirects to `/login`. `RoleRoute({ roles, children? })` additionally redirects wrong roles to `/403`. Use `roles={[constants.ROLES.BROKER]}` (or the equivalent canonical array value). Server authorization remains required.

**Key the protected application subtree with `sessionKey`** to reset all transient forms/replies on identity changes. The provided resource hook independently discards previous identity requests and never renders a previous identity's cached result. Auth mutations use a generation fence to discard superseded sign-ins/current-user responses. Access tokens are stored in React memory only; reload intentionally requires login. Expired JWTs clear memory and private query caches. Logout and password change clear the query client with `queryClient.clear()`.

## Route export map

| Route | Default module | Protection |
| --- | --- | --- |
| `/login` | `pages/auth/Login.jsx` | Public |
| `/signup` | `pages/auth/Signup.jsx` | Public |
| `/forgot-password` | `pages/auth/ForgotPassword.jsx` | Public, passwordReset gate |
| `/reset/:token` | `pages/auth/ResetPassword.jsx` | Public, passwordReset gate |
| `/profile` | `pages/profile/Profile.jsx` | ProtectedRoute |
| `/notifications` | `pages/notifications/Notifications.jsx` | ProtectedRoute, notifications gate |
| `/broker` | `pages/broker/BrokerDashboard.jsx` | BROKER |
| `/broker/properties` | `pages/broker/BrokerProperties.jsx` | BROKER |
| `/broker/properties/new` | `pages/broker/BrokerPropertyForm.jsx` | BROKER |
| `/broker/properties/:id/edit` | `pages/broker/BrokerPropertyForm.jsx` | BROKER |
| `/broker/properties/:id` | `pages/broker/BrokerPropertyDetail.jsx` | BROKER |

`features/broker/PropertyWizard.jsx` default export accepts `{ mode='broker', propertyId?, onSaved?, onSubmitted? }`. Admin can reuse with `mode='admin'`. It uses the same create/edit/submit API and never sets lifecycle/computed fields. Its containing page should use `.dv-page` or `Page` to scope the styling. `pages/broker/EnquiryThreads.jsx` can also render participant threads with an optional propertyId, without a second transport.

## Exact API assumptions

All methods return the success envelope's unwrapped `data`. Failures throw an object with `message`, `code`, `details`, `status`; details are `{field,message,value?}[]`. The central client must call `onUnauthorized` subscribers for session expiry/inactive/revoked-session errors, then discard the token. Wrong current password and incorrect login credentials must remain visible on their forms.

`api.setAccessToken(token|null)` is synchronous. `api.onUnauthorized(callback)` returns an unsubscribe function. `api.auth.logout()` captures the current bearer token synchronously when invoked, before its first await; the context clears memory and query caches immediately after starting the request.

Auth methods: `register({name,email,phone,password,role})`, `login({email,password})` -> `{user,accessToken,expiresIn}`; `logout()` -> `{loggedOut}`; `me()` -> current `UserDTO`; `updateProfile({name,phone})` -> UserDTO; `changePassword({currentPassword,password})` -> `{changed}`; `forgotPassword({email})` -> `{requested}`; `resetPassword(token,{password})` -> `{reset}`.

Property methods: `properties.detail(id)` -> PropertyDTO; `create(body)`, `update(id,body)`, `submit(id)` -> PropertyDTO; `investors(id,{page,limit,sort:'-units'})` -> page of masked `{investorId,displayName,units,amount,ownershipPct}`. Draft fields match API_DESIGN; empty fields are omitted for new drafts and `null` clears previously supplied nullable draft fields. Empty image/document arrays are valid drafts. Money is positive safe-integer paise; whole-rupee derived unit prices are validated exactly with BigInt. Partial valuation/totalUnits drafts may save independently. Submit enforces all required fields and >=3 images on the server.

`broker.properties({page,limit,sort,search?,status?,city?})` -> page plus `{stats:{propertiesListed,liveProperties,fundedProperties,totalRaised,commissionEarned},fundingSeries:[{propertyId,points:[{date,amount}]}]}`. Funding series must cover authorized listings independently of page size, as the dashboard and property detail consume it. Investors and enquiries are always scoped by the server before pagination.

`uploads.create(file,'property')` -> `{url,publicId,name}` with owned, server-verified Cloudinary metadata. UI MIME/5 MB checks are only immediate feedback; server verifies content and ownership. PDF uploads attach as documents; supported image uploads attach as images. Successful uploads are attached on the next draft save; abandoned asset cleanup belongs to the upload service.

`enquiries.list({page,limit,sort:'-updatedAt',propertyId?,status?})` -> EnquiryDTO page; `reply(id,{message})` -> EnquiryDTO. `notifications.list({page,limit,sort:'-createdAt',read?})` -> NotificationDTO page; `markRead(id)` -> NotificationDTO. `platform.stats()` -> `{features:{passwordReset,enquiries,notifications,ownershipCap,...},...}`. Disabled capabilities have explanatory states and make no gated requests.

## Verification

Run `node --test client/src/features/broker/money.test.mjs`. This checks exact monetary boundary parsing, unsafe/malformed input, whole-rupee unit division, partial drafts, identity generations and role-safe return paths. Integration/build/visual checks require the parent-provided runnable scaffold and real API. Verified: all 4 Node tests pass, root ESLint passes and the Vite production build passes. Public login/signup were checked in system Chrome headless at 360, 768 and 1440 px: no horizontal overflow and show/hide password controls work. Screenshots were inspected for mobile and tablet layout. These public UI checks are not end-to-end backend proof; the parent integration run owns real API broker/auth smoke testing.
