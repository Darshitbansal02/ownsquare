import React, { useState } from 'react';
import { formatINR, formatNumberIN } from '../../utils/formatINR.js';
import { StatusChip } from '../../components/StatusChip.jsx';
import { ConfirmModal } from '../../components/ConfirmModal.jsx';

export function AdminProperties({ onSelectSellProperty }) {
  // Demo seed properties conforming to TESTING.md fixtures
  const [properties, setProperties] = useState([
    {
      _id: '100000000000000000000001',
      title: '2BHK, Sector 150, Noida',
      type: 'APARTMENT',
      city: 'Noida',
      state: 'Uttar Pradesh',
      valuation: 1000000000, // ₹1 Cr
      totalUnits: 1000,
      unitPrice: 1000000, // ₹10,000
      unitsSold: 1000,
      fundingPct: 100,
      status: 'HOLDING',
      brokerName: 'Rohit Broker',
      rejectionReason: null,
      createdAt: '2026-10-01T06:00:00.000Z'
    },
    {
      _id: '100000000000000000000002',
      title: 'Commercial Retail Hub, Whitefield',
      type: 'COMMERCIAL',
      city: 'Bangalore',
      state: 'Karnataka',
      valuation: 2500000000, // ₹2.5 Cr
      totalUnits: 2500,
      unitPrice: 1000000,
      unitsSold: 1250,
      fundingPct: 50,
      status: 'LIVE',
      brokerName: 'Rohit Broker',
      rejectionReason: null,
      createdAt: '2026-10-01T07:00:00.000Z'
    },
    {
      _id: '100000000000000000000003',
      title: 'Luxury Villa, Jubilee Hills',
      type: 'VILLA',
      city: 'Hyderabad',
      state: 'Telangana',
      valuation: 4000000000, // ₹4 Cr
      totalUnits: 2000,
      unitPrice: 2000000,
      unitsSold: 0,
      fundingPct: 0,
      status: 'PENDING_APPROVAL',
      brokerName: 'Rohit Broker',
      rejectionReason: null,
      createdAt: '2026-10-01T08:00:00.000Z'
    },
    {
      _id: '100000000000000000000004',
      title: 'Warehouse Logistics Park, Bhiwandi',
      type: 'WAREHOUSE',
      city: 'Thane',
      state: 'Maharashtra',
      valuation: 1500000000,
      totalUnits: 1500,
      unitPrice: 1000000,
      unitsSold: 1500,
      fundingPct: 100,
      status: 'FUNDED',
      brokerName: 'Rohit Broker',
      rejectionReason: null,
      createdAt: '2026-10-01T09:00:00.000Z'
    },
    {
      _id: '100000000000000000000005',
      title: 'Commercial Suite, Cyber City',
      type: 'COMMERCIAL',
      city: 'Gurugram',
      state: 'Haryana',
      valuation: 1200000000,
      totalUnits: 1200,
      unitPrice: 1000000,
      unitsSold: 1200,
      fundingPct: 100,
      status: 'SOLD',
      brokerName: 'Rohit Broker',
      rejectionReason: null,
      createdAt: '2026-10-01T10:00:00.000Z'
    },
    {
      _id: '100000000000000000000006',
      title: 'Agricultural Land Plot, Alibaug',
      type: 'PLOT',
      city: 'Alibaug',
      state: 'Maharashtra',
      valuation: 800000000,
      totalUnits: 800,
      unitPrice: 1000000,
      unitsSold: 0,
      fundingPct: 0,
      status: 'REJECTED',
      brokerName: 'Rohit Broker',
      rejectionReason: 'Valuation documentation incomplete; land title search certificate missing.',
      createdAt: '2026-10-01T11:00:00.000Z'
    }
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [rejectModalProperty, setRejectModalProperty] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelModalProperty, setCancelModalProperty] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = (property) => {
    setActionLoading(true);
    setTimeout(() => {
      setProperties((prev) =>
        prev.map((p) => (p._id === property._id ? { ...p, status: 'LIVE' } : p))
      );
      setActionLoading(false);
      showToast(`Property "${property.title}" approved and now LIVE!`);
    }, 400);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    setTimeout(() => {
      setProperties((prev) =>
        prev.map((p) =>
          p._id === rejectModalProperty._id
            ? { ...p, status: 'REJECTED', rejectionReason: rejectReason }
            : p
        )
      );
      setActionLoading(false);
      setRejectModalProperty(null);
      setRejectReason('');
      showToast(`Property rejected with reason recorded.`);
    }, 400);
  };

  const handleAcquire = (property) => {
    setActionLoading(true);
    setTimeout(() => {
      setProperties((prev) =>
        prev.map((p) => (p._id === property._id ? { ...p, status: 'HOLDING' } : p))
      );
      setActionLoading(false);
      showToast(`Acquisition confirmed for "${property.title}". Status updated to HOLDING.`);
    }, 400);
  };

  const handleCancelConfirm = () => {
    setActionLoading(true);
    setTimeout(() => {
      setProperties((prev) =>
        prev.map((p) => (p._id === cancelModalProperty._id ? { ...p, status: 'CANCELLED', unitsSold: 0 } : p))
      );
      setActionLoading(false);
      setCancelModalProperty(null);
      showToast(`Property cancelled. Active investor balances atomically refunded.`);
    }, 400);
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F2A4A] text-white px-4 py-3 rounded-lg shadow-xl border border-emerald-400 flex items-center space-x-2 text-sm">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2A4A]">Property Management & Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            Admin oversight for property lifecycle transitions, review queues, and exit payouts.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by property title, city or region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
          />
        </div>
        <div className="sm:w-60">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2A4A] bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="LIVE">Live</option>
            <option value="FUNDED">Funded</option>
            <option value="HOLDING">Holding</option>
            <option value="SOLD">Sold</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Properties Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-[#F7F8FA] text-gray-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Property</th>
                <th className="px-6 py-3.5">Valuation</th>
                <th className="px-6 py-3.5">Funding / Progress</th>
                <th className="px-6 py-3.5">Broker</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No properties match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredProperties.map((prop) => (
                  <tr key={prop._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#0F2A4A]">{prop.title}</p>
                      <p className="text-xs text-gray-500">{prop.city}, {prop.state} &bull; {prop.type}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatINR(prop.valuation)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-36">
                        <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                          <span>{prop.unitsSold} / {prop.totalUnits} units</span>
                          <span>{prop.fundingPct}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              prop.fundingPct === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, prop.fundingPct)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{prop.brokerName}</td>
                    <td className="px-6 py-4">
                      <StatusChip status={prop.status} />
                      {prop.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={prop.rejectionReason}>
                          Reason: {prop.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {/* PENDING APPROVAL ACTIONS */}
                      {prop.status === 'PENDING_APPROVAL' && (
                        <>
                          <button
                            onClick={() => handleApprove(prop)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectModalProperty(prop);
                              setRejectReason('');
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* FUNDED ACTION -> HOLDING */}
                      {prop.status === 'FUNDED' && (
                        <button
                          onClick={() => handleAcquire(prop)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-semibold transition-colors shadow-sm"
                        >
                          Confirm Acquisition (HOLDING)
                        </button>
                      )}

                      {/* HOLDING ACTION -> SELL */}
                      {prop.status === 'HOLDING' && (
                        <button
                          onClick={() => onSelectSellProperty && onSelectSellProperty(prop)}
                          className="px-3 py-1.5 bg-[#0F2A4A] hover:bg-[#1A3D66] text-white rounded text-xs font-semibold transition-colors shadow-sm"
                        >
                          Record Sale & Payout &rarr;
                        </button>
                      )}

                      {/* LIVE ACTION -> CANCEL & MASS REFUND */}
                      {prop.status === 'LIVE' && (
                        <button
                          onClick={() => setCancelModalProperty(prop)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 rounded text-xs font-medium transition-colors"
                        >
                          Cancel Listing
                        </button>
                      )}

                      {/* TERMINAL STATUSES */}
                      {(prop.status === 'SOLD' || prop.status === 'CANCELLED' || prop.status === 'REJECTED') && (
                        <span className="text-xs text-gray-400 italic">Terminal</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Property Modal */}
      <ConfirmModal
        isOpen={!!rejectModalProperty}
        title={`Reject Property: ${rejectModalProperty?.title}`}
        confirmLabel="Confirm Rejection"
        confirmVariant="danger"
        isLoading={actionLoading}
        onCancel={() => setRejectModalProperty(null)}
        onConfirm={handleRejectConfirm}
      >
        <p className="text-sm text-gray-600 mb-3">
          Please provide an explicit, constructive rejection reason (1-2000 characters). This explanation will be displayed to the broker for necessary revisions and resubmission.
        </p>
        <textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="e.g. Valuation documentation incomplete; missing title deed verification..."
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </ConfirmModal>

      {/* Cancel Property Modal */}
      <ConfirmModal
        isOpen={!!cancelModalProperty}
        title={`Confirm Cancellation: ${cancelModalProperty?.title}`}
        message="Are you sure you want to cancel this live listing? This action will atomically refund 100% of invested principal to all active investors via immutable REFUND ledger transactions and mark the property as CANCELLED."
        confirmLabel="Cancel Listing & Refund Investors"
        confirmVariant="danger"
        isLoading={actionLoading}
        onCancel={() => setCancelModalProperty(null)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
}
