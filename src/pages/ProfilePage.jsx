import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function ProfilePage() {
  const { settings, setDefaultInflationRate } = useSettings();

  return (
    <div className="page settings-page">
      <div className="ph">
        <h1>Profile Settings</h1>
        <p>Manage app-wide planning defaults. The inflation baseline starts at 6% and is used across calculators and portfolio projections.</p>
      </div>

      <div className="settings-grid">
        <section className="card settings-card">
          <div className="slbl">Global Defaults</div>
          <label className="settings-label" htmlFor="defaultInflationRate">
            Default Inflation Rate (%)
          </label>
          <input
            id="defaultInflationRate"
            type="number"
            min="0"
            max="25"
            step="0.1"
            className="calc-input"
            value={settings.defaultInflationRate}
            onChange={(event) => setDefaultInflationRate(Number(event.target.value) || 0)}
          />
          <p className="settings-note">This value becomes the baseline everywhere inflation is used unless you manually override the field on a page.</p>
        </section>

        <section className="card settings-card">
          <div className="slbl">Custom Inflation</div>
          <p className="settings-note">Build a weighted inflation blend by expense category and promote it to the global default when you are ready.</p>
          <Link to="/custom-inflation" className="mini-btn primary settings-link-btn">
            Open custom inflation calculator
          </Link>
        </section>
      </div>
    </div>
  );
}
