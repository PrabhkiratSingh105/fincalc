import React, { lazy, Suspense, useMemo, useState } from 'react';
import SavedConfigsPanel from '../SavedConfigsPanel';
import { useCalculatorPage } from '../../hooks/useCalculatorPage';
import { formatIndianNumberInput, toNumber } from '../../utils/format';
import { useSettings } from '../../context/SettingsContext';

const ChartPanel = lazy(() => import('./ChartPanel'));

function getRangeFillStyle(field, value) {
  const min = Number(field.min ?? 0);
  const max = Number(field.max);
  const numericValue = Number(value);

  if (!Number.isFinite(max) || max <= min || !Number.isFinite(numericValue)) {
    return { '--range-fill': '0%' };
  }

  const pct = Math.min(100, Math.max(0, ((numericValue - min) / (max - min)) * 100));
  return { '--range-fill': `${pct}%` };
}

function InputField({ field, value, onChange, suffix, onInfoButtonClick }) {
  const [showTip, setShowTip] = useState(false);
  const currencyLabelPattern = /(₹|amount|corpus|principal|lumpsum|sip|deposit|withdrawal|income|emi|savings|80c|hra|interest)/i;
  const isCurrency =
    field.currency ||
    suffix === '₹' ||
    (currencyLabelPattern.test(field.label || '') && !/%|rate|yield|ratio|period|years|timeline|tenure|age/i.test(field.label || ''));

  // Determine max value for range slider (especially for percentage fields)
  const getRangeMax = () => {
    // If field specifies a rangeMax, use that
    if (field.rangeMax !== undefined) return field.rangeMax;
    // Otherwise use the regular max
    return field.max;
  };

  return (
    <div className="calc-input-group">
      <div className="calc-input-label-row">
        <label className="calc-label" htmlFor={field.key}>
          {field.label}
        </label>
        {field.hasInfoButton && (
          <button
            type="button"
            className="calc-info-btn"
            onClick={() => onInfoButtonClick?.(field.key)}
            aria-label={`Learn more about ${field.label}`}
          >
            <span className="material-symbols-rounded">help</span>
          </button>
        )}
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
      ) : field.type === 'toggle' ? (
        <label className="calc-toggle">
          <input
            id={field.key}
            type="checkbox"
            checked={value === true || value === 'true'}
            onChange={(e) => onChange(field.key, e.target.checked)}
          />
          <span className="calc-toggle-slider"></span>
        </label>
      ) : (
        <>
          <div className={`calc-input-wrapper ${suffix ? 'has-suffix' : ''}`}>
            <input
              id={field.key}
              type={isCurrency ? 'text' : field.type || 'number'}
              inputMode={isCurrency ? 'decimal' : undefined}
              className="calc-input"
              value={isCurrency ? formatIndianNumberInput(value) : value}
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              onWheel={(e) => e.currentTarget.blur()}
              onChange={(e) =>
                onChange(
                  field.key,
                  isCurrency
                    ? toNumber(e.target.value)
                    : field.type === 'number'
                      ? Number(e.target.value)
                      : e.target.value
                )
              }
            />
            {suffix && <span className="calc-input-suffix">{suffix}</span>}
          </div>
          {field.showRange !== false && field.type !== 'select' && field.max != null && (
            <input
              type="range"
              min={field.min ?? 0}
              max={getRangeMax()}
              step={field.step ?? 1}
              value={value}
              style={getRangeFillStyle(field, value)}
              onChange={(e) => onChange(field.key, Number(e.target.value))}
              className="calc-range-input"
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
  onInfoButtonClick,
}) {
  const { settings } = useSettings();
  const [mobileScreen, setMobileScreen] = useState('input');
  const [openSections, setOpenSections] = useState({});
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const [resultInflationMode, setResultInflationMode] = useState('on');
  const hasInflationField = fields.some((field) => field.key === 'inflation');

  const resolvedDefaults = useMemo(() => {
    const next = { ...defaults };
    if (Object.prototype.hasOwnProperty.call(next, 'inflation')) {
      next.inflation = settings.defaultInflationRate;
    }
    return next;
  }, [defaults, settings.defaultInflationRate]);

  const {
    inputs,
    setField,
    setInputs,
    results,
  } = useCalculatorPage(
    id,
    resolvedDefaults,
    useMemo(
      () => (rawInputs) => {
        const adjustedInputs = hasInflationField
          ? {
              ...rawInputs,
              inflation: resultInflationMode === 'on' ? rawInputs.inflation : 0,
            }
          : rawInputs;
        return calculate(adjustedInputs);
      },
      [calculate, hasInflationField, resultInflationMode]
    )
  );

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  React.useEffect(() => {
    if (!isMobile) {
      setMobileScreen('input');
    }
  }, [isMobile]);

  const getConfig = () => inputs;
  const applyConfig = (config) => setInputs({ ...resolvedDefaults, ...config });

  const isVisible = (field) => !field.showWhen || field.showWhen(inputs);

  const getSuffix = (field) => {
    if (!field.suffix) return null;
    return typeof field.suffix === 'function' ? field.suffix(inputs) : field.suffix;
  };

  const renderFields = (keys) =>
    keys.map((key) => {
      const field = fields.find((f) => f.key === key);
      if (!field || !isVisible(field)) return null;
      return (
        <InputField key={key} field={field} value={inputs[field.key]} onChange={setField} suffix={getSuffix(field)} onInfoButtonClick={onInfoButtonClick} />
      );
    });

  const renderInputSections = () =>
    inputSections
      ? inputSections
          .filter((section) =>
            section.fields.some((key) => {
              const field = fields.find((f) => f.key === key);
              return field && isVisible(field);
            })
          )
          .map((section) => {
            const collapsible = Boolean(section.collapsible);
            const open = openSections[section.title] ?? !section.defaultCollapsed;

            return (
              <div className="calc-input-section" key={section.title}>
                <div className="calc-section-header">
                  <div className="slbl">{section.title}</div>
                  {collapsible && (
                    <button
                      type="button"
                      className="calc-advanced-toggle"
                      onClick={() =>
                        setOpenSections((prev) => ({
                          ...prev,
                          [section.title]: !open,
                        }))
                      }
                    >
                      Advanced
                      <span className="material-symbols-rounded">{open ? 'expand_less' : 'expand_more'}</span>
                    </button>
                  )}
                </div>
                {(!collapsible || open) && <div className="calc-input-section-grid">{renderFields(section.fields)}</div>}
                {section.divider && <div className="div" />}
              </div>
            );
          })
      : fields.filter(isVisible).map((field) => (
          <InputField
            key={field.key}
            field={field}
            value={inputs[field.key]}
            onChange={setField}
            suffix={getSuffix(field)}
            onInfoButtonClick={onInfoButtonClick}
          />
        ));

  const renderResults = () =>
    results && (
      <>
        <div className="card calc-summary-card">
          <div className="calc-summary-head-row">
            <div className="slbl">Results Summary</div>
            {hasInflationField && (
              <div className="portfolio-toggle-group calc-result-toggle-group">
                <button
                  type="button"
                  className={`portfolio-toggle ${resultInflationMode === 'off' ? 'active' : ''}`}
                  onClick={() => setResultInflationMode('off')}
                >
                  Non-Inflation Adjusted
                </button>
                <button
                  type="button"
                  className={`portfolio-toggle ${resultInflationMode === 'on' ? 'active' : ''}`}
                  onClick={() => setResultInflationMode('on')}
                >
                  Inflation Adjusted
                </button>
              </div>
            )}
          </div>
          <div className="calc-summary-grid">
            {results.summary.map((item, i) => (
              <div
                className={`calc-summary-item ${i === 0 ? 'is-featured' : ''} tone-${item.tone || 'default'}`}
                key={i}
              >
                <div className="calc-summary-main">
                  <div className="calc-summary-label">{item.label}</div>
                  <div className="calc-summary-value">{item.value}</div>
                </div>
                {item.sub && <div className="calc-summary-sub">{item.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {results.charts?.length > 0 && (
          <div className="calc-charts-grid">
            {results.charts.map((chart, i) => (
              <div className="card" key={i}>
                <Suspense fallback={null}>
                  <ChartPanel chart={chart} />
                </Suspense>
              </div>
            ))}
          </div>
        )}

        {!isMobile &&
          [results.yearlyTable, results.depletionTable, ...(results.yearlyTables || [])]
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

        {!isMobile && (
          <>
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
      </>
    );

  const renderSavedConfigs = () => (
    <div className="calc-action-row">
      <SavedConfigsPanel
        storageKey={id}
        pageLabel={title}
        getConfig={getConfig}
        applyConfig={applyConfig}
        results={results}
      />
    </div>
  );

  return (
    <div className="page calc-page">
      <div className="ph">
        <h1>{title}</h1>
        <p>{description}</p>
        {!isMobile && renderSavedConfigs()}
      </div>

      <div className="calc-body">
        {(!isMobile || mobileScreen === 'input') && (
          <aside className="card calc-inputs-panel">
            {renderInputSections()}
            {isMobile && (
              <>
                <button type="button" className="mini-btn primary calc-mobile-cta" onClick={() => setMobileScreen('output')}>
                  Continue
                </button>
                {renderSavedConfigs()}
              </>
            )}
          </aside>
        )}

        {(!isMobile || mobileScreen === 'output') && (
          <main className="calc-results-panel">
            {isMobile && (
              <button type="button" className="calc-mobile-back" onClick={() => setMobileScreen('input')}>
                <span className="material-symbols-rounded">arrow_back</span>
                Back
              </button>
            )}
            {renderResults()}
          </main>
        )}
      </div>
    </div>
  );
}
