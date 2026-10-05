import React, { useEffect, useState } from 'react';
import { DocumentRecordResponse } from '../../../types/api';

function formatFileSize(bytesOrStr: number | string | null | undefined): string {
  if (bytesOrStr == null) return '—';
  if (typeof bytesOrStr === 'string') {
    if (bytesOrStr.includes('KB') || bytesOrStr.includes('MB') || bytesOrStr.includes('B')) return bytesOrStr;
    const n = parseInt(bytesOrStr, 10);
    if (isNaN(n)) return bytesOrStr;
    bytesOrStr = n;
  }
  if (bytesOrStr < 1024) return `${bytesOrStr} B`;
  if (bytesOrStr < 1024 * 1024) return `${(bytesOrStr / 1024).toFixed(1)} KB`;
  return `${(bytesOrStr / (1024 * 1024)).toFixed(2)} MB`;
}

export interface VehicleRegDetailModalProps {
  record: DocumentRecordResponse | null;
  onClose: () => void;
}

export const VehicleRegDetailModal: React.FC<VehicleRegDetailModalProps> = ({ record, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!record) return null;

  const rawJson = JSON.stringify(record.extracted_data || {}, null, 2);
  const isSuccess = record.status === 'success' || record.status === 'completed';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Błąd kopiowania do schowka:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-outline-variant shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant bg-surface-bright flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-[24px]">
              directions_car
            </span>
            <div>
              <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                Podgląd danych dowodu rejestracyjnego
              </h3>
              <p className="text-body-sm text-on-surface-variant text-xs">
                Szczegóły odczytu zdjęcia JPG i surowy wynik JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
            aria-label="Zamknij"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Metadata bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 text-xs">
            <div>
              <span className="text-on-surface-variant block mb-0.5">Nazwa pliku:</span>
              <span className="font-medium text-on-surface break-all block" title={record.filename}>
                {record.filename}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant block mb-0.5">Rozmiar:</span>
              <span className="font-medium text-on-surface">{formatFileSize(record.file_size)}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block mb-0.5">Czas odczytu:</span>
              <span className="font-medium text-on-surface">
                {record.czas_procesu_sek ? `${record.czas_procesu_sek.toFixed(2)}s` : '—'}
              </span>
            </div>
            <div>
              <span className="text-on-surface-variant block mb-0.5">Status:</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  isSuccess ? 'text-emerald-600' : 'text-error'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isSuccess ? 'check_circle' : 'cancel'}
                </span>
                {isSuccess ? 'Sukces' : 'Błąd'}
              </span>
            </div>
          </div>

          {/* Błąd odczytu jeśli wystąpił */}
          {record.error_message && (
            <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <div>
                <p className="text-xs font-semibold text-error">Komunikat błędu silnika OCR</p>
                <p className="text-xs text-on-surface mt-0.5 font-mono">{record.error_message}</p>
              </div>
            </div>
          )}

          {/* Surowy wynik JSON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Odczytane dane (JSON):
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-secondary hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Skopiowano!' : 'Kopiuj JSON'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-surface-container font-mono text-xs text-on-surface overflow-x-auto max-h-72 leading-relaxed border border-outline-variant/60">
              {rawJson}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-outline-variant bg-surface-bright flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleRegDetailModal;
