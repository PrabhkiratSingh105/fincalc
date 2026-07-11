import { annualReturnAfterExpense, fvLumpsum, fvSip, sipRequired } from '../utils/finance';
import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

function goalProbability(projected, goal, years) {
  if (goal <= 0) return 100;
  const ratio = projected / goal;
  if (ratio >= 1) return Math.min(99, Math.round(85 + ratio * 5));

  const volatility = 0.15;
  const cushion = ratio;
  const z = (cushion - 0.85) / (volatility / Math.sqrt(years));
  const prob = 50 + 34 * Math.tanh(z);
  return Math.max(5, Math.min(85, Math.round(prob)));
}

export function calculate(inputs) {
  const currentGoalAmount = parseNum(inputs.goalAmount, 5000000);
  const goalYears = parseNum(inputs.goalYears, 10);
  const inflation = parseNum(inputs.inflation, 6) / 100;
  const returnRate = parseNum(inputs.returnRate, 12) / 100;
  const expenseRatio = parseNum(inputs.expenseRatio, 0) / 100;
  const netReturnRate = annualReturnAfterExpense(returnRate, expenseRatio);
  const existingInvestment = parseNum(inputs.existingInvestment, 0);
  const goalAmount = currentGoalAmount * Math.pow(1 + inflation, goalYears);

  const months = goalYears * 12;
  const fvExisting = fvLumpsum(existingInvestment, netReturnRate, goalYears);
  const grossExisting = fvLumpsum(existingInvestment, returnRate, goalYears);
  const remaining = Math.max(0, goalAmount - fvExisting);
  const requiredSip = sipRequired(remaining, netReturnRate, months);
  const requiredLumpsum = remaining / Math.pow(1 + netReturnRate, goalYears);
  const projectedCorpus = fvExisting + fvSip(requiredSip, netReturnRate, months);
  const projectedGrossCorpus = grossExisting + fvSip(requiredSip, returnRate, months);
  const expenseDrag = Math.max(0, projectedGrossCorpus - projectedCorpus);
  const probability = goalProbability(projectedCorpus, goalAmount, goalYears);

  const rows = [];
  let corpus = existingInvestment;
  let invested = existingInvestment;
  const sip = requiredSip;

  for (let yr = 1; yr <= goalYears; yr += 1) {
    corpus = fvLumpsum(corpus, netReturnRate, 1) + fvSip(sip, netReturnRate, 12);
    invested += sip * 12;
    rows.push([
      yr,
      formatINR(Math.round(invested)),
      formatINR(Math.round(corpus)),
      formatINR(Math.round(Math.min(corpus, goalAmount))),
      `${Math.min(100, Math.round((corpus / goalAmount) * 100))}%`,
    ]);
  }

  const labels = rows.map((r) => `Year ${r[0]}`);

  return {
    summary: [
      { label: 'Future Goal Amount', value: formatINR(Math.round(goalAmount)), tone: 'primary' },
      { label: "Today's Goal Amount", value: formatINR(Math.round(currentGoalAmount)) },
      { label: 'Required SIP', value: formatINR(Math.round(requiredSip)), sub: 'Monthly investment needed' },
      { label: 'Required Lumpsum', value: formatINR(Math.round(requiredLumpsum)), sub: 'One-time investment today' },
      { label: 'Existing FV', value: formatINR(Math.round(fvExisting)), sub: 'Future value of current investment' },
      { label: 'Expense Ratio Cost', value: formatINR(Math.round(expenseDrag)), sub: 'Estimated drag versus gross return' },
      { label: 'Goal Probability', value: `${probability}%`, tone: probability >= 70 ? 'success' : probability >= 40 ? 'warning' : 'danger' },
    ],
    steps: [
      `Goal: ${formatINR(Math.round(goalAmount))} in ${goalYears} years at ${formatPercent(returnRate * 100)} return`,
      `Net annual return after ${formatPercent(expenseRatio * 100)} expense ratio = ${formatPercent(netReturnRate * 100)}`,
      `Today's goal ${formatINR(currentGoalAmount)} inflated at ${formatPercent(inflation * 100)} becomes ${formatINR(Math.round(goalAmount))}`,
      `Existing investment FV = ${formatINR(Math.round(fvExisting))}`,
      `Remaining gap = ${formatINR(Math.round(remaining))}`,
      `Required SIP = ${formatINR(Math.round(requiredSip))}/month`,
      `Alternative lumpsum today = ${formatINR(Math.round(requiredLumpsum))}`,
    ],
    assumptions: [
      `Constant ${formatPercent(returnRate * 100)} annual return before ${formatPercent(expenseRatio * 100)} expense ratio`,
      'SIP invested at start of each month',
      'Goal probability is a heuristic based on projected vs target corpus',
      `Goal amount inflated at ${formatPercent(inflation * 100)} p.a.`,
      'No tax calculation; expense ratio is included in compounding',
    ],
    charts: [
      {
        title: 'Goal Progress Projection',
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Projected Corpus',
              data: rows.map((_, i) => {
                let c = existingInvestment;
                for (let y = 1; y <= i + 1; y += 1) {
                  c = fvLumpsum(c, netReturnRate, 1) + fvSip(sip, netReturnRate, 12);
                }
                return Math.round(c);
              }),
            },
            { label: 'Goal', data: labels.map(() => Math.round(goalAmount)) },
          ],
        },
        height: 280,
      },
      {
        title: 'Funding Split',
        type: 'doughnut',
        data: {
          labels: ['From Existing', 'From SIP', 'Expense'],
          datasets: [{
            data: [
              Math.round(fvExisting),
              Math.round(Math.max(0, goalAmount - fvExisting)),
              Math.round(expenseDrag),
            ],
          }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      columns: ['Year', 'Total Invested', 'Corpus', 'Goal Progress', '% of Goal'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        `Invest ${formatINR(Math.round(requiredSip))}/month for ${goalYears} years to reach ${formatINR(goalAmount)} after expense ratio.`,
        remaining <= 0
          ? 'Your existing investment alone may reach the goal.'
          : `Or invest ${formatINR(Math.round(requiredLumpsum))} lumpsum today instead of SIP.`,
      ],
      tips: [
        'Start early; each year delayed increases the required SIP significantly.',
        'Consider a hybrid: partial lumpsum plus SIP to balance liquidity and returns.',
        'Compare direct and regular plan expense ratios because the difference compounds.',
      ],
      inflation: `At ${formatPercent(inflation * 100)} inflation, today's ${formatINR(currentGoalAmount)} goal needs ${formatINR(Math.round(goalAmount))} in ${goalYears} years.`,
      formula: 'Net r = (1 + return) x (1 - expense ratio) - 1; SIP = FV / [((1+r)^n - 1)/r x (1+r)]',
    }),
    pdfData: {
      title: 'Goal SIP Planner',
      summary: [
        { label: 'Future Goal', value: formatINR(Math.round(goalAmount)) },
        { label: "Today's Goal", value: formatINR(Math.round(currentGoalAmount)) },
        { label: 'Required SIP', value: formatINR(Math.round(requiredSip)) },
        { label: 'Required Lumpsum', value: formatINR(Math.round(requiredLumpsum)) },
        { label: 'Expense Ratio Cost', value: formatINR(Math.round(expenseDrag)) },
        { label: 'Goal Probability', value: `${probability}%` },
      ],
      tables: [{ title: 'Yearly Projection', columns: ['Year', 'Total Invested', 'Corpus', 'Goal Progress', '% of Goal'], rows }],
    },
    raw: {
      goalAmount,
      currentGoalAmount,
      requiredSip,
      requiredLumpsum,
      fvExisting,
      projectedCorpus,
      expenseDrag,
      expenseRatio,
      goalProbability: probability,
    },
  };
}
