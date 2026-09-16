import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Key, ShieldCheck, Search, CheckCircle, XCircle, Copy, Wand2, Target, Sliders, Sparkles } from 'lucide-react';
import { Employee, EmployeeRole } from '../../types/crm';
import { StorageService } from '../../services/storage';
import { BreakTimer } from '../common/BreakTimer';
import { TargetSettingsModal } from './TargetSettingsModal';

interface EmployeeManagerProps {
  employees: Employee[];
  onRefresh: () => void;
  onSelectAgent?: (emp: Employee) => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, onRefresh, onSelectAgent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Target Settings Modal state
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [selectedTargetEmpId, setSelectedTargetEmpId] = useState<string | undefined>(undefined);

  // Form State
  const [formCustomId, setFormCustomId] = useState('');
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<EmployeeRole>('Sales Executive');
  const [formManagerId, setFormManagerId] = useState('');
  const [formTarget, setFormTarget] = useState(40);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const generateNewId = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    setFormCustomId(`EMP-${randomNum}`);
  };

  const resetForm = () => {
    setFormCustomId('');
    setFormName('');
    setFormMobile('');
    setFormEmail('');
    setFormRole('Sales Executive');
    setFormManagerId('');
    setFormTarget(40);
    setEditingEmp(null);
    setShowAddModal(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    generateNewId();
    setShowAddModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setFormCustomId(emp.id);
    setFormName(emp.name);
    setFormMobile(emp.mobile);
    setFormEmail(emp.email);
    setFormRole(emp.role);
    setFormManagerId(emp.managerId || '');
    setFormTarget(emp.dailyTarget);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formMobile) {
      alert('Please enter Employee Name and Mobile Number.');
      return;
    }

    const managerObj = employees.find((e) => e.id === formManagerId);

    if (editingEmp) {
      StorageService.updateEmployee(editingEmp.id, {
        id: formCustomId.trim() || editingEmp.id,
        name: formName,
        mobile: formMobile,
        email: formEmail,
        role: formRole,
        managerId: formManagerId || undefined,
        managerName: managerObj ? managerObj.name : undefined,
        dailyTarget: formTarget,
      });
    } else {
      StorageService.addEmployee({
        id: formCustomId.trim(),
        name: formName,
        mobile: formMobile,
        email: formEmail,
        role: formRole,
        managerId: formManagerId || undefined,
        managerName: managerObj ? managerObj.name : undefined,
        status: 'Offline',
        dailyTarget: formTarget,
        avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&q=80&w=150`,
      });
    }

    onRefresh();
    resetForm();
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete employee record for ${name}?`)) {
      StorageService.deleteEmployee(id);
      onRefresh();
    }
  };

  const handleResetPassword = (name: string) => {
    alert(`Temporary password reset link sent to ${name}'s email / SMS! Password set to 'Sales123#'`);
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.mobile.includes(searchTerm) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employee & Agent Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add sales agents, assign branch managers, configure call targets, and reset access passwords
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-64"
            />
          </div>

          <button
            onClick={() => {
              setSelectedTargetEmpId(undefined);
              setShowTargetModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Target className="w-4 h-4 text-amber-300" />
            Set Agent Targets
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Manager</th>
                <th className="py-3 px-4">Target / Day</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                        alt={emp.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectAgent?.(emp)}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left flex items-center gap-1.5 group"
                        >
                          <span>{emp.name}</span>
                          <span className="text-[10px] text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            (View Work)
                          </span>
                        </button>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            ID: {emp.id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyId(emp.id)}
                            className="p-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Copy Employee ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedId === emp.id && <span className="text-[9px] text-emerald-600 font-bold">Copied!</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{emp.mobile}</div>
                    <div className="text-[11px] text-slate-400">{emp.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {emp.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {emp.managerName || '— Top Management —'}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTargetEmpId(emp.id);
                        setShowTargetModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 font-extrabold text-xs transition-colors cursor-pointer group"
                      title="Click to adjust agent daily call target"
                    >
                      <Target className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                      <span>{emp.dailyTarget} calls</span>
                      <Edit2 className="w-2.5 h-2.5 text-indigo-400 opacity-60 ml-0.5" />
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    {emp.status === 'On Duty' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        On Duty
                      </span>
                    )}
                    {emp.status === 'On Break' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        On {emp.currentBreak} Break • <BreakTimer startTime={emp.currentBreakStart} className="text-amber-900 font-bold ml-1" />
                      </span>
                    )}
                    {emp.status === 'Offline' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Offline
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1">
                    <button
                      onClick={() => {
                        setSelectedTargetEmpId(emp.id);
                        setShowTargetModal(true);
                      }}
                      title="Set Call Targets"
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Target className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleResetPassword(emp.name)}
                      title="Reset Password"
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(emp)}
                      title="Edit Employee"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id, emp.name)}
                      title="Delete Employee"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Employee */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingEmp ? 'Edit Employee Details' : 'Add New Field Agent'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 font-semibold">Employee Unique ID *</label>
                  <button
                    type="button"
                    onClick={generateNewId}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <Wand2 className="w-3 h-3" />
                    Auto-Generate ID
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-101, AGT-204, SALES-09"
                  value={formCustomId}
                  onChange={(e) => setFormCustomId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Agents can use this exact Employee ID to log in on the mobile app.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 00000"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="agent@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Role Designation</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as EmployeeRole)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="Sales Executive">Sales Executive</option>
                    <option value="Team Leader">Team Leader</option>
                    <option value="Branch Manager">Branch Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Daily Call Target</label>
                  <input
                    type="number"
                    min="10"
                    max="200"
                    value={formTarget}
                    onChange={(e) => setFormTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assign Reporting Manager</label>
                <select
                  value={formManagerId}
                  onChange={(e) => setFormManagerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="">None (Top Level)</option>
                  {employees
                    .filter((e) => e.id !== editingEmp?.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-sm"
                >
                  {editingEmp ? 'Save Changes' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Settings Modal */}
      {showTargetModal && (
        <TargetSettingsModal
          isOpen={showTargetModal}
          onClose={() => setShowTargetModal(false)}
          employees={employees}
          callLogs={StorageService.getCallLogs()}
          onRefresh={onRefresh}
          initialSelectedEmpId={selectedTargetEmpId}
        />
      )}

    </div>
  );
};
