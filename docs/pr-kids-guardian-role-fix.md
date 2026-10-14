# PR Kids account role correctness — required fix
Current src/pages/PRKidsClub.jsx sets es_alumno:true for every authenticated user with documento. This is incorrect for guardian-only accounts. Change to Boolean(user.participaComoAlumno), preserving authenticated document and name. Verify login route and query param support before changing redirect links.
This is a release blocker for guardian-only onboarding. Do not deploy production changes until verified.
