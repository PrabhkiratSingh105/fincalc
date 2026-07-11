import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChartPanel from '../components/calculator/ChartPanel';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { parseApiResponse } from '../utils/api';
import {
  PORTFOLIO_TYPE_OPTIONS,
  PORTFOLIO_TYPE_TO_PAGE,
  PORTFOLIO_BASE_YEAR,
  buildPortfolioProjection,
  buildPortfolioSnapshot,
  createDefaultPortfolioItem,
  normalizePortfolioCalendarYear,
} from '../utils/portfolio';
import { formatINR } from '../utils/format';
import { API } from "../config";
function ConfigSelect({ type, item, options, onChange, disabled = false }) {
  const pageKey = PORTFOLIO_TYPE_TO_PAGE[type];

  return (
    <select
      className="calc-input"
      value={item.configId || ''}
      disabled={disabled}
      onChange={(event) => {
        const selected = options.find((entry) => entry.id === event.target.value);
        onChange({
          ...item,
          configId: selected?.id || '',
          configName: selected?.name || '',
          resolvedConfig: selected?.config || null,
          type,
        });
      }}
    >
      <option value="">Select saved {pageKey} config</option>
      {item.configId && !options.some((entry) => entry.id === item.configId) && (
        <option value={item.configId}>{item.configName || 'Saved configuration'}</option>
      )}
      {options.map((entry) => (
        <option key={entry.id} value={entry.id}>
          {entry.name}
        </option>
      ))}
    </select>
  );
}

function StartYearInput({ value, disabled, onCommit }) {
  const normalizedValue = normalizePortfolioCalendarYear(value, PORTFOLIO_BASE_YEAR);
  const [draft, setDraft] = useState(String(normalizedValue));

  useEffect(() => {
    setDraft(String(normalizedValue));
  }, [normalizedValue]);

  const commit = () => {
    const trimmed = String(draft).trim();
    const nextYear = trimmed === ''
      ? PORTFOLIO_BASE_YEAR
      : normalizePortfolioCalendarYear(trimmed, PORTFOLIO_BASE_YEAR);
    setDraft(String(nextYear));
    onCommit(nextYear);
  };

  return (
    <input
      type="number"
      className="calc-input"
      min={PORTFOLIO_BASE_YEAR}
      max={PORTFOLIO_BASE_YEAR + 99}
      placeholder={String(PORTFOLIO_BASE_YEAR)}
      value={draft}
      disabled={disabled}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
    />
  );
}

export default function PortfolioDetailsPage() {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { user, token } = useAuth();
  const portfolios = settings.portfolios || [];
  const privatePortfolio = user ? portfolios.find((entry) => entry.id === portfolioId) : null;
  const [publicPortfolio, setPublicPortfolio] = useState(null);
  const [publicLoadState, setPublicLoadState] = useState('idle');
  const portfolio = privatePortfolio || publicPortfolio;
  const isPublicView = Boolean(!privatePortfolio && publicPortfolio);
  const canEdit = Boolean(privatePortfolio && user);
  const [configLibrary, setConfigLibrary] = useState({});
  const portfolioInflation = Number(portfolio?.inflationRate ?? settings.defaultInflationRate) || settings.defaultInflationRate;
  const inflationRate = portfolioInflation / 100;

  useEffect(() => {
    if (user && !privatePortfolio && portfolios.length > 0 && publicLoadState === 'not-found') {
      navigate('/');
    }
  }, [navigate, privatePortfolio, portfolios.length, publicLoadState, user]);

  useEffect(() => {
    if (privatePortfolio || !portfolioId) return;

    let alive = true;
    setPublicLoadState('loading');

    fetch(`${API}/api/public-portfolios/${encodeURIComponent(portfolioId)}`)
      .then((response) => parseApiResponse(response, 'Public portfolio not found.'))
      .then((data) => {
        if (!alive) return;
        setPublicPortfolio(data.portfolio || null);
        setPublicLoadState(data.portfolio ? 'ready' : 'not-found');
      })
      .catch(() => {
        if (!alive) return;
        setPublicPortfolio(null);
        setPublicLoadState('not-found');
      });

    return () => {
      alive = false;
    };
  }, [portfolioId, privatePortfolio]);

  useEffect(() => {
    let alive = true;

    async function loadConfigs() {
      const entries = await Promise.all(
        Object.entries(PORTFOLIO_TYPE_TO_PAGE).map(async ([type, pageKey]) => {
          if (!user || !token) {
            return [type, []];
          }

          try {
            const response = await fetch(`${API}/api/configs/${pageKey}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await parseApiResponse(response, `Could not load ${pageKey} configs.`);
            return [type, data?.configs || []];
          } catch {
            return [type, []];
          }
        })
      );

      if (!alive) return;
      setConfigLibrary(Object.fromEntries(entries));
    }

    loadConfigs();
    return () => {
      alive = false;
    };
  }, [token, user]);

  const updatePortfolio = (nextPortfolio) => {
    if (!canEdit) return;
    updateSettings((prev) => ({
      ...prev,
      portfolios: (prev.portfolios || []).map((entry) =>
        entry.id === nextPortfolio.id
          ? { ...nextPortfolio, updatedAt: new Date().toISOString() }
          : entry
      ),
    }));
  };

  const snapshot = useMemo(
    () =>
      portfolio
        ? buildPortfolioSnapshot(portfolio.items || [], portfolio.timelineYear, inflationRate, portfolio.inflationAdjusted)
        : { totalNetWorth: 0, monthlyInvestments: 0, monthlyPayments: 0, monthlyWithdrawals: 0, totalInvested: 0, totalReturns: 0 },
    [inflationRate, portfolio]
  );

  const projection = useMemo(
    () =>
      portfolio
        ? buildPortfolioProjection(
            portfolio.items || [],
            inflationRate,
            portfolio.inflationAdjusted,
            portfolio.timelineYear
          )
        : { labels: [], netWorthSeries: [] },
    [inflationRate, portfolio]
  );

  if (!portfolio) {
    if (publicLoadState === 'loading') {
      return (
        <div className="page portfolio-page">
          <div className="ph home-hero">
            <h1>Loading portfolio</h1>
            <p>Fetching the portfolio workspace.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="page portfolio-page">
        <div className="ph home-hero">
          <h1>Portfolio</h1>
          <p>Please log in to view private portfolios, or check that the public portfolio URL is correct.</p>
        </div>
        <div className="portfolio-index-layout">
          <section className="card portfolio-login-card">
            <span className="material-symbols-rounded">lock</span>
            <div>
              <div className="slbl">Login Required</div>
              <p className="settings-note">Use the login button in the header to access your saved portfolios.</p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const selectedCalendarYear = normalizePortfolioCalendarYear(portfolio.timelineYear, PORTFOLIO_BASE_YEAR);

  return (
    <div className="page portfolio-page">
      <div className="ph home-hero">
        <button type="button" className="calc-mobile-back portfolio-back-link" onClick={() => navigate('/portfolio')}>
          <span className="material-symbols-rounded">arrow_back</span>
          Back to portfolios
        </button>
        <h1>{portfolio.name}</h1>
        <p>{isPublicView ? 'Read-only public portfolio projection.' : 'Choose saved calculator configurations for each asset or liability row and project net worth through the selected timeline year.'}</p>
      </div>

      <div className="portfolio-layout">
        <section className="card portfolio-builder-panel">
          <div className="portfolio-toolbar">
            <label className="portfolio-name-field">
              <span className="slbl">Portfolio Name</span>
              <input
                type="text"
                className="calc-input"
                value={portfolio.name}
                disabled={!canEdit}
                onChange={(event) => updatePortfolio({ ...portfolio, name: event.target.value })}
              />
            </label>
            <label className="portfolio-name-field">
              <span className="slbl">Inflation Rate (%)</span>
              <input
                type="number"
                className="calc-input"
                min="0"
                max="15"
                step="0.5"
                value={portfolioInflation}
                disabled={!canEdit}
                onChange={(event) => updatePortfolio({ ...portfolio, inflationRate: Number(event.target.value) })}
              />
            </label>
            <div className="portfolio-toggle-group">
              <button
                type="button"
                className={`portfolio-toggle ${portfolio.inflationAdjusted ? '' : 'active'}`}
                disabled={!canEdit}
                onClick={() => updatePortfolio({ ...portfolio, inflationAdjusted: false })}
              >
                Non-Inflation Adjusted
              </button>
              <button
                type="button"
                className={`portfolio-toggle ${portfolio.inflationAdjusted ? 'active' : ''}`}
                disabled={!canEdit}
                onClick={() => updatePortfolio({ ...portfolio, inflationAdjusted: true })}
              >
                Inflation Adjusted
              </button>
            </div>
          </div>

          <div className="portfolio-table-wrap">
            <table className="calc-table portfolio-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Saved Configuration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {portfolio.items?.length ? (
                  portfolio.items.map((item) => {
                    const options = configLibrary[item.type] || [];
                    return (
                      <tr key={item.id}>
                        <td className="portfolio-type-cell">
                          <select
                            className="calc-input"
                            value={item.type}
                            disabled={!canEdit}
                            onChange={(event) =>
                              updatePortfolio({
                                ...portfolio,
                                items: portfolio.items.map((entry) =>
                                  entry.id === item.id
                                    ? { ...createDefaultPortfolioItem(event.target.value), startYear: normalizePortfolioCalendarYear(item.startYear, PORTFOLIO_BASE_YEAR) }
                                    : entry
                                ),
                              })
                            }
                          >
                            {PORTFOLIO_TYPE_OPTIONS.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <label className="portfolio-start-year-field">
                            <span>Starting Year</span>
                            <StartYearInput
                              value={item.startYear}
                              disabled={!canEdit}
                              onCommit={(nextYear) =>
                                updatePortfolio({
                                  ...portfolio,
                                  items: portfolio.items.map((entry) =>
                                    entry.id === item.id
                                      ? { ...entry, startYear: nextYear }
                                      : entry
                                  ),
                                })
                              }
                            />
                          </label>
                        </td>
                        <td>
                          <ConfigSelect
                            type={item.type}
                            item={item}
                            options={options}
                            disabled={!canEdit}
                            onChange={(nextItem) =>
                              updatePortfolio({
                                ...portfolio,
                                items: portfolio.items.map((entry) => (entry.id === item.id ? nextItem : entry)),
                              })
                            }
                          />
                        </td>
                        <td>
                          {canEdit && (
                          <button
                            type="button"
                            className="saved-config-action danger"
                            onClick={() =>
                              updatePortfolio({
                                ...portfolio,
                                items: portfolio.items.filter((entry) => entry.id !== item.id),
                              })
                            }
                          >
                            Remove
                          </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="portfolio-empty-state">
                      Add a row, pick the calculator type, then choose one of your saved configs for that type.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {canEdit && (
            <button
              type="button"
              className="mini-btn primary portfolio-add-row"
              onClick={() =>
                updatePortfolio({
                  ...portfolio,
                  items: [...(portfolio.items || []), createDefaultPortfolioItem('SIP')],
                })
              }
            >
              + Add Row
            </button>
          )}
        </section>

        <aside className="portfolio-summary-panel">
          <div className="card portfolio-summary-card">
            <div className="slbl">Summary Panel</div>
            <div className="portfolio-worth-value">{formatINR(Math.round(snapshot.totalNetWorth))}</div>
            <div className="portfolio-worth-label">Total Net Worth</div>

            <div className="portfolio-stats-grid">
              <div className="portfolio-stat">
                <span>Monthly Investment</span>
                <strong>{formatINR(Math.round(snapshot.monthlyInvestments || 0))}</strong>
              </div>
              <div className="portfolio-stat">
                <span>Monthly Withdrawals</span>
                <strong>{formatINR(Math.round(snapshot.monthlyWithdrawals || 0))}</strong>
              </div>
              <div className="portfolio-stat">
                <span>Monthly Loan EMI</span>
                <strong>{formatINR(Math.round(snapshot.monthlyPayments || 0))}</strong>
              </div>
              <div className="portfolio-stat">
                <span>Total Returns</span>
                <strong>{formatINR(Math.round(snapshot.totalReturns || 0))}</strong>
              </div>
              <div className="portfolio-stat">
                <span>Selected Year</span>
                <strong>{selectedCalendarYear}</strong>
              </div>
              <div className="portfolio-stat">
                <span>Inflation</span>
                <strong>{portfolioInflation}%</strong>
              </div>
            </div>

            <label className="portfolio-slider-block" htmlFor="portfolioTimeline">
              <span className="slbl">Timeline Year</span>
              <div className="portfolio-slider-label">{selectedCalendarYear}</div>
              <input
                id="portfolioTimeline"
                type="range"
                min={PORTFOLIO_BASE_YEAR}
                max={PORTFOLIO_BASE_YEAR + 99}
                value={selectedCalendarYear}
                disabled={!canEdit}
                onChange={(event) =>
                  updatePortfolio({ ...portfolio, timelineYear: normalizePortfolioCalendarYear(event.target.value, PORTFOLIO_BASE_YEAR) })
                }
              />
            </label>
          </div>

          <div className="card portfolio-chart-card">
            <ChartPanel
              chart={{
                title: 'Net Worth Over Time',
                type: 'line',
                height: 320,
                data: {
                  labels: projection.labels,
                  datasets: [
                    {
                      label: portfolio.inflationAdjusted ? 'Inflation-Adjusted Net Worth' : 'Net Worth',
                      data: projection.netWorthSeries,
                    },
                  ],
                },
              }}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
