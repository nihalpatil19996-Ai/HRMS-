import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { AdminLayout } from './components/admin/AdminLayout';
import { MobileApp } from './components/mobile/MobileApp';
import { StorageService, subscribeStorage, startCloudSync } from './services/storage';
import { Employee, Lead, AttendanceRecord, BreakRecord, DistributedFile, CallLog, SystemStats } from './types/crm';
import { OfflineIndicator } from './components/common/OfflineIndicator';

export default function App() {
  const [viewMode, setViewMode] = useState<'admin' | 'mobile'>('admin');
  const [mobileFrame, setMobileFrame] = useState(true);
  const [connectedBanner, setConnectedBanner] = useState<string | null>(null);

  // Storage synced state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [breaks, setBreaks] = useState<BreakRecord[]>([]);
  const [files, setFiles] = useState<DistributedFile[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [activeEmpId, setActiveEmpId] = useState<string>('emp-101');
  const [stats, setStats] = useState<SystemStats>({
    onlineEmployees: 0,
    activeCalls: 0,
    todayCalls: 0,
    salesDone: 0,
    pendingLeads: 0,
    totalBreakTimeMinutes: 0,
  });

  const loadAllData = () => {
    setEmployees(StorageService.getEmployees());
    setLeads(StorageService.getLeads());
    setAttendance(StorageService.getAttendance());
    setBreaks(StorageService.getBreaks());
    setFiles(StorageService.getFiles());
    setCallLogs(StorageService.getCallLogs());
    setActiveEmpId(StorageService.getActiveEmployeeId());
    setStats(StorageService.getStats());
  };

  useEffect(() => {
    // 1. Start real-time server background synchronization
    startCloudSync();

    // 2. Initial data load
    loadAllData();

    // 3. Check URL parameters for direct mobile connect (e.g. ?view=mobile&emp=emp-101)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlView = params.get('view');
      const urlEmp = params.get('emp') || params.get('agent');

      // Auto-detect mobile device or URL view parameter
      const isMobileDevice = window.innerWidth < 640;
      if (urlView === 'mobile' || (!urlView && isMobileDevice)) {
        setViewMode('mobile');
        if (isMobileDevice) {
          setMobileFrame(false);
        }
      }

      if (urlEmp) {
        StorageService.setActiveEmployeeId(urlEmp);
        setActiveEmpId(urlEmp);
        const matched = StorageService.getEmployees().find(
          (e) => e.id.toLowerCase() === urlEmp.toLowerCase()
        );
        if (matched) {
          setConnectedBanner(`Connected as ${matched.name} (${matched.id}) • Live Calling Active`);
          setTimeout(() => setConnectedBanner(null), 5000);
        }
      }
    }

    const unsubscribe = subscribeStorage(() => {
      loadAllData();
    });
    return unsubscribe;
  }, []);

  const handleSetActiveEmpId = (id: string) => {
    StorageService.setActiveEmployeeId(id);
    setActiveEmpId(id);
  };

  const activeEmployee = employees.find((e) => e.id === activeEmpId) || employees[0] || {
    id: 'emp-101',
    name: 'Rajesh Sharma',
    mobile: '+91 98765 43210',
    email: 'rajesh.s@fieldcrm.com',
    role: 'Sales Executive',
    status: 'On Duty',
    dailyTarget: 40,
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans text-slate-800 antialiased selection:bg-blue-500 selection:text-white">
      {/* Connected agent banner if loaded via URL / QR */}
      {connectedBanner && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white text-xs font-bold py-2 px-4 text-center shadow-md flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>{connectedBanner}</span>
        </div>
      )}

      <Navbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        activeEmployeeId={activeEmpId}
        setActiveEmployeeId={handleSetActiveEmpId}
        employees={employees}
        mobileFrame={mobileFrame}
        setMobileFrame={setMobileFrame}
      />

      {viewMode === 'admin' ? (
        <AdminLayout
          stats={stats}
          employees={employees}
          leads={leads}
          attendance={attendance}
          breaks={breaks}
          files={files}
          callLogs={callLogs}
          onRefresh={loadAllData}
        />
      ) : (
        <MobileApp
          activeEmployee={activeEmployee}
          leads={leads}
          attendance={attendance}
          breaks={breaks}
          files={files}
          onRefresh={loadAllData}
          isFrame={mobileFrame}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}

