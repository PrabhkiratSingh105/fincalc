import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://planmycapital.com';
const DEFAULT_DESCRIPTION = 'Free financial calculators for India: SIP, SWP, lumpsum, loans, tax, deposits, inflation, and retirement planning.';

const ROUTES = {
  '/': ['Financial Calculators for India', DEFAULT_DESCRIPTION],
  '/sip': ['SIP Calculator', 'Calculate SIP returns, taxes, and inflation-adjusted mutual fund growth.'],
  '/lumpsum': ['Lumpsum Calculator', 'Calculate one-time investment growth, taxes, and inflation-adjusted returns.'],
  '/swp': ['SWP Calculator', 'Plan systematic withdrawals and estimate how long your investment corpus can last.'],
  '/ppf': ['PPF Calculator', 'Estimate PPF maturity value and long-term tax-saving investment growth.'],
  '/fd': ['FD Calculator', 'Calculate fixed deposit maturity value and interest earned.'],
  '/rd': ['RD Calculator', 'Calculate recurring deposit maturity value and interest earned.'],
  '/cagr': ['CAGR Calculator', 'Calculate the compound annual growth rate of an investment.'],
  '/retirement': ['Retirement Calculator', 'Estimate the retirement corpus you need and assess your retirement readiness.'],
  '/goal-sip': ['Goal SIP Calculator', 'Calculate the monthly SIP needed to reach your financial goal.'],
  '/inflation': ['Inflation Calculator', 'See how inflation affects purchasing power over time.'],
  '/loan': ['Loan EMI Calculator', 'Calculate loan EMIs, interest costs, and your repayment schedule.'],
  '/loan-prepayment': ['Loan Prepayment Calculator', 'Estimate the interest and time saved by prepaying your loan.'],
  '/loan-eligibility': ['Loan Eligibility Calculator', 'Estimate the maximum loan amount you may be eligible for.'],
  '/income-tax': ['Income Tax Calculator', 'Estimate income tax under India’s old and new tax regimes.'],
};

function setMeta(selector, attribute, value) {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
}

function setCanonical(href) {
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', href);
}

export default function RouteMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
    const route = ROUTES[normalizedPath];
    const isPublicCalculatorConfig = /^\/(sip|lumpsum|ppf|swp|loan|retirement|goal-sip|inflation|cagr|loan-prepayment|loan-eligibility|income-tax|fd|rd)\/[^/]+\/config\/[^/]+$/.test(normalizedPath);
    const isPrivateOrDynamic = normalizedPath === '/profile' || normalizedPath === '/custom-inflation' || normalizedPath.startsWith('/portfolio/');
    const title = route ? `${route[0]} | PlanMyCapital` : 'PlanMyCapital | Financial Calculators for India';
    const description = route ? route[1] : DEFAULT_DESCRIPTION;
    const canonicalPath = isPublicCalculatorConfig ? `/${normalizedPath.split('/')[1]}` : normalizedPath;
    const canonicalUrl = `${SITE_URL}${canonicalPath === '/' ? '/' : canonicalPath}`;

    document.title = title;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="robots"]', 'content', isPrivateOrDynamic || isPublicCalculatorConfig ? 'noindex, follow' : 'index, follow');
    setCanonical(canonicalUrl);
  }, [pathname]);

  return null;
}
