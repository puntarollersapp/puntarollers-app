# PR NEXT beta verification — 2026-10-09

Status: NOT COMPLETE. No production changes made. GitHub main and original Vercel project remain outside mutation scope.

Beta database: azheisnfaedjqcuhiylo. Original read-only catalog source: ycgxnzeaihuwlwfwalom.

Restored the exact original definitions of 149 public functions and 6 private functions. Their definition hashes, signatures and normalized EXECUTE ACLs matched production. Original column definitions, identities, constraints, indexes, RLS settings, 200 public policies, 44 storage policies, 15 bucket configurations, 33 local triggers and 10 sequences matched. Table grants matched; original MAINTAIN privileges and the anonymous registration ID column privilege were restored separately. No production records, storage objects or secrets were copied. The 12 non-personal training task templates were copied with locally generated IDs.

Excluded three outbound SQL functions: notify_new_clinica_sept_2026, notify_new_pr_inscripcion, pr_run_strava_background_sync. Excluded the two corresponding email triggers. No net or cron extension was installed.

Nine original Edge Functions were restored into beta with an exact SUPABASE_URL guard and Preview CORS: actualizar-pin-usuario, pr-tesoreria-montos, pr-tesoreria-alumnos, pr-kids-family-access, pr-access-admin, pr-access-request, pr-personal-public, pr-rollermap-admin, public-ranking. Resend credentials are explicitly unavailable in restored sources. Payment, webhook, Strava synchronization and outgoing email functions remain undeployed. Beta treasury reminders and enforcement are disabled. No external sends or payments were performed.

API verification: 33/33 checks passed; see replica-verification-results.json and scripts/verify-replica.mjs. Confirmed login, refresh, confirmed synthetic Auth users, access request/import/activation, friendship request/accept, messages, outsider denial, posts, comments, reactions, shared albums, synthetic PNG upload (HTTP 200), internal notifications/read markers, own profile editing, blocked role escalation, blocked admin action for student, treasury sync, Kids request/list, and anonymous denial of private dashboard RPC.

Additional SQL tests ran only in beta, with ROLLBACK: 12 completed training tasks produced 12 public checks and 100% progress; direct student result insertion was rejected by original RLS. An admin performance sample was visible in the calculated view. A simulated treasury monthly payment produced estado=pagado and one local ledger movement. Anonymous registration v4 returned ok=true. Anonymous Kids redemption v2 created a synthetic reservation. These tests produced no retained financial transaction or real personal data.

Build: npm run build succeeded, 222 modules, 7.49 seconds. Existing bundle-size and mixed-import warnings remain; no design changes were made. Frontend remains the same seven isolation edits from commit 3d4fa16506a6c87e6c36554e2e3eb74ff487bcb8.

Pending: gestionar-usuario-auth source retrieval failed repeatedly with MCP -32603 ProtocolError (internal tool error), so it has not been substituted or deployed. Other external-effect modules intentionally remain disabled; email-admin read/preview and simulations have not been fully restored/tested. Current browser opened public Home and Login, but its secure authentication attempt ended with user_took_over and /app redirected to /login. Private visual navigation, console/network validation, treasury-role permissions and full module coverage remain unverified. The previous visual test is insufficient to certify the restored backend. Do not declare Block 1 complete.

Migration batches were applied exclusively to beta. The large access migration was interrupted before application and then applied as nine smaller equivalent table batches plus friendship access. Local migration files capture the equivalent idempotent final SQL.
