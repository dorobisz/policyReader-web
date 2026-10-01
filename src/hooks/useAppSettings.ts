import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { SystemLimits } from '../types/api';
import { syncAppConfigFromApi } from '../config/appConfig';

const CACHE_KEY = 'broker-engine-app-settings';
const SYNC_EVENT = 'app-settings-updated';

export function useAppSettings() {
  const [config, setConfig] = useState<Record<string, any>>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* ignore */ }
    }
    return {};
  });
  const [systemLimits, setSystemLimits] = useState<SystemLimits | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getSettings();
      const cfg = data?.config || {};
      setConfig(cfg);
      localStorage.setItem(CACHE_KEY, JSON.stringify(cfg));
      if (data?.system_limits) {
        setSystemLimits(data.system_limits);
        syncAppConfigFromApi(data.system_limits);
      }
    } catch (e) {
      console.warn('Użyto lokalnego buforu konfiguracji:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSetting = useCallback(async (key: string, value: any) => {
    setConfig(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
    window.dispatchEvent(new Event(SYNC_EVENT));
    await apiService.saveSettings({ [key]: value });
  }, []);

  useEffect(() => {
    loadSettings();
    const handleSync = () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try { setConfig(JSON.parse(cached)); } catch { /* ignore */ }
      }
    };
    window.addEventListener(SYNC_EVENT, handleSync);
    return () => window.removeEventListener(SYNC_EVENT, handleSync);
  }, [loadSettings]);

  // Derived getters with defaults
  const retentionDbDays = typeof config.retention_db_days === 'number' ? config.retention_db_days : (systemLimits?.retention_db_days_default ?? 2);
  const pagesToScan = typeof config.pages_to_scan === 'number' ? config.pages_to_scan : (systemLimits?.pages_to_scan_default ?? 4);
  const ocrDpi = typeof config.ocr_dpi === 'number' ? config.ocr_dpi : (systemLimits?.ocr_dpi_default ?? 200);

  return {
    loading,
    config,
    systemLimits,
    retentionDbDays,
    pagesToScan,
    ocrDpi,
    saveSetting,
    loadSettings,
  };
}
