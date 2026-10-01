/**
 * Globalna konfiguracja aplikacji BrokerEngine / PolicyReader.
 * Przygotowana pod możliwość przyszłego nadpisywania z panelu administracyjnego / API.
 */
export interface AppConfig {
  maxFilesPerBatch: number;
  maxFileSizeBytes: number;
  defaultPageSize: number;
  allowedExtensions: string[];
}

export const APP_CONFIG: AppConfig = {
  // Maksymalna liczba plików akceptowana w jednej paczce przetwarzania
  maxFilesPerBatch: 200,
  // Maksymalny rozmiar pojedynczego pliku (25 MB — zsynchronizowane z backendem MAX_FILE_SIZE_MB)
  maxFileSizeBytes: 25 * 1024 * 1024,
  // Domyślna liczba plików na stronę na liście uploadu
  defaultPageSize: 10,
  // Dozwolone rozszerzenia plików (polisy PDF oraz zdjęcia dowodów rejestracyjnych)
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
};

/**
 * Aktualizuje limity appConfig na podstawie danych z API serwera.
 * Wywoływane po pobraniu ustawień tenanta.
 */
export function syncAppConfigFromApi(serverLimits: { max_file_size_mb?: number; max_files_per_batch?: number }) {
  if (serverLimits.max_file_size_mb) {
    APP_CONFIG.maxFileSizeBytes = serverLimits.max_file_size_mb * 1024 * 1024;
  }
  if (serverLimits.max_files_per_batch) {
    APP_CONFIG.maxFilesPerBatch = serverLimits.max_files_per_batch;
  }
}
