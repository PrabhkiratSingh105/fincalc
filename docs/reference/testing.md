# Testing guide

- Run `npm test` for CRA/Jest tests. Calculator tests import engines directly.
- Required calculator result keys: `summary`, `steps`, `assumptions`, `charts`, `yearlyTable`, `insights`, `pdfData`.
- Add regression tests for formula changes, zero/invalid boundaries, depletion behavior, rate/expense/inflation effects, and any portfolio projection behavior changed.
- Use exact numeric expectations only for stable formula examples; otherwise test relationships/invariants.
- Manually verify desktop/mobile calculator flow, dark theme charts, PDF export, shared config load, and authenticated persistence when touching those areas.
