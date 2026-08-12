# Planning calculators

- Owner engines: `retirement.js`, `goalSip.js`, `inflation.js`; custom weighted profile UI: `CustomInflationCalculator.jsx` + Settings context.
- Retirement projects current expenses to retirement via inflation, estimates corpus through retirement/life expectancy, considers existing savings/SIP and return assumptions, and derives a bounded readiness score. It is a heuristic.
- Goal SIP inflates today’s target, grows existing investments at net return (return after expense ratio), then calculates required monthly SIP and alternative present lumpsum. Its goal probability is explicitly a heuristic.
- Inflation projects future cost and present purchasing power using the supplied annual rate and years.
- Custom inflation uses saved category rows `{id, percentage, rate}` and a default inflation rate. It is settings data, not a separate backend entity.
- Planning output must label assumptions and avoid definitive advice; preserve calculations’ educational framing.
