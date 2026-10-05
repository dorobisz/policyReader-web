import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useToast } from '../../../components';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiService } from '../../../services/api';
import {
  BatchProcessingLogItem,
  BatchStatusResponse,
  DocumentRecordResponse,
  PolicyRecord,
} from '../../../types/api';
import { VehicleRegDetailCard } from '../components/VehicleRegDetailCard';

type StatusFilterType = 'all' | 'processing' | 'queued' | 'completed' | 'failed';

const PHASE_LABELS: Record<string, { label: string; icon: string; style: string }> = {
  orient: {
    label: 'Analiza orientacji',
    icon: 'screen_rotation',
    style: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  },
  aztec: {
    label: 'Odczyt Aztec 2D',
    icon: 'qr_code_2',
    style: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  },
  aztec_enrich: {
    label: 'Weryfikacja danych Aztec',
    icon: 'verified',
    style: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
  },
  ocr_segmentation: {
    label: 'Segmentacja skrzydełek',
    icon: 'view_column',
    style: 'bg-cyan-500/10 text-cyan-700 border-cyan-500/20',
  },
  ocr_mrz: {
    label: 'Odczyt paska MRZ',
    icon: 'barcode',
    style: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  },
  ocr_right: {
    label: 'OCR: Skrzydełko prawe',
    icon: 'document_scanner',
    style: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  },
  ocr_mid: {
    label: 'OCR: Skrzydełko środkowe',
    icon: 'document_scanner',
    style: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  },
  ocr_left: {
    label: 'OCR: Skrzydełko lewe',
    icon: 'document_scanner',
    style: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  },
  normalizing: {
    label: 'Walidacja i normalizacja',
    icon: 'spellcheck',
    style: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  },
  parsing: {
    label: 'Parsowanie rubryk DR',
    icon: 'fact_check',
    style: 'bg-teal-500/10 text-teal-700 border-teal-500/20',
  },
  ocr: {
    label: 'Ekstrakcja OCR',
    icon: 'text_snippet',
    style: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  },
};

export const VehicleRegStatusView: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { batchId = 'default' } = useParams<{ batchId: string }>();

  const [statusData, setStatusData] = useState<BatchStatusResponse>({
    batch_id: batchId,
    status: 'processing',
    total_files: 0,
    processed_files: 0,
    failed_files: 0,
    remaining_files: 0,
    progress_percentage: 0,
    errors: [],
  });
  const [logs, setLogs] = useState<BatchProcessingLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingBatch, setDeletingBatch] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<DocumentRecordResponse | null>(null);

  // Filtrowanie, wyszukiwanie i paginacja
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pollingIntervalRef = useRef<number | null>(null);

  const handleDeleteBatch = async () => {
    if (!window.confirm(`Czy na pewno chcesz usunąć całą paczkę #${batchId} wraz ze wszystkimi zdjęciami?`)) {
      return;
    }
    setDeletingBatch(true);
    try {
      await apiService.deleteBatch(batchId);
      toast.success('Paczka usunięta', `Paczka #${batchId} została pomyślnie usunięta.`);
      navigate('/');
    } catch (err: unknown) {
      console.error('Błąd usuwania paczki:', err);
      const msg = err instanceof Error ? err.message : 'Nie udało się usunąć paczki.';
      toast.error('Błąd usuwania', msg);
    } finally {
      setDeletingBatch(false);
    }
  };

  const handleDeleteRecord = async (recordId: string, filename: string) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć zdjęcie '${filename}' z kolejki?`)) {
      return;
    }
    setDeletingRecordId(recordId);
    try {
      await apiService.deleteBatchRecord(batchId, recordId);
      setLogs((prev) => prev.filter((l) => l.id !== recordId));
      setStatusData((prev) => ({
        ...prev,
        total_files: Math.max(0, prev.total_files - 1),
        remaining_files: Math.max(0, prev.remaining_files - 1),
      }));
      toast.success('Zdjęcie usunięte', `Plik '${filename}' został usunięty z paczki.`);
    } catch (err: unknown) {
      console.error('Błąd usuwania dokumentu:', err);
      const msg = err instanceof Error ? err.message : 'Nie udało się usunąć dokumentu.';
      toast.error('Błąd usuwania', msg);
    } finally {
      setDeletingRecordId(null);
    }
  };

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
            item.progress_message = activeMatch.progress_message;
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
      toast.error('Błąd odpytywania', 'Nie udało się pobrać statusu paczki.');
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
  let statusTitle = 'Trwa odczytywanie danych z dowodów rejestracyjnych...';

  if (isCompleted) {
    progressBarColor = 'bg-[#137333]';
    statusTitle = 'Odczyt zakończony pomyślnie!';
  } else if (isFailed) {
    progressBarColor = 'bg-error';
    statusTitle = 'Wystąpił błąd podczas przetwarzania paczki';
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

  // Filtrowanie i wyszukiwanie
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (statusFilter === 'processing' && log.status !== 'processing') return false;
      if (statusFilter === 'queued' && log.status !== 'queued' && log.status !== 'pending')
        return false;
      if (statusFilter === 'completed' && log.status !== 'success') return false;
      if (statusFilter === 'failed' && log.status !== 'failed') return false;

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
            <h2 className="font-display-lg text-display-lg text-on-surface">Odczyt dowodów rejestracyjnych</h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
              Paczka #{batchId} &nbsp;•&nbsp;
              {statusData.started_at ? (
                <span>Rozpoczęto: {new Date(statusData.started_at).toLocaleTimeString()}</span>
              ) : (
                <span>W toku</span>
              )}
              {statusData.elapsed_seconds != null && !isCompleted && !isFailed && (
                <span className="font-body-sm text-body-sm text-on-surface-variant ml-2">
                  ({Math.floor(statusData.elapsed_seconds / 60)}:
                  {String(statusData.elapsed_seconds % 60).padStart(2, '0')} upłynęło)
                </span>
              )}
            </p>
          </div>

          <div className="flex space-x-md items-center">
            <button
              type="button"
              onClick={handleDeleteBatch}
              disabled={deletingBatch}
              className="px-md py-sm border border-error/30 text-error hover:bg-error/10 rounded-lg font-label-bold text-label-bold transition-colors flex items-center space-x-xs cursor-pointer disabled:opacity-50"
              title="Usuń całą paczkę"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span>{deletingBatch ? 'Usuwanie…' : 'Usuń paczkę'}</span>
            </button>

            {isCompleted ? (
              <Link
                to={`/result/${batchId}`}
                className="px-md py-sm bg-secondary text-on-secondary rounded-lg font-label-bold text-label-bold hover:bg-secondary/90 transition-colors flex items-center space-x-sm shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">directions_car</span>
                <span>Wyniki odczytu</span>
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="px-md py-sm bg-surface-container text-on-surface-variant/50 rounded-lg font-label-bold text-label-bold cursor-not-allowed opacity-60 flex items-center space-x-sm"
                title="Przycisk aktywuje się po zakończeniu odczytu paczki"
              >
                <span className="material-symbols-outlined text-sm">directions_car</span>
                <span>Wyniki odczytu</span>
              </button>
            )}
          </div>
        </div>

        {/* Pasek postępu */}
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
                : `Szacowany czas: ~${Math.max(1, statusData.remaining_files * 10)}s`}
            </p>
          )}
        </div>
      </section>

      {/* Bento Grid ze statystykami */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-md">
        {/* TOTAL FILES */}
        <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center space-x-sm text-on-surface-variant font-label-bold text-label-bold text-xs uppercase">
            <span className="material-symbols-outlined text-sm">directions_car</span>
            <span>LICZBA ZDJĘĆ</span>
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
          <div className="flex items-center space-x-sm text-on-surface-variant font-label-bold text-label-bold text-xs uppercase">
            <span className="material-symbols-outlined text-sm text-secondary">check_circle</span>
            <span>ODCZYTANE</span>
          </div>
          <div className="font-display-lg text-display-lg text-secondary">
            {statusData.processed_files.toLocaleString()}
          </div>
        </div>

        {/* FAILED */}
        <div className="bg-error-container/20 p-md rounded-xl border border-error-container shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center space-x-sm text-error font-label-bold text-label-bold text-xs uppercase">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>BŁĘDY</span>
          </div>
          <div className="font-display-lg text-display-lg text-error">
            {statusData.failed_files.toLocaleString()}
          </div>
        </div>

        {/* REMAINING */}
        <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between h-32">
          <div className="flex items-center space-x-sm text-on-surface-variant font-label-bold text-label-bold text-xs uppercase">
            <span className="material-symbols-outlined text-sm">pending</span>
            <span>OCZEKUJĄCE</span>
          </div>
          <div className="font-display-lg text-display-lg text-on-surface">
            {statusData.remaining_files.toLocaleString()}
          </div>
        </div>
      </section>

      {/* Tabela logów przetwarzania */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        {/* Górna belka: Tytuł, wskaźnik Live Updates oraz Wyszukiwarka */}
        <div className="p-md sm:p-lg border-b border-outline-variant bg-surface-bright flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <div className="flex items-center gap-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Zdjęcia dowodów</h3>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
              {logs.length} zdjęć
            </span>
            <div className="flex items-center space-x-xs text-body-sm text-on-surface-variant ml-2">
              {isCompleted ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#137333]"></span>
                  <span className="text-[#137333] font-medium text-xs">Ukończono</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-secondary progress-pulse"></span>
                  <span className="text-xs">Na żywo</span>
                </>
              )}
            </div>
          </div>

          {/* Wyszukiwarka */}
          <div className="relative w-full sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Szukaj po nazwie pliku..."
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

        {/* Aktywne przetwarzanie w czasie rzeczywistym */}
        {!isCompleted && statusData.currently_processing && statusData.currently_processing.length > 0 && (
          <div className="p-md sm:p-lg border-b border-outline-variant bg-secondary/5">
            <div className="flex items-center justify-between mb-sm">
              <div className="flex items-center space-x-xs text-secondary font-label-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px] animate-spin-reverse">sync</span>
                <span>Aktualnie przetwarzane zdjęcia ({statusData.currently_processing.length})</span>
              </div>
              <span className="text-[11px] text-on-surface-variant font-medium">Odświeżanie na żywo</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
              {statusData.currently_processing.map((proc) => {
                const pInfo = PHASE_LABELS[proc.current_phase] || {
                  label: proc.current_phase || 'Przetwarzanie',
                  icon: 'sync',
                  style: 'bg-secondary/10 text-secondary border-secondary/20',
                };
                return (
                  <div
                    key={proc.record_id}
                    className="bg-surface-container-lowest p-sm rounded-lg border border-outline-variant shadow-xs flex items-center justify-between gap-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 font-medium text-xs text-on-surface truncate">
                        <span className="material-symbols-outlined text-[15px] text-secondary">
                          image
                        </span>
                        <span className="truncate" title={proc.filename}>{proc.filename}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant italic truncate mt-0.5 animate-pulse">
                        {proc.progress_message || 'Trwa analiza zdjęcia dowodu...'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded border text-[11px] font-label-bold shrink-0 ${pInfo.style}`}
                    >
                      <span className="material-symbols-outlined text-[13px]">{pInfo.icon}</span>
                      <span>{pInfo.label}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pasek filtrów */}
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
              <span>Wszystkie</span>
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
              <span>W toku</span>
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
              <span>W kolejce</span>
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
              <span className="material-symbols-outlined text-[14px]">check</span>
              <span>Odczytane</span>
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

            <button
              type="button"
              onClick={() => {
                setStatusFilter('failed');
                setCurrentPage(1);
              }}
              className={`px-sm py-1 rounded-lg text-label-md font-label-md transition-colors flex items-center gap-xs whitespace-nowrap cursor-pointer ${
                statusFilter === 'failed'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
              <span>Błędy</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  statusFilter === 'failed'
                    ? 'bg-on-secondary/20 text-on-secondary'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {counts.failed}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-sm text-body-sm text-on-surface-variant self-end sm:self-auto">
            <span>Na stronę:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-surface border border-outline-variant rounded-lg pl-2 pr-6 py-1 text-body-sm focus:outline-none focus:border-secondary cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Tabela dokumentów */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-bright text-xs">
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[45%]">
                  Plik zdjęcia
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[15%]">
                  Rozmiar
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[25%]">
                  Status / Etap
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[15%] text-right">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`status-skeleton-${idx}`} className="animate-pulse">
                    <td className="py-md px-md">
                      <div className="h-5 bg-surface-container rounded w-48" />
                    </td>
                    <td className="py-md px-md">
                      <div className="h-4 bg-surface-container rounded w-16" />
                    </td>
                    <td className="py-md px-md">
                      <div className="h-5 bg-surface-container rounded w-28" />
                    </td>
                    <td className="py-md px-md text-right">
                      <div className="h-5 bg-surface-container rounded w-12 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-xl text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-sm text-outline">
                      search_off
                    </span>
                    <p className="font-headline-sm text-headline-sm text-on-surface">
                      Nie znaleziono zdjęć
                    </p>
                    <p className="font-body-md text-body-md mt-xs">
                      {searchQuery
                        ? `Brak wyników pasujących do "${searchQuery}".`
                        : `Brak zdjęć o statusie "${statusFilter}".`}
                    </p>
                  </td>
                </tr>
              ) : (
                pagedLogs.map((log) => {
                  const isItemFailed = log.status === 'failed';
                  const isItemSuccess = log.status === 'success';
                  const isItemProcessing = log.status === 'processing';
                  const isItemQueued = log.status === 'queued' || log.status === 'pending';

                  const phaseKey = log.current_phase || '';
                  const phaseInfo = PHASE_LABELS[phaseKey] || {
                    label: phaseKey || 'Odczyt OCR',
                    icon: 'sync',
                    style: 'bg-secondary/10 text-secondary border-secondary/20',
                  };

                  const canPreview = isItemSuccess || (isItemFailed && log.extracted_data);

                  const openPreview = async () => {
                    if (log.extracted_data) {
                      setSelectedRecord(log as DocumentRecordResponse);
                      return;
                    }
                    try {
                      const data = await apiService.getBatchResults(batchId);
                      const rec = data.records?.find((r) => r.id === log.id || r.filename === log.filename);
                      if (rec) {
                        setSelectedRecord(rec as DocumentRecordResponse);
                      } else {
                        setSelectedRecord(log as DocumentRecordResponse);
                      }
                    } catch (err) {
                      console.error('Błąd pobierania podglądu:', err);
                      setSelectedRecord(log as DocumentRecordResponse);
                    }
                  };

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      {/* FILENAME */}
                      <td className="py-md px-md font-medium text-on-surface">
                        <div className="flex items-center space-x-sm">
                          <span
                            className={`material-symbols-outlined text-[18px] shrink-0 ${
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
                              ? 'image'
                              : 'directions_car'}
                          </span>
                          <span
                            className="truncate max-w-[240px] sm:max-w-md"
                            title={log.filename}
                          >
                            {log.filename}
                          </span>
                        </div>
                      </td>

                      {/* SIZE */}
                      <td className="py-md px-md text-on-surface-variant">{log.file_size || '—'}</td>

                      {/* STATUS & PHASE */}
                      <td className="py-md px-md">
                        <div className="flex items-center gap-xs flex-wrap">
                          {isItemSuccess && (
                            <span className="inline-flex items-center space-x-xs px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 font-label-bold text-[12px]">
                              <span className="material-symbols-outlined text-[14px]">check</span>
                              <span>Odczytano</span>
                            </span>
                          )}

                          {isItemFailed && (
                            <div className="inline-block relative group">
                              <span className="inline-flex items-center space-x-xs px-2.5 py-1 rounded-md bg-error/10 text-error font-label-bold text-[12px] cursor-help">
                                <span className="material-symbols-outlined text-[14px]">close</span>
                                <span>Błąd</span>
                                <span className="material-symbols-outlined text-[14px]">info</span>
                              </span>

                              <div className="absolute left-0 bottom-full mb-xs w-64 p-sm bg-inverse-surface text-inverse-on-surface text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30 whitespace-normal">
                                <p className="font-bold text-error-container mb-0.5">
                                  Błąd odczytu dowodu:
                                </p>
                                <p>
                                  {log.error_message ||
                                    'Błąd odczytu kodu Aztec lub tekstu ze zdjęcia dowodu.'}
                                </p>
                              </div>
                            </div>
                          )}

                          {isItemProcessing && (
                            <div className="flex items-center gap-xs flex-wrap">
                              <span className="inline-flex items-center space-x-xs px-2.5 py-1 rounded-md bg-secondary/10 text-secondary font-label-bold text-[12px]">
                                <span className="material-symbols-outlined text-[14px] animate-spin-reverse">
                                  sync
                                </span>
                                <span>W toku</span>
                              </span>

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
                                  Próba {log.retry_count}
                                </span>
                              )}
                            </div>
                          )}

                          {isItemQueued && (
                            <span className="inline-flex items-center space-x-xs px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant border border-outline-variant/60 font-label-bold text-[12px]">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              <span>W kolejce</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-md px-md text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {canPreview && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPreview();
                              }}
                              className="p-1.5 rounded-lg text-secondary hover:text-white hover:bg-secondary transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-medium"
                              title="Podgląd odczytanych danych"
                              aria-label="Podgląd odczytanych danych"
                            >
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                              <span className="hidden sm:inline">Podgląd</span>
                            </button>
                          )}

                          {isItemQueued && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(log.id, log.filename)}
                              disabled={deletingRecordId === log.id}
                              className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer disabled:opacity-50"
                              title="Usuń zdjęcie z kolejki"
                              aria-label="Usuń zdjęcie"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {deletingRecordId === log.id ? 'hourglass_empty' : 'delete'}
                              </span>
                            </button>
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
              Wyświetlanie{' '}
              <strong className="text-on-surface">
                {(safeCurrentPage - 1) * pageSize + 1}
              </strong>{' '}
              do{' '}
              <strong className="text-on-surface">
                {Math.min(safeCurrentPage * pageSize, filteredLogs.length)}
              </strong>{' '}
              z <strong className="text-on-surface">{filteredLogs.length}</strong> zdjęć
              {filteredLogs.length !== logs.length && ` (przefiltrowano z ${logs.length})`}
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
                  Strona {safeCurrentPage} z {totalPages}
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

      {/* Modal podglądu dokumentu */}
      {selectedRecord && (
        <VehicleRegDetailCard
          record={selectedRecord as PolicyRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

export default VehicleRegStatusView;
