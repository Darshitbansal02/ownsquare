import React from 'react';

const statusConfig = {
  // Property Statuses
  DRAFT: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  PENDING_APPROVAL: { label: 'Pending Approval', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  LIVE: { label: 'Live', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  FUNDED: { label: 'Funded', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  HOLDING: { label: 'Holding', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  SOLD: { label: 'Sold', bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },

  // KYC / Withdrawal Statuses
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  NOT_SUBMITTED: { label: 'Not Submitted', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },

  // Investment Statuses
  ACTIVE: { label: 'Active', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  EXITED: { label: 'Exited', bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' },
  REFUNDED: { label: 'Refunded', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' }
};

export function StatusChip({ status, className = '' }) {
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {config.label}
    </span>
  );
}
