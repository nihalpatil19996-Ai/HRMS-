import React, { useState } from 'react';
import { LayoutDashboard, Users, FileSpreadsheet, Clock, FileText, BarChart3, Settings, CalendarCheck } from 'lucide-react';
import { DashboardOverview } from './DashboardOverview';
import { EmployeeManager } from './EmployeeManager';
import { LeadManager } from './LeadManager';
import { AttendanceAndBreaks } from './AttendanceAndBreaks';
import { FileDistribution } from './FileDistribution';
import { ReportsAnalytics } from './ReportsAnalytics';
import { LeaveManagementAdmin } from './LeaveManagementAdmin';
import { AgentDetailModal } from './AgentDetailModal';
import { Employee, Lead, AttendanceRecord, BreakRecord, DistributedFile, CallLog, SystemStats, LeaveRequest } from '../../types/crm';
import { StorageService } from '../../services/storage';

interface AdminLayoutProps {
  stats: SystemStats;
  employees: Employee[];
  leads: Lead[];
  attendance: AttendanceRecord[];
  breaks: BreakRecord[];
  files: DistributedFile[];
  callLogs: CallLog[];
  onRefresh: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  stats,
  employees,
  leads,
  attendance,
  breaks,
  files,
  callLogs,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAgent, setSelectedAgent] = useState<Employee | null>(null);

  const leaveRequests: LeaveRequest[] = StorageService.getLeaveRequests();
  const pendingLeavesCount = leaveRequests.filter((l) => l.status === 'Pending').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Monitor', icon: LayoutDashboard },
    { id: 'employees', label: 'Employee Management', icon: Users },
    { id: 'leads', label: 'Lead Mgmt & Assign', icon: FileSpreadsheet },
    { id: 'attendance', label: 'Attendance & Breaks', icon: Clock },
    { id: 'leaves', label: 'Leave Management', icon: CalendarCheck, badge: pendingLeavesCount > 0 ? pendingLeavesCount : undefined },
    { id: 'files', label: 'File Distribution', icon: FileText },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-4rem)] bg-slate-100">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-shrink-0 p-4 space-y-6">
        <div className="px-2 pt-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            ADMIN WEB PORTAL
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            Central Command Center
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick System Summary Box */}
        <div className="pt-6 border-t border-slate-800 px-2 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            System Operational Health
          </div>
          <div className="bg-slate-800/80 rounded-xl p-3 text-xs space-y-1 border border-slate-700/60">
            <div className="flex justify-between text-slate-300">
              <span>Cloud DB Sync:</span>
              <span className="text-emerald-400 font-bold">Active</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Auto Dialer:</span>
              <span className="text-blue-400 font-bold">Ready</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Total Leads:</span>
              <span className="text-white font-bold">{leads.length}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            stats={stats}
            employees={employees}
            leads={leads}
            callLogs={callLogs}
            breaks={breaks}
            onNavigateTab={setActiveTab}
            onSelectAgent={(emp) => setSelectedAgent(emp)}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeManager
            employees={employees}
            onRefresh={onRefresh}
            onSelectAgent={(emp) => setSelectedAgent(emp)}
          />
        )}

        {activeTab === 'leads' && (
          <LeadManager leads={leads} employees={employees} onRefresh={onRefresh} />
        )}

        {activeTab === 'attendance' && (
          <AttendanceAndBreaks
            attendance={attendance}
            breaks={breaks}
            employees={employees}
            onSelectAgent={(emp) => setSelectedAgent(emp)}
          />
        )}

        {activeTab === 'leaves' && (
          <LeaveManagementAdmin
            employees={employees}
            leaveRequests={leaveRequests}
            onRefresh={onRefresh}
            onSelectAgent={(emp) => setSelectedAgent(emp)}
          />
        )}

        {activeTab === 'files' && (
          <FileDistribution files={files} onRefresh={onRefresh} />
        )}

        {activeTab === 'reports' && (
          <ReportsAnalytics employees={employees} leads={leads} callLogs={callLogs} />
        )}
      </main>

      {/* Detailed Agent Work Dashboard Modal */}
      {selectedAgent && (
        <AgentDetailModal
          employee={selectedAgent}
          leads={leads}
          callLogs={callLogs}
          attendance={attendance}
          breaks={breaks}
          onClose={() => setSelectedAgent(null)}
          onRefresh={onRefresh}
        />
      )}

    </div>
  );
};
