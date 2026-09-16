import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Smartphone, Users, RefreshCw, Layers, QrCode, Cloud, Wifi, WifiOff } from 'lucide-react';
import { StorageService, subscribeSyncStatus, SyncStatus } from '../../services/storage';
import { Employee } from '../../types/crm';
import { PWAInstallButton } from './PWAInstallButton';
import { AgentConnectModal } from './AgentConnectModal';

interface NavbarProps {
  viewMode: 'admin' | 'mobile';
  setViewMode: (mode: 'admin' | 'mobile') => void;
  activeEmployeeId: string;
  setActiveEmployeeId: (id: string) => void;
  employees: Employee[];
  mobileFrame: boolean;
  setMobileFrame: (frame: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  setViewMode,
  activeEmployeeId,
  setActiveEmployeeId,
  employees,
  mobileFrame,
  setMobileFrame,
}) => {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: true,
    lastSynced: '',
    isSyncing: false,
  });

  useEffect(() => {
    return subscribeSyncStatus(setSyncStatus);
  }, []);

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all CRM sample data (leads, employees, calls, breaks) to default initial state?')) {
      StorageService.resetAllData();
    }
  };

  const handleForceSync = async () => {
    await StorageService.forceSync();
  };

  const activeEmployee = employees.find((e) => e.id === activeEmployeeId) || employees[0];

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand & App Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  FIELD SALES CRM
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  Auto Dialer
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Field Agent Dialer • Attendance & Break Tracker • Live Admin Panel
              </p>
            </div>
          </div>

          {/* View Switcher Controls */}
          <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setViewMode('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'admin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Admin Web Panel</span>
              <span className="md:hidden">Admin</span>
            </button>

            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">Mobile Agent App</span>
              <span className="md:hidden">Mobile</span>
            </button>
          </div>

          {/* Active Agent Switcher, Connect Phone & Settings */}
          <div className="flex items-center gap-2.5">
            
            {/* Live Cloud Sync Indicator */}
            <button
              onClick={handleForceSync}
              title={syncStatus.connected ? 'Cloud Connected (Click to sync now)' : 'Offline / Reconnecting'}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700/70 text-[11px] font-medium text-slate-300 hover:border-slate-600 transition-colors cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full ${syncStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span>{syncStatus.isSyncing ? 'Syncing...' : syncStatus.connected ? 'Live Synced' : 'Offline'}</span>
            </button>

            {/* Connect Mobile App / QR Button */}
            <button
              onClick={() => setShowConnectModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all cursor-pointer border border-emerald-400/30"
              title="Connect Android Phone or get Agent QR"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Connect Phone</span>
              <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded font-bold">QR</span>
            </button>

            {/* Active Agent Dropdown */}
            <div className="hidden xl:flex items-center gap-2 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-xl">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-slate-400">Agent:</span>
              <select
                value={activeEmployeeId}
                onChange={(e) => setActiveEmployeeId(e.target.value)}
                className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer max-w-[130px] truncate"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-slate-900 text-slate-100 font-mono py-1">
                    {emp.name} ({emp.id})
                  </option>
                ))}
              </select>
            </div>

            {viewMode === 'mobile' && (
              <button
                onClick={() => setMobileFrame(!mobileFrame)}
                title={mobileFrame ? 'Switch to Full Mobile Screen' : 'Switch to Phone Device Frame'}
                className={`p-2 rounded-lg text-xs border transition-colors cursor-pointer ${
                  mobileFrame
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}

            <PWAInstallButton variant="compact" />

            <button
              onClick={handleResetData}
              title="Reset All CRM Demo Data"
              className="p-2 rounded-lg text-slate-400 border border-slate-700 bg-slate-800 hover:text-amber-400 hover:border-amber-500/40 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Connected Agent QR & Mobile Link Modal */}
      <AgentConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        employees={employees}
        activeEmployeeId={activeEmployeeId}
      />
    </>
  );
};

