import React, { useEffect, useMemo, useState } from "react";
import { useToast } from "../components/Toast";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../services/api";
import { DocumentType, PolicyRecord } from "../types/api";
import { PolicyResultsTab } from "../components/results/PolicyResultsTab";
import { VehicleRegResultsTab } from "../components/results/VehicleRegResultsTab";
import { VehicleRegDetailCard } from "../components/results/VehicleRegDetailCard";
import { VehicleCopyFieldsConfig } from "../components/settings/VehicleCopyFieldsConfig";
import { DetailModal } from "../components/results/DetailModal";

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
  const [vehicleConfigOpen, setVehicleConfigOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterInsurer, setFilterInsurer] = useState("");
  const [filterMake, setFilterMake] = useState("");
  const [filterVehicleType, setFilterVehicleType] = useState("");
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

  const uniqueVehicleTypes = useMemo(() => {
    const s = new Set(vehicleRecords.map((r) => r.extracted_data?.rodzaj_pojazdu ?? "").filter(Boolean));
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
        const makeMatch = d.marka?.toLowerCase().includes(q);
        const modelMatch = d.model?.toLowerCase().includes(q);
        const vehicleTypeMatch = d.rodzaj_pojazdu?.toLowerCase().includes(q);
        return fnameMatch || regMatch || vinMatch || companyMatch || makeMatch || modelMatch || vehicleTypeMatch;
      });
    }

    if (activeTab === "policy" && filterInsurer) {
      result = result.filter((r) => r.extracted_data?.towarzystwo === filterInsurer);
    }
    if (activeTab === "vehicle_registration" && filterMake) {
      result = result.filter((r) => r.extracted_data?.marka === filterMake);
    }
    if (activeTab === "vehicle_registration" && filterVehicleType) {
      result = result.filter((r) => r.extracted_data?.rodzaj_pojazdu === filterVehicleType);
    }

    if (filterStatus === "success") result = result.filter((r) => r.status === "success");
    if (filterStatus === "failed") result = result.filter((r) => r.status !== "success");

    result.sort((a, b) => {
      const da = new Date(a.created_at ?? 0).getTime();
      const db = new Date(b.created_at ?? 0).getTime();
      return sortDir === "desc" ? db - da : da - db;
    });
    return result;
  }, [currentTabRecords, searchQuery, filterInsurer, filterMake, filterVehicleType, filterStatus, sortDir, activeTab]);

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
    setFilterVehicleType("");
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
  const handleFilterVehicleType = (v: string) => {
    setFilterVehicleType(v);
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
    setFilterVehicleType("");
    setFilterStatus("");
    setPage(1);
  };

  const isFiltered = Boolean(searchQuery.trim() || filterInsurer || filterMake || filterVehicleType || filterStatus);

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
            <div className="h-10 w-80 bg-surface-container rounded animate-pulse mt-sm" />
          ) : (
            <div className="font-body-md text-body-md text-on-surface-variant mt-sm">
              <p>
                Przetworzono <strong className="text-on-surface">{processedFiles}</strong> z{" "}
                <strong className="text-on-surface">{totalFiles}</strong> dokumentów &middot; Paczka{" "}
                <span className="font-mono text-secondary">#{batchId}</span>
              </p>
              <p className="mt-0.5">
                Skuteczność: <strong className="text-emerald-600">{successRate}%</strong>
              </p>
            </div>
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

          {activeTab === "vehicle_registration" && (
            <button
              type="button"
              onClick={() => setVehicleConfigOpen(true)}
              className="p-2 rounded-xl border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low hover:text-secondary transition-colors cursor-pointer shadow-xs flex items-center justify-center"
              title="Konfiguruj kolumny eksportu CSV / kopiowania"
              aria-label="Konfiguracja kolumn eksportu CSV"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
          )}
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
                : "Szukaj po nazwie pliku, nr rej, marce, modelu, rodzaju, VIN..."
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
          <>
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

            <select
              value={filterVehicleType}
              onChange={(e) => handleFilterVehicleType(e.target.value)}
              className="bg-surface-bright border border-outline-variant text-xs rounded-lg pl-3 pr-8 py-1.5 focus:ring-2 focus:ring-secondary focus:border-secondary outline-none cursor-pointer"
            >
              <option value="">Wszystkie rodzaje pojazdów</option>
              {uniqueVehicleTypes.map((vt) => (
                <option key={vt} value={vt}>
                  {vt}
                </option>
              ))}
            </select>
          </>
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

      {/* Modal konfiguracji kolumn dowodu rejestracyjnego (dla CSV i schowka) */}
      <VehicleCopyFieldsConfig
        isOpen={vehicleConfigOpen}
        onClose={() => setVehicleConfigOpen(false)}
      />
    </div>
  );
};