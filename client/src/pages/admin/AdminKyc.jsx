import React, { useState } from 'react';
import { StatusChip } from '../../components/StatusChip.jsx';
import { ConfirmModal } from '../../components/ConfirmModal.jsx';

export function AdminKyc() {
  const [submissions, setSubmissions] = useState([
    {
      _id: 'kyc_001',
      userId: 'usr_devendra',
      userName: 'Devendra B',
      userEmail: 'devendra@example.com',
      userPhone: '+91 9876543210',
      status: 'PENDING',
      docType: 'PAN & Aadhaar',
      submittedTime: 'Submitted 2h ago',
      docs: [
        { name: 'PAN_Card_Front.pdf', type: 'PAN Card', idNumber: 'ABCDE1234F', preview: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80' },
        { name: 'Aadhaar_Card_Front.pdf', type: 'Aadhaar Card', idNumber: 'XXXX-XXXX-9876', preview: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80' }
      ],
      selfie: { name: 'Live_Selfie.jpg', preview: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80' },
      reason: null,
      avatar: 'DB'
    },
    {
      _id: 'kyc_002',
      userId: 'usr_pooja',
      userName: 'Pooja Mehta',
      userEmail: 'pooja.m@example.com',
      userPhone: '+91 9876543211',
      status: 'PENDING',
      docType: 'Passport',
      submittedTime: 'Submitted 3h ago',
      docs: [
        { name: 'Passport_Scan.pdf', type: 'Passport', idNumber: 'Z8765432', preview: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80' }
      ],
      selfie: { name: 'Selfie_Verification.jpg', preview: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80' },
      reason: null,
      avatar: 'PM'
    },
    {
      _id: 'kyc_003',
      userId: 'usr_karan',
      userName: 'Karan Mehra',
      userEmail: 'karan@demo.com',
      userPhone: '+91 9876543214',
      status: 'PENDING',
      docType: 'Aadhaar Card',
      submittedTime: 'Submitted 4h ago',
      docs: [
        { name: 'Aadhaar_Card.pdf', type: 'Aadhaar Card', idNumber: 'XXXX-XXXX-4321', preview: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80' }
      ],
      selfie: { name: 'Selfie_Karan.jpg', preview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80' },
      reason: null,
      avatar: 'KM'
    },
    {
      _id: 'kyc_004',
      userId: 'usr_ananya',
      userName: 'Ananya Rao',
      userEmail: 'ananya.rao@example.com',
      userPhone: '+91 9876543216',
      status: 'PENDING',
      docType: 'PAN Card',
      submittedTime: 'Submitted 5h ago',
      docs: [
        { name: 'PAN_Card.pdf', type: 'PAN Card', idNumber: 'BNMPQ7654R', preview: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80' }
      ],
      selfie: { name: 'Selfie_Ananya.jpg', preview: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80' },
      reason: null,
      avatar: 'AR'
    },
    {
      _id: 'kyc_005',
      userId: 'usr_sanjay',
      userName: 'Sanjay Gupta',
      userEmail: 'sanjay.g@example.com',
      userPhone: '+91 9876543219',
      status: 'PENDING',
      docType: 'PAN & Voter ID',
      submittedTime: 'Submitted 6h ago',
      docs: [
        { name: 'PAN_Document.pdf', type: 'PAN Card', idNumber: 'CDEF12345K', preview: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80' }
      ],
      selfie: { name: 'Selfie_Sanjay.jpg', preview: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80' },
      reason: null,
      avatar: 'SG'
    },
    {
      _id: 'kyc_006',
      userId: 'usr_vikram',
      userName: 'Vikram Singh',
      userEmail: 'vikram.s@example.com',
      userPhone: '+91 9876543220',
      status: 'PENDING',
      docType: 'Aadhaar Card',
      submittedTime: 'Submitted 8h ago',
      docs: [
        { name: 'Aadhaar_Vikram.pdf', type: 'Aadhaar Card', idNumber: 'XXXX-XXXX-6543', preview: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=80' }
      ],
      selfie: { name: 'Selfie_Vikram.jpg', preview: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=500&auto=format&fit=crop&q=80' },
      reason: null,
      avatar: 'VS'
    },
    {
      _id: 'kyc_007',
      userId: 'usr_rahul',
      userName: 'Rahul Deshmukh',
      userEmail: 'rahul.d@example.com',
      userPhone: '+91 9876543221',
      status: 'PENDING',
      docType: 'PAN Card',
      submittedTime: 'Submitted 1d ago',
      docs: [
        { name: 'PAN_Rahul.pdf', type: 'PAN Card', idNumber: 'GHJK98765L', preview: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80' }
      ],
      selfie: { name: 'Selfie_Rahul.jpg', preview: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=80' },
      reason: null,
      avatar: 'RD'
    },
    {
      _id: 'kyc_008',
      userId: 'usr_sneha',
      userName: 'Sneha Nair',
      userEmail: 'sneha.nair@example.com',
      userPhone: '+91 9876543222',
      status: 'PENDING',
      docType: 'Passport',
      submittedTime: 'Submitted 1d ago',
      docs: [
        { name: 'Passport_Sneha.pdf', type: 'Passport', idNumber: 'P1239874', preview: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80' }
      ],
      selfie: { name: 'Selfie_Sneha.jpg', preview: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80' },
      reason: null,
      avatar: 'SN'
    },
    {
      _id: 'kyc_009',
      userId: 'usr_aman',
      userName: 'Aman Patel',
      userEmail: 'aman@demo.com',
      userPhone: '+91 9876543213',
      status: 'APPROVED',
      docType: 'PAN & Aadhaar',
      submittedTime: 'Approved Sep 28',
      docs: [],
      selfie: null,
      reason: null,
      avatar: 'AP'
    },
    {
      _id: 'kyc_010',
      userId: 'usr_isha',
      userName: 'Isha Patel',
      userEmail: 'isha@demo.com',
      userPhone: '+91 9876543215',
      status: 'REJECTED',
      docType: 'National ID',
      submittedTime: 'Rejected Sep 20',
      docs: [],
      selfie: null,
      reason: 'Provided dummy document is blurry and ID number is illegible. Please re-upload.',
      avatar: 'IP'
    }
  ]);

  const [activeTab, setActiveTab] = useState('PENDING');
  const [selectedReviewItem, setSelectedReviewItem] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = (item) => {
    setSubmissions((prev) =>
      prev.map((s) => (s._id === item._id ? { ...s, status: 'APPROVED', reason: null } : s))
    );
    setSelectedReviewItem(null);
    showToast(`KYC verified and approved for ${item.userName}. Investor is cleared to trade.`);
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) return;
    setSubmissions((prev) =>
      prev.map((s) => (s._id === selectedReviewItem._id ? { ...s, status: 'REJECTED', reason: rejectReason } : s))
    );
    setRejectModalOpen(false);
    setSelectedReviewItem(null);
    setRejectReason('');
    showToast(`KYC rejected. Reason communicated to investor.`);
  };

  const filteredSubmissions = submissions.filter((s) => s.status === activeTab);

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
        <h1 className="text-2xl font-bold text-slate-900">KYC Verification</h1>
        <p className="text-sm text-slate-500">Review and verify investor identity documents</p>
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

      {/* Submissions List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm font-medium">No {activeTab.toLowerCase()} KYC submissions at this time.</p>
          </div>
        ) : (
          filteredSubmissions.map((item) => (
            <div
              key={item._id}
              className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
            >
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
                    {item.docType} &bull; {item.submittedTime}
                  </p>
                  {item.reason && (
                    <p className="text-xs text-rose-600 mt-1">Reason: {item.reason}</p>
                  )}
                </div>
              </div>

              <div>
                <button
                  onClick={() => setSelectedReviewItem(item)}
                  className="px-4 py-2 rounded-lg bg-[#0F1E36] hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  Review
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Slide-over Drawer / Modal */}
      {selectedReviewItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                  {selectedReviewItem.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Review KYC: {selectedReviewItem.userName}</h3>
                  <p className="text-xs text-slate-500">{selectedReviewItem.userEmail} &bull; {selectedReviewItem.userPhone}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReviewItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Content Details */}
            <div className="py-5 space-y-6">
              {/* Submission Metadata */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Document Types</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{selectedReviewItem.docType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Submitted Timestamp</span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">{selectedReviewItem.submittedTime}</span>
                </div>
              </div>

              {/* Uploaded Documents Preview */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Identity Proof Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(selectedReviewItem.docs || []).map((doc, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl p-3 bg-white">
                      <div className="h-32 rounded-lg bg-slate-100 overflow-hidden mb-2 relative">
                        <img
                          src={doc.preview}
                          alt={doc.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-2xs font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                          {doc.type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{doc.name}</span>
                        <span className="text-slate-500 font-mono">{doc.idNumber}</span>
                      </div>
                    </div>
                  ))}

                  {selectedReviewItem.selfie && (
                    <div className="border border-slate-200 rounded-xl p-3 bg-white">
                      <div className="h-32 rounded-lg bg-slate-100 overflow-hidden mb-2 relative">
                        <img
                          src={selectedReviewItem.selfie.preview}
                          alt={selectedReviewItem.selfie.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-2xs font-bold bg-emerald-600 text-white">
                          Live Liveness Check
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{selectedReviewItem.selfie.name}</span>
                        <span className="text-emerald-600 font-medium">Passed</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedReviewItem(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Close
              </button>

              {selectedReviewItem.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(true)}
                    className="px-4 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-semibold transition-colors"
                  >
                    Reject KYC
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedReviewItem)}
                    className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors"
                  >
                    Approve KYC
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <ConfirmModal
        isOpen={rejectModalOpen}
        title={`Reject KYC for ${selectedReviewItem?.userName}`}
        message="Specify the reason why this identity proof was rejected. The investor will receive this explanation to correct and re-submit."
        confirmText="Confirm Rejection"
        confirmVariant="danger"
        onCancel={() => setRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
      >
        <div className="mt-3">
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. Document photo is blurry or ID numbers do not match account records..."
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </ConfirmModal>
    </div>
  );
}

export default AdminKyc;
