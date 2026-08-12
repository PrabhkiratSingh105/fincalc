# AI documentation map

Read this file only to choose context; it is not a task brief. Each document owns one topic. Do not copy rules between documents—link to the owner.

| File | Purpose | Max tokens |
|---|---|---:|
| `00-project.md` | Universal task context | 450 |
| `01-architecture.md` | Runtime boundaries/data flow | 450 |
| `02-design-system.md` | Visual language/tokens | 400 |
| `03-coding-standards.md` | Implementation conventions | 400 |
| `04-folder-structure.md` | Source ownership map | 350 |
| `05-performance.md` | Loading/rendering constraints | 250 |
| `06-seo.md` | Indexing and route metadata | 250 |
| `07-accessibility.md` | Project-specific a11y checks | 250 |
| `08-security.md` | Security-sensitive boundaries | 350 |
| `features/authentication.md` | Session/account flow | 300 |
| `features/backend.md` | Express API contracts | 400 |
| `features/calculator-ui.md` | Shared calculator interaction | 400 |
| `features/charts.md` | Chart contract and rendering | 250 |
| `features/future-ai.md` | AI scaffolding/integration boundary | 350 |
| `features/investment-calculators.md` | Investment engine family | 550 |
| `features/loan-and-tax.md` | Loan/tax engine family | 450 |
| `features/navigation-and-home.md` | Navigation, categories, home | 350 |
| `features/planning-calculators.md` | Goal/retirement/inflation engines | 450 |
| `features/portfolio.md` | Portfolio projection/sharing | 500 |
| `features/reports-and-sharing.md` | PDF and public/local shares | 350 |
| `features/settings-and-theme.md` | Preferences/theme persistence | 300 |
| `reference/ai-loading.md` | Task loading matrix | 350 |
| `reference/data-model.md` | Supabase shape/indexes | 350 |
| `reference/deployment.md` | Dev/build/release flow | 250 |
| `reference/document-maintenance.md` | Anti-duplication governance | 250 |
| `reference/environment.md` | Environment variable map | 200 |
| `reference/roadmap.md` | Current/future scope | 200 |
| `reference/testing.md` | Test and verification guide | 250 |

## Loading rule

Start with `00-project.md`. Add only the feature document(s) that own the changed behavior, then one cross-cutting document when relevant. Source code remains authoritative for formulas, legal values, and API payloads; update the owning document in the same change when behavior changes.

See `reference/ai-loading.md` for task-to-document combinations and `reference/document-maintenance.md` for anti-duplication rules.
