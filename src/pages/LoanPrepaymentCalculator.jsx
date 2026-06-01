import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateLoanPrepayment } from '../calculators';

const FIELDS = [
  { key: 'loanAmount', label: 'Loan Amount (₹)', min: 100000, max: 50000000, step: 100000, tooltip: 'Outstanding or original principal amount.' },
  { key: 'rate', label: 'Interest Rate (% p.a.)', min: 5, max: 18, step: 0.1, tooltip: 'Annual interest rate on the loan.' },
  { key: 'tenureYears', label: 'Loan Tenure (Years)', min: 1, max: 30, tooltip: 'Original loan tenure in years.' },
  { key: 'extraMonthly', label: 'Extra Monthly Payment (₹)', min: 0, max: 100000, step: 1000, tooltip: 'Additional amount paid every month beyond EMI.' },
  { key: 'oneTimePrepayment', label: 'One-Time Prepayment (₹)', min: 0, max: 5000000, step: 10000, tooltip: 'Lumpsum prepayment applied at start.' },
];

const DEFAULTS = { loanAmount: 2500000, rate: 8.5, tenureYears: 20, extraMonthly: 5000, oneTimePrepayment: 100000 };

export default function LoanPrepaymentCalculator() {
  return (
    <CalculatorLayout
      id="loan-prepayment"
      title="Loan Prepayment Calculator"
      description="See how extra payments and prepayments reduce loan tenure and total interest — compare original vs optimized repayment."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateLoanPrepayment}
    />
  );
}
