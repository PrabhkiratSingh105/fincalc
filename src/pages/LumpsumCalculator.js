import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateLumpsum } from '../calculators';

const FIELDS = [
  { key: 'amount', label: 'Lumpsum Amount (₹)', min: 100000, max: 50000000, step: 100000, tooltip: 'One-time investment amount.' },
  { key: 'years', label: 'Investment Period (Years)', min: 1, max: 40, tooltip: 'How long the money stays invested.' },
  { key: 'ratePercentage', label: 'Expected Return (% p.a.)', min: 1, max: 30, step: 0.5, tooltip: 'Expected annual compound return.' },
  { key: 'expenseRatio', label: 'Expense Ratio (% p.a.)', min: 0, max: 5, step: 0.01, tooltip: 'Annual fund expense ratio deducted from returns.' },
  { key: 'taxRate', label: 'Tax on Gains (%)', min: 0, max: 30, step: 0.5, tooltip: 'LTCG tax rate; ₹1.25L exemption applied.' },
  { key: 'inflation', label: 'Inflation Rate (%)', min: 0, max: 15, step: 0.5, tooltip: 'Used to compute real purchasing power.' },
];

const DEFAULTS = { amount: 1000000, years: 10, ratePercentage: 12, expenseRatio: 0, taxRate: 12.5, inflation: 6 };

export default function LumpsumCalculator() {
  return (
    <CalculatorLayout
      id="lumpsum"
      title="Lumpsum Calculator"
      description="Calculate one-time investment maturity with LTCG tax, inflation-adjusted returns, step-by-step math and yearly projections."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateLumpsum}
    />
  );
}
