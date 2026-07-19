import React from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateSip } from '../calculators';

const FIELDS = [
  {
    key: 'mode',
    label: 'SIP Mode',
    type: 'select',
    showRange: false,
    tooltip: 'Simple SIP, step-up SIP, or goal-based SIP.',
    options: [
      { value: 'simple', label: 'Simple SIP' },
      { value: 'stepup', label: 'Step-Up SIP' },
      { value: 'goal', label: 'Goal-Based SIP' },
    ],
  },
  {
    key: 'goalAmount',
    label: 'Target Goal (Rs)',
    min: 100000,
    max: 100000000,
    step: 100000,
    tooltip: 'Post-tax corpus target at maturity.',
    showWhen: (input) => input.mode === 'goal',
  },
  {
    key: 'initialLumpsum',
    label: 'Initial Lumpsum (Rs)',
    min: 0,
    max: 50000000,
    step: 50000,
    tooltip: 'One-time investment at the start of the plan.',
  },
  {
    key: 'monthlyAmount',
    label: 'Monthly SIP (Rs)',
    min: 500,
    max: 200000,
    step: 500,
    tooltip: 'Monthly systematic investment amount.',
    showWhen: (input) => input.mode !== 'goal',
  },
  {
    key: 'years',
    label: 'Investment Period (Years)',
    min: 1,
    max: 40,
    tooltip: 'Total investment horizon.',
  },
  {
    key: 'ratePercentage',
    label: 'Expected Return (% p.a.)',
    min: 1,
    max: 30,
    step: 0.5,
    tooltip: 'Applied monthly to the invested balance using the standard annual-rate / 12 convention.',
  },
  {
    key: 'stepUpType',
    label: 'Step-Up Type',
    type: 'select',
    showRange: false,
    tooltip: 'How SIP increases each year in step-up mode.',
    showWhen: (input) => input.mode === 'stepup',
    options: [
      { value: 'pct', label: '% Annual Increase' },
      { value: 'fixed', label: 'Fixed Rs Increase' },
      { value: 'infl', label: 'Inflation-Linked' },
    ],
  },
  {
    key: 'stepUpValue',
    label: 'Step-Up Value',
    min: 0,
    max: 100000,
    rangeMax: 100,
    step: 1,
    tooltip: 'Percentage or rupee increase depending on the selected step-up mode.',
    suffix: (input) => (input.stepUpType === 'pct' ? '%' : 'Rs'),
    showWhen: (input) => input.mode === 'stepup' && input.stepUpType !== 'infl',
  },
  {
    key: 'taxRate',
    label: 'Tax on Gains (%)',
    min: 0,
    max: 30,
    step: 0.5,
    tooltip: 'LTCG at maturity with the standard exemption applied.',
  },
  {
    key: 'inflation',
    label: 'Inflation Rate (%)',
    min: 0,
    max: 15,
    step: 0.5,
    tooltip: 'Used for inflation-adjusted results and inflation-linked step-up.',
    showWhen: (input) => input.mode !== 'goal',
  },
  {
    key: 'expenseRatio',
    label: 'Expense Ratio (% p.a.)',
    min: 0,
    max: 5,
    step: 0.01,
    tooltip: 'Deducted monthly at an annual-equivalent rate from the total corpus.',
  },
];

const DEFAULTS = {
  mode: 'simple',
  stepUpType: 'pct',
  monthlyAmount: 50000,
  goalAmount: 5000000,
  initialLumpsum: 0,
  years: 10,
  ratePercentage: 12,
  expenseRatio: 0,
  stepUpValue: 10,
  taxRate: 12.5,
  inflation: 6,
};

const SECTIONS = [
  { title: 'Mode & Goal', fields: ['mode', 'goalAmount'] },
  { title: 'Investment', fields: ['initialLumpsum', 'monthlyAmount', 'years', 'ratePercentage'], divider: true },
  { title: 'Step-Up', fields: ['stepUpType', 'stepUpValue'] },
  { title: 'Advanced', fields: ['expenseRatio', 'taxRate', 'inflation'], collapsible: true, defaultCollapsed: true },
];

export default function SIPCalculator() {
  return (
    <CalculatorLayout
      id="sip"
      title="SIP Calculator"
      description="Advanced SIP calculator with step-up, goal planning, expense ratio controls, and inflation-adjusted output."
      fields={FIELDS}
      defaults={DEFAULTS}
      calculate={calculateSip}
      inputSections={SECTIONS}
    />
  );
}
