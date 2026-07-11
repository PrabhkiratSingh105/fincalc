import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateSwp } from '../calculators';

const FIELDS = [
  { key: 'corpusAmount', label: 'Initial Corpus (₹)', min: 500000, max: 100000000, step: 100000, tooltip: 'Starting investment corpus for withdrawals.' },
  { key: 'monthlyWithdrawal', label: 'Monthly Withdrawal (₹)', min: 5000, max: 500000, step: 1000, tooltip: 'Fixed amount withdrawn each month.' },
  { key: 'ratePercentage', label: 'Expected Return (% p.a.)', min: 1, max: 20, step: 0.5, tooltip: 'Expected annual return during withdrawal phase.' },
  { key: 'expenseRatio', label: 'Expense Ratio (% p.a.)', min: 0, max: 5, step: 0.01, tooltip: 'Annual fund expense ratio deducted from remaining corpus.' },
  { key: 'years', label: 'Withdrawal Period (Years)', min: 1, max: 40, tooltip: 'How long you plan to withdraw.' },
  { key: 'taxRate', label: 'Tax on Gains (%)', min: 0, max: 30, step: 0.5, tooltip: 'LTCG rate with ₹1.25L exemption.' },
  { key: 'inflation', label: 'Inflation Rate (%)', min: 0, max: 15, step: 0.5, tooltip: 'Impact on real corpus value over time.' },
];

const DEFAULTS = { corpusAmount: 5000000, monthlyWithdrawal: 50000, ratePercentage: 8, expenseRatio: 0, years: 10, taxRate: 12.5, inflation: 6 };

export default function SWPCalculator() {
  return (
    <CalculatorLayout
      id="swp"
      title="SWP Calculator"
      description="Plan systematic withdrawals with corpus sustainability analysis, tax impact and year-by-year depletion schedule."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateSwp}
    />
  );
}
