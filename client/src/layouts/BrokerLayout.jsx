import React, { useState } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { LayoutContext } from '../pages/auth/DevangUI.jsx';

export function BrokerLayout() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isApproved = Boolean(user?.brokerApproved);
  const brokerName = user?.name || 'Rohit Sharma';
  const brokerEmail = user?.email || 'rohit@demo.com';

  const navItems = [
    { to: '/broker', end: true, label: 'Dashboard', icon: '📊', description: 'Overview & funding KPIs' },
    { to: '/broker/properties', end: true, label: 'My Listings', icon: '🏢', description: 'Manage listed assets' },
    { to: '/broker/properties/new', label: 'Create Listing', icon: '➕', description: 'Draft & submit for review' },
    { to: '/broker/enquiries', label: 'Client Enquiries', icon: '💬', description: 'Investor questions' },
    { to: '/notifications', label: 'Notifications', icon: '🔔', description: 'Review & system alerts' },
    { to: '/properties', label: 'Marketplace', icon: '🌐', description: 'Public listings portal' },
    { to: '/profile', label: 'Profile', icon: '👤', description: 'Account & verification' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      // Ignored
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased">
      {/* Top Banner - Academic Project Notice */}
      <div className="bg-[#0F1E36] text-white px-4 py-1.5 text-xs text-center font-medium flex items-center justify-between border-b border-white/10 z-50">
        <div className="flex-1 text-center">
          <span className="font-semibold text-emerald-400 mr-1.5">Academic Project:</span>
          OwnSquare Broker Portal &bull; Real estate investment workspace &bull; No real money or securities involved.
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Dark Sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col bg-gradient-to-b from-[#0F1E36] via-[#162744] to-[#0B1526] text-white border-r border-[#1E293B] flex-shrink-0 shadow-[8px_0_24px_rgba(15,30,54,.08)]">
          {/* Brand Header */}
          <div className="p-6 border-b border-white/10 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-[#0F1E36] border border-emerald-400/30 flex items-center justify-center font-bold text-white text-lg shadow-sm">
              OS
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center">
                OwnSquare
                <span className="ml-2 px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Broker
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Listing & Asset Partner</p>
            </div>
          </div>

          {/* Broker Status Banner */}
          <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center space-x-2">
              <span className={`h-2.5 w-2.5 rounded-full ${isApproved ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-semibold text-slate-200">
                {isApproved ? 'Verified Broker' : 'Pending Admin Review'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {isApproved ? 'Full listing creation enabled' : 'Awaiting administrator verification'}
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `w-full flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-left group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <span className="text-lg mr-3 group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <div className="flex-1 truncate">
                  <span className="block truncate text-sm font-semibold">{item.label}</span>
                  <span className="block text-[10px] text-slate-400 truncate group-hover:text-slate-200">
                    {item.description}
                  </span>
                </div>
              </NavLink>
            ))}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 border-t border-white/10 bg-[#0B1526]/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow">
                  {brokerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{brokerName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{brokerEmail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-rose-300 hover:text-rose-100 hover:underline px-2 py-1"
                title="Sign out"
              >
                Exit
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace Canvas */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header Bar */}
          <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Broker Portal</p>
                <h2 className="text-base font-bold text-[#0F1E36]">
                  {navItems.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))?.label || 'Broker Workspace'}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isApproved && (
                <Link
                  to="/broker/properties/new"
                  className="inline-flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs gap-1.5"
                >
                  <span>+</span>
                  <span className="hidden sm:inline">Create Listing</span>
                </Link>
              )}

              {/* Profile button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0F1E36] text-white flex items-center justify-center font-bold text-xs">
                    {brokerName.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 hidden lg:inline">
                    {brokerName}
                  </span>
                  <svg className="w-3.5 h-3.5 text-slate-400 hidden lg:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{brokerName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{brokerEmail}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      Profile & Account
                    </Link>
                    <Link
                      to="/broker/properties"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    >
                      My Listings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 border-t border-slate-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[#0F1E36] text-white px-4 py-3 space-y-1 border-b border-[#1E293B]">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg text-xs font-medium ${
                      isActive ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:bg-white/10'
                    }`
                  }
                >
                  <span className="mr-2.5 text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}

          {/* Page Content with LayoutContext */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
            <LayoutContext.Provider value={{ hasSidebar: true }}>
              <Outlet />
            </LayoutContext.Provider>
          </main>
        </div>
      </div>
    </div>
  );
}

export default BrokerLayout;
