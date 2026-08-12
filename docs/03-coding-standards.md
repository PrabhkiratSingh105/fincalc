# Coding standards

- Use functional React components, hooks, named constants, and existing local import style. Keep current `.js`/`.jsx` conventions for nearby files.
- Prefer pure calculation functions and immutable updates. Parse user numeric input with `parseNum`/`toNumber`; format only at presentation boundaries.
- Calculator engines export `calculate(inputs)` and must retain the shared result shape tested in `src/calculators/__tests__/calculators.test.js`.
- Pages declare `FIELDS`, `DEFAULTS`, optional `SECTIONS`, then pass them through `useCalculatorPage` and `CalculatorLayout`.
- Put reusable domain math in `src/utils/finance.js`; cross-calculator UI in `components/calculator/`; do not duplicate either.
- Use `API` from `src/config.js` and `parseApiResponse` for backend calls. Send bearer tokens only through authenticated flows.
- Preserve existing user-facing vocabulary, INR formatting, and educational disclaimers. Update the owning docs when behavior or public contract changes.
