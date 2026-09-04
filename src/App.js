import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { AIProvider } from './context/ai/AIContext';
import { FeatureFlagsProvider, useFeatureFlags } from './context/FeatureFlagsContext';
import Header from './components/Header';
import MobileFixedHeader from './components/MobileFixedHeader';
import './styles/mobile-header.css';
import AuthModal from './components/AuthModal';
import Home from './pages/Home';
import RouteMeta from './components/RouteMeta';
import './styles/main.css';
import './styles/calculator.css';
import './styles/ai.css';
import './styles/editorial.css';
import { attachMobileRangeBehavior, isMobileRangeContext } from './utils/mobileRangeSlider';

const clarityProjectId = process.env.REACT_APP_CLARITY_PROJECT_ID;
const enableVercelInsights = process.env.REACT_APP_ENABLE_VERCEL_INSIGHTS === 'true';
const SIPCalculator = lazy(() => import('./pages/SIPCalculator'));
const LumpsumCalculator = lazy(() => import('./pages/LumpsumCalculator'));
const SWPCalculator = lazy(() => import('./pages/SWPCalculator'));
const LoanCalculator = lazy(() => import('./pages/LoanCalculator'));
const PPFCalculator = lazy(() => import('./pages/PPFCalculator'));
const RetirementCalculator = lazy(() => import('./pages/RetirementCalculator'));
const GoalSipCalculator = lazy(() => import('./pages/GoalSipCalculator'));
const InflationCalculator = lazy(() => import('./pages/InflationCalculator'));
const CagrCalculator = lazy(() => import('./pages/CagrCalculator'));
const LoanPrepaymentCalculator = lazy(() => import('./pages/LoanPrepaymentCalculator'));
const LoanEligibilityCalculator = lazy(() => import('./pages/LoanEligibilityCalculator'));
const IncomeTaxCalculator = lazy(() => import('./pages/IncomeTaxCalculator'));
const FdCalculator = lazy(() => import('./pages/FdCalculator'));
const RdCalculator = lazy(() => import('./pages/RdCalculator'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CustomInflationCalculator = lazy(() => import('./pages/CustomInflationCalculator'));
const PortfolioDetailsPage = lazy(() => import('./pages/PortfolioDetailsPage'));
const PortfolioLibraryPage = lazy(() => import('./pages/PortfolioLibraryPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const AIHomePage = lazy(() => import('./pages/ai/AIHomePage'));
const SpeedInsights = lazy(() => import('@vercel/speed-insights/react').then(({ SpeedInsights: Component }) => ({ default: Component })));
const Analytics = lazy(() => import('@vercel/analytics/react').then(({ Analytics: Component }) => ({ default: Component })));

function PageLoader() {
  return (
    <main className="page page-loader" aria-live="polite" aria-label="Loading page">
      <div className="page-loader-mark"><span /></div>
      <p>Preparing your workspace</p>
    </main>
  );
}

class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // Preserve the existing app flow while exposing errors to the browser console for support.
    console.error('PlanMyCapital page error', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page app-error-state" role="alert">
          <div className="app-state-icon"><span className="material-symbols-rounded">error</span></div>
          <span className="home-kicker">Something interrupted this view</span>
          <h1>Let’s get you back on track.</h1>
          <p>Your saved work is still available. Return home or refresh the page to try again.</p>
          <div className="home-hero-actions">
            <Link to="/" className="home-primary-action">Return home</Link>
            <button type="button" className="home-secondary-action" onClick={() => window.location.reload()}>Refresh page</button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

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
      document.querySelectorAll('input[type="range"]').forEach((el) => {
        fillRangeSlider(el);
        attachMobileRangeBehavior(el);
      });
    };

    syncAll();
    const timer = setTimeout(syncAll, 50);

    const onInput = (e) => {
      if (e.target.matches('input[type="range"]')) fillRangeSlider(e.target);
    };
    document.addEventListener('input', onInput);

    const onResize = () => {
      if (isMobileRangeContext()) syncAll();
    };
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('input', onInput);
      window.removeEventListener('resize', onResize);
    };
  }, [location.pathname]);

  return null;
}

function AIEnabledRoute() {
  const { aiFeatures } = useFeatureFlags();
  return aiFeatures ? <AIHomePage /> : <Navigate to="/" replace />;
}

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!clarityProjectId || clarityProjectId === 'yourProjectId') return undefined;

    const loadClarity = () => {
      import('@microsoft/clarity').then(({ default: Clarity }) => Clarity.init(clarityProjectId));
    };
    const idleCallback = window.requestIdleCallback?.(loadClarity, { timeout: 4000 });
    const timeout = idleCallback ? null : window.setTimeout(loadClarity, 2000);

    return () => {
      if (idleCallback) window.cancelIdleCallback?.(idleCallback);
      if (timeout) window.clearTimeout(timeout);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <FeatureFlagsProvider>
          <AIProvider>
          <BrowserRouter>
            <RangeSliderSync />
            <RouteMeta />
            <MobileFixedHeader setShowAuthModal={setShowAuthModal} />
            <Header setShowAuthModal={setShowAuthModal} />
            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <AppErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/portfolio" element={<PortfolioLibraryPage />} />
              <Route path="/ai" element={<AIEnabledRoute />} />
              <Route path="/invest" element={<CategoryPage category="invest" />} />
              <Route path="/plan" element={<CategoryPage category="plan" />} />
              <Route path="/loans" element={<CategoryPage category="loans" />} />
              <Route path="/portfolio/:portfolioId" element={<PortfolioDetailsPage />} />
            <Route path="/sip/:username/config/:configName" element={<SIPCalculator />} />
            <Route path="/sip" element={<SIPCalculator />} />
            <Route path="/lumpsum/:username/config/:configName" element={<LumpsumCalculator />} />
            <Route path="/lumpsum" element={<LumpsumCalculator />} />
            <Route path="/ppf/:username/config/:configName" element={<PPFCalculator />} />
            <Route path="/ppf" element={<PPFCalculator />} />
            <Route path="/swp/:username/config/:configName" element={<SWPCalculator />} />
            <Route path="/swp" element={<SWPCalculator />} />
            <Route path="/loan/:username/config/:configName" element={<LoanCalculator />} />
            <Route path="/loan" element={<LoanCalculator />} />
            <Route path="/retirement/:username/config/:configName" element={<RetirementCalculator />} />
            <Route path="/retirement" element={<RetirementCalculator />} />
            <Route path="/goal-sip/:username/config/:configName" element={<GoalSipCalculator />} />
            <Route path="/goal-sip" element={<GoalSipCalculator />} />
            <Route path="/inflation/:username/config/:configName" element={<InflationCalculator />} />
            <Route path="/inflation" element={<InflationCalculator />} />
            <Route path="/cagr/:username/config/:configName" element={<CagrCalculator />} />
            <Route path="/cagr" element={<CagrCalculator />} />
            <Route path="/loan-prepayment/:username/config/:configName" element={<LoanPrepaymentCalculator />} />
            <Route path="/loan-prepayment" element={<LoanPrepaymentCalculator />} />
            <Route path="/loan-eligibility/:username/config/:configName" element={<LoanEligibilityCalculator />} />
            <Route path="/loan-eligibility" element={<LoanEligibilityCalculator />} />
            <Route path="/income-tax/:username/config/:configName" element={<IncomeTaxCalculator />} />
            <Route path="/income-tax" element={<IncomeTaxCalculator />} />
            <Route path="/fd/:username/config/:configName" element={<FdCalculator />} />
            <Route path="/fd" element={<FdCalculator />} />
            <Route path="/rd/:username/config/:configName" element={<RdCalculator />} />
            <Route path="/rd" element={<RdCalculator />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/custom-inflation" element={<CustomInflationCalculator />} />
                </Routes>
              </Suspense>
            </AppErrorBoundary>
            {enableVercelInsights && (
              <Suspense fallback={null}>
                <SpeedInsights />
                <Analytics />
              </Suspense>
            )}
          </BrowserRouter>
          </AIProvider>
          </FeatureFlagsProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

