import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicleCopySettings } from '../../hooks/useVehicleCopySettings';
import { VEHICLE_FIELD_DEFINITIONS, CopyFieldConfig } from '../../config/vehicleFields';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const VehicleCopyFieldsConfig: React.FC<Props> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { fields, saveSettings, resetSettings } = useVehicleCopySettings();
  const [localFields, setLocalFields] = useState<CopyFieldConfig[]>(fields);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalFields(fields);
    }
  }, [isOpen, fields]);

  if (!isOpen) return null;

  const sorted = [...localFields].sort((a, b) => a.order - b.order);

  const getLabel = (key: string) =>
    VEHICLE_FIELD_DEFINITIONS.find((f) => f.key === key)?.label ?? key;

  const toggleField = (key: string) => {
    setLocalFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverItem.current = idx;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, moved);
    setLocalFields(reordered.map((f, i) => ({ ...f, order: i })));
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSave = async () => {
    await saveSettings(localFields);
    onClose();
  };

  const handleReset = async () => {
    await resetSettings();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-outline-variant shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nagłówek modala */}
        <div className="px-5 py-3.5 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">settings</span>
            <h3 className="text-sm font-bold text-on-surface">Pola kopiowania dowodu rejestracyjnego</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-variant transition-colors cursor-pointer"
            aria-label="Zamknij"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="px-5 pt-3 pb-1 text-xs text-on-surface-variant">
          Zaznacz pola i przeciągaj wiersze, aby zmienić kolejność kopiowania do Excela. Zmiany są zapisywane w bazie danych.
        </p>

        {/* Lista pól */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-1">
          {sorted.map((field, idx) => (
            <div
              key={field.key}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={handleDrop}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors cursor-grab active:cursor-grabbing select-none ${
                field.enabled
                  ? 'bg-surface-bright border-outline-variant/60 hover:bg-surface-container-low'
                  : 'bg-surface-container-low border-outline-variant/30 opacity-60'
              }`}
            >
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">drag_indicator</span>
              <input
                type="checkbox"
                checked={field.enabled}
                onChange={() => toggleField(field.key)}
                className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
              />
              <span className="text-xs font-medium text-on-surface flex-1">{getLabel(field.key)}</span>
              <span className="text-[10px] text-on-surface-variant font-mono">{idx + 1}</span>
            </div>
          ))}
        </div>

        {/* Stopka */}
        <div className="px-5 py-3 border-t border-outline-variant bg-surface-bright flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-on-surface-variant hover:text-error transition-colors cursor-pointer"
            >
              Przywróć domyślne
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/settings');
              }}
              className="text-xs text-secondary hover:underline cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              Pełne ustawienia
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-on-secondary hover:bg-secondary/90 transition-colors shadow-xs cursor-pointer"
            >
              Zapisz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
