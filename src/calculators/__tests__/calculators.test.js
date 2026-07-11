import { calculate as retirement } from '../retirement';
import { calculate as goalSip } from '../goalSip';
import { calculate as inflation } from '../inflation';
import { calculate as cagr } from '../cagr';
import { calculate as loanPrepayment } from '../loanPrepayment';
import { calculate as loanEligibility } from '../loanEligibility';
import { calculate as incomeTax } from '../incomeTax';
import { calculate as fd } from '../fd';
import { calculate as rd } from '../rd';
import { calculate as lumpsum } from '../lumpsum';
import { calculate as ppf } from '../ppf';
import { calculate as loan } from '../loan';
import { calculate as swp } from '../swp';
import { calculate as sip } from '../sip';
import { buildPortfolioSnapshot } from '../../utils/portfolio';
import { PORTFOLIO_BASE_YEAR } from '../../utils/portfolio';

const REQUIRED_KEYS = ['summary', 'steps', 'assumptions', 'charts', 'yearlyTable', 'insights', 'pdfData'];

function assertShape(name, result) {
  REQUIRED_KEYS.forEach((key) => {
    if (result[key] === undefined) throw new Error(`${name}: missing ${key}`);
  });
  if (!Array.isArray(result.summary) || result.summary.length === 0) {
    throw new Error(`${name}: summary must be non-empty array`);
  }
}

describe('calculator engines', () => {
  test('retirement calculate', () => {
    const r = retirement({
      currentAge: 30, retirementAge: 60, lifeExpectancy: 85,
      monthlyExpenses: 50000, inflation: 6, returnRate: 12,
      existingSavings: 500000, existingSip: 10000,
    });
    assertShape('retirement', r);
    expect(r.raw.readinessScore).toBeGreaterThanOrEqual(0);
    expect(r.raw.readinessScore).toBeLessThanOrEqual(100);
  });

  test('goalSip calculate', () => {
    const r = goalSip({ goalAmount: 5000000, goalYears: 10, returnRate: 12, existingInvestment: 100000 });
    assertShape('goalSip', r);
    expect(r.raw.requiredSip).toBeGreaterThan(0);
  });

  test('inflation calculate', () => {
    const r = inflation({ amount: 100000, inflation: 6, years: 10 });
    assertShape('inflation', r);
    expect(r.raw.futureValue).toBeGreaterThan(r.raw.amount);
  });

  test('cagr calculate', () => {
    const r = cagr({ initial: 100000, final: 200000, years: 5 });
    assertShape('cagr', r);
    expect(r.raw.cagr).toBeCloseTo(0.1487, 2);
  });

  test('loanPrepayment calculate', () => {
    const r = loanPrepayment({
      loanAmount: 2500000, rate: 8.5, tenureYears: 20,
      extraMonthly: 5000, oneTimePrepayment: 100000,
    });
    assertShape('loanPrepayment', r);
    expect(r.raw.interestSaved).toBeGreaterThan(0);
  });

  test('loanEligibility calculate', () => {
    const r = loanEligibility({ monthlyIncome: 100000, existingEmis: 15000, rate: 8.5, tenureYears: 20 });
    assertShape('loanEligibility', r);
    expect(r.raw.maxLoan).toBeGreaterThan(0);
  });

  test('incomeTax calculate', () => {
    const r = incomeTax({
      salary: 1200000, otherIncome: 0, capitalGains: 0,
      deductions80c: 150000, hra: 120000, homeLoanInterest: 200000,
    });
    assertShape('incomeTax', r);
    expect(['old', 'new']).toContain(r.raw.recommendedRegime);
  });

  test('fd calculate', () => {
    const r = fd({ principal: 100000, rate: 7, years: 5, compoundingFrequency: 4 });
    assertShape('fd', r);
    expect(r.raw.maturity).toBeGreaterThan(r.raw.principal);
  });

  test('rd calculate', () => {
    const r = rd({ monthlyDeposit: 5000, rate: 7, years: 5 });
    assertShape('rd', r);
    expect(r.raw.maturity).toBeGreaterThan(r.raw.totalDeposited);
  });

  test('lumpsum calculate', () => {
    const r = lumpsum({ amount: 1000000, years: 10, ratePercentage: 12, taxRate: 12.5, inflation: 6 });
    assertShape('lumpsum', r);
    expect(r.raw.postTaxValue).toBeGreaterThan(r.raw.amount);
  });

  test('lumpsum expense ratio reduces maturity value', () => {
    const withoutExpense = lumpsum({ amount: 1000000, years: 10, ratePercentage: 12, expenseRatio: 0, taxRate: 12.5, inflation: 6 });
    const withExpense = lumpsum({ amount: 1000000, years: 10, ratePercentage: 12, expenseRatio: 1, taxRate: 12.5, inflation: 6 });
    expect(withExpense.raw.postTaxValue).toBeLessThan(withoutExpense.raw.postTaxValue);
    expect(withExpense.raw.expenseDrag).toBeGreaterThan(0);
  });

  test('ppf calculate', () => {
    const r = ppf({ monthlyAmount: 12500, interestRate: 7.1, inflation: 6 });
    assertShape('ppf', r);
    expect(r.raw.corpus).toBeGreaterThan(r.raw.deposited);
  });

  test('loan calculate', () => {
    const r = loan({ loanAmount: 2500000, interestRate: 8.5, years: 20 });
    assertShape('loan', r);
    expect(r.raw.emiAmount).toBeGreaterThan(0);
  });

  test('swp calculate', () => {
    const r = swp({ corpusAmount: 5000000, monthlyWithdrawal: 50000, ratePercentage: 8, years: 10, taxRate: 12.5, inflation: 6 });
    assertShape('swp', r);
    expect(r.raw.totalWithdrawn).toBeGreaterThan(0);
  });

  test('swp expense ratio reduces remaining corpus', () => {
    const withoutExpense = swp({ corpusAmount: 5000000, monthlyWithdrawal: 25000, ratePercentage: 8, expenseRatio: 0, years: 10, taxRate: 12.5, inflation: 6 });
    const withExpense = swp({ corpusAmount: 5000000, monthlyWithdrawal: 25000, ratePercentage: 8, expenseRatio: 1, years: 10, taxRate: 12.5, inflation: 6 });
    expect(withExpense.raw.corpus).toBeLessThan(withoutExpense.raw.corpus);
    expect(withExpense.raw.expenseDrag).toBeGreaterThan(0);
  });

  test('sip calculate', () => {
    const r = sip({ mode: 'simple', monthlyAmount: 50000, years: 10, ratePercentage: 12, taxRate: 12.5, inflation: 6, initialLumpsum: 0, expenseRatio: 0 });
    assertShape('sip', r);
    expect(r.raw.postTaxValue).toBeGreaterThan(0);
  });

  test('sip goal mode calculate', () => {
    const r = sip({ mode: 'goal', goalAmount: 5000000, years: 10, ratePercentage: 12, taxRate: 12.5, inflation: 6, initialLumpsum: 0, expenseRatio: 0, monthlyAmount: 0 });
    assertShape('sip goal', r);
    expect(r.raw.goalMeta.requiredMonthlySIP).toBeGreaterThan(0);
  });

  test('portfolio SIP starts later and compounds after SIP period', () => {
    const items = [{
      id: 'sip',
      type: 'SIP',
      startYear: PORTFOLIO_BASE_YEAR + 2,
      resolvedConfig: { monthlyAmount: 10000, years: 2, ratePercentage: 12, expenseRatio: 0 },
    }];
    const beforeStart = buildPortfolioSnapshot(items, PORTFOLIO_BASE_YEAR + 1, 0, false);
    const afterSipEnds = buildPortfolioSnapshot(items, PORTFOLIO_BASE_YEAR + 5, 0, false);

    expect(beforeStart.totalNetWorth).toBe(0);
    expect(afterSipEnds.monthlyInvestments).toBe(0);
    expect(afterSipEnds.totalReturns).toBeGreaterThan(0);
  });
});
