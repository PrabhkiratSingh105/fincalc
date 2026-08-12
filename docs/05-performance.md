# Performance rules

- Preserve route-level `React.lazy` in `App.js`; lazy-load optional/heavy features (charts/PDF/analytics) as currently done.
- Calculator computation belongs in `useMemo` through `useCalculatorPage`; keep engines deterministic and avoid network work on input changes.
- `ChartPanel` is lazy; do not import Chart.js into unrelated routes.
- Analytics/Clarity load only when opt-in environment flags exist; Clarity waits for idle time.
- Static build assets use immutable one-year caching; favicon uses one week; HTML remains no-cache. Keep cache behavior aligned in Express and `vercel.json`.
- Avoid rendering detailed tables, charts, and explanation sections on mobile unless the existing calculator UX explicitly enables them.
