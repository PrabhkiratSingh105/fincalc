import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFeatureFlags } from '../context/FeatureFlagsContext';

export const NAV = [
  { id: 'invest', label: 'Invest', items: [
    { path: 'sip', icon: 'autorenew', title: 'SIP Calculator', sub: 'Build a monthly investing plan' },
    { path: 'lumpsum', icon: 'savings', title: 'Lumpsum Calculator', sub: 'Project one-time growth' },
    { path: 'ppf', icon: 'shield', title: 'PPF Calculator', sub: 'Plan tax-saving corpus' },
    { path: 'fd', icon: 'account_balance', title: 'FD Calculator', sub: 'Estimate fixed-deposit maturity' },
    { path: 'rd', icon: 'calendar_month', title: 'RD Calculator', sub: 'Plan recurring deposits' },
    { path: 'cagr', icon: 'trending_up', title: 'CAGR Calculator', sub: 'Measure annualized return' },
  ] },
  { id: 'plan', label: 'Plan', items: [
    { path: 'retirement', icon: 'elderly', title: 'Retirement Calculator', sub: 'Estimate corpus and readiness' },
    { path: 'goal-sip', icon: 'track_changes', title: 'Goal SIP Calculator', sub: 'Set a goal and monthly contribution' },
    { path: 'swp', icon: 'account_balance_wallet', title: 'SWP Calculator', sub: 'Plan systematic withdrawals' },
    { path: 'inflation', icon: 'trending_down', title: 'Inflation Calculator', sub: 'See purchasing-power change' },
    { path: 'custom-inflation', icon: 'table_chart', title: 'Custom Inflation', sub: 'Build a personal inflation profile' },
  ] },
  { id: 'loans', label: 'Loans & tax', items: [
    { path: 'loan', icon: 'payments', title: 'Loan Calculator', sub: 'Calculate EMI and total interest' },
    { path: 'loan-prepayment', icon: 'speed', title: 'Loan Prepayment', sub: 'See savings from prepaying' },
    { path: 'loan-eligibility', icon: 'fact_check', title: 'Loan Eligibility', sub: 'Estimate borrowing capacity' },
    { path: 'income-tax', icon: 'receipt_long', title: 'Income Tax Calculator', sub: 'Estimate annual tax' },
  ] },
];

export default function Header({ setShowAuthModal }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { aiFeatures } = useFeatureFlags();
  const [openMenu, setOpenMenu] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [finderOpen, setFinderOpen] = useState(false);
  const [query, setQuery] = useState('');
  const headerRef = useRef(null);
  const navigate = useNavigate();
  const tools = useMemo(() => NAV.flatMap((group) => group.items), []);
  const matches = tools.filter((item) => `${item.title} ${item.sub}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);

  useEffect(() => {
    const closeMenus = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setOpenMenu(null);
        setAccountOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeMenus);
    return () => document.removeEventListener('pointerdown', closeMenus);
  }, []);

  const go = (path) => { navigate(`/${path}`); setOpenMenu(null); setFinderOpen(false); setQuery(''); };

  return (
    <header className="desktop-header" ref={headerRef}>
      <div className="h-inner">
        <Link to="/" className="logo" aria-label="PlanMyCapital home"><span className="logo-name">PlanMy<em>Capital</em></span></Link>
        <nav className="desktop-main-nav" aria-label="Main navigation">
          {NAV.map((group) => <div className={`nav-item ${openMenu === group.id ? 'open' : ''}`} key={group.id}>
            <button type="button" className="nav-trigger" aria-expanded={openMenu === group.id} onClick={() => { setOpenMenu(openMenu === group.id ? null : group.id); setAccountOpen(false); }}>{group.label}<span className="material-symbols-rounded">expand_more</span></button>
            <div className="dropdown" role="menu">{group.items.map((item) => <button key={item.path} type="button" className="dd-item" onClick={() => go(item.path)}><span className="dd-icon material-symbols-rounded">{item.icon}</span><span className="dd-text"><strong>{item.title}</strong><small>{item.sub}</small></span></button>)}</div>
          </div>)}
          <button type="button" className="header-finder-button" onClick={() => setFinderOpen(true)}><span className="material-symbols-rounded">search</span>All calculators</button>
          {aiFeatures && <NavLink to="/ai" className="nav-ai-link"><span className="material-symbols-rounded">auto_awesome</span>AI</NavLink>}
        </nav>
        <div className="h-right"><button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}><span className="material-symbols-rounded">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span></button>
          {!user ? <button type="button" className="btn-login" onClick={() => setShowAuthModal(true)}>Sign in</button> : <div className="account-menu"><button type="button" className="account-avatar" aria-label="Open account menu" aria-expanded={accountOpen} onClick={() => { setAccountOpen(!accountOpen); setOpenMenu(null); }}><span className="material-symbols-rounded">account_circle</span></button><div className={`account-pop ${accountOpen ? 'open' : ''}`}><div className="account-name">{user.username}</div><Link to="/profile" onClick={() => setAccountOpen(false)}>Profile settings</Link><Link to="/portfolio" onClick={() => setAccountOpen(false)}>Portfolio library</Link><button type="button" onClick={async () => { await logout(); setAccountOpen(false); }}>Sign out</button></div></div>}
        </div>
      </div>
      {finderOpen && <div className="calculator-finder-backdrop" role="presentation" onMouseDown={() => setFinderOpen(false)}><section className="calculator-finder" role="dialog" aria-modal="true" aria-label="Find a calculator" onMouseDown={(event) => event.stopPropagation()}><div className="finder-heading"><div><span>PlanMyCapital</span><h2>Find a calculator</h2></div><button type="button" aria-label="Close calculator finder" onClick={() => setFinderOpen(false)}><span className="material-symbols-rounded">close</span></button></div><label className="finder-search"><span className="material-symbols-rounded">search</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search SIP, loan, tax, retirement..." /></label><div className="finder-results">{matches.map((item) => <button type="button" key={item.path} onClick={() => go(item.path)}><span className="material-symbols-rounded">{item.icon}</span><span><strong>{item.title}</strong><small>{item.sub}</small></span><span className="material-symbols-rounded">arrow_forward</span></button>)}</div></section></div>}
    </header>
  );
}
