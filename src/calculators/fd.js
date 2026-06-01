import { fdMaturity, compoundFrequencyRate } from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

const FREQ_LABELS = { 1: 'Annual', 4: 'Quarterly', 12: 'Monthly' };

export function calculate(inputs) {
  const principal = parseNum(inputs.principal, 100000);
  const rate = parseNum(inputs.rate, 7) / 100;
  const years = parseNum(inputs.years, 5);
  const compoundingFrequency = parseNum(inputs.compoundingFrequency, 4);
  const freq = [1, 4, 12].includes(compoundingFrequency) ? compoundingFrequency : 4;

  const maturity = fdMaturity(principal, rate, years, freq);
  const interest = maturity - principal;
  const effectiveYield = principal > 0 && years > 0
    ? (Math.pow(maturity / principal, 1 / years) - 1) * 100
    : 0;

  const rows = [];
  const balanceSeries = [];
  const labels = [];

  for (let yr = 0; yr <= years; yr++) {
    const value = fdMaturity(principal, rate, yr, freq);
    const yrInterest = value - principal;
    rows.push([
      yr,
      formatINR(Math.round(principal)),
      formatINR(Math.round(value)),
      formatINR(Math.round(yrInterest)),
      formatPercent(effectiveYield),
    ]);
    labels.push(yr === 0 ? 'Start' : `Year ${yr}`);
    balanceSeries.push(Math.round(value));
  }

  const periodicRate = compoundFrequencyRate(rate, freq);

  return {
    summary: [
      { label: 'Maturity Amount', value: formatINR(Math.round(maturity)), tone: 'success' },
      { label: 'Principal', value: formatINR(Math.round(principal)), tone: 'primary' },
      { label: 'Interest Earned', value: formatINR(Math.round(interest)) },
      { label: 'Effective Annual Yield', value: formatPercent(effectiveYield), sub: 'EAY with compounding' },
      { label: 'Compounding', value: FREQ_LABELS[freq] || `${freq}x/year` },
    ],
    steps: [
      `Principal = ${formatINR(principal)} at ${formatPercent(rate * 100)} for ${years} years`,
      `Compounding: ${FREQ_LABELS[freq]} (${freq} times/year)`,
      `A = P × (1 + r/n)^(n×t) = ${formatINR(principal)} × (1 + ${formatPercent(periodicRate * 100, 4)})^${freq * years}`,
      `Maturity = ${formatINR(Math.round(maturity))}; Interest = ${formatINR(Math.round(interest))}`,
    ],
    assumptions: [
      'Fixed deposit rate remains constant',
      'Interest compounded as per selected frequency',
      'Pre-tax returns; TDS may apply per bank rules',
      'No premature withdrawal penalty',
    ],
    charts: [
      {
        title: 'FD Growth',
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Maturity Value', data: balanceSeries },
            { label: 'Principal', data: labels.map(() => Math.round(principal)) },
          ],
        },
        height: 280,
      },
      {
        title: 'Principal vs Interest',
        type: 'doughnut',
        data: {
          labels: ['Principal', 'Interest'],
          datasets: [{ data: [Math.round(principal), Math.round(interest)] }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      columns: ['Year', 'Principal', 'Value', 'Interest', 'EAY'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        `${formatINR(principal)} grows to ${formatINR(Math.round(maturity))} in ${years} years at ${formatPercent(rate * 100)}.`,
        `${FREQ_LABELS[freq]} compounding gives ${formatPercent(effectiveYield)} effective yield.`,
      ],
      tips: [
        'Higher compounding frequency marginally increases effective yield.',
        'Compare FD rates across banks and consider tax-saver FD for 80C if needed.',
      ],
      formula: 'A = P × (1 + r/n)^(n×t)',
    }),
    pdfData: {
      title: 'Fixed Deposit Calculator',
      summary: [
        { label: 'Maturity', value: formatINR(Math.round(maturity)) },
        { label: 'Interest', value: formatINR(Math.round(interest)) },
        { label: 'EAY', value: formatPercent(effectiveYield) },
      ],
      tables: [{ title: 'Yearly Growth', columns: ['Year', 'Principal', 'Value', 'Interest', 'EAY'], rows }],
    },
    raw: { principal, maturity, interest, effectiveYield, compoundingFrequency: freq },
  };
}
