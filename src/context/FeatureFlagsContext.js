import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const FeatureFlagsContext = createContext({ aiFeatures: false });

export function FeatureFlagsProvider({ children }) {
  // Default to disabled so AI controls never flash before the server responds.
  const [aiFeatures, setAIFeatures] = useState(false);

  useEffect(() => {
    let active = true;

    fetch('/api/config')
      .then((response) => (response.ok ? response.json() : null))
      .then((config) => {
        if (active) setAIFeatures(config?.AI_features === true);
      })
      .catch(() => {
        // A failed configuration request intentionally keeps AI unavailable.
      });

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ aiFeatures }), [aiFeatures]);
  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
