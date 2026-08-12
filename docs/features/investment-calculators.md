# Investment calculators

- Owner engines: `sip.js`, `lumpsum.js`, `swp.js`, `ppf.js`, `fd.js`, `rd.js`, `cagr.js`; shared primitives: `utils/finance.js`.
- SIP: simple, step-up, and goal modes; monthly annuity-due compounding; optional initial lumpsum, annual step-up, expense-ratio net return, inflation, LTCG/tax and optimal yearly gain harvesting.
- Lumpsum: compounded one-time investment; net return after expense ratio; post-tax and inflation-adjusted results; LTCG exemption/tax and optional harvesting.
- SWP: grows corpus monthly then withdraws; stops when depleted; models expense ratio, tax, inflation, annual LTCG exemption, and withdrawal/depletion data.
- PPF: 15-year monthly deposits capped at ₹12,500; monthly accrual credited annually; rate/inflation inputs. Keep PPF assumptions explicit.
- FD: `P(1+r/n)^(nt)` with annual/quarterly/monthly compounding; inflation-adjusted maturity and effective annual yield.
- RD: recurring deposits with selected deposit/compounding frequencies; calculate total deposits, maturity, gains, and real value.
- CAGR: `((FV/PV)^(1/years))-1`; use only for one initial and final value, not cash flows.
- Legal/tax constants are code facts that may become stale. Treat changes as a calculator+test review, not a copy change.
