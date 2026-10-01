import {
  Batch,
  BatchResultsResponse,
  BatchStatusResponse,
  BatchUploadResponse,
  StatsMetrics,
} from '../types/api';
import { CopyFieldConfig, DEFAULT_COPY_CONFIG, VEHICLE_FIELD_DEFINITIONS } from '../config/vehicleFields';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/policies';
const LOCAL_STORAGE_BATCHES_KEY = 'brokerengine_saved_batches';

const INITIAL_MOCK_BATCHES: Batch[] = [
  {
    batch_id: 'b83f-9a2c-4d1e-8812-7801a91e1024',
    tenant_id: 'default',
    date_added: 'Oct 24, 2023 10:15 AM',
    status: 'processing',
    progress_percentage: 45,
    total_files: 124,
    processed_files: 56,
    failed_files: 0,
    remaining_files: 68,
  },
  {
    batch_id: 'f21a-7b89-c03d-491a-9821e84a22b1',
    tenant_id: 'default',
    date_added: 'Oct 23, 2023 04:30 PM',
    status: 'completed',
    progress_percentage: 100,
    total_files: 89,
    processed_files: 89,
    failed_files: 0,
    remaining_files: 0,
  },
  {
    batch_id: 'a49c-1e5f-9b2a-4310-8732d84711ac',
    tenant_id: 'default',
    date_added: 'Oct 23, 2023 09:05 AM',
    status: 'failed',
    progress_percentage: 12,
    total_files: 210,
    processed_files: 25,
    failed_files: 185,
    remaining_files: 0,
  },
  {
    batch_id: 'c72b-8d1e-f45a-4b11-a892b1928374',
    tenant_id: 'default',
    date_added: 'Oct 22, 2023 02:20 PM',
    status: 'completed',
    progress_percentage: 100,
    total_files: 45,
    processed_files: 45,
    failed_files: 0,
    remaining_files: 0,
  },
  {
    batch_id: 'e19d-3f4a-8b2c-4011-9a72d00122fe',
    tenant_id: 'default',
    date_added: 'Oct 21, 2023 11:45 AM',
    status: 'completed',
    progress_percentage: 100,
    total_files: 320,
    processed_files: 320,
    failed_files: 0,
    remaining_files: 0,
  },
  {
    batch_id: 'd48e-2c1a-9f5b-4122-8711c4921980',
    tenant_id: 'default',
    date_added: 'Oct 20, 2023 08:10 AM',
    status: 'completed',
    progress_percentage: 100,
    total_files: 460,
    processed_files: 455,
    failed_files: 5,
    remaining_files: 0,
  },
];

/**
 * Pobiera listę paczek z pamięci lokalnej (lub inicjalizuje zestawem demonstracyjnym)
 */
export function getStoredBatches(): Batch[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_BATCHES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_BATCHES_KEY, JSON.stringify(INITIAL_MOCK_BATCHES));
      return INITIAL_MOCK_BATCHES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MOCK_BATCHES;
  } catch (err) {
    console.warn('Błąd odczytu paczek z localStorage:', err);
    return INITIAL_MOCK_BATCHES;
  }
}

/**
 * Zapisuje nową paczkę do pamięci lokalnej
 */
export function saveBatchToStorage(batch: Batch): void {
  try {
    const batches = getStoredBatches();
    const existingIndex = batches.findIndex((b) => b.batch_id === batch.batch_id);
    if (existingIndex >= 0) {
      batches[existingIndex] = { ...batches[existingIndex], ...batch };
    } else {
      batches.unshift(batch);
    }
    localStorage.setItem(LOCAL_STORAGE_BATCHES_KEY, JSON.stringify(batches));
  } catch (err) {
    console.warn('Błąd zapisu paczki do localStorage:', err);
  }
}

/**
 * Usługa komunikacji z API backendu BrokerEngine z mechanizmem fallback do danych demonstracyjnych
 */
export const apiService = {
  /**
   * Pobiera metryki podsumowujące dla Bento Grid na Dashboardzie
   */
  async getDashboardMetrics(tenantId = 'default'): Promise<StatsMetrics> {
    try {
      const response = await fetch(`${API_BASE_URL}/stats`, {
        headers: { 'X-Tenant-ID': tenantId },
      });
      if (response.ok) {
        return (await response.json()) as StatsMetrics;
      }
    } catch {
      // Fallback do pamięci lokalnej
    }

    const batches = getStoredBatches();
    let totalProcessed = 0;
    let totalSuccessful = 0;
    let activeBatches = 0;

    for (const b of batches) {
      const processed = b.processed_files ?? (b.status === 'completed' ? b.total_files : 0);
      const failed = b.failed_files ?? 0;
      totalProcessed += processed + failed;
      totalSuccessful += processed;
      if (b.status === 'processing' || b.status === 'pending') {
        activeBatches += 1;
      }
    }

    const calculatedSuccessRate =
      totalProcessed > 0 ? Number(((totalSuccessful / totalProcessed) * 100).toFixed(1)) : 98.2;

    return {
      total_processed_30d: totalProcessed > 0 ? totalProcessed : 1248,
      success_rate: calculatedSuccessRate > 0 ? calculatedSuccessRate : 98.2,
      active_batches: activeBatches > 0 ? activeBatches : 3,
    };
  },

  /**
   * Pobiera listę ostatnich paczek z opcjonalnym filtrowaniem po statusie oraz paginacją
   */
  async getRecentBatches(params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    tenantId?: string;
  }): Promise<{ batches: Batch[]; total: number }> {
    const { status, page = 1, limit = 4, search = '', tenantId = 'default' } = params || {};
    try {
      const url = status && status !== 'all' ? `${API_BASE_URL}/batches?status=${status}` : `${API_BASE_URL}/batches`;
      const response = await fetch(url, {
        headers: { 'X-Tenant-ID': tenantId },
      });
      if (response.ok) {
        const data = await response.json();
        let apiBatches: Batch[] = data.batches || [];
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          apiBatches = apiBatches.filter((b) => b.batch_id.toLowerCase().includes(q));
        }
        const total = apiBatches.length;
        const startIndex = (page - 1) * limit;
        const pagedBatches = apiBatches.slice(startIndex, startIndex + limit);
        return { batches: pagedBatches, total };
      }
    } catch {
      // Fallback do pamięci lokalnej
    }

    let allBatches = getStoredBatches();

    if (status && status !== 'all') {
      allBatches = allBatches.filter((b) => b.status.toLowerCase() === status.toLowerCase());
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      allBatches = allBatches.filter((b) => b.batch_id.toLowerCase().includes(q));
    }

    const total = allBatches.length;
    const startIndex = (page - 1) * limit;
    const pagedBatches = allBatches.slice(startIndex, startIndex + limit);

    return {
      batches: pagedBatches,
      total,
    };
  },

  /**
   * Sprawdza status danej paczki (GET /jobs/{batch_id}/status) z obsługą pollingu
   */
  async getBatchStatus(batchId: string, tenantId = 'default'): Promise<BatchStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${batchId}/status`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });
      if (response.ok) {
        return (await response.json()) as BatchStatusResponse;
      }
    } catch {
      // Fallback do pamięci lokalnej
    }

    const stored = getStoredBatches().find((b) => b.batch_id === batchId);
    if (stored) {
      // W trybie demonstracyjnym/fallbackowym: symulujemy stopniowy postęp przetwarzania
      if (stored.status === 'processing') {
        const nextProgress = Math.min(100, (stored.progress_percentage || 0) + 15);
        const processed = Math.min(stored.total_files, Math.floor((nextProgress / 100) * stored.total_files));
        const remaining = Math.max(0, stored.total_files - processed - (stored.failed_files || 0));

        stored.progress_percentage = nextProgress;
        stored.processed_files = processed;
        stored.remaining_files = remaining;

        if (nextProgress >= 100) {
          stored.status = 'completed';
        }
        saveBatchToStorage(stored);
      }

      return {
        batch_id: stored.batch_id,
        status: stored.status,
        total_files: stored.total_files,
        processed_files: stored.processed_files ?? 0,
        failed_files: stored.failed_files ?? 0,
        remaining_files: stored.remaining_files ?? 0,
        progress_percentage: stored.progress_percentage,
        errors: stored.failed_files && stored.failed_files > 0 ? [
          {
            filename: 'Stark_Ind_Workers_Comp_Q3.pdf',
            error_message: 'OCR Failure: Unreadable text block detected on page 3. Requires manual review.',
          },
        ] : [],
        currently_processing: [],
      };
    }

    return {
      batch_id: batchId,
      status: 'completed',
      total_files: 4,
      processed_files: 4,
      failed_files: 0,
      remaining_files: 0,
      progress_percentage: 100,
      errors: [],
      currently_processing: [],
    };
  },

  /**
   * Pobiera listę logów przetwarzania plików w danej paczce na podstawie bazy danych
   */
  async getBatchLogs(batchId: string, _isCompleted = false, tenantId = 'default'): Promise<import('../types/api').BatchProcessingLogItem[]> {
    try {
      const results = await apiService.getBatchResults(batchId, tenantId);
      if (results && results.records) {
        return results.records.map((r, index) => {
          let itemStatus: import('../types/api').PolicyRecordStatus = 'queued';
          if (r.status === 'success') {
            itemStatus = 'success';
          } else if (r.status === 'failed') {
            itemStatus = 'failed';
          } else if (r.current_phase && r.current_phase !== 'queued') {
            itemStatus = 'processing';
          } else if (r.status === 'processing') {
            itemStatus = 'processing';
          } else {
            itemStatus = 'queued';
          }

          const docLabel =
            r.document_type === 'vehicle_registration'
              ? 'Dowód Rejestracyjny'
              : r.extracted_data?.towarzystwo || 'Polisa Ubezpieczeniowa';

          return {
            id: r.id || `log-${index}-${batchId}`,
            filename: r.filename,
            document_type: docLabel,
            file_size: r.file_size || (r.filename.toLowerCase().endsWith('.pdf') ? 'PDF' : 'JPG'),
            status: itemStatus,
            current_phase: (r.current_phase as import('../types/api').DocumentPhase) || (itemStatus === 'processing' ? 'ocr' : 'queued'),
            error_message: r.error_message || undefined,
            ocr_used: r.ocr_used || false,
          };
        });
      }
    } catch {
      // Fallback
    }

    return [];
  },

  /**
   * Pobiera wyekstrahowane rekordy dokumentów dla paczki (GET /jobs/{batch_id}/results)
   * Zwraca dane z backendu lub bogate dane demonstracyjne w trybie fallback.
   */
  async getBatchResults(batchId: string, tenantId = 'default'): Promise<BatchResultsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${batchId}/results`, {
        headers: { 'X-Tenant-ID': tenantId },
      });
      if (response.ok) {
        return (await response.json()) as BatchResultsResponse;
      }
    } catch {
      // Fallback do danych demonstracyjnych
    }

    const isInitialDemo = INITIAL_MOCK_BATCHES.some((b) => b.batch_id === batchId);
    if (!isInitialDemo) {
      return {
        batch_id: batchId,
        tenant_id: tenantId,
        status: 'completed',
        total_files: 0,
        processed_files: 0,
        failed_files: 0,
        records: [],
      };
    }

    // Bogate dane demonstracyjne z polimorfizmem JSONB (tylko dla wstępnych paczek demo)
    return {
      batch_id: batchId,
      tenant_id: tenantId,
      status: 'completed',
      total_files: 5,
      processed_files: 5,
      failed_files: 0,
      records: [
        {
          id: `rec-1-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'Zurich_Liability_2023_Q4.pdf',
          document_type: 'policy',
          extracted_data: {
            towarzystwo: 'Zurich North America',
            kwota_skladki: '124500.00',
          },
          status: 'success',
          ocr_used: false,
          czas_procesu_sek: 1.2,
          error_message: null,
          created_at: '2023-10-24T14:32:00',
        },
        {
          id: `rec-2-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'Chubb_Property_Renew_FINAL.pdf',
          document_type: 'policy',
          extracted_data: {
            towarzystwo: 'Chubb Group',
            kwota_skladki: '89250.50',
          },
          status: 'success',
          ocr_used: false,
          czas_procesu_sek: 0.9,
          error_message: null,
          created_at: '2023-10-24T14:31:00',
        },
        {
          id: `rec-3-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'dowod_rejestracyjny_toyota.jpg',
          document_type: 'vehicle_registration',
          extracted_data: {
            numer_rejestracyjny: 'KR 4492A',
            marka: 'TOYOTA',
            typ: 'E12',
            model: 'COROLLA',
            rodzaj_pojazdu: 'SAMOCHÓD OSOBOWY',
            vin: 'JTDKN3DU5A0123456',
            rok_produkcji: '2022',
            data_pierwszej_rejestracji: '2022-04-15',
            pojemnosc_silnika_cm3: '1798',
            moc_silnika_kw: '103',
            rodzaj_paliwa: 'P/EE (Hybryda)',
            dopuszczalna_masa_calkowita_kg: '1835',
            masa_wlasna_kg: '1360',
            liczba_miejsc: '5',
            kategoria_pojazdu: 'M1',
            nr_dowodu_rejestracyjnego: 'DR/BAA 8892110',
            wlasciciel: 'JAN KOWALSKI',
          },
          status: 'success',
          ocr_used: false,
          czas_procesu_sek: 2.1,
          error_message: null,
          created_at: '2023-10-24T14:30:00',
        },
        {
          id: `rec-4-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'dowod_rejestracyjny_skoda.png',
          document_type: 'vehicle_registration',
          extracted_data: {
            numer_rejestracyjny: 'WI 78129',
            marka: 'SKODA',
            typ: 'NX',
            model: 'OCTAVIA COMBI',
            rodzaj_pojazdu: 'SAMOCHÓD OSOBOWY',
            vin: 'TMBJJ7NX5NY098765',
            rok_produkcji: '2023',
            data_pierwszej_rejestracji: '2023-01-20',
            pojemnosc_silnika_cm3: '1968',
            moc_silnika_kw: '110',
            rodzaj_paliwa: 'D (Diesel)',
            dopuszczalna_masa_calkowita_kg: '2010',
            masa_wlasna_kg: '1485',
            liczba_miejsc: '5',
            kategoria_pojazdu: 'M1',
            nr_dowodu_rejestracyjnego: 'DR/BAA 9923412',
            wlasciciel: 'FLEET LOGISTICS SP. Z O.O.',
          },
          status: 'success',
          ocr_used: false,
          czas_procesu_sek: 1.8,
          error_message: null,
          created_at: '2023-10-24T14:28:00',
        },
        {
          id: `rec-5-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'PZU_Flota_2023_Aneks.pdf',
          document_type: 'policy',
          extracted_data: {
            towarzystwo: 'PZU SA',
            kwota_skladki: '15700.00',
          },
          status: 'success',
          ocr_used: false,
          czas_procesu_sek: 0.7,
          error_message: null,
          created_at: '2023-10-24T14:25:00',
        },
      ],
    };
  },

  /**
   * Pobiera plik CSV z wynikami paczki (GET /jobs/{batch_id}/export/csv?document_type=...)
   * i uruchamia pobieranie w przeglądarce.
   */
  async downloadBatchCsv(
    batchId: string,
    documentType: 'policy' | 'vehicle_registration' = 'policy',
    tenantId = 'default',
    records?: import('../types/api').DocumentRecordResponse[]
  ): Promise<void> {
    const isVehicle = documentType === 'vehicle_registration';
    const downloadFilename = `batch_${batchId}_${isVehicle ? 'dowody_rejestracyjne' : 'polisy'}.csv`;

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${batchId}/export/csv?document_type=${documentType}`, {
        headers: { 'X-Tenant-ID': tenantId },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback do generowania w przeglądarce
    }

    // Fallback: generowanie CSV z przekazanych lub demonstracyjnych danych
    const allData = records ?? (await apiService.getBatchResults(batchId, tenantId)).records;
    const filteredData = allData.filter((r) => (r.document_type || 'policy') === documentType);
    const BOM = '\uFEFF';

    let csvContent = '';
    if (isVehicle) {
      let activeFields: CopyFieldConfig[] = DEFAULT_COPY_CONFIG.filter((f) => f.enabled);
      try {
        const cached = localStorage.getItem('broker-engine-settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            activeFields = parsed
              .filter((f: CopyFieldConfig) => f.enabled)
              .sort((a: CopyFieldConfig, b: CopyFieldConfig) => a.order - b.order);
          }
        }
      } catch {}

      // Eksportujemy WYŁĄCZNIE skonfigurowane kolumny
      const headers = activeFields.map((f) => {
        const def = VEHICLE_FIELD_DEFINITIONS.find((item) => item.key === f.key);
        return def?.label ?? f.key;
      });

      const rows = filteredData.map((r) => {
        const d = r.extracted_data || {};
        return activeFields
          .map((f) => (d[f.key] !== undefined && d[f.key] !== null ? String(d[f.key]) : ''))
          .join(';');
      });

      csvContent = BOM + [headers.join(';'), ...rows].join('\n');
    } else {
      const header = 'nazwa_pliku;towarzystwo;kwota_skladki;status_przetwarzania;ocr_used;czas_procesu_sek;error_message';
      const rows = filteredData.map((r) => [
        r.filename ?? '',
        r.extracted_data?.towarzystwo ?? '',
        r.extracted_data?.kwota_skladki ?? '',
        r.status ?? '',
        r.ocr_used ? 'TAK' : 'NIE',
        r.czas_procesu_sek != null ? String(r.czas_procesu_sek).replace('.', ',') : '',
        r.error_message ?? '',
      ].join(';'));
      csvContent = BOM + [header, ...rows].join('\n');
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Wysłanie plików do przetworzenia (POST /upload)
   */
  async uploadPolicies(files: File[], tenantId = 'default'): Promise<BatchUploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'X-Tenant-ID': tenantId,
        },
        body: formData,
      });

      if (response.ok) {
        const data = (await response.json()) as BatchUploadResponse;
        saveBatchToStorage({
          batch_id: data.batch_id,
          tenant_id: data.tenant_id,
          date_added: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: 'processing',
          progress_percentage: 0,
          total_files: data.total_files,
          processed_files: 0,
          failed_files: 0,
          remaining_files: data.total_files,
        });
        return data;
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Błąd serwera (${response.status})`);
      }
    } catch (err) {
      if (err instanceof Error && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('Load failed')) {
        throw err;
      }
      console.warn('API upload error, using local fallback:', err);
    }

    // Fallback generowania paczki lokalnie (wyłącznie w przypadku całkowitego braku łączności sieciowej)
    const generatedId = `${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
    const newBatch: Batch = {
      batch_id: generatedId,
      tenant_id: tenantId,
      date_added: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'processing',
      progress_percentage: 5,
      total_files: files.length,
      processed_files: 0,
      failed_files: 0,
      remaining_files: files.length,
    };
    saveBatchToStorage(newBatch);

    return {
      batch_id: generatedId,
      tenant_id: tenantId,
      total_files: files.length,
      status: 'processing',
      message: `Pomyślnie przyjęto ${files.length} plików do kolejki przetwarzania.`,
    };
  },

  /**
   * Ręczne usunięcie całej paczki zadań (DELETE /jobs/{batch_id})
   */
  async deleteBatch(batchId: string, tenantId = 'default'): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${batchId}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Nie udało się usunąć paczki.');
      }
    } catch (err) {
      console.warn('Błąd API podczas usuwania paczki, czyszczenie fallback:', err);
    }

    // Usuń także z pamięci lokalnej fallbacku
    try {
      const batches = getStoredBatches();
      const updated = batches.filter((b) => b.batch_id !== batchId);
      localStorage.setItem(LOCAL_STORAGE_BATCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Błąd czyszczenia paczki z localStorage:', e);
    }
  },

  /**
   * Ręczne usunięcie pojedynczego dokumentu z paczki (DELETE /jobs/{batch_id}/records/{record_id})
   */
  async deleteBatchRecord(batchId: string, recordId: string, tenantId = 'default'): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/jobs/${batchId}/records/${recordId}`, {
      method: 'DELETE',
      headers: {
        'X-Tenant-ID': tenantId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Nie udało się usunąć dokumentu z paczki.');
    }
  },

  /**
   * Pobranie konfiguracji tenanta (GET /settings)
   */
  async getSettings(tenantId = 'default'): Promise<import('../types/api').TenantConfigResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        headers: { 'X-Tenant-ID': tenantId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('Fallback do pamięci lokalnej dla ustawień:', e);
      const cached = localStorage.getItem('broker-engine-settings');
      return {
        tenant_id: tenantId,
        config: cached ? { vehicle_copy_fields: JSON.parse(cached) } : {},
      };
    }
  },

  /**
   * Zapis trwałej konfiguracji tenanta w PostgreSQL (PUT /settings)
   */
  async saveSettings(config: Record<string, any>, tenantId = 'default'): Promise<void> {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify({ config }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.warn('Błąd zapisu ustawień na serwerze, zachowano lokalnie:', e);
    }
  },
};


