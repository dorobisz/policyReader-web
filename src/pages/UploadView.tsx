import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { UploadSelectedFile } from '../types/api';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

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

  const [selectedFiles, setSelectedFiles] = useState<UploadSelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Waliduje i dodaje pliki do listy wybranych
   */
  const handleAddFiles = (filesList: FileList | File[]) => {
    setErrorMessage(null);
    const incoming = Array.from(filesList);
    const validFiles: UploadSelectedFile[] = [];
    const errors: string[] = [];

    incoming.forEach((file) => {
      // Walidacja rozszerzenia / typu MIME (tylko PDF)
      const isPdf =
        file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

      if (!isPdf) {
        errors.push(`Plik "${file.name}" został pominięty — akceptowane są wyłącznie pliki PDF.`);
        return;
      }

      // Walidacja rozmiaru pliku (max 50MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`Plik "${file.name}" przekracza maksymalny dopuszczalny rozmiar 50MB.`);
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
      setSelectedFiles((prev) => [...prev, ...validFiles]);
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
    // Sprawdzamy, czy kursor faktycznie opuścił kontener
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
      // Reset inputa, aby można było ponownie wybrać ten sam plik
      e.target.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
    setErrorMessage(null);
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
        navigate(`/jobs/${response.batch_id}`);
      } else {
        throw new Error('Nie otrzymano identyfikatora paczki (batch_id) z serwera.');
      }
    } catch (err: unknown) {
      console.error('Błąd podczas uploadu polis:', err);
      const msg =
        err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd podczas przesyłania plików.';
      setErrorMessage(msg);
      setIsUploading(false);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.sizeBytes, 0);

  return (
    <div className="p-xl flex-1 flex flex-col max-w-5xl mx-auto w-full">
      {/* Nagłówek strony */}
      <div className="mb-lg">
        <h2 className="font-display-lg text-display-lg text-on-surface mb-xs">Document Upload</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Upload policy documents for processing and extraction.
        </p>
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
            className="p-1 rounded hover:bg-black/5 text-on-error-container"
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
          onClick={() => fileInputRef.current?.click()}
          className={`relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all group cursor-pointer ${
            isDragging
              ? 'border-secondary bg-surface-container-high ring-2 ring-secondary/20'
              : 'border-outline-variant bg-surface hover:border-secondary hover:bg-surface-container-low'
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
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
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none"
            tabIndex={-1}
          />

          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-md transition-colors ${
              isDragging
                ? 'bg-secondary text-on-secondary'
                : 'bg-surface-container text-secondary group-hover:bg-secondary-container group-hover:text-on-secondary-container'
            }`}
          >
            <span
              className="material-symbols-outlined text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              cloud_upload
            </span>
          </div>

          <p className="font-headline-sm text-headline-sm text-on-surface mb-xs">
            Drag &amp; drop files here
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-md">
            or{' '}
            <span className="text-secondary font-medium underline decoration-secondary decoration-1 underline-offset-2">
              browse files
            </span>{' '}
            from your computer
          </p>

          <div className="flex items-center gap-xs font-label-md text-label-md text-on-surface-variant bg-surface-variant px-sm py-xs rounded">
            <span className="material-symbols-outlined text-[16px]">info</span>
            <span>Supported formats: PDF only. Max size: 50MB.</span>
          </div>
        </div>

        {/* Lista wybranych plików (Selected Files List) */}
        {selectedFiles.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-sm">
              <h3 className="font-label-bold text-label-bold text-on-surface">
                Selected Files ({selectedFiles.length})
              </h3>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-on-surface-variant hover:text-error text-label-md font-label-md transition-colors"
              >
                Clear all
              </button>
            </div>

            <ul className="space-y-sm max-h-72 overflow-y-auto pr-xs">
              {selectedFiles.map((fileItem) => (
                <li
                  key={fileItem.id}
                  className="flex items-center justify-between p-sm border border-outline-variant rounded bg-surface-bright hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-md min-w-0 pr-sm">
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
                    className="text-on-surface-variant hover:text-error transition-colors p-xs rounded-full hover:bg-surface-container-low shrink-0"
                    title="Usuń plik z listy"
                    aria-label={`Usuń plik ${fileItem.name}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dolny pasek akcji */}
        <div className="pt-md flex flex-col sm:flex-row sm:justify-between sm:items-center gap-md border-t border-outline-variant">
          <div className="text-body-sm text-on-surface-variant">
            {selectedFiles.length > 0 ? (
              <span>
                Wybrano{' '}
                <strong className="text-on-surface font-semibold">
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'plik' : 'plików'}
                </strong>{' '}
                ({formatBytes(totalBytes)})
              </span>
            ) : (
              <span>Wybierz lub przeciągnij co najmniej jeden plik PDF.</span>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleStartProcessing}
              disabled={selectedFiles.length === 0 || isUploading}
              className="bg-primary text-on-primary font-label-bold text-label-bold px-lg py-sm rounded flex items-center gap-sm hover:opacity-90 transition-opacity h-10 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUploading ? (
                <>
                  <span>Starting...</span>
                  <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                </>
              ) : (
                <>
                  <span>Start Processing</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadView;
