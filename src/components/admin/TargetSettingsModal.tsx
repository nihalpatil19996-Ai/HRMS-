import React, { useState } from 'react';
import {
  Target,
  X,
  CheckCircle2,
  Users,
  TrendingUp,
  Sliders,
  Sparkles,
  Zap,
  PhoneCall,
  Save,
  Check,
  Search,
} from 'lucide-react';
import { Employee, CallLog } from '../../types/crm';
import { StorageService } from '../../services/storage';

interface TargetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  callLogs?: CallLog[];
  onRefresh: () => void;
  initialSelectedEmpId?: string;
}

export const TargetSettingsModal: React.FC<TargetSettingsModalProps> = ({
  isOpen,
  onClose,
  employees,
  callLogs = [],
  onRefresh,
  initialSelectedEmpId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  
  // Local target edits map: { empId: { daily: number, monthly: number } }
  const [targetsMap, setTargetsMap] = useState<Record<string, { daily: number; monthly: number }>>(() => {
    const map: Record<string, { daily: number; monthly: number }> = {};
    employees.forEach((emp) => {
      map[emp.id] = {
        daily: emp.dailyTarget || 40,
        monthly: emp.monthlyTarget || (emp.dailyTarget || 40) * 24,
      };
    });
    return map;
  });

  // Bulk setting state
  const [bulkDailyTarget, setBulkDailyTarget] = useState<number>(50);
  const [bulkRole, setBulkRole] = useState<string>('Sales Executive');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateEmpDaily = (id: string, value: number) => {
    const safeVal = Math.max(1, Math.min(300, value || 0));
    setTargetsMap((prev) => ({
      ...prev,
      [id]: {
        daily: safeVal,
        monthly: (prev[id]?.monthly) || (safeVal * 24),
      },
    }));
  };

  const handleUpdateEmpMonthly = (id: string, value: number) => {
    const safeVal = Math.max(1, Math.min(10000, value || 0));
    setTargetsMap((prev) => ({
      ...prev,
      [id]: {
        daily: prev[id]?.daily || 40,
        monthly: safeVal,
      },
    }));
  };

  const handleSaveIndividual = (emp: Employee) => {
    const t = targetsMap[emp.id] || { daily: 40, monthly: 960 };
    StorageService.setEmployeeTarget(emp.id, t.daily, t.monthly);
    onRefresh();
    setSavedSuccessMessage(`Updated call target for ${emp.name} to ${t.daily} calls/day.`);
    setTimeout(() => setSavedSuccessMessage(null), 3000);
  };

  const handleApplyBulk = () => {
    if (bulkDailyTarget <= 0) {
      alert('Please enter a valid daily target number.');
      return;
    }
    const count = employees.filter((e) => bulkRole === 'ALL' || e.role === bulkRole).length;
    if (confirm(`Apply ${bulkDailyTarget} calls/day target to all ${count} ${bulkRole === 'ALL' ? 'employees' : bulkRole + 's'}?`)) {
      StorageService.setBulkEmployeeTargets(bulkDailyTarget, bulkRole, bulkDailyTarget * 24);
      
      // Update local state map
      setTargetsMap((prev) => {
        const next = { ...prev };
        employees.forEach((emp) => {
          if (bulkRole === 'ALL' || emp.role === bulkRole) {
            next[emp.id] = {
              daily: bulkDailyTarget,
              monthly: bulkDailyTarget * 24,
            };
          }
        });
        return next;
      });

      onRefresh();
      setSavedSuccessMessage(`Applied ${bulkDailyTarget} calls/day to ${count} agents successfully!`);
      setTimeout(() => setSavedSuccessMessage(null), 3500);
    }
  };

  const handleSaveAllChanges = () => {
    Object.keys(targetsMap).forEach((empId) => {
      const t = targetsMap[empId];
      if (t) {
        StorageService.setEmployeeTarget(empId, t.daily, t.monthly);
      }
    });
    onRefresh();
    setSavedSuccessMessage('All agent call targets saved successfully!');
    setTimeout(() => {
      setSavedSuccessMessage(null);
      onClose();
    }, 1200);
  };

  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.mobile.includes(searchTerm);
    const matchRole = roleFilter === 'ALL' || e.role === roleFilter;
    return matchSearch && matchRole;
  });

  const presetValues = [30, 40, 50, 60, 75, 100];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-slate-900 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl shadow-md shadow-indigo-600/30">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                Agent Calling Target Settings
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                  Admin Control
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set individual or bulk daily call targets for field sales agents. Agents will see their live targets & remaining calls on their mobile app.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Toast */}
        {savedSuccessMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedSuccessMessage}</span>
          </div>
        )}

        {/* Bulk Target Setter Panel */}
        <div className="mt-4 p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Bulk Quick Target Setter</span>
            </div>
            <span className="text-[11px] text-slate-300">Apply to multiple agents at once</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">Apply To:</span>
              <select
                value={bulkRole}
                onChange={(e) => setBulkRole(e.target.value)}
                className="bg-slate-800 text-white border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="Sales Executive">Sales Executives Only</option>
                <option value="Team Leader">Team Leaders Only</option>
                <option value="ALL">All Employees (Entire Team)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-medium">Daily Target:</span>
              <input
                type="number"
                min="10"
                max="300"
                value={bulkDailyTarget}
                onChange={(e) => setBulkDailyTarget(Number(e.target.value))}
                className="w-20 bg-slate-800 text-amber-300 font-bold border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 text-center"
              />
              <span className="text-slate-400 font-mono text-[11px]">calls/day</span>
            </div>

            {/* Quick preset chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[30, 40, 50, 75, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBulkDailyTarget(val)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                    bulkDailyTarget === val
                      ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            <button
              onClick={handleApplyBulk}
              className="ml-auto px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Apply Target
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase">Role:</span>
            {['ALL', 'Sales Executive', 'Team Leader', 'Branch Manager'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  roleFilter === role
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {role === 'ALL' ? 'All Roles' : role}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search agent name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Agent Targets List Table */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          <div className="space-y-2">
            {filteredEmployees.map((emp) => {
              const currentT = targetsMap[emp.id] || { daily: emp.dailyTarget || 40, monthly: (emp.dailyTarget || 40) * 24 };
              const agentLogs = callLogs.filter((c) => c.employeeId === emp.id);
              const callsMadeToday = agentLogs.length;
              const remainingCalls = Math.max(0, currentT.daily - callsMadeToday);
              const progressPct = Math.min(100, Math.round((callsMadeToday / currentT.daily) * 100));

              return (
                <div
                  key={emp.id}
                  className={`bg-white border rounded-2xl p-4 shadow-xs hover:border-indigo-300 transition-all space-y-3 ${
                    initialSelectedEmpId === emp.id ? 'border-2 border-indigo-600 bg-indigo-50/20 shadow-md' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Agent Info */}
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                        alt={emp.name}
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-xs"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{emp.name}</h4>
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            {emp.id}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {emp.role}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>📞 {emp.mobile}</span>
                          <span>•</span>
                          <span className={emp.status === 'On Duty' ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
                            Status: {emp.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Today Calling Summary Metrics */}
                    <div className="flex items-center gap-2 sm:gap-4 bg-slate-50 border border-slate-100 px-3.5 py-2 rounded-xl text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Calls Today</div>
                        <div className="font-black text-slate-900 text-sm">{callsMadeToday}</div>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Remaining</div>
                        <div className={`font-black text-sm ${remainingCalls === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {remainingCalls}
                        </div>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Achievement</div>
                        <div className="font-bold text-indigo-700 text-xs">{progressPct}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Target Controls Row */}
                  <div className="bg-slate-50/80 border border-slate-200/80 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    
                    {/* Daily Target Setting */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-slate-800 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-indigo-600" />
                        Daily Call Target:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateEmpDaily(emp.id, currentT.daily - 5)}
                          className="w-7 h-7 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          -5
                        </button>
                        <input
                          type="number"
                          min="5"
                          max="300"
                          value={currentT.daily}
                          onChange={(e) => handleUpdateEmpDaily(emp.id, Number(e.target.value))}
                          className="w-16 text-center font-black text-indigo-900 bg-white border border-indigo-300 rounded-lg py-1 text-xs focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateEmpDaily(emp.id, currentT.daily + 5)}
                          className="w-7 h-7 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                        >
                          +5
                        </button>
                        <span className="text-slate-500 font-medium ml-1">calls/day</span>
                      </div>

                      {/* Quick chips */}
                      <div className="flex items-center gap-1 ml-1">
                        {[30, 40, 50, 75, 100].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleUpdateEmpDaily(emp.id, num)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                              currentT.daily === num
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Target Setting */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600">Monthly:</span>
                      <input
                        type="number"
                        min="50"
                        max="10000"
                        value={currentT.monthly}
                        onChange={(e) => handleUpdateEmpMonthly(emp.id, Number(e.target.value))}
                        className="w-20 text-center font-bold text-slate-800 bg-white border border-slate-200 rounded-lg py-1 text-xs"
                      />
                      <span className="text-slate-400 font-medium">calls/mo</span>
                    </div>

                    {/* Save Button for this employee */}
                    <button
                      type="button"
                      onClick={() => handleSaveIndividual(emp)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Target
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Total {filteredEmployees.length} agents displayed • Targets update live on mobile apps
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-xs cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSaveAllChanges}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              Save All Targets
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
