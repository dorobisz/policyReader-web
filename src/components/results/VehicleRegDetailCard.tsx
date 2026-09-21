import React, { useState, useEffect } from 'react';
import { PolicyRecord } from '../../types/api';

interface VehicleRegDetailCardProps {
  record: PolicyRecord;
  onClose: () => void;
}

export const VehicleRegDetailCard: React.FC<VehicleRegDetailCardProps> = ({ record, onClose }) => {
  const [copiedExcel, setCopiedExcel] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showJson, setShowJson] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const d = record.extracted_data || {};
  const isSuccess = record.status === 'success';

  const identityFields = [
    { label: 'Numer rejestracyjny (A)', value: d.numer_rejestracyjny, isMono: true },
    { label: 'Numer VIN (E)', value: d.vin, isMono: true },
    { label: 'Marka pojazdu (D.1)', value: d.marka },
    { label: 'Model / Wariant (D.3)', value: d.model },
    { label: 'Typ pojazdu (D.2)', value: d.typ },
    { label: 'Data 1. rejestracji (B)', value: d.data_pierwszej_rejestracji },
    { label: 'Numer dowodu rej.', value: d.nr_dowodu_rejestracyjnego },
    { label: 'Właściciel / Posiadacz (C.1)', value: d.wlasciciel },
  ];

  const technicalFields = [
    { label: 'Rok produkcji', value: d.rok_produkcji },
    { label: 'Rodzaj paliwa (P.3)', value: d.rodzaj_paliwa },
    { label: 'Pojemność silnika (P.1)', value: d.pojemnosc_silnika_cm3 ? `${d.pojemnosc_silnika_cm3} cm³` : null },
    { label: 'Moc silnika (P.2)', value: d.moc_silnika_kw ? `${d.moc_silnika_kw} kW` : null },
    { label: 'Dopuszczalna masa całk. (F.1)', value: d.dopuszczalna_masa_calkowita_kg ? `${d.dopuszczalna_masa_calkowita_kg} kg` : null },
    { label: 'Masa własna (G)', value: d.masa_wlasna_kg ? `${d.masa_wlasna_kg} kg` : null },
    { label: 'Liczba miejsc (S.1)', value: d.liczba_miejsc },
    { label: 'Kategoria pojazdu (J)', value: d.kategoria_pojazdu },
  ];

  // Kopiowanie wiersza do Excela: tab-separated values w jednym wierszu
  const handleCopyExcelRow = () => {
    const values = [
      record.filename || '',
      d.numer_rejestracyjny || '',
      d.marka || '',
      d.model || '',
      d.vin || '',
      d.rok_produkcji || '',
      d.data_pierwszej_rejestracji || '',
      d.pojemnosc_silnika_cm3 || '',
      d.moc_silnika_kw || '',
      d.rodzaj_paliwa || '',
      d.dopuszczalna_masa_calkowita_kg || '',
      d.masa_wlasna_kg || '',
      d.liczba_miejsc || '',
      d.kategoria_pojazdu || '',
      d.nr_dowodu_rejestracyjnego || '',
      d.wlasciciel || '',
    ];
    navigator.clipboard.writeText(values.join('\t'));
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-outline-variant shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nagłówek modala */}
        <div className="px-5 py-3.5 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[22px]">directions_car</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-on-surface">Dowód Rejestracyjny</h3>
                {d.numer_rejestracyjny && (
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-surface-container text-on-surface border border-outline-variant">
                    {d.numer_rejestracyjny}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    isSuccess
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {isSuccess ? 'SUCCESS' : 'FAIL'}
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant truncate max-w-md mt-0.5">
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
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Zamknij"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Pasek akcji zbiorczych (bez kopiowania pojedynczych pól) */}
        <div className="px-5 py-2.5 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyExcelRow}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                copiedExcel
                  ? 'bg-emerald-600 text-white'
                  : 'bg-secondary text-on-secondary hover:bg-secondary/90 shadow-xs'
              }`}
              title="Kopiuje wartości do wklejenia w 1 wiersz w Excelu (rozdzielane tabulatorem)"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedExcel ? 'check' : 'table_view'}
              </span>
              <span>{copiedExcel ? 'Skopiowano wiersz!' : 'Kopiuj wiersz do Excela'}</span>
            </button>

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

          <button
            type="button"
            onClick={() => setShowJson((prev) => !prev)}
            className="text-xs font-medium text-secondary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">data_object</span>
            <span>{showJson ? 'Ukryj JSON' : 'Pokaż surowy JSON'}</span>
          </button>
        </div>

        {/* Zwięzłe i czytelne zestawienie danych w 2 kolumnach */}
        <div className="p-5 overflow-y-auto space-y-4">
          {!isSuccess && record.error_message && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <div>
                <strong className="font-semibold block">Błąd ekstrakcji:</strong>
                <span>{record.error_message}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kolumna 1: Identyfikacja i rejestracja */}
            <div className="bg-surface-bright rounded-xl border border-outline-variant/60 p-3.5 flex flex-col">
              <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-outline-variant/40 pb-1.5">
                <span className="material-symbols-outlined text-[15px]">badge</span>
                <span>Identyfikacja i rejestracja</span>
              </div>
              <div className="divide-y divide-outline-variant/20">
                {identityFields.map(({ label, value, isMono }) => (
                  <div key={label} className="flex items-center justify-between text-xs py-1.5 gap-2">
                    <span className="text-on-surface-variant font-medium text-[11px] shrink-0">
                      {label}
                    </span>
                    <span
                      className={`text-on-surface font-semibold text-right truncate max-w-[200px] ${
                        isMono ? 'font-mono' : ''
                      }`}
                      title={value || ''}
                    >
                      {value || <span className="text-on-surface-variant/40 font-normal italic">—</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kolumna 2: Parametry techniczne */}
            <div className="bg-surface-bright rounded-xl border border-outline-variant/60 p-3.5 flex flex-col">
              <div className="text-[11px] font-bold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-outline-variant/40 pb-1.5">
                <span className="material-symbols-outlined text-[15px]">settings</span>
                <span>Parametry techniczne</span>
              </div>
              <div className="divide-y divide-outline-variant/20">
                {technicalFields.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs py-1.5 gap-2">
                    <span className="text-on-surface-variant font-medium text-[11px] shrink-0">
                      {label}
                    </span>
                    <span
                      className="text-on-surface font-semibold text-right truncate max-w-[200px]"
                      title={value || ''}
                    >
                      {value || <span className="text-on-surface-variant/40 font-normal italic">—</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Opcjonalny widok surowego JSON */}
          {showJson && (
            <div className="pt-2 border-t border-outline-variant/40">
              <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-xs overflow-x-auto max-h-48 select-all border border-slate-800 shadow-inner">
                {JSON.stringify(d, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Stopka modala */}
        <div className="px-5 py-3 border-t border-outline-variant bg-surface-bright flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
};
