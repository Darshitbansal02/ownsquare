import React, { useState } from 'react';

export function AdminSettings() {
  const [platformSettings, setPlatformSettings] = useState({
    platformFeePct: 2,
    brokerCommissionPct: 1,
    maxOwnershipPct: 49
  });

  const [systemSettings, setSystemSettings] = useState({
    currency: 'INR (₹)',
    emailNotifications: true,
    pushNotifications: true,
    autoApproveBrokers: true
  });

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Settings saved successfully.');
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F1E36] text-white px-4 py-3 rounded-lg shadow-xl border border-emerald-500/40 flex items-center space-x-2 text-sm animate-fade-in">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Configure platform parameters and preferences</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Platform Settings */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Platform Settings</h2>
              <p className="text-xs text-slate-500 mt-0.5">Core commission rates and investor allocation safeguards</p>
            </div>

            {/* Platform Fee % */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Platform Fee (%)
              </label>
              <div className="relative rounded-lg shadow-xs">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={platformSettings.platformFeePct}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      platformFeePct: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 font-semibold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                  %
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Exit commission charged on property liquidation proceeds before net distribution.
              </p>
            </div>

            {/* Broker Commission % */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Broker Commission (%)
              </label>
              <div className="relative rounded-lg shadow-xs">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={platformSettings.brokerCommissionPct}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      brokerCommissionPct: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 font-semibold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                  %
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Incentive credited to sourcing broker wallet upon reaching 100% FUNDED status.
              </p>
            </div>

            {/* Max Ownership per Investor % */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Max Ownership per Investor (%)
              </label>
              <div className="relative rounded-lg shadow-xs">
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={platformSettings.maxOwnershipPct}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      maxOwnershipPct: parseFloat(e.target.value) || 0
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 font-semibold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
                />
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400 font-semibold text-sm">
                  %
                </span>
              </div>
              <p className="text-xs text-slate-400">
                P1 regulatory limit preventing any single investor from owning more than 49% of an asset.
              </p>
            </div>
          </div>

          {/* Card 2: System Settings */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">System Settings</h2>
              <p className="text-xs text-slate-500 mt-0.5">Localization and notification preferences</p>
            </div>

            {/* Currency Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Currency
              </label>
              <select
                value={systemSettings.currency}
                onChange={(e) => setSystemSettings({ ...systemSettings, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-900 font-semibold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors cursor-pointer"
              >
                <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                <option value="USD ($)">USD ($) - US Dollar</option>
                <option value="AED (AED)">AED (AED) - UAE Dirham</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
              </select>
            </div>

            {/* Notification Toggles */}
            <div className="space-y-4 pt-2">
              {/* Email Notifications */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60 transition-colors">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Email Notifications</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Receive operational digests, new property approvals, and KYC alerts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSystemSettings({
                      ...systemSettings,
                      emailNotifications: !systemSettings.emailNotifications
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                    systemSettings.emailNotifications ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                      systemSettings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60 transition-colors">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Push Notifications</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instant in-browser notifications for pending review queues
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSystemSettings({
                      ...systemSettings,
                      pushNotifications: !systemSettings.pushNotifications
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                    systemSettings.pushNotifications ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                      systemSettings.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto-Approve Verified Brokers */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50/60 transition-colors">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Auto-Approve Verified Brokers</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Instantly permit property creation once broker KYC is verified
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSystemSettings({
                      ...systemSettings,
                      autoApproveBrokers: !systemSettings.autoApproveBrokers
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                    systemSettings.autoApproveBrokers ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                      systemSettings.autoApproveBrokers ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-[#0F1E36] hover:bg-slate-900 text-white text-sm font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminSettings;
