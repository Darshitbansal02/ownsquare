import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();

  const validTabs = ['dashboard', 'properties', 'approvalQueue', 'users', 'kyc', 'withdrawals', 'analytics', 'notifications', 'audit', 'settings'];
  const pathSegment = location.pathname.replace(/^\/admin\/?/, '').split('/')[0];
  const initialTab = validTabs.includes(pathSegment) ? pathSegment : 'dashboard';

  const [activeTab, setActiveTabState] = useState(initialTab);
  const [sellingProperty, setSellingProperty] = useState(null);

  useEffect(() => {
    const segment = location.pathname.replace(/^\/admin\/?/, '').split('/')[0];
    if (validTabs.includes(segment) && segment !== activeTab) {
      setActiveTabState(segment);
    } else if (!segment && activeTab !== 'dashboard') {
      setActiveTabState('dashboard');
    }
  }, [location.pathname]);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (validTabs.includes(tab)) {
      navigate(tab === 'dashboard' ? '/admin' : `/admin/${tab}`);
    }
  };

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
