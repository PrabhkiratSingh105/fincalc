import React from 'react';
import { usePrepareAIChat } from '../../hooks/ai/usePrepareAIChat';
import { useFeatureFlags } from '../../context/FeatureFlagsContext';

export default function DiscussWithAIButton({ calculator, results, className = '' }) {
  const prepareChat = usePrepareAIChat();
  const { aiFeatures } = useFeatureFlags();
  if (!aiFeatures) return null;

  return (
    <button
      type="button"
      className={`discuss-ai-button ${className}`}
      onClick={() => prepareChat('calculator', { calculator, calculatorResults: results })}
    >
      <span className="material-symbols-rounded">auto_awesome</span>
      Discuss with AI
    </button>
  );
}
