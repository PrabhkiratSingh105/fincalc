# Settings and theme

- Owner: `SettingsContext.js`, `ThemeContext.js`, `ProfilePage.jsx`, `CustomInflationCalculator.jsx`.
- Theme is a UI preference exposed by `useTheme`; styles switch via global token overrides. Use existing token variables for new UI.
- Settings defaults: inflation rate 6; weighted rows essentials 50%/6, lifestyle 30%/7, healthcare 20%/8; no portfolios.
- SettingsProvider loads `/api/settings` when authenticated; otherwise defaults. Changes are normalized and debounced 350 ms before `PUT /api/settings`.
- Public/legacy portfolio fields are normalized at both client and server. Preserve forward compatibility when evolving schemas.
- Profile is the user settings surface. Its route is private/noindex (see `06-seo.md`).
