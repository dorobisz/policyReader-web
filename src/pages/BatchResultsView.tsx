import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/Toast";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../services/api";
import { DocumentRecordResponse, DocumentType, PolicyRecord } from "../types/api";
import { PolicyResultsTab } from "../components/results/PolicyResultsTab";
import { VehicleRegResultsTab } from "../components/results/VehicleRegResultsTab";
import { VehicleRegDetailCard } from "../components/results/VehicleRegDetailCard";


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
  if (["jpg", "jpeg", "png", "webp"].includes(ext || "")) return "image";
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

interface DetailModalProps {
  record: DocumentRecordResponse | null;
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

  const rawJson = JSON.stringify(record.extracted_data || {}, null, 2);

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
          {/* Główne informacje o dokumencie i polisie w zwięzłej formie */}
          <div className="bg-surface-bright rounded-xl border border-outline-variant/60 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  {getFileIcon(record.filename ?? "")}
                </span>
                <span className="font-semibold text-sm text-on-surface truncate max-w-sm" title={record.filename}>
                  {record.filename ?? "—"}
                </span>
                <span className="text-xs text-on-surface-variant font-normal">
                  ({formatFileSize(record.file_size_bytes ?? record.file_size)})
                </span>
              </div>
              <StatusBadge status={record.status ?? "failed"} errorMessage={record.error_message} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Numer polisy:</span>
                <span className="font-mono font-semibold text-on-surface">
                  {record.extracted_data?.numer_polisy || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Towarzystwo:</span>
                <span className="font-semibold text-secondary">
                  {record.extracted_data?.towarzystwo || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Składka:</span>
                <span className="font-semibold text-on-surface">
                  {record.extracted_data?.kwota_skladki ? `${record.extracted_data.kwota_skladki} PLN` : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Okres ubezpieczenia:</span>
                <span className="font-medium text-on-surface">
                  {record.extracted_data?.okres_ubezpieczenia_od || record.extracted_data?.okres_ubezpieczenia_do
                    ? `${record.extracted_data?.okres_ubezpieczenia_od || "—"} do ${record.extracted_data?.okres_ubezpieczenia_do || "—"}`
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Ubezpieczający:</span>
                <span className="font-medium text-on-surface truncate max-w-[200px]" title={record.extracted_data?.ubezpieczajacy}>
                  {record.extracted_data?.ubezpieczajacy || "—"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/20">
                <span className="text-on-surface-variant font-medium text-[11px]">Ubezpieczony:</span>
                <span className="font-medium text-on-surface truncate max-w-[200px]" title={record.extracted_data?.ubezpieczony}>
                  {record.extracted_data?.ubezpieczony || "—"}
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
  const [allRecords, setAllRecords] = useState<PolicyRecord[]>([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [loading, setLoading] = useState(true);
  const [csvExporting, setCsvExporting] = useState(false);

  // Zakładki (Tabs) & Eksport (uzależniony od aktywnej zakładki)
  const [activeTab, setActiveTab] = useState<DocumentType>("policy");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterInsurer, setFilterInsurer] = useState("");
  const [filterMake, setFilterMake] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortDir] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Record for Preview Modal
  const [selectedRecord, setSelectedRecord] = useState<PolicyRecord | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiService.getBatchResults(batchId);
        const records = (data.records ?? []) as PolicyRecord[];
        setAllRecords(records);
        setTotalFiles(data.total_files ?? 0);
        setProcessedFiles(data.processed_files ?? 0);

        // Automatyczny wybór aktywnej zakładki: jeśli są same dowody, otwórz dowody
        const hasPolicies = records.some((r) => (r.document_type || "policy") === "policy");
        const hasVehicles = records.some((r) => r.document_type === "vehicle_registration");
        if (!hasPolicies && hasVehicles) {
          setActiveTab("vehicle_registration");
        }
      } catch (err) {
        console.error("Error loading results:", err);
        toast.error("Nie udało się załadować wyników", "Załadowano dane demonstracyjne.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [batchId]);

  // Podział rekordów na typy
  const policyRecords = useMemo(
    () => allRecords.filter((r) => (r.document_type || "policy") === "policy"),
    [allRecords]
  );
  const vehicleRecords = useMemo(
    () => allRecords.filter((r) => r.document_type === "vehicle_registration"),
    [allRecords]
  );

  // Listy wartości do filtrów
  const uniqueInsurers = useMemo(() => {
    const s = new Set(policyRecords.map((r) => r.extracted_data?.towarzystwo ?? "").filter(Boolean));
    return Array.from(s).sort();
  }, [policyRecords]);

  const uniqueMakes = useMemo(() => {
    const s = new Set(vehicleRecords.map((r) => r.extracted_data?.marka ?? "").filter(Boolean));
    return Array.from(s).sort();
  }, [vehicleRecords]);

  // Filtrowanie rekordów dla aktualnie wybranej zakładki
  const currentTabRecords = activeTab === "policy" ? policyRecords : vehicleRecords;

  const filtered = useMemo(() => {
    let result = [...currentTabRecords];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const fnameMatch = r.filename?.toLowerCase().includes(q);
        const d = r.extracted_data || {};
        const regMatch = d.numer_rejestracyjny?.toLowerCase().includes(q);
        const vinMatch = d.vin?.toLowerCase().includes(q);
        const companyMatch = d.towarzystwo?.toLowerCase().includes(q);
        return fnameMatch || regMatch || vinMatch || companyMatch;
      });
    }

    if (activeTab === "policy" && filterInsurer) {
      result = result.filter((r) => r.extracted_data?.towarzystwo === filterInsurer);
    }
    if (activeTab === "vehicle_registration" && filterMake) {
      result = result.filter((r) => r.extracted_data?.marka === filterMake);
    }

    if (filterStatus === "success") result = result.filter((r) => r.status === "success");
    if (filterStatus === "failed") result = result.filter((r) => r.status !== "success");

    result.sort((a, b) => {
      const da = new Date(a.created_at ?? 0).getTime();
      const db = new Date(b.created_at ?? 0).getTime();
      return sortDir === "desc" ? db - da : da - db;
    });
    return result;
  }, [currentTabRecords, searchQuery, filterInsurer, filterMake, filterStatus, sortDir, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const handleTabChange = (tab: DocumentType) => {
    setActiveTab(tab);
    setPage(1);
    setSearchQuery("");
    setFilterInsurer("");
    setFilterMake("");
    setFilterStatus("");
  };

  const handleSearchChange = (v: string) => {
    setSearchQuery(v);
    setPage(1);
  };
  const handleFilterInsurer = (v: string) => {
    setFilterInsurer(v);
    setPage(1);
  };
  const handleFilterMake = (v: string) => {
    setFilterMake(v);
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
    setFilterMake("");
    setFilterStatus("");
    setPage(1);
  };

  const isFiltered = Boolean(searchQuery.trim() || filterInsurer || filterMake || filterStatus);

  const successCount = allRecords.filter((r) => r.status === "success").length;
  const successRate =
    allRecords.length > 0 ? ((successCount / allRecords.length) * 100).toFixed(1) : "100.0";

  // Eksport CSV ze sparametryzowanym typem dokumentu uzależnionym od aktywnej zakładki
  const handleExportCsv = async () => {
    setCsvExporting(true);
    try {
      await apiService.downloadBatchCsv(batchId, activeTab, "default", allRecords);
      const label = activeTab === "vehicle_registration" ? "Dowody rejestracyjne" : "Polisy";
      toast.success("Eksport CSV", `Plik CSV (${label}) został pomyślnie wygenerowany.`);
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
        document_type: activeTab,
        records: filtered,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const fileSuffix = activeTab === "vehicle_registration" ? "dowody_rejestracyjne" : "polisy";
      a.download = `batch_${batchId}_${fileSuffix}_results.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      const label = activeTab === "vehicle_registration" ? "Dowody rejestracyjne" : "Polisy";
      toast.success("Eksport JSON", `Plik JSON (${label}) został pomyślnie pobrany.`);
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

      {/* Nagłówek strony + Eksport z automatycznym typem z aktywnej zakładki */}
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

        {/* Panel akcji: eksport CSV i JSON zależny od aktywnej zakładki */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          <button
            onClick={handleExportCsv}
            disabled={csvExporting || loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors font-semibold text-xs shadow-xs cursor-pointer disabled:opacity-50"
            title={
              activeTab === "vehicle_registration"
                ? "Eksportuj dowody rejestracyjne do pliku CSV"
                : "Eksportuj polisy ubezpieczeniowe do pliku CSV"
            }
          >
            <span className="material-symbols-outlined text-[16px]">
              {csvExporting ? "hourglass_empty" : "download"}
            </span>
            <span>
              {csvExporting
                ? "Eksportowanie…"
                : activeTab === "vehicle_registration"
                ? "Eksportuj CSV (Dowody)"
                : "Eksportuj CSV (Polisy)"}
            </span>
          </button>

          <button
            onClick={handleDownloadJson}
            disabled={loading}
            className="flex items-center gap-xs px-3.5 py-2 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-semibold text-xs shadow-xs cursor-pointer"
            title={
              activeTab === "vehicle_registration"
                ? "Pobierz dane dowodów rejestracyjnych w formacie JSON"
                : "Pobierz dane polis w formacie JSON"
            }
          >
            <span className="material-symbols-outlined text-[16px]">code</span>
            <span>
              {activeTab === "vehicle_registration" ? "Pobierz JSON (Dowody)" : "Pobierz JSON (Polisy)"}
            </span>
          </button>
        </div>
      </div>

      {/* Pasek zakładek (Tabs) */}
      <div className="flex items-center gap-2 border-b border-outline-variant pb-px">
        <button
          type="button"
          onClick={() => handleTabChange("policy")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors cursor-pointer border-b-2 ${
            activeTab === "policy"
              ? "border-secondary text-secondary bg-secondary/5"
              : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">description</span>
          <span>Polisy ubezpieczeniowe</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === "policy"
                ? "bg-secondary text-on-secondary"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {policyRecords.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("vehicle_registration")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors cursor-pointer border-b-2 ${
            activeTab === "vehicle_registration"
              ? "border-secondary text-secondary bg-secondary/5"
              : "border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">directions_car</span>
          <span>Dowody rejestracyjne</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === "vehicle_registration"
                ? "bg-secondary text-on-secondary"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            {vehicleRecords.length}
          </span>
        </button>
      </div>

      {/* Pasek wyszukiwania i filtrów dostosowany do aktywnej zakładki */}
      <div className="bg-white rounded-xl border border-outline-variant p-md flex flex-wrap items-center gap-md shadow-sm">
        <div className="flex items-center gap-sm text-on-surface-variant font-label-bold text-label-bold">
          <span className="material-symbols-outlined text-[18px]">filter_list</span> Filtry
        </div>

        {/* Wyszukiwarka */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-[18px] text-on-surface-variant pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={
              activeTab === "policy"
                ? "Szukaj po nazwie pliku, towarzystwie..."
                : "Szukaj po nazwie pliku, nr rej, VIN..."
            }
            className="w-full bg-surface-bright border border-outline-variant text-body-sm rounded-lg pl-9 pr-3 py-1.5 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none placeholder:text-on-surface-variant/60"
          />
        </div>

        {/* Filtr towarzystw (Polisy) */}
        {activeTab === "policy" && (
          <select
            value={filterInsurer}
            onChange={(e) => handleFilterInsurer(e.target.value)}
            className="bg-surface-bright border border-outline-variant text-xs rounded-lg pl-3 pr-8 py-1.5 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
          >
            <option value="">Wszystkie towarzystwa</option>
            {uniqueInsurers.map((ins) => (
              <option key={ins} value={ins}>
                {ins}
              </option>
            ))}
          </select>
        )}

        {/* Filtr marek pojazdów (Dowody rejestracyjne) */}
        {activeTab === "vehicle_registration" && (
          <select
            value={filterMake}
            onChange={(e) => handleFilterMake(e.target.value)}
            className="bg-surface-bright border border-outline-variant text-xs rounded-lg pl-3 pr-8 py-1.5 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
          >
            <option value="">Wszystkie marki</option>
            {uniqueMakes.map((mk) => (
              <option key={mk} value={mk}>
                {mk}
              </option>
            ))}
          </select>
        )}

        {/* Filtr statusu SUCCESS / FAIL */}
        <select
          value={filterStatus}
          onChange={(e) => handleFilterStatus(e.target.value)}
          className="bg-surface-bright border border-outline-variant text-xs rounded-lg pl-3 pr-8 py-1.5 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
        >
          <option value="">Wszystkie statusy</option>
          <option value="success">SUCCESS (Odczytane)</option>
          <option value="failed">FAIL (Błędy)</option>
        </select>

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

      {/* Tabele wyników per wybrana zakładka */}
      {loading ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-on-surface">Ładowanie wyników paczki...</p>
        </div>
      ) : activeTab === "policy" ? (
        <PolicyResultsTab records={paged} onSelectRecord={setSelectedRecord} />
      ) : (
        <VehicleRegResultsTab records={paged} onSelectRecord={setSelectedRecord} />
      )}

      {/* Paginacja */}
      {!loading && filtered.length > 0 && (
        <div className="border border-outline-variant rounded-xl bg-white p-md flex items-center justify-between flex-wrap gap-md shadow-sm">
          <div className="flex items-center gap-sm">
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Wierszy na stronę:
            </span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="bg-surface-bright border border-outline-variant text-xs rounded-lg pl-2.5 pr-7 py-1 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="font-body-sm text-body-sm text-on-surface-variant ml-md hidden sm:inline">
              Wyświetlanie {startIdx}–{endIdx} z {filtered.length} wyników
            </span>
          </div>

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

      {/* Dynamiczny modal podglądu zależny od rodzaju dokumentu */}
      {selectedRecord &&
        (selectedRecord.document_type === "vehicle_registration" ? (
          <VehicleRegDetailCard
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        ) : (
          <DetailModal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        ))}
    </div>
  );
};