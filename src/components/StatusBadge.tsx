import React from 'react';
import { BatchStatus, PolicyRecordStatus } from '../types/api';

export type StatusBadgeVariant = BatchStatus | PolicyRecordStatus | 'all';

export interface StatusBadgeProps {
  status: StatusBadgeVariant | string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * StatusBadge — dynamiczny komponent odznaki statusu
 * 
 * Zgodny ze specyfikacją z makiet:
 * - Processing: tło rgba(0,81,213,0.1), kolor secondary, obracająca się ikona 'sync'
 * - Completed / Success: tło #e6f4ea, kolor #137333 (sukces), ikona 'check'
 * - Failed: tło rgba(186,26,26,0.1), kolor error, ikona 'close'
 * - Pending: tło surface-container, kolor on-surface-variant, ikona 'schedule'
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
  size = 'sm',
}) => {
  const normalizedStatus = (status || '').toLowerCase();

  let bgClass = 'bg-surface-container';
  let textClass = 'text-on-surface-variant';
  let iconName = 'schedule';
  let isSpinning = false;
  let defaultLabel = 'Pending';

  switch (normalizedStatus) {
    case 'processing':
      bgClass = 'bg-[rgba(0,81,213,0.1)]';
      textClass = 'text-secondary';
      iconName = 'sync';
      isSpinning = true;
      defaultLabel = 'Processing';
      break;

    case 'completed':
    case 'success':
      bgClass = 'bg-[#e6f4ea]';
      textClass = 'text-[#137333]';
      iconName = 'check';
      defaultLabel = 'Completed';
      break;

    case 'failed':
    case 'error':
      bgClass = 'bg-[rgba(186,26,26,0.1)]';
      textClass = 'text-error';
      iconName = 'close';
      defaultLabel = 'Failed';
      break;

    case 'pending':
    default:
      bgClass = 'bg-surface-container';
      textClass = 'text-on-surface-variant';
      iconName = 'schedule';
      defaultLabel = normalizedStatus ? normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1) : 'Pending';
      break;
  }

  const displayLabel = label || defaultLabel;
  const paddingClasses = size === 'sm' ? 'px-2 py-1' : 'px-2.5 py-1.5';
  const textClasses = size === 'sm' ? 'text-[11px]' : 'text-xs';
  const iconSizeClass = size === 'sm' ? 'text-[12px]' : 'text-[14px]';

  return (
    <span
      className={`inline-flex items-center gap-xs rounded font-label-bold ${paddingClasses} ${textClasses} ${bgClass} ${textClass} ${className}`}
    >
      <span
        className={`material-symbols-outlined ${iconSizeClass} ${
          isSpinning ? 'animate-spin' : ''
        }`}
        aria-hidden="true"
      >
        {iconName}
      </span>
      <span>{displayLabel}</span>
    </span>
  );
};

export default StatusBadge;
