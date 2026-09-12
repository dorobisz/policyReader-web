import {
  Batch,
  BatchResultsResponse,
  BatchStatusResponse,
  BatchUploadResponse,
  StatsMetrics,
} from '../types/api';

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
  async getDashboardMetrics(): Promise<StatsMetrics> {
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
  }): Promise<{ batches: Batch[]; total: number }> {
    const { status, page = 1, limit = 4, search = '' } = params || {};
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
    };
  },

  /**
   * Pobiera listę logów przetwarzania plików w danej paczce
   */
  async getBatchLogs(batchId: string, isCompleted = false): Promise<import('../types/api').BatchProcessingLogItem[]> {
    return [
      {
        id: `log-1-${batchId}`,
        filename: 'Acme_Corp_General_Liability_2023.pdf',
        document_type: 'General Liability',
        file_size: '2.4 MB',
        status: isCompleted ? 'success' : 'pending',
        ocr_used: false,
      },
      {
        id: `log-2-${batchId}`,
        filename: 'Stark_Ind_Workers_Comp_Q3.pdf',
        document_type: 'Workers Comp',
        file_size: '1.1 MB',
        status: 'failed',
        error_message: 'OCR Failure: Unreadable text block detected on page 3. Requires manual review.',
        ocr_used: true,
      },
      {
        id: `log-3-${batchId}`,
        filename: 'Wayne_Ent_Cyber_Risk_Ren.pdf',
        document_type: 'Cyber Liability',
        file_size: '845 KB',
        status: 'success',
        ocr_used: true,
      },
      {
        id: `log-4-${batchId}`,
        filename: 'Globex_Property_Master.pdf',
        document_type: 'Commercial Property',
        file_size: '5.6 MB',
        status: 'success',
        ocr_used: false,
      },
    ];
  },

  /**
   * Pobiera wyekstrahowane rekordy polis dla paczki (GET /jobs/{batch_id}/results)
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

    // Bogate dane demonstracyjne odwzorowujące makietę result/code.html
    return {
      batch_id: batchId,
      tenant_id: tenantId,
      status: 'completed',
      total_files: 145,
      processed_files: 143,
      failed_files: 2,
      records: [
        {
          id: `rec-1-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'Zurich_Liability_2023_Q4.pdf',
          towarzystwo: 'Zurich North America',
          kwota_skladki: '124500.00',
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
          towarzystwo: 'Chubb Group',
          kwota_skladki: '89250.50',
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
          filename: 'AIG_Umbrella_Draft_v2.docx',
          towarzystwo: 'AIG',
          kwota_skladki: null,
          status: 'failed',
          ocr_used: true,
          czas_procesu_sek: 4.7,
          error_message: 'Extraction failed: unable to parse premium amount from scanned document.',
          created_at: '2023-10-24T14:30:00',
        },
        {
          id: `rec-4-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'Travelers_Auto_Fleet_List.pdf',
          towarzystwo: 'Travelers',
          kwota_skladki: '15700.00',
          status: 'success',
          ocr_used: false,
          czas_procesu_sek: 0.7,
          error_message: null,
          created_at: '2023-10-24T14:28:00',
        },
        {
          id: `rec-5-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'Zurich_WC_Addendum.pdf',
          towarzystwo: 'Zurich North America',
          kwota_skladki: '4200.00',
          status: 'success',
          ocr_used: false,
          czas_procesu_sek: 0.5,
          error_message: null,
          created_at: '2023-10-24T14:25:00',
        },
        {
          id: `rec-6-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'Hartford_GL_Policy_2023.pdf',
          towarzystwo: 'The Hartford',
          kwota_skladki: '52300.00',
          status: 'success',
          ocr_used: false,
          czas_procesu_sek: 1.1,
          error_message: null,
          created_at: '2023-10-24T14:22:00',
        },
        {
          id: `rec-7-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'Liberty_Mutual_BOP_Q4.pdf',
          towarzystwo: 'Liberty Mutual',
          kwota_skladki: '31800.00',
          status: 'success',
          ocr_used: true,
          czas_procesu_sek: 2.3,
          error_message: null,
          created_at: '2023-10-24T14:18:00',
        },
        {
          id: `rec-8-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'AIG_Directors_Officers.pdf',
          towarzystwo: 'AIG',
          kwota_skladki: null,
          status: 'failed',
          ocr_used: true,
          czas_procesu_sek: 5.9,
          error_message: 'OCR confidence too low: document quality insufficient for automated extraction.',
          created_at: '2023-10-24T14:15:00',
        },
        {
          id: `rec-9-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'Nationwide_Property_Bundle.pdf',
          towarzystwo: 'Nationwide',
          kwota_skladki: '18500.00',
          status: 'success',
          ocr_used: false,
          czas_procesu_sek: 0.8,
          error_message: null,
          created_at: '2023-10-24T14:10:00',
        },
        {
          id: `rec-10-${batchId}`,
          batch_id: batchId,
          tenant_id: tenantId,
          filename: 'Chubb_Cyber_Risk_2024.pdf',
          towarzystwo: 'Chubb Group',
          kwota_skladki: '275000.00',
          status: 'success',
          ocr_used: false,
          czas_procesu_sek: 1.4,
          error_message: null,
          created_at: '2023-10-24T14:05:00',
        },
      ],
    };
  },

  /**
   * Pobiera plik CSV z wynikami paczki (GET /jobs/{batch_id}/export/csv)
   * i uruchamia pobieranie w przeglądarce.
   */
  async downloadBatchCsv(batchId: string, tenantId = 'default', records?: import('../types/api').PolicyRecordResponse[]): Promise<void> {
    // Próba pobrania z prawdziwego API
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${batchId}/export/csv`, {
        headers: { 'X-Tenant-ID': tenantId },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch_${batchId}_results.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback — generowanie CSV po stronie klienta
    }

    // Fallback: generowanie CSV z przekazanych lub demonstracyjnych danych
    const data = records ?? (await apiService.getBatchResults(batchId, tenantId)).records;
    const BOM = '\uFEFF';
    const header = 'nazwa_pliku;towarzystwo;kwota_skladki;status_przetwarzania;ocr_used;czas_procesu_sek;error_message';
    const rows = data.map((r) => [
      r.filename ?? '',
      r.towarzystwo ?? '',
      r.kwota_skladki ?? '',
      r.status ?? '',
      r.ocr_used ? 'TAK' : 'NIE',
      r.czas_procesu_sek != null ? String(r.czas_procesu_sek).replace('.', ',') : '',
      r.error_message ?? '',
    ].join(';'));

    const csvContent = BOM + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_${batchId}_results.csv`;
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
      }
    } catch (err) {
      console.warn('API upload error, using local fallback:', err);
    }

    // Fallback generowania paczki lokalnie
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
};
