# Deployment

- Development: `npm run dev` runs Express on 3001 and CRA on 3000 with proxying. Production: `npm run build`, then `npm start` (Express serves `build/`).
- Express falls back to `public/index.html` if build output is absent, but production should build first.
- `vercel.json` mirrors static/favion cache headers; Express owns SPA fallback and equivalent caching when serving production.
- Before release: configure required environment values, build, test calculators, check API/auth/share paths, inspect noindex pages and sitemap for route changes.
