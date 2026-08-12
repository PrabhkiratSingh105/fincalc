# Recommended AI loading combinations

Always load `00-project.md`; add only the listed files.

| Task | Load |
|---|---|
| Fix/add SIP, SWP, PPF, FD, RD, Lumpsum, CAGR | `features/investment-calculators.md`, `features/calculator-ui.md`; add `02-design-system.md` for UI |
| Fix/add retirement, goal, inflation | `features/planning-calculators.md`, `features/calculator-ui.md` |
| Loan or income-tax work | `features/loan-and-tax.md`, `features/calculator-ui.md` |
| Calculator shared layout/PDF/save flow | `features/calculator-ui.md`; add `features/reports-and-sharing.md` if relevant |
| Portfolio work | `features/portfolio.md`, `features/settings-and-theme.md`; add `features/backend.md` for public/API work |
| Login/session/profile work | `features/authentication.md`, `08-security.md`; add `features/backend.md` for endpoints |
| Backend endpoint/data work | `features/backend.md`, `08-security.md`, `reference/data-model.md` |
| Charts | `features/charts.md`, `02-design-system.md` |
| Navigation/home/category work | `features/navigation-and-home.md`, `02-design-system.md`, `07-accessibility.md` |
| Mobile/responsive UI | relevant feature doc, `02-design-system.md`, `07-accessibility.md`, `05-performance.md` |
| SEO/crawlability | `06-seo.md` only; add `features/navigation-and-home.md` for routes |
| Performance | `05-performance.md` plus owning feature doc |
| PDF/public share | `features/reports-and-sharing.md`, `08-security.md` |
| Add model-backed AI | `features/future-ai.md`, `08-security.md`, `features/backend.md` |
| Tests/formula regression | owning calculator feature, `03-coding-standards.md`, `reference/testing.md` |
| Deploy/environment | `reference/deployment.md`, `reference/environment.md`, `08-security.md` |

Do not load roadmap, marketing, deployment, database, or AI docs for ordinary calculator UI/math work.
