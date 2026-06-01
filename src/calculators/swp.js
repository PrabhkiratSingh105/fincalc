import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

export function calculate(inputs) {
  const corpusAmount = parseNum(inputs.corpusAmount, 5000000);
  const monthlyWithdrawal = parseNum(inputs.monthlyWithdrawal, 50000);
  const ratePercentage = parseNum(inputs.ratePercentage, 8) / 100;
  const years = parseNum(inputs.years, 10);
  const taxRate = parseNum(inputs.taxRate, 12.5) / 100;
  const inflation = parseNum(inputs.inflation, 6) / 100;
  const monthlyRate = ratePercentage / 12;
  const months = years * 12;

  let corpus = corpusAmount;
  let totalWithdrawn = 0;
  const rows = [];
  const corpusSeries = [];
  const withdrawnSeries = [];
  const labels = [];
  let depletedYear = null;

  for (let month = 1; month <= months; month++) {
    corpus = corpus * (1 + monthlyRate) - monthlyWithdrawal;
    totalWithdrawn += monthlyWithdrawal;
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
        formatINR(Math.round(inflAdjCorpus)),
        corpus <= 0 ? 'Depleted' : 'Active',
      ]);
      labels.push(`Year ${yr}`);
      corpusSeries.push(Math.round(corpus));
      withdrawnSeries.push(Math.round(totalWithdrawn));
    }
  }

  const gain = totalWithdrawn - corpusAmount + corpus;
  const taxable = Math.max(0, gain - 125000);
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
      { label: 'Tax on Gains', value: formatINR(Math.round(taxAmount)), sub: 'After ₹1.25L exemption' },
      { label: 'Corpus Status', value: sustainable ? 'Sustainable' : `Depleted ~Year ${depletedYear}`, tone: sustainable ? 'success' : 'warning' },
    ],
    steps: [
      `Initial corpus = ${formatINR(corpusAmount)}; monthly withdrawal = ${formatINR(monthlyWithdrawal)}`,
      `Monthly return = ${formatPercent(ratePercentage * 100)} / 12 = ${formatPercent(monthlyRate * 100, 4)}`,
      `Each month: Corpus = Corpus × (1 + r_m) − Withdrawal`,
      `After ${years} years: withdrawn ${formatINR(Math.round(totalWithdrawn))}, remaining ${formatINR(Math.round(corpus))}`,
      `Gain = withdrawn + remaining − initial = ${formatINR(Math.round(gain))}; tax = ${formatINR(Math.round(taxAmount))}`,
    ],
    assumptions: [
      'Fixed monthly withdrawal (not inflation-indexed)',
      'Constant return rate; actual market returns vary',
      'LTCG tax applied once on net gains with ₹1.25L exemption',
      'No additional contributions during withdrawal phase',
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
          labels: ['Withdrawn', 'Remaining'],
          datasets: [{ data: [Math.round(totalWithdrawn), Math.round(corpus)] }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      title: 'Year-by-Year SWP Schedule',
      columns: ['Year', 'Corpus', 'Total Withdrawn', 'Inflation-Adj. Corpus', 'Status'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        sustainable
          ? `Corpus sustains ${formatINR(monthlyWithdrawal)}/month for ${years} years with ${formatINR(Math.round(corpus))} left.`
          : `Corpus depletes before ${years} years — reduce withdrawal or increase returns.`,
        `Withdrawal rate of ${formatPercent(withdrawalRate)} — 4% rule suggests ≤4% for 30-year sustainability.`,
      ],
      mistakes: [
        'Fixed withdrawals without accounting for inflation erodes real income over time.',
        'Assuming high returns during retirement — use conservative 7–8% for equity-debt mix.',
      ],
      tips: [
        'Keep 12–24 months expenses in liquid funds for market downturns.',
        'Step-up SWP with inflation for maintaining lifestyle in retirement.',
      ],
      formula: 'Corpus_m = Corpus_{m-1} × (1 + r/12) − Withdrawal',
      example: '₹50L corpus, ₹40K/month at 8% → sustainable ~15+ years; at 10% withdrawal rate may deplete faster.',
      inflation: `Inflation reduces real value of fixed withdrawals each year at ${formatPercent(inflation * 100)}.`,
      tax: `SWP redemptions taxed as capital gains. LTCG exemption of ₹1.25L applies.`,
    }),
    pdfData: {
      title: 'SWP Calculator Report',
      summary: [
        { label: 'Initial Corpus', value: formatINR(Math.round(corpusAmount)) },
        { label: 'Total Withdrawn', value: formatINR(Math.round(totalWithdrawn)) },
        { label: 'Remaining', value: formatINR(Math.round(corpus)) },
      ],
      tables: [{ title: 'Yearly Schedule', columns: ['Year', 'Corpus', 'Total Withdrawn', 'Inflation-Adj. Corpus', 'Status'], rows }],
    },
    raw: { corpusAmount, totalWithdrawn, corpus, gain, taxAmount, sustainable, depletedYear },
  };
}
