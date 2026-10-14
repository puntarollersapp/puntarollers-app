# PR Kids — verified production integration blockers (2026-10-13)

Read-only inspection of deployed Supabase function pr-kids-family-access (version 19) and public table columns.

## Confirmed
- Edge function is deployed with JWT verification.
- Actions: request, family-home, treasury-candidates, review-save, approval-validate, approval-preview, review-readiness, review-history, request-detail, list, reject.
- **There is no approve/activate action**. approval-validate returns approval_enabled:false.
- family-home reads active guardian and approved guardian-child links; it returns only linked children.
- pr_kids_guardians supports auth_user_id, adult_profile_id, estado.
- pr_kids_children supports treasury_profile_id (text); profiles.id is text.
- pr_kids_guardian_children has family_request_id, approved_at, approved_by.
- profiles has participa_como_alumno, auth_user_id, role and acceso_habilitado.

## Blocking problems
1. Edge CORS origin allowlist includes puntarollers.com, www.puntarollers.com and localhost:5173, **not Vercel preview domains**. Browser calls from beta previews may fail. Do not weaken production CORS to wildcard.
2. Existing adult can be authenticated and mapped to profiles.auth_user_id. Guardian-only onboarding requires separate secure credentials; do not create synthetic auth accounts without a reviewed credential flow.
3. Family activation must run in one transaction: revalidate admin and request status, latest review checks, verified child IDs, exact existing profile reuse, guardian auth identity; create/reuse child and guardian rows; approve each link; mark request approved; log audit. Race-safe and idempotent.
4. No implicit duplicate merging based solely on name; only suggest unique candidates and require admin confirmation.
5. PR Check attendance stamp bridge requires actual scanner table/column contract; do not insert synthetic stamps.
6. Do not mark paid in Treasury automatically.

## Required release sequence
- Create a separate test backend or explicitly approved production rollout; first capture a backup and migration review.
- Implement and test transactional activation with server-side authorization and retries.
- Add admin approval UI only after the backend action is confirmed available.
- Verify guardian-only account onboarding, family isolation, child profiles and Treasury payment status.
- Verify PR Check integration and class posts/media consent.
- Run a test-family walkthrough and then authorize production release.

No production database writes or Edge Function deployments were made during this inspection.
