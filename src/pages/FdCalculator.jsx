import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateFd } from '../calculators';

const FIELDS = [
  { key: 'principal', label: 'Principal (₹)', min: 1000, max: 10000000, step: 1000, tooltip: 'Fixed deposit amount.' },
  { key: 'rate', label: 'Interest Rate (% p.a.)', min: 3, max: 10, step: 0.1, tooltip: 'Annual FD interest rate.' },
  { key: 'years', label: 'Duration (Years)', min: 1, max: 10, tooltip: 'FD tenure in years.' },
  {
    key: 'compoundingFrequency',
    label: 'Compounding',
    type: 'select',
    showRange: false,
    tooltip: 'How often interest is compounded.',
    options: [
      { value: 1, label: 'Yearly' },
      { value: 4, label: 'Quarterly' },
      { value: 12, label: 'Monthly' },
    ],
  },
];

const DEFAULTS = { principal: 500000, rate: 7, years: 5, compoundingFrequency: 4 };

export default function FdCalculator() {
  return (
    <CalculatorLayout
      id="fd"
      title="FD Calculator"
      description="Calculate fixed deposit maturity amount with compound interest and yearly balance growth."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateFd}
    />
  );
}
