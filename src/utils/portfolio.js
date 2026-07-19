import { annualReturnAfterExpense, emi, fdMaturity, fvLumpsum, fvSip, periodicRate } from './finance';

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

export const PORTFOLIO_BASE_YEAR = new Date().getFullYear();

export function normalizePortfolioCalendarYear(value, fallback = PORTFOLIO_BASE_YEAR) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < 1900) {
    return PORTFOLIO_BASE_YEAR + Math.min(99, Math.max(1, numeric || 1)) - 1;
  }
  return Math.min(PORTFOLIO_BASE_YEAR + 99, Math.max(1900, Math.round(numeric)));
}

function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultPortfolio(index = 0) {
  return {
    id: createId('portfolio'),
    name: `Portfolio ${index + 1}`,
    inflationAdjusted: false,
    timelineYear: PORTFOLIO_BASE_YEAR,
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
    startYear: PORTFOLIO_BASE_YEAR,
  };
}

function adjustForInflation(value, inflationRate, elapsedYear, enabled) {
  if (!enabled) return value;
  return value / Math.pow(1 + inflationRate, elapsedYear);
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

function calculateRecurringDepositValue(monthlyDeposit, annualRate, years, depositFrequency, compoundingFrequency) {
  const frequencyMap = { monthly: 12, quarterly: 4, yearly: 1 };
  const paymentsPerYear = frequencyMap[depositFrequency] || 12;
  const compoundingPerYear = frequencyMap[compoundingFrequency] || 12;
  const payment = depositFrequency === 'yearly'
    ? monthlyDeposit * 12
    : depositFrequency === 'quarterly'
      ? monthlyDeposit * 3
      : monthlyDeposit;
  const periods = years * paymentsPerYear;
  const effectiveAnnualRate = Math.pow(1 + annualRate / compoundingPerYear, compoundingPerYear) - 1;
  const periodic = Math.pow(1 + effectiveAnnualRate, 1 / paymentsPerYear) - 1;
  const value = periodic === 0
    ? payment * periods
    : payment * ((Math.pow(1 + periodic, periods) - 1) / periodic) * (1 + periodic);

  return { value, invested: payment * periods };
}

function calculatePpfValue(monthlyAmount, annualRate, years) {
  let corpus = 0;
  const monthlyRate = annualRate / 12;

  for (let year = 0; year < years; year += 1) {
    let accruedInterest = 0;
    for (let month = 0; month < 12; month += 1) {
      corpus += monthlyAmount;
      accruedInterest += corpus * monthlyRate;
    }
    corpus += accruedInterest;
  }

  return { value: corpus, invested: monthlyAmount * years * 12 };
}

function emptyPortfolioValue() {
  return {
    netWorthContribution: 0,
    monthlyInvestment: 0,
    monthlyPayment: 0,
    monthlyWithdrawal: 0,
    invested: 0,
    returns: 0,
  };
}

function getValueFromResolvedConfig(type, config, year, inflationRate, inflationAdjusted, startYear = 1) {
  if (!config || typeof config !== 'object') {
    return emptyPortfolioValue();
  }

  const normalizedStartYear = normalizePortfolioCalendarYear(startYear);
  const elapsedYear = year - normalizedStartYear + 1;
  if (elapsedYear <= 0) return emptyPortfolioValue();

  switch (type) {
    case 'SIP': {
      const years = Number(config.years || 0);
      const activeYears = Math.min(elapsedYear, years);
      const yearsAfterSip = Math.max(0, elapsedYear - years);
      const amount = Number(config.monthlyAmount || 0);
      const rate = annualReturnAfterExpense(
        Number(config.ratePercentage || 0) / 100,
        Number(config.expenseRatio || 0) / 100
      );
      const sipCorpus = fvSip(amount, rate, activeYears * 12);
      const value = yearsAfterSip > 0 ? fvLumpsum(sipCorpus, rate, yearsAfterSip) : sipCorpus;
      const invested = amount * activeYears * 12;
      return {
        netWorthContribution: adjustForInflation(value, inflationRate, elapsedYear, inflationAdjusted),
        monthlyInvestment: elapsedYear <= years ? amount : 0,
        monthlyPayment: 0,
        monthlyWithdrawal: 0,
        invested,
        returns: value - invested,
      };
    }
    case 'Loan': {
      const totalMonths = Number(config.years || 0) * 12;
      const elapsedMonths = Math.min(elapsedYear * 12, totalMonths);
      const { balance, monthlyEmi } = calculateLoanOutstanding(
        Number(config.loanAmount || 0),
        Number(config.interestRate || 0) / 100,
        totalMonths,
        elapsedMonths
      );
      return {
        netWorthContribution: -adjustForInflation(balance, inflationRate, elapsedYear, inflationAdjusted),
        monthlyInvestment: 0,
        monthlyPayment: elapsedMonths < totalMonths ? monthlyEmi : 0,
        monthlyWithdrawal: 0,
        invested: 0,
        returns: 0,
      };
    }
    case 'FD': {
      const activeYears = Math.min(elapsedYear, Number(config.years || 0));
      const frequency = Number(config.compoundingFrequency || 4);
      const invested = Number(config.principal || 0);
      const valueAtMaturity = fdMaturity(invested, Number(config.rate || 0) / 100, activeYears, frequency);
      const value = elapsedYear > Number(config.years || 0)
        ? fdMaturity(invested, Number(config.rate || 0) / 100, Number(config.years || 0), frequency)
        : valueAtMaturity;
      return { netWorthContribution: adjustForInflation(value, inflationRate, elapsedYear, inflationAdjusted), monthlyInvestment: 0, monthlyPayment: 0, monthlyWithdrawal: 0, invested, returns: value - invested };
    }
    case 'RD': {
      const activeYears = Math.min(elapsedYear, Number(config.years || 0));
      const monthlyDeposit = Number(config.monthlyDeposit || 0);
      const annualRate = Number(config.rate || 0) / 100;
      const { value, invested } = calculateRecurringDepositValue(
        monthlyDeposit,
        annualRate,
        activeYears,
        config.depositFrequency || 'monthly',
        config.compoundingFrequency || 'monthly',
      );
      return { netWorthContribution: adjustForInflation(value, inflationRate, elapsedYear, inflationAdjusted), monthlyInvestment: elapsedYear <= Number(config.years || 0) ? monthlyDeposit : 0, monthlyPayment: 0, monthlyWithdrawal: 0, invested, returns: value - invested };
    }
    case 'Lumpsum': {
      const activeYears = Math.min(elapsedYear, Number(config.years || 0));
      const invested = Number(config.amount || 0);
      const rate = annualReturnAfterExpense(
        Number(config.ratePercentage || 0) / 100,
        Number(config.expenseRatio || 0) / 100
      );
      const value = fvLumpsum(invested, rate, activeYears);
      return { netWorthContribution: adjustForInflation(value, inflationRate, elapsedYear, inflationAdjusted), monthlyInvestment: 0, monthlyPayment: 0, monthlyWithdrawal: 0, invested, returns: value - invested };
    }
    case 'PPF': {
      const activeYears = Math.min(elapsedYear, Number(config.years || 15));
      const monthlyAmount = Math.min(Number(config.monthlyAmount || 0), 12500);
      const { value, invested } = calculatePpfValue(monthlyAmount, Number(config.interestRate || 0) / 100, activeYears);
      return { netWorthContribution: adjustForInflation(value, inflationRate, elapsedYear, inflationAdjusted), monthlyInvestment: elapsedYear <= Number(config.years || 15) ? monthlyAmount : 0, monthlyPayment: 0, monthlyWithdrawal: 0, invested, returns: value - invested };
    }
    case 'SWP': {
      const totalYears = Number(config.years || 0);
      const annualRate = annualReturnAfterExpense(
        Number(config.ratePercentage || 0) / 100,
        Number(config.expenseRatio || 0) / 100
      );
      const monthlyWithdrawal = Number(config.monthlyWithdrawal || 0);
      const months = Math.min(elapsedYear, totalYears) * 12;
      const monthlyRate = periodicRate(annualRate, 12);
      let corpus = Number(config.corpusAmount || 0);
      let totalWithdrawn = 0;

      for (let month = 0; month < months && corpus > 0; month += 1) {
        corpus *= 1 + monthlyRate;
        const withdrawal = Math.min(monthlyWithdrawal, corpus);
        corpus -= withdrawal;
        totalWithdrawn += withdrawal;
      }

      return {
        netWorthContribution: adjustForInflation(corpus, inflationRate, elapsedYear, inflationAdjusted),
        monthlyInvestment: 0,
        monthlyPayment: 0,
        monthlyWithdrawal: elapsedYear <= totalYears && corpus > 0 ? monthlyWithdrawal : 0,
        invested: Number(config.corpusAmount || 0),
        returns: corpus + totalWithdrawn - Number(config.corpusAmount || 0),
      };
    }
    default:
      return emptyPortfolioValue();
  }
}

export function buildPortfolioProjection(items, inflationRate, inflationAdjusted, maxYear) {
  const labels = [];
  const netWorthSeries = [];
  const endYear = normalizePortfolioCalendarYear(maxYear);

  for (let year = PORTFOLIO_BASE_YEAR; year <= endYear; year += 1) {
    labels.push(String(year));
    const total = items.reduce((sum, item) => {
      const result = getValueFromResolvedConfig(item.type, item.resolvedConfig, year, inflationRate, inflationAdjusted, item.startYear);
      return sum + result.netWorthContribution;
    }, 0);
    netWorthSeries.push(Math.round(total));
  }

  return { labels, netWorthSeries };
}

export function buildPortfolioSnapshot(items, selectedYear, inflationRate, inflationAdjusted) {
  const normalizedSelectedYear = normalizePortfolioCalendarYear(selectedYear);
  return items.reduce(
    (acc, item) => {
      const result = getValueFromResolvedConfig(item.type, item.resolvedConfig, normalizedSelectedYear, inflationRate, inflationAdjusted, item.startYear);
      return {
        totalNetWorth: acc.totalNetWorth + result.netWorthContribution,
        monthlyInvestments: acc.monthlyInvestments + result.monthlyInvestment,
        monthlyPayments: acc.monthlyPayments + result.monthlyPayment,
        monthlyWithdrawals: acc.monthlyWithdrawals + result.monthlyWithdrawal,
        totalInvested: acc.totalInvested + result.invested,
        totalReturns: acc.totalReturns + result.returns,
      };
    },
    { totalNetWorth: 0, monthlyInvestments: 0, monthlyPayments: 0, monthlyWithdrawals: 0, totalInvested: 0, totalReturns: 0 }
  );
}
