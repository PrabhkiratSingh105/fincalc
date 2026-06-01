import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  createPublicConfigLink,
  encodeShareState,
  fetchPublicConfig,
  readShareState,
} from '../utils/share';
import { downloadPdfReport } from '../utils/pdfExport';

export function useCalculatorPage(calcId, defaults, calculateFn) {
  const { shareToken } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputs, setInputs] = useState(defaults);
  const [shareMsg, setShareMsg] = useState('');
  const [publicShareMsg, setPublicShareMsg] = useState('');

  useEffect(() => {
    const shared = readShareState(searchParams);
    if (shared) setInputs((prev) => ({ ...prev, ...shared }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!shareToken) return;

    let alive = true;
    setPublicShareMsg('Loading shared configuration...');

    fetchPublicConfig(calcId, shareToken)
      .then((shared) => {
        if (!alive) return;
        setInputs((prev) => ({ ...prev, ...(shared.config || {}) }));
        setPublicShareMsg('Shared configuration loaded.');
        setTimeout(() => alive && setPublicShareMsg(''), 3000);
      })
      .catch((err) => {
        if (!alive) return;
        setPublicShareMsg(err.message || 'Shared configuration could not be loaded.');
      });

    return () => {
      alive = false;
    };
  }, [calcId, shareToken]);

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

  const handlePublicShare = async (title = calcId) => {
    try {
      setPublicShareMsg('Creating public link...');
      const data = await createPublicConfigLink({
        page: calcId,
        title,
        config: inputs,
      });
      const url = data.url || `${window.location.origin}/${calcId}/${data.token}`;
      await navigator.clipboard.writeText(url);
      setShareMsg('');
      setPublicShareMsg('Public link copied to clipboard!');
      setTimeout(() => setPublicShareMsg(''), 3000);
    } catch (err) {
      setShareMsg('');
      setPublicShareMsg(err.message || 'Could not create public link.');
    }
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
    publicShareMsg,
    handlePublicShare,
    handlePdf,
  };
}
