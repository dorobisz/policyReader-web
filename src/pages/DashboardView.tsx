import React, { useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import { Link } from 'react-router-dom';
import { Batch, StatsMetrics } from '../types/api';
import { apiService } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { ProgressBar } from '../components/ProgressBar';
import { MetricCard } from '../components/MetricCard';

/**
 * Formatuje identyfikator paczki do zwięzłego widoku z elipsą w środku, np. 'b83f-9a2c...4d1e'
 */
function formatBatchId(id: string): string {
  if (!id) return '';
  if (id.length <= 16) return id;
  return `${id.slice(0, 9)}...${id.slice(-4)}`;
}

export const DashboardView: React.FC = () => {
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
      console.error('Błąd ładowania danych dashboardu:', err);
      toast.error('Failed to load dashboard data', 'Using cached data instead.');
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

  return (
    <div className="space-y-xl max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Overview</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
            Manage your recent policy processing batches.
          </p>
        </div>

        <div className="flex items-center gap-sm relative">
          {/* Przycisk Filtra */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterDropdownOpen((prev) => !prev)}
              className={`px-md py-sm border rounded-lg font-label-bold text-label-bold transition-colors flex items-center gap-xs ${
                statusFilter !== 'all'
                  ? 'border-secondary bg-surface-container-high text-secondary'
                  : 'border-outline text-on-surface hover:bg-surface-container-low'
              }`}
              aria-expanded={isFilterDropdownOpen}
              aria-label="Filtruj paczki"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              <span>Filter</span>
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
                  Filtruj po statusie
                </div>
                <div className="py-xs">
                  <button
                    type="button"
                    onClick={() => handleFilterSelect('all')}
                    className={`w-full text-left px-md py-sm text-body-sm flex items-center justify-between hover:bg-surface-container-low ${
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
                    className={`w-full text-left px-md py-sm text-body-sm flex items-center justify-between hover:bg-surface-container-low ${
                      statusFilter === 'processing'
                        ? 'font-semibold text-secondary'
                        : 'text-on-surface'
                    }`}
                  >
                    <span>Processing</span>
                    {statusFilter === 'processing' && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterSelect('completed')}
                    className={`w-full text-left px-md py-sm text-body-sm flex items-center justify-between hover:bg-surface-container-low ${
                      statusFilter === 'completed'
                        ? 'font-semibold text-secondary'
                        : 'text-on-surface'
                    }`}
                  >
                    <span>Completed</span>
                    {statusFilter === 'completed' && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFilterSelect('failed')}
                    className={`w-full text-left px-md py-sm text-body-sm flex items-center justify-between hover:bg-surface-container-low ${
                      statusFilter === 'failed' ? 'font-semibold text-secondary' : 'text-on-surface'
                    }`}
                  >
                    <span>Failed</span>
                    {statusFilter === 'failed' && (
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Przycisk Nowego Przesyłania (Szybki skrót do /upload) */}
          <Link
            to="/upload"
            className="px-md py-sm rounded-lg font-label-bold text-label-bold bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors flex items-center gap-xs shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>Upload</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid Layout - Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Metric 1: Total Processed */}
        <MetricCard
          label="Total Processed (30d)"
          value={metrics.total_processed_30d.toLocaleString()}
          icon="description"
          iconBgClass="bg-surface-container-high"
          iconColorClass="text-primary"
          loading={loading}
        />

        {/* Metric 2: Success Rate */}
        <MetricCard
          label="Success Rate"
          value={metrics.success_rate}
          suffix="%"
          icon="check_circle"
          iconBgClass="bg-[rgba(0,81,213,0.1)]"
          iconColorClass="text-secondary"
          loading={loading}
        />

        {/* Metric 3: Active Batches */}
        <MetricCard
          label="Active Batches"
          value={metrics.active_batches}
          icon="pending_actions"
          iconBgClass="bg-surface-container-high"
          iconColorClass="text-primary"
          loading={loading}
        />
      </div>

      {/* Recent Batches Table Card */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col">
        {/* Card Header */}
        <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div className="flex items-center gap-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Recent Batches</h3>
            {statusFilter !== 'all' && (
              <span className="text-body-sm text-on-surface-variant font-normal">
                (filtered by: <span className="font-medium text-on-surface">{statusFilter}</span>)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleToggleViewAll}
            className="text-secondary font-label-bold text-label-bold hover:underline transition-colors"
          >
            {pageSize === 4 ? 'View All' : 'Show Compact (4)'}
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-bright">
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[25%]">
                  Batch ID
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[20%]">
                  Date Added
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[15%]">
                  Status
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[25%]">
                  Progress
                </th>
                <th className="py-sm px-md font-label-bold text-label-bold text-on-surface-variant w-[15%] text-right">
                  Total Files
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                // Skeletons
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
                  </tr>
                ))
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-xl text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl block mb-sm text-outline">
                      inbox
                    </span>
                    <p className="font-headline-sm text-headline-sm text-on-surface">No batches found</p>
                    <p className="font-body-md text-body-md mt-xs">
                      {statusFilter !== 'all'
                        ? `No batches matching status "${statusFilter}". Try resetting your filter.`
                        : 'Upload policy files to create your first processing batch.'}
                    </p>
                    {statusFilter !== 'all' ? (
                      <button
                        type="button"
                        onClick={() => handleFilterSelect('all')}
                        className="mt-md text-secondary font-label-bold text-label-bold hover:underline"
                      >
                        Clear Filter
                      </button>
                    ) : (
                      <Link
                        to="/upload"
                        className="inline-block mt-md px-md py-sm rounded-lg bg-secondary text-on-secondary font-label-bold text-label-bold"
                      >
                        Upload Policies
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const isFailed = batch.status === 'failed';
                  const formattedId = formatBatchId(batch.batch_id);

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
                            {isFailed ? 'error' : 'folder_zip'}
                          </span>
                          <Link
                            to={`/jobs/${batch.batch_id}`}
                            title={`Open batch details: ${batch.batch_id}`}
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
            Showing {startItemIndex}-{endItemIndex} of {totalBatches} batches
          </span>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-1 rounded hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              aria-label="Previous page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="font-body-sm text-body-sm px-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-1 rounded hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              aria-label="Next page"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
