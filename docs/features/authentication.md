# Authentication

- Owner: `AuthContext.js`, `AuthModal.js`, `server.js` auth routes, `users` table.
- Username/password signup/login returns `{user:{username}, token}`. Token is stored as `auth_token` in browser localStorage; AuthProvider verifies it on startup with `/api/auth/me`.
- Logout calls `/api/auth/logout` when possible, then clears memory/local storage even if the request fails.
- AuthContext owns `user`, `token`, `loading`, `login`, `signup`, `logout`; do not duplicate session state in a page.
- Backend stores password salt/hash and only a hash of the opaque bearer token. Login replaces the existing session.
- User-owned history, settings, configs, portfolio publication all require bearer auth. Security rules and validation are in `08-security.md`.
