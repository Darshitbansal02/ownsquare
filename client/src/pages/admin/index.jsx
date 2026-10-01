import React, { useState } from 'react';
import { AdminLayout } from './AdminLayout.jsx';
import { AdminDashboard } from './AdminDashboard.jsx';
import { AdminProperties } from './AdminProperties.jsx';
import { AdminPropertySale } from './AdminPropertySale.jsx';
import { AdminUsers } from './AdminUsers.jsx';
import { AdminKyc } from './AdminKyc.jsx';
import { AdminWithdrawals } from './AdminWithdrawals.jsx';
import { AdminAnalytics } from './AdminAnalytics.jsx';
import { AdminNotifications } from './AdminNotifications.jsx';
import { AdminAudit } from './AdminAudit.jsx';
import { AdminSettings } from './AdminSettings.jsx';

export function AdminPortal() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sellingProperty, setSellingProperty] = useState(null);

  const handleSelectSellProperty = (property) => {
    setSellingProperty(property);
    setActiveTab('sell');
  };

  const handleBackFromSale = () => {
    setSellingProperty(null);
    setActiveTab('properties');
  };

  return (
    <AdminLayout
      activeTab={activeTab === 'sell' ? 'properties' : activeTab}
      setActiveTab={(tab) => {
        setSellingProperty(null);
        setActiveTab(tab);
      }}
    >
      {activeTab === 'dashboard' && (
        <AdminDashboard onNavigate={(tab) => setActiveTab(tab)} />
      )}

      {activeTab === 'properties' && (
        <AdminProperties onSelectSellProperty={handleSelectSellProperty} />
      )}

      {activeTab === 'approvalQueue' && (
        <AdminProperties initialFilter="PENDING_REVIEW" onSelectSellProperty={handleSelectSellProperty} />
      )}

      {activeTab === 'sell' && (
        <AdminPropertySale property={sellingProperty} onBack={handleBackFromSale} />
      )}

      {activeTab === 'users' && (
        <AdminUsers onNavigateKyc={() => setActiveTab('kyc')} />
      )}

      {activeTab === 'kyc' && <AdminKyc />}

      {activeTab === 'withdrawals' && <AdminWithdrawals />}

      {activeTab === 'analytics' && <AdminAnalytics />}

      {activeTab === 'notifications' && <AdminNotifications />}

      {activeTab === 'audit' && <AdminAudit />}

      {activeTab === 'settings' && <AdminSettings />}
    </AdminLayout>
  );
}

export default AdminPortal;
