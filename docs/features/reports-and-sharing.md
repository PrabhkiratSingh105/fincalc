# Reports and sharing

- PDF owner: `utils/pdfExport.js`; client dynamically imports it after a user requests export. `downloadPdfReport` accepts title, subtitle, summary, tables, steps, assumptions.
- PDFs use jsPDF A4 points, Helvetica, generated `en-IN` timestamp, indigo table headings, and auto-table. Engines construct `pdfData`; do not duplicate report assembly in pages.
- Local URL sharing is state encoded as base64 `?s=` by `utils/share.js`; this is convenience state, not secure storage.
- Persistent public config links require login and call `POST /api/public-configs`; routes load them through `useCalculatorPage`.
- Public shares expose configuration values. Never add credentials, session data, personal profile attributes, or unreviewed sensitive fields to share state/payloads.
