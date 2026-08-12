# Calculator UI

- Owner: `CalculatorLayout.jsx`, `useCalculatorPage.js`, calculator pages, `SavedConfigsPanel.jsx`.
- Each page defines field metadata/default values and passes inputs, results, PDF handler, save/load callbacks to the shared layout. Do not rebuild calculator chrome per page.
- `useCalculatorPage` merges changed defaults without overwriting user edits, loads a public named configuration from route params, memoizes results, and dynamically imports PDF export.
- Engine output drives featured summary cards, optional charts, desktop-only tables/details/insights, and PDF content. Preserve the contract in `03-coding-standards.md`.
- Save/load configurations are authenticated and page-keyed; public links use `/calculator/:username/config/:configName`.
- Desktop uses simultaneous input/results panels. On mobile: input panel and saved configs → “Find” → output view; show charts but suppress tables/details. Global range syncing supports filled sliders and mobile handling.
- Tax-gain-harvesting explanatory modal is SIP-specific presentation content.
