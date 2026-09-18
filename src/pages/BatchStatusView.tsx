import React, { useEffect, useState, useRef } from 'react';
import { useToast } from '../components/Toast';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { BatchProcessingLogItem, BatchStatusResponse } from '../types/api';

export const BatchStatusView: React.FC = () => {
  const toast = useToast();
  const { batchId = 'default' } = useParams<{ batchId: string }>();

  const [statusData, setStatusData] = useState<BatchStatusResponse>({
    batch_id: batchId,
    status: 'processing',
    total_files: 4,
    processed_files: 1,
    failed_files: 0,
    remaining_files: 3,
    progress_percentage: 25,
    errors: [],
  });
  const [logs, setLogs] = useState<BatchProcessingLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const pollingIntervalRef = useRef<number | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await apiService.getBatchStatus(batchId);
      setStatusData(data);

      const isCompleted = data.status === 'completed';
      const logItems = await apiService.getBatchLogs(batchId, isCompleted);

      // Jeśli backend zwrócił szczegółowe błędy, zaktualizuj wpisy w logach
      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((err) => {
          const match = logItems.find((l) => l.filename === err.filename);
          if (match) {
            match.status = 'failed';
            match.error_message = err.error_message;
          }
        });
      }

      setLogs(logItems);

      // Zatrzymaj odpytywanie, gdy paczka zakończyła przetwarzanie
      if (data.status === 'completed' || data.status === 'failed') {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error('Błąd podczas odpytywania o status paczki:', err);
      toast.error('Polling error', 'Could not fetch batch status. Retrying...');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Rozpocznij cykliczne odpytywanie API (polling co 2 sekundy)
    pollingIntervalRef.current = window.setInterval(() => {
      fetchStatus();
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [batchId]);

  const isCompleted = statusData.status === 'completed';
  const isFailed = statusData.status === 'failed';
  const progressPercent = Math.min(100, Math.max(0, statusData.progress_percentage || 0));

  let progressBarColor = 'bg-secondary';
  let statusTitle = 'Processing Documents...';

  if (isCompleted) {
    progressBarColor = 'bg-[#137333]';
    statusTitle = 'Processing Completed!';
  } else if (isFailed) {
    progressBarColor = 'bg-error';
    statusTitle = 'Processing Failed';
  }

  return (
    <div className="max-w-6xl mx-auto space-y-xl">
      {/* Header & Akcja przejścia do wyników */}
      <section className="space-y-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-md">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-surface">Batch Processing</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
              Batch ID: #{batchId} &nbsp;•&nbsp; Started: 10:42 AM
              {statusData.elapsed_seconds != null && !isCompleted && !isFailed && (
                <span className="font-body-sm text-body-sm text-on-surface-variant ml-2">
                  ({Math.floor(statusData.elapsed_seconds / 60)}:{String(statusData.elapsed_seconds % 60).padStart(2, '0')} elapsed)
                </span>
              )}
            </p>
          </div>

          <div className="flex space-x-md">
            {isCompleted ? (
              <Link
                to={`/result/${batchId}`}
                className="px-md py-sm bg-secondary text-on-secondary rounded-lg font-label-bold text-label-bold hover:bg-secondary/90 transition-colors flex items-center space-x-sm shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">analytics</span>
                <span>Batch Results</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="px-md py-sm bg-surface-container text-on-surface-variant/50 rounded-lg font-label-bold text-label-bold cursor-not-allowed opacity-60 flex items-center space-x-sm"
                title="Przycisk aktywuje się po zakończeniu przetwarzania paczki"
              >
                <span className="material-symbols-outlined text-sm">analytics</span>
                <span>Batch Results</span>
              </button>
            )}
          </div>
        </div>

        {/* Komponent paska postępu (Progress Bar Component) */}
        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm space-y-md">
          <div className="flex justify-between items-center font-headline-sm text-headline-sm text-on-surface">
            <span>{statusTitle}</span>
            <span
              className={`font-bold ${
                isCompleted
                  ? 'text-[#137333]'
                  : isFailed
                  ? 'text-error'
                  : 'text-secondary'
              }`}
            >
              {progressPercent}%
            </span>
          </div>

          <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden relative">
            <div
              className={`absolute top-0 left-0 h-full ${progressBarColor} rounded-full transition-all duration-500 ease-out ${
                !isCompleted && !isFailed ? 'progress-pulse' : ''
              }`}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {!isCompleted && !isFailed && (
            <p className="font-body-sm text-body-sm text-on-surface-variant text-right">
              {statusData.estimated_remaining_seconds != null
                ? `Szacowany czas: ~${Math.ceil(statusData.estimated_remaining_seconds / 60)} min`
                : statusData.elapsed_seconds != null
                ? `Upłynęło: ${Math.floor(statusData.elapsed_seconds / 60)} min ${statusData.elapsed_seconds % 60} s`
                : `Estimated time remaining: ${Math.max(1, statusData.remaining_files * 15)}s`}
            </p>
          )}
        </div>
      </section>

      {/* Bento Grid ze statystykami (Stats Bento Grid) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-md">
        {/* TOTAL FILES */}
        <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center space-x-sm text-on-surface-variant font-label-bold text-label-bold">
            <span className="material-symbols-outlined text-sm">description</span>
            <span>TOTAL FILES</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">
            {statusData.total_files.toLocaleString()}
          </div>
        </div>

        {/* PROCESSED */}
        <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-9xl">check_circle</span>
          </div>
          <div className="flex items-center space-x-sm text-on-surface-variant font-label-bold text-label-bold">
            <span className="material-symbols-outlined text-sm text-secondary">check_circle</span>
            <span>PROCESSED</span>
          </div>
          <div className="font-display-lg text-display-lg text-secondary">
            {statusData.processed_files.toLocaleString()}
          </div>
        </div>

        {/* FAILED */}
        <div className="bg-error-container/20 p-md rounded-xl border border-error-container shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center space-x-sm text-error font-label-bold text-label-bold">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>FAILED</span>
          </div>
          <div className="font-display-lg text-display-lg text-error">
            {statusData.failed_files.toLocaleString()}
          </div>
        </div>

        {/* REMAINING */}
        <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center space-x-sm text-on-surface-variant font-label-bold text-label-bold">
            <span className="material-symbols-outlined text-sm">pending</span>
            <span>REMAINING</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">
            {statusData.remaining_files.toLocaleString()}
          </div>
        </div>
      </section>

      {/* Aktualnie przetwarzane dokumenty */}
      {statusData.currently_processing && statusData.currently_processing.length > 0 && !isCompleted && !isFailed && (
        <section className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm space-y-md">
          <div className="flex items-center space-x-sm">
            <span className="material-symbols-outlined text-secondary text-lg animate-spin">sync</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Aktualnie przetwarzane</h3>
          </div>
          <div className="space-y-sm">
            {statusData.currently_processing.map((doc) => {
              const phaseLabels: Record<string, { label: string; icon: string }> = {
                ocr: { label: 'Ekstrakcja tekstu', icon: 'text_snippet' },
                llm_inference: { label: 'Analiza AI', icon: 'smart_toy' },
                parsing: { label: 'Walidacja wyników', icon: 'verified' },
              };
              const phaseInfo = phaseLabels[doc.current_phase] || { label: doc.current_phase, icon: 'pending' };

              return (
                <div
                  key={doc.record_id}
                  className="flex items-center justify-between p-sm bg-surface-container-low rounded-lg"
                >
                  <div className="flex items-center space-x-sm min-w-0">
                    <span className="material-symbols-outlined text-secondary text-base shrink-0">
                      {phaseInfo.icon}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface truncate max-w-[200px] sm:max-w-xs" title={doc.filename}>
                      {doc.filename}
                    </span>
                  </div>
                  <div className="flex items-center space-x-sm shrink-0">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-secondary/10 text-secondary font-label-bold text-[11px]">
                      {phaseInfo.label}
                    </span>
                    {doc.retry_count > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-warning-container/30 text-on-surface-variant font-label-bold text-[10px]">
                        Retry {doc.retry_count}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tabela logów przetwarzania (Processing Log Table) */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Processing Log</h3>
          <div className="flex items-center space-x-sm text-body-sm text-on-surface-variant">
            {isCompleted ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
                <span className="text-[#137333] font-medium">Completed</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-secondary progress-pulse"></span>
                <span>Live Updates</span>
              </>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-lowest">
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap">
                  FILE NAME
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap">
                  POLICY TYPE
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap">
                  SIZE
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap">
                  STATUS
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant text-right whitespace-nowrap">
                  ACTION
                </th>
              </tr>
            </thead>

            <tbody className="font-body-sm text-body-sm divide-y divide-outline-variant/50">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`log-skeleton-${idx}`} className="animate-pulse">
                    <td className="py-md px-md">
                      <div className="h-4 bg-surface-container rounded w-48" />
                    </td>
                    <td className="py-md px-md">
                      <div className="h-4 bg-surface-container rounded w-24" />
                    </td>
                    <td className="py-md px-md">
                      <div className="h-4 bg-surface-container rounded w-16" />
                    </td>
                    <td className="py-md px-md">
                      <div className="h-5 bg-surface-container rounded w-20" />
                    </td>
                    <td className="py-md px-md text-right">
                      <div className="h-4 bg-surface-container rounded w-6 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                logs.map((log) => {
                  const isItemFailed = log.status === 'failed';
                  const isItemSuccess = log.status === 'success';

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-surface-container-low transition-colors ${
                        isItemFailed ? 'bg-error/5' : ''
                      }`}
                    >
                      {/* FILE NAME */}
                      <td className="py-md px-md font-medium text-on-surface flex items-center space-x-sm">
                        <span
                          className={`material-symbols-outlined text-sm ${
                            isItemFailed ? 'text-error' : 'text-on-surface-variant'
                          }`}
                        >
                          {isItemFailed ? 'error' : 'picture_as_pdf'}
                        </span>
                        <span className="truncate max-w-[240px] sm:max-w-xs" title={log.filename}>
                          {log.filename}
                        </span>
                      </td>

                      {/* POLICY TYPE */}
                      <td className="py-md px-md text-on-surface-variant">
                        {log.document_type || 'Unknown'}
                      </td>

                      {/* SIZE */}
                      <td className="py-md px-md text-on-surface-variant">
                        {log.file_size || '—'}
                      </td>

                      {/* STATUS */}
                      <td className="py-md px-md">
                        {isItemSuccess && (
                          <span className="inline-flex items-center space-x-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-700 font-label-bold text-label-bold">
                            <span className="material-symbols-outlined text-[10px]">check</span>
                            <span>Completed</span>
                          </span>
                        )}
                        {isItemFailed && (
                          <span className="inline-flex items-center space-x-xs px-2 py-1 rounded-md bg-error/10 text-error font-label-bold text-label-bold">
                            <span className="material-symbols-outlined text-[10px]">close</span>
                            <span>Failed</span>
                          </span>
                        )}
                        {!isItemSuccess && !isItemFailed && (
                          <span className="inline-flex items-center space-x-xs px-2 py-1 rounded-md bg-secondary/10 text-secondary font-label-bold text-label-bold">
                            <span className="material-symbols-outlined text-[10px] animate-spin">
                              sync
                            </span>
                            <span>Processing</span>
                          </span>
                        )}
                      </td>

                      {/* ACTION & TOOLTIP */}
                      <td className="py-md px-md text-right relative">
                        {isItemFailed ? (
                          <div className="inline-block relative group">
                            <button
                              type="button"
                              className="text-error hover:text-error-container transition-colors p-1"
                              aria-label="Szczegóły błędu OCR"
                            >
                              <span className="material-symbols-outlined text-sm">info</span>
                            </button>

                            {/* Tooltip błędu (czarny box zgodny z DESIGN) */}
                            <div className="absolute right-full mr-sm top-1/2 -translate-y-1/2 w-60 p-sm bg-inverse-surface text-inverse-on-surface text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30 whitespace-normal text-left">
                              <p className="font-bold text-error-container mb-0.5">Błąd ekstrakcji:</p>
                              <p>
                                {log.error_message ||
                                  'OCR Failure: Unreadable text block detected on page 3. Requires manual review.'}
                              </p>
                            </div>
                          </div>
                        ) : isItemSuccess ? (
                          <Link
                            to={`/result/${batchId}`}
                            className="text-on-surface-variant hover:text-primary transition-colors p-1 inline-block"
                            title="Przejdź do wyników"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            className="text-on-surface-variant hover:text-primary transition-colors p-1"
                            title="Więcej opcji"
                          >
                            <span className="material-symbols-outlined text-sm">more_vert</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default BatchStatusView;
