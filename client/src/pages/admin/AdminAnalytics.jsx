import React from 'react';

export function AdminAnalytics() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-sm text-slate-500">Asset performance, investor acquisition metrics, and capital growth velocity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Token Volume</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">₹245.8 Cr</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
            <span>↑ 18.4%</span>
            <span className="text-slate-400 font-normal">vs last quarter</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weighted Avg Yield</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">13.6%</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
            <span>↑ 0.8%</span>
            <span className="text-slate-400 font-normal">projected IRR</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Ticket Size</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">₹1,96,000</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
            <span>↑ 12.1%</span>
            <span className="text-slate-400 font-normal">per investor</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Secondary Turnover</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">4.2x</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-flex items-center gap-1">
            <span>↑ High</span>
            <span className="text-slate-400 font-normal">liquidity index</span>
          </span>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Capital Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Capital Allocation by Market</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">FY 2026</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { city: 'Bengaluru (Tech Corridors)', pct: 38, amount: '₹93.4 Cr', color: 'bg-emerald-500' },
              { city: 'Mumbai MMR (Boutique Commercial)', pct: 28, amount: '₹68.8 Cr', color: 'bg-blue-500' },
              { city: 'NCR (Gurugram / Noida)', pct: 22, amount: '₹54.1 Cr', color: 'bg-indigo-500' },
              { city: 'Pune (Koregaon Park & Hinjewadi)', pct: 12, amount: '₹29.5 Cr', color: 'bg-amber-500' }
            ].map((market) => (
              <div key={market.city} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">{market.city}</span>
                  <span className="text-slate-900 font-bold">{market.amount} ({market.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className={`${market.color} h-2 rounded-full`} style={{ width: `${market.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Asset Type Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Asset Class Mix</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">Diversified</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { type: 'Grade-A Commercial Offices', pct: 45, yield: '14.2% IRR', color: 'bg-[#0F1E36]' },
              { type: 'Prime High-Street Retail', pct: 30, yield: '12.8% IRR', color: 'bg-emerald-600' },
              { type: 'Industrial & Warehousing', pct: 15, yield: '15.1% IRR', color: 'bg-blue-600' },
              { type: 'Luxury Gated Residential', pct: 10, yield: '11.0% IRR', color: 'bg-slate-400' }
            ].map((cls) => (
              <div key={cls.type} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700">{cls.type}</span>
                  <span className="text-slate-900 font-bold">{cls.yield} ({cls.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className={`${cls.color} h-2 rounded-full`} style={{ width: `${cls.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;
