import React from 'react';
import { BatchStatus } from '../types/api';

export interface ProgressBarProps {
  progress: number;
  status?: BatchStatus | string;
  showText?: boolean;
  className?: string;
  heightClass?: string;
}

/**
 * ProgressBar — komponent paska postępu przetwarzania
 * 
 * Kolorystyka i zachowanie dopasowane do statusu paczki:
 * - completed: zielony (#137333)
 * - failed: czerwony (error)
 * - processing / default: niebieski (secondary)
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status = 'processing',
  showText = true,
  className = '',
  heightClass = 'h-1',
}) => {
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  let barColorClass = 'bg-secondary';
  if (status === 'completed') {
    barColorClass = 'bg-[#137333]';
  } else if (status === 'failed') {
    barColorClass = 'bg-error';
  }

  return (
    <div className={`flex items-center gap-sm ${className}`}>
      <div className={`flex-1 ${heightClass} bg-surface-container rounded-full overflow-hidden`}>
        <div
          className={`h-full ${barColorClass} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${normalizedProgress}%` }}
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showText && (
        <span className="font-body-sm text-body-sm text-on-surface-variant w-8 text-right shrink-0">
          {normalizedProgress}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
