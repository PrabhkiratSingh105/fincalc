# Backend API

- Owner: `server.js`; API base is `REACT_APP_API_URL` or same origin.
- Auth: `POST /api/auth/signup|login|logout`, `GET /api/auth/me`.
- User data: `GET|PUT /api/settings`; `GET|POST /api/history`, `DELETE /api/history/:id`; `GET|POST /api/configs/:page`, `PUT|DELETE /api/configs/:page/:id`.
- Sharing: `POST /api/public-configs`, `GET /api/public-configs/:page/:username/:configName`; `POST /api/public-portfolios`, `GET /api/public-portfolios/:slug`.
- History permits only `sip`, `swp`, `lumpsum`, `emi`, `fd`, `rd`, is capped at 50 items, and stores title/summary/inputs JSON.
- Public calculator config pages are allow-listed in `VALID_PUBLIC_PAGES`; config key/value types are normalized. Keep allow-lists synchronized with routes/features.
- API errors use `{message}`; browser code should call `parseApiResponse`. Serve API before SPA fallback.
