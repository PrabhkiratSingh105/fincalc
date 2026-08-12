# Portfolio

- Owner: `PortfolioLibraryPage`, `PortfolioDetailsPage`, `utils/portfolio.js`, Settings context, public-portfolio API endpoints.
- Portfolios live inside authenticated `settings.portfolios`; each has id, name, inflation flags/rate, timeline year, public-share metadata, and typed items.
- Supported item types: SIP, Loan, FD, RD, Lumpsum, PPF, SWP. An item stores a saved-config reference plus a `resolvedConfig` snapshot and start year; projections use the snapshot.
- `buildPortfolioSnapshot` aggregates one selected calendar year; `buildPortfolioProjection` creates annual net-worth series from current year to end year. Loans contribute negative net worth.
- Settings migration accepts legacy `homePortfolio`; preserve normalization in client and server when changing the data shape.
- Public portfolio publishing writes a `public_configs` row with page `portfolio` and collision-safe slug; readers use the slug endpoint. Do not include private profile data.
