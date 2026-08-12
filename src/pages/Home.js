import React from 'react';
import { Link } from 'react-router-dom';

const investmentTools = [
  {
    path: '/sip',
    icon: 'autorenew',
    color: 'green',
    title: 'SIP Calculator',
    sub: 'Build a monthly investing plan',
    tag: 'Monthly',
  },
  {
    path: '/lumpsum',
    icon: 'savings',
    color: 'amber',
    title: 'Lumpsum Calculator',
    sub: 'Estimate one-time investment growth',
    tag: 'One-time',
  },
  {
    path: '/ppf',
    icon: 'shield',
    color: 'teal',
    title: 'PPF Calculator',
    sub: 'Project long-term tax-saving corpus',
    tag: 'Tax saving',
  },
  {
    path: '/fd',
    icon: 'account_balance',
    color: 'sky',
    title: 'FD Calculator',
    sub: 'Check fixed deposit maturity',
    tag: 'Deposit',
  },
  {
    path: '/rd',
    icon: 'calendar_month',
    color: 'indigo',
    title: 'RD Calculator',
    sub: 'Plan recurring deposit returns',
    tag: 'Recurring',
  },
  {
    path: '/cagr',
    icon: 'trending_up',
    color: 'green',
    title: 'CAGR Calculator',
    sub: 'Find annualized investment growth',
    tag: 'Growth',
  },
];

const planningTools = [
  { path: '/retirement', icon: 'elderly', color: 'indigo', title: 'Retirement', sub: 'Corpus & readiness score' },
  { path: '/goal-sip', icon: 'track_changes', color: 'violet', title: 'Goal SIP', sub: 'Monthly amount for a target' },
  { path: '/swp', icon: 'account_balance_wallet', color: 'indigo', title: 'SWP', sub: 'Systematic withdrawals' },
  { path: '/inflation', icon: 'trending_down', color: 'amber', title: 'Inflation', sub: 'Purchasing power impact' },
];

const moneyTools = [
  { path: '/loan', icon: 'payments', color: 'rose', title: 'Loan EMI', sub: 'EMI & amortization' },
  { path: '/loan-prepayment', icon: 'speed', color: 'green', title: 'Prepayment', sub: 'Interest & time saved' },
  { path: '/loan-eligibility', icon: 'fact_check', color: 'sky', title: 'Eligibility', sub: 'Maximum loan amount' },
  { path: '/income-tax', icon: 'receipt_long', color: 'sky', title: 'Income Tax', sub: 'Estimate annual tax' },
];

function ToolLink({ item, featured = false }) {
  return (
    <Link to={item.path} className={`home-tool ${featured ? 'featured' : ''} ${item.color}`} aria-label={item.title}>
      <span className={`home-tool-icon ${item.color}`}>
        <span className="material-symbols-rounded">{item.icon}</span>
      </span>
      <span className="home-tool-copy">
        <strong>{item.title}</strong>
        <span>{item.sub}</span>
      </span>
      
    </Link>
  );
}

export default function Home() {
  return (
    <main className="page home-page" aria-label="Home">
      <section className="home-shell">
        <section className="home-intro" aria-labelledby="home-title">
          <div className="home-intro-copy">
            <span className="home-kicker">PlanMyCapital / Financial clarity</span>
            <h1 id="home-title">Make every financial decision easier to see.</h1>
            <p>Practical calculators for investing, borrowing, tax, and long-term goals—built around the numbers that matter.</p>
            <div className="home-hero-actions">
              <Link to="/sip" className="home-primary-action">
                Start an investment plan
                <span className="material-symbols-rounded">arrow_forward</span>
              </Link>
              <Link to="/portfolio" className="home-secondary-action">
                Explore portfolios
              </Link>
            </div>
          </div>
          <div className="home-hero-detail" aria-label="Plan with confidence">
            <div className="home-detail-eyebrow">A clearer view of your money</div>
            <div className="home-detail-number">15+</div>
            <p>Specialist calculators, from the first SIP to a complete retirement plan.</p>
            <div className="home-detail-rule" />
            <span>INR-first · Privacy-conscious · No account required to calculate</span>
          </div>
        </section>

        <div className="home-tools-intro">
          <div>
            <span className="home-kicker">Start here</span>
            <h2>Investment planning</h2>
          </div>
          <p>Choose a calculator, set your assumptions, and get a decision-ready view in moments.</p>
        </div>

        <div className="home-feature-grid" aria-label="Investment options">
          {investmentTools.map((item) => (
            <ToolLink key={item.path} item={item} featured />
          ))}
        </div>

        <div className="home-section-grid">
          <section className="home-tool-section" aria-labelledby="planning-tools-heading">
            <div className="home-section-head">
              <h2 id="planning-tools-heading">Plan</h2>
              <span>Goals, withdrawals, and purchasing power</span>
            </div>
            <div className="home-compact-grid">
              {planningTools.map((item) => (
                <ToolLink key={item.path} item={item} />
              ))}
            </div>
          </section>

          <section className="home-tool-section" aria-labelledby="money-tools-heading">
            <div className="home-section-head">
              <h2 id="money-tools-heading">Loans & tax</h2>
              <span>EMIs, prepayments, eligibility, and tax</span>
            </div>
            <div className="home-compact-grid">
              {moneyTools.map((item) => (
                <ToolLink key={item.path} item={item} />
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
