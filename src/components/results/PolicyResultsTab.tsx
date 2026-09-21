import React from 'react';
import { PolicyRecord } from '../../types/api';

interface PolicyResultsTabProps {
  records: PolicyRecord[];
  onSelectRecord: (record: PolicyRecord) => void;
}

export const PolicyResultsTab: React.FC<PolicyResultsTabProps> = ({ records, onSelectRecord }) => {
  if (records.length === 0) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl mb-2 text-outline">description</span>
        <p className="font-headline-sm text-on-surface mb-1">Brak polis ubezpieczeniowych</p>
        <p className="text-body-sm">W tej paczce nie znaleziono dokumentów polis ubezpieczeniowych.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant bg-surface-container-low text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              <th className="py-2.5 px-3.5">Nazwa pliku</th>
              <th className="py-2.5 px-3.5">Towarzystwo ubezpieczeniowe</th>
              <th className="py-2.5 px-3.5 text-right">Kwota składki (PLN)</th>
              <th className="py-2.5 px-3.5 text-center">OCR</th>
              <th className="py-2.5 px-3.5 text-center">Czas</th>
              <th className="py-2.5 px-3.5 text-center">Status</th>
              <th className="py-2.5 px-3.5 text-right">Akcja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-xs">
            {records.map((record) => {
              const company = record.extracted_data?.towarzystwo || '—';
              const premium = record.extracted_data?.kwota_skladki;
              const isSuccess = record.status === 'success';

              return (
                <tr
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className="hover:bg-surface-container-low/60 transition-colors cursor-pointer group"
                >
                  <td className="py-2.5 px-3.5 font-medium text-on-surface">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-error text-[18px] shrink-0">
                        picture_as_pdf
                      </span>
                      <span className="truncate max-w-xs" title={record.filename}>
                        {record.filename}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3.5 text-on-surface">
                    <span className="font-medium text-secondary">{company}</span>
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-semibold text-on-surface">
                    {premium ? (
                      <span>{Number(premium).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł</span>
                    ) : (
                      <span className="text-on-surface-variant font-normal">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    {record.ocr_used ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        OCR
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        PDF Tekst
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-center text-on-surface-variant text-[12px]">
                    {record.czas_procesu_sek != null ? `${record.czas_procesu_sek.toFixed(1)}s` : '—'}
                  </td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
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
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
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
