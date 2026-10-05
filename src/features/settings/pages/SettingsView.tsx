import React, { useState } from 'react';
import { VehicleCopyFieldsConfig } from '../components/VehicleCopyFieldsConfig';
import { useVehicleCopySettings } from '../../../hooks/useVehicleCopySettings';
import { useAppSettings } from '../../../hooks/useAppSettings';

type SettingsTab = 'vehicles' | 'general';

export const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('vehicles');
  const [copyConfigOpen, setCopyConfigOpen] = useState(false);
  const { fields } = useVehicleCopySettings();
  const { retentionDbDays, systemLimits, saveSetting } = useAppSettings();

  const enabledCount = fields.filter((f) => f.enabled).length;
  const totalCount = fields.length;

  return (
    <div className="max-w-3xl mx-auto space-y-lg">
      {/* Tytuł strony */}
      <div>
        <h2 className="font-display-lg text-display-lg text-on-surface">Ustawienia</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
          Konfiguracja parametrów czytnika dowodów rejestracyjnych oraz ustawień globalnych systemu.
        </p>
      </div>

      {/* Pasek zakładek tematycznych */}
      <div className="flex items-center gap-2 border-b border-outline-variant pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors cursor-pointer border-b-2 ${
            activeTab === 'vehicles'
              ? 'border-secondary text-secondary bg-secondary/5'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">directions_car</span>
          <span>Dowody rejestracyjne</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors cursor-pointer border-b-2 ${
            activeTab === 'general'
              ? 'border-secondary text-secondary bg-secondary/5'
              : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
          <span>System i Wspólne</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ZAKŁADKA 1: DOWODY REJESTRACYJNE (POJAZDY)                                */}
      {/* ========================================================================= */}
      {activeTab === 'vehicles' && (
        <div className="space-y-lg animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-outline-variant/60 bg-surface-bright flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">directions_car</span>
                <h3 className="text-sm font-bold text-on-surface">Eksport i schowek dowodów rejestracyjnych</h3>
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/60">
                PostgreSQL Sync
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-on-surface">Pola kopiowane do Excela oraz eksportu CSV</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Wybierz, które spośród 33 urzędowych rubryk PWPW i w jakiej kolejności mają trafiać do schowka („Kopiuj wiersz do Excela”) oraz do pobieranego pliku CSV.
                  </p>
                  <p className="text-xs text-on-surface-variant mt-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Aktywne pola:</span>
                    <span className="font-bold text-secondary">{enabledCount}</span>
                    <span>z {totalCount}</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCopyConfigOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors shadow-xs cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                  <span>Konfiguruj pola</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ZAKŁADKA 2: SYSTEM I WSPÓLNE                                              */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="space-y-lg animate-in fade-in duration-150">
          {/* Karta: Retencja danych */}
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-outline-variant/60 bg-surface-bright flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">delete_sweep</span>
                <h3 className="text-sm font-bold text-on-surface">Retencja danych w bazie</h3>
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/60">
                PostgreSQL Sync
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-on-surface">Okres przechowywania paczek</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Określa, po jakim czasie zakończone paczki zadań i powiązane rekordy dokumentów dowodów rejestracyjnych są automatycznie usuwane z bazy danych przez harmonogram Celery Beat.
                </p>
              </div>
              <select
                value={retentionDbDays}
                onChange={(e) => saveSetting('retention_db_days', Number(e.target.value))}
                className="w-full sm:w-56 px-3 py-2 text-sm rounded-lg border border-outline-variant bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 cursor-pointer shadow-xs"
              >
                <option value={1}>1 dzień</option>
                <option value={2}>2 dni (domyślnie)</option>
                <option value={7}>7 dni</option>
                <option value={14}>14 dni</option>
                <option value={30}>30 dni</option>
              </select>
            </div>
          </div>

          {/* Karta: Limity przesyłania (informacyjne) */}
          <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-outline-variant/60 bg-surface-bright flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">upload_file</span>
                <h3 className="text-sm font-bold text-on-surface">Limity przesyłania paczek</h3>
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/60">
                Serwer (read-only)
              </span>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-on-surface-variant">
                Poniższe parametry są zdefiniowane w konfiguracji serwera i obowiązują dla przesyłanych zdjęć dowodów rejestracyjnych.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/40">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Maks. rozmiar pojedynczego pliku</p>
                  <p className="text-xl font-bold text-on-surface mt-1">
                    {systemLimits?.max_file_size_mb ?? '25'} <span className="text-xs font-normal text-on-surface-variant">MB</span>
                  </p>
                </div>
                <div className="px-4 py-3 rounded-lg bg-surface-container-low border border-outline-variant/40">
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Maks. liczba plików w paczce</p>
                  <p className="text-xl font-bold text-on-surface mt-1">
                    {systemLimits?.max_files_per_batch ?? '200'} <span className="text-xs font-normal text-on-surface-variant">plików</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal konfiguracji pól kopiowania */}
      <VehicleCopyFieldsConfig isOpen={copyConfigOpen} onClose={() => setCopyConfigOpen(false)} />
    </div>
  );
};

export default SettingsView;
