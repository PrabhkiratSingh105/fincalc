import React, { useState } from 'react';
import CalculatorLayout from '../components/calculator/CalculatorLayout';
import { calculateSip } from '../calculators';
import TaxGainHarvestingModal from '../components/calculator/TaxGainHarvestingModal';

const FIELDS = [
  {
    key: 'mode',
    label: 'SIP Mode',
    type: 'select',
    showRange: false,
    tooltip: 'Simple SIP, step-up SIP, or goal-based (calculates required SIP).',
    options: [
      { value: 'simple', label: 'Simple SIP' },
      { value: 'stepup', label: 'Step-Up SIP' },
      { value: 'goal', label: 'Goal-Based SIP' },
    ],
  },
  {
    key: 'goalAmount',
    label: 'Target Goal (₹)',
    min: 100000,
    max: 100000000,
    step: 100000,
    tooltip: 'Post-tax corpus target at maturity.',
    showWhen: (i) => i.mode === 'goal',
  },
  {
    key: 'initialLumpsum',
    label: 'Initial Lumpsum (₹)',
    min: 0,
    max: 50000000,
    step: 50000,
    tooltip: 'One-time investment at start; earns compound return (expense ratio applied yearly on total corpus).',
  },
  {
    key: 'monthlyAmount',
    label: 'Monthly SIP (₹)',
    min: 500,
    max: 200000,
    step: 500,
    tooltip: 'Monthly systematic investment amount.',
    showWhen: (i) => i.mode !== 'goal',
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
    tooltip: 'Applied once per year on total corpus.',
  },
  {
    key: 'expenseRatio',
    label: 'Expense Ratio (% p.a.)',
    min: 0,
    max: 5,
    step: 0.01,
    tooltip: 'Deducted every year from total corpus (lumpsum + SIP).',
  },
  {
    key: 'stepUpType',
    label: 'Step-Up Type',
    type: 'select',
    showRange: false,
    tooltip: 'How SIP increases each year in step-up mode.',
    showWhen: (i) => i.mode === 'stepup',
    options: [
      { value: 'pct', label: '% Annual Increase' },
      { value: 'fixed', label: 'Fixed ₹ Increase' },
      { value: 'infl', label: 'Inflation-Linked' },
    ],
  },
  {
    key: 'stepUpValue',
    label: 'Step-Up Value',
    min: 0,
    max: 100000,
    rangeMax: 100, // Slider max for percentage mode
    step: 1,
    tooltip: 'Annual step-up: percentage (0-100%) if type is "% Annual Increase", or rupees if "Fixed ₹ Increase".',
    suffix: (i) => i.stepUpType === 'pct' ? '%' : '₹',
    showWhen: (i) => i.mode === 'stepup' && i.stepUpType !== 'infl',
  },
  {
    key: 'taxRate',
    label: 'Tax on Gains (%)',
    min: 0,
    max: 30,
    step: 0.5,
    tooltip: 'LTCG at maturity; ₹1.25 lakh exemption on gains.',
  },
  {
    key: 'inflation',
    label: 'Inflation Rate (%)',
    min: 0,
    max: 15,
    step: 0.5,
    tooltip: 'For inflation-adjusted results and inflation-linked step-up.',
    showWhen: (i) => i.mode !== 'goal',
  },
  {
    key: 'harvestingEnabled',
    label: 'Tax Gain Harvesting',
    type: 'toggle',
    tooltip: 'Automatically harvest gains up to ₹1.25L annually to optimize tax liability.',
    hasInfoButton: true,
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
  harvestingEnabled: false,
};

const SECTIONS = [
  { title: 'Mode & Goal', fields: ['mode', 'goalAmount'] },
  { title: 'Investment', fields: ['initialLumpsum', 'monthlyAmount', 'years', 'ratePercentage'], divider: true },
  { title: 'Step-Up', fields: ['stepUpType', 'stepUpValue'] },
  { title: 'Adjustments', fields: ['expenseRatio', 'taxRate', 'inflation', 'harvestingEnabled'] },
];

export default function SIPCalculator() {
  const [showHarvestingModal, setShowHarvestingModal] = useState(false);

  return (
    <>
      <CalculatorLayout
        id="sip"
        title="SIP Calculator"
        description="Advanced SIP calculator with step-up, goal-based planning, expense ratio, LTCG tax and inflation-adjusted returns — with full breakdown."
        fields={FIELDS}
        defaults={DEFAULTS}
        calculate={calculateSip}
        inputSections={SECTIONS}
        onInfoButtonClick={(fieldKey) => {
          if (fieldKey === 'harvestingEnabled') {
            setShowHarvestingModal(true);
          }
        }}
      />
      {showHarvestingModal && <TaxGainHarvestingModal onClose={() => setShowHarvestingModal(false)} />}
    </>
  );
}
