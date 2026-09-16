import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Search,
  Filter,
  Check,
  X,
  FileText,
  Briefcase,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Employee, LeaveRequest, LeaveStatus, LeaveType } from '../../types/crm';
import { StorageService } from '../../services/storage';

interface LeaveManagementAdminProps {
  employees: Employee[];
  leaveRequests: LeaveRequest[];
  onRefresh: () => void;
  onSelectAgent?: (emp: Employee) => void;
}

export const LeaveManagementAdmin: React.FC<LeaveManagementAdminProps> = ({
  employees,
  leaveRequests,
  onRefresh,
  onSelectAgent,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'balances'>('requests');
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewNoteInput, setReviewNoteInput] = useState<{ [id: string]: string }>({});

  // Summary Metrics
  const pendingCount = leaveRequests.filter((r) => r.status === 'Pending').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'Approved').length;
  const rejectedCount = leaveRequests.filter((r) => r.status === 'Rejected').length;
  const totalLeaveDaysApproved = leaveRequests
    .filter((r) => r.status === 'Approved')
    .reduce((sum, r) => sum + r.totalDays, 0);

  // Filter requests
  const filteredRequests = leaveRequests.filter((req) => {
    const matchesSearch =
      req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApprove = (req: LeaveRequest) => {
    const note = reviewNoteInput[req.id] || 'Approved by Branch Management';
    StorageService.updateLeaveStatus(req.id, 'Approved', 'Admin / Branch Head', note);
    onRefresh();
  };

  const handleReject = (req: LeaveRequest) => {
    const note = reviewNoteInput[req.id] || 'Rejected due to business operational requirements';
    StorageService.updateLeaveStatus(req.id, 'Rejected', 'Admin / Branch Head', note);
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Title & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">Leave Approval & Tracking Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Accept or decline agent leave applications, monitor remaining leave balances, and track total employee working days.
          </p>
        </div>

        {/* Navigation Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Leave Requests
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('balances')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'balances'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
            Employee Leave Ledger & Days Worked
          </button>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Pending Approvals</div>
            <div className="text-2xl font-black text-amber-600 mt-1 font-mono">{pendingCount}</div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">Requires admin review</div>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Approved Applications</div>
            <div className="text-2xl font-black text-emerald-600 mt-1 font-mono">{approvedCount}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">{totalLeaveDaysApproved} days granted</div>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Rejected Applications</div>
            <div className="text-2xl font-black text-slate-700 mt-1 font-mono">{rejectedCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Declined leaves</div>
          </div>
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Field Agents</div>
            <div className="text-2xl font-black text-blue-600 mt-1 font-mono">{employees.length}</div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">Active workforce</div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TAB 1: LEAVE APPLICATIONS & ACCEPTANCE PANEL */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Filter Applications:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {['Pending', 'Approved', 'Rejected', 'ALL'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      statusFilter === st
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? 'All Requests' : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search agent name, ID or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Leave Requests Cards / Table */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No leave applications match the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => {
                const emp = employees.find((e) => e.id === req.employeeId);
                const balance = StorageService.getEmployeeLeaveBalance(req.employeeId);

                return (
                  <div
                    key={req.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs space-y-3 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Employee Info */}
                      <div className="flex items-center gap-3">
                        <img
                          src={emp?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                          alt={req.employeeName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-slate-200 shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">{req.employeeName}</h3>
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-bold">
                              {req.employeeId}
                            </span>
                            <span className="text-xs text-slate-400">• {emp?.role || 'Sales Agent'}</span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span>Applied on: <strong className="text-slate-700">{new Date(req.appliedOn).toLocaleDateString('en-IN')}</strong></span>
                            <span>• Days Worked: <strong className="text-emerald-700">{balance.daysWorkedCount} days</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg border border-slate-200">
                          {req.leaveType}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                            req.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : req.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                          }`}
                        >
                          ● {req.status}
                        </span>
                      </div>
                    </div>

                    {/* Leave Date Range & Reason Details */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Leave Period</span>
                        <div className="font-bold text-slate-900 font-mono mt-0.5">
                          {req.startDate} → {req.endDate}
                        </div>
                        <span className="text-blue-600 font-extrabold text-[11px] mt-0.5 block">
                          Total Duration: {req.totalDays} Day(s)
                        </span>
                      </div>

                      <div className="md:col-span-2">
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Reason for Leave</span>
                        <p className="text-slate-800 font-medium mt-0.5 italic">"{req.reason}"</p>
                      </div>
                    </div>

                    {/* Action Bar / Review Note */}
                    {req.status === 'Pending' ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Optional admin review remarks (e.g. Approved, work handed over)..."
                          value={reviewNoteInput[req.id] || ''}
                          onChange={(e) =>
                            setReviewNoteInput({ ...reviewNoteInput, [req.id]: e.target.value })
                          }
                          className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleReject(req)}
                            className="px-4 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>

                          <button
                            onClick={() => handleApprove(req)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept & Approve
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 pt-1 flex items-center justify-between border-t border-slate-100">
                        <span>Reviewed by: <strong className="text-slate-800">{req.reviewedBy || 'Admin'}</strong></span>
                        <span className="italic text-slate-600">Note: {req.reviewNotes || '—'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMPLOYEE LEAVE LEDGER & DAYS WORKED TRACKER */}
      {activeTab === 'balances' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Employee Leave Ledger, Attendance & Month-End Salary Days</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time tracking of remaining leave quotas, worked days, paid leaves, non-paid days, and month-end calculated payable days.
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900 font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Declined Leave Policy:</strong> Rejecting/Declining a leave does <strong>NOT deduct</strong> from the agent's leave bucket. Days remain fully available.
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-700 font-extrabold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-3">Agent Details</th>
                  <th className="px-3.5 py-3">Days Worked</th>
                  <th className="px-3.5 py-3">Paid Leaves</th>
                  <th className="px-3.5 py-3">Non-Paid (LOP)</th>
                  <th className="px-3.5 py-3">Casual Leaves</th>
                  <th className="px-3.5 py-3">Sick Leaves</th>
                  <th className="px-3.5 py-3">Earned Leaves</th>
                  <th className="px-3.5 py-3">Declined Requests</th>
                  <th className="px-3.5 py-3 bg-emerald-50 text-emerald-900">Month-End Payable Days</th>
                  <th className="px-3.5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {employees.map((emp) => {
                  const bal = StorageService.getEmployeeLeaveBalance(emp.id);
                  const casualRem = bal.casualAllocated - bal.casualUsed;
                  const sickRem = bal.sickAllocated - bal.sickUsed;
                  const paidRem = bal.paidAllocated - bal.paidUsed;
                  const totalApprovedPaidDays = bal.casualUsed + bal.sickUsed + bal.paidUsed;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                            alt={emp.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {emp.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          {bal.daysWorkedCount} Days
                        </span>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                          + {totalApprovedPaidDays} Days
                        </span>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className={`font-mono font-bold text-xs ${bal.unpaidUsed > 0 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200' : 'text-slate-400'}`}>
                          {bal.unpaidUsed} Days
                        </span>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className="font-bold text-slate-800">
                          {casualRem} / {bal.casualAllocated}
                        </span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.max(0, (casualRem / bal.casualAllocated) * 100)}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className="font-bold text-slate-800">
                          {sickRem} / {bal.sickAllocated}
                        </span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${Math.max(0, (sickRem / bal.sickAllocated) * 100)}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className="font-bold text-slate-800">
                          {paidRem} / {bal.paidAllocated}
                        </span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-purple-500 h-full rounded-full"
                            style={{ width: `${Math.max(0, (paidRem / bal.paidAllocated) * 100)}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {bal.rejectedRequestsCount} Declined (0 Deducted)
                        </span>
                      </td>

                      <td className="px-3.5 py-3 bg-emerald-50/60 font-mono font-black text-emerald-900 text-sm">
                        {bal.netPayableDaysThisMonth} Days
                        <div className="text-[10px] text-emerald-700 font-normal">Worked + Paid Leaves</div>
                      </td>

                      <td className="px-3.5 py-3">
                        <button
                          onClick={() => onSelectAgent?.(emp)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
