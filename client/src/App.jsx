import React, { useState, useEffect } from 'react';
import { AdminPortal } from './pages/admin/index.jsx';
import { InvestorPortal } from './pages/investor/index.jsx';

/**
 * Minimal temporary portal switcher.
 * Defaults to 'admin' to preserve existing AdminPortal behavior.
 * Reads initial view from URL hash: #investor → investor, else admin.
 *
 * Replace this with Chetan's AppRoutes + AuthContext when available.
 * InvestorPortal and AdminPortal are self-contained and need no changes.
 */
function getInitialPortal() {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'investor') return 'investor';
  }
  return 'admin';
}

export function App() {
  const [currentPortal, setCurrentPortal] = useState(getInitialPortal);

  // Sync URL hash when portal changes for bookmarkable navigation
  useEffect(() => {
    window.location.hash = currentPortal;
  }, [currentPortal]);

  // Listen for manual hash changes (browser back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'investor' || hash === 'admin') {
        setCurrentPortal(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (currentPortal === 'investor') {
    return (
      <InvestorPortal
        currentView="investor"
        onViewSwitch={setCurrentPortal}
      />
    );
  }

  // Default: AdminPortal — untouched, exactly as Darshit authored it
  return <AdminPortal />;
}

export default App;
