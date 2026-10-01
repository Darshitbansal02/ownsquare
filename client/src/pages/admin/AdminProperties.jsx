import React, { useState } from 'react';
import { StatusChip } from '../../components/StatusChip.jsx';
import { SearchIcon } from '../../components/Icons.jsx';

export function AdminProperties({ onSelectSellProperty, initialFilter }) {
  const [properties, setProperties] = useState([
    {
      id: '1',
      title: 'Noida Heights',
      address: 'Sector 150, Noida, UP',
      location: 'Noida, UP',
      broker: 'Rohit Sharma',
      brokerEmail: 'rohit@email.com',
      brokerPhone: '+91 98765 43210',
      valuation: '₹12 Cr',
      valuationNumeric: 120000000,
      totalUnits: 6000,
      unitPrice: '₹2,00,000',
      fundingPct: 45,
      investors: 120,
      status: 'Live',
      propertyType: 'Residential',
      expectedRoi: '12% - 15%',
      rentalYield: '6%',
      description: 'Premium residential project in Sector 150, Noida with excellent connectivity and modern amenities.',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop'
    },
    {
      id: '2',
      title: 'Gurugram One',
      address: 'Golf Course Road, Gurugram, HR',
      location: 'Hyderabad, TG',
      broker: 'Akash Verma',
      brokerEmail: 'akash@email.com',
      brokerPhone: '+91 98765 43211',
      valuation: '₹28 Cr',
      valuationNumeric: 280000000,
      totalUnits: 14000,
      unitPrice: '₹2,00,000',
      fundingPct: 100,
      investors: 340,
      status: 'Funded',
      propertyType: 'Commercial',
      expectedRoi: '14% - 16%',
      rentalYield: '7.5%',
      description: 'Prime Grade-A commercial office tower situated on Golf Course Extension Road with marquee MNC tenants.',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop'
    },
    {
      id: '3',
      title: 'Pune Central',
      address: 'Koregaon Park, Pune, MH',
      location: 'Noida, UP',
      broker: 'Neha Kapoor',
      brokerEmail: 'neha@email.com',
      brokerPhone: '+91 98765 43212',
      valuation: '₹18 Cr',
      valuationNumeric: 180000000,
      totalUnits: 9000,
      unitPrice: '₹2,00,000',
      fundingPct: 78,
      investors: 210,
      status: 'Live',
      propertyType: 'Commercial Retail',
      expectedRoi: '13% - 15%',
      rentalYield: '6.8%',
      description: 'High-street retail and boutique lifestyle commercial asset in premier Koregaon Park.',
      image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=600&h=400&fit=crop'
    },
    {
      id: '4',
      title: 'Bangalore Greens',
      address: 'Whitefield Main Road, Bengaluru, KA',
      location: 'Hyderabad, TG',
      broker: 'Vikram Rao',
      brokerEmail: 'vikram@email.com',
      brokerPhone: '+91 98765 43213',
      valuation: '₹45 Cr',
      valuationNumeric: 450000000,
      totalUnits: 22500,
      unitPrice: '₹2,00,000',
      fundingPct: 15,
      investors: 56,
      status: 'Pending',
      propertyType: 'Gated Township',
      expectedRoi: '11% - 14%',
      rentalYield: '5.5%',
      description: 'Expansive luxury residential enclave bordering tech hubs with sustainable green architecture.',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop'
    },
    {
      id: '5',
      title: 'Hyderabad Square',
      address: 'HITEC City, Hyderabad, TG',
      location: 'Noida, UP',
      broker: 'Ramesh Iyer',
      brokerEmail: 'ramesh@email.com',
      brokerPhone: '+91 98765 43214',
      valuation: '₹25 Cr',
      valuationNumeric: 250000000,
      totalUnits: 12500,
      unitPrice: '₹2,00,000',
      fundingPct: 0,
      investors: 0,
      status: 'Draft',
      propertyType: 'Mixed-Use Retail',
      expectedRoi: '12% - 15%',
      rentalYield: '6.2%',
      description: 'Upcoming mixed-use development adjacent to premier metro corridor.',
      image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=600&h=400&fit=crop'
    }
  ]);

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(
    initialFilter === 'PENDING_REVIEW' ? 'Pending' : 'All Status'
  );
  const [selectedBroker, setSelectedBroker] = useState('All Brokers');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedType, setSelectedType] = useState('All Types');
  const [reviewProperty, setReviewProperty] = useState(null);
  const [activeReviewTab, setActiveReviewTab] = useState('Overview');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApproveProperty = (id) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Live' } : p))
    );
    if (reviewProperty && reviewProperty.id === id) {
      setReviewProperty((prev) => ({ ...prev, status: 'Live' }));
    }
    showToast('Property verified and transitioned to LIVE fundraising.');
  };

  const handleRejectProperty = (id) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'Rejected' } : p))
    );
    if (reviewProperty && reviewProperty.id === id) {
      setReviewProperty(null);
    }
    showToast('Property rejected with feedback logged for broker revision.');
  };

  const filteredProperties = properties.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      selectedStatus === 'All Status' || item.status.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F1E36] text-white px-4 py-3 rounded-lg shadow-xl border border-emerald-400 flex items-center space-x-2 text-xs font-semibold">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen 3: Approval Review Drawer / Modal when a property is viewed */}
      {reviewProperty ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setReviewProperty(null)}
                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
              >
                ←
              </button>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-slate-900">{reviewProperty.title}</h1>
                  <StatusChip status={reviewProperty.status === 'Pending' ? 'Pending Review' : reviewProperty.status} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {reviewProperty.address} &bull; Submitted by <span className="font-semibold text-slate-700">{reviewProperty.broker}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setReviewProperty(null)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Tabs Column */}
            <div className="lg:col-span-2 space-y-1">
              {['Overview', 'Financials', 'Documents', 'Investment Stats', 'Timeline'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveReviewTab(tab)}
                  className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeReviewTab === tab
                      ? 'bg-slate-100 text-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Middle Main Content: Hero Image + Property Details */}
            <div className="lg:col-span-6 space-y-6">
              {/* Hero Image */}
              <div className="h-56 rounded-xl overflow-hidden border border-slate-100 shadow-2xs relative">
                <img
                  src={reviewProperty.image}
                  alt={reviewProperty.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Property Details Grid */}
              <div className="bg-slate-50/60 rounded-xl p-5 border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Property Details</h3>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Property Type</span>
                    <span className="font-semibold text-slate-800">{reviewProperty.propertyType}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Total Valuation</span>
                    <span className="font-bold text-slate-900">{reviewProperty.valuation}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Total Units</span>
                    <span className="font-semibold text-slate-800">{reviewProperty.totalUnits.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Unit Price</span>
                    <span className="font-bold text-slate-900">{reviewProperty.unitPrice}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Expected ROI</span>
                    <span className="font-semibold text-emerald-600 font-bold">{reviewProperty.expectedRoi}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">Rental Yield</span>
                    <span className="font-semibold text-slate-800">{reviewProperty.rentalYield}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 font-medium block mb-1">Description</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{reviewProperty.description}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Documents + Broker Info */}
            <div className="lg:col-span-4 space-y-5">
              {/* Documents Card */}
              <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Documents</h3>

                <div className="space-y-2">
                  {[
                    { name: 'Property Deed', size: 'PDF • 2.4 MB' },
                    { name: 'Legal Papers', size: 'PDF • 1.8 MB' },
                    { name: 'Ownership Docs', size: 'PDF • 3.1 MB' },
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-red-500 font-bold text-base">📄</span>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{doc.name}</p>
                          <p className="text-[10px] text-slate-400">{doc.size}</p>
                        </div>
                      </div>
                      <button className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Broker Information Card */}
              <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Broker Information</h3>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"
                      alt={reviewProperty.broker}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs font-bold text-slate-900">{reviewProperty.broker}</p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ KYC Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{reviewProperty.brokerEmail}</p>
                    <p className="text-[11px] text-slate-500">{reviewProperty.brokerPhone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-end space-x-3">
            <button
              onClick={() => handleRejectProperty(reviewProperty.id)}
              className="px-5 py-2 border border-rose-300 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => handleApproveProperty(reviewProperty.id)}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              <span>✓</span>
              <span>Approve Property</span>
            </button>
          </div>
        </div>
      ) : (
        /* Screen 2: Properties List Table View */
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Properties</h1>
              <p className="text-xs text-slate-500 mt-0.5">Manage all properties on the platform</p>
            </div>
            <button className="px-4 py-2 bg-[#0F1E36] hover:bg-[#1E293B] text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-colors">
              <span>+</span>
              <span>Add Property</span>
            </button>
          </div>

          {/* Filter Bar matching image */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <SearchIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search properties..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F1E36]"
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
            >
              <option>All Status</option>
              <option>Live</option>
              <option>Funded</option>
              <option>Pending</option>
              <option>Draft</option>
            </select>

            <select
              value={selectedBroker}
              onChange={(e) => setSelectedBroker(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
            >
              <option>All Brokers</option>
              <option>Rohit Sharma</option>
              <option>Akash Verma</option>
              <option>Neha Kapoor</option>
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
            >
              <option>All Cities</option>
              <option>Noida, UP</option>
              <option>Gurugram, HR</option>
              <option>Bengaluru, KA</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
            >
              <option>All Types</option>
              <option>Residential</option>
              <option>Commercial</option>
              <option>Township</option>
            </select>
          </div>

          {/* Properties Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Property</th>
                    <th className="px-4 py-3.5">Broker</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">Valuation</th>
                    <th className="px-4 py-3.5">Funding</th>
                    <th className="px-4 py-3.5">Investors</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProperties.map((prop) => (
                    <tr key={prop.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={prop.image}
                            alt={prop.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-100 shadow-2xs"
                          />
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{prop.title}</span>
                            <span className="text-[11px] text-slate-400">{prop.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-medium">{prop.broker}</td>
                      <td className="px-4 py-3.5 text-slate-500">{prop.location}</td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{prop.valuation}</td>
                      <td className="px-4 py-3.5">
                        <div className="w-24">
                          <span className="text-[10px] font-semibold text-slate-700 block mb-0.5">{prop.fundingPct}%</span>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                prop.fundingPct === 100 ? 'bg-emerald-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${prop.fundingPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 font-medium">{prop.investors}</td>
                      <td className="px-4 py-3.5">
                        <StatusChip status={prop.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => setReviewProperty(prop)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                          View
                        </button>
                        {prop.status === 'Funded' && (
                          <button
                            onClick={() => onSelectSellProperty && onSelectSellProperty(prop)}
                            className="px-2.5 py-1 bg-[#0F1E36] hover:bg-[#1E293B] text-white rounded text-xs font-semibold shadow-2xs transition-colors"
                          >
                            Sell & Payout
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
