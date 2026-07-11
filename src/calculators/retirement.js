import {
  annualReturnAfterExpense,
  fvLumpsum,
  fvSip,
  sipRequired,
  pvGrowingAnnuity,
} from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

function readinessScore(projected, needed) {
  if (needed <= 0) return 100;
  const ratio = projected / needed;
  return Math.min(100, Math.round(ratio * 100));
}

function buildAccumulationTable(years, existingSavings, existingSip, returnRate) {
  let corpus = existingSavings;
  let invested = existingSavings;
  const rows = [];
  const raw = [];

  for (let yr = 1; yr <= years; yr++) {
    const sipThisYear = existingSip * 12;
    corpus = fvLumpsum(corpus, returnRate, 1) + fvSip(existingSip, returnRate, 12);
    invested += sipThisYear;
    raw.push({ year: yr, invested, corpus, gains: corpus - invested });
    rows.push([
      yr,
      formatINR(Math.round(invested)),
      formatINR(Math.round(corpus)),
      formatINR(Math.round(corpus - invested)),
    ]);
  }
  return { rows, raw };
}

function estimateAccumulationExpenseDrag(years, existingSavings, existingSip, grossReturnRate, netReturnRate) {
  const gross = fvLumpsum(existingSavings, grossReturnRate, years) + fvSip(existingSip, grossReturnRate, years * 12);
  const net = fvLumpsum(existingSavings, netReturnRate, years) + fvSip(existingSip, netReturnRate, years * 12);
  return Math.max(0, gross - net);
}

function buildDepletionTable(
  startCorpus,
  monthlyExpense,
  inflation,
  returnRate,
  years,
  startAge,
) {
  let corpus = startCorpus;
  let expense = monthlyExpense;
  const rows = [];
  const raw = [];

  for (let yr = 1; yr <= years; yr++) {
    const annualWithdrawal = expense * 12;
    corpus = corpus * (1 + returnRate) - annualWithdrawal;
    const remaining = Math.max(0, corpus);
    raw.push({ age: startAge + yr - 1, expense, annualWithdrawal, remaining });
    rows.push([
      startAge + yr - 1,
      formatINR(Math.round(expense)),
      formatINR(Math.round(annualWithdrawal)),
      formatINR(Math.round(remaining)),
    ]);
    expense *= 1 + inflation;
  }
  return { rows, raw };
}

function estimateDepletionExpenseDrag(startCorpus, monthlyExpense, inflation, grossReturnRate, netReturnRate, years) {
  let grossCorpus = startCorpus;
  let netCorpus = startCorpus;
  let expense = monthlyExpense;

  for (let yr = 1; yr <= years; yr += 1) {
    const annualWithdrawal = expense * 12;
    grossCorpus = Math.max(0, grossCorpus * (1 + grossReturnRate) - annualWithdrawal);
    netCorpus = Math.max(0, netCorpus * (1 + netReturnRate) - annualWithdrawal);
    expense *= 1 + inflation;
  }

  return Math.max(0, grossCorpus - netCorpus);
}

export function calculate(inputs) {
  const currentAge = parseNum(inputs.currentAge, 30);
  const retirementAge = parseNum(inputs.retirementAge, 60);
  const lifeExpectancy = parseNum(inputs.lifeExpectancy, 85);
  const monthlyExpenses = parseNum(inputs.monthlyExpenses, 50000);
  const inflation = parseNum(inputs.inflation, 6) / 100;
  const returnRate = parseNum(inputs.returnRate, 12) / 100;
  const expenseRatio = parseNum(inputs.expenseRatio, 0) / 100;
  const netReturnRate = annualReturnAfterExpense(returnRate, expenseRatio);
  const existingSavings = parseNum(inputs.existingSavings, 0);
  const existingSip = parseNum(inputs.existingSip, 0);

  const yearsToRetire = Math.max(0, retirementAge - currentAge);
  const retirementYears = Math.max(0, lifeExpectancy - retirementAge);
  const monthsToRetire = yearsToRetire * 12;

  const futureMonthlyExpenses = monthlyExpenses * Math.pow(1 + inflation, yearsToRetire);
  const annualExpenseAtRetirement = futureMonthlyExpenses * 12;

  const corpusNeeded = pvGrowingAnnuity(
    annualExpenseAtRetirement,
    netReturnRate,
    inflation,
    retirementYears,
  );

  const projectedFromSavings = fvLumpsum(existingSavings, netReturnRate, yearsToRetire);
  const projectedFromSip = fvSip(existingSip, netReturnRate, monthsToRetire);
  const projectedCorpus = projectedFromSavings + projectedFromSip;
  const gap = Math.max(0, corpusNeeded - projectedCorpus);
  const requiredSip = sipRequired(gap, netReturnRate, monthsToRetire);
  const score = readinessScore(projectedCorpus, corpusNeeded);
  const accumulationExpenseDrag = estimateAccumulationExpenseDrag(yearsToRetire, existingSavings, existingSip, returnRate, netReturnRate);
  const depletionExpenseDrag = estimateDepletionExpenseDrag(corpusNeeded, futureMonthlyExpenses, inflation, returnRate, netReturnRate, retirementYears);
  const lifetimeExpenseDrag = accumulationExpenseDrag + depletionExpenseDrag;

  const { rows: accumulationRows, raw: accumulationRaw } = buildAccumulationTable(
    yearsToRetire,
    existingSavings,
    existingSip,
    netReturnRate,
  );
  const { rows: depletionRows, raw: depletionRaw } = buildDepletionTable(
    corpusNeeded,
    futureMonthlyExpenses,
    inflation,
    netReturnRate,
    retirementYears,
    retirementAge,
  );

  const accumulationLabels = Array.from({ length: yearsToRetire }, (_, i) => `Age ${currentAge + i + 1}`);
  const depletionLabels = Array.from(
    { length: retirementYears },
    (_, i) => `Age ${retirementAge + i}`,
  );

  return {
    summary: [
      { label: 'Corpus Needed', value: formatINR(Math.round(corpusNeeded)), tone: 'primary' },
      { label: 'Projected Corpus', value: formatINR(Math.round(projectedCorpus)), tone: projectedCorpus >= corpusNeeded ? 'success' : 'warning' },
      { label: 'Gap', value: formatINR(Math.round(gap)), tone: gap > 0 ? 'danger' : 'success' },
      { label: 'Required SIP', value: formatINR(Math.round(requiredSip)), sub: 'Additional monthly SIP to close gap' },
      { label: 'Future Monthly Expenses', value: formatINR(Math.round(futureMonthlyExpenses)), sub: 'At retirement (inflation-adjusted)' },
      { label: 'Expense Ratio Cost', value: formatINR(Math.round(lifetimeExpenseDrag)), sub: 'Accumulation plus retirement phase' },
      { label: 'Readiness Score', value: `${score}/100`, tone: score >= 80 ? 'success' : score >= 50 ? 'warning' : 'danger' },
    ],
    steps: [
      `Net return after ${formatPercent(expenseRatio * 100)} expense ratio = ${formatPercent(netReturnRate * 100)}`,
      `Years to retirement: ${yearsToRetire} (${currentAge} → ${retirementAge})`,
      `Future monthly expenses = ${formatINR(monthlyExpenses)} × (1 + ${formatPercent(inflation * 100)})${yearsToRetire} = ${formatINR(Math.round(futureMonthlyExpenses))}`,
      `Corpus needed (PV of growing annuity) = ${formatINR(Math.round(corpusNeeded))} for ${retirementYears} retirement years`,
      `Projected corpus = FV(savings) ${formatINR(Math.round(projectedFromSavings))} + FV(SIP) ${formatINR(Math.round(projectedFromSip))} = ${formatINR(Math.round(projectedCorpus))}`,
      gap > 0
        ? `Gap ${formatINR(Math.round(gap))} → additional SIP of ${formatINR(Math.round(requiredSip))}/month required`
        : 'On track — projected corpus meets retirement goal',
    ],
    assumptions: [
      `Expected return ${formatPercent(returnRate * 100)} p.a. during accumulation and retirement`,
      `Inflation ${formatPercent(inflation * 100)} p.a. on expenses`,
      `Life expectancy ${lifeExpectancy}; retirement span ${retirementYears} years`,
      'Expenses grow with inflation throughout retirement; corpus invested at return rate',
      'Does not include taxes, pension, or post-retirement income',
    ],
    charts: [
      {
        title: 'Accumulation Phase',
        type: 'line',
        data: {
          labels: accumulationLabels,
          datasets: [
            { label: 'Invested', data: accumulationRaw.map((r) => Math.round(r.invested)) },
            { label: 'Corpus', data: accumulationRaw.map((r) => Math.round(r.corpus)) },
          ],
        },
        height: 280,
      },
      {
        title: 'Retirement Readiness',
        type: 'doughnut',
        data: {
          labels: ['Funded', 'Gap'],
          datasets: [{
            data: [
              Math.round(Math.min(projectedCorpus, corpusNeeded)),
              Math.round(Math.max(0, gap)),
            ],
          }],
        },
        height: 240,
      },
      {
        title: 'Post-Retirement Corpus Depletion',
        type: 'line',
        data: {
          labels: depletionLabels,
          datasets: [
            { label: 'Remaining Corpus', data: depletionRaw.map((r) => Math.round(r.remaining)) },
          ],
        },
        height: 280,
      },
    ],
    yearlyTable: {
      columns: ['Year', 'Invested', 'Corpus', 'Gains'],
      rows: accumulationRows,
      title: 'Pre-Retirement Accumulation',
    },
    depletionTable: {
      columns: ['Age', 'Monthly Expense', 'Annual Withdrawal', 'Remaining Corpus'],
      rows: depletionRows,
      title: 'Post-Retirement Depletion',
    },
    insights: buildInsights({
      takeaways: [
        score >= 100
          ? 'Your current savings and SIP are projected to fully fund retirement.'
          : `You need an additional ${formatINR(Math.round(requiredSip))}/month to reach your retirement corpus.`,
        `At retirement, monthly expenses are estimated at ${formatINR(Math.round(futureMonthlyExpenses))}.`,
      ],
      tips: [
        'Increase SIP by 10% annually (step-up) to significantly reduce the funding gap.',
        'Delay retirement by 2–3 years to compound savings and shorten the withdrawal period.',
      ],
      formula: 'Corpus = PMT × [1 − ((1+i)/(1+r))^n] / (r − i)',
      example: '₹1L/month expenses at 6% inflation for 25 retirement years at 8% return ≈ ₹2.1 Cr corpus',
    }),
    pdfData: {
      title: 'Retirement Planning Report',
      summary: [
        { label: 'Corpus Needed', value: formatINR(Math.round(corpusNeeded)) },
        { label: 'Projected Corpus', value: formatINR(Math.round(projectedCorpus)) },
        { label: 'Gap', value: formatINR(Math.round(gap)) },
        { label: 'Required SIP', value: formatINR(Math.round(requiredSip)) },
        { label: 'Expense Ratio Cost', value: formatINR(Math.round(lifetimeExpenseDrag)) },
        { label: 'Readiness Score', value: `${score}/100` },
      ],
      tables: [
        { title: 'Pre-Retirement Accumulation', columns: ['Year', 'Invested', 'Corpus', 'Gains'], rows: accumulationRows },
        { title: 'Post-Retirement Depletion', columns: ['Age', 'Monthly Expense', 'Annual Withdrawal', 'Remaining Corpus'], rows: depletionRows },
      ],
    },
    raw: {
      corpusNeeded,
      projectedCorpus,
      gap,
      requiredSip,
      futureMonthlyExpenses,
      lifetimeExpenseDrag,
      accumulationExpenseDrag,
      depletionExpenseDrag,
      expenseRatio,
      readinessScore: score,
    },
  };
}
