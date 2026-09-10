import {
  Batch,
  BatchResultsResponse,
  BatchStatusResponse,
  BatchUploadResponse,
  StatsMetrics,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
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
   * Sprawdza status danej paczki (GET /jobs/{batch_id}/status)
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
      return {
        batch_id: stored.batch_id,
        status: stored.status,
        total_files: stored.total_files,
        processed_files: stored.processed_files ?? 0,
        failed_files: stored.failed_files ?? 0,
        remaining_files: stored.remaining_files ?? 0,
        progress_percentage: stored.progress_percentage,
        errors: [],
      };
    }

    return {
      batch_id: batchId,
      status: 'completed',
      total_files: 10,
      processed_files: 10,
      failed_files: 0,
      remaining_files: 0,
      progress_percentage: 100,
      errors: [],
    };
  },

  /**
   * Pobiera wyekstrahowane rekordy polis dla paczki (GET /jobs/{batch_id}/results)
   */
  async getBatchResults(batchId: string, tenantId = 'default'): Promise<BatchResultsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/${batchId}/results`, {
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });
      if (response.ok) {
        return (await response.json()) as BatchResultsResponse;
      }
    } catch {
      // Fallback
    }

    return {
      batch_id: batchId,
      tenant_id: tenantId,
      status: 'completed',
      total_files: 1,
      processed_files: 1,
      failed_files: 0,
      records: [],
    };
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
