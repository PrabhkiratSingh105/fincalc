import React, { createContext, useContext, useMemo, useState } from 'react';

const AIContext = createContext(null);

const emptyContext = {
  calculator: null,
  calculatorResults: null,
  portfolio: null,
  goals: null,
  savedPlans: null,
  userProfile: null,
  conversation: null,
};

export function AIProvider({ children }) {
  const [context, setContext] = useState(emptyContext);

  const value = useMemo(() => ({
    context,
    setContext,
    prepareContext: (nextContext) => setContext((current) => ({ ...current, ...nextContext })),
    clearContext: () => setContext(emptyContext),
  }), [context]);

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAIContext() {
  const value = useContext(AIContext);
  if (!value) throw new Error('useAIContext must be used inside AIProvider');
  return value;
}
