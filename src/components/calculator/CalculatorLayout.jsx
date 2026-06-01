import React, { useState } from 'react';
import SavedConfigsPanel from '../SavedConfigsPanel';
import ChartPanel from './ChartPanel';
import { useCalculatorPage } from '../../hooks/useCalculatorPage';

function InputField({ field, value, onChange }) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="calc-input-group">
      <div className="calc-input-label-row">
        <label className="calc-label" htmlFor={field.key}>
          {field.label}
        </label>
        {field.tooltip && (
          <button
            type="button"
            className="calc-tooltip-btn"
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
            onFocus={() => setShowTip(true)}
            onBlur={() => setShowTip(false)}
            aria-label={`Info about ${field.label}`}
          >
            <span className="material-symbols-rounded">info</span>
            {showTip && <span className="calc-tooltip">{field.tooltip}</span>}
          </button>
        )}
      </div>
      {field.type === 'select' ? (
        <select
          id={field.key}
          className="calc-input"
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            const opt = field.options.find((o) => String(o.value) === raw);
            onChange(field.key, typeof opt?.value === 'number' ? Number(raw) : raw);
          }}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <>
          <input
            id={field.key}
            type={field.type || 'number'}
            className="calc-input"
            value={value}
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            onChange={(e) =>
              onChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)
            }
          />
          {field.showRange !== false && field.type !== 'select' && field.max != null && (
            <input
              type="range"
              min={field.min ?? 0}
              max={field.max}
              step={field.step ?? 1}
              value={value}
              onChange={(e) => onChange(field.key, Number(e.target.value))}
            />
          )}
        </>
      )}
    </div>
  );
}

function InsightsBlock({ insights }) {
  if (!insights) return null;
  const sections = [
    { key: 'takeaways', title: 'Key Takeaways', icon: 'lightbulb' },
    { key: 'mistakes', title: 'Common Mistakes', icon: 'warning' },
    { key: 'tips', title: 'Expert Tips', icon: 'tips_and_updates' },
    { key: 'faqs', title: 'FAQs', icon: 'help' },
  ];

  return (
    <div className="calc-insights">
      <h3 className="calc-section-title">Advanced Insights</h3>
      <div className="calc-insights-grid">
        {sections.map(
          ({ key, title, icon }) =>
            insights[key]?.length > 0 && (
              <div className="calc-insight-card" key={key}>
                <div className="calc-insight-head">
                  <span className="material-symbols-rounded">{icon}</span>
                  {title}
                </div>
                <ul>
                  {insights[key].map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )
        )}
        {insights.formula && (
          <div className="calc-insight-card full">
            <div className="calc-insight-head">
              <span className="material-symbols-rounded">functions</span>
              Formula
            </div>
            <code className="calc-formula">{insights.formula}</code>
          </div>
        )}
        {insights.example && (
          <div className="calc-insight-card full">
            <div className="calc-insight-head">
              <span className="material-symbols-rounded">school</span>
              Real-Life Example
            </div>
            <p>{insights.example}</p>
          </div>
        )}
        {insights.inflation && (
          <div className="calc-insight-card">
            <div className="calc-insight-head">
              <span className="material-symbols-rounded">trending_down</span>
              Inflation Impact
            </div>
            <p>{insights.inflation}</p>
          </div>
        )}
        {insights.tax && (
          <div className="calc-insight-card">
            <div className="calc-insight-head">
              <span className="material-symbols-rounded">receipt_long</span>
              Tax Impact
            </div>
            <p>{insights.tax}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalculatorLayout({
  id,
  title,
  description,
  fields,
  defaults,
  calculate,
  inputSections,
}) {
  const {
    inputs,
    setField,
    setInputs,
    results,
    shareMsg,
    handleShare,
    handlePdf,
  } = useCalculatorPage(id, defaults, calculate);

  const getConfig = () => inputs;
  const applyConfig = (config) => setInputs({ ...defaults, ...config });

  const isVisible = (field) => !field.showWhen || field.showWhen(inputs);

  const renderFields = (keys) =>
    keys.map((key) => {
      const field = fields.find((f) => f.key === key);
      if (!field || !isVisible(field)) return null;
      return (
        <InputField key={key} field={field} value={inputs[field.key]} onChange={setField} />
      );
    });

  return (
    <div className="page calc-page">
      <div className="ph">
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="calc-action-row">
          <SavedConfigsPanel
            storageKey={id}
            pageLabel={title}
            getConfig={getConfig}
            applyConfig={applyConfig}
          />
          <button type="button" className="mini-btn" onClick={handleShare}>
            <span className="material-symbols-rounded">share</span>
            Share
          </button>
          <button type="button" className="mini-btn" onClick={handlePdf}>
            <span className="material-symbols-rounded">download</span>
            PDF Report
          </button>
          {shareMsg && <span className="calc-share-msg">{shareMsg}</span>}
        </div>
      </div>

      <div className="calc-body">
        <aside className="card calc-inputs-panel">
          {inputSections
            ? inputSections
                .filter((section) =>
                  section.fields.some((key) => {
                    const field = fields.find((f) => f.key === key);
                    return field && isVisible(field);
                  })
                )
                .map((section) => (
                <div className="calc-input-section" key={section.title}>
                  <div className="slbl">{section.title}</div>
                  <div className="calc-input-section-grid">{renderFields(section.fields)}</div>
                  {section.divider && <div className="div" />}
                </div>
              ))
            : fields.filter(isVisible).map((field) => (
                <InputField
                  key={field.key}
                  field={field}
                  value={inputs[field.key]}
                  onChange={setField}
                />
              ))}
        </aside>

        <main className="calc-results-panel">
          {results && (
            <>
              <div className="card calc-summary-card">
                <div className="slbl">Results Summary</div>
                <div className="calc-summary-grid">
                  {results.summary.map((item, i) => (
                    <div className={`calc-summary-item tone-${item.tone || 'default'}`} key={i}>
                      <div className="calc-summary-label">{item.label}</div>
                      <div className="calc-summary-value">{item.value}</div>
                      {item.sub && <div className="calc-summary-sub">{item.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {results.charts?.length > 0 && (
                <div className="calc-charts-grid">
                  {results.charts.map((chart, i) => (
                    <div className="card" key={i}>
                      <ChartPanel chart={chart} />
                    </div>
                  ))}
                </div>
              )}

              {[results.yearlyTable, results.depletionTable, ...(results.yearlyTables || [])]
                .filter(Boolean)
                .map((table, ti) => (
                <div className="card calc-table-card" key={ti}>
                  <div className="slbl">{table.title || 'Year-by-Year Breakdown'}</div>
                  <div className="calc-table-wrap">
                    <table className="calc-table">
                      <thead>
                        <tr>
                          {table.columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, ri) => (
                          <tr key={ri}>
                            {row.map((cell, ci) => (
                              <td key={ci}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div className="calc-detail-grid">
                {results.steps?.length > 0 && (
                  <div className="card calc-detail-card">
                    <div className="slbl">Step-by-Step Calculation</div>
                    <ol className="calc-steps">
                      {results.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {results.assumptions?.length > 0 && (
                  <div className="card calc-detail-card">
                    <div className="slbl">Assumptions</div>
                    <ul className="calc-assumptions">
                      {results.assumptions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="card">
                <InsightsBlock insights={results.insights} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
