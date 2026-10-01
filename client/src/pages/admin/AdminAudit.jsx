import React, { useState } from 'react';

export function AdminAudit() {
  const [logs] = useState([
    {
      id: 'log_1',
      action: 'APPROVE_PROPERTY',
      operator: 'Admin User (AU)',
      resource: 'Property: Pune Central (prop_pune_central)',
      ip: '103.21.244.12',
      timestamp: 'Oct 01, 2026 14:32:10',
      status: 'SUCCESS'
    },
    {
      id: 'log_2',
      action: 'EXECUTE_PAYOUT',
      operator: 'Admin User (AU)',
      resource: 'Exit: Pune Central (₹21,56,00,000 net)',
      ip: '103.21.244.12',
      timestamp: 'Oct 01, 2026 12:15:44',
      status: 'SUCCESS'
    },
    {
      id: 'log_3',
      action: 'VERIFY_KYC',
      operator: 'Compliance Lead',
      resource: 'Investor: Devendra B (usr_devendra)',
      ip: '103.21.244.55',
      timestamp: 'Oct 01, 2026 11:05:22',
      status: 'SUCCESS'
    },
    {
      id: 'log_4',
      action: 'APPROVE_WITHDRAWAL',
      operator: 'Finance Desk',
      resource: 'Withdrawal: ₹1,00,000 (usr_pooja)',
      ip: '103.21.244.55',
      timestamp: 'Oct 01, 2026 09:40:11',
      status: 'SUCCESS'
    },
    {
      id: 'log_5',
      action: 'REJECT_KYC',
      operator: 'Compliance Lead',
      resource: 'Investor: Isha Patel (Blurry Aadhaar)',
      ip: '103.21.244.55',
      timestamp: 'Sep 30, 2026 18:20:05',
      status: 'WARNING'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Audit Logs</h1>
        <p className="text-sm text-slate-500">Immutable ledger tracking administrative actions and system modifications</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-2xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Event Action</th>
                <th className="py-3.5 px-6">Operator</th>
                <th className="py-3.5 px-6">Target Resource</th>
                <th className="py-3.5 px-6">IP Address</th>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6">
                    <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-700 font-medium text-xs">
                    {log.operator}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 text-xs">
                    {log.resource}
                  </td>
                  <td className="py-3.5 px-6 font-mono text-2xs text-slate-500">
                    {log.ip}
                  </td>
                  <td className="py-3.5 px-6 text-2xs text-slate-500">
                    {log.timestamp}
                  </td>
                  <td className="py-3.5 px-6">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminAudit;
