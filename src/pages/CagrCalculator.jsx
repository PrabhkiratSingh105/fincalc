import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateCagr } from '../calculators';

const FIELDS = [
  { key: 'initial', label: 'Initial Value (₹)', min: 1000, max: 100000000, step: 1000, tooltip: 'Starting investment value.' },
  { key: 'final', label: 'Final Value (₹)', min: 1000, max: 100000000, step: 1000, tooltip: 'Ending investment value.' },
  { key: 'years', label: 'Investment Period (Years)', min: 1, max: 40, tooltip: 'Duration between initial and final value.' },
];

const DEFAULTS = { initial: 100000, final: 250000, years: 5 };

export default function CagrCalculator() {
  return (
    <CalculatorLayout
      id="cagr"
      title="CAGR Calculator"
      description="Calculate Compound Annual Growth Rate, absolute return, and wealth multiplier for any investment."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateCagr}
    />
  );
}
