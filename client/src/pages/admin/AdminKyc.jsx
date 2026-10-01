import React, { useState } from 'react';
import { StatusChip } from '../../components/StatusChip.jsx';
import { ConfirmModal } from '../../components/ConfirmModal.jsx';

export function AdminKyc() {
  const [submissions, setSubmissions] = useState([
    {
      _id: 'kyc_001',
      userId: '000000000000000000000005',
      userName: 'Karan Mehra',
      userEmail: 'karan@demo.com',
      userPhone: '+91 9876543214',
      status: 'PENDING',
      docs: [
        { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', name: 'dummy_aadhaar_card.pdf', publicId: 'dummy_aadhaar' }
      ],
      selfie: { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', name: 'dummy_selfie.jpg', publicId: 'dummy_selfie' },
      reason: null,
      submittedAt: '2026-10-01T06:30:00.000Z'
    },
    {
      _id: 'kyc_002',
      userId: '000000000000000000000003',
      userName: 'Aman Investor',
      userEmail: 'aman@demo.com',
      userPhone: '+91 9876543212',
      status: 'APPROVED',
      docs: [
        { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', name: 'dummy_pan_card.pdf', publicId: 'dummy_pan' }
      ],
      selfie: { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', name: 'dummy_selfie_aman.jpg', publicId: 'dummy_selfie_aman' },
      reason: null,
      submittedAt: '2026-10-01T06:10:00.000Z'
    },
    {
      _id: 'kyc_003',
      userId: '000000000000000000000006',
      userName: 'Isha Patel',
      userEmail: 'isha@demo.com',
      userPhone: '+91 9876543215',
      status: 'REJECTED',
      docs: [
        { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', name: 'dummy_id_unclear.pdf', publicId: 'dummy_id_unclear' }
      ],
      selfie: { url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', name: 'dummy_selfie_isha.jpg', publicId: 'dummy_selfie_isha' },
      reason: 'Provided dummy document is blurry and ID number is illegible. Please re-upload.',
      submittedAt: '2026-10-01T06:40:00.000Z'
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

  const handleApproveKyc = (item) => {
    setActionLoading(true);
    setTimeout(() => {
      setSubmissions((prev) =>
        prev.map((s) => (s._id === item._id ? { ...s, status: 'APPROVED', reason: null } : s))
      );
      setActionLoading(false);
      showToast(`KYC approved for ${item.userName}. Investor is now authorized to buy units.`);
    }, 350);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    setTimeout(() => {
      setSubmissions((prev) =>
        prev.map((s) => (s._id === rejectModalItem._id ? { ...s, status: 'REJECTED', reason: rejectReason } : s))
      );
      setActionLoading(false);
      setRejectModalItem(null);
      setRejectReason('');
      showToast(`KYC rejected. Reason communicated to investor.`);
    }, 350);
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (activeTab === 'ALL') return true;
    return s.status === activeTab;
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
          <h1 className="text-2xl font-bold text-[#0F2A4A]">Investor KYC Review Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Validate uploaded dummy identity proofs and selfies for the P1 investment gate.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-100 text-purple-800">
          P1 Gate Active
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
            {tab} Submissions
          </button>
        ))}
      </div>

      {/* KYC Submissions Cards / List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">
            No KYC submissions found in this category.
          </div>
        ) : (
          filteredSubmissions.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:border-gray-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-bold text-[#0F2A4A]">{item.userName}</h3>
                  <StatusChip status={item.status} />
                </div>
                <p className="text-xs text-gray-500">
                  {item.userEmail} &bull; {item.userPhone} &bull; Submitted {new Date(item.submittedAt).toLocaleDateString()}
                </p>

                {item.reason && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <strong>Rejection Reason:</strong> {item.reason}
                  </p>
                )}

                {/* Uploaded Dummy Assets */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <span className="text-xs font-semibold text-gray-400">Attached Documents:</span>
                  {item.docs.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-medium border border-gray-200"
                    >
                      <span>📄</span>
                      <span>{doc.name}</span>
                    </a>
                  ))}
                  {item.selfie && (
                    <a
                      href={item.selfie.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-medium border border-gray-200"
                    >
                      <span>🤳</span>
                      <span>{item.selfie.name}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Actions for PENDING */}
              <div className="flex items-center space-x-3">
                {item.status === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => handleApproveKyc(item)}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                    >
                      Approve KYC
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalItem(item);
                        setRejectReason('');
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                    >
                      Reject
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-400 italic">Review Completed</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      <ConfirmModal
        isOpen={!!rejectModalItem}
        title={`Reject KYC for ${rejectModalItem?.userName}`}
        confirmLabel="Confirm KYC Rejection"
        confirmVariant="danger"
        isLoading={actionLoading}
        onCancel={() => setRejectModalItem(null)}
        onConfirm={handleRejectConfirm}
      >
        <p className="text-sm text-gray-600 mb-3">
          Specify why the verification documents were rejected. The investor will receive this explanation and can resubmit corrected dummy credentials.
        </p>
        <textarea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="e.g. Document image is not readable; selfie does not match photo ID..."
          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </ConfirmModal>
    </div>
  );
}
