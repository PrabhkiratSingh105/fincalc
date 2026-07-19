import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  fetchPublicConfig,
} from '../utils/share';

export function useCalculatorPage(calcId, defaults, calculateFn) {
  const { username, configName } = useParams();
  const [inputs, setInputs] = useState(defaults);
  const previousDefaultsRef = useRef(defaults);

  useEffect(() => {
    setInputs((prev) => {
      const previousDefaults = previousDefaultsRef.current || {};
      const next = { ...prev };
      let changed = false;

      Object.entries(defaults || {}).forEach(([key, value]) => {
        if (!(key in prev) || prev[key] === previousDefaults[key]) {
          if (next[key] !== value) {
            next[key] = value;
            changed = true;
          }
        }
      });

      previousDefaultsRef.current = defaults;
      return changed ? next : prev;
    });
  }, [defaults]);

  useEffect(() => {
    if (!username || !configName) return;

    let alive = true;

    fetchPublicConfig(calcId, username, configName)
      .then((shared) => {
        if (!alive) return;
        setInputs((prev) => ({ ...prev, ...(shared.config || {}) }));
      })
      .catch((err) => {
        console.error('Failed to load shared configuration:', err);
      });

    return () => {
      alive = false;
    };
  }, [calcId, username, configName]);

  const setField = useCallback((key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const results = useMemo(() => calculateFn(inputs), [inputs, calculateFn]);

  const handlePdf = async () => {
    if (results?.pdfData) {
      const { downloadPdfReport } = await import('../utils/pdfExport');
      downloadPdfReport({
        ...results.pdfData,
        steps: results.steps,
        assumptions: results.assumptions,
      });
    }
  };

  return {
    inputs,
    setField,
    setInputs,
    results,
    handlePdf,
  };
}
