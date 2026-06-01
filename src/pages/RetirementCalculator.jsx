import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateRetirement } from '../calculators';

const FIELDS = [
  { key: 'currentAge', label: 'Current Age', min: 18, max: 70, tooltip: 'Your age today. Used to compute years until retirement.' },
  { key: 'retirementAge', label: 'Retirement Age', min: 40, max: 75, tooltip: 'Age when you plan to stop earning and start withdrawals.' },
  { key: 'lifeExpectancy', label: 'Life Expectancy', min: 60, max: 100, tooltip: 'Expected lifespan — determines how long retirement corpus must last.' },
  { key: 'monthlyExpenses', label: 'Current Monthly Expenses (₹)', min: 10000, max: 500000, step: 5000, tooltip: 'Today\'s monthly spending. Inflated to retirement and beyond.' },
  { key: 'inflation', label: 'Expected Inflation (% p.a.)', min: 2, max: 12, step: 0.5, tooltip: 'Annual inflation rate applied to expenses.' },
  { key: 'returnRate', label: 'Expected Investment Return (% p.a.)', min: 4, max: 18, step: 0.5, tooltip: 'Expected portfolio return during accumulation and retirement.' },
  { key: 'existingSavings', label: 'Existing Retirement Savings (₹)', min: 0, max: 50000000, step: 50000, tooltip: 'Current lumpsum retirement corpus.' },
  { key: 'existingSip', label: 'Existing SIP Contribution (₹/month)', min: 0, max: 200000, step: 1000, tooltip: 'Monthly SIP already running for retirement.' },
];

const DEFAULTS = {
  currentAge: 30,
  retirementAge: 60,
  lifeExpectancy: 85,
  monthlyExpenses: 50000,
  inflation: 6,
  returnRate: 12,
  existingSavings: 500000,
  existingSip: 10000,
};

const SECTIONS = [
  { title: 'Personal Details', fields: ['currentAge', 'retirementAge', 'lifeExpectancy'] },
  { title: 'Expenses & Assumptions', fields: ['monthlyExpenses', 'inflation', 'returnRate'], divider: true },
  { title: 'Existing Investments', fields: ['existingSavings', 'existingSip'] },
];

export default function RetirementCalculator() {
  return (
    <CalculatorLayout
      id="retirement"
      title="Retirement Calculator"
      description="Plan your retirement corpus with inflation-adjusted expenses, gap analysis, and readiness score — built for Indian investors."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateRetirement}
      inputSections={SECTIONS}
    />
  );
}
