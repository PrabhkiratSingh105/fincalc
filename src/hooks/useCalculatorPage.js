import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { encodeShareState, readShareState } from '../utils/share';
import { downloadPdfReport } from '../utils/pdfExport';

export function useCalculatorPage(calcId, defaults, calculateFn) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputs, setInputs] = useState(defaults);
  const [shareMsg, setShareMsg] = useState('');

  useEffect(() => {
    const shared = readShareState(searchParams);
    if (shared) setInputs((prev) => ({ ...prev, ...shared }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setField = useCallback((key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const results = useMemo(() => calculateFn(inputs), [inputs, calculateFn]);

  const handleShare = () => {
    const encoded = encodeShareState(inputs);
    setSearchParams({ s: encoded }, { replace: true });
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareMsg('Link copied to clipboard!');
      setTimeout(() => setShareMsg(''), 3000);
    });
  };

  const handlePdf = () => {
    if (results?.pdfData) {
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
    shareMsg,
    handleShare,
    handlePdf,
  };
}
