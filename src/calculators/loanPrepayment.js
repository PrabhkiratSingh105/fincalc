import { emi, periodicRate } from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

function runAmortization(principal, annualRate, tenureMonths, extraMonthly = 0, oneTimePrepayment = 0) {
  const r = periodicRate(annualRate, 12);
  const emiAmount = emi(principal, annualRate, tenureMonths);
  let balance = principal;
  let month = 0;
  let totalInterest = 0;
  let totalPaid = 0;
  const yearlySnapshots = [];
  let oneTimeApplied = false;

  while (balance > 0.5 && month < tenureMonths * 3) {
    month += 1;
    if (!oneTimeApplied && oneTimePrepayment > 0) {
      balance = Math.max(0, balance - oneTimePrepayment);
      oneTimeApplied = true;
    }

    const interest = balance * r;
    let principalPaid = emiAmount - interest + extraMonthly;
    if (principalPaid > balance) principalPaid = balance;
    if (principalPaid < 0) principalPaid = 0;

    balance -= principalPaid;
    totalInterest += interest;
    totalPaid += interest + principalPaid;

    if (month % 12 === 0 || balance <= 0.5) {
      yearlySnapshots.push({
        month,
        year: Math.ceil(month / 12),
        balance: Math.max(0, balance),
        totalInterest,
        totalPaid,
      });
    }
  }

  return {
    emi: emiAmount,
    months: month,
    totalInterest,
    totalPaid,
    yearlySnapshots,
  };
}

export function calculate(inputs) {
  const loanAmount = parseNum(inputs.loanAmount, 2500000);
  const rate = parseNum(inputs.rate, 8.5) / 100;
  const tenureYears = parseNum(inputs.tenureYears, 20);
  const extraMonthly = parseNum(inputs.extraMonthly, 0);
  const oneTimePrepayment = parseNum(inputs.oneTimePrepayment, 0);

  const tenureMonths = tenureYears * 12;
  const original = runAmortization(loanAmount, rate, tenureMonths, 0, 0);
  const prepaid = runAmortization(loanAmount, rate, tenureMonths, extraMonthly, oneTimePrepayment);

  const interestSaved = Math.max(0, original.totalInterest - prepaid.totalInterest);
  const monthsSaved = Math.max(0, original.months - prepaid.months);
  const yearsSaved = (monthsSaved / 12).toFixed(1);

  const origRows = original.yearlySnapshots.map((s) => [
    s.year,
    formatINR(Math.round(s.balance)),
    formatINR(Math.round(s.totalInterest)),
    formatINR(Math.round(s.totalPaid)),
  ]);

  const prepRows = prepaid.yearlySnapshots.map((s) => [
    s.year,
    formatINR(Math.round(s.balance)),
    formatINR(Math.round(s.totalInterest)),
    formatINR(Math.round(s.totalPaid)),
  ]);

  const maxYears = Math.max(origRows.length, prepRows.length);
  const labels = Array.from({ length: maxYears }, (_, i) => `Year ${i + 1}`);

  return {
    summary: [
      { label: 'Original EMI', value: formatINR(Math.round(original.emi)), tone: 'primary' },
      { label: 'Prepaid Tenure', value: `${Math.ceil(prepaid.months / 12)} years (${prepaid.months} mo)`, tone: 'success' },
      { label: 'Interest Saved', value: formatINR(Math.round(interestSaved)), tone: 'success' },
      { label: 'Months Saved', value: `${monthsSaved}`, sub: `${yearsSaved} years faster` },
      { label: 'Original Total Interest', value: formatINR(Math.round(original.totalInterest)) },
      { label: 'Prepaid Total Interest', value: formatINR(Math.round(prepaid.totalInterest)) },
    ],
    steps: [
      `Original loan: ${formatINR(loanAmount)} at ${formatPercent(rate * 100)} for ${tenureYears} years`,
      `EMI = ${formatINR(Math.round(original.emi))}; total interest = ${formatINR(Math.round(original.totalInterest))}`,
      extraMonthly > 0 ? `Extra monthly prepayment: ${formatINR(extraMonthly)}` : null,
      oneTimePrepayment > 0 ? `One-time prepayment: ${formatINR(oneTimePrepayment)} in month 1` : null,
      `New tenure: ${prepaid.months} months; interest saved = ${formatINR(Math.round(interestSaved))}`,
    ].filter(Boolean),
    assumptions: [
      'Fixed interest rate throughout tenure',
      'One-time prepayment applied in the first month',
      'EMI remains constant; extra payment goes to principal',
      'No prepayment penalties',
    ],
    charts: [
      {
        title: 'Outstanding Balance Comparison',
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Original', data: original.yearlySnapshots.map((s) => Math.round(s.balance)) },
            { label: 'With Prepayment', data: prepaid.yearlySnapshots.map((s) => Math.round(s.balance)) },
          ],
        },
        height: 280,
      },
      {
        title: 'Interest Comparison',
        type: 'bar',
        data: {
          labels: ['Original', 'Prepaid'],
          datasets: [{
            label: 'Total Interest',
            data: [Math.round(original.totalInterest), Math.round(prepaid.totalInterest)],
          }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      columns: ['Year', 'Balance', 'Cumulative Interest', 'Total Paid'],
      rows: prepRows,
      title: 'Prepaid Amortization Schedule',
    },
    originalTable: {
      columns: ['Year', 'Balance', 'Cumulative Interest', 'Total Paid'],
      rows: origRows,
      title: 'Original Amortization Schedule',
    },
    insights: buildInsights({
      takeaways: [
        interestSaved > 0
          ? `Prepaying saves ${formatINR(Math.round(interestSaved))} in interest and ${monthsSaved} months.`
          : 'Add extra monthly or one-time prepayment to reduce interest burden.',
        `Original EMI ${formatINR(Math.round(original.emi))} unchanged; extra goes to principal.`,
      ],
      tips: [
        'Prepay early in the loan tenure — interest component is highest in initial years.',
        'Even ₹5,000/month extra can save lakhs over a 20-year home loan.',
      ],
      formula: 'EMI = P × r × (1+r)^n / [(1+r)^n − 1]',
    }),
    pdfData: {
      title: 'Loan Prepayment Analysis',
      summary: [
        { label: 'Interest Saved', value: formatINR(Math.round(interestSaved)) },
        { label: 'Months Saved', value: String(monthsSaved) },
        { label: 'Original EMI', value: formatINR(Math.round(original.emi)) },
      ],
      tables: [
        { title: 'Original Schedule', columns: ['Year', 'Balance', 'Cumulative Interest', 'Total Paid'], rows: origRows },
        { title: 'Prepaid Schedule', columns: ['Year', 'Balance', 'Cumulative Interest', 'Total Paid'], rows: prepRows },
      ],
    },
    raw: {
      originalEmi: original.emi,
      originalMonths: original.months,
      prepaidMonths: prepaid.months,
      interestSaved,
      monthsSaved,
      originalTotalInterest: original.totalInterest,
      prepaidTotalInterest: prepaid.totalInterest,
    },
  };
}
