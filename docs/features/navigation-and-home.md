# Navigation and home

- Owner: `Header.js`, `MobileFixedHeader.js`, `Home.js`, `CategoryPage.jsx`, `App.js` routes.
- Desktop header: logo, AI route, Invest/Plan/Loans dropdown groups, theme control, account menu. Keep `NAV` as the canonical calculator-navigation list.
- Mobile: hamburger/dropdown plus fixed bottom navigation to Home, Invest, Plan, Loans, Portfolio. Account uses the auth modal or user popover.
- Category routes (`/invest`, `/plan`, `/loans`) render collections declared in `CategoryPage`; synchronize additions with Header navigation and route registration.
- Home is the curated entry screen for financial tools/portfolio planning. It is not a generic marketing landing page; favor direct calculator discovery and clear outcomes.
- New page checklist: lazy route in `App`, navigation/category decision, RouteMeta/robots/sitemap decision, and any feature documentation update.
