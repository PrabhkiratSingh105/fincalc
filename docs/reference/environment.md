# Environment and configuration

- Backend requires `SUPABASE_URL` or `PUBLIC_SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`; placeholder values cause startup failure.
- Optional backend `BASE_URL` builds absolute public-share URLs when no request origin is supplied.
- Frontend `REACT_APP_API_URL` overrides same-origin API base.
- Optional frontend flags: `REACT_APP_CLARITY_PROJECT_ID`; `REACT_APP_ENABLE_VERCEL_INSIGHTS=true`.
- `.env` is parsed manually by `server.js` when present. Do not commit secrets; keep service-role values server-only.
