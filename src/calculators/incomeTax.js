import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

const CESS = 0.04;
const MAX_80C = 150000;
const MAX_HOME_LOAN_INTEREST = 200000;

function applySlabs(taxableIncome, slabs) {
  let tax = 0;
  let remaining = taxableIncome;
  for (let i = 0; i < slabs.length; i += 1) {
    const { upto, rate } = slabs[i];
    const prevLimit = i === 0 ? 0 : slabs[i - 1].upto;
    const band = Math.min(remaining, upto - prevLimit);
    if (band <= 0) break;
    tax += band * rate;
    remaining -= band;
    if (remaining <= 0) break;
  }
  return tax;
}

function oldRegimeTax(taxableIncome) {
  const slabs = [
    { upto: 250000, rate: 0 },
    { upto: 500000, rate: 0.05 },
    { upto: 1000000, rate: 0.2 },
    { upto: Infinity, rate: 0.3 },
  ];
  let tax = applySlabs(taxableIncome, slabs);
  if (taxableIncome <= 500000) tax = Math.max(0, tax - 12500);
  return tax;
}

function newRegimeTax(taxableIncome) {
  const slabs = [
    { upto: 300000, rate: 0 },
    { upto: 700000, rate: 0.05 },
    { upto: 1000000, rate: 0.1 },
    { upto: 1200000, rate: 0.15 },
    { upto: 1500000, rate: 0.2 },
    { upto: Infinity, rate: 0.3 },
  ];
  let tax = applySlabs(taxableIncome, slabs);
  if (taxableIncome <= 700000) tax = 0;
  return tax;
}

function withCess(tax) {
  return tax * (1 + CESS);
}

export function calculate(inputs) {
  const salary = parseNum(inputs.salary, 1200000);
  const otherIncome = parseNum(inputs.otherIncome, 0);
  const capitalGains = parseNum(inputs.capitalGains, 0);
  const deductions80c = Math.min(parseNum(inputs.deductions80c, 0), MAX_80C);
  const hra = parseNum(inputs.hra, 0);
  const homeLoanInterest = Math.min(parseNum(inputs.homeLoanInterest, 0), MAX_HOME_LOAN_INTEREST);
  const regime = inputs.regime === 'old' ? 'old' : inputs.regime === 'new' ? 'new' : 'compare';

  const grossIncome = salary + otherIncome + capitalGains;

  const oldStdDeduction = 50000;
  const newStdDeduction = 75000;
  const oldDeductions = deductions80c + hra + homeLoanInterest + oldStdDeduction;
  const oldTaxable = Math.max(0, grossIncome - oldDeductions);
  const newTaxable = Math.max(0, grossIncome - newStdDeduction);

  const oldTaxBase = oldRegimeTax(oldTaxable);
  const newTaxBase = newRegimeTax(newTaxable);
  const oldTax = withCess(oldTaxBase);
  const newTax = withCess(newTaxBase);

  const recommended = oldTax <= newTax ? 'old' : 'new';
  const savings = Math.abs(oldTax - newTax);

  const showOld = regime === 'old' || regime === 'compare';
  const showNew = regime === 'new' || regime === 'compare';

  const summary = [];
  if (showOld) {
    summary.push(
      { label: 'Old Regime Tax', value: formatINR(Math.round(oldTax)), tone: recommended === 'old' ? 'success' : undefined },
      { label: 'Old Taxable Income', value: formatINR(Math.round(oldTaxable)) },
    );
  }
  if (showNew) {
    summary.push(
      { label: 'New Regime Tax', value: formatINR(Math.round(newTax)), tone: recommended === 'new' ? 'success' : undefined },
      { label: 'New Taxable Income', value: formatINR(Math.round(newTaxable)) },
    );
  }
  summary.push(
    { label: 'Gross Income', value: formatINR(Math.round(grossIncome)), tone: 'primary' },
    { label: 'Recommended Regime', value: recommended === 'old' ? 'Old Regime' : 'New Regime', tone: 'success', sub: `Saves ${formatINR(Math.round(savings))}` },
  );

  const rows = [
    ['Gross Income', formatINR(Math.round(grossIncome)), formatINR(Math.round(grossIncome))],
    ['Standard Deduction', formatINR(oldStdDeduction), formatINR(newStdDeduction)],
    ['80C + HRA + Home Loan', formatINR(Math.round(deductions80c + hra + homeLoanInterest)), '—'],
    ['Taxable Income', formatINR(Math.round(oldTaxable)), formatINR(Math.round(newTaxable))],
    ['Tax (before cess)', formatINR(Math.round(oldTaxBase)), formatINR(Math.round(newTaxBase))],
    ['Tax (with 4% cess)', formatINR(Math.round(oldTax)), formatINR(Math.round(newTax))],
    ['Effective Rate', formatPercent(grossIncome > 0 ? (oldTax / grossIncome) * 100 : 0), formatPercent(grossIncome > 0 ? (newTax / grossIncome) * 100 : 0)],
  ];

  return {
    summary,
    steps: [
      `Gross income = Salary ${formatINR(salary)} + Other ${formatINR(otherIncome)} + STCG/LTCG ${formatINR(capitalGains)}`,
      `Old regime taxable = ${formatINR(Math.round(grossIncome))} − deductions ${formatINR(Math.round(oldDeductions))} = ${formatINR(Math.round(oldTaxable))}`,
      `New regime taxable = ${formatINR(Math.round(grossIncome))} − std deduction ${formatINR(newStdDeduction)} = ${formatINR(Math.round(newTaxable))}`,
      `Old tax (with cess) = ${formatINR(Math.round(oldTax))}; New tax = ${formatINR(Math.round(newTax))}`,
      `${recommended === 'old' ? 'Old' : 'New'} regime saves ${formatINR(Math.round(savings))}`,
    ],
    assumptions: [
      'FY 2024-25 (AY 2025-26) slab rates with 4% health & education cess',
      'Old regime: 80C capped at ₹1.5L, home loan interest capped at ₹2L',
      'New regime: standard deduction ₹75,000; no 80C/HRA/home loan deductions',
      'Rebate u/s 87A applied (Old: income ≤ ₹5L; New: income ≤ ₹7L)',
      'Capital gains added to income — simplified; actual STCG/LTCG rates differ',
    ],
    charts: [
      {
        title: 'Tax Comparison',
        type: 'bar',
        data: {
          labels: ['Old Regime', 'New Regime'],
          datasets: [{
            label: 'Total Tax',
            data: [Math.round(oldTax), Math.round(newTax)],
          }],
        },
        height: 260,
      },
      {
        title: 'Take-Home Income',
        type: 'doughnut',
        data: {
          labels: ['Take-Home', 'Tax'],
          datasets: [{
            data: regime === 'new'
              ? [Math.round(grossIncome - newTax), Math.round(newTax)]
              : [Math.round(grossIncome - oldTax), Math.round(oldTax)],
          }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      columns: ['Component', 'Old Regime', 'New Regime'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        `${recommended === 'old' ? 'Old' : 'New'} regime is better — saves ${formatINR(Math.round(savings))} in tax.`,
        oldDeductions > newStdDeduction
          ? 'Your deductions favour the old regime.'
          : 'Limited deductions — new regime may be simpler and cheaper.',
      ],
      tips: [
        'Max out 80C (PPF, ELSS, EPF) if staying on old regime.',
        'New regime is default from FY 23-24 — opt into old regime only if beneficial.',
      ],
      tax: 'Slabs per Finance Act FY 2024-25; cess at 4%',
      faqs: [
        'Can I switch regimes? Salaried employees can choose each year; business income has restrictions.',
      ],
    }),
    pdfData: {
      title: 'Income Tax Comparison FY 2024-25',
      summary: [
        { label: 'Gross Income', value: formatINR(Math.round(grossIncome)) },
        { label: 'Old Regime Tax', value: formatINR(Math.round(oldTax)) },
        { label: 'New Regime Tax', value: formatINR(Math.round(newTax)) },
        { label: 'Recommended', value: recommended === 'old' ? 'Old Regime' : 'New Regime' },
      ],
      tables: [{ title: 'Regime Comparison', columns: ['Component', 'Old Regime', 'New Regime'], rows }],
    },
    raw: {
      grossIncome,
      oldTaxable,
      newTaxable,
      oldTax,
      newTax,
      recommendedRegime: recommended,
      taxSavings: savings,
    },
  };
}
