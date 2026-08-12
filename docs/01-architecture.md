# Architecture

- Browser: `src/index.js` mounts `App`; providers nest Theme → Auth → Settings → AI → Router.
- Routing: `App.js` lazy-loads non-home pages under one `Suspense` and error boundary. `Header`/`MobileFixedHeader`, `RouteMeta`, and range-slider sync are app-wide.
- Calculator flow: page field schema/defaults → `useCalculatorPage` state/memoization/share-load/PDF import → pure `src/calculators/<name>.js` → `CalculatorLayout` → lazy `ChartPanel`.
- API: `server.js` serves the built SPA/static assets and Express `/api/*`; browser fetches use `src/config.js` `API` base URL.
- Persistence: Express uses Supabase service-role access to JSONB-backed user settings, saved configs, history, and public shares. See `features/backend.md` and `reference/data-model.md`.
- Client state: Context is deliberately small: auth session, settings, theme, and an in-memory future-AI context. No Redux/query library.
- Deployment: production is a CRA `build/` served by Express; Vercel headers also cache static assets. Details: `reference/deployment.md`.
