import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  icon: string;
  iconBgClass?: string;
  iconColorClass?: string;
  className?: string;
  loading?: boolean;
}

/**
 * MetricCard — komponent pojedynczej karty metryki w Bento Gridzie
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  suffix,
  icon,
  iconBgClass = 'bg-surface-container-high',
  iconColorClass = 'text-primary',
  className = '',
  loading = false,
}) => {
  return (
    <div
      className={`bg-surface p-md rounded-xl border border-outline-variant shadow-sm flex items-center justify-between transition-shadow hover:shadow-md ${className}`}
    >
      <div className="min-w-0 pr-sm">
        <p className="font-label-bold text-label-bold text-on-surface-variant uppercase tracking-wider mb-1 truncate">
          {label}
        </p>
        {loading ? (
          <div className="h-10 w-24 bg-surface-container animate-pulse rounded my-1" />
        ) : (
          <p className="font-display-lg text-display-lg text-on-surface flex items-baseline gap-xs">
            <span>{value}</span>
            {suffix && (
              <span className="font-headline-sm text-headline-sm text-on-surface-variant">
                {suffix}
              </span>
            )}
          </p>
        )}
      </div>

      <div
        className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center ${iconBgClass} ${iconColorClass}`}
      >
        <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
          {icon}
        </span>
      </div>
    </div>
  );
};

export default MetricCard;
