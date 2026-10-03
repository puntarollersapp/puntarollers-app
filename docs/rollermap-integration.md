# RollerMap in Punta Rollers

RollerMap is a native, lazy-loaded React section of Punta Rollers. `src/components/rollermap/NativeRollerMap.jsx` reuses the original map, locations, registration, detail and administrator components from `apps/rollermap/src`. It shares PR's Supabase client and router; no application iframe or second React root is rendered.

Mi PR retains its four original cards and a full-width animated RollerMap banner. Private directory and detail routes are `/app/rollermap` and `/app/rollermap/lugar/:slug`; the admin remains `/admin/rollermap`. Public routes `/rollermap` and `/rollermap/lugar/:slug` are rendered by the same PR app and preserve shared links and welcome-email URLs. The old `/rollermap/admin` link redirects to the protected admin route.

Mobile navigation is ordinary page scrolling: readable search and city/type filters, a prominent registration action, list/map controls and location cards. Registration uses a modal above PR navigation with focus containment and body scroll locking. Map rendering failures leave the list usable. Original RollerMap splash identity is retained; Halloween startup is skipped for its routes. No RollerMap service worker is registered.

Vite scopes the original RollerMap CSS to `.pr-rollermap`, preserving PR's existing Tailwind/PostCSS pipeline. The original static assets are copied to `dist/rollermap` by the main build; there is no second HTML deployment. Its public Mapbox client token is fetched from `pr_rollermap_public_config` (or supplied by `VITE_MAPBOX_TOKEN`).

## Migration validation

36 source locations were compared field by field against 36 target locations. IDs, dates, text, coordinates, flags, statuses and contact emails match. Image URLs point at 31 copied, size-verified original images in the PR deployment. There are 32 approved, one pending and three disabled records. No source data or deployment was deleted.

Emails are private in `pr_rollermap_contacts`. RLS exposes approved locations publicly and permits management only to PR admins. Anonymous registration creates pending locations through a narrow RPC. SQL transaction tests confirmed public visibility of 32 places, admin access to all 36, safe registration defaults, and one queued welcome after two approvals. Every test fixture was rolled back.

## Welcome emails

`supabase/functions/pr-rollermap-admin/index.ts` is deployed on the PR Supabase project with JWT verification and a server-side admin role check. It reuses the existing `RESEND_API_KEY`. Sender, subject and introduction are in `pr_rollermap_email_config`, editable from the RollerMap admin view. Approvals atomically queue a welcome in `pr_rollermap_welcome`; the function then sends it with a stable Resend idempotency key. Original approved locations are not emailed by the migration.

`sent` records mean Resend accepted the message, not that inbox delivery was verified. Failed attempts can be retried from the admin panel. Ambiguous attempts outside the safe idempotency window require manual review. Preview never sends an email. Existing PR email campaigns are unaffected.

## Transition

The old RollerMap remains online as a fallback and still writes to its original database. New registrations on the old site after this snapshot must be reconciled before retiring or redirecting that site. Existing RollerMap admin accounts are not imported; management uses the PR administrator account.

## Previous browser validation and remaining checks

The Vercel preview build passed. Browser checks confirmed 32 public results, search filtering, original splash, place details and image/contact links, and registration steps without sending a registration. The cloud browser does not support WebGL; the directory and registration now remain available with a clear map fallback instead of a blank screen. Interactive map rendering on a WebGL-capable device, mobile layout, the authenticated shared admin session, and actual welcome-email delivery remain to be checked. SQL role and approval tests passed; no real welcome was sent.

## Native integration validation

Main app build passed; emitted RollerMap CSS was checked for global body/html/root leakage and PR Tailwind compilation was preserved. Native Vercel preview checks confirmed zero application iframes, a 518px content width without horizontal overflow, 32 public places, search reducing Punta to three results, detail image/contact links and return navigation, and all three registration steps without sending a record. The dialog remained within the viewport, locked background scrolling and restored focus on Escape. Map fallback retained the directory in this browser without WebGL. Authenticated private/admin navigation and an actual welcome delivery were not exercised in this browser session. No database schema or existing welcome-email sending logic changed.

## Domain cutover (prepared, not activated)

`rollermap.app` is attached to the original RollerMap Vercel project. The proposed change in `rollermap-domain-cutover.patch` adds reversible 307 redirects to PR's public directory and matching place pages, an admin redirect, a fallback transition page, and a retirement service worker for the previously installed offline app. The former source code and database remain preserved. The original service worker is not registered by the new build.

Source reconciliation on 2026-10-03: all 36 source records match the exported migration snapshot (excluding date serialization only); no new records or edits need importing. The target has 36 records.

The transition build passed locally. Activation is blocked: the RollerMap GitHub connector rejects writes to `PuntaRollers/rollermap` with HTTP 403 `Resource not accessible by integration`, despite the account having repo admin permissions. Vercel's direct deployment tool is unavailable. Grant the connector write access to this repository, then apply the patch and verify root, place and admin redirects plus `/sw.js` before considering the domain unified. The domain is still serving the original deployment until that step is completed.

## Directory refinements

Search ignores diacritics; filter/type/city/view state is stored in URL query parameters and restored when returning from place detail. Image thumbnails load lazily. Public navigation provides PR branding and a sign-in entry instead of anonymous profile/sign-out buttons. Connection failures expose retry; empty results provide filter reset. Approved locations without coordinates remain visible in the list (map markers still require valid coordinates). No data or approval/email logic is altered.
