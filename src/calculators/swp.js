import { periodicRate } from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

const LTCG_EXEMPTION_LIMIT = 125000;

export function calculate(inputs) {
  const corpusAmount = parseNum(inputs.corpusAmount, 5000000);
  const monthlyWithdrawal = parseNum(inputs.monthlyWithdrawal, 50000);
  const ratePercentage = parseNum(inputs.ratePercentage, 8) / 100;
  const expenseRatio = parseNum(inputs.expenseRatio, 0) / 100;
  const years = parseNum(inputs.years, 10);
  const taxRate = parseNum(inputs.taxRate, 12.5) / 100;
  const inflation = parseNum(inputs.inflation, 6) / 100;
  const monthlyRate = periodicRate(ratePercentage, 12);
  const months = years * 12;

  let corpus = corpusAmount;
  let totalWithdrawn = 0;
  let expenseDrag = 0;
  const rows = [];
  const corpusSeries = [];
  const withdrawnSeries = [];
  const labels = [];
  let depletedYear = null;

  for (let month = 1; month <= months; month += 1) {
    corpus *= 1 + monthlyRate;
    const withdrawalThisMonth = Math.min(monthlyWithdrawal, corpus);
    corpus -= withdrawalThisMonth;
    totalWithdrawn += withdrawalThisMonth;

    if (month % 12 === 0 && corpus > 0 && expenseRatio > 0) {
      const afterExpense = corpus * (1 - expenseRatio);
      expenseDrag += corpus - afterExpense;
      corpus = afterExpense;
    }

    if (corpus <= 0 && depletedYear == null) {
      depletedYear = Math.ceil(month / 12);
      corpus = 0;
    }
    corpus = Math.max(0, corpus);

    if (month % 12 === 0) {
      const yr = month / 12;
      const inflAdjCorpus = corpus / Math.pow(1 + inflation, yr);
      rows.push([
        yr,
        formatINR(Math.round(corpus)),
        formatINR(Math.round(totalWithdrawn)),
        formatINR(Math.round(expenseDrag)),
        formatINR(Math.round(inflAdjCorpus)),
        corpus <= 0 ? 'Depleted' : 'Active',
      ]);
      labels.push(`Year ${yr}`);
      corpusSeries.push(Math.round(corpus));
      withdrawnSeries.push(Math.round(totalWithdrawn));
    }
  }

  const gain = totalWithdrawn - corpusAmount + corpus;
  const taxable = Math.max(0, gain - LTCG_EXEMPTION_LIMIT);
  const taxAmount = taxable * taxRate;
  const netWithdrawn = totalWithdrawn - taxAmount;
  const sustainable = corpus > 0;
  const withdrawalRate = corpusAmount > 0 ? (monthlyWithdrawal * 12 / corpusAmount) * 100 : 0;

  return {
    summary: [
      { label: 'Remaining Corpus', value: formatINR(Math.round(corpus)), tone: sustainable ? 'success' : 'danger' },
      { label: 'Total Withdrawn', value: formatINR(Math.round(totalWithdrawn)), tone: 'primary' },
      { label: 'Net Withdrawn (post-tax)', value: formatINR(Math.round(netWithdrawn)) },
      { label: 'Annual Withdrawal Rate', value: formatPercent(withdrawalRate), sub: 'Of initial corpus' },
      { label: 'Tax on Gains', value: formatINR(Math.round(taxAmount)), sub: 'After Rs1.25L exemption' },
      { label: 'Expense Ratio Cost', value: formatINR(Math.round(expenseDrag)), sub: 'Deducted through withdrawal period' },
      { label: 'Corpus Status', value: sustainable ? 'Sustainable' : `Depleted ~Year ${depletedYear}`, tone: sustainable ? 'success' : 'warning' },
    ],
    steps: [
      `Initial corpus = ${formatINR(corpusAmount)}; monthly withdrawal = ${formatINR(monthlyWithdrawal)}`,
      `Monthly return = ${formatPercent(ratePercentage * 100)} / 12 = ${formatPercent(monthlyRate * 100, 4)}`,
      `Each month: Corpus = Corpus x (1 + r_m) - actual withdrawal (capped at the available corpus)`,
      `Expense ratio ${formatPercent(expenseRatio * 100)} is deducted at each year-end from remaining corpus`,
      `After ${years} years: withdrawn ${formatINR(Math.round(totalWithdrawn))}, remaining ${formatINR(Math.round(corpus))}`,
      `Gain = withdrawn + remaining - initial = ${formatINR(Math.round(gain))}; tax = ${formatINR(Math.round(taxAmount))}`,
    ],
    assumptions: [
      'Fixed monthly withdrawal (not inflation-indexed)',
      'Constant return rate; actual market returns vary',
      'Expense ratio deducted annually from the remaining corpus',
      'LTCG tax applied once on net gains with Rs1.25L exemption',
      'No additional contributions during withdrawal phase; withdrawals stop when the corpus is exhausted',
    ],
    charts: [
      {
        title: 'Corpus vs Withdrawals',
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Remaining Corpus', data: corpusSeries },
            { label: 'Total Withdrawn', data: withdrawnSeries },
          ],
        },
        height: 280,
      },
      {
        title: 'Initial vs Remaining',
        type: 'doughnut',
        data: {
          labels: ['Withdrawn', 'Remaining', 'Expense'],
          datasets: [{ data: [Math.round(totalWithdrawn), Math.round(corpus), Math.round(expenseDrag)] }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      title: 'Year-by-Year SWP Schedule',
      columns: ['Year', 'Corpus', 'Total Withdrawn', 'Expense Cost', 'Inflation-Adj. Corpus', 'Status'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        sustainable
          ? `Corpus sustains ${formatINR(monthlyWithdrawal)}/month for ${years} years with ${formatINR(Math.round(corpus))} left.`
          : `Corpus depletes before ${years} years; reduce withdrawal or increase returns.`,
        `Withdrawal rate of ${formatPercent(withdrawalRate)}; 4% rule suggests <=4% for 30-year sustainability.`,
        `Expense ratio eroded ${formatINR(Math.round(expenseDrag))} during the SWP period.`,
      ],
      mistakes: [
        'Fixed withdrawals without accounting for inflation erodes real income over time.',
        'Assuming high returns during retirement; use conservative 7-8% for equity-debt mix.',
      ],
      tips: [
        'Keep 12-24 months expenses in liquid funds for market downturns.',
        'Step-up SWP with inflation for maintaining lifestyle in retirement.',
      ],
      formula: 'Corpus_m = Corpus_{m-1} x (1 + r/12) - Withdrawal; expense ratio reduces year-end corpus',
      example: 'Rs50L corpus, Rs40K/month at 8% can be sustainable for 15+ years depending on fees and returns.',
      inflation: `Inflation reduces real value of fixed withdrawals each year at ${formatPercent(inflation * 100)}.`,
      tax: 'SWP redemptions taxed as capital gains. LTCG exemption of Rs1.25L applies.',
    }),
    pdfData: {
      title: 'SWP Calculator Report',
      summary: [
        { label: 'Initial Corpus', value: formatINR(Math.round(corpusAmount)) },
        { label: 'Total Withdrawn', value: formatINR(Math.round(totalWithdrawn)) },
        { label: 'Remaining', value: formatINR(Math.round(corpus)) },
        { label: 'Expense Ratio Cost', value: formatINR(Math.round(expenseDrag)) },
      ],
      tables: [{ title: 'Yearly Schedule', columns: ['Year', 'Corpus', 'Total Withdrawn', 'Expense Cost', 'Inflation-Adj. Corpus', 'Status'], rows }],
    },
    raw: { corpusAmount, totalWithdrawn, corpus, gain, taxAmount, expenseDrag, expenseRatio, sustainable, depletedYear },
  };
}
