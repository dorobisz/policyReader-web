import React, { useState } from 'react';
import { VehicleCopyFieldsConfig } from '../components/settings/VehicleCopyFieldsConfig';
import { useVehicleCopySettings } from '../hooks/useVehicleCopySettings';

export const SettingsView: React.FC = () => {
  const [copyConfigOpen, setCopyConfigOpen] = useState(false);
  const { fields } = useVehicleCopySettings();

  const enabledCount = fields.filter((f) => f.enabled).length;
  const totalCount = fields.length;

  return (
    <div className="max-w-3xl mx-auto space-y-xl">
      <div>
        <h2 className="font-display-lg text-display-lg text-on-surface">Ustawienia</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
          Globalna konfiguracja systemu BrokerEngine zapisana na serwerze w bazie danych.
        </p>
      </div>

      {/* Karta: Dowody rejestracyjne */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-outline-variant/60 bg-surface-bright flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">directions_car</span>
            <h3 className="text-sm font-bold text-on-surface">Dowody rejestracyjne</h3>
          </div>
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/60">
            PostgreSQL Sync
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-on-surface">Pole kopiowane do Excela</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Wybierz, które atrybuty i w jakiej kolejności mają trafiać do schowka po kliknięciu „Kopiuj wiersz do Excela”.
              </p>
              <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1.5">
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

      {/* Modal konfiguracji pól kopiowania */}
      <VehicleCopyFieldsConfig isOpen={copyConfigOpen} onClose={() => setCopyConfigOpen(false)} />
    </div>
  );
};
