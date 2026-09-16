import React, { useState } from 'react';
import { Smartphone, QrCode, Copy, Check, ExternalLink, Users, RefreshCw, Sparkles, X, Shield, PhoneCall } from 'lucide-react';
import { Employee } from '../../types/crm';
import { StorageService } from '../../services/storage';

interface AgentConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  activeEmployeeId?: string;
}

export const AgentConnectModal: React.FC<AgentConnectModalProps> = ({
  isOpen,
  onClose,
  employees,
  activeEmployeeId,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(activeEmployeeId || employees[0]?.id || 'emp-101');
  const [copied, setCopied] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const agentMobileUrl = `${currentOrigin}/?view=mobile&emp=${selectedEmpId}`;
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(agentMobileUrl)}&color=0f172a&bgcolor=ffffff&qzone=2`;

  const selectedEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(agentMobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSync = async () => {
    setIsSyncingNow(true);
    const ok = await StorageService.forceSync();
    setIsSyncingNow(false);
    setSyncSuccess(ok);
    setTimeout(() => setSyncSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 text-white shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-900/30">
              <Smartphone className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Connect Android Mobile App
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Live Cloud Sync
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Scan with your phone to open the connected mobile dialer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto space-y-5 py-4 pr-1">
          
          {/* Agent Selector */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Select Agent for Mobile Phone:
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">
                Target: {selectedEmployee?.dailyTarget || 40} Calls/Day
              </span>
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id}) — {emp.role} [{emp.status}]
                </option>
              ))}
            </select>
          </div>

          {/* QR Code and Mobile Connection Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-md border border-slate-200 text-center">
              <img
                src={qrCodeApiUrl}
                alt="Agent Mobile Connect QR Code"
                className="w-44 h-44 object-contain rounded-lg"
              />
              <span className="text-[10px] text-slate-600 font-semibold mt-2 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-slate-500" /> Scan with Android Camera or Chrome
              </span>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                How Connected Mobile Works:
              </div>
              <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-white">Auto Agent Login:</strong> Scanning immediately opens <strong>{selectedEmployee?.name}</strong>&apos;s workspace.
                </li>
                <li>
                  <strong className="text-white">SIM Cellular Dialer:</strong> Clicking &quot;Call&quot; triggers your phone&apos;s actual SIM dialer via standard <code className="text-emerald-400">tel:</code>.
                </li>
                <li>
                  <strong className="text-white">Real-Time Cloud Sync:</strong> Calls, attendance, and dispositions logged on mobile appear on the desktop admin screen automatically!
                </li>
              </ul>

              {/* Direct Open Button */}
              <div className="pt-2">
                <a
                  href={agentMobileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-900/30 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Test Open on This Device
                </a>
              </div>
            </div>

          </div>

          {/* Direct Agent URL Copy */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400">
              Direct Mobile Link for {selectedEmployee?.name}:
            </label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3">
              <input
                type="text"
                readOnly
                value={agentMobileUrl}
                className="bg-transparent text-xs text-emerald-400 flex-1 outline-none font-mono select-all overflow-ellipsis"
              />
              <button
                onClick={handleCopyLink}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Cloud Sync Status & Manual Push */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="font-bold text-emerald-300">Server Backend Sync Active</span>
                <p className="text-[11px] text-emerald-400/80">Desktop and phone stay updated continuously</p>
              </div>
            </div>
            <button
              onClick={handleManualSync}
              disabled={isSyncingNow}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
              {syncSuccess ? 'Synced!' : 'Force Sync'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
