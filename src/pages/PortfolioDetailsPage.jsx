import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChartPanel from '../components/calculator/ChartPanel';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { parseApiResponse } from '../utils/api';
import {
  PORTFOLIO_TYPE_OPTIONS,
  PORTFOLIO_TYPE_TO_PAGE,
  buildPortfolioProjection,
  buildPortfolioSnapshot,
  createDefaultPortfolioItem,
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

export default function PortfolioDetailsPage() {
  const { portfolioId } = useParams();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const { user, token } = useAuth();
  const portfolios = settings.portfolios || [];
  const privatePortfolio = user ? portfolios.find((entry) => entry.id === portfolioId) : null;
  const [publicPortfolio, setPublicPortfolio] = useState(null);
  const [publicLoadState, setPublicLoadState] = useState('idle');
  const [publishState, setPublishState] = useState({ loading: false, message: '', url: '' });
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
        : { totalNetWorth: 0, monthlyInvestments: 0, monthlyPayments: 0, monthlyWithdrawals: 0 },
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

  const publishPortfolio = async () => {
    if (!portfolio || !token) return;
    setPublishState({ loading: true, message: '', url: '' });

    try {
      const response = await fetch(`${API}/api/public-portfolios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ portfolio }),
      });
      const data = await parseApiResponse(response, 'Could not make portfolio public.');
      const nextPortfolio = {
        ...portfolio,
        isPublic: true,
        publicSlug: data.slug,
        publicUrl: data.url,
      };
      updatePortfolio(nextPortfolio);
      setPublishState({ loading: false, message: 'Public link is ready.', url: data.url });
    } catch (error) {
      setPublishState({ loading: false, message: error.message || 'Could not make portfolio public.', url: '' });
    }
  };

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

  const currentCalendarYear = new Date().getFullYear() + portfolio.timelineYear - 1;

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
            {canEdit && (
              <div className="portfolio-public-actions">
                <button
                  type="button"
                  className="mini-btn primary"
                  onClick={publishPortfolio}
                  disabled={publishState.loading}
                >
                  {publishState.loading ? 'Publishing...' : 'Make Public'}
                </button>
                {(publishState.url || portfolio.publicUrl) && (
                  <a className="portfolio-public-link" href={publishState.url || portfolio.publicUrl}>
                    {publishState.url || portfolio.publicUrl}
                  </a>
                )}
                {publishState.message && <span className="settings-note">{publishState.message}</span>}
              </div>
            )}
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
                        <td>
                          <select
                            className="calc-input"
                            value={item.type}
                            disabled={!canEdit}
                            onChange={(event) =>
                              updatePortfolio({
                                ...portfolio,
                                items: portfolio.items.map((entry) =>
                                  entry.id === item.id ? createDefaultPortfolioItem(event.target.value) : entry
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
                <span>Current Year</span>
                <strong>{currentCalendarYear}</strong>
              </div>
              <div className="portfolio-stat">
                <span>Inflation</span>
                <strong>{portfolioInflation}%</strong>
              </div>
            </div>

            <label className="portfolio-slider-block" htmlFor="portfolioTimeline">
              <span className="slbl">Timeline Slider</span>
              <div className="portfolio-slider-label">Year {portfolio.timelineYear}</div>
              <input
                id="portfolioTimeline"
                type="range"
                min="1"
                max="100"
                value={portfolio.timelineYear}
                disabled={!canEdit}
                onChange={(event) =>
                  updatePortfolio({ ...portfolio, timelineYear: Number(event.target.value) })
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
