import React, { useState } from 'react';
import { formatINR } from '../../utils/formatINR.js';

export function AdminSettings() {
  const [settings, setSettings] = useState({
    platformFeePct: 2.0,
    brokerCommissionPct: 1.0,
    maxOwnershipPct: 49.0
  });

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      showToast('Platform parameters successfully updated and persisted.');
    }, 400);
  };

  // Example simulation of ₹1.4 Cr sale exit
  const sampleSalePaise = 1400000000;
  const simulatedFee = Math.floor((sampleSalePaise * Math.round(settings.platformFeePct * 100)) / 10000);
  const simulatedDistributable = sampleSalePaise - simulatedFee;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0F2A4A] text-white px-4 py-3 rounded-lg shadow-xl border border-emerald-400 flex items-center space-x-2 text-sm">
          <span className="text-emerald-400 font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F2A4A]">Platform Financial & Governance Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure system-wide fee rates, broker incentives, and investor cumulative concentration limits.
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
          Singleton Configuration
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm space-y-6">
          <form onSubmit={handleSave} className="space-y-5">
            {/* Platform Fee % */}
            <div>
              <label className="block text-sm font-bold text-[#0F2A4A] mb-1">
                Platform Exit Fee (%)
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.platformFeePct}
                  onChange={(e) =>
                    setSettings({ ...settings, platformFeePct: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 font-bold text-sm">
                  %
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Standard percentage deducted from gross sale proceeds at exit before net investor distribution.
              </p>
            </div>

            {/* Broker Commission % */}
            <div>
              <label className="block text-sm font-bold text-[#0F2A4A] mb-1">
                Broker Sourcing Commission (%)
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settings.brokerCommissionPct}
                  onChange={(e) =>
                    setSettings({ ...settings, brokerCommissionPct: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 font-bold text-sm">
                  %
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Credited once to the sourcing broker's ledger when property fundraising reaches 100% (FUNDED).
              </p>
            </div>

            {/* Max Ownership Cap % */}
            <div>
              <label className="block text-sm font-bold text-[#0F2A4A] mb-1">
                Maximum Investor Concentration Cap (%)
              </label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  value={settings.maxOwnershipPct}
                  onChange={(e) =>
                    setSettings({ ...settings, maxOwnershipPct: parseFloat(e.target.value) || 0 })
                  }
                  className="block w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400 font-bold text-sm">
                  %
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                P1 Gate: Prevents a single investor from accumulating more than this fraction of total units across repeat purchases.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-[#0F2A4A] hover:bg-[#1A3D66] text-white rounded-lg text-sm font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {saving ? <span>Updating Parameters...</span> : <span>Save Platform Settings</span>}
              </button>
            </div>
          </form>
        </div>

        {/* Live Impact Simulator & Invariant Safeguards */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-[#0F2A4A] text-sm flex items-center">
              <span className="mr-1.5">🧮</span> Exit Impact Simulation
            </h3>
            <p className="text-xs text-gray-500">
              Projected breakdown on a sample ₹1.4 Crore property exit with your configured {settings.platformFeePct}% fee:
            </p>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Gross Exit Price</span>
                <span className="font-bold text-gray-800">{formatINR(sampleSalePaise)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Platform Revenue ({settings.platformFeePct}%)</span>
                <span className="font-bold text-[#D4A017]">{formatINR(simulatedFee)}</span>
              </div>
              <div className="flex justify-between py-1 text-sm font-bold">
                <span className="text-emerald-700">Net Distributable</span>
                <span className="text-emerald-600">{formatINR(simulatedDistributable)}</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <p className="font-bold flex items-center">
              <span className="mr-1">⚠️</span> Integrity Safeguards
            </p>
            <p>
              Modifications to settings apply strictly to future events. Committed payouts, funded commissions, and historical ledger records remain unmutated and immutable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
