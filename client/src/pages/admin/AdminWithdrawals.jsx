import React, { useState } from 'react';
import { formatINR, formatNumberIN } from '../../utils/formatINR.js';
import { StatusChip } from '../../components/StatusChip.jsx';
import { ConfirmModal } from '../../components/ConfirmModal.jsx';

export function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([
    {
      _id: 'wd_001',
      userId: 'usr_devendra',
      userName: 'Devendra B',
      amount: 25000000, // ₹2,50,000 in paise
      status: 'PENDING',
      bankDetails: {
        bankName: 'HDFC Bank',
        accountHolder: 'Devendra B',
        accountNumber: '****4321',
        ifsc: 'HDFC0001234'
      },
      requestedTime: 'Requested 2h ago',
      reason: null,
      avatar: 'DB'
    },
    {
      _id: 'wd_002',
      userId: 'usr_pooja',
      userName: 'Pooja Mehta',
      amount: 10000000, // ₹1,00,000 in paise
      status: 'PENDING',
      bankDetails: {
        bankName: 'ICICI Bank',
        accountHolder: 'Pooja Mehta',
        accountNumber: '****8822',
        ifsc: 'ICIC0005678'
      },
      requestedTime: 'Requested 3h ago',
      reason: null,
      avatar: 'PM'
    },
    {
      _id: 'wd_003',
      userId: 'usr_karan',
      userName: 'Karan Mehra',
      amount: 5000000, // ₹50,000 in paise
      status: 'PENDING',
      bankDetails: {
        bankName: 'State Bank of India',
        accountHolder: 'Karan Mehra',
        accountNumber: '****9910',
        ifsc: 'SBIN0009988'
      },
      requestedTime: 'Requested 4h ago',
      reason: null,
      avatar: 'KM'
    },
    {
      _id: 'wd_004',
      userId: 'usr_aman',
      userName: 'Aman Patel',
      amount: 3500000, // ₹35,000 in paise
      status: 'PENDING',
      bankDetails: {
        bankName: 'Axis Bank',
        accountHolder: 'Aman Patel',
        accountNumber: '****3456',
        ifsc: 'UTIB0002100'
      },
      requestedTime: 'Requested 5h ago',
      reason: null,
      avatar: 'AP'
    },
    {
      _id: 'wd_005',
      userId: 'usr_priya',
      userName: 'Priya Verma',
      amount: 1500000, // ₹15,000 in paise
      status: 'PENDING',
      bankDetails: {
        bankName: 'Kotak Mahindra',
        accountHolder: 'Priya Verma',
        accountNumber: '****7712',
        ifsc: 'KKBK0000123'
      },
      requestedTime: 'Requested 6h ago',
      reason: null,
      avatar: 'PV'
    },
    {
      _id: 'wd_006',
      userId: 'usr_vikram',
      userName: 'Vikram Singh',
      amount: 7500000, // ₹75,000 in paise
      status: 'APPROVED',
      bankDetails: {
        bankName: 'HDFC Bank',
        accountHolder: 'Vikram Singh',
        accountNumber: '****1212',
        ifsc: 'HDFC0001234'
      },
      requestedTime: 'Approved Yesterday',
      reason: null,
      avatar: 'VS'
    },
    {
      _id: 'wd_007',
      userId: 'usr_isha',
      userName: 'Isha Patel',
      amount: 2500000, // ₹25,000 in paise
      status: 'REJECTED',
      bankDetails: {
        bankName: 'SBI',
        accountHolder: 'Isha Patel',
        accountNumber: '****1122',
        ifsc: 'SBIN0009988'
      },
      requestedTime: 'Rejected Sep 25',
      reason: 'IFSC branch code mismatch. Please update bank account details.',
      avatar: 'IP'
    }
  ]);

  const [activeTab, setActiveTab] = useState('PENDING');
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const pendingCount = withdrawals.filter((w) => w.status === 'PENDING').length;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = (item) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w._id === item._id ? { ...w, status: 'APPROVED', reason: null } : w))
    );
    showToast(`Withdrawal of ${formatINR(item.amount)} approved for ${item.userName}. Bank payout dispatched.`);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) return;
    setWithdrawals((prev) =>
      prev.map((w) => (w._id === rejectModalItem._id ? { ...w, status: 'REJECTED', reason: rejectReason } : w))
    );
    setRejectModalItem(null);
    setRejectReason('');
    showToast(`Withdrawal rejected. Reserved funds restored to investor wallet.`);
  };

  const filteredWithdrawals = withdrawals.filter((w) => w.status === activeTab);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F1E36] text-white px-4 py-3 rounded-lg shadow-xl border border-emerald-500/40 flex items-center space-x-2 text-sm animate-fade-in">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Withdrawals</h1>
        <p className="text-sm text-slate-500">Process and approve investor withdrawal requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'PENDING'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Pending</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('APPROVED')}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'APPROVED'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Approved</span>
        </button>

        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === 'REJECTED'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Rejected</span>
        </button>
      </div>

      {/* Withdrawals List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredWithdrawals.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-medium">No {activeTab.toLowerCase()} withdrawal requests found.</p>
          </div>
        ) : (
          filteredWithdrawals.map((item) => (
            <div
              key={item._id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/60 transition-colors"
            >
              {/* Left Details */}
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700">
                  {item.avatar}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{item.userName}</h3>
                    {item.status !== 'PENDING' && <StatusChip status={item.status} />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.bankDetails.bankName} &bull; {item.bankDetails.accountNumber} &bull; {item.requestedTime}
                  </p>
                  {item.reason && (
                    <p className="text-xs text-rose-600 mt-1">Reason: {item.reason}</p>
                  )}
                </div>
              </div>

              {/* Right Side: Amount and Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-5">
                <div className="text-left sm:text-right">
                  <span className="text-base sm:text-lg font-bold text-slate-900 block">
                    {formatINR(item.amount)}
                  </span>
                  <span className="text-2xs font-mono text-slate-400 uppercase">
                    IFSC: {item.bankDetails.ifsc}
                  </span>
                </div>

                {item.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRejectModalItem(item);
                        setRejectReason('');
                      }}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(item)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      <ConfirmModal
        isOpen={Boolean(rejectModalItem)}
        title={`Reject Withdrawal of ${rejectModalItem ? formatINR(rejectModalItem.amount) : ''}`}
        message="Specify the reason for rejection. The reserved amount will be released back to the investor's wallet balance."
        confirmText="Confirm Rejection"
        confirmVariant="danger"
        onCancel={() => setRejectModalItem(null)}
        onConfirm={handleRejectConfirm}
      >
        <div className="mt-3">
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Bank IFSC code mismatch or invalid beneficiary details..."
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </ConfirmModal>
    </div>
  );
}

export default AdminWithdrawals;
