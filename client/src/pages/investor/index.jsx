import React, { useState } from 'react';
import { InvestorLayout } from '../../layouts/InvestorLayout.jsx';
import { InvestorDashboard } from './InvestorDashboard.jsx';
import { EnquiriesScreen, HoldingDetailScreen, KycScreen, MarketplaceScreen, PortfolioScreen, PropertyDetailScreen, WalletScreen } from './InvestorScreens.jsx';

const propertyFixtures = [
  { _id: '100000000000000000000002', title: 'Commercial Retail Hub', type: 'COMMERCIAL', city: 'Bangalore', state: 'Karnataka', valuation: 2500000000, totalUnits: 2500, unitPrice: 1000000, unitsSold: 1250, fundingPct: 50, status: 'LIVE', expectedAppreciationPct: 14, rentalYieldPct: 4.2, investors: 184, images: [{ url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=85' }] },
  { _id: '100000000000000000000005', title: 'Tech Park View Apartments', type: 'APARTMENT', city: 'Bangalore', state: 'Karnataka', valuation: 1800000000, totalUnits: 1800, unitPrice: 1000000, unitsSold: 540, fundingPct: 30, status: 'LIVE', expectedAppreciationPct: 11, rentalYieldPct: 3.5, investors: 126, images: [{ url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=85' }] },
  { _id: '100000000000000000000006', title: 'Lakeview Residences', type: 'APARTMENT', city: 'Hyderabad', state: 'Telangana', valuation: 3200000000, totalUnits: 3200, unitPrice: 1000000, unitsSold: 2112, fundingPct: 66, status: 'LIVE', expectedAppreciationPct: 13, rentalYieldPct: 4.6, investors: 241, images: [{ url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85' }] },
  { _id: '100000000000000000000007', title: 'The Courtyard Offices', type: 'COMMERCIAL', city: 'Pune', state: 'Maharashtra', valuation: 2100000000, totalUnits: 2100, unitPrice: 1000000, unitsSold: 966, fundingPct: 46, status: 'LIVE', expectedAppreciationPct: 12, rentalYieldPct: 5.1, investors: 158, images: [{ url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85' }] },
  { _id: '100000000000000000000008', title: 'Palm Grove Residences', type: 'APARTMENT', city: 'Mumbai', state: 'Maharashtra', valuation: 4500000000, totalUnits: 4500, unitPrice: 1000000, unitsSold: 3105, fundingPct: 69, status: 'LIVE', expectedAppreciationPct: 10, rentalYieldPct: 3.8, investors: 309, images: [{ url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85' }] }
];

const initialTransactions = [
  { _id: 'tx-payout-1', type: 'PAYOUT', label: 'Rental distribution · Sector 150', direction: 'CREDIT', amount: 500000, balanceAfter: 20500000, refId: 'Quarterly rental', createdAt: '2026-10-01T07:30:00.000Z', status: 'Completed' },
  { _id: 'tx-invest-1', type: 'INVESTMENT', label: 'Investment · Commercial Retail Hub', direction: 'DEBIT', amount: 10000000, balanceAfter: 20000000, refId: 'Commercial Retail Hub', createdAt: '2026-10-01T07:15:00.000Z', status: 'Completed' },
  { _id: 'tx-invest-2', type: 'INVESTMENT', label: 'Investment · 2BHK Sector 150', direction: 'DEBIT', amount: 20000000, balanceAfter: 30000000, refId: '2BHK Sector 150', createdAt: '2026-10-01T06:35:00.000Z', status: 'Completed' },
  { _id: 'tx-deposit-1', type: 'TOPUP', label: 'Wallet deposit', direction: 'CREDIT', amount: 50000000, balanceAfter: 50000000, refId: 'Demo deposit', createdAt: '2026-10-01T06:34:00.000Z', status: 'Completed' }
];

const initialEnquiries = [
  { id: 'enq-1', property: '2BHK, Sector 150, Noida', subject: 'Quarterly rental distribution', contact: 'Priya · Asset manager', status: 'Pending', updated: '2026-09-29', messages: [{ from: 'Priya · Asset manager', date: '2026-09-28T10:00:00Z', text: 'Your first rental distribution is being reconciled for the quarter. We expect the statement to be available shortly.' }, { from: 'Aman', date: '2026-09-29T08:20:00Z', text: 'Thanks. Could you share an estimated date for the statement?' }] },
  { id: 'enq-2', property: 'Commercial Retail Hub, Whitefield', subject: 'Property management update', contact: 'Arjun · Investor relations', status: 'Open', updated: '2026-09-24', messages: [{ from: 'Aman', date: '2026-09-24T12:45:00Z', text: 'Could you share the latest occupancy update for the retail units?' }, { from: 'Arjun · Investor relations', date: '2026-09-24T14:00:00Z', text: 'We have shared your request with the property manager and will post the verified update here.' }] },
  { id: 'enq-3', property: 'Lakeview Residences, Hyderabad', subject: 'Investment document request', contact: 'Meera · Investor support', status: 'Resolved', updated: '2026-09-18', messages: [{ from: 'Aman', date: '2026-09-17T09:30:00Z', text: 'Please send the due diligence summary for my records.' }, { from: 'Meera · Investor support', date: '2026-09-18T11:05:00Z', text: 'The due diligence summary is available in the property documents section. Your request is now resolved.' }] }
];

export function InvestorPortal({ onViewSwitch, currentView = 'investor' }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [walletBalance, setWalletBalance] = useState(20500000);
  const [kycStatus] = useState('APPROVED');
  const [transactions, setTransactions] = useState(initialTransactions);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState('enq-1');
  const [enquiries, setEnquiries] = useState(initialEnquiries);

  const handleQuickTopUp = () => {
    setActiveTab('wallet');
  };

  const handleInvest = (property, amount = property.unitPrice) => {
    setSelectedProperty({ ...property, investmentAmount: amount });
    setActiveTab('investment-confirm');
  };

  const handleWalletAction = (action, amount) => {
    if (action === 'NavigateMarketplace') { setActiveTab('marketplace'); return; }
    if (action === 'Deposit') {
      setWalletBalance((balance) => balance + amount);
      setTransactions((items) => [{ _id: `tx-${Date.now()}`, type: 'TOPUP', label: 'Wallet deposit', direction: 'CREDIT', amount, balanceAfter: walletBalance + amount, refId: 'Demo deposit', createdAt: new Date().toISOString(), status: 'Completed' }, ...items]);
    } else if (action === 'Withdrawal' && amount <= walletBalance) {
      setWalletBalance((balance) => balance - amount);
      setTransactions((items) => [{ _id: `tx-${Date.now()}`, type: 'WITHDRAWAL', label: 'Wallet withdrawal', direction: 'DEBIT', amount, balanceAfter: walletBalance - amount, refId: 'Demo withdrawal', createdAt: new Date().toISOString(), status: 'Completed' }, ...items]);
    }
  };

  const submitInvestment = () => {
    const amount = selectedProperty?.investmentAmount || selectedProperty?.unitPrice || 0;
    if (amount <= 0 || amount > walletBalance) return;
    const remaining = walletBalance - amount;
    setWalletBalance(remaining);
    setTransactions((items) => [{ _id: `tx-${Date.now()}`, type: 'INVESTMENT', label: `Investment · ${selectedProperty.title}`, direction: 'DEBIT', amount, balanceAfter: remaining, refId: selectedProperty.title, createdAt: new Date().toISOString(), status: 'Completed' }, ...items]);
    setActiveTab('portfolio');
    setSelectedProperty(null);
  };

  const handleEnquiryReply = (id, text) => setEnquiries((items) => items.map((item) => item.id === id ? { ...item, status: item.status === 'Resolved' ? 'Open' : item.status, updated: new Date().toISOString(), messages: [...item.messages, { from: 'Aman', date: new Date().toISOString(), text }] } : item));

  return (
    <InvestorLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      walletBalance={walletBalance}
      kycStatus={kycStatus}
      userName="Aman Sharma"
      userEmail="aman@demo.com"
      onQuickTopUp={handleQuickTopUp}
      onViewSwitch={onViewSwitch}
      currentView={currentView}
    >
      {activeTab === 'dashboard' && (
        <InvestorDashboard
          walletData={{ availableBalance: walletBalance }}
          properties={propertyFixtures}
          transactions={transactions}
          onNavigate={(tab) => setActiveTab(tab)}
          onTopUpClick={handleQuickTopUp}
          onSelectPropertyDetail={(property) => { setSelectedProperty(property); setActiveTab('property-detail'); }}
          onSelectPropertyForInvest={handleInvest}
        />
      )}

      {activeTab === 'portfolio' && <PortfolioScreen onSelectHolding={(holding) => { setSelectedHolding(holding); setActiveTab('holding-detail'); }} onNavigate={setActiveTab} />}
      {activeTab === 'holding-detail' && selectedHolding && <HoldingDetailScreen holding={selectedHolding} onBack={() => setActiveTab('portfolio')} />}
      {activeTab === 'marketplace' && <MarketplaceScreen properties={propertyFixtures} onSelectProperty={(property) => { setSelectedProperty(property); setActiveTab('property-detail'); }} onInvest={handleInvest} />}
      {activeTab === 'property-detail' && selectedProperty && <PropertyDetailScreen property={selectedProperty} onBack={() => setActiveTab('marketplace')} onInvest={handleInvest} />}
      {activeTab === 'investment-confirm' && selectedProperty && <div className="mx-auto max-w-xl animate-fade-in-up rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Investment preview</p><h1 className="mt-2 text-2xl font-bold text-[#102D43]">Confirm your investment</h1><p className="mt-2 text-sm text-slate-500">{selectedProperty.title} · {selectedProperty.city}</p><div className="my-6 space-y-3 rounded-xl bg-slate-50 p-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Investment amount</span><strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((selectedProperty.investmentAmount || selectedProperty.unitPrice) / 100)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Available after investment</span><strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format((walletBalance - (selectedProperty.investmentAmount || selectedProperty.unitPrice)) / 100)}</strong></div></div>{(selectedProperty.investmentAmount || selectedProperty.unitPrice) > walletBalance && <p className="mb-4 text-sm font-semibold text-rose-600">Your wallet balance is too low. Add money before investing.</p>}<div className="flex flex-wrap gap-2"><button type="button" onClick={submitInvestment} disabled={(selectedProperty.investmentAmount || selectedProperty.unitPrice) > walletBalance} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Confirm demo investment</button><button type="button" onClick={() => setActiveTab('property-detail')} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Back to property</button></div><p className="mt-4 text-xs text-slate-400">Academic demo only. No real money or securities are involved.</p></div>}
      {activeTab === 'wallet' && <WalletScreen balance={walletBalance} transactions={transactions} onAction={handleWalletAction} />}
      {activeTab === 'kyc' && <KycScreen />}
      {activeTab === 'enquiries' && <EnquiriesScreen enquiries={enquiries} selectedId={selectedEnquiryId} setSelectedId={setSelectedEnquiryId} onReply={handleEnquiryReply} />}
    </InvestorLayout>
  );
}

export default InvestorPortal;
