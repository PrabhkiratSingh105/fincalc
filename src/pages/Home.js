import React from 'react';
import { Link } from 'react-router-dom';

const CALCULATORS = [
  { to: '/retirement', icon: 'elderly', color: 'indigo', title: 'Retirement Calculator', desc: 'Corpus planning, gap analysis & readiness score', tag: 'Plan ahead' },
  { to: '/goal-sip', icon: 'flag', color: 'violet', title: 'Goal-Based SIP', desc: 'Required SIP, lumpsum & goal achievement probability', tag: 'Reach goals' },
  { to: '/sip', icon: 'autorenew', color: 'green', title: 'SIP Calculator', desc: 'Advanced SIP with tax, expense ratio & inflation', tag: 'Invest monthly' },
  { to: '/inflation', icon: 'trending_down', color: 'amber', title: 'Inflation Calculator', desc: 'Purchasing power erosion & future cost projection', tag: 'Real value' },
  { to: '/cagr', icon: 'trending_up', color: 'green', title: 'CAGR Calculator', desc: 'Compound annual growth rate & wealth multiplier', tag: 'Returns' },
  { to: '/income-tax', icon: 'receipt_long', color: 'violet', title: 'Income Tax Calculator', desc: 'Old vs new regime comparison for FY 2024-25', tag: 'Save tax' },
  { to: '/loan-prepayment', icon: 'speed', color: 'green', title: 'Loan Prepayment', desc: 'Interest saved & tenure reduced with prepayments', tag: 'Save interest' },
  { to: '/loan-eligibility', icon: 'fact_check', color: 'sky', title: 'Loan Eligibility', desc: 'Maximum loan based on income & FOIR rules', tag: 'Home loan' },
  { to: '/loan', icon: 'payments', color: 'rose', title: 'Loan Calculator', desc: 'EMI, total interest & balance charts', tag: 'EMI plan' },
  { to: '/fd', icon: 'account_balance', color: 'sky', title: 'FD Calculator', desc: 'Fixed deposit maturity with compound interest', tag: 'Safe invest' },
  { to: '/rd', icon: 'calendar_month', color: 'indigo', title: 'RD Calculator', desc: 'Recurring deposit maturity & growth charts', tag: 'Save monthly' },
  { to: '/lumpsum', icon: 'savings', color: 'amber', title: 'Lumpsum Calculator', desc: 'One-time investment with tax & inflation impact', tag: 'One-time' },
  { to: '/ppf', icon: 'shield', color: 'teal', title: 'PPF Calculator', desc: '15-year PPF maturity with tax-free returns', tag: 'Tax-free' },
  { to: '/swp', icon: 'account_balance_wallet', color: 'indigo', title: 'SWP Calculator', desc: 'Systematic withdrawal & corpus sustainability', tag: 'Withdraw' },
];

export default function Home() {
  return (
    <div className="page">
      <div className="ph home-hero">
        <h1>India&apos;s Professional Financial Calculator Platform</h1>
        <p>
          Premium-grade calculators for retirement, investments, loans, tax, FD/RD and inflation —
          with step-by-step math, interactive charts, PDF reports, and shareable results.
        </p>
        <div className="home-badges">
          <span className="home-badge">🇮🇳 Indian ₹ format</span>
          <span className="home-badge">📊 Interactive charts</span>
          <span className="home-badge">📄 PDF reports</span>
          <span className="home-badge">🔗 Shareable links</span>
          <span className="home-badge">🌙 Dark mode</span>
        </div>
      </div>

      <div className="home-grid">
        <div className="home-cards">
          {CALCULATORS.map((calc) => (
            <Link to={calc.to} className="home-card-link" key={calc.to}>
              <div className={`card home-card ${calc.color}`}>
                <div className="home-card-head">
                  <div className={`home-card-icon ${calc.color}`}>
                    <span className="material-symbols-rounded">{calc.icon}</span>
                  </div>
                  <h3>{calc.title}</h3>
                </div>
                <p>{calc.desc}</p>
                <span className="home-card-tag">{calc.tag}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
