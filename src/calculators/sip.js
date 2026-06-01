import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

function runSimulation(params, sipAmount, includeInflAdj = true) {
  const {
    initialLumpsum,
    years,
    ratePercentage,
    expenseRatio,
    taxRate,
    inflation,
    mode,
    stepUpType,
    stepUpValue,
  } = params;

  const rAnn = ratePercentage / 100;
  const inf = inflation / 100;
  const tax = taxRate / 100;
  const er = expenseRatio / 100;
  const months = years * 12;

  let corpus = initialLumpsum;
  let sipInvested = 0;
  let investedInflAdj = initialLumpsum;
  let expenseDrag = 0;
  let currentSIP = sipAmount;
  const yearlyData = [];

  for (let month = 1; month <= months; month++) {
    const sipThisMonth = currentSIP;
    corpus += sipThisMonth;
    sipInvested += sipThisMonth;

    if (month % 12 === 0) {
      corpus *= 1 + rAnn;
      if (er > 0) {
        const afterEr = corpus * (1 - er);
        expenseDrag += corpus - afterEr;
        corpus = afterEr;
      }

      const invested = initialLumpsum + sipInvested;
      const yr = month / 12;
      const yearGains = Math.max(0, corpus - invested);
      const yearTax = Math.max(0, yearGains - 125000) * tax;
      const postTax = corpus - yearTax;

      if (includeInflAdj) {
        investedInflAdj +=
          (sipThisMonth * 12) / Math.pow(1 + Math.max(0, inf), yr - 0.5);
      }

      yearlyData.push({
        year: yr,
        corpus,
        invested,
        postTax,
        inflationAdjustedPostTax: postTax / Math.pow(1 + Math.max(0, inf), yr),
        investedInflAdj: includeInflAdj ? investedInflAdj : invested,
      });

      if (month < months && mode === 'stepup') {
        if (stepUpType === 'pct') {
          currentSIP *= 1 + stepUpValue / 100;
        } else if (stepUpType === 'fixed') {
          currentSIP += stepUpValue;
        } else if (stepUpType === 'infl') {
          currentSIP *= 1 + inf;
        }
      }
    }
  }

  const invested = initialLumpsum + sipInvested;
  const gains = Math.max(0, corpus - invested);
  const taxAmount = Math.max(0, gains - 125000) * tax;
  const postTaxValue = corpus - taxAmount;
  const inflationAdjusted = postTaxValue / Math.pow(1 + inf, years);
  const profitLoss = Math.round(inflationAdjusted - investedInflAdj);

  return {
    invested,
    investedInflAdj,
    initialLumpsum,
    sipInvested,
    expenseDrag,
    gains,
    corpus,
    taxAmount,
    postTaxValue,
    inflationAdjusted,
    profitLoss,
    isProfit: profitLoss >= 0,
    yearlyData,
  };
}

function solveGoalSip(params) {
  const goal = parseNum(params.goalAmount, 0);
  if (goal <= 0 || params.years <= 0) return null;

  const lumpsumOnly = runSimulation(params, 0, false);
  if (lumpsumOnly.postTaxValue >= goal) {
    return { sim: lumpsumOnly, requiredMonthlySIP: 0, goalAlreadyMet: true, goalAmount: goal };
  }

  let lo = 0;
  let hi = Math.max(goal / (params.years * 12), 1000);
  while (runSimulation(params, hi, false).postTaxValue < goal) {
    hi *= 2;
    if (hi > 1e9) break;
  }
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (runSimulation(params, mid, false).postTaxValue >= goal) hi = mid;
    else lo = mid;
  }
  const requiredMonthlySIP = Math.ceil(hi);
  return {
    sim: runSimulation(params, requiredMonthlySIP, true),
    requiredMonthlySIP,
    goalAlreadyMet: false,
    goalAmount: goal,
  };
}

export function calculate(inputs) {
  const engineParams = {
    mode: inputs.mode || 'simple',
    stepUpType: inputs.stepUpType || 'pct',
    goalAmount: parseNum(inputs.goalAmount, 5000000),
    initialLumpsum: parseNum(inputs.initialLumpsum, 0),
    years: parseNum(inputs.years, 10),
    ratePercentage: parseNum(inputs.ratePercentage, 12),
    expenseRatio: parseNum(inputs.expenseRatio, 0),
    stepUpValue: parseNum(inputs.stepUpValue, 10),
    taxRate: parseNum(inputs.taxRate, 12.5),
    inflation: parseNum(inputs.inflation, 6),
  };

  let sim;
  let goalMeta = null;

  if (engineParams.mode === 'goal') {
    const goalResult = solveGoalSip(engineParams);
    if (!goalResult) {
      return {
        summary: [{ label: 'Error', value: 'Invalid goal inputs', tone: 'danger' }],
        steps: [],
        assumptions: [],
        charts: [],
        yearlyTable: { columns: [], rows: [] },
        insights: buildInsights({}),
        pdfData: { title: 'SIP Calculator Report', summary: [], tables: [] },
      };
    }
    sim = goalResult.sim;
    goalMeta = goalResult;
  } else {
    sim = runSimulation(engineParams, parseNum(inputs.monthlyAmount, 50000));
  }

  const rows = sim.yearlyData.map((d) => [
    d.year,
    formatINR(Math.round(d.invested)),
    formatINR(Math.round(d.corpus)),
    formatINR(Math.round(d.postTax)),
    formatINR(Math.round(d.inflationAdjustedPostTax)),
  ]);

  const labels = sim.yearlyData.map((d) => `Year ${d.year}`);
  const isGoal = engineParams.mode === 'goal';

  const summary = isGoal
    ? [
        { label: 'Required Monthly SIP', value: formatINR(goalMeta.requiredMonthlySIP), tone: 'primary', sub: goalMeta.goalAlreadyMet ? 'Lumpsum alone meets goal' : `To reach ${formatINR(goalMeta.goalAmount)}` },
        { label: 'Target Goal', value: formatINR(Math.round(goalMeta.goalAmount)), tone: 'success' },
        { label: 'Projected Post-Tax', value: formatINR(Math.round(sim.postTaxValue)) },
        { label: 'Total Invested', value: formatINR(Math.round(sim.invested)) },
      ]
    : [
        { label: 'Inflation-Adjusted (post-tax)', value: formatINR(Math.round(sim.inflationAdjusted)), tone: 'primary', sub: "Today's rupees" },
        { label: 'Real Profit/Loss', value: formatINR(Math.abs(sim.profitLoss)), tone: sim.isProfit ? 'success' : 'danger', sub: sim.isProfit ? 'Gain vs inflation-adj. cost' : 'Loss vs inflation-adj. cost' },
        { label: 'Post-Tax Nominal', value: formatINR(Math.round(sim.postTaxValue)), sub: 'At maturity' },
        { label: 'Total Invested', value: formatINR(Math.round(sim.invested)) },
        { label: 'Tax on Gains', value: formatINR(Math.round(sim.taxAmount)), sub: 'After ₹1.25L exemption' },
        { label: 'Expense Ratio Cost', value: formatINR(Math.round(sim.expenseDrag)), sub: 'Fees eroded from corpus' },
      ];

  const steps = [
    `Mode: ${engineParams.mode === 'goal' ? 'Goal-Based' : engineParams.mode === 'stepup' ? 'Step-Up SIP' : 'Simple SIP'}`,
    `Initial lumpsum ${formatINR(engineParams.initialLumpsum)} + SIP contributions over ${engineParams.years} years`,
    `Year-end: return ${formatPercent(engineParams.ratePercentage)} applied; expense ratio ${formatPercent(engineParams.expenseRatio)} deducted from total corpus`,
    `Corpus at maturity = ${formatINR(Math.round(sim.corpus))}; gains = ${formatINR(Math.round(sim.gains))}`,
    `Tax = max(0, gains − ₹1,25,000) × ${formatPercent(engineParams.taxRate)} = ${formatINR(Math.round(sim.taxAmount))}`,
    `Post-tax = ${formatINR(Math.round(sim.postTaxValue))}; inflation-adjusted = ${formatINR(Math.round(sim.inflationAdjusted))}`,
  ];

  if (isGoal) {
    steps.push(
      goalMeta.goalAlreadyMet
        ? 'Existing lumpsum alone meets the goal — no SIP needed.'
        : `Binary search: minimum SIP = ${formatINR(goalMeta.requiredMonthlySIP)}/month to reach ${formatINR(goalMeta.goalAmount)} post-tax.`,
    );
  }

  const chartDatasets = isGoal
    ? [
        { label: 'Post-Tax Value', data: sim.yearlyData.map((d) => Math.round(d.postTax)) },
        { label: 'Target Goal', data: sim.yearlyData.map(() => Math.round(goalMeta.goalAmount)) },
        { label: 'Total Invested', data: sim.yearlyData.map((d) => Math.round(d.invested)) },
      ]
    : [
        { label: 'Inflation-Adjusted (post-tax)', data: sim.yearlyData.map((d) => Math.round(d.inflationAdjustedPostTax)) },
        { label: "Invested (today's ₹)", data: sim.yearlyData.map((d) => Math.round(d.investedInflAdj)) },
        { label: 'Nominal (post-tax)', data: sim.yearlyData.map((d) => Math.round(d.postTax)) },
      ];

  const breakdownSlices = [
    ['Invested', Math.round(sim.invested)],
    ['Returns (net)', Math.max(0, Math.round(sim.gains - sim.taxAmount))],
    ['Tax', Math.round(sim.taxAmount)],
    ['Expense', Math.round(sim.expenseDrag)],
  ].filter(([, v]) => v > 0);

  return {
    summary,
    steps,
    assumptions: [
      'Monthly SIP added each month; return and expense ratio applied at year-end on total corpus',
      'Expense ratio deducted every year from lumpsum + SIP combined balance',
      'Tax applied once at maturity on profit (gains above ₹1.25L LTCG exemption)',
      'Inflation adjustment uses midpoint discount for SIP contributions',
      engineParams.mode === 'stepup' ? `Step-up: ${engineParams.stepUpType} by ${engineParams.stepUpValue}` : null,
    ].filter(Boolean),
    charts: [
      {
        title: isGoal ? 'Path to Goal' : 'Portfolio Growth',
        type: 'line',
        data: { labels, datasets: chartDatasets },
        height: 280,
      },
      {
        title: 'Wealth Breakdown',
        type: 'doughnut',
        data: {
          labels: breakdownSlices.map(([l]) => l),
          datasets: [{ data: breakdownSlices.map(([, v]) => v) }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      title: 'Year-by-Year Projection',
      columns: ['Year', 'Invested', 'Corpus', 'Post-Tax', 'Inflation-Adj.'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        isGoal
          ? `Invest ${formatINR(goalMeta.requiredMonthlySIP)}/month to reach ${formatINR(goalMeta.goalAmount)} in ${engineParams.years} years.`
          : `Real value of portfolio: ${formatINR(Math.round(sim.inflationAdjusted))} in today's rupees.`,
        `Expense ratio eroded ${formatINR(Math.round(sim.expenseDrag))} from corpus over ${engineParams.years} years.`,
      ],
      mistakes: [
        'Ignoring expense ratio — even 1% p.a. significantly reduces long-term corpus.',
        'Comparing nominal returns without inflation-adjusting both corpus and contributions.',
      ],
      tips: [
        'Use step-up SIP to align contributions with salary growth.',
        'Goal-based mode helps reverse-engineer the SIP needed for targets.',
      ],
      formula: 'Corpus grows with SIP + return − expense; Tax = max(0, gains − 1.25L) × rate',
      example: '₹50K/month SIP at 12% for 10 years → ~₹1.15 Cr corpus; ~₹58L inflation-adjusted at 6% inflation.',
      inflation: `Inflation-adjusted post-tax value: ${formatINR(Math.round(sim.inflationAdjusted))}.`,
      tax: `LTCG at ${formatPercent(engineParams.taxRate)} on gains above ₹1.25 lakh. Tax paid: ${formatINR(Math.round(sim.taxAmount))}.`,
    }),
    pdfData: {
      title: 'SIP Calculator Report',
      summary: summary.slice(0, 5).map((s) => ({ label: s.label, value: s.value })),
      tables: [{ title: 'Yearly Projection', columns: ['Year', 'Invested', 'Corpus', 'Post-Tax', 'Inflation-Adj.'], rows }],
    },
    raw: { ...sim, goalMeta },
  };
}
