import { periodicRate } from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

const PPF_YEARS = 15;

export function calculate(inputs) {
  const monthlyAmount = parseNum(inputs.monthlyAmount, 12500);
  const interestRate = parseNum(inputs.interestRate, 7) / 100;
  const inflation = parseNum(inputs.inflation, 6) / 100;
  const months = PPF_YEARS * 12;
  const r = periodicRate(interestRate, 12);

  let corpus = 0;
  let deposited = 0;
  let inflationAdjustedDeposited = 0;
  const yearlyRaw = [];
  const rows = [];

  for (let mo = 1; mo <= months; mo++) {
    corpus = (corpus + monthlyAmount) * (1 + r);
    deposited += monthlyAmount;
    inflationAdjustedDeposited += monthlyAmount / Math.pow(1 + inflation, (months - mo + 1) / 12);
    if (mo % 12 === 0) {
      const yr = mo / 12;
      const interest = corpus - deposited;
      yearlyRaw.push({ year: yr, deposited, inflationAdjustedDeposited, corpus, interest });
      rows.push([
        yr,
        formatINR(Math.round(deposited)),
        formatINR(Math.round(inflationAdjustedDeposited)),
        formatINR(Math.round(corpus)),
        formatINR(Math.round(interest)),
        formatINR(Math.round(corpus / Math.pow(1 + inflation, yr))),
      ]);
    }
  }

  const interest = Math.max(0, corpus - deposited);
  const inflationAdjusted = corpus / Math.pow(1 + inflation, PPF_YEARS);
  const labels = yearlyRaw.map((d) => `Year ${d.year}`);

  return {
    summary: [
      { label: 'Maturity Amount', value: formatINR(Math.round(corpus)), tone: 'success', sub: 'Tax-free (EEE)' },
      { label: 'Nominal Deposited', value: formatINR(Math.round(deposited)), tone: 'primary' },
      { label: 'Inflation-Adjusted Deposited', value: formatINR(Math.round(inflationAdjustedDeposited)), sub: "Today's purchasing power" },
      { label: 'Interest Earned', value: formatINR(Math.round(interest)), sub: 'Fully exempt from tax' },
      { label: 'Inflation-Adjusted', value: formatINR(Math.round(inflationAdjusted)), sub: "Today's rupees" },
      { label: 'Monthly Deposit', value: formatINR(Math.round(monthlyAmount)) },
    ],
    steps: [
      `Monthly deposit = ${formatINR(monthlyAmount)} for ${PPF_YEARS} years (${months} months)`,
      `PPF uses monthly compounding: balance = (balance + deposit) × (1 + r_m)`,
      `Monthly rate = (1 + ${formatPercent(interestRate * 100)})^(1/12) − 1 = ${formatPercent(r * 100, 4)}`,
      `Total deposited = ${formatINR(Math.round(deposited))}; Interest = ${formatINR(Math.round(interest))}`,
      `Maturity = ${formatINR(Math.round(corpus))}; Real value = ${formatINR(Math.round(inflationAdjusted))}`,
    ],
    assumptions: [
      'Fixed 15-year PPF tenure as per government rules',
      'Interest rate remains constant at declared rate',
      'Deposits made monthly; max ₹1.5L/year (₹12,500/month)',
      'EEE status — exempt on deposit, accrual, and withdrawal',
    ],
    charts: [
      {
        title: 'PPF Balance Growth',
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'PPF Balance', data: yearlyRaw.map((d) => Math.round(d.corpus)) },
            { label: 'Total Deposited', data: yearlyRaw.map((d) => Math.round(d.deposited)) },
          ],
        },
        height: 280,
      },
      {
        title: 'Deposits vs Interest',
        type: 'doughnut',
        data: {
          labels: ['Deposited', 'Interest'],
          datasets: [{ data: [Math.round(deposited), Math.round(interest)] }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      title: '15-Year PPF Schedule',
      columns: ['Year', 'Nominal Deposited', 'Inflation-Adj. Deposited', 'Balance', 'Interest', 'Inflation-Adj.'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        `${formatINR(monthlyAmount)}/month for 15 years → ${formatINR(Math.round(corpus))} tax-free maturity.`,
        `Interest earns ${formatPercent((interest / deposited) * 100)} of total deposits.`,
      ],
      mistakes: [
        'Missing monthly deposits — PPF interest is calculated on lowest balance between 5th–last day.',
        'Exceeding ₹1.5L annual limit — excess is not eligible for PPF interest.',
      ],
      tips: [
        'Deposit before the 5th of each month to earn interest for that month.',
        'PPF suits long-term, risk-free allocation alongside equity SIP.',
      ],
      formula: 'Balance_m = (Balance_{m-1} + Deposit) × (1 + r_monthly)',
      example: '₹12,500/month at 7.1% for 15 years → ~₹40L maturity on ~₹22.5L deposited.',
      inflation: `Real value of maturity: ${formatINR(Math.round(inflationAdjusted))} in today's rupees.`,
      tax: 'PPF enjoys EEE tax status — no tax on interest or withdrawal.',
    }),
    pdfData: {
      title: 'PPF Calculator Report',
      summary: [
        { label: 'Maturity', value: formatINR(Math.round(corpus)) },
        { label: 'Deposited', value: formatINR(Math.round(deposited)) },
        { label: 'Interest', value: formatINR(Math.round(interest)) },
      ],
      tables: [{ title: 'Yearly Schedule', columns: ['Year', 'Nominal Deposited', 'Inflation-Adj. Deposited', 'Balance', 'Interest', 'Inflation-Adj.'], rows }],
    },
    raw: { monthlyAmount, corpus, deposited, inflationAdjustedDeposited, interest, inflationAdjusted },
  };
}
