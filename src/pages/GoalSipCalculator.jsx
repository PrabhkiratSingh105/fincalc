import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateGoalSip } from '../calculators';

const FIELDS = [
  { key: 'goalAmount', label: 'Goal Amount (₹)', min: 100000, max: 100000000, step: 100000, tooltip: 'Target amount you want to achieve.' },
  { key: 'goalYears', label: 'Goal Timeline (Years)', min: 1, max: 40, tooltip: 'Years until you need the goal amount.' },
  { key: 'inflation', label: 'Inflation Rate (% p.a.)', min: 0, max: 15, step: 0.5, tooltip: 'Inflates today\'s goal into the future target amount.' },
  { key: 'returnRate', label: 'Expected Return (% p.a.)', min: 4, max: 20, step: 0.5, tooltip: 'Expected annual return on investments.' },
  { key: 'existingInvestment', label: 'Existing Investment (₹)', min: 0, max: 50000000, step: 50000, tooltip: 'Amount already invested towards this goal.' },
];

const DEFAULTS = { goalAmount: 5000000, goalYears: 10, inflation: 6, returnRate: 12, existingInvestment: 200000 };

export default function GoalSipCalculator() {
  return (
    <CalculatorLayout
      id="goal-sip"
      title="Goal-Based SIP Calculator"
      description="Find the monthly SIP or lumpsum needed to reach your financial goal with wealth projection and achievement probability."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateGoalSip}
    />
  );
}
