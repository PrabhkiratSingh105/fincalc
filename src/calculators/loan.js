import { emi, periodicRate } from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

export function calculate(inputs) {
  const P = parseNum(inputs.loanAmount, 2500000);
  const rAnn = parseNum(inputs.interestRate, 8.5) / 100;
  const years = parseNum(inputs.years, 20);
  const months = years * 12;
  const r = periodicRate(rAnn, 12);
  const emiAmount = emi(P, rAnn, months);
  const totalPayment = emiAmount * months;
  const totalInterest = Math.max(0, totalPayment - P);

  let balance = P;
  const rows = [];
  const balanceSeries = [];
  const labels = [];

  for (let yr = 1; yr <= years; yr++) {
    let yrInterest = 0;
    let yrPrincipal = 0;
    for (let mo = 1; mo <= 12; mo++) {
      const monthInterest = balance * r;
      const principalPaid = Math.min(balance, emiAmount - monthInterest);
      balance = Math.max(0, balance - principalPaid);
      yrInterest += monthInterest;
      yrPrincipal += principalPaid;
    }
    rows.push([
      yr,
      formatINR(Math.round(emiAmount)),
      formatINR(Math.round(yrPrincipal)),
      formatINR(Math.round(yrInterest)),
      formatINR(Math.round(balance)),
    ]);
    labels.push(`Year ${yr}`);
    balanceSeries.push(Math.round(balance));
  }

  return {
    summary: [
      { label: 'Monthly EMI', value: formatINR(Math.round(emiAmount)), tone: 'primary', sub: 'Fixed monthly payment' },
      { label: 'Total Interest', value: formatINR(Math.round(totalInterest)), tone: 'warning' },
      { label: 'Total Payment', value: formatINR(Math.round(totalPayment)) },
      { label: 'Principal', value: formatINR(Math.round(P)) },
      { label: 'Interest Ratio', value: formatPercent((totalInterest / P) * 100), sub: 'Interest as % of principal' },
    ],
    steps: [
      `Loan amount P = ${formatINR(P)}, rate = ${formatPercent(rAnn * 100)}, tenure = ${years} years (${months} months)`,
      `Monthly rate r = (1 + ${formatPercent(rAnn * 100)})^(1/12) − 1 = ${formatPercent(r * 100, 4)}`,
      r === 0
        ? `EMI = P / n = ${formatINR(Math.round(emiAmount))}`
        : `EMI = P × r × (1+r)^n / ((1+r)^n − 1) = ${formatINR(Math.round(emiAmount))}`,
      `Total payment = EMI × ${months} = ${formatINR(Math.round(totalPayment))}`,
      `Total interest = ${formatINR(Math.round(totalPayment))} − ${formatINR(P)} = ${formatINR(Math.round(totalInterest))}`,
    ],
    assumptions: [
      'Fixed interest rate throughout tenure (reducing balance method)',
      'Equal monthly EMI with no prepayments or defaults',
      'Monthly compounding as per standard Indian loan practice',
    ],
    charts: [
      {
        title: 'Outstanding Balance',
        type: 'line',
        data: {
          labels,
          datasets: [{ label: 'Balance', data: balanceSeries }],
        },
        height: 280,
      },
      {
        title: 'Principal vs Interest',
        type: 'doughnut',
        data: {
          labels: ['Principal', 'Interest'],
          datasets: [{ data: [Math.round(P), Math.round(totalInterest)] }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      title: 'Year-by-Year Amortization',
      columns: ['Year', 'EMI', 'Principal Paid', 'Interest Paid', 'Balance'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        `You pay ${formatINR(Math.round(totalInterest))} in interest — ${formatPercent((totalInterest / totalPayment) * 100)} of total outflow.`,
        `EMI of ${formatINR(Math.round(emiAmount))}/month for ${years} years.`,
      ],
      mistakes: [
        'Choosing maximum tenure — lowers EMI but dramatically increases total interest.',
        'Ignoring processing fees, insurance, and other charges in affordability.',
      ],
      tips: [
        'Even one extra EMI per year can significantly reduce total interest.',
        'Compare floating vs fixed rates and consider prepayment options.',
      ],
      formula: 'EMI = P × r × (1+r)^n / ((1+r)^n − 1)',
      example: `₹25L home loan at 8.5% for 20 years → EMI ~₹21,700; total interest ~₹27L.`,
    }),
    pdfData: {
      title: 'Loan EMI Report',
      summary: [
        { label: 'EMI', value: formatINR(Math.round(emiAmount)) },
        { label: 'Total Interest', value: formatINR(Math.round(totalInterest)) },
        { label: 'Total Payment', value: formatINR(Math.round(totalPayment)) },
      ],
      tables: [{ title: 'Amortization', columns: ['Year', 'EMI', 'Principal Paid', 'Interest Paid', 'Balance'], rows }],
    },
    raw: { P, emiAmount, totalInterest, totalPayment, months },
  };
}
