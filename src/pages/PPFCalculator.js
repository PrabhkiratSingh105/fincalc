import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculatePpf } from '../calculators';

const FIELDS = [
  { key: 'monthlyAmount', label: 'Monthly Deposit (₹)', min: 500, max: 12500, step: 500, tooltip: 'Max ₹12,500/month (₹1.5L/year PPF limit).' },
  { key: 'interestRate', label: 'Interest Rate (% p.a.)', min: 5, max: 10, step: 0.1, tooltip: 'Government-declared PPF interest rate.' },
  { key: 'inflation', label: 'Inflation Rate (%)', min: 0, max: 15, step: 0.5, tooltip: 'For inflation-adjusted maturity value.' },
];

const DEFAULTS = { monthlyAmount: 12500, interestRate: 7.1, inflation: 6 };

export default function PPFCalculator() {
  return (
    <CalculatorLayout
      id="ppf"
      title="PPF Calculator"
      description="Estimate 15-year Public Provident Fund maturity with tax-free EEE returns, yearly schedule and inflation-adjusted value."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculatePpf}
    />
  );
}
