# Folder ownership

- `src/pages/`: route-level views and calculator field schemas.
- `src/calculators/`: pure financial engines; `__tests__/` validates their contract/formulas.
- `src/components/`: shared shell/UI; `components/calculator/` is calculator presentation; `components/ai/` is future AI UI.
- `src/context/`: auth, settings, theme, AI in-memory providers.
- `src/hooks/`: shared page behavior; `hooks/ai/` prepares navigation context.
- `src/utils/`: finance, formatting, API parsing, sharing, portfolio projections, PDF export, mobile slider behavior.
- `src/styles/`: global, calculator, mobile-header, and AI CSS.
- `server.js`: API and SPA server; `supabase-schema.sql`: database schema; `public/`: crawl/static assets; `build/`: generated output—do not manually edit.
- `docs/`: modular AI context, not product runtime content.
