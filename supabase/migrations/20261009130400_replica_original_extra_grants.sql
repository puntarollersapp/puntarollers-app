-- Original schema and sequence permissions; beta only.
GRANT USAGE ON SCHEMA rollermap_private TO anon, authenticated;
REVOKE ALL ON SEQUENCE public.pr_email_campaign_sends_id_seq, public.pr_email_contacts_id_seq FROM anon, authenticated;
GRANT SELECT(id) ON TABLE public.pr_inscripciones_2026 TO anon;

