# Charts

- Owner: `components/calculator/ChartPanel.jsx`; only calculators provide chart data.
- Supported types: line (default), bar, doughnut. Chart definition: `{title, type, data:{labels,datasets}, height?}`.
- Registered Chart.js modules and palette are centralized here. Palette order: indigo, green, amber, violet, sky, rose, slate.
- Line charts use smoothing/fill on the first dataset; tooltip and y-axis format values as INR. Doughnuts calculate value and percentage in tooltip.
- Theme-aware chart colors derive from ThemeContext. Do not pass app CSS colors ad hoc from engines.
- Keep a textual summary/table/calculation steps so the result is still understandable without the chart.
