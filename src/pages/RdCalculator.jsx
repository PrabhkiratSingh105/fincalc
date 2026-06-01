import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateRd } from '../calculators';

const FIELDS = [
  { key: 'monthlyDeposit', label: 'Monthly Deposit (₹)', min: 500, max: 100000, step: 500, tooltip: 'Amount deposited every month in RD.' },
  { key: 'rate', label: 'Interest Rate (% p.a.)', min: 4, max: 10, step: 0.1, tooltip: 'Annual RD interest rate.' },
  { key: 'years', label: 'Duration (Years)', min: 1, max: 10, tooltip: 'Recurring deposit tenure.' },
];

const DEFAULTS = { monthlyDeposit: 10000, rate: 6.5, years: 3 };

export default function RdCalculator() {
  return (
    <CalculatorLayout
      id="rd"
      title="RD Calculator"
      description="Calculate recurring deposit maturity value with monthly growth projection and deposit vs returns breakdown."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateRd}
    />
  );
}
