import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateLoanEligibility } from '../calculators';

const FIELDS = [
  { key: 'monthlyIncome', label: 'Monthly Income (₹)', min: 15000, max: 500000, step: 5000, tooltip: 'Net monthly income after taxes.' },
  { key: 'existingEmis', label: 'Existing EMIs (₹)', min: 0, max: 200000, step: 1000, tooltip: 'Total monthly EMIs on other loans.' },
  { key: 'rate', label: 'Interest Rate (% p.a.)', min: 6, max: 16, step: 0.1, tooltip: 'Expected loan interest rate.' },
  { key: 'tenureYears', label: 'Loan Tenure (Years)', min: 5, max: 30, tooltip: 'Desired loan repayment period.' },
];

const DEFAULTS = { monthlyIncome: 100000, existingEmis: 15000, rate: 8.5, tenureYears: 20 };

export default function LoanEligibilityCalculator() {
  return (
    <CalculatorLayout
      id="loan-eligibility"
      title="Loan Eligibility Calculator"
      description="Estimate maximum loan amount based on income, existing EMIs, and FOIR guidelines used by Indian banks."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateLoanEligibility}
    />
  );
}
