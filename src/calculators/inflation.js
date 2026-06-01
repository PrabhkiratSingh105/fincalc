import { formatINR, formatPercent, parseNum } from '../utils/format';
import { buildInsights } from '../utils/calculatorHelpers';

export function calculate(inputs) {
  const amount = parseNum(inputs.amount, 100000);
  const inflation = parseNum(inputs.inflation, 6) / 100;
  const years = parseNum(inputs.years, 10);

  const futureValue = amount * Math.pow(1 + inflation, years);
  const purchasingPower = amount / Math.pow(1 + inflation, years);
  const realLoss = amount - purchasingPower;
  const lossPercent = amount > 0 ? (realLoss / amount) * 100 : 0;

  const rows = [];
  const fvSeries = [];
  const ppSeries = [];
  const labels = [];

  for (let yr = 0; yr <= years; yr++) {
    const fv = amount * Math.pow(1 + inflation, yr);
    const pp = amount / Math.pow(1 + inflation, yr);
    rows.push([
      yr,
      formatINR(Math.round(amount)),
      formatINR(Math.round(fv)),
      formatINR(Math.round(pp)),
      formatPercent(((pp / amount) * 100) - 100, 1),
    ]);
    labels.push(yr === 0 ? 'Now' : `Year ${yr}`);
    fvSeries.push(Math.round(fv));
    ppSeries.push(Math.round(pp));
  }

  return {
    summary: [
      { label: 'Current Amount', value: formatINR(Math.round(amount)), tone: 'primary' },
      { label: 'Future Nominal Value', value: formatINR(Math.round(futureValue)), sub: `After ${years} years at ${formatPercent(inflation * 100)} inflation` },
      { label: 'Purchasing Power', value: formatINR(Math.round(purchasingPower)), sub: "Today's rupee equivalent", tone: 'warning' },
      { label: 'Real Value Lost', value: formatINR(Math.round(realLoss)), sub: formatPercent(lossPercent, 1) + ' erosion' },
    ],
    steps: [
      `Future Value = PV × (1 + i)^n = ${formatINR(amount)} × (1 + ${formatPercent(inflation * 100)})^${years}`,
      `FV = ${formatINR(Math.round(futureValue))}`,
      `Purchasing Power = PV / (1 + i)^n = ${formatINR(Math.round(purchasingPower))}`,
      `You need ${formatINR(Math.round(futureValue))} in ${years} years to buy what ${formatINR(amount)} buys today`,
    ],
    assumptions: [
      `Constant inflation rate of ${formatPercent(inflation * 100)} per year`,
      'Purchasing power measured in today\'s rupees',
      'Does not account for varying inflation or asset-class returns',
    ],
    charts: [
      {
        title: 'Nominal vs Real Value',
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Nominal FV', data: fvSeries },
            { label: 'Purchasing Power', data: ppSeries },
            { label: 'Original Amount', data: labels.map(() => Math.round(amount)) },
          ],
        },
        height: 280,
      },
      {
        title: 'Value Erosion',
        type: 'bar',
        data: {
          labels: ['Today', `After ${years}y`],
          datasets: [{
            label: 'Purchasing Power',
            data: [Math.round(amount), Math.round(purchasingPower)],
          }],
        },
        height: 240,
      },
    ],
    yearlyTable: {
      columns: ['Year', 'Principal', 'Nominal FV', 'Purchasing Power', 'Change vs Today'],
      rows,
    },
    insights: buildInsights({
      takeaways: [
        `${formatINR(amount)} today will feel like ${formatINR(Math.round(purchasingPower))} in ${years} years.`,
        `You'll need ${formatINR(Math.round(futureValue))} to maintain the same lifestyle.`,
      ],
      tips: [
        'Invest in assets that beat inflation (equity, real estate) rather than holding cash.',
        'Factor inflation into retirement and goal planning — nominal returns can be misleading.',
      ],
      formula: 'FV = PV × (1 + i)^n  |  Real Value = PV / (1 + i)^n',
      inflation: `At ${formatPercent(inflation * 100)} inflation, money loses half its value in ~${Math.round(Math.log(0.5) / Math.log(1 + inflation))} years`,
    }),
    pdfData: {
      title: 'Inflation Impact Report',
      summary: [
        { label: 'Current Amount', value: formatINR(Math.round(amount)) },
        { label: 'Future Nominal Value', value: formatINR(Math.round(futureValue)) },
        { label: 'Purchasing Power', value: formatINR(Math.round(purchasingPower)) },
      ],
      tables: [{ title: 'Yearly Breakdown', columns: ['Year', 'Principal', 'Nominal FV', 'Purchasing Power', 'Change vs Today'], rows }],
    },
    raw: { amount, futureValue, purchasingPower, realLoss, inflation, years },
  };
}
