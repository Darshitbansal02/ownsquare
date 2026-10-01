import React, { useState } from 'react';
import { StatusChip } from '../../components/StatusChip.jsx';
import { ConfirmModal } from '../../components/ConfirmModal.jsx';
import { SearchIcon } from '../../components/Icons.jsx';

export function AdminUsers({ onNavigateKyc }) {
  // Demo users representing seed accounts and rich realistic data
  const [users, setUsers] = useState([
    {
      _id: 'user_001',
      name: 'Devendra B',
      email: 'devendra@example.com',
      phone: '+91 9876543210',
      role: 'Investor',
      rawRole: 'INVESTOR',
      isActive: true,
      brokerApproved: false,
      kycStatus: 'VERIFIED',
      joinedDate: 'Oct 1, 2026',
      avatar: 'DB'
    },
    {
      _id: 'user_002',
      name: 'Pooja Mehta',
      email: 'pooja.m@example.com',
      phone: '+91 9876543211',
      role: 'Investor',
      rawRole: 'INVESTOR',
      isActive: true,
      brokerApproved: false,
      kycStatus: 'PENDING',
      joinedDate: 'Sep 28, 2026',
      avatar: 'PM'
    },
    {
      _id: 'user_003',
      name: 'Karan Mehra',
      email: 'karan@demo.com',
      phone: '+91 9876543214',
      role: 'Investor',
      rawRole: 'INVESTOR',
      isActive: true,
      brokerApproved: false,
      kycStatus: 'PENDING',
      joinedDate: 'Sep 25, 2026',
      avatar: 'KM'
    },
    {
      _id: 'user_004',
      name: 'Rohit Broker',
      email: 'rohit@demo.com',
      phone: '+91 9876543212',
      role: 'Broker',
      rawRole: 'BROKER',
      isActive: true,
      brokerApproved: true,
      kycStatus: 'VERIFIED',
      joinedDate: 'Sep 20, 2026',
      avatar: 'RB'
    },
    {
      _id: 'user_005',
      name: 'Vikas Sharma',
      email: 'vikas@demo.com',
      phone: '+91 9876543218',
      role: 'Broker',
      rawRole: 'BROKER',
      isActive: true,
      brokerApproved: false,
      kycStatus: 'NOT_SUBMITTED',
      joinedDate: 'Sep 18, 2026',
      avatar: 'VS'
    },
    {
      _id: 'user_006',
      name: 'Aman Patel',
      email: 'aman@demo.com',
      phone: '+91 9876543213',
      role: 'Investor',
      rawRole: 'INVESTOR',
      isActive: true,
      brokerApproved: false,
      kycStatus: 'VERIFIED',
      joinedDate: 'Sep 15, 2026',
      avatar: 'AP'
    },
    {
      _id: 'user_007',
      name: 'Isha Patel',
      email: 'isha@demo.com',
      phone: '+91 9876543215',
      role: 'Investor',
      rawRole: 'INVESTOR',
      isActive: false,
      brokerApproved: false,
      kycStatus: 'REJECTED',
      joinedDate: 'Sep 10, 2026',
      avatar: 'IP'
    },
    {
      _id: 'user_008',
      name: 'Admin Operator',
      email: 'admin@demo.com',
      phone: '+91 9876543200',
      role: 'Admin',
      rawRole: 'ADMIN',
      isActive: true,
      brokerApproved: false,
      kycStatus: 'VERIFIED',
      joinedDate: 'Aug 01, 2026',
      avatar: 'AO'
    }
  ]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', role: 'Investor' });
  const [activeMenuId, setActiveMenuId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApproveBroker = (user) => {
    setUsers((prev) =>
      prev.map((u) => (u._id === user._id ? { ...u, brokerApproved: true } : u))
    );
    showToast(`Broker "${user.name}" approved. They can now submit property listings.`);
    setActiveMenuId(null);
  };

  const handleToggleActive = (user) => {
    if (user.rawRole === 'ADMIN' && user.isActive) {
      const activeAdmins = users.filter((u) => u.rawRole === 'ADMIN' && u.isActive);
      if (activeAdmins.length <= 1) {
        showToast('Error: Cannot deactivate the last active administrator.');
        return;
      }
    }

    if (user.isActive) {
      setDeactivateTarget(user);
    } else {
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isActive: true } : u))
      );
      showToast(`User "${user.name}" has been reactivated.`);
    }
    setActiveMenuId(null);
  };

  const confirmDeactivate = () => {
    setUsers((prev) =>
      prev.map((u) => (u._id === deactivateTarget._id ? { ...u, isActive: false } : u))
    );
    setDeactivateTarget(null);
    showToast(`User account deactivated. Access revoked.`);
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) return;

    const initials = newUser.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const created = {
      _id: 'user_' + Date.now(),
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || '+91 9900000000',
      role: newUser.role,
      rawRole: newUser.role.toUpperCase(),
      isActive: true,
      brokerApproved: newUser.role === 'Broker' ? false : false,
      kycStatus: newUser.role === 'Investor' ? 'PENDING' : 'NOT_SUBMITTED',
      joinedDate: 'Oct 1, 2026',
      avatar: initials || 'U'
    };

    setUsers([created, ...users]);
    setAddUserModalOpen(false);
    setNewUser({ name: '', email: '', phone: '', role: 'Investor' });
    showToast(`User "${created.name}" created successfully.`);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role.toLowerCase() === roleFilter.toLowerCase();
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.isActive) ||
      (statusFilter === 'INACTIVE' && !u.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F1E36] text-white px-4 py-3 rounded-lg shadow-xl border border-emerald-500/40 flex items-center space-x-2 text-sm animate-fade-in">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Manage platform investors, brokers, and administrators</p>
        </div>
        <button
          onClick={() => setAddUserModalOpen(true)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-[#0F1E36] hover:bg-slate-900 text-white text-sm font-semibold shadow-xs transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add User</span>
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search users by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-40 py-2 px-3 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="Investor">Investor</option>
            <option value="Broker">Broker</option>
            <option value="Admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36 py-2 px-3 text-sm bg-slate-50/70 border border-slate-200 rounded-lg text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-2xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">User</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">KYC</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Joined</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No users matching the filters found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* User Profile */}
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center font-bold text-xs text-slate-700">
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{user.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-6 text-slate-700 font-medium">
                      {user.role}
                    </td>

                    {/* KYC */}
                    <td className="py-3.5 px-6">
                      {user.kycStatus === 'VERIFIED' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Verified
                        </span>
                      )}
                      {user.kycStatus === 'PENDING' && (
                        <button
                          onClick={onNavigateKyc}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 hover:bg-amber-100 transition-colors"
                          title="Click to review KYC submission"
                        >
                          Pending
                        </button>
                      )}
                      {user.kycStatus === 'REJECTED' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                          Rejected
                        </span>
                      )}
                      {user.kycStatus === 'NOT_SUBMITTED' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          Not Submitted
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-6">
                      {user.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="py-3.5 px-6 text-slate-500 text-xs">
                      {user.joinedDate}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3.5 px-6 text-right relative">
                      <div className="flex items-center justify-end space-x-2">
                        {user.rawRole === 'BROKER' && !user.brokerApproved && (
                          <button
                            onClick={() => handleApproveBroker(user)}
                            className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200/60 transition-colors"
                          >
                            Approve
                          </button>
                        )}

                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === user._id ? null : user._id)}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>

                          {activeMenuId === user._id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200/80 py-1 z-30 animate-fade-in text-left">
                              <button
                                onClick={() => {
                                  showToast(`Viewing details for ${user.name}`);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                              >
                                <span>View User Profile</span>
                              </button>

                              {user.rawRole === 'BROKER' && !user.brokerApproved && (
                                <button
                                  onClick={() => handleApproveBroker(user)}
                                  className="w-full px-4 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50 flex items-center space-x-2"
                                >
                                  <span>Authorize Broker</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleToggleActive(user)}
                                className={`w-full px-4 py-2 text-xs font-medium ${
                                  user.isActive
                                    ? 'text-rose-600 hover:bg-rose-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                } flex items-center space-x-2`}
                              >
                                <span>{user.isActive ? 'Deactivate Account' : 'Reactivate Account'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <span>Showing 1 to {filteredUsers.length} of 12,480 users</span>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add New User</h3>
              <button
                onClick={() => setAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  <option value="Investor">Investor</option>
                  <option value="Broker">Broker</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#0F1E36] hover:bg-slate-900 text-white text-sm font-semibold shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Account Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deactivateTarget)}
        title="Deactivate User Account"
        message={`Are you sure you want to deactivate ${deactivateTarget?.name}? They will immediately lose access to their portfolio and platform services.`}
        confirmText="Deactivate User"
        confirmVariant="danger"
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}

export default AdminUsers;
