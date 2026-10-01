import React from 'react';

const statusConfig = {
  // Property Statuses
  DRAFT: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  Draft: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  PENDING_APPROVAL: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Pending: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Pending Review': { label: 'Pending Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  LIVE: { label: 'Live', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  Live: { label: 'Live', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  FUNDED: { label: 'Funded', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Funded: { label: 'Funded', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  HOLDING: { label: 'Holding', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Holding: { label: 'Holding', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  SOLD: { label: 'Sold', bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' },
  Sold: { label: 'Sold', bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' },
  REJECTED: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Rejected: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },

  // User & KYC
  Active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Inactive: { label: 'Inactive', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Verified: { label: 'Verified', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  PENDING: { label: 'Pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  NOT_SUBMITTED: { label: 'Not Submitted', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
};

export function StatusChip({ status, className = '' }) {
  const config = statusConfig[status] || {
    label: status || 'Unknown',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  );
}
