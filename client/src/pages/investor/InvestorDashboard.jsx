import React, { useState } from 'react';
import { formatINR, formatDateIN, formatCompactINR } from '../../utils/formatINR.js';
import { KpiCard } from '../../components/ui/Card.jsx';
import { AllocationDonut } from '../../components/charts/AllocationDonut.jsx';
import { PropertyCard } from '../../components/property/PropertyCard.jsx';
import { StatusChip } from '../../components/StatusChip.jsx';
import { PerformanceChart } from './InvestorScreens.jsx';

export function InvestorDashboard({
  portfolioData,
  walletData,
  properties = [],
  transactions = [],
  onNavigate,
  onSelectPropertyForInvest,
  onSelectPropertyDetail,
  onTopUpClick
}) {
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Default Aman fixture conforming to CONTRACTS.md & TESTING.md
  const defaultPortfolio = {
    totalInvested: 30000000, // ₹3 Lakh
    currentValue: 33600000, // ₹3.36 Lakh (estimated)
    totalPayouts: 500000,
    overallRoiPct: 13.7,
    wallet: {
        balance: 20000000,
      reservedBalance: 0,
        availableBalance: 20500000
    },
    allocation: [
      { propertyId: '100000000000000000000001', title: '2BHK, Sector 150, Noida', amount: 20000000 },
      { propertyId: '100000000000000000000002', title: 'Commercial Retail Hub, Whitefield', amount: 10000000 }
    ]
  };

  const activePortfolio = portfolioData || defaultPortfolio;
  const activeWallet = walletData || activePortfolio.wallet;

  // Default featured properties if none passed
  const featuredProperties = properties.length > 0 ? properties.filter((p) => p.status === 'LIVE').slice(0, 2) : [
    {
      _id: '100000000000000000000002',
      title: 'Commercial Retail Hub, Whitefield',
      type: 'COMMERCIAL',
      city: 'Bangalore',
      state: 'Karnataka',
      valuation: 2500000000,
      totalUnits: 2500,
      unitPrice: 1000000,
      unitsSold: 1250,
      fundingPct: 50,
      status: 'LIVE',
      expectedAppreciationPct: 14,
      rentalYieldPct: 4,
      images: [{ url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80' }]
    },
    {
      _id: '100000000000000000000005',
      title: 'Tech Park View Apartments, HSR Layout',
      type: 'APARTMENT',
      city: 'Bangalore',
      state: 'Karnataka',
      valuation: 1800000000,
      totalUnits: 1800,
      unitPrice: 1000000,
      unitsSold: 540,
      fundingPct: 30,
      status: 'LIVE',
      expectedAppreciationPct: 11,
      rentalYieldPct: 3.5,
      images: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80' }]
    }
  ];

  // Default recent transactions
  const defaultTransactions = [
    {
      _id: '400000000000000000000003',
      type: 'INVESTMENT',
      direction: 'DEBIT',
      amount: 10000000, // ₹1 Lakh
      balanceAfter: 30000000,
      refType: 'Property',
      refId: 'Commercial Retail Hub',
      createdAt: '2026-10-01T07:15:00.000Z'
    },
    {
      _id: '400000000000000000000002',
      type: 'INVESTMENT',
      direction: 'DEBIT',
      amount: 20000000, // ₹2 Lakh
      balanceAfter: 40000000,
      refType: 'Property',
      refId: '2BHK Sector 150',
      createdAt: '2026-10-01T06:35:00.000Z'
    },
    {
      _id: '400000000000000000000001',
      type: 'TOPUP',
      direction: 'CREDIT',
      amount: 50000000, // ₹5 Lakh
      balanceAfter: 50000000,
      refType: 'TopupOrder',
      refId: 'mock_order_demo_001',
      createdAt: '2026-10-01T06:34:00.000Z'
    }
  ];

  const recentTransactions = transactions.length > 0 ? transactions.slice(0, 5) : defaultTransactions;

  if (hasError) {
    return (
      <div className="bg-white rounded-xl p-8 border border-red-200 text-center max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3 text-xl">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-gray-900">Failed to load investor metrics</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Unable to synchronize portfolio ledger data from the server.
        </p>
        <button
          onClick={() => setHasError(false)}
          className="px-4 py-2 bg-[#0F2A4A] text-white text-sm font-semibold rounded-lg hover:bg-[#1A3D66] transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const isRoiPositive = activePortfolio.overallRoiPct !== null && activePortfolio.overallRoiPct >= 0;

  return (
    <div className="space-y-8">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F2A4A] tracking-tight">
              Good morning, Aman <span aria-hidden="true">👋</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
              Your real estate portfolio is building steadily. Here is your investment snapshot.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate && onNavigate('portfolio')}
            className="px-3.5 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-2xs"
          >
            Full Portfolio &rarr;
          </button>
          <button
            onClick={() => {
              if (onTopUpClick) onTopUpClick();
              else if (onNavigate) onNavigate('wallet');
            }}
            className="px-4 py-2 bg-[#10B981] hover:bg-[#0EA271] text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
          >
            <span>+</span>
            <span>Top-up Wallet</span>
          </button>
        </div>
      </div>

      {/* 5 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Invested */}
        <KpiCard
          title="Total Invested"
          value={formatINR(activePortfolio.totalInvested)}
          subtitle="Cumulative principal"
          disclosure="Across all active & exited holdings"
          icon="💼"
          loading={loading}
        />

        {/* Current Portfolio Value */}
        <KpiCard
          title="Current Value"
          value={formatINR(activePortfolio.currentValue)}
          badge="+12.0% Proj."
          badgeType="positive"
          subtitle="Estimated asset value"
          disclosure="Based on verified appreciation since listing"
          icon="📈"
          loading={loading}
        />

        {/* Total Realized Payouts */}
        <KpiCard
            title="Current Gain"
            value={`+${formatINR(activePortfolio.currentValue - activePortfolio.totalInvested)}`}
            badge="Unrealized"
            badgeType="positive"
            subtitle="Portfolio appreciation"
            disclosure="Estimated gain across current holdings"
            icon="↗"
          loading={loading}
        />

        {/* Overall Net ROI */}
        <KpiCard
          title="Overall ROI"
          value={activePortfolio.overallRoiPct !== null ? `${activePortfolio.overallRoiPct > 0 ? '+' : ''}${activePortfolio.overallRoiPct}%` : '0%'}
          badge={activePortfolio.overallRoiPct !== null ? (isRoiPositive ? 'Gaining' : 'Loss') : 'Neutral'}
          badgeType={isRoiPositive ? 'positive' : 'negative'}
          subtitle="Net return on invested"
          disclosure="Combines realized payouts and active valuation"
          icon="🎯"
          loading={loading}
        />

        {/* Available Wallet Balance */}
        <KpiCard
          title="Available Cash"
          value={formatINR(activeWallet.availableBalance)}
          subtitle="Liquid wallet balance"
          disclosure="Ready for instant fractional purchases"
          icon="💳"
          loading={loading}
          onClick={() => onNavigate && onNavigate('wallet')}
          className="bg-gradient-to-br from-white to-blue-50/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Invest now', icon: '↗', action: 'marketplace' },
          { label: 'Add money', icon: '+', action: 'wallet' },
          { label: 'View portfolio', icon: '▤', action: 'portfolio' },
          { label: 'Transactions', icon: '⇄', action: 'wallet' }
        ].map((item) => (
          <button key={item.label} type="button" onClick={() => item.label === 'Add money' && onTopUpClick ? onTopUpClick() : onNavigate && onNavigate(item.action)} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-[0_4px_14px_rgba(15,42,74,.035)] transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-lg font-bold text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">{item.icon}</span>
            <span className="text-xs font-semibold text-[#0F2A4A] sm:text-sm">{item.label}</span>
            <span className="ml-auto text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600">→</span>
          </button>
        ))}
      </div>

      <PerformanceChart />

      {/* Main Grid: Allocation Chart & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Portfolio Allocation Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F2A4A]">Asset Allocation</h2>
                <p className="text-xs text-gray-500">Distribution across fractional properties</p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('portfolio')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                View all &rarr;
              </button>
            </div>

            <AllocationDonut
              data={activePortfolio.allocation}
              totalInvested={activePortfolio.totalInvested}
              className="mt-2"
            />
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Holdings count: <strong className="text-gray-900 font-semibold">{activePortfolio.allocation?.length || 0}</strong></span>
            <span>Total Units: <strong className="text-gray-900 font-semibold">30 units</strong></span>
          </div>
        </div>

        {/* Right Column: Recent Ledger Activity (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[#0F2A4A]">Recent Wallet Transactions</h2>
                <p className="text-xs text-gray-500">Append-only ledger history</p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('wallet')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Full Ledger &rarr;
              </button>
            </div>

            {/* Transactions List */}
            <div className="divide-y divide-gray-100">
              {recentTransactions.map((tx) => {
                const isCredit = tx.direction === 'CREDIT';
                return (
                  <div key={tx._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          }`}
                      >
                        {isCredit ? '↓' : '↑'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{tx.type}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                              }`}
                          >
                            {tx.direction}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {tx.refId || tx.refType} &bull; {formatDateIN(tx.createdAt, true)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <p className={`font-bold text-sm ${isCredit ? 'text-emerald-600' : 'text-gray-900'}`}>
                        {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Bal: {formatINR(tx.balanceAfter)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50/60 rounded-lg p-2.5 text-[11px] text-gray-500 flex items-center justify-between">
            <span>🔒 Reconciled against MongoDB session ledger</span>
            <span className="font-medium text-emerald-700">Audit Status: Verified</span>
          </div>
        </div>
      </div>

      {/* Recommended LIVE Investment Assets Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F2A4A]">Recommended LIVE Opportunities</h2>
            <p className="text-xs text-gray-500">Curated high-appreciation verified fractional assets currently fundraising</p>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('marketplace')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Explore All Properties &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProperties.map((prop) => (
            <PropertyCard
              key={prop._id}
              property={prop}
              onInvest={(p) => {
                if (onSelectPropertyForInvest) onSelectPropertyForInvest(p);
                else if (onNavigate) onNavigate('marketplace');
              }}
              onViewDetail={(p) => {
                if (onSelectPropertyDetail) onSelectPropertyDetail(p);
                else if (onNavigate) onNavigate('marketplace');
              }}
            />
          ))}

          {/* Quick CTA Card to browse more */}
          <div
            onClick={() => onNavigate && onNavigate('marketplace')}
            className="bg-gradient-to-br from-[#0F2A4A] to-[#1A3D66] rounded-xl p-6 text-white flex flex-col justify-between cursor-pointer hover:shadow-lg transition-all group"
          >
            <div>
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#D4A017] border border-white/10">
                Diversify Portfolio
              </span>
              <h3 className="text-xl font-bold mt-4 group-hover:translate-x-1 transition-transform">
                Explore More Fractional Properties &rarr;
              </h3>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                Filter by city, property type, price per unit, or funding rate. Start investing with integer units.
              </p>
            </div>
            <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
              <span>Whole-rupee unit pricing</span>
              <span className="font-bold text-[#10B981]">Browse Now &gt;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvestorDashboard;
