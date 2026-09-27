import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { CopyFieldConfig, DEFAULT_COPY_CONFIG, VEHICLE_FIELD_DEFINITIONS } from '../config/vehicleFields';

const CACHE_KEY = 'broker-engine-settings';
const SYNC_EVENT = 'vehicle-copy-settings-updated';

/**
 * Łączy zapisaną konfigurację z pełną listą pól dowodu rejestracyjnego.
 * Gwarantuje, że WSZYSTKIE 16 pól dowodu jest zawsze widocznych na liście,
 * nawet jeśli w bazie/cache zapisano wcześniej tylko część z nich.
 */
function mergeWithDefaultConfig(saved: CopyFieldConfig[]): CopyFieldConfig[] {
  if (!Array.isArray(saved) || saved.length === 0) return DEFAULT_COPY_CONFIG;

  const savedMap = new Map(saved.map((item) => [item.key, item]));
  const result: CopyFieldConfig[] = [];

  // 1. Dodaj pola z konfiguracji zapisanej (z zachowaniem ustalonej kolejności i stanu enabled)
  for (const item of [...saved].sort((a, b) => a.order - b.order)) {
    if (VEHICLE_FIELD_DEFINITIONS.some((def) => def.key === item.key)) {
      result.push(item);
    }
  }

  // 2. Dodaj jakiekolwiek brakujące pola z definicji na koniec
  let nextOrder = result.length;
  for (const def of VEHICLE_FIELD_DEFINITIONS) {
    if (!savedMap.has(def.key)) {
      result.push({
        key: def.key,
        enabled: true,
        order: nextOrder++,
      });
    }
  }

  return result.map((item, idx) => ({ ...item, order: idx }));
}

export function useVehicleCopySettings() {
  const [fields, setFields] = useState<CopyFieldConfig[]>(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeWithDefaultConfig(parsed);
        }
      } catch {}
    }
    return DEFAULT_COPY_CONFIG;
  });
  const [loading, setLoading] = useState(false);

  // Pobranie z bazy danych PostgreSQL
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getSettings();
      if (data?.config?.vehicle_copy_fields && Array.isArray(data.config.vehicle_copy_fields)) {
        const merged = mergeWithDefaultConfig(data.config.vehicle_copy_fields);
        setFields(merged);
        localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
      }
    } catch (e) {
      console.warn('Użyto lokalnego buforu konfiguracji:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Zapis do bazy danych PostgreSQL oraz buforu lokalnego
  const saveSettings = useCallback(async (newFields: CopyFieldConfig[]) => {
    const merged = mergeWithDefaultConfig(newFields);
    setFields(merged);
    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event(SYNC_EVENT));
    await apiService.saveSettings({ vehicle_copy_fields: merged });
  }, []);

  // Reset do domyślnych (wszystkie 16 pól)
  const resetSettings = useCallback(async () => {
    await saveSettings(DEFAULT_COPY_CONFIG);
  }, [saveSettings]);

  useEffect(() => {
    loadSettings();

    const handleSync = () => {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          setFields(mergeWithDefaultConfig(JSON.parse(cached)));
        } catch {}
      }
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    return () => window.removeEventListener(SYNC_EVENT, handleSync);
  }, [loadSettings]);

  return { fields, loading, saveSettings, resetSettings, loadSettings };
}
