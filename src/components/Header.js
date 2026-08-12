import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV = [
  {
    id: 'invest',
    label: 'Invest',
    items: [
      { path: 'sip', icon: 'autorenew', color: 'green', title: 'SIP Calculator', sub: 'Systematic Investment Plan' },
      { path: 'lumpsum', icon: 'savings', color: 'amber', title: 'Lumpsum Calculator', sub: 'One-time investment' },
      { path: 'ppf', icon: 'shield', color: 'teal', title: 'PPF Calculator', sub: 'Public Provident Fund' },
      { path: 'fd', icon: 'account_balance', color: 'sky', title: 'FD Calculator', sub: 'Fixed deposit maturity' },
      { path: 'rd', icon: 'calendar_month', color: 'indigo', title: 'RD Calculator', sub: 'Recurring deposit' },
      { path: 'cagr', icon: 'trending_up', color: 'green', title: 'CAGR Calculator', sub: 'Compound annual growth' },
    ],
  },
  {
    id: 'plan',
    label: 'Plan',
    items: [
      { path: 'retirement', icon: 'elderly', color: 'indigo', title: 'Retirement Calculator', sub: 'Corpus & readiness score' },
      { path: 'inflation', icon: 'trending_down', color: 'amber', title: 'Inflation Calculator', sub: 'Purchasing power impact' },
      { path: 'custom-inflation', icon: 'table_chart', color: 'sky', title: 'Custom Inflation', sub: 'Weighted inflation profile' },
      { path: 'goal-sip', icon: 'track_changes', color: 'violet', title: 'Goal SIP Calculator', sub: 'Monthly amount for a target' },
      { path: 'swp', icon: 'account_balance_wallet', color: 'indigo', title: 'SWP Calculator', sub: 'Systematic withdrawal' },
    ],
  },
  {
    id: 'loans',
    label: 'Loans',
    items: [
      { path: 'loan', icon: 'payments', color: 'rose', title: 'Loan Calculator', sub: 'EMI & amortization' },
      { path: 'loan-prepayment', icon: 'speed', color: 'green', title: 'Loan Prepayment', sub: 'Interest & time saved' },
      { path: 'loan-eligibility', icon: 'fact_check', color: 'sky', title: 'Loan Eligibility', sub: 'Max loan amount' },
      { path: 'income-tax', icon: 'receipt_long', color: 'sky', title: 'Income Tax', sub: 'Annual tax estimate' },
    ],
  },
];

export default function Header({ setShowAuthModal }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const navigate = useNavigate();

  const handleCalcSelect = (path) => {
    navigate(`/${path}`);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setAccountMenuOpen(false);
  };

  useEffect(() => {
    const closeMenus = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setOpenDropdown(null);
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, []);

  return (
    <header ref={headerRef}>
      <div className="h-inner">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => {
            setMobileMenuOpen(!mobileMenuOpen);
            setAccountMenuOpen(false);
          }}
          aria-label="Open calculators menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="material-symbols-rounded">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
        <button
          type="button"
          className="mobile-top-theme"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="material-symbols-rounded">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
        <Link to="/" className="logo">
          <span className="logo-name">
            PlanMy<em>Capital</em>
          </span>
        </Link>

        <nav className={`desktop-main-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <NavLink to="/ai" className="nav-item ai-nav-link" onClick={() => setOpenDropdown(null)}>
            <span className="material-symbols-rounded">auto_awesome</span> AI
          </NavLink>
          {NAV.map((group) => (
            <div
              key={group.id}
              className={`nav-item ${openDropdown === group.id ? 'open' : ''}`}
              onClick={() => {
                setOpenDropdown(openDropdown === group.id ? null : group.id);
                setAccountMenuOpen(false);
              }}
            >
              {group.label} <span className="material-symbols-rounded arr">expand_more</span>
              <div className="dropdown" onClick={(event) => event.stopPropagation()}>
                {group.items.map((item) => (
                  <button key={item.path} type="button" className="dd-item" onClick={() => handleCalcSelect(item.path)}>
                    <div className={`dd-icon ${item.color}`}>
                      <span className="material-symbols-rounded">{item.icon}</span>
                    </div>
                    <div className="dd-text">
                      <div>{item.title}</div>
                      <div>{item.sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="mobile-theme-toggle"
            onClick={toggleTheme}
          >
            <span className="material-symbols-rounded">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </nav>

        <div className="h-right">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="material-symbols-rounded">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          </button>

          <div className="account-menu">
            {!user ? (
              <button type="button" className="btn-login account-btn" onClick={() => setShowAuthModal(true)} aria-label="Login">
                <span className="material-symbols-rounded nav-icon">person</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-login account-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    setAccountMenuOpen(!accountMenuOpen);
                    setOpenDropdown(null);
                  }}
                  aria-label="Account"
                >
                  <span className="material-symbols-rounded nav-icon">account_circle</span>
                </button>

                <div className={`account-pop ${accountMenuOpen ? 'open' : ''}`}>
                  <div className="account-name">{user.username}</div>
                  <button
                    type="button"
                    className="account-action"
                    onClick={() => {
                      navigate('/profile');
                      setAccountMenuOpen(false);
                    }}
                  >
                    <span className="material-symbols-rounded nav-icon-sm">tune</span>
                    Profile
                  </button>
                  <button
                    type="button"
                    className="account-action"
                    onClick={() => {
                      navigate('/portfolio');
                      setAccountMenuOpen(false);
                    }}
                  >
                    <span className="material-symbols-rounded nav-icon-sm">folder_open</span>
                    Portfolio Library
                  </button>
                  <button type="button" className="account-action" onClick={handleLogout}>
                    <span className="material-symbols-rounded nav-icon-sm">logout</span>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Primary navigation">
        {[
          { to: '/', label: 'Home', icon: 'home', end: true },
          { to: '/invest', label: 'Invest', icon: 'trending_up' },
          { to: '/ai', label: 'AI', icon: 'auto_awesome' },
          { to: '/plan', label: 'Plan', icon: 'track_changes' },
          { to: '/loans', label: 'Loans', icon: 'credit_card' },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `mobile-bottom-link${isActive ? ' active' : ''}`}
          >
            <span className="material-symbols-rounded">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
