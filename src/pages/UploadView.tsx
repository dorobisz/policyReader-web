import React, { useState, useRef, useMemo, DragEvent, ChangeEvent } from 'react';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { UploadSelectedFile } from '../types/api';
import { APP_CONFIG } from '../config/appConfig';

/**
 * Formatuje rozmiar pliku w bajtach na czytelną dla człowieka jednostkę (B, KB, MB)
 */
function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const UploadView: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const [selectedFiles, setSelectedFiles] = useState<UploadSelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stan wyszukiwarki i paginacji
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(APP_CONFIG.defaultPageSize);

  /**
   * Waliduje i dodaje pliki do listy wybranych z uwzględnieniem limitu paczki (200)
   */
  const handleAddFiles = (filesList: FileList | File[]) => {
    setErrorMessage(null);
    const incoming = Array.from(filesList);
    const validFiles: UploadSelectedFile[] = [];
    const errors: string[] = [];

    const currentCount = selectedFiles.length;
    const availableSlots = APP_CONFIG.maxFilesPerBatch - currentCount;

    if (availableSlots <= 0) {
      const msg = `Osiągnięto maksymalny limit ${APP_CONFIG.maxFilesPerBatch} plików w paczce. Aby dodać nowe, usuń część wybranych plików.`;
      setErrorMessage(msg);
      toast.warning('Osiągnięto limit paczki', msg);
      return;
    }

    incoming.forEach((file) => {
      // Walidacja rozszerzenia / typu MIME (tylko PDF)
      const isPdf =
        file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

      if (!isPdf) {
        errors.push(`Plik "${file.name}" został pominięty — akceptowane są wyłącznie pliki PDF.`);
        return;
      }

      // Walidacja rozmiaru pliku
      if (file.size > APP_CONFIG.maxFileSizeBytes) {
        errors.push(
          `Plik "${file.name}" przekracza maksymalny dopuszczalny rozmiar ${formatBytes(APP_CONFIG.maxFileSizeBytes)}.`,
        );
        return;
      }

      // Zapobieganie dublowaniu plików o tej samej nazwie i rozmiarze
      const isDuplicate = selectedFiles.some(
        (existing) => existing.name === file.name && existing.sizeBytes === file.size,
      );

      if (!isDuplicate) {
        validFiles.push({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          file,
          name: file.name,
          sizeBytes: file.size,
          sizeFormatted: formatBytes(file.size),
        });
      }
    });

    if (errors.length > 0) {
      setErrorMessage(errors.join(' '));
    }

    if (validFiles.length > 0) {
      if (validFiles.length > availableSlots) {
        const accepted = validFiles.slice(0, availableSlots);
        const excessCount = validFiles.length - availableSlots;
        setSelectedFiles((prev) => [...prev, ...accepted]);
        const warningMsg = `Dodano ${accepted.length} plików. Pominięto ${excessCount} plików z powodu limitu paczki (${APP_CONFIG.maxFilesPerBatch}).`;
        toast.warning('Osiągnięto limit paczki', warningMsg);
      } else {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    }
  };

  // Obsługa zdarzeń Drag & Drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setErrorMessage(null);
    setSearchQuery('');
    setCurrentPage(1);
  };

  /**
   * Obsługa przycisku Start Processing:
   * Wysyła pliki przez apiService.uploadPolicies, odbiera batch_id i przekierowuje do /jobs/{batch_id}
   */
  const handleStartProcessing = async () => {
    if (selectedFiles.length === 0 || isUploading) return;

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const filesToSend = selectedFiles.map((f) => f.file);
      const response = await apiService.uploadPolicies(filesToSend);

      if (response && response.batch_id) {
        toast.success(
          'Upload successful!',
          `Processing ${selectedFiles.length} file(s) — Batch #${response.batch_id}`,
        );
        navigate(`/jobs/${response.batch_id}`);
      } else {
        throw new Error('Nie otrzymano identyfikatora paczki (batch_id) z serwera.');
      }
    } catch (err: unknown) {
      console.error('Błąd podczas uploadu polis:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'Wystąpił nieoczekiwany błąd podczas przesyłania plików.';
      toast.error('Upload failed', msg);
      setErrorMessage(msg);
      setIsUploading(false);
    }
  };

  // Łączny rozmiar w bajtach
  const totalBytes = useMemo(() => {
    return selectedFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
  }, [selectedFiles]);

  // Filtrowanie plików po nazwie
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return selectedFiles;
    const q = searchQuery.toLowerCase().trim();
    return selectedFiles.filter((f) => f.name.toLowerCase().includes(q));
  }, [selectedFiles, searchQuery]);

  // Paginacja
  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedFiles = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, safeCurrentPage, pageSize]);

  // Procent zapełnienia limitu paczki
  const capacityPercentage = Math.min(
    100,
    Math.round((selectedFiles.length / APP_CONFIG.maxFilesPerBatch) * 100),
  );
  const isAtCapacity = selectedFiles.length >= APP_CONFIG.maxFilesPerBatch;

  return (
    <div className="p-xl flex-1 flex flex-col max-w-5xl mx-auto w-full">
      {/* Nagłówek strony */}
      <div className="mb-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface mb-xs">
            Document Upload
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Upload policy documents for automated OCR extraction and processing.
          </p>
        </div>

        {/* Wskaźnik pojemności paczki w nagłówku */}
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md flex items-center gap-md self-start sm:self-auto min-w-[220px]">
          <div className="flex-1">
            <div className="flex justify-between text-label-sm font-label-sm text-on-surface-variant mb-1">
              <span>Batch Capacity</span>
              <span className={`font-semibold ${isAtCapacity ? 'text-error' : 'text-on-surface'}`}>
                {selectedFiles.length} / {APP_CONFIG.maxFilesPerBatch}
              </span>
            </div>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isAtCapacity
                    ? 'bg-error'
                    : capacityPercentage > 85
                    ? 'bg-amber-500'
                    : 'bg-secondary'
                }`}
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
          </div>
          <span
            className={`material-symbols-outlined text-[24px] ${
              isAtCapacity ? 'text-error' : 'text-on-surface-variant'
            }`}
          >
            {isAtCapacity ? 'error' : 'folder_zip'}
          </span>
        </div>
      </div>

      {/* Komunikat błędu / ostrzeżenia walidacji */}
      {errorMessage && (
        <div
          className="mb-md p-md bg-error-container text-on-error-container rounded-xl flex items-center justify-between border border-error/20"
          role="alert"
        >
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-error">error</span>
            <p className="font-body-sm text-body-sm font-medium">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded hover:bg-black/5 text-on-error-container cursor-pointer"
            aria-label="Zamknij powiadomienie"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Karta główna formularza */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm flex flex-col gap-lg">
        {/* Strefa Drag and Drop */}
        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!isAtCapacity) {
              fileInputRef.current?.click();
            } else {
              toast.warning(
                'Limit paczki osiągnięty',
                `Maksymalna pojemność paczki to ${APP_CONFIG.maxFilesPerBatch} plików.`,
              );
            }
          }}
          className={`relative w-full h-56 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all group ${
            isAtCapacity
              ? 'border-outline-variant bg-surface-container-low/50 cursor-not-allowed opacity-80'
              : isDragging
              ? 'border-secondary bg-surface-container-high ring-2 ring-secondary/20 cursor-pointer'
              : 'border-outline-variant bg-surface hover:border-secondary hover:bg-surface-container-low cursor-pointer'
          }`}
          role="button"
          tabIndex={isAtCapacity ? -1 : 0}
          onKeyDown={(e) => {
            if (!isAtCapacity && (e.key === 'Enter' || e.key === ' ')) {
              fileInputRef.current?.click();
            }
          }}
          aria-label="Kliknij lub przeciągnij pliki PDF tutaj"
        >
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            multiple
            disabled={isAtCapacity}
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
            tabIndex={-1}
          />

          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center mb-sm transition-colors ${
              isAtCapacity
                ? 'bg-surface-container text-on-surface-variant'
                : isDragging
                ? 'bg-secondary text-on-secondary'
                : 'bg-surface-container text-secondary group-hover:bg-secondary-container group-hover:text-on-secondary-container'
            }`}
          >
            <span
              className="material-symbols-outlined text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isAtCapacity ? 'lock' : 'cloud_upload'}
            </span>
          </div>

          <p className="font-headline-sm text-headline-sm text-on-surface mb-xs text-center">
            {isAtCapacity
              ? 'Maksymalny limit 200 plików został osiągnięty'
              : 'Drag & drop files here'}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-sm text-center">
            {isAtCapacity ? (
              <span>Usuń część plików z poniższej listy, aby móc dodać inne dokumenty.</span>
            ) : (
              <>
                or{' '}
                <span className="text-secondary font-medium underline decoration-secondary decoration-1 underline-offset-2">
                  browse files
                </span>{' '}
                from your computer
              </>
            )}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-xs font-label-md text-label-md text-on-surface-variant bg-surface-variant px-sm py-xs rounded">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>
              Format: PDF only • Max: {formatBytes(APP_CONFIG.maxFileSizeBytes)} / file • Max {APP_CONFIG.maxFilesPerBatch} files / batch
            </span>
          </div>
        </div>

        {/* Sekcja wybranych plików z przyciskiem Start NAD listą */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-col gap-md pt-xs">
            {/* PASEK AKCJI NAD LISTĄ DOKUMENTÓW (Zawsze widoczny u góry bez przewijania) */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-md flex flex-col md:flex-row md:items-center md:justify-between gap-md shadow-sm">
              <div className="flex items-center gap-md flex-wrap">
                <div>
                  <h3 className="font-label-bold text-label-bold text-on-surface flex items-center gap-xs">
                    <span>Selected Files</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                      {selectedFiles.length} / {APP_CONFIG.maxFilesPerBatch}
                    </span>
                  </h3>
                  <p className="text-label-md text-on-surface-variant">
                    Total size: <strong>{formatBytes(totalBytes)}</strong>
                  </p>
                </div>
              </div>

              {/* Przyciski akcji: Clear all & Start Processing */}
              <div className="flex items-center gap-sm self-end md:self-auto">
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={isUploading}
                  className="text-on-surface-variant hover:text-error hover:bg-surface-container px-md py-sm rounded-lg text-label-md font-label-md transition-colors flex items-center gap-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Usuń wszystkie pliki z kolejki"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                  <span>Clear all</span>
                </button>

                <button
                  type="button"
                  onClick={handleStartProcessing}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="bg-primary text-on-primary font-label-bold text-label-bold px-lg py-sm rounded-lg flex items-center gap-sm hover:opacity-90 transition-opacity h-10 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <span>Starting...</span>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        sync
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Start Processing ({selectedFiles.length})</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Narzędzia listy: Wyszukiwarka i Wybór rozmiaru strony */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search in selected files..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-1.5 text-body-sm bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                    aria-label="Wyczyść wyszukiwanie"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-sm text-body-sm text-on-surface-variant">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-surface border border-outline-variant rounded-lg px-2 py-1 text-body-sm focus:outline-none focus:border-secondary cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* Lista dokumentów (Paginowana) */}
            {filteredFiles.length === 0 ? (
              <div className="p-xl text-center border border-outline-variant rounded-lg bg-surface-bright text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl mb-xs">search_off</span>
                <p className="font-body-md">Nie znaleziono plików pasujących do &quot;{searchQuery}&quot;.</p>
              </div>
            ) : (
              <ul className="space-y-xs">
                {pagedFiles.map((fileItem, idx) => {
                  const globalIndex = (safeCurrentPage - 1) * pageSize + idx + 1;
                  return (
                    <li
                      key={fileItem.id}
                      className="flex items-center justify-between p-sm border border-outline-variant rounded-lg bg-surface-bright hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex items-center gap-md min-w-0 pr-sm">
                        <span className="text-label-sm font-mono text-on-surface-variant w-8 shrink-0">
                          #{globalIndex}
                        </span>
                        <span className="material-symbols-outlined text-error shrink-0">
                          picture_as_pdf
                        </span>
                        <div className="min-w-0">
                          <p
                            className="font-body-sm text-body-sm text-on-surface font-medium truncate"
                            title={fileItem.name}
                          >
                            {fileItem.name}
                          </p>
                          <p className="font-label-md text-label-md text-on-surface-variant">
                            {fileItem.sizeFormatted}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(fileItem.id);
                        }}
                        disabled={isUploading}
                        className="text-on-surface-variant hover:text-error transition-colors p-xs rounded-full hover:bg-surface-container shrink-0 cursor-pointer disabled:opacity-50"
                        title="Usuń plik z listy"
                        aria-label={`Usuń plik ${fileItem.name}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Kontrolki paginacji */}
            {filteredFiles.length > 0 && (
              <div className="pt-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm border-t border-outline-variant">
                <div className="text-body-sm text-on-surface-variant">
                  Showing{' '}
                  <strong className="text-on-surface">
                    {(safeCurrentPage - 1) * pageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-on-surface">
                    {Math.min(safeCurrentPage * pageSize, filteredFiles.length)}
                  </strong>{' '}
                  of <strong className="text-on-surface">{filteredFiles.length}</strong> files
                  {searchQuery && ` (filtered from ${selectedFiles.length})`}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-xs">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(1)}
                      disabled={safeCurrentPage === 1}
                      className="p-1 rounded border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Pierwsza strona"
                      aria-label="Pierwsza strona"
                    >
                      <span className="material-symbols-outlined text-[18px]">first_page</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safeCurrentPage === 1}
                      className="p-1 rounded border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Poprzednia strona"
                      aria-label="Poprzednia strona"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>

                    <span className="px-sm text-label-md font-label-md text-on-surface">
                      Page {safeCurrentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className="p-1 rounded border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Następna strona"
                      aria-label="Następna strona"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={safeCurrentPage === totalPages}
                      className="p-1 rounded border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      title="Ostatnia strona"
                      aria-label="Ostatnia strona"
                    >
                      <span className="material-symbols-outlined text-[18px]">last_page</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadView;
