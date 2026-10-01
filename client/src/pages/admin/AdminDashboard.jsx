import React, { useState, useEffect } from 'react';
import { formatINR, formatNumberIN } from '../../utils/formatINR.js';
import { StatusChip } from '../../components/StatusChip.jsx';

export function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState({
    aum: 1000000000, // ₹1 Cr in paise
    usersByRole: { ADMIN: 1, BROKER: 2, INVESTOR: 5 },
    liveProperties: 2,
    fundsRaisedThisMonth: 100000000, // ₹10 Lakh in paise
    platformFeesEarned: 28000000, // ₹2.8 Lakh in paise
    propertiesByStatus: [
      { status: 'DRAFT', count: 1 },
      { status: 'PENDING_APPROVAL', count: 1 },
      { status: 'LIVE', count: 2 },
      { status: 'FUNDED', count: 1 },
      { status: 'HOLDING', count: 1 },
      { status: 'SOLD', count: 1 },
      { status: 'REJECTED', count: 1 },
      { status: 'CANCELLED', count: 0 }
    ],
    approvalQueue: {
      properties: 1,
      brokers: 1,
      kyc: 2,
      withdrawals: 1
    }
  });

  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2A4A]">Platform Performance Overview</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time platform metrics, financial reconciliation, and administrative review queues.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
            Ledger Synchronized
          </span>
        </div>
      </div>

      {/* 5 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* AUM */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">AUM (Valuation)</p>
          <p className="text-2xl font-bold text-[#0F2A4A] mt-2">{formatINR(stats.aum)}</p>
          <p className="text-xs text-gray-400 mt-1">Funded & Holding Assets</p>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Registered Users</p>
          <p className="text-2xl font-bold text-[#0F2A4A] mt-2">
            {stats.usersByRole.INVESTOR + stats.usersByRole.BROKER + stats.usersByRole.ADMIN}
          </p>
          <p className="text-xs text-emerald-600 font-medium mt-1">
            {stats.usersByRole.INVESTOR} Investors &bull; {stats.usersByRole.BROKER} Brokers
          </p>
        </div>

        {/* Live Properties */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Live Fundraising</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{stats.liveProperties}</p>
          <p className="text-xs text-gray-400 mt-1">Accepting Unit Purchases</p>
        </div>

        {/* Monthly Raised */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Raised This Month</p>
          <p className="text-2xl font-bold text-[#10B981] mt-2">{formatINR(stats.fundsRaisedThisMonth)}</p>
          <p className="text-xs text-gray-400 mt-1">UTC Calendar Month</p>
        </div>

        {/* Platform Fees */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs uppercase font-bold text-gray-500 tracking-wider">Platform Revenue</p>
          <p className="text-2xl font-bold text-[#D4A017] mt-2">{formatINR(stats.platformFeesEarned)}</p>
          <p className="text-xs text-gray-400 mt-1">Cumulative Ledger Fees</p>
        </div>
      </div>

      {/* Immediate Attention: Action Queues Widget */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-[#0F2A4A] mb-4 flex items-center">
          <span className="mr-2">⚡</span> Administrative Approval Queues
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pending Properties */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Properties</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
                  {stats.approvalQueue.properties} Pending
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Listings submitted by brokers awaiting verification and publication.
              </p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('properties')}
              className="mt-4 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Review Properties &rarr;
            </button>
          </div>

          {/* Pending Brokers */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Brokers</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-200 text-blue-900">
                  {stats.approvalQueue.brokers} Pending
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                New broker registrations requiring admin credential authorization.
              </p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('users')}
              className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Authorize Brokers &rarr;
            </button>
          </div>

          {/* Pending KYC */}
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-800">KYC Submissions</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-200 text-purple-900">
                  {stats.approvalQueue.kyc} Pending
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Investor identity documents submitted for P1 gate validation.
              </p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('kyc')}
              className="mt-4 w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Verify Documents &rarr;
            </button>
          </div>

          {/* Pending Withdrawals */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Withdrawals</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900">
                  {stats.approvalQueue.withdrawals} Pending
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Investor wallet payout requests with reserved available balances.
              </p>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('withdrawals')}
              className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              Process Payouts &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Property Status Distribution Breakdown */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-[#0F2A4A] mb-4">Lifecycle State Distribution</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {stats.propertiesByStatus.map((item) => (
            <div
              key={item.status}
              className="p-3 rounded-lg border border-gray-100 bg-[#F7F8FA] flex flex-col items-center text-center"
            >
              <StatusChip status={item.status} />
              <span className="text-2xl font-bold text-[#0F2A4A] mt-2">{item.count}</span>
              <span className="text-xs text-gray-400 mt-0.5">Properties</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
