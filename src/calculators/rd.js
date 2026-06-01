import { rdMaturity, fvSip, periodicRate } from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

export function calculate(inputs) {
  const monthlyDeposit = parseNum(inputs.monthlyDeposit, 5000);
  const rate = parseNum(inputs.rate, 7) / 100;
  const years = parseNum(inputs.years, 5);
  const months = years * 12;

  const maturity = rdMaturity(monthlyDeposit, rate, months);
  const totalDeposited = monthlyDeposit * months;
  const interest = maturity - totalDeposited;
  const effectiveYield = totalDeposited > 0 && years > 0
    ? (Math.pow(maturity / totalDeposited, 1 / years) - 1) * 100
    : 0;

  const rows = [];
  const corpusSeries = [];
  const investedSeries = [];
  const labels = [];

  for (let yr = 1; yr <= years; yr++) {
    const mo = yr * 12;
    const corpus = fvSip(monthlyDeposit, rate, mo);
    const invested = monthlyDeposit * mo;
    const yrInterest = corpus - invested;
    rows.push([
      yr,
      formatINR(Math.round(invested)),
      formatINR(Math.round(corpus)),
      formatINR(Math.round(yrInterest)),
    ]);
    labels.push(`Year ${yr}`);
    corpusSeries.push(Math.round(corpus));
    investedSeries.push(Math.round(invested));
  }

  const r = periodicRate(rate, 12);

  return {
    summary: [
      { label: 'Maturity Amount', value: formatINR(Math.round(maturity)), tone: 'success' },
      { label: 'Total Deposited', value: formatINR(Math.round(totalDeposited)), tone: 'primary' },
      { label: 'Interest Earned', value: formatINR(Math.round(interest)) },
      { label: 'Effective Yield', value: formatPercent(effectiveYield), sub: 'On total deposits' },
      { label: 'Monthly Deposit', value: formatINR(Math.round(monthlyDeposit)) },
    ],
    steps: [
      `Monthly deposit = ${formatINR(monthlyDeposit)} for ${years} years (${months} months)`,
      `Rate = ${formatPercent(rate * 100)} p.a.; monthly rate = ${formatPercent(r * 100, 4)}`,
      `Maturity = PMT × [((1+r)^n − 1)/r] × (1+r) = ${formatINR(Math.round(maturity))}`,
      `Total deposited = ${formatINR(Math.round(totalDeposited))}; Interest = ${formatINR(Math.round(interest))}`,
    ],
    assumptions: [
      'Recurring deposit with monthly compounding (standard RD formula)',
      'Fixed rate throughout tenure',
      'Deposits made at start of each month',
      'Pre-tax; TDS applicable per bank rules',
    ],
    charts: [
      {
        title: 'RD Growth',
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Maturity Value', data: corpusSeries },
            { label: 'Total Deposited', data: investedSeries },
          ],
        },
        height: 280,
      },
      {
        title: 'Deposits vs Interest',
        type: 'doughnut',
        data: {
          labels: ['Deposited', 'Interest'],
          datasets: [{ data: [Math.round(totalDeposited), Math.round(interest)] }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      columns: ['Year', 'Total Deposited', 'Value', 'Interest'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        `${formatINR(monthlyDeposit)}/month for ${years} years yields ${formatINR(Math.round(maturity))}.`,
        `Interest component: ${formatINR(Math.round(interest))} (${formatPercent((interest / totalDeposited) * 100)} of deposits).`,
      ],
      tips: [
        'RD instils disciplined saving — ideal for short to medium-term goals.',
        'Compare RD rates with debt mutual funds for potentially better post-tax returns.',
      ],
      formula: 'Maturity = PMT × [((1+r)^n − 1)/r] × (1+r)',
    }),
    pdfData: {
      title: 'Recurring Deposit Calculator',
      summary: [
        { label: 'Maturity', value: formatINR(Math.round(maturity)) },
        { label: 'Total Deposited', value: formatINR(Math.round(totalDeposited)) },
        { label: 'Interest', value: formatINR(Math.round(interest)) },
      ],
      tables: [{ title: 'Yearly Breakdown', columns: ['Year', 'Total Deposited', 'Value', 'Interest'], rows }],
    },
    raw: { monthlyDeposit, maturity, totalDeposited, interest, effectiveYield, months },
  };
}
