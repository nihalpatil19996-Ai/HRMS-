import React, { useState } from 'react';
import { Clock, Coffee, Calendar, UserCheck, Search, Filter, AlertCircle, PauseCircle } from 'lucide-react';
import { AttendanceRecord, BreakRecord, Employee } from '../../types/crm';
import { BreakTimer } from '../common/BreakTimer';

interface AttendanceAndBreaksProps {
  attendance: AttendanceRecord[];
  breaks: BreakRecord[];
  employees: Employee[];
  onSelectAgent?: (emp: Employee) => void;
}

export const AttendanceAndBreaks: React.FC<AttendanceAndBreaksProps> = ({ attendance, breaks, employees, onSelectAgent }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'breaks'>('attendance');
  const [searchTerm, setSearchTerm] = useState('');

  const activeOnBreakEmployees = employees.filter((e) => e.status === 'On Break');

  const filteredAttendance = attendance.filter(
    (a) =>
      a.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.date.includes(searchTerm) ||
      a.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBreaks = breaks.filter(
    (b) =>
      b.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.breakType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Active Breaks Live Bar */}
      {activeOnBreakEmployees.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border border-amber-300 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <PauseCircle className="w-5 h-5 text-amber-700 animate-pulse" />
            <h2 className="text-sm font-bold text-amber-950">
              Live Agents Currently On Break Pause ({activeOnBreakEmployees.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeOnBreakEmployees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => onSelectAgent?.(emp)}
                className="bg-white border border-amber-200/80 p-3 rounded-xl shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                    alt={emp.name}
                    className="w-8 h-8 rounded-full object-cover border border-amber-300"
                  />
                  <div>
                    <div className="font-bold text-slate-900 text-xs hover:text-blue-600 transition-colors">{emp.name}</div>
                    <div className="text-[10px] text-amber-800 font-semibold">{emp.currentBreak} Break</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-medium">Pause Elapsed</div>
                  <div className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                    <BreakTimer startTime={emp.currentBreakStart} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Attendance & Break Monitoring</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated login/logout timestamps, late punch detection, and break duration logs (Tea, Lunch, Meeting, Personal)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Attendance Logs ({attendance.length})
            </button>
            <button
              onClick={() => setActiveTab('breaks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'breaks' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600" />
              Break Records ({breaks.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search agent name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Attendance View */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Login Time</th>
                  <th className="py-3 px-4">Logout Time</th>
                  <th className="py-3 px-4">Working Hours</th>
                  <th className="py-3 px-4">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      {rec.employeeName}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{rec.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900 bg-slate-50/50 rounded px-2">
                      {rec.loginTime}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {rec.logoutTime || <span className="text-emerald-600 font-semibold text-[11px]">Active Session</span>}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {rec.workingHours || 'In Progress'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          rec.status === 'On Time'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : rec.status === 'Late'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Break Records View */}
      {activeTab === 'breaks' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Break Category</th>
                  <th className="py-3 px-4">Start Time</th>
                  <th className="py-3 px-4">End Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Current Break Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredBreaks.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{b.employeeName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        {b.breakType} Break
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{b.startTime}</td>
                    <td className="py-3 px-4 text-slate-600">{b.endTime || 'Ongoing'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {b.durationMinutes ? (
                        `${b.durationMinutes} mins`
                      ) : (
                        <span className="text-amber-800 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⏱️ <BreakTimer startTime={b.startTime} />
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {!b.endTime ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                          Active Pause
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
