import React, { useState } from 'react';
import { formatINR, formatNumberIN } from '../../utils/formatINR.js';
import { StatusChip } from '../../components/StatusChip.jsx';
import { ConfirmModal } from '../../components/ConfirmModal.jsx';

export function AdminPropertySale({ property, onBack }) {
  // Fallback demo holding property if none passed
  const activeProperty = property || {
    _id: '100000000000000000000001',
    title: '2BHK, Sector 150, Noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    valuation: 1000000000, // ₹1 Cr in paise
    totalUnits: 1000,
    unitPrice: 1000000, // ₹10,000 in paise
    status: 'HOLDING',
    brokerName: 'Rohit Broker'
  };

  // Default sale price: ₹1.4 Crore (140,000,000 paise * 100 = 1,400,000,000 paise)
  const [salePriceRupees, setSalePriceRupees] = useState(14000000);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Calculate read-only mathematical preview
  const handleCalculatePreview = () => {
    setLoadingPreview(true);
    setTimeout(() => {
      const salePricePaise = Math.round(Number(salePriceRupees) * 100);
      const platformFeePct = 2; // 2% platform fee
      const feeBasisPoints = 200;
      const platformFee = Math.floor((salePricePaise * feeBasisPoints) / 10000);
      const distributable = salePricePaise - platformFee;

      // Realistic holder distribution conforming to source walkthrough (PRD.md / API_DESIGN.md)
      const mockHolders = [
        { investorId: '000000000000000000000003', name: 'Aman', units: 20, invested: 20000000 },
        { investorId: '000000000000000000000004', name: 'Priya', units: 50, invested: 50000000 },
        { investorId: '000000000000000000000005', name: 'Karan', units: 400, invested: 400000000 },
        { investorId: '000000000000000000000006', name: 'Isha', units: 300, invested: 300000000 },
        { investorId: '000000000000000000000007', name: 'Neha', units: 230, invested: 230000000 }
      ];

      let sumAllocated = 0;
      const items = mockHolders.map((holder) => {
        const share = Math.floor((distributable * holder.units) / activeProperty.totalUnits);
        sumAllocated += share;
        const roi = Number((((share - holder.invested) / holder.invested) * 100).toFixed(1));
        return {
          ...holder,
          payoutAmount: share,
          roiPct: roi,
          ownershipPct: (holder.units / activeProperty.totalUnits) * 100
        };
      });

      const remainder = distributable - sumAllocated;
      let remainderInvestorId = null;

      if (remainder > 0) {
        items.sort((a, b) => b.units - a.units);
        items[0].payoutAmount += remainder;
        remainderInvestorId = items[0].investorId;
      }

      setPreview({
        salePrice: salePricePaise,
        platformFeePct,
        platformFee,
        distributable,
        items,
        remainder,
        remainderInvestorId,
        totalPayout: distributable
      });
      setLoadingPreview(false);
    }, 350);
  };

  const handleExecuteSale = () => {
    setExecuting(true);
    setTimeout(() => {
      setExecuting(false);
      setConfirmModalOpen(false);
      setExecutionResult({
        propertyStatus: 'SOLD',
        soldAt: new Date().toISOString(),
        payoutId: '300000000000000000000001',
        totalDistributed: preview.distributable,
        platformFeeCredited: preview.platformFee,
        investorCount: preview.items.length
      });
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header with Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm font-semibold text-[#0F2A4A] hover:underline flex items-center space-x-1"
        >
          <span>&larr;</span> <span>Back to Properties</span>
        </button>
        <span className="text-xs font-semibold px-2.5 py-1 rounded bg-purple-100 text-purple-800">
          HOLDING EXIT WORKFLOW
        </span>
      </div>

      {/* Property Overview Card */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-[#0F2A4A]">{activeProperty.title}</h1>
              <StatusChip status={activeProperty.status} />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {activeProperty.city}, {activeProperty.state} &bull; Sourced by {activeProperty.brokerName}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase font-bold text-gray-400">Original Valuation</p>
            <p className="text-xl font-bold text-[#0F2A4A]">{formatINR(activeProperty.valuation)}</p>
            <p className="text-xs text-gray-500">{activeProperty.totalUnits} Units &bull; {formatINR(activeProperty.unitPrice)} / unit</p>
          </div>
        </div>
      </div>

      {/* Execution Completed Receipt View */}
      {executionResult ? (
        <div className="bg-white rounded-xl p-8 border-2 border-emerald-500 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-[#0F2A4A]">Property Sale Successfully Executed!</h2>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            The property has transitioned to <strong>SOLD</strong>. Proportional investor payouts have been atomically credited to each investor's in-app wallet via the immutable ledger.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto pt-4 text-left">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Gross Realized Proceeds</span>
              <p className="text-lg font-bold text-[#0F2A4A]">{formatINR(preview.salePrice)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Net Distributable</span>
              <p className="text-lg font-bold text-emerald-600">{formatINR(executionResult.totalDistributed)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs text-gray-500">Platform 2% Fee</span>
              <p className="text-lg font-bold text-[#D4A017]">{formatINR(executionResult.platformFeeCredited)}</p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onBack}
              className="px-6 py-2.5 bg-[#0F2A4A] hover:bg-[#1A3D66] text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
            >
              Return to Properties Management
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Sale Price Input Section */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-[#0F2A4A]">1. Enter Agreed Property Sale Price</h2>
            <p className="text-sm text-gray-600">
              Provide the total gross consideration offered by the acquiring buyer. The platform supports profitable exits as well as loss-bearing depreciated sales.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Agreed Sale Price (in Indian Rupees &bull; ₹)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">
                    ₹
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    value={salePriceRupees}
                    onChange={(e) => {
                      setSalePriceRupees(e.target.value);
                      setPreview(null); // Invalidate stale preview
                    }}
                    className="block w-full pl-8 pr-12 py-2.5 border border-gray-300 rounded-lg text-lg font-bold text-[#0F2A4A] focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
                    placeholder="e.g. 14000000"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-gray-400">
                    INR
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Storage equivalent: {formatINR(Math.round(Number(salePriceRupees || 0) * 100))} (
                  {Math.round(Number(salePriceRupees || 0) * 100)} integer paise)
                </p>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCalculatePreview}
                  disabled={loadingPreview || !salePriceRupees}
                  className="w-full py-2.5 bg-[#0F2A4A] hover:bg-[#1A3D66] text-white rounded-lg text-sm font-semibold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loadingPreview ? (
                    <span>Calculating Math...</span>
                  ) : (
                    <span>Calculate Payout Preview &rarr;</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Interactive Payout Preview Card */}
          {preview && (
            <div className="space-y-6">
              {/* Financial Math Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Gross Sale Price */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-xs uppercase font-bold text-gray-400">Gross Sale Price</span>
                  <p className="text-2xl font-bold text-[#0F2A4A] mt-1">{formatINR(preview.salePrice)}</p>
                  <p className="text-xs text-gray-400 mt-1">100% Total Exit Consideration</p>
                </div>

                {/* Platform Fee */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-gray-400">Platform Fee</span>
                    <span className="text-xs font-bold text-[#D4A017] px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                      {preview.platformFeePct}%
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#D4A017] mt-1">{formatINR(preview.platformFee)}</p>
                  <p className="text-xs text-gray-400 mt-1">Floor basis points integer calculation</p>
                </div>

                {/* Net Distributable */}
                <div className="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
                  <span className="text-xs uppercase font-bold text-emerald-800">Net Distributable</span>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{formatINR(preview.distributable)}</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Exact conservation sum to 100% of investors
                  </p>
                </div>
              </div>

              {/* Remainder Conservation Callout */}
              {preview.remainder > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
                  <span>
                    <strong>Exact Paise Conservation:</strong> A remainder of {preview.remainder} paise arose from integer floor division. In accordance with Business Rules D5, it has been assigned to the largest aggregate holder.
                  </span>
                  <span className="font-bold ml-2">Assigned: Largest Holder</span>
                </div>
              )}

              {/* Fractional Shareholder Payout Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-[#0F2A4A]">Investor Proceeds Breakdown</h3>
                  <span className="text-xs font-semibold text-gray-500">
                    {preview.items.length} Fractional Owners
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-[#F7F8FA] text-gray-600 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-6 py-3">Investor</th>
                        <th className="px-6 py-3">Units & Ownership %</th>
                        <th className="px-6 py-3">Original Invested</th>
                        <th className="px-6 py-3">Net Payout</th>
                        <th className="px-6 py-3 text-right">Realized ROI %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.items.map((holder) => (
                        <tr key={holder.investorId} className="hover:bg-gray-50/60">
                          <td className="px-6 py-3.5 font-semibold text-[#0F2A4A]">
                            {holder.name}
                            <span className="block text-xs font-normal text-gray-400">ID: {holder.investorId}</span>
                          </td>
                          <td className="px-6 py-3.5 text-gray-700">
                            {holder.units} units ({holder.ownershipPct}%)
                          </td>
                          <td className="px-6 py-3.5 text-gray-700">
                            {formatINR(holder.invested)}
                          </td>
                          <td className="px-6 py-3.5 font-bold text-emerald-600">
                            {formatINR(holder.payoutAmount)}
                          </td>
                          <td className="px-6 py-3.5 text-right font-bold">
                            {holder.roiPct >= 0 ? (
                              <span className="text-emerald-600">+{holder.roiPct}%</span>
                            ) : (
                              <span className="text-red-600">{holder.roiPct}%</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 3: Confirmation and Execution Button */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-bold text-[#0F2A4A]">Confirm & Commit Sale Execution</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    This will finalize the sale, transition the asset to SOLD, and atomically deposit {formatINR(preview.distributable)} into investor wallets.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmModalOpen(true)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors"
                >
                  Confirm Sale & Distribute Payouts
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title="Confirm Irreversible Property Sale"
        confirmLabel="Execute Sale & Payouts"
        confirmVariant="success"
        isLoading={executing}
        onCancel={() => setConfirmModalOpen(false)}
        onConfirm={handleExecuteSale}
      >
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            You are about to record the final sale of <strong>{activeProperty.title}</strong> for{' '}
            <strong>{formatINR(preview?.salePrice)}</strong>.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-500">
            <li>Platform fee of {formatINR(preview?.platformFee)} (2%) will be recorded in the ledger.</li>
            <li>Net distributable of {formatINR(preview?.distributable)} will be credited to {preview?.items.length} investors.</li>
            <li>All investment rows will be marked as EXITED.</li>
            <li>This action is idempotent; subsequent requests will be rejected with HTTP 409 ALREADY_SOLD.</li>
          </ul>
        </div>
      </ConfirmModal>
    </div>
  );
}
