# Security boundaries

- Secrets remain server-only: `SUPABASE_URL`/`PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `BASE_URL`. Never expose the service-role key in React or docs examples.
- Express hashes passwords with PBKDF2-SHA256 (120,000 iterations), stores a SHA-256 session-token hash, and accepts bearer tokens. One session hash exists per user.
- Auth is enforced server-side by `requireAuth`; retain it for all user-specific writes/reads. Client context/localStorage is not authorization.
- Validate sizes/types/allow-lists at the server boundary. Existing limits: JSON body 20 KB; username `[a-z0-9_]{3,24}`; password minimum 8.
- Public config sharing intentionally exposes a named calculator configuration; public portfolio shares are slug-based. Keep sensitive user data out of either payload.
- Supabase access is service-role from the server. Review schema/RLS and API input validation together for database changes.
