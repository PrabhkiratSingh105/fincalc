import { emi, fdMaturity, fvLumpsum, fvSip, periodicRate } from './finance';

export const PORTFOLIO_TYPE_OPTIONS = ['SIP', 'Loan', 'FD', 'RD', 'Lumpsum', 'PPF', 'SWP'];

export const PORTFOLIO_TYPE_TO_PAGE = {
  SIP: 'sip',
  Loan: 'loan',
  FD: 'fd',
  RD: 'rd',
  Lumpsum: 'lumpsum',
  PPF: 'ppf',
  SWP: 'swp',
};

function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultPortfolio(index = 0) {
  return {
    id: createId('portfolio'),
    name: `Portfolio ${index + 1}`,
    inflationAdjusted: false,
    timelineYear: 1,
    items: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultPortfolioItem(type = 'SIP') {
  return {
    id: createId('item'),
    type,
    configId: '',
    configName: '',
    resolvedConfig: null,
  };
}

function adjustForInflation(value, inflationRate, year, enabled) {
  if (!enabled) return value;
  return value / Math.pow(1 + inflationRate, year);
}

function calculateLoanOutstanding(principal, annualRate, totalMonths, elapsedMonths) {
  const monthlyRate = periodicRate(annualRate, 12);
  const monthlyEmi = emi(principal, annualRate, totalMonths);
  let balance = principal;

  for (let month = 0; month < elapsedMonths && balance > 0; month += 1) {
    const interest = balance * monthlyRate;
    const principalPaid = monthlyEmi - interest;
    balance = Math.max(0, balance - principalPaid);
  }

  return { balance, monthlyEmi };
}

function getValueFromResolvedConfig(type, config, year, inflationRate, inflationAdjusted) {
  if (!config || typeof config !== 'object') {
    return { netWorthContribution: 0, monthlyInvestment: 0, monthlyPayment: 0, monthlyWithdrawal: 0 };
  }

  switch (type) {
    case 'SIP': {
      const years = Number(config.years || 0);
      const activeYears = Math.min(year, years);
      const amount = Number(config.monthlyAmount || 0);
      const rate = Number(config.ratePercentage || 0) / 100;
      const value = fvSip(amount, rate, activeYears * 12);
      return { netWorthContribution: adjustForInflation(value, inflationRate, year, inflationAdjusted), monthlyInvestment: amount, monthlyPayment: 0, monthlyWithdrawal: 0 };
    }
    case 'Loan': {
      const totalMonths = Number(config.years || 0) * 12;
      const elapsedMonths = Math.min(year * 12, totalMonths);
      const { balance, monthlyEmi } = calculateLoanOutstanding(
        Number(config.loanAmount || 0),
        Number(config.interestRate || 0) / 100,
        totalMonths,
        elapsedMonths
      );
      return {
        netWorthContribution: -adjustForInflation(balance, inflationRate, year, inflationAdjusted),
        monthlyInvestment: 0,
        monthlyPayment: elapsedMonths < totalMonths ? monthlyEmi : 0,
        monthlyWithdrawal: 0,
      };
    }
    case 'FD': {
      const activeYears = Math.min(year, Number(config.years || 0));
      const frequency = Number(config.compoundingFrequency || 4);
      const value = fdMaturity(Number(config.principal || 0), Number(config.rate || 0) / 100, activeYears, frequency);
      return { netWorthContribution: adjustForInflation(value, inflationRate, year, inflationAdjusted), monthlyInvestment: 0, monthlyPayment: 0, monthlyWithdrawal: 0 };
    }
    case 'RD': {
      const activeYears = Math.min(year, Number(config.years || 0));
      const monthlyDeposit = Number(config.monthlyDeposit || 0);
      const annualRate = Number(config.rate || 0) / 100;
      const value = fvSip(monthlyDeposit, annualRate, activeYears * 12);
      return { netWorthContribution: adjustForInflation(value, inflationRate, year, inflationAdjusted), monthlyInvestment: monthlyDeposit, monthlyPayment: 0, monthlyWithdrawal: 0 };
    }
    case 'Lumpsum': {
      const activeYears = Math.min(year, Number(config.years || 0));
      const value = fvLumpsum(Number(config.amount || 0), Number(config.ratePercentage || 0) / 100, activeYears);
      return { netWorthContribution: adjustForInflation(value, inflationRate, year, inflationAdjusted), monthlyInvestment: 0, monthlyPayment: 0, monthlyWithdrawal: 0 };
    }
    case 'PPF': {
      const activeYears = Math.min(year, Number(config.years || 15));
      const monthlyAmount = Number(config.monthlyAmount || 0);
      const value = fvSip(monthlyAmount, Number(config.interestRate || 0) / 100, activeYears * 12);
      return { netWorthContribution: adjustForInflation(value, inflationRate, year, inflationAdjusted), monthlyInvestment: monthlyAmount, monthlyPayment: 0, monthlyWithdrawal: 0 };
    }
    case 'SWP': {
      const totalYears = Number(config.years || 0);
      const annualRate = Number(config.ratePercentage || 0) / 100;
      const monthlyWithdrawal = Number(config.monthlyWithdrawal || 0);
      const months = Math.min(year, totalYears) * 12;
      const monthlyRate = periodicRate(annualRate, 12);
      let corpus = Number(config.corpusAmount || 0);

      for (let month = 0; month < months && corpus > 0; month += 1) {
        corpus = corpus * (1 + monthlyRate) - monthlyWithdrawal;
        corpus = Math.max(0, corpus);
      }

      return {
        netWorthContribution: adjustForInflation(corpus, inflationRate, year, inflationAdjusted),
        monthlyInvestment: 0,
        monthlyPayment: 0,
        monthlyWithdrawal: year < totalYears ? monthlyWithdrawal : 0,
      };
    }
    default:
      return { netWorthContribution: 0, monthlyInvestment: 0, monthlyPayment: 0, monthlyWithdrawal: 0 };
  }
}

export function buildPortfolioProjection(items, inflationRate, inflationAdjusted, maxYear) {
  const labels = [];
  const netWorthSeries = [];

  for (let year = 1; year <= maxYear; year += 1) {
    labels.push(`Year ${year}`);
    const total = items.reduce((sum, item) => {
      const result = getValueFromResolvedConfig(item.type, item.resolvedConfig, year, inflationRate, inflationAdjusted);
      return sum + result.netWorthContribution;
    }, 0);
    netWorthSeries.push(Math.round(total));
  }

  return { labels, netWorthSeries };
}

export function buildPortfolioSnapshot(items, selectedYear, inflationRate, inflationAdjusted) {
  return items.reduce(
    (acc, item) => {
      const result = getValueFromResolvedConfig(item.type, item.resolvedConfig, selectedYear, inflationRate, inflationAdjusted);
      return {
        totalNetWorth: acc.totalNetWorth + result.netWorthContribution,
        monthlyInvestments: acc.monthlyInvestments + result.monthlyInvestment,
        monthlyPayments: acc.monthlyPayments + result.monthlyPayment,
        monthlyWithdrawals: acc.monthlyWithdrawals + result.monthlyWithdrawal,
      };
    },
    { totalNetWorth: 0, monthlyInvestments: 0, monthlyPayments: 0, monthlyWithdrawals: 0 }
  );
}
