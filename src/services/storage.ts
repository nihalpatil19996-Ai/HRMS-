import { Employee, Lead, AttendanceRecord, BreakRecord, DistributedFile, CallLog, SystemStats, BreakType, CallStatus, LeaveRequest, LeaveBalance, LeaveType, CallQueue } from '../types/crm';
import { INITIAL_EMPLOYEES, INITIAL_LEADS, INITIAL_ATTENDANCE, INITIAL_BREAKS, INITIAL_FILES, INITIAL_CALL_LOGS, INITIAL_LEAVE_REQUESTS, INITIAL_QUEUES } from '../data/initialData';

const KEYS = {
  EMPLOYEES: 'field_crm_employees_v1',
  LEADS: 'field_crm_leads_v1',
  ATTENDANCE: 'field_crm_attendance_v1',
  BREAKS: 'field_crm_breaks_v1',
  FILES: 'field_crm_files_v1',
  CALL_LOGS: 'field_crm_call_logs_v1',
  LEAVES: 'field_crm_leaves_v1',
  QUEUES: 'field_crm_queues_v1',
  ACTIVE_EMP: 'field_crm_active_emp_id',
};

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeStorage = (callback: Listener) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const notify = () => {
  listeners.forEach((cb) => cb());
};

// Cloud Sync Engine variables
let localLastUpdated = '';
let isSyncing = false;
let isCloudConnected = true;
let syncTimeout: any = null;

export interface SyncStatus {
  connected: boolean;
  lastSynced: string;
  isSyncing: boolean;
}

const syncStatusListeners: Set<(status: SyncStatus) => void> = new Set();

export const subscribeSyncStatus = (cb: (status: SyncStatus) => void) => {
  syncStatusListeners.add(cb);
  cb({ connected: isCloudConnected, lastSynced: localLastUpdated, isSyncing });
  return () => syncStatusListeners.delete(cb);
};

const notifySyncStatus = () => {
  syncStatusListeners.forEach((cb) =>
    cb({ connected: isCloudConnected, lastSynced: localLastUpdated, isSyncing })
  );
};

// Helper
function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notify();
    schedulePushToServer();
  } catch (err) {
    console.error('Storage set error:', err);
  }
}

// Push local state to central server
function schedulePushToServer() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      isSyncing = true;
      notifySyncStatus();

      const payload = {
        employees: getItem(KEYS.EMPLOYEES, INITIAL_EMPLOYEES),
        leads: getItem(KEYS.LEADS, INITIAL_LEADS),
        attendance: getItem(KEYS.ATTENDANCE, INITIAL_ATTENDANCE),
        breaks: getItem(KEYS.BREAKS, INITIAL_BREAKS),
        files: getItem(KEYS.FILES, INITIAL_FILES),
        callLogs: getItem(KEYS.CALL_LOGS, INITIAL_CALL_LOGS),
        leaves: getItem(KEYS.LEAVES, INITIAL_LEAVE_REQUESTS),
        queues: getItem(KEYS.QUEUES, INITIAL_QUEUES),
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        localLastUpdated = data.lastUpdated || new Date().toISOString();
        isCloudConnected = true;
      }
    } catch (err) {
      console.warn('[Sync] Offline or server unreachable, changes preserved locally');
      isCloudConnected = false;
    } finally {
      isSyncing = false;
      notifySyncStatus();
    }
  }, 350);
}

// Pull latest changes from server
async function pullServerSync(force = false) {
  if (isSyncing) return;
  try {
    const res = await fetch('/api/sync');
    if (!res.ok) {
      isCloudConnected = false;
      notifySyncStatus();
      return;
    }

    const serverData = await res.json();
    isCloudConnected = true;

    // If server has never been initialized, seed it from local storage
    if (!serverData.employees || serverData.employees.length === 0) {
      schedulePushToServer();
      return;
    }

    // Check if server is newer or force reload
    if (force || (serverData.lastUpdated && serverData.lastUpdated !== localLastUpdated)) {
      if (serverData.employees) localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(serverData.employees));
      if (serverData.leads) localStorage.setItem(KEYS.LEADS, JSON.stringify(serverData.leads));
      if (serverData.attendance) localStorage.setItem(KEYS.ATTENDANCE, JSON.stringify(serverData.attendance));
      if (serverData.breaks) localStorage.setItem(KEYS.BREAKS, JSON.stringify(serverData.breaks));
      if (serverData.files) localStorage.setItem(KEYS.FILES, JSON.stringify(serverData.files));
      if (serverData.callLogs) localStorage.setItem(KEYS.CALL_LOGS, JSON.stringify(serverData.callLogs));
      if (serverData.leaves) localStorage.setItem(KEYS.LEAVES, JSON.stringify(serverData.leaves));
      if (serverData.queues) localStorage.setItem(KEYS.QUEUES, JSON.stringify(serverData.queues));

      localLastUpdated = serverData.lastUpdated;
      notify();
    }
  } catch (err) {
    isCloudConnected = false;
  } finally {
    notifySyncStatus();
  }
}

// Start background sync poll
let pollInterval: any = null;
export function startCloudSync() {
  pullServerSync();

  if (!pollInterval) {
    pollInterval = setInterval(() => {
      pullServerSync();
    }, 3000);
  }

  // Also sync when browser tab gains focus
  window.addEventListener('focus', () => {
    pullServerSync();
  });
}


export const StorageService = {
  // Employees
  getEmployees(): Employee[] {
    return getItem(KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  },
  saveEmployees(emps: Employee[]) {
    setItem(KEYS.EMPLOYEES, emps);
  },
  addEmployee(emp: Partial<Employee> & { name: string; mobile: string }): Employee {
    const emps = this.getEmployees();
    const customId = emp.id?.trim();
    const finalId = customId ? customId : `EMP-${Math.floor(100 + Math.random() * 900)}`;
    
    // Check if ID already exists
    const existingIndex = emps.findIndex((e) => e.id.toLowerCase() === finalId.toLowerCase());
    let uniqueId = finalId;
    if (existingIndex !== -1 && !customId) {
      uniqueId = `EMP-${Date.now().toString().slice(-4)}`;
    }

    const newEmp: Employee = {
      id: uniqueId,
      name: emp.name,
      mobile: emp.mobile,
      email: emp.email || '',
      role: emp.role || 'Sales Executive',
      managerId: emp.managerId,
      managerName: emp.managerName,
      status: emp.status || 'Offline',
      dailyTarget: emp.dailyTarget || 40,
      avatarUrl: emp.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150`,
    };
    this.saveEmployees([...emps, newEmp]);
    return newEmp;
  },
  updateEmployee(id: string, updates: Partial<Employee>) {
    const emps = this.getEmployees();
    const idx = emps.findIndex((e) => e.id === id);
    if (idx !== -1) {
      const oldEmp = emps[idx];
      const newId = updates.id ? updates.id.trim() : oldEmp.id;
      
      emps[idx] = { ...oldEmp, ...updates, id: newId };
      this.saveEmployees(emps);

      // If active employee ID was changed, update active employee setting
      if (this.getActiveEmployeeId() === id && newId !== id) {
        this.setActiveEmployeeId(newId);
      }
    }
  },
  setEmployeeTarget(id: string, dailyTarget: number, monthlyTarget?: number, talkTimeTargetMinutes?: number) {
    const updates: Partial<Employee> = { dailyTarget };
    if (monthlyTarget !== undefined) updates.monthlyTarget = monthlyTarget;
    if (talkTimeTargetMinutes !== undefined) updates.talkTimeTargetMinutes = talkTimeTargetMinutes;
    this.updateEmployee(id, updates);
  },
  setBulkEmployeeTargets(dailyTarget: number, roleFilter?: string, monthlyTarget?: number) {
    const emps = this.getEmployees();
    const updated = emps.map((emp) => {
      if (!roleFilter || roleFilter === 'ALL' || emp.role === roleFilter) {
        return {
          ...emp,
          dailyTarget,
          ...(monthlyTarget !== undefined ? { monthlyTarget } : {}),
        };
      }
      return emp;
    });
    this.saveEmployees(updated);
  },
  deleteEmployee(id: string) {
    const emps = this.getEmployees().filter((e) => e.id !== id);
    this.saveEmployees(emps);
  },

  // Active Mobile Employee
  getActiveEmployeeId(): string {
    return getItem(KEYS.ACTIVE_EMP, 'emp-101');
  },
  setActiveEmployeeId(id: string) {
    setItem(KEYS.ACTIVE_EMP, id);
  },

  // Leads
  getLeads(): Lead[] {
    return getItem(KEYS.LEADS, INITIAL_LEADS);
  },
  saveLeads(leads: Lead[]) {
    setItem(KEYS.LEADS, leads);
  },
  addLead(lead: Omit<Lead, 'id' | 'createdAt'>): Lead {
    const leads = this.getLeads();
    const newLead: Lead = {
      ...lead,
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.saveLeads([newLead, ...leads]);
    return newLead;
  },
  batchImportLeads(imported: Array<Omit<Lead, 'id' | 'createdAt'>>) {
    const leads = this.getLeads();
    const formatted: Lead[] = imported.map((item, index) => ({
      ...item,
      id: `lead-${Date.now()}-${index}`,
      createdAt: new Date().toISOString(),
    }));
    this.saveLeads([...formatted, ...leads]);
  },
  assignLeads(leadIds: string[], employeeId: string, employeeName: string) {
    const leads = this.getLeads();
    const updated = leads.map((lead) => {
      if (leadIds.includes(lead.id)) {
        return {
          ...lead,
          assignedTo: employeeId,
          assignedToName: employeeName,
        };
      }
      return lead;
    });
    this.saveLeads(updated);
  },
  updateLeadStatus(leadId: string, status: CallStatus, remarks?: string, nextFollowup?: string, meetingTime?: string, dealValue?: number) {
    const leads = this.getLeads();
    const idx = leads.findIndex((l) => l.id === leadId);
    if (idx !== -1) {
      leads[idx] = {
        ...leads[idx],
        status,
        remarks: remarks !== undefined ? remarks : leads[idx].remarks,
        nextFollowup: nextFollowup !== undefined ? nextFollowup : leads[idx].nextFollowup,
        meetingTime: meetingTime !== undefined ? meetingTime : leads[idx].meetingTime,
        dealValue: dealValue !== undefined ? dealValue : leads[idx].dealValue,
        lastCalledAt: new Date().toISOString(),
      };
      this.saveLeads(leads);
    }
  },

  // Call Logs
  getCallLogs(): CallLog[] {
    return getItem(KEYS.CALL_LOGS, INITIAL_CALL_LOGS);
  },
  addCallLog(log: Omit<CallLog, 'id'>): CallLog {
    const logs = this.getCallLogs();
    const newLog: CallLog = {
      ...log,
      id: `call-${Date.now()}`,
    };
    setItem(KEYS.CALL_LOGS, [newLog, ...logs]);
    return newLog;
  },

  // Attendance
  getAttendance(): AttendanceRecord[] {
    return getItem(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
  },
  punchIn(employeeId: string, employeeName: string): AttendanceRecord {
    const records = this.getAttendance();
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    // Check if already punched in today
    const existing = records.find((r) => r.employeeId === employeeId && r.date === today);
    if (existing) {
      return existing;
    }

    const isLate = new Date().getHours() >= 9 && new Date().getMinutes() > 15;
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId,
      employeeName,
      date: today,
      loginTime: nowTime,
      workingHours: '0h 0m',
      status: isLate ? 'Late' : 'On Time',
    };

    setItem(KEYS.ATTENDANCE, [newRecord, ...records]);
    this.updateEmployee(employeeId, { status: 'On Duty' });
    return newRecord;
  },
  punchOut(employeeId: string) {
    const records = this.getAttendance();
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    const idx = records.findIndex((r) => r.employeeId === employeeId && r.date === today);
    if (idx !== -1) {
      records[idx].logoutTime = nowTime;
      // Calculate hours
      records[idx].workingHours = '7h 45m';
      setItem(KEYS.ATTENDANCE, records);
    }
    this.updateEmployee(employeeId, { status: 'Offline', currentBreak: undefined });
  },

  // Breaks
  getBreaks(): BreakRecord[] {
    return getItem(KEYS.BREAKS, INITIAL_BREAKS);
  },
  startBreak(employeeId: string, employeeName: string, breakType: BreakType): BreakRecord {
    const breaks = this.getBreaks();
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    const newBreak: BreakRecord = {
      id: `brk-${Date.now()}`,
      employeeId,
      employeeName,
      breakType,
      startTime: nowTime,
      date: today,
    };

    setItem(KEYS.BREAKS, [newBreak, ...breaks]);
    this.updateEmployee(employeeId, {
      status: 'On Break',
      currentBreak: breakType,
      currentBreakStart: new Date().toISOString(),
    });
    return newBreak;
  },
  endBreak(employeeId: string) {
    const breaks = this.getBreaks();
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    const idx = breaks.findIndex((b) => b.employeeId === employeeId && !b.endTime && b.date === today);
    if (idx !== -1) {
      breaks[idx].endTime = nowTime;
      breaks[idx].durationMinutes = 20; // Simulated duration or calculate
      setItem(KEYS.BREAKS, breaks);
    }
    this.updateEmployee(employeeId, {
      status: 'On Duty',
      currentBreak: undefined,
      currentBreakStart: undefined,
    });
  },

  // Files
  getFiles(): DistributedFile[] {
    return getItem(KEYS.FILES, INITIAL_FILES);
  },
  addFile(file: Omit<DistributedFile, 'id' | 'uploadedDate'>): DistributedFile {
    const files = this.getFiles();
    const today = new Date().toISOString().split('T')[0];
    const newFile: DistributedFile = {
      ...file,
      id: `file-${Date.now()}`,
      uploadedDate: today,
    };
    setItem(KEYS.FILES, [newFile, ...files]);
    return newFile;
  },
  deleteFile(id: string) {
    const files = this.getFiles().filter((f) => f.id !== id);
    setItem(KEYS.FILES, files);
  },

  // Reset to initial sample data
  async resetAllData() {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch {}
    localStorage.removeItem(KEYS.EMPLOYEES);
    localStorage.removeItem(KEYS.LEADS);
    localStorage.removeItem(KEYS.ATTENDANCE);
    localStorage.removeItem(KEYS.BREAKS);
    localStorage.removeItem(KEYS.FILES);
    localStorage.removeItem(KEYS.CALL_LOGS);
    localStorage.removeItem(KEYS.LEAVES);
    localStorage.removeItem(KEYS.QUEUES);
    localStorage.removeItem(KEYS.ACTIVE_EMP);
    notify();
    schedulePushToServer();
  },

  // Calculate System Stats
  getStats(): SystemStats {
    const emps = this.getEmployees();
    const leads = this.getLeads();
    const calls = this.getCallLogs();
    const breaks = this.getBreaks();

    const today = new Date().toISOString().split('T')[0];
    const todayCalls = calls.filter((c) => c.callStart.startsWith(today)).length;
    const salesDone = leads.filter((l) => l.status === 'Converted').length;
    const pendingLeads = leads.filter((l) => l.status === 'Pending').length;

    const onlineEmployees = emps.filter((e) => e.status === 'On Duty' || e.status === 'On Break').length;
    const activeCalls = emps.filter((e) => e.status === 'On Duty').length > 0 ? 1 : 0;

    const totalBreakTimeMinutes = breaks.reduce((sum, b) => sum + (b.durationMinutes || 15), 0);

    return {
      onlineEmployees,
      activeCalls,
      todayCalls,
      salesDone,
      pendingLeads,
      totalBreakTimeMinutes,
    };
  },

  // Leave Management Methods
  getLeaveRequests(): LeaveRequest[] {
    return getItem(KEYS.LEAVES, INITIAL_LEAVE_REQUESTS);
  },

  saveLeaveRequests(requests: LeaveRequest[]) {
    setItem(KEYS.LEAVES, requests);
  },

  applyLeave(
    employeeId: string,
    employeeName: string,
    leaveType: LeaveType,
    startDate: string,
    endDate: string,
    reason: string
  ): LeaveRequest {
    const requests = this.getLeaveRequests();

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const newRequest: LeaveRequest = {
      id: `leave-${Date.now().toString().slice(-5)}`,
      employeeId,
      employeeName,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      status: 'Pending',
      appliedOn: new Date().toISOString(),
    };

    this.saveLeaveRequests([newRequest, ...requests]);
    return newRequest;
  },

  updateLeaveStatus(
    leaveId: string,
    status: 'Approved' | 'Rejected',
    reviewedBy: string = 'Admin',
    reviewNotes?: string
  ) {
    const requests = this.getLeaveRequests();
    const idx = requests.findIndex((r) => r.id === leaveId);
    if (idx !== -1) {
      requests[idx] = {
        ...requests[idx],
        status,
        reviewedBy,
        reviewNotes: reviewNotes || (status === 'Approved' ? 'Leave request approved' : 'Leave request rejected'),
      };
      this.saveLeaveRequests(requests);
    }
  },

  getEmployeeLeaveBalance(employeeId: string): LeaveBalance {
    const allUserRequests = this.getLeaveRequests().filter((r) => r.employeeId === employeeId);
    
    // ONLY Approved leave requests deduct from leave balances
    const approvedRequests = allUserRequests.filter((r) => r.status === 'Approved');
    const pendingRequests = allUserRequests.filter((r) => r.status === 'Pending');
    const rejectedRequests = allUserRequests.filter((r) => r.status === 'Rejected');

    // Calculate used days by type for APPROVED requests ONLY
    const casualUsed = approvedRequests
      .filter((r) => r.leaveType === 'Casual Leave')
      .reduce((sum, r) => sum + r.totalDays, 0);

    const sickUsed = approvedRequests
      .filter((r) => r.leaveType === 'Sick Leave')
      .reduce((sum, r) => sum + r.totalDays, 0);

    const paidUsed = approvedRequests
      .filter((r) => r.leaveType === 'Paid Leave' || r.leaveType === 'Earned Leave')
      .reduce((sum, r) => sum + r.totalDays, 0);

    const unpaidUsed = approvedRequests
      .filter((r) => r.leaveType === 'Unpaid Leave')
      .reduce((sum, r) => sum + r.totalDays, 0);

    const pendingDaysCount = pendingRequests.reduce((sum, r) => sum + r.totalDays, 0);
    const rejectedDaysCount = rejectedRequests.reduce((sum, r) => sum + r.totalDays, 0);

    // Default yearly quota allocation
    const casualAllocated = 8;
    const sickAllocated = 6;
    const paidAllocated = 12;
    const totalQuota = casualAllocated + sickAllocated + paidAllocated;

    // Attendance records
    const attendance = this.getAttendance().filter((a) => a.employeeId === employeeId);
    
    // Total days worked (simulated baseline 22 days worked in current period + logged attendance sessions)
    const daysWorkedCount = Math.max(22 + attendance.length, attendance.length);

    // Total Paid Days = Days Worked + Approved Paid/Casual/Sick Leaves
    const approvedPaidLeaveDays = casualUsed + sickUsed + paidUsed;
    const totalPaidDaysCount = daysWorkedCount + approvedPaidLeaveDays;

    // Total Non-Paid / Loss of Pay Days
    const totalNonPaidDaysCount = unpaidUsed;

    // Current Month Days calculation (e.g., August = 31 days)
    const now = new Date();
    const currentMonthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // Month-End Net Payable Days (capped to current month days or calculated prorated)
    const netPayableDaysThisMonth = Math.min(
      currentMonthDays,
      Math.max(1, (daysWorkedCount % currentMonthDays) + approvedPaidLeaveDays)
    );

    return {
      employeeId,
      totalQuota,
      casualAllocated,
      casualUsed,
      sickAllocated,
      sickUsed,
      paidAllocated,
      paidUsed,
      unpaidUsed,
      pendingDaysCount,
      rejectedDaysCount,
      rejectedRequestsCount: rejectedRequests.length,
      daysWorkedCount,
      totalPaidDaysCount,
      totalNonPaidDaysCount,
      currentMonthDays,
      netPayableDaysThisMonth,
    };
  },

  // Call Queues (Campaigns)
  getCallQueues(): CallQueue[] {
    return getItem(KEYS.QUEUES, INITIAL_QUEUES);
  },
  saveCallQueues(queues: CallQueue[]) {
    setItem(KEYS.QUEUES, queues);
  },
  createCallQueue(params: {
    name: string;
    description?: string;
    assignedTo: string;
    assignedToName?: string;
    fileName?: string;
    leadsList: Array<Omit<Lead, 'id' | 'createdAt'>>;
  }): CallQueue {
    const queueId = `queue-${Date.now()}`;
    const queues = this.getCallQueues();

    const formattedLeads: Omit<Lead, 'id' | 'createdAt'>[] = params.leadsList.map((lead) => ({
      ...lead,
      queueId,
      queueName: params.name,
      sourceFile: params.fileName || lead.sourceFile,
      assignedTo: params.assignedTo === 'ALL' ? (lead.assignedTo || '') : params.assignedTo,
      assignedToName: params.assignedTo === 'ALL' ? (lead.assignedToName || 'All Agents') : (params.assignedToName || 'Assigned Agent'),
      status: lead.status || 'Pending',
    }));

    this.batchImportLeads(formattedLeads);

    const newQueue: CallQueue = {
      id: queueId,
      name: params.name,
      description: params.description || '',
      assignedTo: params.assignedTo,
      assignedToName: params.assignedTo === 'ALL' ? 'All Agents' : (params.assignedToName || 'Assigned Agent'),
      createdAt: new Date().toISOString(),
      totalLeads: params.leadsList.length,
      completedLeads: 0,
      fileName: params.fileName,
      status: 'Active',
    };

    this.saveCallQueues([newQueue, ...queues]);
    return newQueue;
  },
  deleteCallQueue(queueId: string) {
    const queues = this.getCallQueues().filter((q) => q.id !== queueId);
    this.saveCallQueues(queues);
  },
  getQueuesForAgent(employeeId: string): CallQueue[] {
    const queues = this.getCallQueues();
    const leads = this.getLeads();

    return queues.map((q) => {
      const queueLeads = leads.filter(
        (l) => (l.queueId === q.id || l.queueName === q.name || l.sourceFile === q.fileName) &&
               (q.assignedTo === 'ALL' || l.assignedTo === employeeId || q.assignedTo === employeeId)
      );
      const total = queueLeads.length > 0 ? queueLeads.length : q.totalLeads;
      const completed = queueLeads.filter((l) => l.status !== 'Pending').length;

      return {
        ...q,
        totalLeads: total,
        completedLeads: completed,
      };
    }).filter((q) => q.assignedTo === 'ALL' || q.assignedTo === employeeId || leads.some((l) => (l.queueId === q.id || l.queueName === q.name || l.sourceFile === q.fileName) && (l.assignedTo === employeeId || !l.assignedTo)));
  },
  async forceSync(): Promise<boolean> {
    await pullServerSync(true);
    schedulePushToServer();
    return isCloudConnected;
  },
};

