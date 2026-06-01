import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateLoan } from '../calculators';

const FIELDS = [
  { key: 'loanAmount', label: 'Loan Amount (₹)', min: 50000, max: 50000000, step: 50000, tooltip: 'Principal borrowed.' },
  { key: 'interestRate', label: 'Interest Rate (% p.a.)', min: 1, max: 24, step: 0.1, tooltip: 'Fixed annual interest rate.' },
  { key: 'years', label: 'Loan Tenure (Years)', min: 1, max: 30, tooltip: 'Repayment period in years.' },
];

const DEFAULTS = { loanAmount: 2500000, interestRate: 8.5, years: 20 };

export default function LoanCalculator() {
  return (
    <CalculatorLayout
      id="loan"
      title="Loan Calculator"
      description="Calculate EMI, total interest, amortization schedule and payment breakdown with full formula explanation."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateLoan}
    />
  );
}
