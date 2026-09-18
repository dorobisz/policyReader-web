/**
 * Definicje typów TypeScript (DTO i modele UI) dla aplikacji BrokerEngine.
 * Odpowiadają modelom backendu FastAPI (src/api/schemas.py) oraz wymaganiom makiet ekranów.
 */

// ============================================================================
// 1. TYPY STATUSÓW I ENUMY
// ============================================================================

/**
 * Status paczki przetwarzania dokumentów w systemie.
 */
export type BatchStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Status przetwarzania pojedynczego dokumentu / rekordu polisy.
 */
export type PolicyRecordStatus = 'pending' | 'success' | 'failed';

/**
 * Poziom pewności ekstrakcji danych (Confidence Score) prezentowany w widoku wyników.
 */
export type ConfidenceLevel = 'HIGH CONF.' | 'REVIEW' | 'LOW';

// ============================================================================
// 2. DTO ODPOWIEDZI Z BACKENDU FASTAPI (src/api/schemas.py)
// ============================================================================

/**
 * Odpowiedź endpointu POST /upload po przyjęciu plików do kolejki.
 */
export interface BatchUploadResponse {
  batch_id: string;
  tenant_id: string;
  total_files: number;
  status: BatchStatus | string;
  message: string;
}

/**
 * Szczegóły błędu przetwarzania pojedynczego pliku polisy.
 */
export interface BatchErrorDetail {
  filename: string;
  error_message: string;
}

export type DocumentPhase = 'queued' | 'ocr' | 'llm_inference' | 'parsing' | 'success' | 'failed';

export interface DocumentPhaseInfo {
  record_id: string;
  filename: string;
  current_phase: DocumentPhase;
  progress_message: string | null;
  ocr_duration_ms: number | null;
  llm_duration_ms: number | null;
  retry_count: number;
}

/**
 * Odpowiedź endpointu GET /jobs/{batch_id}/status (monitoring postępu paczki).
 */
export interface BatchStatusResponse {
  batch_id: string;
  status: BatchStatus;
  total_files: number;
  processed_files: number;
  failed_files: number;
  remaining_files: number;
  progress_percentage: number;
  errors: BatchErrorDetail[];
  started_at?: string | null;
  completed_at?: string | null;
  elapsed_seconds?: number | null;
  estimated_remaining_seconds?: number | null;
  avg_document_duration_ms?: number | null;
  currently_processing?: DocumentPhaseInfo[];
}

/**
 * Odpowiedź zawierająca wyekstrahowane dane pojedynczej polisy.
 */
export interface PolicyRecordResponse {
  id: string;
  batch_id: string;
  tenant_id: string;
  filename: string;
  towarzystwo: string | null;
  kwota_skladki: string | null;
  status: PolicyRecordStatus | string;
  ocr_used: boolean;
  czas_procesu_sek: number | null;
  error_message: string | null;
  file_size?: string | null;
  created_at: string | null;
}

/**
 * Odpowiedź endpointu GET /jobs/{batch_id}/results z kompletem sparsowanych polis.
 */
export interface BatchResultsResponse {
  batch_id: string;
  tenant_id: string;
  status: BatchStatus;
  total_files: number;
  processed_files: number;
  failed_files: number;
  records: PolicyRecordResponse[];
}

// ============================================================================
// 3. MODELE WIDOKÓW I STANU UI (DASHBOARD, PROCESSING, RESULTS, UPLOAD)
// ============================================================================

/**
 * Metryki podsumowujące dla Bento Grid w widoku Overview (Dashboard).
 */
export interface StatsMetrics {
  total_processed_30d: number;
  success_rate: number; // np. 98.2 (procent)
  active_batches: number;
}

/**
 * Obiekt paczki prezentowany w tabeli "Recent Batches" na Dashboardzie.
 */
export interface Batch {
  batch_id: string;
  tenant_id?: string;
  date_added: string; // sformatowana data np. 'Oct 24, 2023 10:15 AM' lub ISO string
  status: BatchStatus;
  progress_percentage: number;
  total_files: number;
  processed_files?: number;
  failed_files?: number;
  remaining_files?: number;
}

/**
 * Rozszerzony rekord polisy wykorzystywany w tabeli wyników (Batch Results).
 */
export interface PolicyRecord extends PolicyRecordResponse {
  waluta?: string; // domyślnie 'PLN' lub 'USD'
  confidence?: ConfidenceLevel;
  typ_ubezpieczenia?: string; // np. 'General Liability', 'OC Przewoźnika'
  rozmiar_pliku?: string; // np. '2.4 MB'
}

/**
 * Pojedynczy wpis w tabeli "Processing Log" na ekranie statusu paczki (/jobs/{batch_id}).
 */
export interface BatchProcessingLogItem {
  id: string;
  filename: string;
  document_type?: string;
  file_size?: string;
  status: PolicyRecordStatus;
  error_message?: string;
  ocr_used?: boolean;
}

/**
 * Plik wybrany przez użytkownika w formularzu uploadu przed wysłaniem na serwer.
 */
export interface UploadSelectedFile {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  sizeBytes: number;
}

/**
 * Opcje filtrowania tabeli wyników.
 */
export interface PolicyFilterOptions {
  searchQuery?: string;
  status?: PolicyRecordStatus | 'all';
  confidence?: ConfidenceLevel | 'all';
  towarzystwo?: string | 'all';
}

/**
 * Ogólny format błędu API przechwytywany w aplikacji.
 */
export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}
