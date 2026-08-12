# Design system

- Brand: PlanMyCapital; confident, approachable Indian financial planning—never brokerage-like, alarmist, or visually noisy.
- Tokens live in `src/styles/main.css`; use CSS variables, never duplicate palette literals when a token exists.
- Fonts: body `Plus Jakarta Sans`; display `Outfit`/`Sora`; mono `JetBrains Mono`.
- Key colors: indigo `#6366F1`, green `#059669`, violet `#7C3AED`; semantic amber/rose/teal/sky. Brand gradient: indigo → violet → green.
- Surfaces: soft blue-gray background, white cards, thin `--border`, restrained `--sh`/`--sh-lg`; dark theme overrides the same tokens.
- Reuse existing classes/components (`card`, buttons, input styles, calculator layout) before adding a one-off pattern.
- Finance visuals: summary grid first, then charts/tables/details. Use `formatINR`, `formatPercent`, and `formatAxis`; do not hand-format values.
- Chart colors/order are owned by `features/charts.md`; calculator responsive behavior by `features/calculator-ui.md`.
