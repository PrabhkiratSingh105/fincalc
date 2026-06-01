import React, { useState, useEffect, useRef } from 'react';

import { Link, useNavigate } from 'react-router-dom';

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

    ],

  },

  {

    id: 'tax',

    label: 'Tax',

    items: [

      { path: 'income-tax', icon: 'receipt_long', color: 'violet', title: 'Income Tax Calculator', sub: 'Old vs new regime' },

    ],

  },

];



export default function Header({ showAuthModal, setShowAuthModal }) {

  const { user, logout } = useAuth();

  const { theme, toggleTheme } = useTheme();

  const [openDropdown, setOpenDropdown] = useState(null);

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const headerRef = useRef(null);

  const navigate = useNavigate();



  const handleCalcSelect = (path) => {

    navigate(`/${path}`);

    setOpenDropdown(null);

  };



  const handleLogout = () => {

    logout();

    setAccountMenuOpen(false);

  };



  useEffect(() => {

    const closeMenus = (e) => {

      if (headerRef.current && !headerRef.current.contains(e.target)) {

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

        <Link to="/" className="logo">

          <div className="logo-box">

            <span className="material-symbols-rounded">show_chart</span>

          </div>

          <span className="logo-name">

            Fin<em>Calc</em>

          </span>

        </Link>



        <nav>

          {NAV.map((group) => (

            <div

              key={group.id}

              className={`nav-item ${openDropdown === group.id ? 'open' : ''}`}

              onClick={() => setOpenDropdown(openDropdown === group.id ? null : group.id)}

            >

              {group.label} <span className="material-symbols-rounded arr">expand_more</span>

              <div className="dropdown" onClick={(e) => e.stopPropagation()}>

                {group.items.map((item) => (

                  <button

                    key={item.path}

                    type="button"

                    className="dd-item"

                    onClick={() => handleCalcSelect(item.path)}

                  >

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

        </nav>



        <div className="h-right">

          <button

            type="button"

            className="theme-toggle"

            onClick={toggleTheme}

            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}

          >

            <span className="material-symbols-rounded">

              {theme === 'dark' ? 'light_mode' : 'dark_mode'}

            </span>

          </button>

          <div className="account-menu">

            {!user ? (

              <button

                type="button"

                className="btn-login account-btn"

                onClick={() => setShowAuthModal(true)}

                aria-label="Login"

              >

                <span className="material-symbols-rounded nav-icon">person</span>

              </button>

            ) : (

              <>

                <button

                  type="button"

                  className="btn-login account-btn"

                  onClick={(e) => {

                    e.stopPropagation();

                    setAccountMenuOpen(!accountMenuOpen);

                    setOpenDropdown(null);

                  }}

                  aria-label="Account"

                >

                  <span className="material-symbols-rounded nav-icon">account_circle</span>

                </button>

                <div className={`account-pop ${accountMenuOpen ? 'open' : ''}`}>

                  <div className="account-name">{user.username}</div>

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

    </header>

  );

}

