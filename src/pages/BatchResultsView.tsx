import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/Toast";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../services/api";
import { PolicyRecordResponse } from "../types/api";

function formatPremium(value: string | null | undefined): string {
  if (!value) return "—";
  const cleaned = value.replace(/pln|zł/gi, "").trim();
  const normalized = cleaned.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(normalized);
  if (isNaN(num)) return value.toUpperCase().includes("PLN") ? value : `${value} PLN`;
  return `${num.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN`;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso)
      .toLocaleString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
      .replace(",", "");
  } catch {
    return iso;
  }
}

function formatFileSize(bytesOrStr: number | string | null | undefined): string {
  if (bytesOrStr == null) return "—";
  if (typeof bytesOrStr === "string") {
    if (bytesOrStr.includes("KB") || bytesOrStr.includes("MB") || bytesOrStr.includes("B")) return bytesOrStr;
    const n = parseInt(bytesOrStr, 10);
    if (isNaN(n)) return bytesOrStr;
    bytesOrStr = n;
  }
  if (bytesOrStr < 1024) return `${bytesOrStr} B`;
  if (bytesOrStr < 1024 * 1024) return `${(bytesOrStr / 1024).toFixed(1)} KB`;
  return `${(bytesOrStr / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileIcon(filename: string): string {
  const ext = filename?.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "picture_as_pdf";
  if (ext === "docx" || ext === "doc") return "description";
  return "insert_drive_file";
}

const StatusBadge: React.FC<{ status: string; errorMessage?: string | null }> = ({
  status,
  errorMessage,
}) => {
  if (status === "success") {
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
      title={errorMessage || "Błąd przetwarzania dokumentu"}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
      FAIL
    </span>
  );
};

interface ResultRowProps {
  record: PolicyRecordResponse;
  onPreview: (record: PolicyRecordResponse) => void;
}

const ResultRow: React.FC<ResultRowProps> = ({ record, onPreview }) => {
  const isFail = record.status !== "success";
  const rowBg = isFail ? "bg-rose-50/20" : "";

  return (
    <tr className={`hover:bg-surface-container-low transition-colors group ${rowBg}`}>
      {/* Nazwa pliku */}
      <td className="py-3 px-md">
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-outline-variant text-[18px]">
            {getFileIcon(record.filename ?? "")}
          </span>
          <span
            className="font-medium text-on-surface truncate max-w-[260px]"
            title={record.filename ?? ""}
          >
            {record.filename ?? "—"}
          </span>
        </div>
      </td>

      {/* Towarzystwo */}
      <td className="py-3 px-md text-on-surface font-body-sm text-body-sm">
        {record.towarzystwo ?? "—"}
      </td>

      {/* Składka (połączona kwota i waluta) */}
      <td className="py-3 px-md text-right font-medium text-on-surface font-body-sm text-body-sm whitespace-nowrap">
        {formatPremium(record.kwota_skladki)}
      </td>

      {/* Data przetworzenia */}
      <td className="py-3 px-md text-on-surface-variant font-body-sm text-body-sm whitespace-nowrap">
        {formatDate(record.created_at)}
      </td>

      {/* Status SUCCESS / FAIL */}
      <td className="py-3 px-md text-center whitespace-nowrap">
        <StatusBadge status={record.status ?? "failed"} errorMessage={record.error_message} />
      </td>

      {/* Podgląd z ikonką oka */}
      <td className="py-3 px-md text-center whitespace-nowrap">
        <button
          onClick={() => onPreview(record)}
          className="p-1.5 rounded-lg text-secondary hover:bg-secondary/10 hover:text-secondary-container transition-colors inline-flex items-center justify-center cursor-pointer"
          title="Podgląd danych wyekstrahowanych z PDF"
          aria-label="Podgląd danych"
        >
          <span className="material-symbols-outlined text-[20px]">visibility</span>
        </button>
      </td>
    </tr>
  );
};

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: 5 }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        {Array.from({ length: 6 }).map((_, j) => (
          <td key={j} className="py-3 px-md">
            <div className="h-4 bg-surface-container rounded w-full" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

interface DetailModalProps {
  record: PolicyRecordResponse | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ record, onClose }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!record) return null;

  const EXCLUDED_KEYS = new Set([
    "id",
    "batch_id",
    "tenant_id",
    "status",
    "current_phase",
    "ocr_used",
    "czas_procesu_sek",
    "error_message",
    "file_size",
    "file_size_bytes",
    "created_at",
    "processing_started_at",
    "ocr_duration_ms",
    "ocr_pages",
    "ocr_chars",
    "llm_duration_ms",
    "parse_duration_ms",
    "completed_at",
    "total_duration_ms",
    "retry_count",
    "progress_message",
  ]);

  const documentData: Record<string, any> = {
    filename: record.filename,
    towarzystwo: record.towarzystwo,
    kwota_skladki: record.kwota_skladki,
  };

  Object.entries(record).forEach(([key, value]) => {
    if (!EXCLUDED_KEYS.has(key) && !(key in documentData)) {
      documentData[key] = value;
    }
  });

  const rawJson = JSON.stringify(documentData, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Błąd kopiowania do schowka:", err);
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
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors"
            aria-label="Zamknij"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Główne informacje o dokumencie: tylko nazwa pliku, rozmiar, towarzystwo i status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-bright p-4 rounded-xl border border-outline-variant/60">
            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">
                Nazwa pliku
              </span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline-variant text-[18px]">
                  {getFileIcon(record.filename ?? "")}
                </span>
                <span className="font-semibold text-sm text-on-surface break-all">
                  {record.filename ?? "—"}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">
                Rozmiar pliku
              </span>
              <span className="font-semibold text-sm text-on-surface">
                {formatFileSize(record.file_size_bytes ?? record.file_size)}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">
                Towarzystwo ubezpieczeniowe
              </span>
              <span className="font-semibold text-sm text-on-surface">
                {record.towarzystwo ?? "—"}
              </span>
            </div>

            <div>
              <span className="text-xs font-medium text-on-surface-variant block mb-1">
                Status odczytu
              </span>
              <div>
                <StatusBadge status={record.status ?? "failed"} errorMessage={record.error_message} />
              </div>
            </div>
          </div>

          {/* Alert błędu jeśli FAIL */}
          {record.status !== "success" && record.error_message && (
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
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-outline-variant bg-white hover:bg-surface-container-low transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px] text-secondary">
                  {copied ? "check" : "content_copy"}
                </span>
                <span>{copied ? "Skopiowano!" : "Kopiuj JSON"}</span>
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
            className="px-5 py-2 rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-medium text-sm"
          >
            Zamknij
          </button>
        </div>
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

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterInsurer, setFilterInsurer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Record for Preview Modal
  const [selectedRecord, setSelectedRecord] = useState<PolicyRecordResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getBatchResults(batchId);
        setAllRecords(data.records ?? []);
        setTotalFiles(data.total_files ?? 0);
        setProcessedFiles(data.processed_files ?? 0);
      } catch (err) {
        console.error("Error loading results:", err);
        toast.error("Nie udało się załadować wyników", "Załadowano dane demonstracyjne.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [batchId]);

  const uniqueInsurers = useMemo(() => {
    const s = new Set(allRecords.map((r) => r.towarzystwo ?? "").filter(Boolean));
    return Array.from(s).sort();
  }, [allRecords]);

  const filtered = useMemo(() => {
    let result = [...allRecords];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => r.filename?.toLowerCase().includes(q));
    }
    if (filterInsurer) result = result.filter((r) => r.towarzystwo === filterInsurer);
    if (filterStatus === "success") result = result.filter((r) => r.status === "success");
    if (filterStatus === "failed") result = result.filter((r) => r.status !== "success");

    result.sort((a, b) => {
      const da = new Date(a.created_at ?? 0).getTime();
      const db = new Date(b.created_at ?? 0).getTime();
      return sortDir === "desc" ? db - da : da - db;
    });
    return result;
  }, [allRecords, searchQuery, filterInsurer, filterStatus, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const handleSearchChange = (v: string) => {
    setSearchQuery(v);
    setPage(1);
  };
  const handleFilterInsurer = (v: string) => {
    setFilterInsurer(v);
    setPage(1);
  };
  const handleFilterStatus = (v: string) => {
    setFilterStatus(v);
    setPage(1);
  };
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(1);
  };
  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterInsurer("");
    setFilterStatus("");
    setPage(1);
  };

  const isFiltered = Boolean(searchQuery.trim() || filterInsurer || filterStatus);

  const successCount = allRecords.filter((r) => r.status === "success").length;
  const successRate =
    allRecords.length > 0 ? ((successCount / allRecords.length) * 100).toFixed(1) : "100.0";

  const handleExportCsv = async () => {
    setCsvExporting(true);
    try {
      await apiService.downloadBatchCsv(batchId, "default", filtered);
      toast.success("Eksport CSV", "Plik CSV został pomyślnie wygenerowany i pobrany.");
    } catch {
      toast.error("Błąd eksportu", "Nie udało się wyeksportować pliku CSV.");
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
        records: filtered,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `batch_${batchId}_results.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Eksport JSON", "Plik JSON został pomyślnie pobrany.");
    } catch (err) {
      console.error("Błąd pobierania JSON:", err);
      toast.error("Błąd eksportu", "Nie udało się wygenerować pliku JSON.");
    }
  };

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, filtered.length);

  return (
    <div className="max-w-6xl mx-auto space-y-xl">
      {/* Powrót do widoku postępu paczki */}
      <div>
        <Link
          to={`/jobs/${batchId}`}
          className="inline-flex items-center gap-xs text-secondary hover:text-secondary-container font-label-bold text-label-bold transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Wróć do postępu paczki (Batch Processing)</span>
        </Link>
      </div>

      {/* Nagłówek strony */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">
            Wyniki paczki (Batch Results)
          </h2>
          {loading ? (
            <div className="h-5 w-80 bg-surface-container rounded animate-pulse mt-sm" />
          ) : (
            <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
              Przetworzono <strong className="text-on-surface">{processedFiles}</strong> z{" "}
              <strong className="text-on-surface">{totalFiles}</strong> dokumentów &middot; Paczka{" "}
              <span className="font-mono text-secondary">#{batchId}</span> &middot; Skuteczność:{" "}
              <strong className="text-emerald-600">{successRate}%</strong>
            </p>
          )}
        </div>
        <div className="flex items-center gap-sm flex-shrink-0">
          <button
            onClick={handleExportCsv}
            disabled={csvExporting || loading}
            className="flex items-center gap-xs px-md py-sm rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors font-label-bold text-label-bold bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">
              {csvExporting ? "hourglass_empty" : "download"}
            </span>
            {csvExporting ? "Eksportowanie…" : "Eksportuj do CSV"}
          </button>
          <button
            onClick={handleDownloadJson}
            disabled={loading}
            className="flex items-center gap-xs px-md py-sm rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-bold text-label-bold shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">code</span>
            Pobierz JSON
          </button>
        </div>
      </div>

      {/* Pasek wyszukiwania i filtrów */}
      <div className="bg-white rounded-xl border border-outline-variant p-md flex flex-wrap items-center gap-md shadow-sm">
        <div className="flex items-center gap-sm text-on-surface-variant font-label-bold text-label-bold">
          <span className="material-symbols-outlined text-[18px]">filter_list</span> Filtry
        </div>

        {/* Wyszukiwarka po nazwie pliku */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] text-on-surface-variant pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Szukaj po nazwie pliku..."
            className="w-full bg-surface-bright border border-outline-variant text-body-sm rounded-lg pl-9 pr-3 py-1.5 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none placeholder:text-on-surface-variant/60"
          />
        </div>

        {/* Filtr towarzystw ubezpieczeniowych */}
        <div className="relative">
          <select
            value={filterInsurer}
            onChange={(e) => handleFilterInsurer(e.target.value)}
            className="appearance-none bg-surface-bright border border-outline-variant text-body-sm rounded-lg pl-3 pr-8 py-1.5 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
          >
            <option value="">Wszystkie towarzystwa</option>
            {uniqueInsurers.map((ins) => (
              <option key={ins} value={ins}>
                {ins}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 top-2 text-[16px] pointer-events-none text-on-surface-variant">
            arrow_drop_down
          </span>
        </div>

        {/* Filtr statusu SUCCESS / FAIL */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => handleFilterStatus(e.target.value)}
            className="appearance-none bg-surface-bright border border-outline-variant text-body-sm rounded-lg pl-3 pr-8 py-1.5 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
          >
            <option value="">Wszystkie statusy</option>
            <option value="success">SUCCESS (Odczytane)</option>
            <option value="failed">FAIL (Błędy)</option>
          </select>
          <span className="material-symbols-outlined absolute right-2 top-2 text-[16px] pointer-events-none text-on-surface-variant">
            arrow_drop_down
          </span>
        </div>

        {isFiltered && (
          <span className="font-label-md text-label-md text-secondary bg-secondary/10 px-2 py-0.5 rounded">
            {filtered.length} wynik{filtered.length === 1 ? "" : filtered.length > 4 ? "ów" : "i"}
          </span>
        )}

        {isFiltered && (
          <button
            onClick={handleClearFilters}
            className="text-secondary font-label-bold text-label-bold ml-auto hover:underline text-[12px] cursor-pointer"
          >
            Wyczyść filtry
          </button>
        )}
      </div>

      {/* Tabela wyników */}
      <div className="bg-white rounded-xl border border-outline-variant overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-bright border-b border-outline-variant sticky top-0 z-10">
              <tr>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap">
                  <button
                    className="flex items-center gap-xs cursor-pointer hover:text-on-surface transition-colors"
                    onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                  >
                    Nazwa pliku{" "}
                    <span className="material-symbols-outlined text-[14px]">
                      {sortDir === "desc" ? "arrow_downward" : "arrow_upward"}
                    </span>
                  </button>
                </th>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap">
                  Towarzystwo
                </th>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant text-right whitespace-nowrap">
                  Składka
                </th>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap">
                  Data odczytu
                </th>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap text-center">
                  Status
                </th>
                <th className="py-md px-md font-label-bold text-label-bold text-on-surface-variant whitespace-nowrap text-center">
                  Podgląd
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/50">
              {loading ? (
                <SkeletonRows />
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline-variant block mb-sm">
                      search_off
                    </span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Brak rekordów spełniających wybrane kryteria filtrowania.
                    </p>
                    {isFiltered && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-sm text-secondary font-label-bold text-label-bold hover:underline cursor-pointer"
                      >
                        Wyczyść filtry
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paged.map((record) => (
                  <ResultRow
                    key={record.id}
                    record={record}
                    onPreview={(rec) => setSelectedRecord(rec)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pasek dolny: Wybór liczby wierszy + Paginacja */}
        {!loading && filtered.length > 0 && (
          <div className="border-t border-outline-variant bg-surface-bright p-md flex items-center justify-between flex-wrap gap-md">
            {/* Wybór liczby na stronę */}
            <div className="flex items-center gap-sm">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Wierszy na stronę:
              </span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="appearance-none bg-surface-bright border border-outline-variant text-body-sm rounded-lg pl-2.5 pr-7 py-1 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="material-symbols-outlined absolute right-1.5 top-1.5 text-[16px] pointer-events-none text-on-surface-variant">
                  arrow_drop_down
                </span>
              </div>
              <span className="font-body-sm text-body-sm text-on-surface-variant ml-md hidden sm:inline">
                Wyświetlanie {startIdx}–{endIdx} z {filtered.length} wyników
              </span>
            </div>

            {/* Przyciski stron */}
            {totalPages > 1 && (
              <div className="flex items-center gap-xs ml-auto">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded-lg text-outline hover:bg-surface-variant disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Poprzednia strona"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, idx) =>
                    p === "..." ? (
                      <span key={`dots-${idx}`} className="text-on-surface-variant px-1">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-8 h-8 rounded-lg font-label-bold text-label-bold flex items-center justify-center transition-colors cursor-pointer ${
                          p === page
                            ? "bg-secondary text-white shadow-xs"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-variant disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Następna strona"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal ze szczegółami i surowym JSON-em */}
      <DetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  );
};