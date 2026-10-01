import React, { useState } from 'react';
import { formatINR } from '../../utils/formatINR.js';
import { StatusChip } from '../../components/StatusChip.jsx';
import { ConfirmModal } from '../../components/ConfirmModal.jsx';

export function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([
    {
      _id: '600000000000000000000001',
      userId: '000000000000000000000003',
      userName: 'Aman Investor',
      amount: 10000000, // ₹1,00,000 in paise
      status: 'PENDING',
      bankDetails: {
        accountHolder: 'Aman Investor',
        accountNumber: '****9876',
        ifsc: 'HDFC0001234'
      },
      reason: null,
      createdAt: '2026-10-01T07:15:00.000Z'
    },
    {
      _id: '600000000000000000000002',
      userId: '000000000000000000000004',
      userName: 'Priya Verma',
      amount: 5000000, // ₹50,000 in paise
      status: 'APPROVED',
      bankDetails: {
        accountHolder: 'Priya Verma',
        accountNumber: '****4321',
        ifsc: 'ICIC0005678'
      },
      reason: null,
      createdAt: '2026-10-01T06:00:00.000Z'
    },
    {
      _id: '600000000000000000000003',
      userId: '000000000000000000000006',
      userName: 'Isha Patel',
      amount: 2500000, // ₹25,000 in paise
      status: 'REJECTED',
      bankDetails: {
        accountHolder: 'Isha Patel',
        accountNumber: '****1122',
        ifsc: 'SBIN0009988'
      },
      reason: 'IFSC branch code mismatch. Please update bank account details.',
      createdAt: '2026-10-01T05:30:00.000Z'
    }
  ]);

  const [activeTab, setActiveTab] = useState('ALL');
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = (item) => {
    setActionLoading(true);
    setTimeout(() => {
      setWithdrawals((prev) =>
        prev.map((w) => (w._id === item._id ? { ...w, status: 'APPROVED', reason: null } : w))
      );
      setActionLoading(false);
      showToast(`Withdrawal of ${formatINR(item.amount)} approved for ${item.userName}. Ledger debited.`);
    }, 350);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    setTimeout(() => {
      setWithdrawals((prev) =>
        prev.map((w) => (w._id === rejectModalItem._id ? { ...w, status: 'REJECTED', reason: rejectReason } : w))
      );
      setActionLoading(false);
      setRejectModalItem(null);
      setRejectReason('');
      showToast(`Withdrawal rejected. Reserved balance restored to investor wallet.`);
    }, 350);
  };

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (activeTab === 'ALL') return true;
    return w.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F2A4A] text-white px-4 py-3 rounded-lg shadow-xl border border-emerald-400 flex items-center space-x-2 text-sm">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2A4A]">Investor Withdrawal Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and execute wallet payout requests. Approval posts a debit to the ledger; rejection releases the reserved balance.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
          Simulated Processing
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#0F2A4A] text-[#0F2A4A]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab} Requests
          </button>
        ))}
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-[#F7F8FA] text-gray-600 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3.5">Investor</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Bank Account (Masked)</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No withdrawal requests found.
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#0F2A4A]">{item.userName}</p>
                      <p className="text-xs text-gray-400">ID: {item.userId}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#0F2A4A]">
                      {formatINR(item.amount)}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      <p className="font-semibold text-gray-800">{item.bankDetails.accountHolder}</p>
                      <p>{item.bankDetails.accountNumber} &bull; {item.bankDetails.ifsc}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip status={item.status} />
                      {item.reason && (
                        <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={item.reason}>
                          {item.reason}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {item.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleApprove(item)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            Approve & Payout
                          </button>
                          <button
                            onClick={() => {
                              setRejectModalItem(item);
                              setRejectReason('');
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      <ConfirmModal
        isOpen={!!rejectModalItem}
        title={`Reject Withdrawal of ${formatINR(rejectModalItem?.amount)}`}
        confirmLabel="Confirm Rejection"
        confirmVariant="danger"
        isLoading={actionLoading}
        onCancel={() => setRejectModalItem(null)}
        onConfirm={handleRejectConfirm}
      >
        <p className="text-sm text-gray-600 mb-3">
          Provide a mandatory reason for rejecting this withdrawal. The reserved balance will be released back to the investor's available wallet.
        </p>
        <textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="e.g. Invalid bank IFSC code or account holder name mismatch..."
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </ConfirmModal>
    </div>
  );
}
