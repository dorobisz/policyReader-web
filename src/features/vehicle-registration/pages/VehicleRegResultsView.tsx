import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../../components';
import { useParams, Link } from 'react-router-dom';
import { apiService } from '../../../services/api';
import { PolicyRecord } from '../../../types/api';
import { VehicleRegTable } from '../components/VehicleRegTable';
import { VehicleRegDetailCard } from '../components/VehicleRegDetailCard';
import { VehicleCopyFieldsConfig } from '../../settings/components/VehicleCopyFieldsConfig';

export const VehicleRegResultsView: React.FC = () => {
  const { batchId = 'default' } = useParams<{ batchId: string }>();
  const toast = useToast();
  const [allRecords, setAllRecords] = useState<PolicyRecord[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [csvExporting, setCsvExporting] = useState(false);

  // Konfigurator pól schowka
  const [vehicleConfigOpen, setVehicleConfigOpen] = useState(false);

  // Filtry i wyszukiwarka
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMake, setFilterMake] = useState('');
  const [filterVehicleType, setFilterVehicleType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Paginacja
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Wybrany rekord do podglądu szczegółów
  const [selectedRecord, setSelectedRecord] = useState<PolicyRecord | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getBatchResults(batchId);
        const records = (data.records ?? []) as PolicyRecord[];
        setAllRecords(records);
        setTotalFiles(data.total_files ?? 0);
        setProcessedFiles(data.processed_files ?? 0);
      } catch (err) {
        console.error('Błąd ładowania wyników dowodów rejestracyjnych:', err);
        toast.error('Nie udało się załadować wyników', 'Załadowano dane demonstracyjne.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [batchId]);

  // Listy wartości do filtrów
  const uniqueMakes = useMemo(() => {
    const s = new Set(allRecords.map((r) => r.extracted_data?.marka ?? '').filter(Boolean));
    return Array.from(s).sort();
  }, [allRecords]);

  const uniqueVehicleTypes = useMemo(() => {
    const s = new Set(allRecords.map((r) => r.extracted_data?.rodzaj_pojazdu ?? '').filter(Boolean));
    return Array.from(s).sort();
  }, [allRecords]);

  // Filtrowanie rekordów
  const filtered = useMemo(() => {
    let result = [...allRecords];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const fnameMatch = r.filename?.toLowerCase().includes(q);
        const d = r.extracted_data || {};
        const regMatch = d.numer_rejestracyjny?.toLowerCase().includes(q);
        const vinMatch = d.vin?.toLowerCase().includes(q);
        const makeMatch = d.marka?.toLowerCase().includes(q);
        const modelMatch = d.model?.toLowerCase().includes(q);
        return fnameMatch || regMatch || vinMatch || makeMatch || modelMatch;
      });
    }

    if (filterMake) {
      result = result.filter((r) => r.extracted_data?.marka === filterMake);
    }
    if (filterVehicleType) {
      result = result.filter((r) => r.extracted_data?.rodzaj_pojazdu === filterVehicleType);
    }
    if (filterStatus) {
      result = result.filter((r) => r.status === filterStatus);
    }

    return result;
  }, [allRecords, searchQuery, filterMake, filterVehicleType, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedRecords = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterMake('');
    setFilterVehicleType('');
    setFilterStatus('');
    setPage(1);
  };

  const isFiltered = Boolean(searchQuery.trim() || filterMake || filterVehicleType || filterStatus);

  const successCount = allRecords.filter((r) => r.status === 'success').length;
  const successRate =
    allRecords.length > 0 ? ((successCount / allRecords.length) * 100).toFixed(1) : '100.0';

  // Eksport CSV dowodów rejestracyjnych
  const handleExportCsv = async () => {
    setCsvExporting(true);
    try {
      await apiService.downloadBatchCsv(batchId, 'vehicle_registration', 'default', allRecords);
      toast.success('Eksport CSV', 'Plik CSV z dowodami rejestracyjnymi został pomyślnie pobrany.');
    } catch {
      toast.error('Błąd eksportu', 'Nie udało się wyeksportować pliku CSV.');
    } finally {
      setCsvExporting(false);
    }
  };

  const handleDownloadJson = () => {
    try {
      const exportData = {
        batch_id: batchId,
        exported_at: new Date().toISOString(),
        total_records: filtered.length,
        document_type: 'vehicle_registration',
        records: filtered,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_${batchId}_dowody_rejestracyjne.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Eksport JSON', 'Plik JSON z dowodami rejestracyjnymi został pobrany.');
    } catch (err) {
      console.error('Błąd pobierania JSON:', err);
      toast.error('Błąd eksportu', 'Nie udało się wygenerować pliku JSON.');
    }
  };

  const startIdx = (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(safePage * pageSize, filtered.length);

  return (
    <div className="max-w-6xl mx-auto space-y-xl">
      {/* Powrót do widoku postępu paczki */}
      <div>
        <Link
          to={`/jobs/${batchId}`}
          className="inline-flex items-center gap-xs text-secondary hover:text-secondary-container font-label-bold text-label-bold transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Wróć do postępu paczki</span>
        </Link>
      </div>

      {/* Nagłówek strony + Eksport */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">
            Wyniki odczytu dowodów rejestracyjnych
          </h2>
          {loading ? (
            <div className="h-4 w-48 bg-surface-container animate-pulse rounded mt-xs" />
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
              Paczka #{batchId} &nbsp;•&nbsp; {processedFiles} z {totalFiles} zdjęć przetworzonych
              &nbsp;•&nbsp; Skuteczność:{' '}
              <strong className="text-on-surface">{successRate}%</strong>
            </p>
          )}
        </div>

        {/* Przyciski eksportu i konfiguracji */}
        <div className="flex items-center gap-xs flex-wrap">
          <button
            type="button"
            onClick={() => setVehicleConfigOpen(true)}
            className="flex items-center gap-xs px-md py-sm rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface font-label-bold text-label-bold transition-colors cursor-pointer text-xs"
            title="Dostosuj rubryki kopiowane do Excela"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span className="hidden sm:inline">Pola schowka</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            disabled={loading || filtered.length === 0}
            className="flex items-center gap-xs px-md py-sm rounded-lg border border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface font-label-bold text-label-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            title="Pobierz dane jako JSON"
          >
            <span className="material-symbols-outlined text-[18px]">data_object</span>
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={csvExporting || loading || filtered.length === 0}
            className="flex items-center gap-xs px-md py-sm rounded-lg bg-secondary text-on-secondary font-label-bold text-label-bold hover:bg-secondary/90 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            {csvExporting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                <span>Generowanie CSV...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Eksportuj CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pasek Wyszukiwania i Filtrów */}
      <div className="bg-surface border border-outline-variant rounded-xl p-md shadow-xs space-y-sm">
        <div className="flex flex-col md:flex-row gap-sm items-stretch md:items-center justify-between">
          {/* Input wyszukiwarki */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Szukaj po nr rej., VIN, marce, modelu, nazwie pliku..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-body-sm bg-surface-container-lowest border border-outline-variant rounded-lg focus:outline-none focus:border-secondary transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                aria-label="Wyczyść wyszukiwanie"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Filtry dropdown */}
          <div className="flex items-center gap-xs flex-wrap">
            {/* Filtr: Marka */}
            <select
              value={filterMake}
              onChange={(e) => {
                setFilterMake(e.target.value);
                setPage(1);
              }}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-2 text-body-sm text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
            >
              <option value="">Wszystkie marki</option>
              {uniqueMakes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Filtr: Rodzaj pojazdu */}
            <select
              value={filterVehicleType}
              onChange={(e) => {
                setFilterVehicleType(e.target.value);
                setPage(1);
              }}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-2 text-body-sm text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
            >
              <option value="">Wszystkie rodzaje</option>
              {uniqueVehicleTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Filtr: Status */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg px-2.5 py-2 text-body-sm text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
            >
              <option value="">Wszystkie statusy</option>
              <option value="success">Sukces</option>
              <option value="failed">Błąd</option>
            </select>

            {/* Przycisk resetowania filtrów */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-2.5 py-2 text-body-sm text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                title="Wyczyść wszystkie filtry"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                <span>Resetuj</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela wyników dowodów rejestracyjnych (bez zakładek) */}
      {loading ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 space-y-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={`results-skel-${idx}`} className="h-10 bg-surface-container animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <VehicleRegTable
          records={pagedRecords}
          onSelectRecord={(rec) => setSelectedRecord(rec)}
        />
      )}

      {/* Kontrolki Paginacji */}
      {!loading && filtered.length > 0 && (
        <div className="bg-surface border border-outline-variant rounded-xl p-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm text-body-sm text-on-surface-variant">
          <div>
            Wyświetlanie <strong className="text-on-surface">{startIdx}</strong> do{' '}
            <strong className="text-on-surface">{endIdx}</strong> z{' '}
            <strong className="text-on-surface">{filtered.length}</strong> dowodów rejestracyjnych
            {isFiltered && ` (przefiltrowano z ${allRecords.length})`}
          </div>

          <div className="flex items-center gap-md self-end sm:self-auto">
            {/* Wybór liczby na stronę */}
            <div className="flex items-center gap-xs">
              <span>Na stronę:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-surface-container-lowest border border-outline-variant rounded-lg px-2 py-1 text-body-sm focus:outline-none focus:border-secondary cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Paginator */}
            {totalPages > 1 && (
              <div className="flex items-center gap-xs">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  className="p-1 rounded border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Pierwsza strona"
                >
                  <span className="material-symbols-outlined text-[18px]">first_page</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1 rounded border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Poprzednia strona"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="px-xs">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1 rounded border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Następna strona"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="p-1 rounded border border-outline-variant hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Ostatnia strona"
                >
                  <span className="material-symbols-outlined text-[18px]">last_page</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal szczegółów dowodu rejestracyjnego */}
      {selectedRecord && (
        <VehicleRegDetailCard
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}

      {/* Modal konfiguratora kolejności pól do schowka */}
      <VehicleCopyFieldsConfig
        isOpen={vehicleConfigOpen}
        onClose={() => setVehicleConfigOpen(false)}
      />
    </div>
  );
};

export default VehicleRegResultsView;
