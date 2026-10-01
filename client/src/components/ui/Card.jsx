import React from 'react';

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
  bodyClassName = '',
  footer
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle || actions) && (
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            {title && <h3 className="text-base font-bold text-[#0F2A4A]">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
      {footer && <div className="px-6 py-3 bg-gray-50/70 border-t border-gray-100">{footer}</div>}
    </div>
  );
}

export function KpiCard({
  title,
  value,
  subtitle,
  badge,
  badgeType = 'neutral', // 'positive', 'negative', 'warning', 'neutral'
  disclosure,
  icon,
  loading = false,
  className = '',
  onClick
}) {
  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-5 border border-gray-200 shadow-sm animate-pulse ${className}`}>
        <div className="h-3.5 bg-gray-200 rounded w-24 mb-3"></div>
        <div className="h-7 bg-gray-200 rounded w-36 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-20"></div>
      </div>
    );
  }

  const badgeStyles = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    negative: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    neutral: 'bg-gray-100 text-gray-600 border-gray-200'
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">{title}</p>
        {icon && <div className="text-lg opacity-80">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
        <p className="text-2xl font-bold text-[#0F2A4A] tracking-tight">{value}</p>
        {badge && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
              badgeStyles[badgeType] || badgeStyles.neutral
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-gray-500 mt-1 font-normal">{subtitle}</p>}

      {disclosure && (
        <p className="text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100 italic">
          {disclosure}
        </p>
      )}
    </div>
  );
}

export default Card;
