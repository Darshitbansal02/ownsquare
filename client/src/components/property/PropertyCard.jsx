import React from 'react';
import { formatINR, formatCompactINR } from '../../utils/formatINR.js';
import { StatusChip } from '../StatusChip.jsx';
import { FundingBar } from '../ui/FundingBar.jsx';

export function PropertyCard({
  property,
  onInvest,
  onViewDetail,
  className = ''
}) {
  if (!property) return null;

  const {
    _id,
    title,
    city,
    state,
    type,
    unitPrice,
    unitsSold = 0,
    totalUnits = 1000,
    fundingPct = 0,
    status = 'LIVE',
    expectedAppreciationPct,
    rentalYieldPct,
    images = []
  } = property;

  const imageUrl = images[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

  const isLive = status === 'LIVE';

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Card Header & Media */}
        <div className="relative h-44 w-full bg-gray-100 overflow-hidden group">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <StatusChip status={status} />
          </div>
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-xs font-medium">
            {type}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {city}{state ? `, ${state}` : ''}
              </p>
              <h3
                onClick={() => onViewDetail && onViewDetail(property)}
                className="text-base font-bold text-[#0F2A4A] mt-0.5 line-clamp-1 hover:text-blue-700 cursor-pointer"
                title={title}
              >
                {title}
              </h3>
            </div>
          </div>

          {/* Pricing & Returns Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Price per Unit</p>
              <p className="text-sm font-bold text-[#0F2A4A] mt-0.5">
                {formatINR(unitPrice)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Expected Return</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">
                {expectedAppreciationPct ? `${expectedAppreciationPct}% Target` : '—'}
              </p>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <FundingBar
              unitsSold={unitsSold}
              totalUnits={totalUnits}
              fundingPct={fundingPct}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="px-5 py-3.5 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onViewDetail && onViewDetail(property)}
          className="text-xs font-semibold text-gray-700 hover:text-[#0F2A4A] transition-colors"
        >
          View Details &rarr;
        </button>

        {isLive && onInvest && (
          <button
            type="button"
            onClick={() => onInvest(property)}
            className="px-3.5 py-1.5 bg-[#0F2A4A] hover:bg-[#1A3D66] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            Invest Now
          </button>
        )}
      </div>
    </div>
  );
}

export default PropertyCard;
