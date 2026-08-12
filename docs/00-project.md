# PlanMyCapital: universal context

- Mission: India-focused, educational financial-planning calculators. Display currency in INR/Indian grouping; projections are estimates, not advice.
- Stack: React 18 + React Router 6 + custom CSS; Express 4 API; Supabase Postgres; Chart.js; jsPDF; CRA build. JavaScript/JSX only.
- App shape: calculators are local deterministic engines; pages are lazy-loaded React shells; authenticated user data is persisted through the API.
- Visual intent: calm, premium, data-forward planning workspace; light/dark themes; indigo–violet–green brand gradient; mobile-first usable controls.
- Keep calculator math pure in `src/calculators/`; pages only define fields/defaults and compose `CalculatorLayout` + `useCalculatorPage`.
- Preserve result contract: calculator `calculate(inputs)` returns summary, steps, assumptions, charts, yearlyTable, insights, pdfData, and raw.
- Do not hard-code secrets or treat client checks as authorization. Consult `08-security.md` for any auth/API/data change.
- Canonical knowledge: use the narrowly scoped feature document, not this file, for implementation detail.
