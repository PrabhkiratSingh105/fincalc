import React from 'react';
import { Link } from 'react-router-dom';

const COLLECTIONS = {
  invest: {
    title: 'Invest',
    description: 'Build a clearer investing plan with calculators for every starting point.',
    tools: [
      { path: '/sip', icon: 'autorenew', title: 'SIP Calculator', sub: 'Plan regular monthly investing', tag: 'Popular' },
      { path: '/lumpsum', icon: 'savings', title: 'Lumpsum Calculator', sub: 'Estimate one-time investment growth', tag: 'Popular' },
      { path: '/ppf', icon: 'shield', title: 'PPF Calculator', sub: 'Project tax-saving maturity value' },
      { path: '/fd', icon: 'account_balance', title: 'FD Calculator', sub: 'Calculate fixed deposit maturity' },
      { path: '/rd', icon: 'calendar_month', title: 'RD Calculator', sub: 'Plan recurring deposit returns' },
      { path: '/cagr', icon: 'trending_up', title: 'CAGR Calculator', sub: 'Measure annualized investment growth' },
    ],
  },
  plan: {
    title: 'Plan',
    description: 'Plan your goals, retirement and future with practical, long-term calculators.',
    tools: [
      { path: '/retirement', icon: 'elderly', title: 'Retirement Calculator', sub: 'Plan your retirement corpus and withdrawals', tag: 'Popular' },
      { path: '/goal-sip', icon: 'track_changes', title: 'Goal SIP Calculator', sub: 'Set a target and calculate your monthly SIP', tag: 'Popular' },
      { path: '/swp', icon: 'account_balance_wallet', title: 'SWP Calculator', sub: 'Plan systematic withdrawals from investments' },
      { path: '/inflation', icon: 'trending_down', title: 'Inflation Calculator', sub: 'Understand purchasing-power impact over time' },
      { path: '/custom-inflation', icon: 'table_chart', title: 'Custom Inflation', sub: 'Build a weighted inflation profile' },
    ],
  },
  loans: {
    title: 'Loans',
    description: 'See your repayments, eligibility and tax position before making a decision.',
    tools: [
      { path: '/loan', icon: 'payments', title: 'Loan Calculator', sub: 'Calculate EMI and total interest', tag: 'Popular' },
      { path: '/loan-prepayment', icon: 'speed', title: 'Loan Prepayment', sub: 'See interest and time saved by prepaying' },
      { path: '/loan-eligibility', icon: 'fact_check', title: 'Loan Eligibility', sub: 'Estimate your borrowing capacity' },
      { path: '/income-tax', icon: 'receipt_long', title: 'Income Tax Calculator', sub: 'Estimate annual income tax' },
    ],
  },
};

export default function CategoryPage({ category }) {
  const collection = COLLECTIONS[category] || COLLECTIONS.plan;

  return (
    <main className="page category-page" aria-label={`${collection.title} calculators`}>
      <section className="category-head">
        <div>
          <h1>{collection.title}</h1>
          <p>{collection.description}</p>
        </div>
        <div className="category-free-note">
          <span className="material-symbols-rounded">verified_user</span>
          <div><strong>100% Free</strong><span>No sign-up required</span></div>
        </div>
      </section>
      
      <section className="category-grid">
        {collection.tools.map((tool) => (
          <Link to={tool.path} className="category-tool" key={tool.path}>
            <span className="category-tool-icon material-symbols-rounded">{tool.icon}</span>
            <div className="category-tool-copy">
              <div><strong>{tool.title}</strong>{tool.tag && <em>{tool.tag}</em>}</div>
              <p>{tool.sub}</p>
            </div>
            <span className="category-tool-action">Start Planning <span className="material-symbols-rounded">arrow_forward</span></span>
          </Link>
        ))}
      </section>
    </main>
  );
}
