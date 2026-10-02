import React, { useState } from 'react';
import { formatINR } from '../../utils/formatINR.js';

const PALETTE = [
  '#0F2A4A', // Primary Navy
  '#10B981', // Accent Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#D4A017', // Gold
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4'  // Cyan
];

export function AllocationDonut({
  data = [], // [{ propertyId, title, amount }]
  totalInvested = 0,
  className = ''
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const safeTotal = totalInvested > 0
    ? totalInvested
    : data.reduce((sum, item) => sum + (item.amount || 0), 0);

  if (!data || data.length === 0 || safeTotal === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50/60 rounded-xl border border-dashed border-gray-200 text-center ${className}`}>
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
          🍩
        </div>
        <p className="text-sm font-semibold text-gray-700">No Portfolio Allocations</p>
        <p className="text-xs text-gray-500 mt-0.5">Invest in active properties to see your distribution.</p>
      </div>
    );
  }

  // Calculate SVG arc paths
  const size = 200;
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeAngle = 0;
  const segments = data.map((item, idx) => {
    const pct = (item.amount / safeTotal);
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += pct;
    const color = PALETTE[idx % PALETTE.length];

    return {
      ...item,
      pct: (pct * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
      color,
      idx
    };
  });

  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className={`flex flex-col md:flex-row items-center justify-center gap-6 ${className}`}>
      {/* Donut Graphic */}
      <div className="relative w-48 h-48 flex-shrink-0 flex items-center justify-center">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full transform -rotate-90"
          aria-label="Portfolio allocation donut chart"
          role="img"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />
          {/* Data segments */}
          {segments.map((seg) => (
            <circle
              key={seg.propertyId || seg.title || seg.idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth={hoveredIdx === seg.idx ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHoveredIdx(seg.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            {activeSegment ? activeSegment.title.slice(0, 16) + '...' : 'Total Value'}
          </p>
          <p className="text-base font-bold text-[#0F2A4A] tracking-tight">
            {activeSegment ? `${activeSegment.pct}%` : formatINR(safeTotal)}
          </p>
          {activeSegment && (
            <p className="text-[10px] text-gray-500 font-medium">
              {formatINR(activeSegment.amount)}
            </p>
          )}
        </div>
      </div>

      {/* Accessible Legend */}
      <div className="flex-1 w-full space-y-2">
        <p className="text-xs uppercase font-bold text-gray-500 tracking-wider mb-2">Asset Breakdown</p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {segments.map((seg) => (
            <div
              key={seg.propertyId || seg.title || seg.idx}
              onMouseEnter={() => setHoveredIdx(seg.idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                hoveredIdx === seg.idx ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-gray-800 truncate max-w-[140px] sm:max-w-[180px]">{seg.title}</span>
              </div>
              <div className="flex items-center space-x-2 font-mono ml-2">
                <span className="text-gray-900 font-medium">{formatINR(seg.amount)}</span>
                <span className="text-gray-400 font-normal">({seg.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AllocationDonut;
