import React from 'react';
import { Users, PhoneCall, CheckCircle2, Clock, PauseCircle, TrendingUp, AlertCircle, PhoneOff } from 'lucide-react';
import { Employee, Lead, SystemStats, CallLog, BreakRecord } from '../../types/crm';
import { BreakTimer } from '../common/BreakTimer';

interface DashboardOverviewProps {
  stats: SystemStats;
  employees: Employee[];
  leads: Lead[];
  callLogs: CallLog[];
  breaks: BreakRecord[];
  onNavigateTab: (tab: string) => void;
  onSelectAgent?: (emp: Employee) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  employees,
  leads,
  callLogs,
  breaks,
  onNavigateTab,
  onSelectAgent,
}) => {
  const convertedLeads = leads.filter((l) => l.status === 'Converted');
  const totalRevenue = convertedLeads.reduce((sum, l) => sum + (l.dealValue || 20000), 0);
  const totalCalls = callLogs.length;
  const interestedCalls = callLogs.filter((c) => c.status === 'Interested' || c.status === 'Meeting Fixed').length;

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Intro */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Field Operations Control Center
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Real-time monitoring of field agents, auto-dialer campaign metrics, live duty status, break logs, and sales conversions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('leads')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              Assign Leads & Import Excel
            </button>
            <button
              onClick={() => onNavigateTab('files')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-all"
            >
              Upload Files for Agents
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Employees Online</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">{stats.onlineEmployees}</span>
            <span className="text-xs text-slate-400 ml-1">/ {employees.length} total</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active field duty
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Dialer Calls</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">{stats.activeCalls}</span>
            <span className="text-xs text-slate-400 ml-1">live</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-medium">
            Simulated dialer active
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Today's Calls</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">{stats.todayCalls}</span>
            <span className="text-xs text-slate-400 ml-1">calls logged</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-600 font-medium">
            {interestedCalls} positive outcomes
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Sales Converted</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">{stats.salesDone}</span>
            <span className="text-xs text-slate-400 ml-1">policies/loans</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-semibold">
            ₹{totalRevenue.toLocaleString()} volume
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Leads Pending</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">{stats.pendingLeads}</span>
            <span className="text-xs text-slate-400 ml-1">in queue</span>
          </div>
          <div className="mt-2 text-[11px] text-purple-600 font-medium">
            Ready for dialer
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Break Duration</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <PauseCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">{stats.totalBreakTimeMinutes}</span>
            <span className="text-xs text-slate-400 ml-1">mins today</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            {employees.filter((e) => e.status === 'On Break').length} agents on break
          </div>
        </div>

      </div>

      {/* Main Grid: Live Agent Duty Feed & Call Outcome Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Employee Status Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Live Agent Duty Tracker</h2>
              <p className="text-xs text-slate-500">Real-time status, active break, and daily target progress</p>
            </div>
            <button
              onClick={() => onNavigateTab('employees')}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Manage Employees →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Employee</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Duty Status</th>
                  <th className="pb-3">Active Break</th>
                  <th className="pb-3 pr-2 text-right">Today's Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {employees.map((emp) => {
                  const empCalls = callLogs.filter((c) => c.employeeId === emp.id).length;
                  const empConversions = leads.filter((l) => l.assignedTo === emp.id && l.status === 'Converted').length;

                  return (
                    <tr key={emp.id} className="hover:bg-blue-50/50 transition-colors cursor-pointer group" onClick={() => onSelectAgent?.(emp)}>
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                            alt={emp.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 group-hover:border-blue-500 transition-colors"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                              {emp.name}
                              <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">
                                {emp.id}
                              </span>
                              <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                View Dashboard →
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">{emp.mobile}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-slate-600 font-medium">{emp.role}</td>
                      <td className="py-3">
                        {emp.status === 'On Duty' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            On Duty
                          </span>
                        )}
                        {emp.status === 'On Break' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            On Break
                          </span>
                        )}
                        {emp.status === 'Offline' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        {emp.status === 'On Break' && emp.currentBreak ? (
                          <span className="text-amber-900 font-bold bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1 shadow-2xs">
                            {emp.currentBreak} Break • <BreakTimer startTime={emp.currentBreakStart} />
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <div className="font-bold text-slate-900">{empCalls} / {emp.dailyTarget} calls</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">{empConversions} sales done</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Call Outcomes & Conversion Overview */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Call Disposition Funnel</h2>
            <p className="text-xs text-slate-500">Breakdown of customer responses from auto-dialer</p>
          </div>

          <div className="space-y-3">
            {[
              { status: 'Converted', count: leads.filter((l) => l.status === 'Converted').length, color: 'bg-emerald-500', text: 'text-emerald-700' },
              { status: 'Meeting Fixed', count: leads.filter((l) => l.status === 'Meeting Fixed').length, color: 'bg-blue-500', text: 'text-blue-700' },
              { status: 'Interested', count: leads.filter((l) => l.status === 'Interested').length, color: 'bg-indigo-500', text: 'text-indigo-700' },
              { status: 'Follow-up', count: leads.filter((l) => l.status === 'Follow-up').length, color: 'bg-amber-500', text: 'text-amber-700' },
              { status: 'Busy', count: leads.filter((l) => l.status === 'Busy').length, color: 'bg-rose-400', text: 'text-rose-700' },
              { status: 'Switch Off / Wrong No', count: leads.filter((l) => l.status === 'Switch Off' || l.status === 'Wrong Number' || l.status === 'Out of Coverage').length, color: 'bg-slate-400', text: 'text-slate-700' },
            ].map((item) => {
              const total = leads.length || 1;
              const pct = Math.round((item.count / total) * 100);

              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{item.status}</span>
                    <span className={item.text}>{item.count} leads ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} transition-all duration-500`} style={{ width: `${Math.max(pct, 4)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-2xl flex items-center justify-between text-xs">
            <span className="text-slate-500">Overall Dialing Conversion:</span>
            <span className="font-extrabold text-blue-700 text-sm">
              {Math.round((convertedLeads.length / (leads.length || 1)) * 100)}% Success
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
