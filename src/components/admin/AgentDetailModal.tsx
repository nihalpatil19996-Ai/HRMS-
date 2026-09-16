import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Award,
  Calendar,
  Layers,
  PauseCircle,
  PhoneCall,
  Download,
  Filter,
  Target,
  Edit3,
  Check,
  Sparkles,
} from 'lucide-react';
import { Employee, Lead, CallLog, AttendanceRecord, BreakRecord } from '../../types/crm';
import { StorageService } from '../../services/storage';
import { BreakTimer } from '../common/BreakTimer';

interface AgentDetailModalProps {
  employee: Employee | null;
  leads: Lead[];
  callLogs: CallLog[];
  attendance: AttendanceRecord[];
  breaks: BreakRecord[];
  onClose: () => void;
  onRefresh?: () => void;
}

export const AgentDetailModal: React.FC<AgentDetailModalProps> = ({
  employee,
  leads,
  callLogs,
  attendance,
  breaks,
  onClose,
  onRefresh,
}) => {
  if (!employee) return null;

  const [selectedProductSection, setSelectedProductSection] = useState<string>('All');
  const [currentTarget, setCurrentTarget] = useState<number>(employee.dailyTarget || 40);
  const [targetSavedMsg, setTargetSavedMsg] = useState(false);

  const handleSaveTarget = (newVal: number) => {
    const safeVal = Math.max(5, Math.min(300, newVal));
    setCurrentTarget(safeVal);
    StorageService.setEmployeeTarget(employee.id, safeVal, safeVal * 24);
    onRefresh?.();
    setTargetSavedMsg(true);
    setTimeout(() => setTargetSavedMsg(false), 2500);
  };

  // Filter agent specific data
  const agentLeads = leads.filter((l) => l.assignedTo === employee.id);
  const agentCallLogs = callLogs.filter((c) => c.employeeId === employee.id);
  const agentBreaks = breaks.filter((b) => b.employeeId === employee.id);
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.find((a) => a.employeeId === employee.id && a.date === today);

  // Extract distinct product sections for this agent's leads
  const productSections = Array.from(
    new Set([
      'All',
      'Share Market Sales',
      'Health Insurance Sales',
      'Mutual Funds',
      'Personal Loan',
      ...agentLeads.map((l) => l.product || 'General Sales'),
    ])
  );

  const filteredLeads =
    selectedProductSection === 'All'
      ? agentLeads
      : agentLeads.filter(
          (l) => (l.product || 'General Sales').toLowerCase() === selectedProductSection.toLowerCase()
        );

  // Calculated Stats
  const todayCallsCount = agentCallLogs.length;
  const totalTalkSeconds = agentCallLogs.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  const totalTalkMins = Math.round(totalTalkSeconds / 60);
  const salesClosed = agentLeads.filter((l) => l.status === 'Converted').length;
  const totalSalesValue = agentLeads
    .filter((l) => l.status === 'Converted')
    .reduce((acc, l) => acc + (l.dealValue || 5000), 0);

  const conversionRate =
    agentLeads.length > 0 ? Math.round((salesClosed / agentLeads.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <img
              src={employee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
              alt={employee.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{employee.name}</h2>
                <span className="font-mono text-xs bg-blue-900 text-blue-200 px-2 py-0.5 rounded-lg border border-blue-700/80 font-bold">
                  ID: {employee.id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    employee.status === 'On Duty'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : employee.status === 'On Break'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-700 text-slate-300 border-slate-600'
                  }`}
                >
                  ● {employee.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {employee.role} • Mobile: <span className="font-mono">{employee.mobile}</span> • Manager:{' '}
                {employee.managerName || 'Sales Head'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* Live Status & Attendance Summary Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Punch In / Login</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">
                {todayAttendance?.loginTime || '09:00:12 AM'}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                Status: {todayAttendance?.status || 'On Time'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Current Pause / Break</span>
                <PauseCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-base font-bold text-slate-900 font-mono">
                {employee.status === 'On Break' ? (
                  <span className="text-amber-800 flex items-center gap-1">
                    {employee.currentBreak} • <BreakTimer startTime={employee.currentBreakStart} />
                  </span>
                ) : (
                  <span className="text-slate-400">Not on break</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Total breaks today: {agentBreaks.length} sessions
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Calls & Talktime</span>
                <PhoneCall className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-base font-bold text-slate-900">
                {todayCallsCount} Calls <span className="text-xs text-slate-400 font-normal">({totalTalkMins} mins)</span>
              </div>
              <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
                Target: {todayCallsCount}/{currentTarget} calls ({Math.max(0, currentTarget - todayCallsCount)} remaining)
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Sales Closed</span>
                <Award className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-base font-bold text-slate-900">
                ₹{totalSalesValue.toLocaleString('en-IN')}{' '}
                <span className="text-xs text-emerald-600 font-bold">({salesClosed} deals)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Conversion Rate: <span className="font-bold text-purple-700">{conversionRate}%</span>
              </div>
            </div>
          </div>

          {/* Admin Target Setting Controller Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 rounded-2xl border border-indigo-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-400 text-slate-950 rounded-xl shadow-xs">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">Daily Target Configuration for {employee.name}</h4>
                  {targetSavedMsg && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Saved!
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Current Target: <strong className="text-amber-300">{currentTarget} Calls/Day</strong> • Done: <strong className="text-emerald-300">{todayCallsCount}</strong> • Remaining: <strong className="text-orange-300">{Math.max(0, currentTarget - todayCallsCount)} calls</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleSaveTarget(currentTarget - 5)}
                  className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg flex items-center justify-center text-xs cursor-pointer"
                >
                  -5
                </button>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={currentTarget}
                  onChange={(e) => setCurrentTarget(Number(e.target.value))}
                  onBlur={() => handleSaveTarget(currentTarget)}
                  className="w-16 bg-slate-900 text-amber-300 font-extrabold text-center rounded-lg py-1 text-xs border border-slate-700"
                />
                <button
                  type="button"
                  onClick={() => handleSaveTarget(currentTarget + 5)}
                  className="w-7 h-7 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg flex items-center justify-center text-xs cursor-pointer"
                >
                  +5
                </button>
              </div>

              <div className="flex items-center gap-1">
                {[30, 40, 50, 75, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSaveTarget(num)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                      currentTarget === num
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Section Navigation Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                Work Breakdown by Product Section
              </h3>
              <span className="text-xs text-slate-500">
                Total Leads Assigned: <strong className="text-slate-900">{agentLeads.length}</strong>
              </span>
            </div>

            {/* Upper Section Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {productSections.map((section) => {
                const sectionCount =
                  section === 'All'
                    ? agentLeads.length
                    : agentLeads.filter(
                        (l) => (l.product || 'General Sales').toLowerCase() === section.toLowerCase()
                      ).length;

                const isActive = selectedProductSection.toLowerCase() === section.toLowerCase();

                return (
                  <button
                    key={section}
                    onClick={() => setSelectedProductSection(section)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200/60'
                    }`}
                  >
                    {section}
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                        isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {sectionCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Product Section Leads Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 mt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Client Name</th>
                    <th className="px-4 py-2.5">Mobile</th>
                    <th className="px-4 py-2.5">Product Section</th>
                    <th className="px-4 py-2.5">Location</th>
                    <th className="px-4 py-2.5">Call Status</th>
                    <th className="px-4 py-2.5">Remarks / Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No leads assigned in this section for {employee.name}.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{lead.customerName}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-700">{lead.mobile}</td>
                        <td className="px-4 py-2.5">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-medium text-[11px] border border-slate-200">
                            {lead.product}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {lead.city}, {lead.state}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                              lead.status === 'Converted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : lead.status === 'Interested'
                                ? 'bg-blue-100 text-blue-800'
                                : lead.status === 'Follow-up'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 truncate max-w-[200px]">
                          {lead.remarks || 'No notes yet'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today's Call Logs & Activity Stream */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              Agent Today Call History & Work Activity Logs ({agentCallLogs.length})
            </h3>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Time</th>
                    <th className="px-4 py-2.5">Client Name</th>
                    <th className="px-4 py-2.5">Mobile</th>
                    <th className="px-4 py-2.5">Duration</th>
                    <th className="px-4 py-2.5">Outcome</th>
                    <th className="px-4 py-2.5">Agent Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {agentCallLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No calls recorded today for this agent.
                      </td>
                    </tr>
                  ) : (
                    agentCallLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-2.5 font-mono text-slate-500">
                          {new Date(log.callStart).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{log.customerName}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-700">{log.customerMobile}</td>
                        <td className="px-4 py-2.5 font-mono font-medium text-slate-800">
                          {Math.floor(log.durationSeconds / 60)}m {log.durationSeconds % 60}s
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 italic">{log.comments || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors"
          >
            Close Agent View
          </button>
        </div>
      </div>
    </div>
  );
};
