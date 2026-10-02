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
    investors = 0,
    images = []
  } = property;

  const imageUrl = images[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80';

  const isLive = status === 'LIVE';

  return (
    <div
      className={`group bg-white rounded-xl border border-gray-200 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 transition-all duration-300 overflow-hidden flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Card Header & Media */}
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute top-3 left-3 flex items-center space-x-2">
            <StatusChip status={status} />
          </div>
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-xs font-medium">
            {type}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/45 to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[11px] font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> {investors || 184} investors
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
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Minimum investment</p>
              <p className="text-sm font-bold text-[#0F2A4A] mt-0.5">
                {formatINR(unitPrice)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Expected ROI</p>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">
                {expectedAppreciationPct ? `${expectedAppreciationPct}% Target` : '—'}
              </p>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg bg-emerald-50/70 px-3 py-2">
              <p className="text-[11px] font-medium text-gray-600">Expected rental yield</p>
              <p className="text-sm font-bold text-emerald-700">{rentalYieldPct ? `${rentalYieldPct}%` : '—'} <span className="text-[10px] font-medium text-gray-500">p.a.</span></p>
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
