import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateIncomeTax } from '../calculators';

const FIELDS = [
  { key: 'salary', label: 'Annual Salary (Rs)', min: 0, max: 50000000, step: 50000, tooltip: 'Gross annual salary income.' },
  { key: 'otherIncome', label: 'Other Income (Rs)', min: 0, max: 10000000, step: 10000, tooltip: 'Interest, rental, freelance, etc.' },
  { key: 'capitalGains', label: 'Capital Gains (Rs)', min: 0, max: 10000000, step: 10000, tooltip: 'LTCG/STCG from investments.' },
  { key: 'deductions80c', label: '80C Deductions (Rs)', min: 0, max: 150000, step: 5000, tooltip: 'PPF, ELSS, LIC, etc. Max Rs1.5L under old regime.' },
  { key: 'hra', label: 'HRA Exemption (Rs)', min: 0, max: 500000, step: 5000, tooltip: 'HRA exemption under old regime.' },
  { key: 'homeLoanInterest', label: 'Home Loan Interest (Rs)', min: 0, max: 200000, step: 5000, tooltip: 'Section 24(b) deduction. Max Rs2L under old regime.' },
  { key: 'inflation', label: 'Inflation Rate (% p.a.)', min: 0, max: 15, step: 0.5, tooltip: 'Used to show real take-home income one year ahead.' },
  {
    key: 'regime',
    label: 'Tax Regime',
    type: 'select',
    showRange: false,
    tooltip: 'Compare old vs new regime or force a specific regime.',
    options: [
      { value: 'compare', label: 'Compare Both' },
      { value: 'old', label: 'Old Regime' },
      { value: 'new', label: 'New Regime' },
    ],
  },
];

const DEFAULTS = {
  salary: 1500000,
  otherIncome: 50000,
  capitalGains: 0,
  deductions80c: 150000,
  hra: 120000,
  homeLoanInterest: 150000,
  inflation: 6,
  regime: 'compare',
};

const SECTIONS = [
  { title: 'Income', fields: ['salary', 'otherIncome', 'capitalGains'] },
  { title: 'Deductions (Old Regime)', fields: ['deductions80c', 'hra', 'homeLoanInterest'], divider: true },
  { title: 'Planning Assumptions', fields: ['inflation'] },
  { title: 'Regime', fields: ['regime'] },
];

export default function IncomeTaxCalculator() {
  return (
    <CalculatorLayout
      id="income-tax"
      title="India Income Tax Calculator"
      description="Compare old vs new tax regime for FY 2024-25 with cess, rebates, and effective tax rate - find the optimal choice."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateIncomeTax}
      inputSections={SECTIONS}
    />
  );
}
