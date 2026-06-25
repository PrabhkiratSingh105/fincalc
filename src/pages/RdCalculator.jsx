import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateRd } from '../calculators';

const FIELDS = [
  { key: 'monthlyDeposit', label: 'Monthly Deposit (Rs)', min: 500, max: 100000, step: 500, tooltip: 'Base monthly deposit amount used to derive quarterly and yearly contributions.' },
  { key: 'rate', label: 'Interest Rate (% p.a.)', min: 4, max: 10, step: 0.1, tooltip: 'Annual RD interest rate.' },
  {
    key: 'depositFrequency',
    label: 'Payment Frequency',
    type: 'select',
    showRange: false,
    options: [
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'yearly', label: 'Yearly' },
    ],
  },
  {
    key: 'compoundingFrequency',
    label: 'Compounding Frequency',
    type: 'select',
    showRange: false,
    options: [
      { value: 'monthly', label: 'Monthly' },
      { value: 'quarterly', label: 'Quarterly' },
      { value: 'yearly', label: 'Yearly' },
    ],
  },
  { key: 'inflation', label: 'Inflation Rate (%)', min: 0, max: 15, step: 0.5, tooltip: 'Used to show inflation-adjusted deposits and maturity.' },
  { key: 'years', label: 'Duration (Years)', min: 1, max: 10, tooltip: 'Recurring deposit tenure.' },
];

const DEFAULTS = {
  monthlyDeposit: 10000,
  rate: 6.5,
  depositFrequency: 'monthly',
  compoundingFrequency: 'monthly',
  inflation: 6,
  years: 3,
};

export default function RdCalculator() {
  return (
    <CalculatorLayout
      id="rd"
      title="RD Calculator"
      description="Calculate recurring deposit maturity value with monthly, quarterly, or yearly deposit and compounding options."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateRd}
    />
  );
}
