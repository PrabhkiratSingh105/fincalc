import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChartPanel from '../components/calculator/ChartPanel';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { parseApiResponse } from '../utils/api';
import { listConfigs as listLocalConfigs } from '../utils/savedConfigs';
import {
  PORTFOLIO_TYPE_OPTIONS,
  PORTFOLIO_TYPE_TO_PAGE,
  buildPortfolioProjection,
  buildPortfolioSnapshot,
  createDefaultPortfolioItem,
} from '../utils/portfolio';
import { formatINR } from '../utils/format';

function ConfigSelect({ type, item, options, onChange }) {
  const pageKey = PORTFOLIO_TYPE_TO_PAGE[type];

  return (
    <select
      className="calc-input"
      value={item.configId || ''}
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
  const portfolio = portfolios.find((entry) => entry.id === portfolioId);
  const [configLibrary, setConfigLibrary] = useState({});
  const inflationRate = settings.defaultInflationRate / 100;

  useEffect(() => {
    if (!portfolio && portfolios.length > 0) {
      navigate('/');
    }
  }, [navigate, portfolio, portfolios.length]);

  useEffect(() => {
    let alive = true;

    async function loadConfigs() {
      const entries = await Promise.all(
        Object.entries(PORTFOLIO_TYPE_TO_PAGE).map(async ([type, pageKey]) => {
          if (!user || !token) {
            return [type, listLocalConfigs(pageKey)];
          }

          try {
            const response = await fetch(`/api/configs/${pageKey}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await parseApiResponse(response, `Could not load ${pageKey} configs.`);
            return [type, data?.configs || []];
          } catch {
            return [type, listLocalConfigs(pageKey)];
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
        : { totalNetWorth: 0, monthlyPayments: 0, monthlyWithdrawals: 0 },
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

  if (!portfolio) return null;

  const currentCalendarYear = new Date().getFullYear() + portfolio.timelineYear - 1;

  return (
    <div className="page portfolio-page">
      <div className="ph home-hero">
        <button type="button" className="calc-mobile-back portfolio-back-link" onClick={() => navigate('/')}>
          <span className="material-symbols-rounded">arrow_back</span>
          Back to portfolios
        </button>
        <h1>{portfolio.name}</h1>
        <p>Choose saved calculator configurations for each asset or liability row and project net worth through the selected timeline year.</p>
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
                onChange={(event) => updatePortfolio({ ...portfolio, name: event.target.value })}
              />
            </label>
            <div className="portfolio-toggle-group">
              <button
                type="button"
                className={`portfolio-toggle ${portfolio.inflationAdjusted ? '' : 'active'}`}
                onClick={() => updatePortfolio({ ...portfolio, inflationAdjusted: false })}
              >
                Non-Inflation Adjusted
              </button>
              <button
                type="button"
                className={`portfolio-toggle ${portfolio.inflationAdjusted ? 'active' : ''}`}
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
                        <td>
                          <select
                            className="calc-input"
                            value={item.type}
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
                            onChange={(nextItem) =>
                              updatePortfolio({
                                ...portfolio,
                                items: portfolio.items.map((entry) => (entry.id === item.id ? nextItem : entry)),
                              })
                            }
                          />
                        </td>
                        <td>
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
        </section>

        <aside className="portfolio-summary-panel">
          <div className="card portfolio-summary-card">
            <div className="slbl">Summary Panel</div>
            <div className="portfolio-worth-value">{formatINR(Math.round(snapshot.totalNetWorth))}</div>
            <div className="portfolio-worth-label">Total Net Worth</div>

            <div className="portfolio-stats-grid">
              <div className="portfolio-stat">
                <span>Monthly Payments</span>
                <strong>{formatINR(Math.round(snapshot.monthlyPayments))}</strong>
              </div>
              <div className="portfolio-stat">
                <span>Monthly Withdrawals</span>
                <strong>{formatINR(Math.round(snapshot.monthlyWithdrawals || 0))}</strong>
              </div>
              <div className="portfolio-stat">
                <span>Current Year</span>
                <strong>{currentCalendarYear}</strong>
              </div>
              <div className="portfolio-stat">
                <span>Default Inflation</span>
                <strong>{settings.defaultInflationRate}%</strong>
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
