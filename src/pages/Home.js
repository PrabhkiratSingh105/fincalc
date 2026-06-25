import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { createDefaultPortfolio } from '../utils/portfolio';

export default function Home() {
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();
  const portfolios = settings.portfolios || [];

  const handleCreatePortfolio = () => {
    const nextPortfolio = createDefaultPortfolio(portfolios.length);
    updateSettings((prev) => ({
      ...prev,
      portfolios: [nextPortfolio, ...(prev.portfolios || [])],
    }));
    navigate(`/portfolio/${nextPortfolio.id}`);
  };

  return (
    <div className="page portfolio-page">
      <div className="ph home-hero">
        <h1>Portfolio Library</h1>
        <p>Create multiple portfolios, compare planning scenarios, and open any saved portfolio to manage its asset mix and long-term net-worth projection.</p>
      </div>

      <div className="portfolio-index-layout">
        <section className="card portfolio-index-card">
          <div className="portfolio-index-head">
            <div>
              <div className="slbl">Your Portfolios</div>
              <p className="settings-note">Each row opens a dedicated workspace for that portfolio.</p>
            </div>
            <button type="button" className="mini-btn primary" onClick={handleCreatePortfolio}>
              + New Portfolio
            </button>
          </div>

          <div className="portfolio-table-wrap">
            <table className="calc-table portfolio-table">
              <thead>
                <tr>
                  <th>Portfolio Name</th>
                  <th>Assets / Liabilities</th>
                  <th>Inflation Mode</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {portfolios.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="portfolio-empty-state">
                      Create your first portfolio to start tracking SIPs, loans, deposits, and withdrawals.
                    </td>
                  </tr>
                ) : (
                  portfolios.map((portfolio) => (
                    <tr
                      key={portfolio.id}
                      className="portfolio-click-row"
                      onClick={() => navigate(`/portfolio/${portfolio.id}`)}
                    >
                      <td>{portfolio.name}</td>
                      <td>{portfolio.items?.length || 0}</td>
                      <td>{portfolio.inflationAdjusted ? 'Inflation Adjusted' : 'Non-Inflation Adjusted'}</td>
                      <td>{new Date(portfolio.updatedAt || Date.now()).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
