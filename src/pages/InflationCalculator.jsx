import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateInflation } from '../calculators';

const FIELDS = [
  { key: 'amount', label: 'Current Amount (₹)', min: 1000, max: 10000000, step: 1000, tooltip: 'Present value in today\'s rupees.' },
  { key: 'inflation', label: 'Inflation Rate (% p.a.)', min: 1, max: 15, step: 0.5, tooltip: 'Expected annual inflation rate.' },
  { key: 'years', label: 'Time Period (Years)', min: 1, max: 40, tooltip: 'Number of years to project inflation impact.' },
];

const DEFAULTS = { amount: 100000, inflation: 6, years: 10 };

export default function InflationCalculator() {
  return (
    <CalculatorLayout
      id="inflation"
      title="Inflation Calculator"
      description="See how inflation erodes purchasing power and what you'll need in the future to maintain today's lifestyle."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateInflation}
    />
  );
}
