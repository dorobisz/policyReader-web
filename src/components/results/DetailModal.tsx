import React, { useEffect, useState } from 'react';
import { DocumentRecordResponse } from '../../types/api';

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

function getFileIcon(filename: string): string {
  const ext = filename?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'picture_as_pdf';
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return 'image';
  if (ext === 'docx' || ext === 'doc') return 'description';
  return 'insert_drive_file';
}

const StatusBadge: React.FC<{ status: string; errorMessage?: string | null }> = ({
  status,
  errorMessage,
}) => {
  if (status === 'success' || status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        SUCCESS
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide bg-rose-50 text-rose-700 border border-rose-200 cursor-help"
      title={errorMessage || 'Błąd przetwarzania dokumentu'}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
      FAIL
    </span>
  );
};

export interface DetailModalProps {
  record: DocumentRecordResponse | null;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ record, onClose }) => {
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
              visibility
            </span>
            <div>
              <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                Podgląd danych wyekstrahowanych z PDF
              </h3>
              <p className="text-body-sm text-on-surface-variant text-xs">
                Szczegóły odczytu dokumentu i surowy wynik JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Zamknij"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Główne informacje o dokumencie i polisie w zwięzłej formie */}
          <div className="bg-surface-bright rounded-xl border border-outline-variant/60 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  {getFileIcon(record.filename ?? '')}
                </span>
                <span className="font-semibold text-sm text-on-surface truncate max-w-sm" title={record.filename}>
                  {record.filename ?? '—'}
                </span>
                <span className="text-xs text-on-surface-variant font-normal">
                  ({formatFileSize(record.file_size_bytes ?? record.file_size)})
                </span>
              </div>
              <StatusBadge status={record.status ?? 'failed'} errorMessage={record.error_message} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Numer polisy:</span>
                <span className="font-mono font-semibold text-on-surface">
                  {record.extracted_data?.numer_polisy || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Towarzystwo:</span>
                <span className="font-semibold text-secondary">
                  {record.extracted_data?.towarzystwo || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Składka:</span>
                <span className="font-semibold text-on-surface">
                  {record.extracted_data?.kwota_skladki ? `${record.extracted_data.kwota_skladki} PLN` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Okres ubezpieczenia:</span>
                <span className="font-medium text-on-surface">
                  {record.extracted_data?.okres_ubezpieczenia_od || record.extracted_data?.okres_ubezpieczenia_do
                    ? `${record.extracted_data?.okres_ubezpieczenia_od || '—'} do ${record.extracted_data?.okres_ubezpieczenia_do || '—'}`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Ubezpieczający:</span>
                <span className="font-medium text-on-surface truncate max-w-[200px]" title={record.extracted_data?.ubezpieczajacy}>
                  {record.extracted_data?.ubezpieczajacy || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Ubezpieczony:</span>
                <span className="font-medium text-on-surface truncate max-w-[200px]" title={record.extracted_data?.ubezpieczony}>
                  {record.extracted_data?.ubezpieczony || '—'}
                </span>
              </div>
              {record.extracted_data?.przedmiot_ubezpieczenia && (
                <div className="flex justify-between py-1 col-span-1 md:col-span-2 border-b border-outline-variant/20">
                  <span className="text-on-surface-variant font-medium text-[11px]">Przedmiot:</span>
                  <span className="font-medium text-on-surface truncate max-w-md">
                    {record.extracted_data.przedmiot_ubezpieczenia}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Alert błędu jeśli FAIL */}
          {record.status !== 'success' && record.status !== 'completed' && record.error_message && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-rose-600 text-[20px] flex-shrink-0 mt-0.5">
                error
              </span>
              <div>
                <strong className="font-semibold block mb-0.5">Komunikat błędu ekstrakcji:</strong>
                <span>{record.error_message}</span>
              </div>
            </div>
          )}

          {/* Sekcja: Surowy JSON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">data_object</span>
                Surowy JSON
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-outline-variant bg-white hover:bg-surface-container-low transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-secondary">
                  {copied ? 'check' : 'content_copy'}
                </span>
                <span>{copied ? 'Skopiowano!' : 'Kopiuj JSON'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-64 select-all shadow-inner border border-slate-800">
              {rawJson}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-outline-variant bg-surface-bright flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-medium text-sm cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
