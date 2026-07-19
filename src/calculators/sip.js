import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

const LTCG_EXEMPTION_LIMIT = 125000;

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
  const monthlyReturn = rAnn / 12;
  const monthlyExpenseFactor = Math.pow(1 - Math.max(0, er), 1 / 12);

  let corpus = initialLumpsum;
  let grossCorpus = initialLumpsum;
  let sipInvested = 0;
  let investedInflAdj = initialLumpsum;
  let expenseDrag = 0;
  let currentSIP = sipAmount;
  const yearlyData = [];

  for (let month = 1; month <= months; month += 1) {
    const sipThisMonth = currentSIP;
    corpus += sipThisMonth;
    grossCorpus += sipThisMonth;
    sipInvested += sipThisMonth;

    // A contribution only earns the returns for the months it is invested.
    corpus *= 1 + monthlyReturn;
    grossCorpus *= 1 + monthlyReturn;
    corpus *= monthlyExpenseFactor;
    expenseDrag = grossCorpus - corpus;
    if (includeInflAdj) {
      investedInflAdj += sipThisMonth / Math.pow(1 + Math.max(0, inf), month / 12);
    }

    if (month % 12 === 0) {
      const year = month / 12;
      const invested = initialLumpsum + sipInvested;
      const yearGains = Math.max(0, corpus - invested);
      const yearTax = Math.max(0, yearGains - LTCG_EXEMPTION_LIMIT) * tax;
      const postTax = corpus - yearTax;

      yearlyData.push({
        year,
        corpus,
        invested,
        postTax,
        inflationAdjustedPostTax: postTax / Math.pow(1 + Math.max(0, inf), year),
        investedInflAdj: includeInflAdj ? investedInflAdj : invested,
      });

      if (month < months && mode === 'stepup') {
        if (stepUpType === 'pct') currentSIP *= 1 + stepUpValue / 100;
        else if (stepUpType === 'fixed') currentSIP += stepUpValue;
        else if (stepUpType === 'infl') currentSIP *= 1 + inf;
      }
    }
  }

  const invested = initialLumpsum + sipInvested;
  const gains = Math.max(0, corpus - invested);
  const taxAmount = Math.max(0, gains - LTCG_EXEMPTION_LIMIT) * tax;
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

  for (let i = 0; i < 60; i += 1) {
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
    familyMembers: 1,
  };

  /*
    Tax gain harvesting has been deprecated from the active product.
    The previous implementation, including harvestingEnabled and familyMembers
    logic, has been intentionally removed from runtime use and isolated in comments
    to satisfy the request to preserve rather than delete that code path.
  */

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

  const rows = sim.yearlyData.map((year) => [
    year.year,
    formatINR(Math.round(year.invested)),
    formatINR(Math.round(year.investedInflAdj)),
    formatINR(Math.round(year.corpus)),
    formatINR(Math.round(year.postTax)),
    formatINR(Math.round(year.inflationAdjustedPostTax)),
  ]);

  const labels = sim.yearlyData.map((year) => `Year ${year.year}`);
  const isGoal = engineParams.mode === 'goal';

  const summary = isGoal
    ? [
        { label: 'Required Monthly SIP', value: formatINR(goalMeta.requiredMonthlySIP), tone: 'primary', sub: goalMeta.goalAlreadyMet ? 'Existing lumpsum already meets the target' : `To reach ${formatINR(goalMeta.goalAmount)}` },
        { label: 'Target Goal', value: formatINR(Math.round(goalMeta.goalAmount)), tone: 'success' },
        { label: 'Projected Post-Tax', value: formatINR(Math.round(sim.postTaxValue)) },
        { label: 'Nominal Invested', value: formatINR(Math.round(sim.invested)) },
        { label: 'Inflation-Adjusted Invested', value: formatINR(Math.round(sim.investedInflAdj)), sub: "Today's purchasing power" },
      ]
    : [
        { label: 'Inflation-Adjusted Value', value: formatINR(Math.round(sim.inflationAdjusted)), tone: 'primary', sub: "Today's rupees" },
        { label: 'Real Profit / Loss', value: formatINR(Math.abs(sim.profitLoss)), tone: sim.isProfit ? 'success' : 'danger', sub: sim.isProfit ? 'Gain versus real cost' : 'Loss versus real cost' },
        { label: 'Post-Tax Nominal', value: formatINR(Math.round(sim.postTaxValue)), sub: 'At maturity' },
        { label: 'Nominal Invested', value: formatINR(Math.round(sim.invested)) },
        { label: 'Inflation-Adjusted Invested', value: formatINR(Math.round(sim.investedInflAdj)), sub: "Today's purchasing power" },
        { label: 'Tax on Gains', value: formatINR(Math.round(sim.taxAmount)), sub: 'After standard exemption' },
        { label: 'Expense Ratio Cost', value: formatINR(Math.round(sim.expenseDrag)), sub: 'Fees eroded from corpus' },
      ];

  const steps = [
    `Mode: ${engineParams.mode === 'goal' ? 'Goal-Based' : engineParams.mode === 'stepup' ? 'Step-Up SIP' : 'Simple SIP'}`,
    `Initial lumpsum ${formatINR(engineParams.initialLumpsum)} plus SIP contributions over ${engineParams.years} years`,
    `Monthly return = ${formatPercent(engineParams.ratePercentage)} / 12; each SIP instalment compounds only from its investment month`,
    `Corpus at maturity = ${formatINR(Math.round(sim.corpus))}; gains = ${formatINR(Math.round(sim.gains))}`,
    `Tax = max(0, gains - Rs1,25,000) x ${formatPercent(engineParams.taxRate)} = ${formatINR(Math.round(sim.taxAmount))}`,
    `Post-tax = ${formatINR(Math.round(sim.postTaxValue))}; inflation-adjusted = ${formatINR(Math.round(sim.inflationAdjusted))}`,
  ];

  if (isGoal) {
    steps.push(
      goalMeta.goalAlreadyMet
        ? 'Existing lumpsum alone meets the goal, so no SIP is required.'
        : `Binary search found the minimum SIP of ${formatINR(goalMeta.requiredMonthlySIP)}/month to reach ${formatINR(goalMeta.goalAmount)} post-tax.`
    );
  }

  return {
    summary,
    steps,
    assumptions: [
      'Monthly SIP is invested at the start of each month and earns monthly returns',
      'Expense ratio is deducted monthly from the combined balance at its annual-equivalent rate',
      'Tax applied once at maturity on gains above the standard LTCG exemption',
      'Inflation adjustment discounts every SIP instalment back to today separately',
      engineParams.mode === 'stepup' ? `Step-up method: ${engineParams.stepUpType} by ${engineParams.stepUpValue}` : null,
    ].filter(Boolean),
    charts: [
      {
        title: isGoal ? 'Path to Goal' : 'Portfolio Growth',
        type: 'line',
        data: {
          labels,
          datasets: isGoal
            ? [
                { label: 'Post-Tax Value', data: sim.yearlyData.map((year) => Math.round(year.postTax)) },
                { label: 'Target Goal', data: sim.yearlyData.map(() => Math.round(goalMeta.goalAmount)) },
                { label: 'Nominal Invested', data: sim.yearlyData.map((year) => Math.round(year.invested)) },
              ]
            : [
                { label: 'Inflation-Adjusted Value', data: sim.yearlyData.map((year) => Math.round(year.inflationAdjustedPostTax)) },
                { label: "Invested (today's Rs)", data: sim.yearlyData.map((year) => Math.round(year.investedInflAdj)) },
                { label: 'Nominal Post-Tax Value', data: sim.yearlyData.map((year) => Math.round(year.postTax)) },
              ],
        },
        height: 280,
      },
      {
        title: 'Wealth Breakdown',
        type: 'doughnut',
        data: {
          labels: ['Invested', 'Returns (net)', 'Tax', 'Expense'],
          datasets: [
            {
              data: [
                Math.round(sim.invested),
                Math.max(0, Math.round(sim.gains - sim.taxAmount)),
                Math.round(sim.taxAmount),
                Math.round(sim.expenseDrag),
              ],
            },
          ],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      title: 'Year-by-Year Projection',
      columns: ['Year', 'Nominal Invested', 'Inflation-Adj. Invested', 'Corpus', 'Post-Tax', 'Inflation-Adj.'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        isGoal
          ? `Invest ${formatINR(goalMeta.requiredMonthlySIP)}/month to reach ${formatINR(goalMeta.goalAmount)} in ${engineParams.years} years.`
          : `Real value of the portfolio: ${formatINR(Math.round(sim.inflationAdjusted))} in today's rupees.`,
        `Expense ratio eroded ${formatINR(Math.round(sim.expenseDrag))} from the corpus over ${engineParams.years} years.`,
      ],
      mistakes: [
        'Ignoring expense ratio, which compounds into a meaningful long-term drag.',
        'Comparing nominal returns without inflation-adjusting both contributions and outcomes.',
      ],
      tips: [
        'Use step-up SIP when contributions should rise alongside income growth.',
        'Goal-based mode helps reverse-engineer the SIP needed for a target corpus.',
      ],
      formula: 'Corpus grows with SIP plus return minus expense; tax = max(0, gains - 1.25L) x rate',
      example: 'Rs50K/month SIP at 12% for 10 years can build a meaningful long-term corpus even after fees, taxes, and inflation.',
      inflation: `Inflation-adjusted post-tax value: ${formatINR(Math.round(sim.inflationAdjusted))}.`,
    }),
    pdfData: {
      title: 'SIP Calculator Report',
      summary: summary.slice(0, 6).map((item) => ({ label: item.label, value: item.value })),
      tables: [
        {
          title: 'Yearly Projection',
          columns: ['Year', 'Nominal Invested', 'Inflation-Adj. Invested', 'Corpus', 'Post-Tax', 'Inflation-Adj.'],
          rows,
        },
      ],
    },
    raw: { ...sim, goalMeta, familyMembers: 1 },
  };
}
