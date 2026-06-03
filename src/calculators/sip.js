import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

const LTCG_EXEMPTION_LIMIT = 125000; // ₹1,25,000

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
    harvestingEnabled,
    familyMembers,
  } = params;

  const rAnn = ratePercentage / 100;
  const inf = inflation / 100;
  const tax = taxRate / 100;
  const er = expenseRatio / 100;
  const months = years * 12;
  const annualHarvestingLimit = LTCG_EXEMPTION_LIMIT * Math.max(1, Math.floor(familyMembers || 1));

  let corpus = initialLumpsum;
  let sipInvested = 0;
  let investedInflAdj = initialLumpsum;
  let expenseDrag = 0;
  let currentSIP = sipAmount;
  let costBasis = initialLumpsum;
  let totalHarvestedGains = 0;
  const yearlyData = [];
  const harvestedGainHistory = [];
  const costBasisHistory = [];

  for (let month = 1; month <= months; month++) {
    const sipThisMonth = currentSIP;
    corpus += sipThisMonth;
    sipInvested += sipThisMonth;
    costBasis += sipThisMonth;

    if (month % 12 === 0) {
      corpus *= 1 + rAnn;
      if (er > 0) {
        const afterEr = corpus * (1 - er);
        expenseDrag += corpus - afterEr;
        corpus = afterEr;
      }

      const yr = month / 12;
      
      // Tax Gain Harvesting Logic (Mode A: Optimal Harvesting)
      let harvestedThisYear = 0;
      if (harvestingEnabled) {
        const unrealizedGain = Math.max(0, corpus - costBasis);
        harvestedThisYear = Math.min(unrealizedGain, annualHarvestingLimit);
        if (harvestedThisYear > 0) {
          costBasis += harvestedThisYear;
          totalHarvestedGains += harvestedThisYear;
        }
      }
      
      harvestedGainHistory.push(harvestedThisYear);
      costBasisHistory.push(costBasis);

      const invested = initialLumpsum + sipInvested;
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
        costBasis,
        postTax,
        inflationAdjustedPostTax: postTax / Math.pow(1 + Math.max(0, inf), yr),
        investedInflAdj: includeInflAdj ? investedInflAdj : invested,
        harvestedThisYear,
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
  
  // Calculate tax with harvesting consideration
  let taxableGain = gains;
  let taxAmount = 0;
  let taxSavedByHarvesting = 0;
  
  if (harvestingEnabled) {
    // With harvesting: taxable gain is reduced by harvested amounts
    const finalTaxableGain = Math.max(0, corpus - costBasis);
    taxableGain = finalTaxableGain;
    taxAmount = Math.max(0, finalTaxableGain - annualHarvestingLimit) * tax;
    
    // Calculate tax that would have been paid without harvesting
    const taxWithoutHarvesting = Math.max(0, gains - annualHarvestingLimit) * tax;
    taxSavedByHarvesting = Math.max(0, taxWithoutHarvesting - taxAmount);
  } else {
    taxAmount = Math.max(0, gains - LTCG_EXEMPTION_LIMIT) * tax;
  }
  
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
    harvestingEnabled,
    familyMembers: Math.max(1, Math.floor(familyMembers || 1)),
    annualHarvestingLimit,
    totalHarvestedGains,
    finalCostBasis: costBasis,
    finalTaxableGain: taxableGain,
    taxSavedByHarvesting,
    harvestedGainHistory,
    costBasisHistory,
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
    harvestingEnabled: inputs.harvestingEnabled === true || inputs.harvestingEnabled === 'true',
    familyMembers: Math.max(1, Math.floor(parseNum(inputs.familyMembers, 1))),
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
    formatINR(Math.round(d.investedInflAdj)),
    formatINR(Math.round(d.corpus)),
    formatINR(Math.round(d.postTax)),
    formatINR(Math.round(d.inflationAdjustedPostTax)),
  ]);

  const labels = sim.yearlyData.map((d) => `Year ${d.year}`);
  const isGoal = engineParams.mode === 'goal';

  // Summary cards with harvesting results
  const summaryBase = isGoal
    ? [
        { label: 'Required Monthly SIP', value: formatINR(goalMeta.requiredMonthlySIP), tone: 'primary', sub: goalMeta.goalAlreadyMet ? 'Lumpsum alone meets goal' : `To reach ${formatINR(goalMeta.goalAmount)}` },
        { label: 'Target Goal', value: formatINR(Math.round(goalMeta.goalAmount)), tone: 'success' },
        { label: 'Projected Post-Tax', value: formatINR(Math.round(sim.postTaxValue)) },
        { label: 'Nominal Invested', value: formatINR(Math.round(sim.invested)) },
        { label: 'Inflation-Adjusted Invested', value: formatINR(Math.round(sim.investedInflAdj)), sub: "Today's purchasing power" },
      ]
    : [
        { label: 'Inflation-Adjusted (post-tax)', value: formatINR(Math.round(sim.inflationAdjusted)), tone: 'primary', sub: "Today's rupees" },
        { label: 'Real Profit/Loss', value: formatINR(Math.abs(sim.profitLoss)), tone: sim.isProfit ? 'success' : 'danger', sub: sim.isProfit ? 'Gain vs inflation-adj. cost' : 'Loss vs inflation-adj. cost' },
        { label: 'Post-Tax Nominal', value: formatINR(Math.round(sim.postTaxValue)), sub: 'At maturity' },
        { label: 'Nominal Invested', value: formatINR(Math.round(sim.invested)) },
        { label: 'Inflation-Adjusted Invested', value: formatINR(Math.round(sim.investedInflAdj)), sub: "Today's purchasing power" },
        { label: 'Tax on Gains', value: formatINR(Math.round(sim.taxAmount)), sub: 'After exemptions' },
        { label: 'Expense Ratio Cost', value: formatINR(Math.round(sim.expenseDrag)), sub: 'Fees eroded from corpus' },
      ];

  // Add harvesting-specific summary cards if enabled
  const summary = sim.harvestingEnabled
    ? [
        ...summaryBase,
        { label: 'Tax Gain Harvesting Status', value: 'Enabled', tone: 'success', sub: 'Annual harvesting active' },
        { label: 'Family Members', value: String(sim.familyMembers), sub: `Harvesting limit ${formatINR(sim.annualHarvestingLimit)}/year` },
        { label: 'Total Harvested Gains', value: formatINR(Math.round(sim.totalHarvestedGains)), tone: 'primary', sub: `Up to ${formatINR(sim.annualHarvestingLimit)}/year` },
        { label: 'Updated Cost Basis', value: formatINR(Math.round(sim.finalCostBasis)), sub: 'After harvesting' },
        { label: 'Estimated Tax Saved', value: formatINR(Math.round(sim.taxSavedByHarvesting)), tone: 'success', sub: 'vs. no harvesting' },
        { label: 'Final Taxable Gain', value: formatINR(Math.round(sim.finalTaxableGain)), sub: 'At withdrawal' },
        { label: 'Total LTCG Tax', value: formatINR(Math.round(sim.taxAmount)), sub: 'With harvesting' },
      ]
    : summaryBase;

  const steps = [
    `Mode: ${engineParams.mode === 'goal' ? 'Goal-Based' : engineParams.mode === 'stepup' ? 'Step-Up SIP' : 'Simple SIP'}`,
    `Initial lumpsum ${formatINR(engineParams.initialLumpsum)} + SIP contributions over ${engineParams.years} years`,
    `Year-end: return ${formatPercent(engineParams.ratePercentage)} applied; expense ratio ${formatPercent(engineParams.expenseRatio)} deducted from total corpus`,
    engineParams.harvestingEnabled
      ? `Tax Gain Harvesting: ${formatINR(Math.round(sim.totalHarvestedGains))} harvested across ${engineParams.years} years (up to ${formatINR(sim.annualHarvestingLimit)}/year for ${sim.familyMembers} family member${sim.familyMembers > 1 ? 's' : ''})`
      : 'Tax Gain Harvesting: Disabled',
    `Corpus at maturity = ${formatINR(Math.round(sim.corpus))}; gains = ${formatINR(Math.round(sim.gains))}`,
    engineParams.harvestingEnabled
      ? `With harvesting: final cost basis = ${formatINR(Math.round(sim.finalCostBasis))}; taxable gain = ${formatINR(Math.round(sim.finalTaxableGain))}; tax = ${formatINR(Math.round(sim.taxAmount))}`
      : `Tax = max(0, gains − ₹1,25,000) × ${formatPercent(engineParams.taxRate)} = ${formatINR(Math.round(sim.taxAmount))}`,
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
        { label: 'Nominal Invested', data: sim.yearlyData.map((d) => Math.round(d.invested)) },
      ]
    : [
        { label: 'Inflation-Adjusted (post-tax)', data: sim.yearlyData.map((d) => Math.round(d.inflationAdjustedPostTax)) },
        { label: "Invested (today's ₹)", data: sim.yearlyData.map((d) => Math.round(d.investedInflAdj)) },
        { label: 'Nominal (post-tax)', data: sim.yearlyData.map((d) => Math.round(d.postTax)) },
      ];

  // Add cost basis dataset if harvesting enabled
  const costBasisDataset = sim.harvestingEnabled
    ? [{ label: 'Cost Basis', data: sim.yearlyData.map((d) => Math.round(d.costBasis)) }]
    : [];

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
      sim.harvestingEnabled
        ? `Tax Gain Harvesting: ${formatINR(Math.round(sim.totalHarvestedGains))} harvested over ${engineParams.years} years using ${sim.familyMembers} family member${sim.familyMembers > 1 ? 's' : ''}; annual limit ${formatINR(sim.annualHarvestingLimit)}; estimated tax saved: ${formatINR(Math.round(sim.taxSavedByHarvesting))}`
        : 'Tax applied once at maturity on profit (gains above ₹1.25L LTCG exemption)',
      'Inflation adjustment uses midpoint discount for SIP contributions',
      engineParams.mode === 'stepup' ? `Step-up: ${engineParams.stepUpType} by ${engineParams.stepUpValue}` : null,
    ].filter(Boolean),
    charts: [
      {
        title: isGoal ? 'Path to Goal' : 'Portfolio Growth',
        type: 'line',
        data: { labels, datasets: [...chartDatasets, ...costBasisDataset] },
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
      columns: sim.harvestingEnabled
        ? ['Year', 'Nominal Invested', 'Inflation-Adj. Invested', 'Corpus', 'Cost Basis', 'Post-Tax', 'Inflation-Adj.']
        : ['Year', 'Nominal Invested', 'Inflation-Adj. Invested', 'Corpus', 'Post-Tax', 'Inflation-Adj.'],
      rows: sim.harvestingEnabled
        ? sim.yearlyData.map((d) => [
            d.year,
            formatINR(Math.round(d.invested)),
            formatINR(Math.round(d.investedInflAdj)),
            formatINR(Math.round(d.corpus)),
            formatINR(Math.round(d.costBasis)),
            formatINR(Math.round(d.postTax)),
            formatINR(Math.round(d.inflationAdjustedPostTax)),
          ])
        : rows,
    },
    insights: buildInsights({
      takeaways: [
        isGoal
          ? `Invest ${formatINR(goalMeta.requiredMonthlySIP)}/month to reach ${formatINR(goalMeta.goalAmount)} in ${engineParams.years} years.`
          : `Real value of portfolio: ${formatINR(Math.round(sim.inflationAdjusted))} in today's rupees.`,
        sim.harvestingEnabled
          ? `Tax Gain Harvesting saved ${formatINR(Math.round(sim.taxSavedByHarvesting))} in taxes by harvesting up to ${formatINR(sim.annualHarvestingLimit)} annually.`
          : 'Enable Tax Gain Harvesting to optimize tax liability and increase cost basis.',
        `Expense ratio eroded ${formatINR(Math.round(sim.expenseDrag))} from corpus over ${engineParams.years} years.`,
      ],
      mistakes: [
        'Ignoring expense ratio — even 1% p.a. significantly reduces long-term corpus.',
        'Comparing nominal returns without inflation-adjusting both corpus and contributions.',
        'Missing Tax Gain Harvesting opportunity — can reduce taxable gains significantly.',
      ],
      tips: [
        'Use step-up SIP to align contributions with salary growth.',
        'Goal-based mode helps reverse-engineer the SIP needed for targets.',
        'Enable Tax Gain Harvesting to optimize tax liability within LTCG exemption limits.',
      ],
      formula: sim.harvestingEnabled
        ? 'With harvesting: Harvest = min(gains, ₹1.25L) annually; New cost basis += harvest; Tax = max(0, final gains − ₹1.25L) × rate'
        : 'Corpus grows with SIP + return − expense; Tax = max(0, gains − 1.25L) × rate',
      example: sim.harvestingEnabled
        ? `₹50K/month SIP at 12% for 10 years: Without harvesting ~₹13.2L tax; With harvesting ~${formatINR(Math.round(sim.taxAmount))} tax (saved ${formatINR(Math.round(sim.taxSavedByHarvesting))}).`
        : '₹50K/month SIP at 12% for 10 years → ~₹1.15 Cr corpus; ~₹58L inflation-adjusted at 6% inflation.',
      inflation: `Inflation-adjusted post-tax value: ${formatINR(Math.round(sim.inflationAdjusted))}.`,
      tax: sim.harvestingEnabled
        ? `LTCG at ${formatPercent(engineParams.taxRate)} on gains. With harvesting: total tax ${formatINR(Math.round(sim.taxAmount))} (saved ${formatINR(Math.round(sim.taxSavedByHarvesting))}).`
        : `LTCG at ${formatPercent(engineParams.taxRate)} on gains above ₹1.25 lakh. Tax paid: ${formatINR(Math.round(sim.taxAmount))}.`,
    }),
    pdfData: {
      title: 'SIP Calculator Report',
      summary: summary.slice(0, 6).map((s) => ({ label: s.label, value: s.value })),
      tables: [
        {
          title: 'Yearly Projection',
          columns: sim.harvestingEnabled
            ? ['Year', 'Nominal Invested', 'Inflation-Adj. Invested', 'Corpus', 'Cost Basis', 'Post-Tax', 'Inflation-Adj.']
            : ['Year', 'Nominal Invested', 'Inflation-Adj. Invested', 'Corpus', 'Post-Tax', 'Inflation-Adj.'],
          rows: sim.harvestingEnabled
            ? sim.yearlyData.map((d) => [
                d.year,
                formatINR(Math.round(d.invested)),
                formatINR(Math.round(d.investedInflAdj)),
                formatINR(Math.round(d.corpus)),
                formatINR(Math.round(d.costBasis)),
                formatINR(Math.round(d.postTax)),
                formatINR(Math.round(d.inflationAdjustedPostTax)),
              ])
            : rows,
        },
      ],
    },
    raw: { ...sim, goalMeta },
  };
}
