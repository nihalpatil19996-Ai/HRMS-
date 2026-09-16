import React from 'react';
import { BarChart3, Download, TrendingUp, PhoneCall, CheckCircle, Percent } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, Lead, CallLog } from '../../types/crm';

interface ReportsAnalyticsProps {
  employees: Employee[];
  leads: Lead[];
  callLogs: CallLog[];
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ employees, leads, callLogs }) => {
  const handleExportCSV = () => {
    const reportData = employees.map((emp) => {
      const empLogs = callLogs.filter((c) => c.employeeId === emp.id);
      const totalCalls = empLogs.length;
      const interested = empLogs.filter((c) => c.status === 'Interested').length;
      const busy = empLogs.filter((c) => c.status === 'Busy').length;
      const switchOff = empLogs.filter((c) => c.status === 'Switch Off' || c.status === 'Wrong Number').length;
      const followup = empLogs.filter((c) => c.status === 'Follow-up' || c.status === 'Meeting Fixed').length;
      const converted = leads.filter((l) => l.assignedTo === emp.id && l.status === 'Converted').length;
      const convRate = totalCalls > 0 ? Math.round((converted / totalCalls) * 100) : 0;

      return {
        'Agent Name': emp.name,
        'Role': emp.role,
        'Daily Target': emp.dailyTarget,
        'Total Calls': totalCalls,
        'Interested': interested,
        'Busy': busy,
        'Switch Off / Invalid': switchOff,
        'Follow-up / Meetings': followup,
        'Sales Converted': converted,
        'Conversion Rate %': `${convRate}%`,
      };
    });

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales_Report');
    XLSX.writeFile(wb, `Field_Sales_Performance_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports & Field Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Agent call ratios, call dispositions, conversion percentages, and downloadable Excel performance logs
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Export Report to Excel
        </button>
      </div>

      {/* Employee Performance Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          Field Sales Agent Call Performance Matrix
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Agent Name</th>
                <th className="py-3 px-4 text-center">Total Calls</th>
                <th className="py-3 px-4 text-center text-blue-600">Interested</th>
                <th className="py-3 px-4 text-center text-amber-600">Follow-up</th>
                <th className="py-3 px-4 text-center text-rose-600">Busy</th>
                <th className="py-3 px-4 text-center text-slate-500">Switch Off</th>
                <th className="py-3 px-4 text-center text-emerald-700">Converted</th>
                <th className="py-3 px-4 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {employees.map((emp) => {
                const empLogs = callLogs.filter((c) => c.employeeId === emp.id);
                const totalCalls = empLogs.length;
                const interested = empLogs.filter((c) => c.status === 'Interested').length;
                const busy = empLogs.filter((c) => c.status === 'Busy').length;
                const switchOff = empLogs.filter((c) => c.status === 'Switch Off' || c.status === 'Wrong Number').length;
                const followup = empLogs.filter((c) => c.status === 'Follow-up' || c.status === 'Meeting Fixed').length;
                const converted = leads.filter((l) => l.assignedTo === emp.id && l.status === 'Converted').length;
                const convRate = totalCalls > 0 ? Math.round((converted / (totalCalls || 1)) * 100) : 0;

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-slate-400">{emp.role}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900 bg-slate-50/50">
                      {totalCalls}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-blue-700">
                      {interested}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-amber-700">
                      {followup}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-rose-600">
                      {busy}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-500">
                      {switchOff}
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-emerald-700 bg-emerald-50/50">
                      {converted}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-blue-700">{convRate}%</span>
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.min(convRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
