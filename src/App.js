import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import SIPCalculator from './pages/SIPCalculator';
import LumpsumCalculator from './pages/LumpsumCalculator';
import SWPCalculator from './pages/SWPCalculator';
import LoanCalculator from './pages/LoanCalculator';
import PPFCalculator from './pages/PPFCalculator';
import RetirementCalculator from './pages/RetirementCalculator';
import GoalSipCalculator from './pages/GoalSipCalculator';
import InflationCalculator from './pages/InflationCalculator';
import CagrCalculator from './pages/CagrCalculator';
import LoanPrepaymentCalculator from './pages/LoanPrepaymentCalculator';
import LoanEligibilityCalculator from './pages/LoanEligibilityCalculator';
import IncomeTaxCalculator from './pages/IncomeTaxCalculator';
import FdCalculator from './pages/FdCalculator';
import RdCalculator from './pages/RdCalculator';
import './styles/main.css';
import './styles/calculator.css';

function fillRangeSlider(el) {
  const min = parseFloat(el.min);
  const max = parseFloat(el.max);
  const val = parseFloat(el.value);
  const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
  el.style.setProperty('--range-fill', `${pct}%`);
}

function RangeSliderSync() {
  const location = useLocation();

  useEffect(() => {
    const syncAll = () => {
      document.querySelectorAll('input[type="range"]').forEach(fillRangeSlider);
    };

    syncAll();
    const timer = setTimeout(syncAll, 50);

    const onInput = (e) => {
      if (e.target.matches('input[type="range"]')) fillRangeSlider(e.target);
    };
    document.addEventListener('input', onInput);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('input', onInput);
    };
  }, [location.pathname]);

  return null;
}

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <RangeSliderSync />
          <Header showAuthModal={showAuthModal} setShowAuthModal={setShowAuthModal} />
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sip/:shareToken?" element={<SIPCalculator />} />
            <Route path="/lumpsum/:shareToken?" element={<LumpsumCalculator />} />
            <Route path="/ppf/:shareToken?" element={<PPFCalculator />} />
            <Route path="/swp/:shareToken?" element={<SWPCalculator />} />
            <Route path="/loan/:shareToken?" element={<LoanCalculator />} />
            <Route path="/retirement/:shareToken?" element={<RetirementCalculator />} />
            <Route path="/goal-sip/:shareToken?" element={<GoalSipCalculator />} />
            <Route path="/inflation/:shareToken?" element={<InflationCalculator />} />
            <Route path="/cagr/:shareToken?" element={<CagrCalculator />} />
            <Route path="/loan-prepayment/:shareToken?" element={<LoanPrepaymentCalculator />} />
            <Route path="/loan-eligibility/:shareToken?" element={<LoanEligibilityCalculator />} />
            <Route path="/income-tax/:shareToken?" element={<IncomeTaxCalculator />} />
            <Route path="/fd/:shareToken?" element={<FdCalculator />} />
            <Route path="/rd/:shareToken?" element={<RdCalculator />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
