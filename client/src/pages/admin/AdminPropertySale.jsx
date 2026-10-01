import React, { useState, useMemo } from 'react';
import { formatINR, formatNumberIN } from '../../utils/formatINR.js';
import { StatusChip } from '../../components/StatusChip.jsx';
import { ConfirmModal } from '../../components/ConfirmModal.jsx';

export function AdminPropertySale({ property, onBack }) {
  // Default property if none passed from props
  const activeProperty = useMemo(() => {
    return property || {
      _id: 'prop_pune_central',
      title: 'Pune Central, Pune, MH',
      city: 'Pune',
      state: 'Maharashtra',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
      valuation: 1800000000, // ₹18,00,00,000 in paise
      totalUnits: 9000,
      unitsSold: 9000,
      unitPrice: 2000000, // ₹20,000 in paise
      totalInvestors: 210,
      status: 'HOLDING',
      brokerName: 'Apex Realty Advisors',
      rentalYield: 8.4
    };
  }, [property]);

  // Sale price in Rupees (default: ₹22,00,00,000)
  const initialSalePrice = activeProperty.valuation ? Math.round((activeProperty.valuation / 100) * 1.222) : 220000000;
  const [salePriceRupees, setSalePriceRupees] = useState(initialSalePrice);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [showAllInvestors, setShowAllInvestors] = useState(false);

  // Calculations
  const platformFeePct = 2.0; // 2%
  const totalInvestedRupees = (activeProperty.valuation || 1800000000) / 100;
  const salePriceVal = Number(salePriceRupees) || 0;
  const platformFeeRupees = Math.round((salePriceVal * platformFeePct) / 100);
  const distributableRupees = salePriceVal - platformFeeRupees;
  const totalProfitRupees = distributableRupees - totalInvestedRupees;
  const profitPercentage = totalInvestedRupees > 0 ? ((totalProfitRupees / totalInvestedRupees) * 100).toFixed(1) : 0;

  // Mock investor breakdown
  const sampleInvestors = useMemo(() => {
    const rawList = [
      { id: 'inv_1', name: 'Rohit Kumar', units: 450, ownership: 5.0, avatar: 'RK' },
      { id: 'inv_2', name: 'Priya Sharma', units: 300, ownership: 3.3, avatar: 'PS' },
      { id: 'inv_3', name: 'Aman Patel', units: 250, ownership: 2.8, avatar: 'AP' },
      { id: 'inv_4', name: 'Vikram Singh', units: 200, ownership: 2.2, avatar: 'VS' },
      { id: 'inv_5', name: 'Neha Gupta', units: 180, ownership: 2.0, avatar: 'NG' },
      { id: 'inv_6', name: 'Suresh Reddy', units: 150, ownership: 1.7, avatar: 'SR' },
      { id: 'inv_7', name: 'Ananya Roy', units: 140, ownership: 1.5, avatar: 'AR' },
      { id: 'inv_8', name: 'Devendra Bhadhotia', units: 120, ownership: 1.3, avatar: 'DB' },
    ];

    const totalUnits = activeProperty.totalUnits || 9000;

    return rawList.map((inv) => {
      const shareOfInvested = Math.round((totalInvestedRupees * inv.units) / totalUnits);
      const shareOfDistributable = Math.round((distributableRupees * inv.units) / totalUnits);
      const gain = shareOfDistributable - shareOfInvested;
      return {
        ...inv,
        investedRupees: shareOfInvested,
        payoutRupees: shareOfDistributable,
        gainRupees: gain,
        gainPct: shareOfInvested > 0 ? ((gain / shareOfInvested) * 100).toFixed(1) : 0
      };
    });
  }, [activeProperty.totalUnits, totalInvestedRupees, distributableRupees]);

  const handleExecutePayout = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      setConfirmModalOpen(false);
      setExecutionResult({
        propertyStatus: 'SOLD',
        soldAt: new Date().toISOString(),
        payoutId: 'PAYOUT-' + Math.floor(100000 + Math.random() * 900000),
        grossSale: salePriceVal,
        platformFee: platformFeeRupees,
        netDistributed: distributableRupees,
        totalInvestors: activeProperty.totalInvestors || 210
      });
    }, 600);
  };

  if (executionResult) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Property Sale Executed Successfully!</h2>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            {activeProperty.title} is now recorded as <span className="font-semibold text-slate-800">SOLD</span>. Investor wallet balances have been credited via the platform ledger.
          </p>

          <div className="mt-6 bg-slate-50 rounded-xl p-5 border border-slate-100 max-w-lg mx-auto text-left space-y-3">
            <div className="flex justify-between text-sm py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Payout Reference</span>
              <span className="font-mono font-semibold text-slate-800">{executionResult.payoutId}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Gross Sale Price</span>
              <span className="font-semibold text-slate-800">₹{formatNumberIN(executionResult.grossSale)}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Platform Fee (2%)</span>
              <span className="font-semibold text-emerald-600">+₹{formatNumberIN(executionResult.platformFee)}</span>
            </div>
            <div className="flex justify-between text-sm py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Net Distributed</span>
              <span className="font-bold text-slate-900">₹{formatNumberIN(executionResult.netDistributed)}</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-slate-500">Recipients Credited</span>
              <span className="font-semibold text-slate-800">{executionResult.totalInvestors} Token Holders</span>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-lg bg-[#0F1E36] hover:bg-slate-900 text-white text-sm font-semibold shadow-sm transition-colors"
            >
              Return to Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-xs"
            title="Back to Properties"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Record Sale</h1>
            <p className="text-sm text-slate-500">Execute property sale and process investor payouts</p>
          </div>
        </div>
      </div>

      {/* Top 2 Cards: Property Summary & Sale Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Property Summary */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Property Summary</h2>
              <StatusChip status={activeProperty.status || 'HOLDING'} />
            </div>

            <div className="flex items-start gap-4 mb-5">
              <div className="w-24 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                <img
                  src={activeProperty.image || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80'}
                  alt={activeProperty.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-slate-900 truncate">{activeProperty.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{activeProperty.city}, {activeProperty.state}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Broker: {activeProperty.brokerName || 'Apex Realty'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Units Sold</span>
                <span className="font-semibold text-slate-900">
                  {formatNumberIN(activeProperty.unitsSold || 9000)} (100%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
              </div>

              <div className="flex justify-between items-center text-sm pt-1">
                <span className="text-slate-500">Total Investment</span>
                <span className="font-bold text-slate-900">₹{formatNumberIN(totalInvestedRupees)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Total Investors</span>
                <span className="font-semibold text-slate-800">{activeProperty.totalInvestors || 210}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAllInvestors(!showAllInvestors)}
              className="w-full py-2.5 px-4 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span>{showAllInvestors ? 'Hide Full Investor Ledger' : 'View Investors'}</span>
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right: Sale Details */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Sale Details</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                P4 Capital Exit
              </span>
            </div>

            <div className="space-y-4">
              {/* Sale Price Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Sale Price (₹)
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                    ₹
                  </div>
                  <input
                    type="number"
                    value={salePriceRupees}
                    onChange={(e) => setSalePriceRupees(e.target.value)}
                    className="block w-full pl-8 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg text-slate-900 font-bold text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                    placeholder="Enter total gross sale price"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Formatted: ₹{formatNumberIN(salePriceVal)}</p>
              </div>

              {/* Calculations Box */}
              <div className="bg-slate-50/80 rounded-lg p-4 border border-slate-100 space-y-2.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Platform Fee (2%)</span>
                  <span className="font-semibold text-slate-800">₹{formatNumberIN(platformFeeRupees)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-200/50">
                  <span className="text-slate-600 font-medium">Distributable</span>
                  <span className="font-bold text-slate-900 text-base">₹{formatNumberIN(distributableRupees)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-200/50">
                  <span className="text-slate-600 font-medium">Total Profit</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-600">
                      ₹{formatNumberIN(totalProfitRupees)} ({profitPercentage}%)
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">
                      ↑ Gain
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Proceeds distribute pro-rata to investors based on verified unit holdings.</span>
          </div>
        </div>
      </div>

      {/* Bottom Card: Investor Payout Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Investor Payout Preview</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pro-rata net proceeds distribution preview for {activeProperty.totalInvestors || 210} token holders
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
            Sample Breakdown
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-2xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Investor</th>
                <th className="py-3 px-6">Units</th>
                <th className="py-3 px-6">Ownership %</th>
                <th className="py-3 px-6">Invested Amount</th>
                <th className="py-3 px-6">Payout Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sampleInvestors.slice(0, showAllInvestors ? sampleInvestors.length : 4).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                        {inv.avatar}
                      </div>
                      <span className="font-semibold text-slate-800">{inv.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 font-medium">
                    {formatNumberIN(inv.units)}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                      {inv.ownership.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-6 font-medium text-slate-600">
                    ₹{formatNumberIN(inv.investedRupees)}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="font-bold text-emerald-600">
                      ₹{formatNumberIN(inv.payoutRupees)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Bar Footer */}
        <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setConfirmModalOpen(true)}
            className="px-6 py-2.5 rounded-lg bg-[#0F1E36] hover:bg-slate-900 text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <span>Execute Payout</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title="Confirm Property Exit & Investor Payout"
        message={`Are you sure you want to finalize the sale of "${activeProperty.title}" for ₹${formatNumberIN(salePriceVal)}? This will irrevocably mark the property as SOLD, credit ₹${formatNumberIN(distributableRupees)} across ${activeProperty.totalInvestors || 210} investor wallets, and record a ₹${formatNumberIN(platformFeeRupees)} platform fee.`}
        confirmText="Confirm & Execute Payout"
        confirmVariant="danger"
        isLoading={executing}
        onConfirm={handleExecutePayout}
        onCancel={() => setConfirmModalOpen(false)}
      />
    </div>
  );
}

export default AdminPropertySale;
