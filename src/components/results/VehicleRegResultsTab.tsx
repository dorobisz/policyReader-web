import React from 'react';
import { PolicyRecord } from '../../types/api';

interface VehicleRegResultsTabProps {
  records: PolicyRecord[];
  onSelectRecord: (record: PolicyRecord) => void;
}

export const VehicleRegResultsTab: React.FC<VehicleRegResultsTabProps> = ({
  records,
  onSelectRecord,
}) => {
  if (records.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl mb-2 text-outline">directions_car</span>
        <p className="font-headline-sm text-on-surface mb-1">Brak dowodów rejestracyjnych</p>
        <p className="text-body-sm">W tej paczce nie znaleziono zdjęć dowodów rejestracyjnych.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              <th className="py-2.5 px-3.5">Nr rejestracyjny</th>
              <th className="py-2.5 px-3.5">Marka i model</th>
              <th className="py-2.5 px-3.5">Numer VIN</th>
              <th className="py-2.5 px-3.5 text-center">Rok prod.</th>
              <th className="py-2.5 px-3.5 text-center">Status</th>
              <th className="py-2.5 px-3.5 text-right">Podgląd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-xs">
            {records.map((record) => {
              const d = record.extracted_data || {};
              const regNum = d.numer_rejestracyjny || '—';
              const make = d.marka || '';
              const model = d.model || '';
              const makeModel = `${make} ${model}`.trim() || '—';
              const vin = d.vin || '—';
              const year = d.rok_produkcji || '—';
              const isSuccess = record.status === 'success';

              return (
                <tr
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className="hover:bg-surface-container-low/60 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center w-fit px-2 py-0.5 rounded font-mono font-bold text-xs bg-surface-container text-on-surface border border-outline-variant/60">
                        {regNum}
                      </span>
                      <span
                        className="text-[11px] text-on-surface-variant/80 truncate max-w-[200px]"
                        title={record.filename}
                      >
                        {record.filename}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 font-medium text-on-surface">
                    {makeModel}
                  </td>
                  <td className="py-2.5 px-3.5 font-mono text-xs text-on-surface-variant tracking-wider">
                    {vin}
                  </td>
                  <td className="py-2.5 px-3.5 text-center text-on-surface-variant font-medium">
                    {year}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        isSuccess
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-error/10 text-error'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[13px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {isSuccess ? 'check_circle' : 'cancel'}
                      </span>
                      {isSuccess ? 'Sukces' : 'Błąd'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecord(record);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-secondary hover:text-on-secondary hover:bg-secondary rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">visibility</span>
                      Podgląd
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
