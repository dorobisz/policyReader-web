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
  // Maksymalny rozmiar pojedynczego pliku (50 MB)
  maxFileSizeBytes: 50 * 1024 * 1024,
  // Domyślna liczba plików na stronę na liście uploadu
  defaultPageSize: 10,
  // Dozwolone rozszerzenia plików
  allowedExtensions: ['.pdf'],
};
