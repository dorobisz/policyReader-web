import React, { useEffect, useState } from 'react';
import { useToast } from '../../../components';
import { Link } from 'react-router-dom';
import { Batch, StatsMetrics } from '../../../types/api';
import { apiService } from '../../../services/api';
import { StatusBadge, ProgressBar, MetricCard } from '../../../components';

/**
 * Formatuje identyfikator paczki do zwięzłego widoku z elipsą w środku, np. 'b83f-9a2c...4d1e'
 */
function formatBatchId(id: string): string {
  if (!id) return '';
  if (id.length <= 16) return id;
  return `${id.slice(0, 9)}...${id.slice(-4)}`;
}

export const VehicleRegBatchesView: React.FC = () => {
  const toast = useToast();
  const [metrics, setMetrics] = useState<StatsMetrics>({
    total_processed_30d: 1248,
    success_rate: 98.2,
    active_batches: 3,
  });
  const [batches, setBatches] = useState<Batch[]>([]);
  const [totalBatches, setTotalBatches] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filtrowanie i paginacja
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, batchesData] = await Promise.all([
        apiService.getDashboardMetrics(),
        apiService.getRecentBatches({
          status: statusFilter,
          page: currentPage,
          limit: pageSize,
        }),
      ]);
      setMetrics(metricsData);
      setBatches(batchesData.batches);
      setTotalBatches(batchesData.total);
    } catch (err) {
      console.error('Błąd ładowania danych dowodów rejestracyjnych:', err);
      toast.error('Błąd pobierania danych', 'Użyto danych z pamięci podręcznej.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, currentPage, pageSize]);

  // Obliczenia paginacji
  const totalPages = Math.ceil(totalBatches / pageSize) || 1;
  const startItemIndex = totalBatches === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItemIndex = Math.min(currentPage * pageSize, totalBatches);

  const handleFilterSelect = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    setIsFilterDropdownOpen(false);
  };

  const handleToggleViewAll = () => {
    if (pageSize === 4) {
      setPageSize(50);
      setCurrentPage(1);
    } else {
      setPageSize(4);
      setCurrentPage(1);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć paczkę #${batchId}?`)) {
      return;
    }
    try {
      await apiService.deleteBatch(batchId);
      toast.success('Paczka usunięta', `Paczka #${batchId} została pomyślnie usunięta.`);
      loadData();
    } catch (err: unknown) {
      console.error('Błąd usuwania paczki:', err);
      const msg = err instanceof Error ? err.message : 'Nie udało się usunąć paczki.';
      toast.error('Błąd usuwania', msg);
    }
  };

  return (
    <div className="space-y-xl max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Dowody rejestracyjne</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            Zarządzanie paczkami odczytanych dowodów rejestracyjnych pojazdów.
          </p>
        </div>

        <div className="flex items-center gap-sm relative">
          {/* Przycisk Filtra */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className={`px-md py-sm border rounded-lg font-label-bold text-label-bold transition-colors flex items-center gap-xs cursor-pointer ${
                statusFilter !== 'all'
                  ? 'border-secondary bg-surface-container-high text-secondary'
                  : 'border-outline text-on-surface hover:bg-surface-container-low'
              }`}
              aria-expanded={isFilterDropdownOpen}
              aria-label="Filtruj paczki"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              <span>Filtr</span>
              {statusFilter !== 'all' && (
                <span className="ml-xs px-1.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[10px] uppercase font-bold">
                  {statusFilter}
                </span>
              )}
            </button>

            {/* Dropdown filtrowania */}
            {isFilterDropdownOpen && (
              <div
                className="absolute right-0 mt-xs w-48 bg-surface rounded-xl border border-outline-variant shadow-lg z-30 py-xs divide-y divide-outline-variant"
                role="menu"
              >
                <div className="px-md py-xs font-label-bold text-label-bold text-on-surface-variant uppercase text-[10px]">
                  Status paczki
                </div>
                <div className="py-xs">
                  <button
                    type="button"
                    onClick={() => handleFilterSelect('all')}
                    className={`w-full text-left px-md py-sm text-body-sm flex items-center justify-between hover:bg-surface-container-low cursor-pointer ${
                      statusFilter === 'all' ? 'font-semibold text-secondary' : 'text-on-surface'
                    }`}
                  >
                    <span>Wszystkie</span>
                    {statusFilter === 'all' && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterSelect('processing')}
                    className={`w-full text-left px-md py-sm text-body-sm flex items-center justify-between hover:bg-surface-container-low cursor-pointer ${
                      statusFilter === 'processing'
                        ? 'font-semibold text-secondary'
                        : 'text-on-surface'
                    }`}
                  >
                    <span>W trakcie</span>
                    {statusFilter === 'processing' && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterSelect('completed')}
                    className={`w-full text-left px-md py-sm text-body-sm flex items-center justify-between hover:bg-surface-container-low cursor-pointer ${
                      statusFilter === 'completed'
                        ? 'font-semibold text-secondary'
                        : 'text-on-surface'
                    }`}
                  >
                    <span>Zakończone</span>
                    {statusFilter === 'completed' && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterSelect('failed')}
                    className={`w-full text-left px-md py-sm text-body-sm flex items-center justify-between hover:bg-surface-container-low cursor-pointer ${
                      statusFilter === 'failed' ? 'font-semibold text-secondary' : 'text-on-surface'
                    }`}
                  >
                    <span>Błędy</span>
                    {statusFilter === 'failed' && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Przycisk Wgraj dowody (kierujący do /upload) */}
          <Link
            to="/upload"
            className="px-md py-sm rounded-lg font-label-bold text-label-bold bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors flex items-center gap-xs shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
            <span>Wgraj dowody</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid Layout - Metryki Dowodów Rejestracyjnych */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Metryka 1: Przetworzone dowody */}
        <MetricCard
          label="Odczytane dowody (30 dni)"
          value={metrics.total_processed_30d.toLocaleString()}
          icon="directions_car"
          iconBgClass="bg-surface-container-high"
          iconColorClass="text-primary"
          loading={loading}
        />

        {/* Metryka 2: Skuteczność */}
        <MetricCard
          label="Skuteczność odczytu"
          value={metrics.success_rate}
          suffix="%"
          icon="check_circle"
          iconBgClass="bg-[rgba(0,81,213,0.1)]"
          iconColorClass="text-secondary"
          loading={loading}
        />

        {/* Metryka 3: Aktywne paczki */}
        <MetricCard
          label="Aktywne paczki"
          value={metrics.active_batches}
          icon="pending_actions"
          iconBgClass="bg-surface-container-high"
          iconColorClass="text-primary"
          loading={loading}
        />
      </div>

      {/* Tabela ostatnich paczek dowodów rejestracyjnych */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        {/* Nagłówek karty */}
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div className="flex items-center gap-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Paczki dowodów rejestracyjnych</h3>
            {statusFilter !== 'all' && (
              <span className="text-body-sm text-on-surface-variant font-normal">
                (filtr: <span className="font-medium text-on-surface">{statusFilter}</span>)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleToggleViewAll}
            className="text-secondary font-label-bold text-label-bold hover:underline transition-colors cursor-pointer"
          >
            {pageSize === 4 ? 'Pokaż wszystkie' : 'Widok zwinięty (4)'}
          </button>
        </div>

        {/* Zawartość tabeli */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-bright text-xs">
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[25%]">
                  ID Paczki
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[20%]">
                  Data dodania
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[15%]">
                  Status
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[25%]">
                  Postęp odczytu
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[10%] text-right">
                  Zdjęcia
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[5%] text-right">
                  Akcje
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant text-sm">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="animate-pulse">
                    <td className="py-sm px-md">
                      <div className="h-5 bg-surface-container rounded w-32" />
                    </td>
                    <td className="py-sm px-md">
                      <div className="h-4 bg-surface-container rounded w-28" />
                    </td>
                    <td className="py-sm px-md">
                      <div className="h-5 bg-surface-container rounded w-20" />
                    </td>
                    <td className="py-sm px-md">
                      <div className="h-3 bg-surface-container rounded w-full" />
                    </td>
                    <td className="py-sm px-md text-right">
                      <div className="h-4 bg-surface-container rounded w-8 ml-auto" />
                    </td>
                    <td className="py-sm px-md text-right">
                      <div className="h-5 bg-surface-container rounded w-6 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-xl text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-sm text-outline">
                      directions_car
                    </span>
                    <p className="font-headline-sm text-headline-sm text-on-surface">Brak paczek dowodów rejestracyjnych</p>
                    <p className="font-body-md text-body-md mt-xs">
                      {statusFilter !== 'all'
                        ? `Brak paczek o statusie "${statusFilter}". Zresetuj filtr, aby zobaczyć wszystkie.`
                        : 'Wgraj zdjęcia dowodów rejestracyjnych (JPG), aby utworzyć pierwszą paczkę.'}
                    </p>
                    {statusFilter !== 'all' ? (
                      <button
                        type="button"
                        onClick={() => handleFilterSelect('all')}
                        className="mt-md text-secondary font-label-bold text-label-bold hover:underline cursor-pointer"
                      >
                        Wyczyść filtr
                      </button>
                    ) : (
                      <Link
                        to="/upload"
                        className="inline-flex items-center gap-xs mt-md px-md py-sm rounded-lg bg-secondary text-on-secondary font-label-bold text-label-bold cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                        <span>Wgraj dowody</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const isFailed = batch.status === 'failed';
                  const formattedId = formatBatchId(batch.batch_id);
                  const targetUrl = batch.status === 'completed'
                    ? `/result/${batch.batch_id}`
                    : `/jobs/${batch.batch_id}`;

                  return (
                    <tr
                      key={batch.batch_id}
                      className="hover:bg-surface-container-low transition-colors group"
                    >
                      {/* Kolumna Batch ID */}
                      <td className="py-sm px-md">
                        <div className="flex items-center gap-sm">
                          <span
                            className={`material-symbols-outlined text-[18px] shrink-0 ${
                              isFailed ? 'text-error' : 'text-on-surface-variant'
                            }`}
                          >
                            {isFailed ? 'error' : 'directions_car'}
                          </span>
                          <Link
                            to={targetUrl}
                            title={`Przejdź do paczki: ${batch.batch_id}`}
                            className="font-body-md text-body-md text-secondary hover:underline font-medium font-mono text-sm truncate"
                          >
                            {formattedId}
                          </Link>
                        </div>
                      </td>

                      {/* Kolumna Date Added */}
                      <td className="py-sm px-md font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                        {batch.date_added}
                      </td>

                      {/* Kolumna Status */}
                      <td className="py-sm px-md whitespace-nowrap">
                        <StatusBadge status={batch.status} />
                      </td>

                      {/* Kolumna Progress */}
                      <td className="py-sm px-md">
                        <ProgressBar
                          progress={batch.progress_percentage}
                          status={batch.status}
                        />
                      </td>

                      {/* Kolumna Total Files */}
                      <td className="py-sm px-md font-body-md text-body-md text-on-surface text-right font-medium">
                        {batch.total_files}
                      </td>

                      {/* Kolumna Actions */}
                      <td className="py-sm px-md text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteBatch(batch.batch_id)}
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors cursor-pointer"
                          title="Usuń paczkę"
                          aria-label="Usuń paczkę"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Card Footer with Pagination */}
        <div className="p-sm border-t border-outline-variant bg-surface-bright flex justify-between items-center px-md text-sm text-on-surface-variant">
          <span>
            Wyświetlanie {startItemIndex}-{endItemIndex} z {totalBatches} paczek
          </span>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-1 rounded hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Poprzednia strona"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="font-body-sm text-body-sm px-xs">
              Strona {currentPage} z {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-1 rounded hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Następna strona"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleRegBatchesView;
