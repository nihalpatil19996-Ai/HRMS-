import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Briefcase,
  AlertCircle,
  ChevronRight,
  Send,
  X,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Employee, LeaveRequest, LeaveType } from '../../types/crm';
import { StorageService } from '../../services/storage';

interface UserLeaveTrackerProps {
  activeEmployee: Employee;
  leaveRequests: LeaveRequest[];
  onRefresh: () => void;
}

export const UserLeaveTracker: React.FC<UserLeaveTrackerProps> = ({
  activeEmployee,
  leaveRequests,
  onRefresh,
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual Leave');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  // Get active employee's leave balance stats
  const balance = StorageService.getEmployeeLeaveBalance(activeEmployee.id);
  const myRequests = leaveRequests.filter((r) => r.employeeId === activeEmployee.id);

  const casualRemaining = balance.casualAllocated - balance.casualUsed;
  const sickRemaining = balance.sickAllocated - balance.sickUsed;
  const paidRemaining = balance.paidAllocated - balance.paidUsed;
  const totalApprovedDays = balance.casualUsed + balance.sickUsed + balance.paidUsed;

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please provide a reason for your leave application.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert('End date cannot be earlier than start date.');
      return;
    }

    StorageService.applyLeave(
      activeEmployee.id,
      activeEmployee.name,
      leaveType,
      startDate,
      endDate,
      reason
    );

    setShowApplyModal(false);
    setReason('');
    onRefresh();
    alert('Leave request submitted successfully! Pending approval from management.');
  };

  return (
    <div className="space-y-4 text-slate-900">
      
      {/* Leave Balances Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-5 rounded-3xl shadow-xl space-y-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/30 text-blue-300 rounded-2xl border border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-white">Leave & Attendance Tracker</h2>
              <p className="text-xs text-slate-300">{activeEmployee.name} • {activeEmployee.id}</p>
            </div>
          </div>

          <button
            onClick={() => setShowApplyModal(true)}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Apply Leave
          </button>
        </div>

        {/* Remaining Leaves Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* Days Worked Counter */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-emerald-400" />
              Days Worked
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1">
              {balance.daysWorkedCount} <span className="text-[10px] font-normal text-slate-300">Days</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Active Service</div>
          </div>

          {/* Casual Leave Remaining */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Casual Leaves
            </div>
            <div className="text-xl font-black text-white font-mono mt-1">
              {casualRemaining} <span className="text-xs font-normal text-slate-400">/ {balance.casualAllocated}</span>
            </div>
            <div className="text-[10px] text-emerald-300 mt-0.5">{balance.casualUsed} Days Used</div>
          </div>

          {/* Sick Leave Remaining */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Sick Leaves
            </div>
            <div className="text-xl font-black text-white font-mono mt-1">
              {sickRemaining} <span className="text-xs font-normal text-slate-400">/ {balance.sickAllocated}</span>
            </div>
            <div className="text-[10px] text-blue-300 mt-0.5">{balance.sickUsed} Days Used</div>
          </div>

          {/* Earned / Paid Leave Remaining */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Earned Leaves
            </div>
            <div className="text-xl font-black text-white font-mono mt-1">
              {paidRemaining} <span className="text-xs font-normal text-slate-400">/ {balance.paidAllocated}</span>
            </div>
            <div className="text-[10px] text-purple-300 mt-0.5">{balance.paidUsed} Days Used</div>
          </div>
        </div>
      </div>

      {/* Month-End Salary & Payable Days Real-Time Calculation Card */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-4.5 rounded-3xl shadow-md border border-emerald-700/80 space-y-3">
        <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-300" />
            <h3 className="font-extrabold text-sm text-white">Month-End Salary & Working Days Calculation</h3>
          </div>
          <span className="text-[10px] bg-emerald-800/90 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold border border-emerald-600/50">
            Live Month Ledger
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-emerald-950/70 p-3 rounded-2xl border border-emerald-800/80">
            <span className="text-[10px] text-emerald-300 font-bold block">Current Month Total</span>
            <span className="text-base font-black font-mono text-white mt-0.5 block">
              {balance.currentMonthDays} Days
            </span>
            <span className="text-[10px] text-emerald-400">Total days in month</span>
          </div>

          <div className="bg-emerald-950/70 p-3 rounded-2xl border border-emerald-800/80">
            <span className="text-[10px] text-emerald-300 font-bold block">Days Worked (Up to Today)</span>
            <span className="text-base font-black font-mono text-emerald-200 mt-0.5 block">
              {balance.daysWorkedCount} Days
            </span>
            <span className="text-[10px] text-emerald-400">Logins & Field duty</span>
          </div>

          <div className="bg-emerald-950/70 p-3 rounded-2xl border border-emerald-800/80">
            <span className="text-[10px] text-emerald-300 font-bold block">Approved Paid Leaves</span>
            <span className="text-base font-black font-mono text-emerald-300 mt-0.5 block">
              + {balance.casualUsed + balance.sickUsed + balance.paidUsed} Days
            </span>
            <span className="text-[10px] text-emerald-400">Casual + Sick + Paid</span>
          </div>

          <div className="bg-emerald-950/70 p-3 rounded-2xl border border-emerald-800/80">
            <span className="text-[10px] text-emerald-300 font-bold block">Net Salary Payable Days</span>
            <span className="text-lg font-black font-mono text-amber-300 mt-0.5 block">
              {balance.netPayableDaysThisMonth} Days
            </span>
            <span className="text-[10px] text-amber-200 font-bold">Month-End Salary Days</span>
          </div>
        </div>

        {/* Non-paid and declined leave policy explanation banner */}
        <div className="bg-emerald-950/90 p-3 rounded-2xl border border-emerald-800/80 text-[11px] text-emerald-100 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
            <span>Management Leave & Salary Rules:</span>
          </div>
          <p className="text-[11px] text-emerald-200 leading-relaxed">
            • <strong>Declined Leave Rule:</strong> If an admin declines your leave application, <strong>0 days are deducted</strong> from your bucket. All days remain restored in your balance.
            <br />
            • <strong>Payable Days Formula:</strong> Total Payable Days = (Days Worked Up to Today) + (Approved Paid Leaves).
          </p>
        </div>
      </div>

      {/* Applied Leave History Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">My Leave Requests & Tracking</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total Approved: <strong className="text-emerald-700">{totalApprovedDays} Days</strong>
          </span>
        </div>

        {myRequests.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-1">
            <Calendar className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No leave applications submitted yet.</p>
            <button
              onClick={() => setShowApplyModal(true)}
              className="mt-2 text-xs text-blue-600 font-bold hover:underline"
            >
              + Apply for a new Leave
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {myRequests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{req.leaveType}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono text-[11px] text-blue-700 font-bold">
                      {req.startDate} to {req.endDate} ({req.totalDays} Days)
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
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

                <p className="text-slate-600 text-[11px] italic">"{req.reason}"</p>

                {req.reviewNotes && (
                  <div className="bg-white p-2 rounded-xl border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
                    <span>Manager Note: <strong>{req.reviewNotes}</strong></span>
                    <span className="text-[10px] text-slate-400">{req.reviewedBy}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Apply for Leave</h3>
                  <p className="text-xs text-slate-500">Submit leave request for approval</p>
                </div>
              </div>

              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Leave Category *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="Casual Leave">Casual Leave (Remaining: {casualRemaining})</option>
                  <option value="Sick Leave">Sick Leave (Remaining: {sickRemaining})</option>
                  <option value="Paid Leave">Paid / Earned Leave (Remaining: {paidRemaining})</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">From Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">To Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Reason for Leave *</label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you are taking leave (e.g. personal work, medical fever, family event)..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Leave Request
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
