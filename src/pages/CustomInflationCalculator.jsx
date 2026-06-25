import React from 'react';
import { useSettings } from '../context/SettingsContext';

function createEmptyRow() {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `row_${Date.now()}`,
    percentage: 0,
    rate: 6,
  };
}

export default function CustomInflationCalculator() {
  const { settings, updateSettings, setDefaultInflationRate } = useSettings();
  const rows = settings.customInflationRows;
  const totalPercentage = rows.reduce((sum, row) => sum + Number(row.percentage || 0), 0);
  const weightedAverage = totalPercentage > 0
    ? rows.reduce((sum, row) => sum + (Number(row.percentage || 0) * Number(row.rate || 0)), 0) / totalPercentage
    : 0;
  const isValid = Math.abs(totalPercentage - 100) < 0.001;

  const updateRows = (nextRows) => {
    updateSettings((prev) => ({
      ...prev,
      customInflationRows: nextRows,
    }));
  };

  return (
    <div className="page settings-page">
      <div className="ph">
        <h1>Custom Inflation Calculator</h1>
        <p>Model a weighted inflation rate by category. The category percentages must total 100% before you can promote the weighted average to the app-wide default.</p>
      </div>

      <div className="inflation-builder-layout">
        <section className="card inflation-builder-card">
          <div className="slbl">Category Mix</div>
          <div className="inflation-builder-table-wrap">
            <table className="calc-table">
              <thead>
                <tr>
                  <th>Expense Category Percentage</th>
                  <th>Category Inflation Rate (%)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        className="calc-input"
                        value={row.percentage}
                        onChange={(event) =>
                          updateRows(
                            rows.map((entry) =>
                              entry.id === row.id
                                ? { ...entry, percentage: Number(event.target.value) || 0 }
                                : entry
                            )
                          )
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="25"
                        step="0.1"
                        className="calc-input"
                        value={row.rate}
                        onChange={(event) =>
                          updateRows(
                            rows.map((entry) =>
                              entry.id === row.id
                                ? { ...entry, rate: Number(event.target.value) || 0 }
                                : entry
                            )
                          )
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="saved-config-action danger"
                        onClick={() => updateRows(rows.filter((entry) => entry.id !== row.id))}
                        disabled={rows.length === 1}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="inflation-builder-actions">
            <button type="button" className="mini-btn" onClick={() => updateRows([...rows, createEmptyRow()])}>
              + New Row
            </button>
          </div>
        </section>

        <aside className="card inflation-summary-card">
          <div className="slbl">Live Result</div>
          <div className="inflation-weighted-value">{weightedAverage.toFixed(2)}%</div>
          <div className={`inflation-total-chip ${isValid ? 'valid' : 'invalid'}`}>
            Total allocation: {totalPercentage.toFixed(1)}%
          </div>
          <p className="settings-note">
            {isValid
              ? 'Your weighted inflation profile is valid and ready to become the new global default.'
              : 'Adjust the category percentages until they total exactly 100%.'}
          </p>
          <button
            type="button"
            className="mini-btn primary settings-link-btn"
            disabled={!isValid}
            onClick={() => setDefaultInflationRate(Number(weightedAverage.toFixed(2)))}
          >
            Set as Default
          </button>
        </aside>
      </div>
    </div>
  );
}
