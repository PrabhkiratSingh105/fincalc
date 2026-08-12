# SEO

- `RouteMeta.jsx` owns titles, descriptions, Open Graph/Twitter tags, canonical URLs, and robots meta. Add public calculator routes there when adding one.
- Canonical origin: `https://planmycapital.com`. Public shared calculator URLs canonicalize to their base calculator page and are `noindex, follow`.
- `/profile`, `/custom-inflation`, and `/portfolio/*` are `noindex, follow`; keep matching restrictions in `public/robots.txt`.
- `public/sitemap.xml` lists public calculator routes. Update it with a new indexable route.
- Use concise India-specific calculator copy; do not claim personalized advice or guaranteed results.
