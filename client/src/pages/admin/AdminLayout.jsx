import React, { useState } from 'react';

export function AdminLayout({ activeTab, setActiveTab, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/admin' },
    { id: 'properties', label: 'Properties', icon: '🏢', path: '/admin/properties' },
    { id: 'users', label: 'Users & Brokers', icon: '👥', path: '/admin/users' },
    { id: 'kyc', label: 'KYC Queue', icon: '🪪', path: '/admin/kyc' },
    { id: 'withdrawals', label: 'Withdrawals', icon: '💸', path: '/admin/withdrawals' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' }
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col font-sans">
      {/* Top Header / App Bar */}
      <header className="bg-[#0F2A4A] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#10B981] to-[#D4A017] flex items-center justify-center font-bold text-xl text-white shadow-inner">
              OS
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">OwnSquare</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-white/20 text-emerald-300 uppercase tracking-wider">
                Admin Portal
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Platform Node: Connected</span>
            </div>
            <div className="h-6 w-px bg-white/20"></div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-sm">
                A
              </div>
              <div className="text-left text-xs">
                <p className="font-semibold text-white">Administrator</p>
                <p className="text-gray-300">admin@demo.com</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-white/10 text-white"
            aria-label="Toggle Navigation"
          >
            <span className="text-xl">☰</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Navigation Sidebar */}
        <aside
          className={`${
            mobileMenuOpen ? 'block' : 'hidden'
          } md:block w-full md:w-64 bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-fit sticky top-22`}
        >
          <div className="mb-4 px-3 py-2 bg-[#F7F8FA] rounded-lg border border-gray-100">
            <p className="text-xs uppercase font-bold text-[#0F2A4A] tracking-wider">Navigation</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (setActiveTab) setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-[#0F2A4A] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-[#0F2A4A]'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0">{children}</main>
      </div>

      {/* Mandatory Academic Disclaimer Footer */}
      <footer className="mt-auto bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        <p className="font-semibold text-gray-700">
          This is an academic project. No real money or securities are involved.
        </p>
        <p className="mt-1 text-gray-400">
          OwnSquare &bull; Fractional Real Estate Investment Portal &bull; Admin Orchestration Engine
        </p>
      </footer>
    </div>
  );
}
