import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useToast } from '../components/Toast';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../services/api';
import { BatchProcessingLogItem, BatchStatusResponse, DocumentPhase } from '../types/api';

type StatusFilterType = 'all' | 'processing' | 'queued' | 'completed' | 'failed';

const PHASE_LABELS: Record<string, { label: string; icon: string; style: string }> = {
  ocr: {
    label: 'Ekstrakcja tekstu (OCR)',
    icon: 'text_snippet',
    style: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  },
  llm_inference: {
    label: 'Analiza AI (Ollama)',
    icon: 'smart_toy',
    style: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  },
  parsing: {
    label: 'Walidacja wyników',
    icon: 'verified',
    style: 'bg-teal-500/10 text-teal-700 border-teal-500/20',
  },
};

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

  // Filtrowanie, wyszukiwanie i paginacja
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pollingIntervalRef = useRef<number | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await apiService.getBatchStatus(batchId);
      setStatusData(data);

      const isCompleted = data.status === 'completed';
      const logItems = await apiService.getBatchLogs(batchId, isCompleted);

      // Zsynchronizuj fazy z currently_processing
      if (data.currently_processing && data.currently_processing.length > 0) {
        logItems.forEach((item) => {
          const activeMatch = data.currently_processing?.find(
            (p) => p.filename === item.filename || p.record_id === item.id,
          );
          if (activeMatch) {
            item.status = 'processing';
            item.current_phase = activeMatch.current_phase;
            item.retry_count = activeMatch.retry_count;
          }
        });
      }

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

      // Jeśli paczka zakończona, upewnij się, że nie-błędne rekordy mają status 'success'
      if (isCompleted) {
        logItems.forEach((item) => {
          if (item.status !== 'failed') {
            item.status = 'success';
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

  // Liczniki dla filtrów
  const counts = useMemo(() => {
    let processing = 0;
    let queued = 0;
    let completed = 0;
    let failed = 0;

    logs.forEach((log) => {
      if (log.status === 'success') completed++;
      else if (log.status === 'failed') failed++;
      else if (log.status === 'processing') processing++;
      else queued++;
    });

    return { all: logs.length, processing, queued, completed, failed };
  }, [logs]);

  // Filtrowanie i wyszukiwanie (zachowuje pozycję podczas live pollingu)
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filtr statusu
      if (statusFilter === 'processing' && log.status !== 'processing') return false;
      if (statusFilter === 'queued' && log.status !== 'queued' && log.status !== 'pending')
        return false;
      if (statusFilter === 'completed' && log.status !== 'success') return false;
      if (statusFilter === 'failed' && log.status !== 'failed') return false;

      // Filtr wyszukiwarki
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return log.filename.toLowerCase().includes(q);
      }

      return true;
    });
  }, [logs, statusFilter, searchQuery]);

  // Paginacja
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pagedLogs = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, safeCurrentPage, pageSize]);

  return (
    <div className="max-w-6xl mx-auto space-y-xl">
      {/* Header & Akcja przejścia do wyników */}
      <section className="space-y-lg">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-md">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-surface">Batch Processing</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
              Batch ID: #{batchId} &nbsp;•&nbsp;
              {statusData.started_at ? (
                <span>Started: {new Date(statusData.started_at).toLocaleTimeString()}</span>
              ) : (
                <span>Started: 10:42 AM</span>
              )}
              {statusData.elapsed_seconds != null && !isCompleted && !isFailed && (
                <span className="font-body-sm text-body-sm text-on-surface-variant ml-2">
                  ({Math.floor(statusData.elapsed_seconds / 60)}:
                  {String(statusData.elapsed_seconds % 60).padStart(2, '0')} elapsed)
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
                ? `Upłynęło: ${Math.floor(statusData.elapsed_seconds / 60)} min ${
                    statusData.elapsed_seconds % 60
                  } s`
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

      {/* Tabela logów przetwarzania (Processing Log Table) */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        {/* Górna belka: Tytuł, wskaźnik Live Updates oraz Wyszukiwarka */}
        <div className="p-md sm:p-lg border-b border-outline-variant bg-surface-bright flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div className="flex items-center gap-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Processing Log</h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
              {logs.length} files
            </span>
            <div className="flex items-center space-x-xs text-body-sm text-on-surface-variant ml-2">
              {isCompleted ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
                  <span className="text-[#137333] font-medium text-xs">Completed</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-secondary progress-pulse"></span>
                  <span className="text-xs">Live Updates</span>
                </>
              )}
            </div>
          </div>

          {/* Wyszukiwarka dokumentów */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search by filename..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-1 text-body-sm bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary transition-colors"
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
        </div>

        {/* Pasek szybkiego filtrowania (Quick Filter Tabs) & Rozmiar strony */}
        <div className="px-md sm:px-lg py-sm border-b border-outline-variant bg-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
          <div className="flex items-center gap-xs flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setCurrentPage(1);
              }}
              className={`px-sm py-1 rounded-lg text-label-md font-label-md transition-colors flex items-center gap-xs whitespace-nowrap cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span>All</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  statusFilter === 'all'
                    ? 'bg-on-secondary/20 text-on-secondary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('processing');
                setCurrentPage(1);
              }}
              className={`px-sm py-1 rounded-lg text-label-md font-label-md transition-colors flex items-center gap-xs whitespace-nowrap cursor-pointer ${
                statusFilter === 'processing'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">sync</span>
              <span>Processing</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  statusFilter === 'processing'
                    ? 'bg-on-secondary/20 text-on-secondary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {counts.processing}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('queued');
                setCurrentPage(1);
              }}
              className={`px-sm py-1 rounded-lg text-label-md font-label-md transition-colors flex items-center gap-xs whitespace-nowrap cursor-pointer ${
                statusFilter === 'queued'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              <span>Queued</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  statusFilter === 'queued'
                    ? 'bg-on-secondary/20 text-on-secondary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {counts.queued}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('completed');
                setCurrentPage(1);
              }}
              className={`px-sm py-1 rounded-lg text-label-md font-label-md transition-colors flex items-center gap-xs whitespace-nowrap cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-emerald-600">
                check_circle
              </span>
              <span>Completed</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  statusFilter === 'completed'
                    ? 'bg-on-secondary/20 text-on-secondary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {counts.completed}
              </span>
            </button>

            {counts.failed > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('failed');
                  setCurrentPage(1);
                }}
                className={`px-sm py-1 rounded-lg text-label-md font-label-md transition-colors flex items-center gap-xs whitespace-nowrap cursor-pointer ${
                  statusFilter === 'failed'
                    ? 'bg-error text-on-error shadow-xs'
                    : 'text-error hover:bg-error-container/20'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <span>Failed</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    statusFilter === 'failed'
                      ? 'bg-on-error/20 text-on-error'
                      : 'bg-error-container text-on-error-container'
                  }`}
                >
                  {counts.failed}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-sm text-body-sm text-on-surface-variant shrink-0">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-surface border border-outline-variant rounded-lg pl-2.5 pr-8 py-0.5 text-body-sm focus:outline-none focus:border-secondary cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2376777D%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_0.6rem_center] bg-no-repeat"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Tabela logów (bez kolumny ACTION) */}
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
                  STATUS &amp; PHASE
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
                      <div className="h-5 bg-surface-container rounded w-32" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-xl text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-3xl mb-xs">search_off</span>
                    <p className="font-body-md">
                      {searchQuery
                        ? `Nie znaleziono dokumentów pasujących do "${searchQuery}".`
                        : `Brak dokumentów o statusie "${statusFilter}".`}
                    </p>
                  </td>
                </tr>
              ) : (
                pagedLogs.map((log) => {
                  const isItemFailed = log.status === 'failed';
                  const isItemSuccess = log.status === 'success';
                  const isItemProcessing = log.status === 'processing';
                  const isItemQueued = !isItemFailed && !isItemSuccess && !isItemProcessing;

                  const phase = (log.current_phase as DocumentPhase) || 'ocr';
                  const phaseInfo = PHASE_LABELS[phase] || {
                    label: log.current_phase || 'Przetwarzanie',
                    icon: 'sync',
                    style: 'bg-secondary/10 text-secondary border-secondary/20',
                  };

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-surface-container-low transition-colors ${
                        isItemFailed ? 'bg-error/5' : ''
                      }`}
                    >
                      {/* FILE NAME */}
                      <td className="py-md px-md font-medium text-on-surface">
                        <div className="flex items-center space-x-sm min-w-0">
                          <span
                            className={`material-symbols-outlined text-base shrink-0 ${
                              isItemFailed
                                ? 'text-error'
                                : isItemSuccess
                                ? 'text-[#137333]'
                                : isItemProcessing
                                ? 'text-secondary'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {isItemFailed
                              ? 'error'
                              : isItemSuccess
                              ? 'task_alt'
                              : isItemProcessing
                              ? 'picture_as_pdf'
                              : 'description'}
                          </span>
                          <span
                            className="truncate max-w-[240px] sm:max-w-md"
                            title={log.filename}
                          >
                            {log.filename}
                          </span>
                        </div>
                      </td>

                      {/* POLICY TYPE */}
                      <td className="py-md px-md text-on-surface-variant">
                        {log.document_type || 'Policy Document'}
                      </td>

                      {/* SIZE */}
                      <td className="py-md px-md text-on-surface-variant">{log.file_size || '—'}</td>

                      {/* STATUS & PHASE (Zamiast osobnej kolumny ACTION) */}
                      <td className="py-md px-md">
                        <div className="flex items-center gap-xs flex-wrap">
                          {/* 1. SUCCESS / COMPLETED */}
                          {isItemSuccess && (
                            <span className="inline-flex items-center space-x-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 font-label-bold text-[12px]">
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              <span>Completed</span>
                            </span>
                          )}

                          {/* 2. FAILED z dymkiem błędu */}
                          {isItemFailed && (
                            <div className="inline-block relative group">
                              <span className="inline-flex items-center space-x-xs px-2.5 py-1 rounded-md bg-error/10 text-error font-label-bold text-[12px] cursor-help">
                                <span className="material-symbols-outlined text-[14px]">close</span>
                                <span>Failed</span>
                                <span className="material-symbols-outlined text-[14px]">info</span>
                              </span>

                              {/* Tooltip błędu po najechaniu */}
                              <div className="absolute left-0 bottom-full mb-xs w-64 p-sm bg-inverse-surface text-inverse-on-surface text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30 whitespace-normal">
                                <p className="font-bold text-error-container mb-0.5">
                                  Błąd przetwarzania:
                                </p>
                                <p>
                                  {log.error_message ||
                                    'Błąd odczytu lub analizy dokumentu. Wymagana weryfikacja ręczna.'}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* 3. PROCESSING z dedykowanym badge fazy */}
                          {isItemProcessing && (
                            <>
                              <span className="inline-flex items-center space-x-xs px-2.5 py-1 rounded-md bg-secondary/10 text-secondary font-label-bold text-[12px]">
                                <span className="material-symbols-outlined text-[14px] animate-spin">
                                  sync
                                </span>
                                <span>Processing</span>
                              </span>

                              {/* Dedykowany badge fazy */}
                              <span
                                className={`inline-flex items-center space-x-xs px-2 py-0.5 rounded border font-label-bold text-[11px] ${phaseInfo.style}`}
                              >
                                <span className="material-symbols-outlined text-[13px]">
                                  {phaseInfo.icon}
                                </span>
                                <span>{phaseInfo.label}</span>
                              </span>

                              {log.retry_count != null && log.retry_count > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-warning-container/40 text-on-surface-variant font-label-bold text-[10px]">
                                  Retry {log.retry_count}
                                </span>
                              )}
                            </>
                          )}

                          {/* 4. QUEUED (W kolejce) */}
                          {isItemQueued && (
                            <span className="inline-flex items-center space-x-xs px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant border border-outline-variant/60 font-label-bold text-[12px]">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              <span>Queued</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Kontrolki paginacji */}
        {filteredLogs.length > 0 && (
          <div className="p-md border-t border-outline-variant bg-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
            <div className="text-body-sm text-on-surface-variant">
              Showing{' '}
              <strong className="text-on-surface">
                {(safeCurrentPage - 1) * pageSize + 1}
              </strong>{' '}
              to{' '}
              <strong className="text-on-surface">
                {Math.min(safeCurrentPage * pageSize, filteredLogs.length)}
              </strong>{' '}
              of <strong className="text-on-surface">{filteredLogs.length}</strong> documents
              {filteredLogs.length !== logs.length && ` (filtered from ${logs.length} total)`}
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
      </section>
    </div>
  );
};

export default BatchStatusView;
