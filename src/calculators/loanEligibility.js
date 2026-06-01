import { emi, periodicRate } from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

function maxLoanFromEmi(maxEmi, annualRate, months) {
  if (months <= 0 || maxEmi <= 0) return 0;
  const r = periodicRate(annualRate, 12);
  if (r === 0) return maxEmi * months;
  return (maxEmi * (Math.pow(1 + r, months) - 1)) / (r * Math.pow(1 + r, months));
}

function riskLevel(foir) {
  if (foir <= 40) return { level: 'Low', tone: 'success', desc: 'Comfortable debt burden' };
  if (foir <= 50) return { level: 'Moderate', tone: 'warning', desc: 'Within typical bank limits' };
  return { level: 'High', tone: 'danger', desc: 'May face rejection or higher rates' };
}

export function calculate(inputs) {
  const monthlyIncome = parseNum(inputs.monthlyIncome, 100000);
  const existingEmis = parseNum(inputs.existingEmis, 15000);
  const rate = parseNum(inputs.rate, 8.5) / 100;
  const tenureYears = parseNum(inputs.tenureYears, 20);

  const months = tenureYears * 12;
  const maxEmiConservative = monthlyIncome * 0.4 - existingEmis;
  const maxEmiAggressive = monthlyIncome * 0.5 - existingEmis;
  const maxEmi = Math.max(0, maxEmiAggressive);

  const maxLoanConservative = maxLoanFromEmi(Math.max(0, maxEmiConservative), rate, months);
  const maxLoanAggressive = maxLoanFromEmi(maxEmi, rate, months);

  const totalEmiAfterLoan = existingEmis + maxEmi;
  const foir = monthlyIncome > 0 ? (totalEmiAfterLoan / monthlyIncome) * 100 : 0;
  const risk = riskLevel(foir);

  const emiAtMax = emi(maxLoanAggressive, rate, months);
  const totalPayment = emiAtMax * months;
  const totalInterest = Math.max(0, totalPayment - maxLoanAggressive);

  return {
    summary: [
      { label: 'Max EMI (50% rule)', value: formatINR(Math.round(maxEmi)), tone: maxEmi > 0 ? 'primary' : 'danger' },
      { label: 'Max EMI (40% rule)', value: formatINR(Math.round(Math.max(0, maxEmiConservative))), sub: 'Conservative limit' },
      { label: 'Max Loan Amount', value: formatINR(Math.round(maxLoanAggressive)), tone: 'success' },
      { label: 'Conservative Max Loan', value: formatINR(Math.round(maxLoanConservative)) },
      { label: 'FOIR', value: formatPercent(foir, 1), sub: 'Fixed Obligation to Income Ratio', tone: risk.tone },
      { label: 'Risk Level', value: risk.level, tone: risk.tone, sub: risk.desc },
    ],
    steps: [
      `Monthly income: ${formatINR(monthlyIncome)}; existing EMIs: ${formatINR(existingEmis)}`,
      `Max EMI (50% FOIR) = 50% × ${formatINR(monthlyIncome)} − ${formatINR(existingEmis)} = ${formatINR(Math.round(maxEmi))}`,
      `Max loan at ${formatPercent(rate * 100)} for ${tenureYears}y = ${formatINR(Math.round(maxLoanAggressive))}`,
      `EMI on max loan = ${formatINR(Math.round(emiAtMax))}`,
    ],
    assumptions: [
      'FOIR limit: 40–50% of gross monthly income (banks typically use 50%)',
      'Existing EMIs include all ongoing loan obligations',
      'Fixed rate; does not include processing fees or insurance',
      'Actual eligibility depends on credit score, employer, and property value',
    ],
    charts: [
      {
        title: 'Income Allocation',
        type: 'doughnut',
        data: {
          labels: ['Existing EMIs', 'New EMI', 'Remaining Income'],
          datasets: [{
            data: [
              Math.round(existingEmis),
              Math.round(emiAtMax),
              Math.round(Math.max(0, monthlyIncome - existingEmis - emiAtMax)),
            ],
          }],
        },
        height: 260,
      },
      {
        title: 'FOIR Comparison',
        type: 'bar',
        data: {
          labels: ['40% Limit', '50% Limit', 'Current FOIR'],
          datasets: [{
            label: 'FOIR %',
            data: [40, 50, Math.round(foir)],
          }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      columns: ['Tenure', 'Max Loan (40%)', 'Max Loan (50%)', 'EMI at 50%'],
      rows: [[
        `${tenureYears} years`,
        formatINR(Math.round(maxLoanConservative)),
        formatINR(Math.round(maxLoanAggressive)),
        formatINR(Math.round(emiAtMax)),
      ]],
    },
    insights: buildInsights({
      takeaways: [
        maxEmi <= 0
          ? 'Existing EMIs exceed 50% FOIR — reduce debt before applying for new loans.'
          : `You may qualify for up to ${formatINR(Math.round(maxLoanAggressive))} at ${tenureYears}-year tenure.`,
        `Risk assessment: ${risk.level} — ${risk.desc}`,
      ],
      tips: [
        'Pay off high-interest loans first to improve FOIR and eligibility.',
        'Longer tenure increases loan amount but raises total interest paid.',
      ],
      formula: 'Max Loan = EMI × [(1+r)^n − 1] / [r × (1+r)^n]',
    }),
    pdfData: {
      title: 'Loan Eligibility Report',
      summary: [
        { label: 'Max EMI', value: formatINR(Math.round(maxEmi)) },
        { label: 'Max Loan', value: formatINR(Math.round(maxLoanAggressive)) },
        { label: 'FOIR', value: formatPercent(foir, 1) },
        { label: 'Risk', value: risk.level },
      ],
      tables: [{
        title: 'Eligibility Summary',
        columns: ['Tenure', 'Max Loan (40%)', 'Max Loan (50%)', 'EMI at 50%'],
        rows: [[`${tenureYears} years`, formatINR(Math.round(maxLoanConservative)), formatINR(Math.round(maxLoanAggressive)), formatINR(Math.round(emiAtMax))]],
      }],
    },
    raw: {
      maxEmi,
      maxEmiConservative: Math.max(0, maxEmiConservative),
      maxLoan: maxLoanAggressive,
      maxLoanConservative,
      foir,
      emiAtMax,
      totalInterest,
      risk: risk.level,
    },
  };
}
