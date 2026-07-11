import { annualReturnAfterExpense, fvLumpsum } from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

const LTCG_EXEMPTION_LIMIT = 125000;

export function calculate(inputs) {
  const amount = parseNum(inputs.amount, 1000000);
  const years = parseNum(inputs.years, 10);
  const rate = parseNum(inputs.ratePercentage, 12) / 100;
  const expenseRatio = parseNum(inputs.expenseRatio, 0) / 100;
  const taxRate = parseNum(inputs.taxRate, 12.5) / 100;
  const inflation = parseNum(inputs.inflation, 6) / 100;
  const netRate = annualReturnAfterExpense(rate, expenseRatio);

  const futureValue = fvLumpsum(amount, netRate, years);
  const grossFutureValue = fvLumpsum(amount, rate, years);
  const expenseDrag = Math.max(0, grossFutureValue - futureValue);
  const gain = Math.max(0, futureValue - amount);
  const taxable = Math.max(0, gain - LTCG_EXEMPTION_LIMIT);
  const taxAmount = taxable * taxRate;
  const postTaxValue = futureValue - taxAmount;
  const inflationAdjusted = postTaxValue / Math.pow(1 + inflation, years);
  const profitLoss = inflationAdjusted - amount;

  const rows = [];
  const fvSeries = [];
  const postTaxSeries = [];
  const inflAdjSeries = [];
  const labels = [];

  for (let yr = 0; yr <= years; yr += 1) {
    const fv = fvLumpsum(amount, netRate, yr);
    const yrGain = Math.max(0, fv - amount);
    const yrTax = Math.max(0, yrGain - LTCG_EXEMPTION_LIMIT) * taxRate;
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
      { label: 'Tax on Gains', value: formatINR(Math.round(taxAmount)), sub: 'After Rs1.25L LTCG exemption' },
      { label: 'Expense Ratio Cost', value: formatINR(Math.round(expenseDrag)), sub: 'Estimated drag versus gross return' },
      { label: 'Real Profit/Loss', value: formatINR(Math.round(profitLoss)), tone: profitLoss >= 0 ? 'success' : 'danger' },
    ],
    steps: [
      `Net annual return after expense ratio = ${formatPercent(netRate * 100)}`,
      `Future Value = P x (1 + net r)^n = ${formatINR(amount)} x (1 + ${formatPercent(netRate * 100)})^${years} = ${formatINR(Math.round(futureValue))}`,
      `Capital gain = FV - P = ${formatINR(Math.round(gain))}`,
      `Taxable gain = max(0, gain - Rs1,25,000) x ${formatPercent(taxRate * 100)} = ${formatINR(Math.round(taxAmount))}`,
      `Post-tax value = ${formatINR(Math.round(postTaxValue))}`,
      `Inflation-adjusted = post-tax / (1 + ${formatPercent(inflation * 100)})^${years} = ${formatINR(Math.round(inflationAdjusted))}`,
    ],
    assumptions: [
      'Lumpsum invested at start; compound return applied annually after expense ratio',
      `LTCG tax with Rs1.25 lakh exemption at ${formatPercent(taxRate * 100)}`,
      `Inflation ${formatPercent(inflation * 100)} p.a. for real value comparison`,
      'Expense ratio compounds annually before tax',
      'Does not account for market volatility',
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
          labels: ['Invested', 'Returns (after tax)', 'Tax', 'Expense'],
          datasets: [{ data: [Math.round(amount), Math.max(0, Math.round(gain - taxAmount)), Math.round(taxAmount), Math.round(expenseDrag)] }],
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
        `${formatINR(amount)} grows to ${formatINR(Math.round(postTaxValue))} post-tax in ${years} years after ${formatPercent(expenseRatio * 100)} expense ratio.`,
        `In today's rupees, that's worth ${formatINR(Math.round(inflationAdjusted))}.`,
      ],
      mistakes: [
        'Ignoring inflation makes nominal returns look better than real purchasing power.',
        'Ignoring expense ratio understates long-term fee drag.',
      ],
      tips: [
        'Equity lumpsum works best for 7+ year horizons to ride out volatility.',
        'Compare post-tax, inflation-adjusted returns against FD or debt alternatives.',
      ],
      formula: 'Net r = (1 + return) x (1 - expense ratio) - 1  |  FV = P x (1 + net r)^n',
      example: 'Rs10L at 12% for 10 years can compound meaningfully, but tax, inflation, and expense ratio reduce the final usable value.',
      inflation: `At ${formatPercent(inflation * 100)} inflation, ${formatINR(Math.round(postTaxValue))} feels like ${formatINR(Math.round(inflationAdjusted))} today.`,
      tax: `Tax applies on gains above Rs1.25L only. Taxable portion: ${formatINR(Math.round(taxable))}.`,
    }),
    pdfData: {
      title: 'Lumpsum Investment Report',
      summary: [
        { label: 'Invested', value: formatINR(Math.round(amount)) },
        { label: 'Post-Tax', value: formatINR(Math.round(postTaxValue)) },
        { label: 'Inflation-Adjusted', value: formatINR(Math.round(inflationAdjusted)) },
        { label: 'Expense Ratio Cost', value: formatINR(Math.round(expenseDrag)) },
      ],
      tables: [{ title: 'Yearly Projection', columns: ['Year', 'Invested', 'Pre-Tax FV', 'Post-Tax', 'Inflation-Adj.'], rows }],
    },
    raw: { amount, futureValue, grossFutureValue, postTaxValue, inflationAdjusted, gain, taxAmount, expenseDrag, expenseRatio, profitLoss },
  };
}
