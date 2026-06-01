import { cagr as calcCagr, fvLumpsum } from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

export function calculate(inputs) {
  const initial = parseNum(inputs.initial, 100000);
  const finalValue = parseNum(inputs.final, 250000);
  const years = parseNum(inputs.years, 5);

  const cagrRate = calcCagr(initial, finalValue, years);
  const absoluteReturn = finalValue - initial;
  const absoluteReturnPct = initial > 0 ? (absoluteReturn / initial) * 100 : 0;
  const multiplier = initial > 0 ? finalValue / initial : 0;

  const rows = [];
  const growthSeries = [];
  const labels = [];

  for (let yr = 0; yr <= years; yr++) {
    const value = initial * Math.pow(1 + cagrRate, yr);
    rows.push([
      yr,
      formatINR(Math.round(initial)),
      formatINR(Math.round(value)),
      formatINR(Math.round(value - initial)),
      formatPercent(cagrRate * 100),
    ]);
    labels.push(yr === 0 ? 'Start' : `Y${yr}`);
    growthSeries.push(Math.round(value));
  }

  return {
    summary: [
      { label: 'CAGR', value: formatPercent(cagrRate * 100), tone: cagrRate >= 0 ? 'success' : 'danger' },
      { label: 'Initial Value', value: formatINR(Math.round(initial)) },
      { label: 'Final Value', value: formatINR(Math.round(finalValue)) },
      { label: 'Absolute Return', value: formatINR(Math.round(absoluteReturn)), sub: formatPercent(absoluteReturnPct) },
      { label: 'Multiplier', value: `${multiplier.toFixed(2)}x`, sub: 'Final / Initial' },
    ],
    steps: [
      `CAGR = (Final/Initial)^(1/n) − 1`,
      `CAGR = (${formatINR(finalValue)} / ${formatINR(initial)})^(1/${years}) − 1`,
      `CAGR = ${formatPercent(cagrRate * 100)}`,
      `Absolute return = ${formatINR(Math.round(absoluteReturn))} (${formatPercent(absoluteReturnPct)})`,
    ],
    assumptions: [
      'CAGR assumes smooth compounding — actual year-on-year returns may vary',
      'Does not account for additional contributions or withdrawals',
      'Pre-tax returns',
    ],
    charts: [
      {
        title: 'Growth Curve',
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Value at CAGR', data: growthSeries },
            { label: 'Initial', data: labels.map(() => Math.round(initial)) },
          ],
        },
        height: 280,
      },
      {
        title: 'Return Breakdown',
        type: 'doughnut',
        data: {
          labels: ['Principal', 'Gains'],
          datasets: [{
            data: [
              Math.round(Math.min(initial, finalValue)),
              Math.round(Math.max(0, absoluteReturn)),
            ],
          }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      columns: ['Year', 'Initial', 'Value', 'Gain', 'CAGR'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        `Your investment grew at ${formatPercent(cagrRate * 100)} CAGR over ${years} years.`,
        `${formatINR(initial)} became ${formatINR(Math.round(finalValue))} — a ${multiplier.toFixed(2)}x multiplier.`,
      ],
      tips: [
        'Compare CAGR against inflation and benchmark indices for context.',
        'Longer holding periods smooth out volatility in CAGR measurement.',
      ],
      formula: 'CAGR = (FV/PV)^(1/n) − 1',
      example: '₹1L → ₹2L in 5 years = 14.87% CAGR',
    }),
    pdfData: {
      title: 'CAGR Analysis',
      summary: [
        { label: 'CAGR', value: formatPercent(cagrRate * 100) },
        { label: 'Absolute Return', value: formatINR(Math.round(absoluteReturn)) },
        { label: 'Multiplier', value: `${multiplier.toFixed(2)}x` },
      ],
      tables: [{ title: 'Growth Curve', columns: ['Year', 'Initial', 'Value', 'Gain', 'CAGR'], rows }],
    },
    raw: { cagr: cagrRate, absoluteReturn, absoluteReturnPct, multiplier, projectedFinal: fvLumpsum(initial, cagrRate, years) },
  };
}
