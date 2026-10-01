import React, { useState } from 'react';

export function AdminNotifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      title: 'New Property Listing Submitted',
      description: 'Broker Rohit Sharma submitted "Bangalore Greens" for approval verification.',
      time: '12 minutes ago',
      category: 'Property',
      unread: true
    },
    {
      id: 'notif_2',
      title: 'High-Value Withdrawal Request',
      description: 'Investor Devendra B requested a withdrawal of ₹2,50,000 to HDFC Bank.',
      time: '45 minutes ago',
      category: 'Payout',
      unread: true
    },
    {
      id: 'notif_3',
      title: 'KYC Document Verification Required',
      description: 'Pooja Mehta submitted passport and live verification selfie.',
      time: '2 hours ago',
      category: 'Compliance',
      unread: true
    },
    {
      id: 'notif_4',
      title: 'Funding Threshold Reached (100%)',
      description: 'Gurugram One has hit 100% FUNDED status with ₹28 Cr raised.',
      time: '5 hours ago',
      category: 'Funding',
      unread: false
    },
    {
      id: 'notif_5',
      title: 'Broker Commission Credited',
      description: 'Commission of ₹28,00,000 auto-credited to Akash Verma for Gurugram One.',
      time: '1 day ago',
      category: 'Payout',
      unread: false
    }
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">Real-time alerts, operational escalations, and system dispatches</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
        >
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
              notif.unread ? 'bg-slate-50/80' : 'hover:bg-slate-50/40'
            }`}
          >
            <div className="flex items-start space-x-3.5">
              <div
                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  notif.unread ? 'bg-rose-500 ring-4 ring-rose-100' : 'bg-transparent'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">{notif.title}</h3>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {notif.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.description}</p>
                <span className="text-2xs text-slate-400 mt-1.5 block">{notif.time}</span>
              </div>
            </div>

            <button
              onClick={() =>
                setNotifications((prev) =>
                  prev.map((n) => (n.id === notif.id ? { ...n, unread: !n.unread } : n))
                )
              }
              className="text-2xs font-medium text-slate-400 hover:text-slate-700 flex-shrink-0"
            >
              {notif.unread ? 'Dismiss' : 'Mark unread'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminNotifications;
