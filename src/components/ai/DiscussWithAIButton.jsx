import React from 'react';
import { usePrepareAIChat } from '../../hooks/ai/usePrepareAIChat';

export default function DiscussWithAIButton({ calculator, results, className = '' }) {
  const prepareChat = usePrepareAIChat();
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
