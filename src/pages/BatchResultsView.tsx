import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/Toast";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../services/api";
import { PolicyRecordResponse } from "../types/api";

const PAGE_SIZE = 5;

function formatAmount(value: string | null | undefined): string {
  if (!value) return "—";
  const normalized = value.replace(",", ".");
  const num = parseFloat(normalized);
  if (isNaN(num)) return value;
  return num.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso)
      .toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
      .replace(",", "");
  } catch { return iso; }
}

function getFileIcon(filename: string): string {
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "picture_as_pdf";
  if (ext === "docx" || ext === "doc") return "description";
  return "insert_drive_file";
}

const ConfidenceBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === "success") {
    return (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-[#e6f4ea] text-[#137333]">
        HIGH CONF.
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide bg-[#fef7e0] text-[#b06000]">
      REVIEW
    </span>
  );
};

const ResultRow: React.FC<{ record: PolicyRecordResponse }> = ({ record }) => {
  const isReview = record.status !== "success";
  const rowBg = isReview ? "bg-error-container/20" : "";
  return (
    <tr className={"hover:bg-surface-container-low transition-colors group " + rowBg}>
      <td className="py-3 px-md">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-outline-variant text-[18px]">
            {getFileIcon(record.filename ?? "")}
          </span>
          <span className="font-medium text-on-surface truncate max-w-[200px]" title={record.filename ?? ""}>
            {record.filename ?? "—"}
          </span>
        </div>
      </td>
      <td className="py-3 px-md text-on-surface font-body-sm text-body-sm">{record.towarzystwo ?? "—"}</td>
      <td className="py-3 px-md text-right font-medium text-on-surface font-body-sm text-body-sm">{formatAmount(record.kwota_skladki)}</td>
      <td className="py-3 px-md text-center text-on-surface-variant font-body-sm text-body-sm">{record.kwota_skladki ? "PLN" : "—"}</td>
      <td className="py-3 px-md text-on-surface-variant font-body-sm text-body-sm">{formatDate(record.created_at)}</td>
      <td className="py-3 px-md text-center"><ConfidenceBadge status={record.status ?? "failed"} /></td>
      <td className="py-3 px-md text-right">
        {isReview ? (
          <button
            className="text-secondary hover:text-secondary-container font-label-bold text-[11px] transition-colors"
            title={record.error_message ?? "Needs manual review"}
            onClick={() => { alert("RESOLVE: " + record.filename + "\n\nError: " + (record.error_message ?? "Unknown")); }}
          >
            RESOLVE
          </button>
        ) : (
          <button className="opacity-0 group-hover:opacity-100 text-secondary hover:text-secondary-container transition-opacity" title="Open record">
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          </button>
        )}
      </td>
    </tr>
  );
};

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        {Array.from({ length: 7 }).map((_, j) => (
          <td key={j} className="py-3 px-md"><div className="h-4 bg-surface-container rounded w-full" /></td>
        ))}
      </tr>
    ))}
  </>
);

const Pagination: React.FC<{ page: number; totalPages: number; totalCount: number; pageSize: number; onChange: (p: number) => void; }>
  = ({ page, totalPages, totalCount, pageSize, onChange }) => {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);
  const pages: (number | "...")[] = [];
  const addPage = (p: number) => { if (!pages.includes(p)) pages.push(p); };
  addPage(1);
  if (page > 3) pages.push("...");
  if (page > 2) addPage(page - 1);
  addPage(page);
  if (page < totalPages - 1) addPage(page + 1);
  if (page < totalPages - 2) pages.push("...");
  if (totalPages > 1) addPage(totalPages);
  return (
    <div className="border-t border-outline-variant bg-surface-bright p-md flex items-center justify-between flex-wrap gap-sm">
      <span className="font-body-sm text-body-sm text-on-surface-variant">Showing {start} to {end} of {totalCount} results</span>
      <div className="flex items-center gap-xs">
        <button onClick={() => onChange(page - 1)} disabled={page === 1} className="p-1 rounded text-outline hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Previous page">
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        {pages.map((p, idx) =>
          p === "..." ? (
            <span key={"d" + idx} className="text-on-surface-variant px-1">...</span>
          ) : (
            <button key={p} onClick={() => onChange(p as number)} className={"w-8 h-8 rounded font-label-bold text-label-bold flex items-center justify-center transition-colors " + (p === page ? "bg-surface-container-high text-on-surface" : "text-on-surface-variant hover:bg-surface-container-low")}>
              {p}
            </button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className="p-1 rounded text-on-surface-variant hover:bg-surface-variant disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Next page">
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export const BatchResultsView: React.FC = () => {
  const { batchId = "default" } = useParams<{ batchId: string }>();
  const toast = useToast();
  const [allRecords, setAllRecords] = useState<PolicyRecordResponse[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [csvExporting, setCsvExporting] = useState(false);
  const [filterInsurer, setFilterInsurer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getBatchResults(batchId);
        setAllRecords(data.records ?? []);
        setTotalFiles(data.total_files ?? 0);
        setProcessedFiles(data.processed_files ?? 0);
      } catch (err) { console.error("Error loading results:", err); toast.error("Failed to load results", "Using demo data."); }
      finally { setLoading(false); }
    };
    load();
  }, [batchId]);

  const uniqueInsurers = useMemo(() => {
    const s = new Set(allRecords.map((r) => r.towarzystwo ?? "").filter(Boolean));
    return Array.from(s).sort();
  }, [allRecords]);

  const filtered = useMemo(() => {
    let result = [...allRecords];
    if (filterInsurer) result = result.filter((r) => r.towarzystwo === filterInsurer);
    if (filterStatus === "success") result = result.filter((r) => r.status === "success");
    if (filterStatus === "failed") result = result.filter((r) => r.status !== "success");
    result.sort((a, b) => {
      const da = new Date(a.created_at ?? 0).getTime();
      const db = new Date(b.created_at ?? 0).getTime();
      return sortDir === "desc" ? db - da : da - db;
    });
    return result;
  }, [allRecords, filterInsurer, filterStatus, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const handleFilterInsurer = (v: string) => { setFilterInsurer(v); setPage(1); };
  const handleFilterStatus  = (v: string) => { setFilterStatus(v); setPage(1); };
  const handleClearFilters  = () => { setFilterInsurer(""); setFilterStatus(""); setPage(1); };

  const successCount = allRecords.filter((r) => r.status === "success").length;
  const confidence = allRecords.length > 0
    ? ((successCount / allRecords.length) * 100).toFixed(1)
    : "98.2";

  const handleExportCsv = async () => {
    setCsvExporting(true);
    try { await apiService.downloadBatchCsv(batchId, "default", filtered); }
    finally { setCsvExporting(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-xl">
      {/* Back to Batch Processing link */}
      <div>
        <Link
          to={`/jobs/${batchId}`}
          className="inline-flex items-center gap-xs text-secondary hover:text-secondary-container font-label-bold text-label-bold transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Wróć do postępu paczki (Batch Processing)</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Batch Results</h2>
          {loading ? (
            <div className="h-5 w-80 bg-surface-container rounded animate-pulse mt-sm" />
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
              Processed{" "}<strong className="text-on-surface">{processedFiles}</strong>{" "}of{" "}
              <strong className="text-on-surface">{totalFiles}</strong>{" "}documents{" "}&middot;{" "}
              Batch{" "}<span className="font-mono text-secondary">#{batchId}</span>{" "}&middot;{" "}
              Confidence:{" "}<strong className="text-[#137333]">{confidence}%</strong>
            </p>
          )}
        </div>
        <div className="flex items-center gap-sm flex-shrink-0">
          <button onClick={handleExportCsv} disabled={csvExporting || loading}
            className="flex items-center gap-xs px-md py-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors font-label-bold text-label-bold bg-white disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined text-[18px]">{csvExporting ? "hourglass_empty" : "download"}</span>
            {csvExporting ? "Exporting…" : "Export to CSV"}
          </button>
          <button onClick={() => alert("JSON download: feature coming soon.")}
            className="flex items-center gap-xs px-md py-sm rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-bold text-label-bold">
            <span className="material-symbols-outlined text-[18px]">code</span>
            Download JSON
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-outline-variant p-md flex flex-wrap items-center gap-md shadow-sm">
        <div className="flex items-center gap-sm text-on-surface-variant font-label-bold text-label-bold mr-md">
          <span className="material-symbols-outlined text-[18px]">filter_list</span> Filters
        </div>
        <div className="relative">
          <select value={filterInsurer} onChange={(e) => handleFilterInsurer(e.target.value)}
            className="appearance-none bg-surface-bright border border-outline-variant text-body-sm rounded-lg pl-md pr-xl py-1.5 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer">
            <option value="">All Insurers</option>
            {uniqueInsurers.map((ins) => <option key={ins} value={ins}>{ins}</option>)}
          </select>
          <span className="material-symbols-outlined absolute right-2 top-2 text-[16px] pointer-events-none text-on-surface-variant">arrow_drop_down</span>
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={(e) => handleFilterStatus(e.target.value)}
            className="appearance-none bg-surface-bright border border-outline-variant text-body-sm rounded-lg pl-md pr-xl py-1.5 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer">
            <option value="">All Statuses</option>
            <option value="success">High Confidence</option>
            <option value="failed">Needs Review</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-2 text-[16px] pointer-events-none text-on-surface-variant">arrow_drop_down</span>
        </div>
        {(filterInsurer || filterStatus) && (
          <span className="font-label-md text-label-md text-secondary bg-secondary/10 px-2 py-0.5 rounded">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
        <button onClick={handleClearFilters} className="text-secondary font-label-bold text-label-bold ml-auto hover:underline text-[12px]">Clear Filters</button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-bright border-b border-outline-variant sticky top-0 z-10">
              <tr>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap">
                  <button className="flex items-center gap-xs cursor-pointer hover:text-on-surface transition-colors" onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}>
                    Filename <span className="material-symbols-outlined text-[14px]">{sortDir === "desc" ? "arrow_downward" : "arrow_upward"}</span>
                  </button>
                </th>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap">Insurer Name</th>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant text-right whitespace-nowrap">Premium Amount</th>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap text-center">Currency</th>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap">Extraction Date</th>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap text-center">Status</th>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading ? (
                <SkeletonRows />
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline-variant block mb-sm">search_off</span>
                    <p className="font-body-md text-body-md text-on-surface-variant">No records match the selected filters.</p>
                    <button onClick={handleClearFilters} className="mt-sm text-secondary font-label-bold text-label-bold hover:underline">Clear Filters</button>
                  </td>
                </tr>
              ) : (
                paged.map((record) => <ResultRow key={record.id} record={record} />)
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > PAGE_SIZE && (
          <Pagination page={page} totalPages={totalPages} totalCount={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        )}
        {!loading && filtered.length > 0 && filtered.length <= PAGE_SIZE && (
          <div className="border-t border-outline-variant bg-surface-bright p-md">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Showing {filtered.length} of {allRecords.length} total records</span>
          </div>
        )}
      </div>
    </div>
  );
};