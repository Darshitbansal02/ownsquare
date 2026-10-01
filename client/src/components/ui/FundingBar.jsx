import React from 'react';
import { formatNumberIN } from '../../utils/formatINR.js';

export function FundingBar({
  unitsSold = 0,
  totalUnits = 1000,
  fundingPct,
  size = 'md', // 'sm', 'md', 'lg'
  showLabels = true,
  className = ''
}) {
  const safeTotal = totalUnits > 0 ? totalUnits : 1;
  const safeSold = Math.max(0, Math.min(unitsSold, safeTotal));
  const calculatedPct = fundingPct !== undefined ? fundingPct : Math.round((safeSold / safeTotal) * 100);
  const remainingUnits = Math.max(0, safeTotal - safeSold);

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5'
  };

  const isFunded = calculatedPct >= 100;

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs mb-1.5 text-gray-600 font-medium">
          <span className="flex items-center space-x-1.5">
            <span className="font-bold text-[#0F2A4A]">{calculatedPct}%</span>
            <span>funded</span>
          </span>
          <span className="text-gray-500">
            {isFunded ? (
              <span className="text-emerald-700 font-semibold">Fully Funded</span>
            ) : (
              <span>
                <strong className="text-gray-900 font-semibold">{formatNumberIN(remainingUnits)}</strong> units left
              </span>
            )}
          </span>
        </div>
      )}

      {/* Accessible Progressbar */}
      <div
        className={`w-full bg-gray-100 rounded-full overflow-hidden ${heightStyles[size] || heightStyles.md}`}
        role="progressbar"
        aria-valuenow={calculatedPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Funding progress: ${calculatedPct}% funded, ${remainingUnits} units remaining`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isFunded
              ? 'bg-[#10B981]'
              : calculatedPct > 75
              ? 'bg-[#10B981]'
              : 'bg-blue-600'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, calculatedPct))}%` }}
        />
      </div>

      {showLabels && size === 'lg' && (
        <div className="flex justify-between text-[11px] text-gray-400 mt-1">
          <span>{formatNumberIN(safeSold)} sold</span>
          <span>{formatNumberIN(safeTotal)} total</span>
        </div>
      )}
    </div>
  );
}

export default FundingBar;
