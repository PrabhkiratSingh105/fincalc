import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { parseApiResponse } from '../utils/api';
import { API } from "../config";

const SETTINGS_STORAGE_KEY = 'fincalc:settings';
const DEFAULT_SETTINGS = {
  defaultInflationRate: 6,
  customInflationRows: [
    { id: 'essentials', percentage: 50, rate: 6 },
    { id: 'lifestyle', percentage: 30, rate: 7 },
    { id: 'healthcare', percentage: 20, rate: 8 },
  ],
  portfolios: [],
};

const SettingsContext = createContext(null);

function createRowId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeInflationRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return DEFAULT_SETTINGS.customInflationRows;
  }

  return rows.map((row, index) => ({
    id: row?.id || createRowId() || `row_${index}`,
    percentage: Number(row?.percentage ?? 0),
    rate: Number(row?.rate ?? DEFAULT_SETTINGS.defaultInflationRate),
  }));
}

function normalizePortfolioItem(item, index) {
  const type = item?.type || 'SIP';

  return {
    id: item?.id || `asset_${index}_${Date.now()}`,
    type,
    configId: String(item?.configId || ''),
    configName: String(item?.configName || ''),
    resolvedConfig: item?.resolvedConfig && typeof item.resolvedConfig === 'object' ? item.resolvedConfig : null,
  };
}

function normalizePortfolio(portfolio, index) {
  return {
    id: String(portfolio?.id || `portfolio_${index}`),
    name: String(portfolio?.name || `Portfolio ${index + 1}`),
    inflationAdjusted: Boolean(portfolio?.inflationAdjusted),
    timelineYear: Math.min(100, Math.max(1, Number(portfolio?.timelineYear ?? 1) || 1)),
    updatedAt: portfolio?.updatedAt || new Date().toISOString(),
    items: Array.isArray(portfolio?.items) ? portfolio.items.map(normalizePortfolioItem) : [],
  };
}

function normalizeSettings(input) {
  const safe = input && typeof input === 'object' ? input : {};
  const migratedPortfolios =
    Array.isArray(safe.portfolios) && safe.portfolios.length > 0
      ? safe.portfolios.map(normalizePortfolio)
      : safe.homePortfolio
        ? [normalizePortfolio({
            id: 'portfolio_legacy',
            name: safe.homePortfolio?.portfolioName || 'Portfolio 1',
            inflationAdjusted: safe.homePortfolio?.inflationAdjusted,
            timelineYear: safe.homePortfolio?.timelineYear,
            items: safe.homePortfolio?.items,
          }, 0)]
        : DEFAULT_SETTINGS.portfolios;

  return {
    defaultInflationRate: Number(safe.defaultInflationRate ?? DEFAULT_SETTINGS.defaultInflationRate) || DEFAULT_SETTINGS.defaultInflationRate,
    customInflationRows: normalizeInflationRows(safe.customInflationRows),
    portfolios: migratedPortfolios,
  };
}

function readLocalSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return normalizeSettings(raw ? JSON.parse(raw) : DEFAULT_SETTINGS);
  } catch {
    return normalizeSettings(DEFAULT_SETTINGS);
  }
}

export function SettingsProvider({ children }) {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState(() => readLocalSettings());
  const [loading, setLoading] = useState(true);
  const [sourceReady, setSourceReady] = useState(false);
  const lastSavedRef = useRef(JSON.stringify(settings));

  useEffect(() => {
    let alive = true;

    async function loadSettings() {
      setLoading(true);

      if (!user || !token) {
        const local = readLocalSettings();
        if (!alive) return;
        setSettings(local);
        lastSavedRef.current = JSON.stringify(local);
        setSourceReady(true);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await parseApiResponse(response, 'Could not load settings.');
        const normalized = normalizeSettings(data?.settings);
        if (!alive) return;
        setSettings(normalized);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
        lastSavedRef.current = JSON.stringify(normalized);
      } catch (error) {
        console.error('Failed to load settings:', error);
        const local = readLocalSettings();
        if (!alive) return;
        setSettings(local);
        lastSavedRef.current = JSON.stringify(local);
      } finally {
        if (alive) {
          setSourceReady(true);
          setLoading(false);
        }
      }
    }

    setSourceReady(false);
    loadSettings();

    return () => {
      alive = false;
    };
  }, [user, token]);

  useEffect(() => {
    if (!sourceReady) return;

    const serialized = JSON.stringify(settings);
    if (serialized === lastSavedRef.current) return;

    const timer = setTimeout(async () => {
      localStorage.setItem(SETTINGS_STORAGE_KEY, serialized);

      if (user && token) {
        try {
          const response = await fetch(`${API}/api/settings`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ settings }),
          });
          await parseApiResponse(response, 'Could not save settings.');
        } catch (error) {
          console.error('Failed to persist settings:', error);
        }
      }

      lastSavedRef.current = serialized;
    }, 350);

    return () => clearTimeout(timer);
  }, [settings, sourceReady, token, user]);

  const value = useMemo(
    () => ({
      settings,
      loading,
      updateSettings: (updater) => {
        setSettings((prev) => {
          const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
          return normalizeSettings(next);
        });
      },
      setDefaultInflationRate: (rate) => {
        setSettings((prev) => normalizeSettings({ ...prev, defaultInflationRate: Number(rate) || DEFAULT_SETTINGS.defaultInflationRate }));
      },
    }),
    [settings, loading]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
