import React, { useState, useEffect, useMemo } from 'react';
import { PolicyRecord } from '../../../types/api';
import { useVehicleCopySettings } from '../../../hooks/useVehicleCopySettings';
import { VEHICLE_FIELD_DEFINITIONS, VEHICLE_SECTIONS } from '../../../config/vehicleFields';
import { VehicleCopyFieldsConfig } from '../../settings/components/VehicleCopyFieldsConfig';

interface VehicleRegDetailCardProps {
  record: PolicyRecord;
  onClose: () => void;
}

export const VehicleRegDetailCard: React.FC<VehicleRegDetailCardProps> = ({ record, onClose }) => {
  const [copiedExcel, setCopiedExcel] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedFieldKey, setCopiedFieldKey] = useState<string | null>(null);
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

  // Szybkie kopiowanie pojedynczego pola do schowka
  const handleCopySingleField = (key: string, val: string | null) => {
    if (!val || val === '—') return;
    navigator.clipboard.writeText(val);
    setCopiedFieldKey(key);
    setTimeout(() => setCopiedFieldKey(null), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-outline-variant shadow-2xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nagłówek modala zintegrowany z opcjami konfiguracji i akcjami kopiowania */}
        <div className="px-5 py-3 border-b border-outline-variant bg-surface-bright shrink-0 space-y-2.5">
          {/* Wiersz 1: Tytuł, numer rejestracyjny, status, plik oraz przycisk zamknięcia */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <span className="material-symbols-outlined text-[20px]">directions_car</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-on-surface">
                    {d.numer_rejestracyjny ? (
                      <span className="font-mono bg-surface-container px-2 py-0.5 rounded border border-outline-variant/60">
                        {d.numer_rejestracyjny}
                      </span>
                    ) : (
                      'Szczegóły dowodu rejestracyjnego'
                    )}
                  </h3>
                  {isSuccess ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 shrink-0">
                      <span className="material-symbols-outlined text-[11px]">check_circle</span>
                      Sukces
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error/10 text-error shrink-0">
                      <span className="material-symbols-outlined text-[11px]">error</span>
                      Błąd odczytu
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-on-surface-variant mt-0.5 flex items-center gap-2 flex-wrap">
                  <span className="break-all font-medium text-on-surface" title={record.filename}>
                    {record.filename}
                  </span>
                  {d.vin && (
                    <>
                      <span>•</span>
                      <span className="font-mono font-medium text-on-surface">VIN: {d.vin}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Przycisk zamknięcia */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer shrink-0"
              aria-label="Zamknij"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Wiersz 2: Pasek konfiguracji schowka i akcji eksportu (przeniesiony z dołu do nagłówka) */}
          <div className="pt-2 border-t border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Opcja dołączenia nagłówków */}
              <label className="flex items-center gap-1.5 text-xs text-on-surface-variant cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
                />
                <span>Dołącz nagłówki kolumn</span>
              </label>

              {/* Przycisk konfiguratora kolejności pól */}
              <button
                type="button"
                onClick={() => setConfigOpen(true)}
                className="text-xs text-secondary hover:underline cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">tune</span>
                <span>Dostosuj kolejność pól</span>
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Przełącznik widoku JSON */}
              <button
                type="button"
                onClick={() => setShowJson((prev) => !prev)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  showJson
                    ? 'border-secondary bg-secondary/10 text-secondary'
                    : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">code</span>
                <span>{showJson ? 'Widok pól' : 'JSON'}</span>
              </button>

              {/* Kopiowanie surowego JSON */}
              <button
                type="button"
                onClick={handleCopyJson}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copiedJson ? 'check' : 'data_object'}
                </span>
                <span>{copiedJson ? 'Skopiowano!' : 'Kopiuj JSON'}</span>
              </button>

              {/* Główny przycisk: Kopiowanie do Excela */}
              <button
                type="button"
                onClick={handleCopyExcelRow}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {copiedExcel ? 'check' : 'content_paste'}
                </span>
                <span>{copiedExcel ? 'Skopiowano wiersz!' : 'Kopiuj wiersz do Excela'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Zawartość modala: układ 2 sekcji obok siebie + ostatnia na pełną szerokość */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-surface-container-lowest">
          {showJson ? (
            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-surface-container font-mono text-xs text-on-surface overflow-x-auto leading-relaxed border border-outline-variant/60">
                {JSON.stringify(d, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
              {sectionsData.map((section, index) => {
                const isLastSection = index === sectionsData.length - 1;

                return (
                  <div
                    key={section.id}
                    className={`bg-white rounded-xl border border-outline-variant/80 p-3 shadow-xs flex flex-col justify-between ${
                      isLastSection ? 'lg:col-span-2' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-outline-variant/40">
                      <span className="material-symbols-outlined text-secondary text-[16px]">
                        {section.icon}
                      </span>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface">
                        {section.title}
                      </h4>
                    </div>

                    {/* Równa szerokość i wysokość pól w danym wierszu (grid-cols-2), minimalny odstęp etykieta-wartość */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {section.fields.map((field) => {
                        const isFieldCopied = copiedFieldKey === field.key;
                        const hasValue = Boolean(field.value && field.value !== '—');

                        return (
                          <div
                            key={field.key}
                            className="relative p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 hover:border-outline-variant transition-colors flex flex-col justify-start group"
                          >
                            {/* Etykieta pola */}
                            <p
                              className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider leading-none break-words pr-5"
                              title={field.label}
                            >
                              {field.label}
                            </p>

                            {/* Wartość ściśle pod etykietą z minimalnym odstępem (mt-1) i zawijaniem tekstu */}
                            <p
                              className={`text-xs mt-1 break-words whitespace-pre-wrap leading-tight ${
                                hasValue
                                  ? 'text-on-surface font-semibold select-text'
                                  : 'text-on-surface-variant/40 italic font-normal'
                              } ${field.isMono ? 'font-mono text-[11px]' : ''}`}
                            >
                              {field.value || '—'}
                            </p>

                            {/* Przycisk kopiowania pozycjonowany bez rozpychania wysokości */}
                            {hasValue && (
                              <button
                                type="button"
                                onClick={() => handleCopySingleField(field.key, field.value)}
                                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-on-surface-variant/40 hover:text-secondary p-0.5 rounded transition-all cursor-pointer"
                                title="Kopiuj wartość"
                                aria-label={`Kopiuj ${field.label}`}
                              >
                                <span
                                  className="material-symbols-outlined text-[13px]"
                                  style={{ fontSize: '13px', lineHeight: 1 }}
                                >
                                  {isFieldCopied ? 'check' : 'content_copy'}
                                </span>
                              </button>
                            )}

                            {isFieldCopied && (
                              <span className="text-[9px] text-emerald-600 font-semibold mt-0.5">
                                Skopiowano!
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal konfiguracji pól */}
      <VehicleCopyFieldsConfig isOpen={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  );
};

export default VehicleRegDetailCard;
