import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function MobileFixedHeader({ setShowAuthModal }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="mobile-top-fixed" role="banner">
      <div className="mobile-top-inner">
        <button
          type="button"
          className="mobile-top-theme-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="material-symbols-rounded">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>

        <Link to="/" className="mobile-top-logo">
          <span className="logo-name">PlanMy<em>Capital</em></span>
        </Link>

        <div>
          {!user ? (
            <button
              type="button"
              className="mobile-top-auth-btn"
              onClick={() => setShowAuthModal(true)}
              aria-label="Login or Signup"
            >
              <span className="material-symbols-rounded">person</span>
            </button>
          ) : (
            <Link to="/profile" className="mobile-top-auth-btn" aria-label="Account">
              <span className="material-symbols-rounded">account_circle</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
