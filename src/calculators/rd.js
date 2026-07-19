import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

const FREQUENCY_MAP = {
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

function calculateRecurringValue(payment, annualRate, years, paymentsPerYear, compoundingPerYear) {
  const periods = Math.round(years * paymentsPerYear);
  if (periods <= 0) return 0;

  const effectiveAnnualRate = Math.pow(1 + annualRate / compoundingPerYear, compoundingPerYear) - 1;
  const periodic = Math.pow(1 + effectiveAnnualRate, 1 / paymentsPerYear) - 1;

  if (periodic === 0) return payment * periods;
  return payment * ((Math.pow(1 + periodic, periods) - 1) / periodic) * (1 + periodic);
}

function frequencyLabel(value) {
  if (value === 'quarterly') return 'quarter';
  if (value === 'yearly') return 'year';
  return 'month';
}

export function calculate(inputs) {
  const monthlyDeposit = parseNum(inputs.monthlyDeposit, 5000);
  const rate = parseNum(inputs.rate, 7) / 100;
  const inflation = parseNum(inputs.inflation, 6) / 100;
  const years = parseNum(inputs.years, 5);
  const depositFrequency = inputs.depositFrequency || 'monthly';
  const compoundingFrequency = inputs.compoundingFrequency || 'monthly';
  const paymentsPerYear = FREQUENCY_MAP[depositFrequency] || 12;
  const compoundingPerYear = FREQUENCY_MAP[compoundingFrequency] || 12;
  const paymentAmount =
    depositFrequency === 'yearly' ? monthlyDeposit * 12 : depositFrequency === 'quarterly' ? monthlyDeposit * 3 : monthlyDeposit;
  const totalPeriods = years * paymentsPerYear;

  const maturity = calculateRecurringValue(paymentAmount, rate, years, paymentsPerYear, compoundingPerYear);
  const totalDeposited = paymentAmount * totalPeriods;
  const inflationAdjustedMaturity = maturity / Math.pow(1 + inflation, years);
  const interest = maturity - totalDeposited;
  const effectiveYield = totalDeposited > 0 && years > 0 ? (Math.pow(maturity / totalDeposited, 1 / years) - 1) * 100 : 0;

  let inflationAdjustedDeposited = 0;
  for (let period = 1; period <= totalPeriods; period += 1) {
    inflationAdjustedDeposited += paymentAmount / Math.pow(1 + inflation, (totalPeriods - period + 1) / paymentsPerYear);
  }

  const rows = [];
  const corpusSeries = [];
  const investedSeries = [];
  const labels = [];

  for (let year = 1; year <= years; year += 1) {
    const elapsedPeriods = year * paymentsPerYear;
    const corpus = calculateRecurringValue(paymentAmount, rate, year, paymentsPerYear, compoundingPerYear);
    const invested = paymentAmount * elapsedPeriods;
    let inflAdjInvested = 0;

    for (let period = 1; period <= elapsedPeriods; period += 1) {
      inflAdjInvested += paymentAmount / Math.pow(1 + inflation, (elapsedPeriods - period + 1) / paymentsPerYear);
    }

    rows.push([
      year,
      formatINR(Math.round(invested)),
      formatINR(Math.round(inflAdjInvested)),
      formatINR(Math.round(corpus)),
      formatINR(Math.round(corpus - invested)),
      formatINR(Math.round(corpus / Math.pow(1 + inflation, year))),
    ]);

    labels.push(`Year ${year}`);
    corpusSeries.push(Math.round(corpus));
    investedSeries.push(Math.round(invested));
  }

  const effectiveAnnualRate = Math.pow(1 + rate / compoundingPerYear, compoundingPerYear) - 1;
  const periodic = Math.pow(1 + effectiveAnnualRate, 1 / paymentsPerYear) - 1;

  return {
    summary: [
      { label: 'Maturity Amount', value: formatINR(Math.round(maturity)), tone: 'success' },
      { label: 'Nominal Deposited', value: formatINR(Math.round(totalDeposited)), tone: 'primary' },
      { label: 'Inflation-Adjusted Deposited', value: formatINR(Math.round(inflationAdjustedDeposited)), sub: "Today's purchasing power" },
      { label: 'Inflation-Adjusted Maturity', value: formatINR(Math.round(inflationAdjustedMaturity)), sub: "Today's rupees" },
      { label: 'Interest Earned', value: formatINR(Math.round(interest)) },
      { label: 'Effective Yield', value: formatPercent(effectiveYield), sub: 'On total deposits' },
      { label: 'Recurring Contribution', value: formatINR(Math.round(paymentAmount)), sub: `Every ${frequencyLabel(depositFrequency)}` },
    ],
    steps: [
      `${depositFrequency} contribution = ${formatINR(paymentAmount)} for ${years} years (${totalPeriods} installments)`,
      `Rate = ${formatPercent(rate * 100)} p.a.; effective periodic rate = ${formatPercent(periodic * 100, 4)}`,
      `Maturity = PMT x [((1+r)^n - 1)/r] x (1+r) = ${formatINR(Math.round(maturity))}`,
      `Nominal deposited = ${formatINR(Math.round(totalDeposited))}; inflation-adjusted deposited = ${formatINR(Math.round(inflationAdjustedDeposited))}`,
    ],
    assumptions: [
      `Recurring deposit with ${depositFrequency} contributions`,
      `Compounding frequency set to ${compoundingFrequency}`,
      'Fixed rate throughout tenure',
      'Deposits made at the start of each contribution period',
      'Pre-tax; TDS applicable per bank rules',
      `Inflation adjustment uses ${formatPercent(inflation * 100)} p.a.`,
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
      columns: ['Year', 'Nominal Deposited', 'Inflation-Adj. Deposited', 'Value', 'Interest', 'Inflation-Adj. Value'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        `${formatINR(paymentAmount)} every ${frequencyLabel(depositFrequency)} for ${years} years yields ${formatINR(Math.round(maturity))}.`,
        `Interest component: ${formatINR(Math.round(interest))} (${formatPercent((interest / totalDeposited) * 100)} of deposits).`,
      ],
      tips: [
        'RD builds savings discipline for short and medium-term goals.',
        'You can now compare monthly, quarterly, and yearly funding patterns with the same baseline amount.',
      ],
      formula: 'Maturity = PMT x [((1+r)^n - 1)/r] x (1+r)',
    }),
    pdfData: {
      title: 'Recurring Deposit Calculator',
      summary: [
        { label: 'Maturity', value: formatINR(Math.round(maturity)) },
        { label: 'Nominal Deposited', value: formatINR(Math.round(totalDeposited)) },
        { label: 'Inflation-Adjusted Deposited', value: formatINR(Math.round(inflationAdjustedDeposited)) },
        { label: 'Interest', value: formatINR(Math.round(interest)) },
      ],
      tables: [{ title: 'Yearly Breakdown', columns: ['Year', 'Nominal Deposited', 'Inflation-Adj. Deposited', 'Value', 'Interest', 'Inflation-Adj. Value'], rows }],
    },
    raw: {
      monthlyDeposit,
      paymentAmount,
      maturity,
      totalDeposited,
      inflationAdjustedDeposited,
      inflationAdjustedMaturity,
      interest,
      effectiveYield,
      totalPeriods,
      depositFrequency,
      compoundingFrequency,
    },
  };
}
