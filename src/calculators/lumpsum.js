import { fvLumpsum } from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

export function calculate(inputs) {
  const amount = parseNum(inputs.amount, 1000000);
  const years = parseNum(inputs.years, 10);
  const rate = parseNum(inputs.ratePercentage, 12) / 100;
  const taxRate = parseNum(inputs.taxRate, 12.5) / 100;
  const inflation = parseNum(inputs.inflation, 6) / 100;

  const futureValue = fvLumpsum(amount, rate, years);
  const gain = Math.max(0, futureValue - amount);
  const taxable = Math.max(0, gain - 125000);
  const taxAmount = taxable * taxRate;
  const postTaxValue = futureValue - taxAmount;
  const inflationAdjusted = postTaxValue / Math.pow(1 + inflation, years);
  const profitLoss = inflationAdjusted - amount;

  const rows = [];
  const fvSeries = [];
  const postTaxSeries = [];
  const inflAdjSeries = [];
  const labels = [];

  for (let yr = 0; yr <= years; yr++) {
    const fv = fvLumpsum(amount, rate, yr);
    const yrGain = Math.max(0, fv - amount);
    const yrTax = Math.max(0, yrGain - 125000) * taxRate;
    const postTax = fv - yrTax;
    const inflAdj = postTax / Math.pow(1 + inflation, yr);
    rows.push([
      yr,
      formatINR(Math.round(amount)),
      formatINR(Math.round(fv)),
      formatINR(Math.round(postTax)),
      formatINR(Math.round(inflAdj)),
    ]);
    labels.push(yr === 0 ? 'Start' : `Year ${yr}`);
    fvSeries.push(Math.round(fv));
    postTaxSeries.push(Math.round(postTax));
    inflAdjSeries.push(Math.round(inflAdj));
  }

  return {
    summary: [
      { label: 'Inflation-Adjusted (post-tax)', value: formatINR(Math.round(inflationAdjusted)), tone: 'primary', sub: "Today's rupees" },
      { label: 'Post-Tax Value', value: formatINR(Math.round(postTaxValue)), sub: 'Nominal at maturity' },
      { label: 'Amount Invested', value: formatINR(Math.round(amount)) },
      { label: 'Capital Gain', value: formatINR(Math.round(gain)) },
      { label: 'Tax on Gains', value: formatINR(Math.round(taxAmount)), sub: 'After ₹1.25L LTCG exemption' },
      { label: 'Real Profit/Loss', value: formatINR(Math.round(profitLoss)), tone: profitLoss >= 0 ? 'success' : 'danger' },
    ],
    steps: [
      `Future Value = P × (1 + r)^n = ${formatINR(amount)} × (1 + ${formatPercent(rate * 100)})^${years} = ${formatINR(Math.round(futureValue))}`,
      `Capital gain = FV − P = ${formatINR(Math.round(gain))}`,
      `Taxable gain = max(0, gain − ₹1,25,000) × ${formatPercent(taxRate * 100)} = ${formatINR(Math.round(taxAmount))}`,
      `Post-tax value = ${formatINR(Math.round(postTaxValue))}`,
      `Inflation-adjusted = post-tax / (1 + ${formatPercent(inflation * 100)})^${years} = ${formatINR(Math.round(inflationAdjusted))}`,
    ],
    assumptions: [
      'Lumpsum invested at start; compound return applied annually',
      `LTCG tax with ₹1.25 lakh exemption at ${formatPercent(taxRate * 100)}`,
      `Inflation ${formatPercent(inflation * 100)} p.a. for real value comparison`,
      'Does not account for expense ratio or market volatility',
    ],
    charts: [
      {
        title: 'Growth Over Time',
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Inflation-Adjusted (post-tax)', data: inflAdjSeries },
            { label: 'Post-Tax Nominal', data: postTaxSeries, borderDash: [6, 4] },
            { label: 'Pre-Tax FV', data: fvSeries, borderDash: [3, 3] },
          ],
        },
        height: 280,
      },
      {
        title: 'Maturity Breakdown',
        type: 'doughnut',
        data: {
          labels: ['Invested', 'Returns (after tax)', 'Tax'],
          datasets: [{ data: [Math.round(amount), Math.round(gain - taxAmount), Math.round(taxAmount)] }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      title: 'Year-by-Year Projection',
      columns: ['Year', 'Invested', 'Pre-Tax FV', 'Post-Tax', 'Inflation-Adj.'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        `${formatINR(amount)} grows to ${formatINR(Math.round(postTaxValue))} post-tax in ${years} years.`,
        `In today's rupees, that's worth ${formatINR(Math.round(inflationAdjusted))}.`,
      ],
      mistakes: [
        'Ignoring inflation makes nominal returns look better than real purchasing power.',
        'Forgetting LTCG exemption overstates tax on smaller gains.',
      ],
      tips: [
        'Equity lumpsum works best for 7+ year horizons to ride out volatility.',
        'Compare post-tax, inflation-adjusted returns against FD or debt alternatives.',
      ],
      formula: 'FV = P × (1 + r)^n  |  Post-tax = FV − tax  |  Real = Post-tax / (1 + i)^n',
      example: '₹10L at 12% for 10 years → ~₹31L pre-tax, ~₹27L post-tax (12.5% LTCG), ~₹15L in today\'s rupees at 6% inflation.',
      inflation: `At ${formatPercent(inflation * 100)} inflation, ${formatINR(Math.round(postTaxValue))} feels like ${formatINR(Math.round(inflationAdjusted))} today.`,
      tax: `Tax applies on gains above ₹1.25L only. Taxable portion: ${formatINR(Math.round(taxable))}.`,
    }),
    pdfData: {
      title: 'Lumpsum Investment Report',
      summary: [
        { label: 'Invested', value: formatINR(Math.round(amount)) },
        { label: 'Post-Tax', value: formatINR(Math.round(postTaxValue)) },
        { label: 'Inflation-Adjusted', value: formatINR(Math.round(inflationAdjusted)) },
      ],
      tables: [{ title: 'Yearly Projection', columns: ['Year', 'Invested', 'Pre-Tax FV', 'Post-Tax', 'Inflation-Adj.'], rows }],
    },
    raw: { amount, futureValue, postTaxValue, inflationAdjusted, gain, taxAmount, profitLoss },
  };
}
