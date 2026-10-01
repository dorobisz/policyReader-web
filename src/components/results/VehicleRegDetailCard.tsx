import React, { useState, useEffect, useMemo } from 'react';
import { PolicyRecord } from '../../types/api';
import { useVehicleCopySettings } from '../../hooks/useVehicleCopySettings';
import { VEHICLE_FIELD_DEFINITIONS, VEHICLE_SECTIONS } from '../../config/vehicleFields';
import { VehicleCopyFieldsConfig } from '../settings/VehicleCopyFieldsConfig';

interface VehicleRegDetailCardProps {
  record: PolicyRecord;
  onClose: () => void;
}

export const VehicleRegDetailCard: React.FC<VehicleRegDetailCardProps> = ({ record, onClose }) => {
  const [copiedExcel, setCopiedExcel] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [includeHeaders, setIncludeHeaders] = useState(false);
  const { fields } = useVehicleCopySettings();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const d = record.extracted_data || {};
  const isSuccess = record.status === 'success';

  // Przygotowanie pól pogrupowanych według 5 sekcji
  const sectionsData = useMemo(() => {
    return VEHICLE_SECTIONS.map((section) => {
      const sectionFields = VEHICLE_FIELD_DEFINITIONS.filter((f) => f.section === section.id).map(
        (def) => {
          const rawVal = d[def.key];
          let formattedVal: string | null = null;
          if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
            formattedVal = def.displaySuffix ? `${rawVal}${def.displaySuffix}` : String(rawVal);
          }
          return {
            key: def.key,
            label: def.label,
            value: formattedVal,
            isMono: def.isMono,
          };
        }
      );
      return {
        ...section,
        fields: sectionFields,
      };
    });
  }, [d]);

  // Kopiowanie wiersza do Excela zgodnie z konfiguracją z bazy
  const handleCopyExcelRow = () => {
    const enabledFields = [...fields]
      .filter((f) => f.enabled)
      .sort((a, b) => a.order - b.order);

    const values = enabledFields.map((f) => {
      const val = d[f.key];
      return val !== undefined && val !== null ? String(val) : '';
    });

    if (includeHeaders) {
      const headers = enabledFields.map((f) => {
        const def = VEHICLE_FIELD_DEFINITIONS.find((item) => item.key === f.key);
        return def?.label ?? f.key;
      });
      navigator.clipboard.writeText(`${headers.join('\t')}\n${values.join('\t')}`);
    } else {
      navigator.clipboard.writeText(values.join('\t'));
    }

    setCopiedExcel(true);
    setTimeout(() => setCopiedExcel(false), 2000);
  };

  // Kopiowanie surowego JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(d, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-outline-variant shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nagłówek modala */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-bright shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-[24px]">directions_car</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-on-surface">Dowód Rejestracyjny</h3>
                {d.numer_rejestracyjny && (
                  <span className="px-2.5 py-0.5 rounded-md font-mono font-bold text-xs bg-surface-container text-on-surface border border-outline-variant">
                    {d.numer_rejestracyjny}
                  </span>
                )}
                {d.rodzaj_pojazdu && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium text-secondary bg-secondary/10 border border-secondary/20">
                    {d.rodzaj_pojazdu}
                  </span>
                )}
                {d.nr_dowodu_rejestracyjnego && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono text-on-surface-variant bg-surface-container-low border border-outline-variant/60">
                    DR: {d.nr_dowodu_rejestracyjnego}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    isSuccess
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {isSuccess ? 'SUCCESS' : 'FAIL'}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant truncate max-w-xl mt-0.5">
                Plik: <span className="font-medium text-on-surface">{record.filename}</span>
                {record.czas_procesu_sek != null && (
                  <span className="ml-2 text-on-surface-variant/70">
                    &middot; Czas odczytu: {record.czas_procesu_sek.toFixed(1)}s
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Zamknij"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Pasek akcji zbiorczych */}
        <div className="px-6 py-2.5 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleCopyExcelRow}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                copiedExcel
                  ? 'bg-emerald-600 text-white'
                  : 'bg-secondary text-on-secondary hover:bg-secondary/90'
              }`}
              title="Kopiuje wartości do wklejenia w Excelu (rozdzielane tabulatorem)"
            >
              <span className="material-symbols-outlined text-[16px]">
                {copiedExcel ? 'check' : 'table_view'}
              </span>
              <span>{copiedExcel ? 'Skopiowano wiersz!' : 'Kopiuj wiersz do Excela'}</span>
            </button>

            <label
              className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface cursor-pointer select-none px-2.5 py-1 rounded-lg hover:bg-surface-container-low transition-colors border border-transparent hover:border-outline-variant/40"
              title="Gdy zaznaczone, do schowka zostanie dodany wiersz z tytułami kolumn"
            >
              <input
                type="checkbox"
                checked={includeHeaders}
                onChange={(e) => setIncludeHeaders(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
              />
              <span>Z nagłówkami kolumn</span>
            </label>

            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-secondary">
                {copiedJson ? 'check' : 'content_copy'}
              </span>
              <span>{copiedJson ? 'Skopiowano JSON!' : 'Kopiuj JSON'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowJson((prev) => !prev)}
              className="text-xs font-medium text-secondary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">data_object</span>
              <span>{showJson ? 'Ukryj JSON' : 'Pokaż surowy JSON'}</span>
            </button>

            <button
              type="button"
              onClick={() => setConfigOpen(true)}
              className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-secondary transition-colors cursor-pointer flex items-center justify-center border border-outline-variant/60"
              title="Konfiguracja pól kopiowania do Excela"
              aria-label="Konfiguracja pól kopiowania do Excela"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
          </div>
        </div>

        {/* Zawartość: Wszystkie 32 pola ułożone w czytelnym układzie sekcji */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-surface-container-lowest/40">
          {!isSuccess && record.error_message && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <div>
                <strong className="font-semibold block">Błąd ekstrakcji:</strong>
                <span>{record.error_message}</span>
              </div>
            </div>
          )}

          {/* Siatka sekcji: 2 rzędy / kolumny dla przejrzystości */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {sectionsData.slice(0, 4).map((sec) => (
              <div
                key={sec.id}
                className="bg-white rounded-xl border border-outline-variant shadow-xs p-4 flex flex-col"
              >
                <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2.5 flex items-center gap-2 border-b border-outline-variant/50 pb-2">
                  <span className="material-symbols-outlined text-[17px]">{sec.icon}</span>
                  <span>{sec.title}</span>
                </div>
                <div className="divide-y divide-outline-variant/30 flex-1">
                  {sec.fields.map(({ key, label, value, isMono }) => (
                    <div key={key} className="flex items-start justify-between text-xs py-2 gap-3">
                      <span className="text-on-surface-variant font-medium text-[11.5px] shrink-0 max-w-[200px]">
                        {label}
                      </span>
                      <span
                        className={`text-on-surface font-semibold text-right break-words max-w-[260px] ${
                          isMono ? 'font-mono' : ''
                        }`}
                        title={value || ''}
                      >
                        {value ? (
                          value
                        ) : (
                          <span className="text-on-surface-variant/40 font-normal italic">—</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sekcja 5: Ważność i adnotacje (na pełną szerokość na dole) */}
          {sectionsData[4] && (
            <div className="bg-white rounded-xl border border-outline-variant shadow-xs p-4">
              <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2.5 flex items-center gap-2 border-b border-outline-variant/50 pb-2">
                <span className="material-symbols-outlined text-[17px]">
                  {sectionsData[4].icon}
                </span>
                <span>{sectionsData[4].title}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectionsData[4].fields.map(({ key, label, value, isMono }) => (
                  <div
                    key={key}
                    className="p-3 rounded-lg bg-surface-bright border border-outline-variant/40 flex flex-col justify-between"
                  >
                    <span className="text-on-surface-variant font-medium text-[11px] mb-1">
                      {label}
                    </span>
                    <span
                      className={`text-xs font-semibold text-on-surface break-words ${
                        isMono ? 'font-mono' : ''
                      }`}
                    >
                      {value ? (
                        value
                      ) : (
                        <span className="text-on-surface-variant/40 font-normal italic">—</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opcjonalny podgląd surowego JSON */}
          {showJson && (
            <div className="pt-2 border-t border-outline-variant/40">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Surowy obiekt JSON
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono">
                  {Object.keys(d).length} pól
                </span>
              </div>
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-56 select-all border border-slate-800 shadow-inner">
                {JSON.stringify(d, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Stopka modala */}
        <div className="px-6 py-3 border-t border-outline-variant bg-surface-bright flex justify-between items-center shrink-0">
          <span className="text-[11px] text-on-surface-variant">
            Łącznie: 33 pola dowodu rejestracyjnego + rok produkcji
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>

      {/* Modal konfiguracji pól kopiowania */}
      <VehicleCopyFieldsConfig isOpen={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  );
};
