# PR Kids — controlled integration with Punta Rollers (beta)

## Verified in repository
- Both main and beta route `/kids` through the existing React app and AuthProvider.
- The beta invokes the existing `pr-kids-family-access` function with `family-home` after an authenticated session exists.
- The family projection strips unapproved post states and most unexpected fields. This is not server authorization.
- The admin screen supports reviewing applications, matching Treasury candidates, and storing review checks. It does not offer final guardian approval or account activation.
- The demo uses fictional children and sessionStorage; its publishing flow is not connected to Supabase.

## Before any live family pilot
1. Inspect the deployed Edge Function authorization for `family-home`: validate the JWT on the server, derive the guardian from the authenticated identity, require approved guardian-child links, and return only permitted children.
2. Verify the guardian-only login/activation flow and preserve existing adult credentials. Never infer parenthood from name, phone, or Treasury records.
3. Create an atomic server-side approval flow with staff authorization, audit, and consent verification. Test without real child records first.
4. Create an atomic class-post publishing API that checks staff roles, approved recipients and media consents server-side. No service role in the browser.
5. Verify attendance scanner semantics and reconcile with existing PR Kids rewards/redemptions without introducing duplicate catalogues.
6. Validate all changes in the beta preview, then deploy a separately approved production change with rollback plan.

## Guardrails
- A hidden URL is not an access control mechanism.
- Do not execute beta migrations against the production database.
- No paid Supabase branches; no new billable resources.
- Never copy or expose production minors' data to demo or previews.
- Preserve main and the existing production experience until all gates are verified.
