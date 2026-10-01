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
export type PolicyRecordStatus = 'queued' | 'pending' | 'processing' | 'success' | 'failed';

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

export type DocumentType = 'policy' | 'vehicle_registration';

/**
 * Wyekstrahowane dane z dowodu rejestracyjnego pojazdu.
 */
export interface VehicleRegistrationData {
  // 1. Seria i numer dowodu rejestracyjnego
  nr_dowodu_rejestracyjnego?: string | null;
  // 2. A – Numer rejestracyjny pojazdu
  numer_rejestracyjny?: string | null;
  // 3. B – Data pierwszej rejestracji pojazdu
  data_pierwszej_rejestracji?: string | null;
  // 4. C.1.1 – Nazwisko lub nazwa posiadacza dowodu
  wlasciciel?: string | null;
  // 5. C.1.2 – Numer PESEL lub REGON posiadacza
  c_1_2_pesel_regon?: string | null;
  // 6. C.1.3 – Adres posiadacza dowodu
  adres_wlasciciela?: string | null;
  // 7. C.2.1 – Nazwisko lub nazwa właściciela pojazdu
  c_2_1_wlasciciel?: string | null;
  // 8. C.2.2 – PESEL lub REGON właściciela pojazdu
  c_2_2_pesel_regon?: string | null;
  // 9. C.2.3 – Adres właściciela pojazdu
  c_2_3_adres?: string | null;
  // 10. D.1 – Marka pojazdu
  marka?: string | null;
  // 11. D.2 – Typ pojazdu
  typ?: string | null;
  // 12. D.3 – Model handlowy pojazdu
  model?: string | null;
  // 13. E – Numer VIN / nadwozia
  vin?: string | null;
  // 14. F.1 – Maksymalna masa całkowita pojazdu (kg)
  f_1_maksymalna_masa_kg?: string | null;
  // 15. F.2 – Dopuszczalna masa całkowita pojazdu (kg)
  dopuszczalna_masa_calkowita_kg?: string | null;
  // 16. F.3 – Dopuszczalna masa całkowita zespołu pojazdów (kg)
  f_3_dopuszczalna_masa_zespolu_kg?: string | null;
  // 17. G – Masa własna pojazdu (kg)
  masa_wlasna_kg?: string | null;
  // 18. H – Okres ważności dowodu
  h_okres_waznosci?: string | null;
  // 19. I – Data wydania dowodu
  i_data_wydania?: string | null;
  // 20. J – Kategoria pojazdu
  kategoria_pojazdu?: string | null;
  // 21. K – Numer świadectwa homologacji
  k_numer_homologacji?: string | null;
  // 22. L – Liczba osi
  l_liczba_osi?: string | null;
  // 23. O.1 – Przyczepa z hamulcem (kg)
  o_1_przyczepa_z_hamulcem_kg?: string | null;
  // 24. O.2 – Przyczepa bez hamulca (kg)
  o_2_przyczepa_bez_hamulca_kg?: string | null;
  // 25. P.1 – Pojemność silnika (cm³)
  pojemnosc_silnika_cm3?: string | null;
  // 26. P.2 – Moc silnika (kW)
  moc_silnika_kw?: string | null;
  // 27. P.3 – Rodzaj paliwa
  rodzaj_paliwa?: string | null;
  // 28. Q – Stosunek mocy do masy własnej (kW/kg)
  q_moc_do_masy?: string | null;
  // 29. S.1 – Liczba miejsc siedzących
  liczba_miejsc?: string | null;
  // 30. S.2 – Liczba miejsc stojących
  s_2_liczba_miejsc_stojacych?: string | null;
  // 31. ADNOTACJE URZĘDOWE
  adnotacje_urzedowe?: string | null;
  // 32. BADANIE TECHNICZNE
  termin_badania_technicznego?: string | null;
  // Rok produkcji
  rok_produkcji?: string | null;
  [key: string]: any;
}

/**
 * Wyekstrahowane dane z polisy ubezpieczeniowej.
 */
export interface PolicyExtractedData {
  towarzystwo?: string | null;
  kwota_skladki?: string | null;
  [key: string]: any;
}

/**
 * Odpowiedź zawierająca wyekstrahowane dane pojedynczego dokumentu (polisy lub dowodu rejestracyjnego).
 */
export interface DocumentRecordResponse {
  id: string;
  batch_id: string;
  tenant_id: string;
  filename: string;
  document_type: DocumentType;
  extracted_data: Record<string, any> | null;
  status: PolicyRecordStatus | string;
  current_phase?: DocumentPhase | string | null;
  ocr_used: boolean;
  czas_procesu_sek: number | null;
  error_message: string | null;
  file_size?: string | null;
  file_size_bytes?: number | null;
  created_at: string | null;
}

/** Alias dla wstecznej kompatybilności */
export type PolicyRecordResponse = DocumentRecordResponse;

/**
 * Odpowiedź endpointu GET /jobs/{batch_id}/results z kompletem sparsowanych dokumentów.
 */
export interface BatchResultsResponse {
  batch_id: string;
  tenant_id: string;
  status: BatchStatus;
  total_files: number;
  processed_files: number;
  failed_files: number;
  records: DocumentRecordResponse[];
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
 * Rozszerzony rekord dokumentu wykorzystywany w tabeli wyników (Batch Results).
 */
export interface PolicyRecord extends DocumentRecordResponse {
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
  current_phase?: DocumentPhase | string | null;
  error_message?: string;
  ocr_used?: boolean;
  retry_count?: number;
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

export interface SystemLimits {
  max_file_size_mb: number;
  max_files_per_batch: number;
  retention_db_days_default: number;
  ocr_dpi_default: number;
  pages_to_scan_default: number;
}

export interface TenantConfigResponse {
  tenant_id: string;
  config: Record<string, any>;
  system_limits?: SystemLimits;
}
