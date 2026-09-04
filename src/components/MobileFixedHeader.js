import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFeatureFlags } from '../context/FeatureFlagsContext';

export default function MobileFixedHeader({ setShowAuthModal }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { aiFeatures } = useFeatureFlags();
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = [
    { to: '/', label: 'Home', icon: 'home', end: true },
    { to: '/plan', label: 'Plan', icon: 'track_changes' },
    { to: '/invest', label: 'Invest', icon: 'trending_up' },
    { to: '/portfolio', label: 'Portfolio', icon: 'pie_chart' },
  ];

  return <>
    <header className="mobile-top-fixed" role="banner"><div className="mobile-top-inner">
      <button type="button" className="mobile-top-theme-btn" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}><span className="material-symbols-rounded">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span></button>
      <Link to="/" className="mobile-top-logo"><span className="logo-name">PlanMy<em>Capital</em></span></Link>
      {user ? <Link to="/profile" className="mobile-top-auth-btn" aria-label="Profile"><span className="material-symbols-rounded">account_circle</span></Link> : <button type="button" className="mobile-top-auth-btn" onClick={() => setShowAuthModal(true)} aria-label="Login or signup"><span className="material-symbols-rounded">person</span></button>}
    </div></header>
    <nav className="mobile-bottom-nav" aria-label="Primary navigation">
      {primary.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `mobile-bottom-link${isActive ? ' active' : ''}`}><span className="material-symbols-rounded">{item.icon}</span><span>{item.label}</span></NavLink>)}
      <button type="button" className={`mobile-bottom-link mobile-more-trigger${moreOpen ? ' active' : ''}`} onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen}><span className="material-symbols-rounded">apps</span><span>More</span></button>
    </nav>
    {moreOpen && <div className="mobile-more-backdrop" onClick={() => setMoreOpen(false)}><section className="mobile-more-sheet" aria-label="More navigation" onClick={(event) => event.stopPropagation()}><div className="mobile-sheet-handle" /><div className="mobile-sheet-heading"><span>More tools</span><button type="button" onClick={() => setMoreOpen(false)} aria-label="Close menu"><span className="material-symbols-rounded">close</span></button></div><Link to="/loans" onClick={() => setMoreOpen(false)}><span className="material-symbols-rounded">credit_score</span>Loans & tax</Link>{aiFeatures && <Link to="/ai" onClick={() => setMoreOpen(false)}><span className="material-symbols-rounded">auto_awesome</span>Ask PlanMyCapital AI</Link>}<Link to="/custom-inflation" onClick={() => setMoreOpen(false)}><span className="material-symbols-rounded">tune</span>Custom inflation</Link></section></div>}
  </>;
}
