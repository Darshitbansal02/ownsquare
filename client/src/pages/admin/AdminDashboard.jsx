import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth.js';
import { StatusChip } from '../../components/StatusChip.jsx';

export function AdminDashboard({ onNavigate }) {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [dateRange] = useState('Jan 1, 2024 - Jan 31, 2024');

  const formatCompactPaise = (paise) => {
    if (!paise) return '₹0';
    const rupees = paise / 100;
    if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(1)} Cr`;
    if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)} Lakh`;
    return `₹${rupees.toLocaleString('en-IN')}`;
  };

  // 6 KPI Metrics dynamically bound to live stats with graceful fallback
  const kpis = stats ? [
    { title: 'Total AUM', value: formatCompactPaise(stats.aum), change: '↑ 12.4%', isPositive: true },
    { title: 'Total Investors', value: String(stats.usersByRole?.INVESTOR ?? 5), change: '↑ 8.2%', isPositive: true },
    { title: 'Total Brokers', value: String(stats.usersByRole?.BROKER ?? 2), change: '↑ 6.1%', isPositive: true },
    { title: 'Live Properties', value: String(stats.liveProperties ?? 2), change: '↑ 14.3%', isPositive: true },
    { title: 'Funds Raised (This Month)', value: formatCompactPaise(stats.fundsRaisedThisMonth), change: '↑ 18.2%', isPositive: true },
    { title: 'Platform Fees Earned', value: formatCompactPaise(stats.platformFeesEarned), change: '↑ 11.6%', isPositive: true },
  ] : [
    { title: 'Total AUM', value: '₹245 Cr', change: '↑ 12.4%', isPositive: true },
    { title: 'Total Investors', value: '12,480', change: '↑ 8.2%', isPositive: true },
    { title: 'Total Brokers', value: '186', change: '↑ 6.1%', isPositive: true },
    { title: 'Live Properties', value: '48', change: '↑ 14.3%', isPositive: true },
    { title: 'Funds Raised (This Month)', value: '₹6.4 Cr', change: '↑ 18.2%', isPositive: true },
    { title: 'Platform Fees Earned', value: '₹42 Lakh', change: '↑ 11.6%', isPositive: true },
  ];

  // Pending property approvals matching bottom-left table
  const [pendingProperties, setPendingProperties] = useState([
    {
      id: '1',
      title: 'Noida Heights',
      location: 'Noida, UP',
      broker: 'Rohit Sharma',
      submitted: '2 hours ago',
      valuation: '₹12 Cr',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=120&h=120&fit=crop'
    },
    {
      id: '2',
      title: 'Gurugram One',
      location: 'Gurugram, HR',
      broker: 'Akash Verma',
      submitted: '4 hours ago',
      valuation: '₹28 Cr',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=120&h=120&fit=crop'
    },
    {
      id: '3',
      title: 'Pune Central',
      location: 'Pune, MH',
      broker: 'Neha Kapoor',
      submitted: '6 hours ago',
      valuation: '₹18 Cr',
      image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=120&h=120&fit=crop'
    },
    {
      id: '4',
      title: 'Bangalore Greens',
      location: 'Bengaluru, KA',
      broker: 'Vikram Rao',
      submitted: '8 hours ago',
      valuation: '₹45 Cr',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=120&h=120&fit=crop'
    }
  ]);

  useEffect(() => {
    let active = true;
    if (!api?.admin) return;
    Promise.all([
      api.admin.stats().catch(() => null),
      api.admin.properties({ status: 'PENDING_APPROVAL', limit: 5 }).catch(() => null)
    ]).then(([statsRes, propsRes]) => {
      if (!active) return;
      if (statsRes) setStats(statsRes);
      if (propsRes?.items?.length) {
        setPendingProperties(propsRes.items.map((p) => ({
          id: p._id,
          title: p.title,
          location: `${p.city || ''}, ${p.state || ''}`,
          broker: 'Verified Broker',
          submitted: 'Pending review',
          valuation: '₹' + (p.valuation ? Math.round(p.valuation / 10000000) + ' Cr' : '10 Cr'),
          image: p.images?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=120&h=120&fit=crop'
        })));
      }
    });
    return () => { active = false; };
  }, [api]);

  // Recent Activity Feed matching bottom-right widget
  const activities = [
    {
      id: '1',
      user: 'Rohit Sharma',
      action: 'submitted a new property',
      target: 'Noida Heights',
      time: '2h ago',
      icon: '🏢',
      iconBg: 'bg-blue-50 text-blue-600'
    },
    {
      id: '2',
      user: 'New Investor',
      action: 'registered',
      target: 'priya@email.com',
      time: '3h ago',
      icon: '👤',
      iconBg: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: '3',
      user: 'KYC approved',
      action: 'for investor',
      target: 'Amit Patel',
      time: '4h ago',
      icon: '✓',
      iconBg: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: '4',
      user: 'Withdrawal request',
      action: 'submitted',
      target: '₹2,50,000 by Suresh Kumar',
      time: '5h ago',
      icon: '💳',
      iconBg: 'bg-amber-50 text-amber-600'
    },
    {
      id: '5',
      user: 'Property funded',
      action: 'reached 100% capacity',
      target: 'Pune Central reached 100%',
      time: '6h ago',
      icon: '🎉',
      iconBg: 'bg-purple-50 text-purple-600'
    }
  ];

  // Donut status distribution legend items
  const statusDistribution = [
    { label: 'Draft', count: 5, color: '#94A3B8' },
    { label: 'Pending', count: 8, color: '#F59E0B' },
    { label: 'Live', count: 18, color: '#0284C7' },
    { label: 'Funded', count: 10, color: '#10B981' },
    { label: 'Holding', count: 4, color: '#8B5CF6' },
    { label: 'Sold', count: 2, color: '#0F172A' },
    { label: 'Rejected', count: 1, color: '#EF4444' }
  ];

  const handleApprove = (id) => {
    setPendingProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const handleReject = (id) => {
    setPendingProperties((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Platform overview and key metrics</p>
        </div>

        {/* Date Filter Pill */}
        <div className="inline-flex items-center px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs space-x-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{dateRange}</span>
        </div>
      </div>

      {/* 6 Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{kpi.title}</span>
            <div className="mt-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight block">{kpi.value}</span>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 mt-1">
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Section: 3 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Funds Raised Over Time */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Funds Raised Over Time</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
              ↑ 18.2%
            </span>
          </div>

          {/* SVG Line / Area Chart */}
          <div className="h-52 w-full relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 350 180" preserveAspectRatio="none">
              <defs>
                <linearGradient id="raisedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="30" x2="350" y2="30" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="350" y2="75" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="350" y2="120" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="0" y1="165" x2="350" y2="165" stroke="#E2E8F0" />

              {/* Area */}
              <polygon
                fill="url(#raisedGradient)"
                points="0,165 0,140 58,125 116,145 174,100 232,85 290,70 350,30 350,165"
              />

              {/* Line */}
              <polyline
                fill="none"
                stroke="#0284C7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,140 58,125 116,145 174,100 232,85 290,70 350,30"
              />

              {/* Data points */}
              {[
                { x: 0, y: 140 },
                { x: 58, y: 125 },
                { x: 116, y: 145 },
                { x: 174, y: 100 },
                { x: 232, y: 85 },
                { x: 290, y: 70 },
                { x: 350, y: 30 },
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />
              ))}
            </svg>
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-2 px-1">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
          </div>
        </div>

        {/* Chart 2: Property Status Distribution (Donut Chart) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Property Status Distribution</h2>

          <div className="flex items-center justify-between gap-4 my-auto">
            {/* Donut graphic */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="14" fill="none" />
                {/* Segments */}
                <circle cx="50" cy="50" r="38" stroke="#0284C7" strokeWidth="14" strokeDasharray="90 238" strokeDashoffset="0" fill="none" />
                <circle cx="50" cy="50" r="38" stroke="#10B981" strokeWidth="14" strokeDasharray="50 238" strokeDashoffset="-90" fill="none" />
                <circle cx="50" cy="50" r="38" stroke="#F59E0B" strokeWidth="14" strokeDasharray="40 238" strokeDashoffset="-140" fill="none" />
                <circle cx="50" cy="50" r="38" stroke="#8B5CF6" strokeWidth="14" strokeDasharray="20 238" strokeDashoffset="-180" fill="none" />
                <circle cx="50" cy="50" r="38" stroke="#94A3B8" strokeWidth="14" strokeDasharray="25 238" strokeDashoffset="-200" fill="none" />
                <circle cx="50" cy="50" r="38" stroke="#0F172A" strokeWidth="14" strokeDasharray="10 238" strokeDashoffset="-225" fill="none" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-900 leading-none">48</span>
                <span className="text-[10px] text-slate-400 font-medium mt-0.5">Properties</span>
              </div>
            </div>

            {/* Legend Column */}
            <div className="space-y-1 text-xs">
              {statusDistribution.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between w-28 text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium">{item.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Monthly Revenue (Dual Bar Chart) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Monthly Revenue</h2>
            <div className="flex items-center space-x-3 text-[11px] text-slate-500">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>Platform Fees</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Broker Commission</span>
              </span>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-52 w-full flex items-end justify-between px-2 pt-4">
            {[
              { month: 'Jan', fee: 25, comm: 12 },
              { month: 'Feb', fee: 40, comm: 18 },
              { month: 'Mar', fee: 35, comm: 20 },
              { month: 'Apr', fee: 55, comm: 25 },
              { month: 'May', fee: 65, comm: 30 },
              { month: 'Jun', fee: 80, comm: 35 },
              { month: 'Jul', fee: 75, comm: 38 },
            ].map((d, i) => (
              <div key={i} className="flex flex-col items-center space-y-1 flex-1">
                <div className="flex items-end space-x-1 h-36">
                  {/* Platform Fee Bar */}
                  <div
                    className="w-2.5 sm:w-3 bg-blue-600 rounded-t-xs transition-all hover:opacity-85"
                    style={{ height: `${(d.fee / 80) * 100}%` }}
                    title={`Fees: ₹${d.fee}L`}
                  />
                  {/* Broker Commission Bar */}
                  <div
                    className="w-2.5 sm:w-3 bg-amber-500 rounded-t-xs transition-all hover:opacity-85"
                    style={{ height: `${(d.comm / 80) * 100}%` }}
                    title={`Commission: ₹${d.comm}L`}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-400">{d.month}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-2 px-1">
            <span>₹0 L</span>
            <span>₹20 L</span>
            <span>₹40 L</span>
            <span>₹60 L</span>
            <span>₹80 L</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Pending Approvals (Table) + Recent Activity (Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Property Approvals (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Pending Property Approvals</h2>
            <button
              onClick={() => onNavigate && onNavigate('properties')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Property</th>
                  <th className="px-4 py-3">Broker</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Valuation</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingProperties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      No pending properties requiring review.
                    </td>
                  </tr>
                ) : (
                  pendingProperties.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-100 shadow-2xs"
                          />
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{item.title}</span>
                            <span className="text-[11px] text-slate-400">{item.location}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{item.broker}</td>
                      <td className="px-4 py-3 text-slate-400">{item.submitted}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{item.valuation}</td>
                      <td className="px-4 py-3">
                        <StatusChip status="Pending" />
                      </td>
                      <td className="px-5 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => onNavigate && onNavigate('properties')}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="px-2.5 py-1 text-rose-600 border border-rose-200 hover:bg-rose-50 rounded text-xs font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity (1/3 width) */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
              <button
                onClick={() => onNavigate && onNavigate('audit')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-4">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start space-x-3 text-xs">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${act.iconBg}`}>
                    {act.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 leading-snug">
                      <strong className="font-semibold text-slate-900">{act.user}</strong> {act.action}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{act.target}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


export default AdminDashboard;
