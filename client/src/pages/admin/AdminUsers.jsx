import React, { useState } from 'react';
import { StatusChip } from '../../components/StatusChip.jsx';
import { ConfirmModal } from '../../components/ConfirmModal.jsx';

export function AdminUsers({ onNavigateKyc }) {
  // Demo users representing seed accounts
  const [users, setUsers] = useState([
    {
      _id: '000000000000000000000001',
      name: 'System Admin',
      email: 'admin@demo.com',
      phone: '+91 9876543210',
      role: 'ADMIN',
      isActive: true,
      brokerApproved: false,
      kyc: { status: 'NOT_SUBMITTED' },
      createdAt: '2026-10-01T05:00:00.000Z'
    },
    {
      _id: '000000000000000000000002',
      name: 'Rohit Broker',
      email: 'rohit@demo.com',
      phone: '+91 9876543211',
      role: 'BROKER',
      isActive: true,
      brokerApproved: true,
      kyc: { status: 'NOT_SUBMITTED' },
      createdAt: '2026-10-01T05:30:00.000Z'
    },
    {
      _id: '000000000000000000000008',
      name: 'Vikas Sharma (New Broker)',
      email: 'vikas@demo.com',
      phone: '+91 9876543218',
      role: 'BROKER',
      isActive: true,
      brokerApproved: false,
      kyc: { status: 'NOT_SUBMITTED' },
      createdAt: '2026-10-01T06:00:00.000Z'
    },
    {
      _id: '000000000000000000000003',
      name: 'Aman Investor',
      email: 'aman@demo.com',
      phone: '+91 9876543212',
      role: 'INVESTOR',
      isActive: true,
      brokerApproved: false,
      kyc: { status: 'APPROVED' },
      createdAt: '2026-10-01T06:10:00.000Z'
    },
    {
      _id: '000000000000000000000004',
      name: 'Priya Verma',
      email: 'priya@demo.com',
      phone: '+91 9876543213',
      role: 'INVESTOR',
      isActive: true,
      brokerApproved: false,
      kyc: { status: 'APPROVED' },
      createdAt: '2026-10-01T06:20:00.000Z'
    },
    {
      _id: '000000000000000000000005',
      name: 'Karan Mehra',
      email: 'karan@demo.com',
      phone: '+91 9876543214',
      role: 'INVESTOR',
      isActive: true,
      brokerApproved: false,
      kyc: { status: 'PENDING' },
      createdAt: '2026-10-01T06:30:00.000Z'
    },
    {
      _id: '000000000000000000000006',
      name: 'Isha Patel',
      email: 'isha@demo.com',
      phone: '+91 9876543215',
      role: 'INVESTOR',
      isActive: false,
      brokerApproved: false,
      kyc: { status: 'REJECTED' },
      createdAt: '2026-10-01T06:40:00.000Z'
    }
  ]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApproveBroker = (user) => {
    setActionLoading(true);
    setTimeout(() => {
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, brokerApproved: true } : u))
      );
      setActionLoading(false);
      showToast(`Broker "${user.name}" approved. They can now create and submit property listings.`);
    }, 350);
  };

  const handleToggleActive = (user) => {
    // Last active admin guard
    if (user.role === 'ADMIN' && user.isActive) {
      const activeAdmins = users.filter((u) => u.role === 'ADMIN' && u.isActive);
      if (activeAdmins.length <= 1) {
        showToast('Error: Cannot deactivate the last active platform administrator.');
        return;
      }
    }

    if (user.isActive) {
      setDeactivateTarget(user);
    } else {
      // Reactivate
      setActionLoading(true);
      setTimeout(() => {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? { ...u, isActive: true } : u))
        );
        setActionLoading(false);
        showToast(`User "${user.name}" has been reactivated.`);
      }, 300);
    }
  };

  const confirmDeactivate = () => {
    setActionLoading(true);
    setTimeout(() => {
      setUsers((prev) =>
        prev.map((u) => (u._id === deactivateTarget._id ? { ...u, isActive: false } : u))
      );
      setActionLoading(false);
      setDeactivateTarget(null);
      showToast(`User has been deactivated. All active sessions have been invalidated.`);
    }, 350);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
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
          <h1 className="text-2xl font-bold text-[#0F2A4A]">User & Broker Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Oversee investor accounts, authorize broker listing permissions, and manage platform access.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by user name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
          />
        </div>
        <div className="sm:w-52">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2A4A] bg-white"
          >
            <option value="ALL">All Roles</option>
            <option value="INVESTOR">Investors</option>
            <option value="BROKER">Brokers</option>
            <option value="ADMIN">Administrators</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-[#F7F8FA] text-gray-600 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Broker Authorization</th>
                <th className="px-6 py-3.5">KYC Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#0F2A4A]">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email} &bull; {user.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'BROKER' ? (
                        user.brokerApproved ? (
                          <span className="inline-flex items-center text-xs text-emerald-700 font-medium">
                            <span className="mr-1">✓</span> Approved Broker
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApproveBroker(user)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                          >
                            Approve Broker
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'INVESTOR' ? (
                        <div className="flex items-center space-x-2">
                          <StatusChip status={user.kyc.status} />
                          {user.kyc.status === 'PENDING' && onNavigateKyc && (
                            <button
                              onClick={() => onNavigateKyc()}
                              className="text-xs text-purple-600 hover:underline font-semibold"
                            >
                              Review &rarr;
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={actionLoading}
                        className={`text-xs font-semibold px-3 py-1 rounded transition-colors ${
                          user.isActive
                            ? 'text-red-600 hover:bg-red-50 border border-red-200'
                            : 'text-emerald-600 hover:bg-emerald-50 border border-emerald-200'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deactivate User Modal */}
      <ConfirmModal
        isOpen={!!deactivateTarget}
        title={`Deactivate User: ${deactivateTarget?.name}`}
        message="Are you sure you want to deactivate this account? Deactivating a user immediately invalidates all active access tokens. They will be prevented from logging in or performing any financial actions until reactivated."
        confirmLabel="Deactivate Account"
        confirmVariant="danger"
        isLoading={actionLoading}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
