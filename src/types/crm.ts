export type CallStatus =
  | 'Pending'
  | 'Interested'
  | 'Not Interested'
  | 'Busy'
  | 'Switch Off'
  | 'Wrong Number'
  | 'Out of Coverage'
  | 'Follow-up'
  | 'Meeting Fixed'
  | 'Converted';

export type BreakType = 'Tea' | 'Lunch' | 'Meeting' | 'Personal';

export type EmployeeRole = 'Sales Executive' | 'Team Leader' | 'Branch Manager' | 'Admin';

export interface Employee {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: EmployeeRole;
  managerId?: string;
  managerName?: string;
  status: 'Active' | 'Inactive' | 'On Duty' | 'On Break' | 'Offline';
  currentBreak?: BreakType;
  currentBreakStart?: string;
  dailyTarget: number;
  monthlyTarget?: number;
  talkTimeTargetMinutes?: number;
  avatarUrl?: string;
  password?: string;
}

export interface Lead {
  id: string;
  customerName: string;
  mobile: string;
  city: string;
  state: string;
  product: string; // e.g. Share Market Sales, Health Insurance Sales, Mutual Funds, Loans
  status: CallStatus;
  assignedTo: string; // Employee ID
  assignedToName?: string;
  remarks?: string;
  nextFollowup?: string; // ISO String or YYYY-MM-DD HH:mm
  meetingTime?: string;
  dealValue?: number;
  createdAt: string;
  lastCalledAt?: string;
  sourceFile?: string; // Uploaded Excel / CSV file name
  batchName?: string;
  queueId?: string;
  queueName?: string;
}

export interface CallQueue {
  id: string;
  name: string; // e.g. "August HDFC Health Lead Campaign"
  description?: string;
  assignedTo: string; // Employee ID or 'ALL'
  assignedToName?: string;
  createdAt: string; // ISO String
  totalLeads: number;
  completedLeads: number;
  fileName?: string; // Uploaded Excel / CSV file name
  status: 'Active' | 'Completed' | 'Archived';
}

export interface CallLog {
  id: string;
  leadId: string;
  customerName: string;
  customerMobile: string;
  employeeId: string;
  employeeName: string;
  callStart: string;
  callEnd: string;
  durationSeconds: number;
  status: CallStatus;
  comments: string;
  nextFollowup?: string;
  aiSummary?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  loginTime: string; // HH:mm:ss
  logoutTime?: string; // HH:mm:ss
  workingHours?: string;
  status: 'On Time' | 'Late' | 'Early Logout' | 'Present' | 'Absent';
}

export interface BreakRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  breakType: BreakType;
  startTime: string; // ISO or HH:mm:ss
  endTime?: string;
  durationMinutes?: number;
  date: string;
}

export type FileCategory = 'Training Video' | 'PDF Document' | 'Excel Rate Sheet' | 'Circular' | 'Brochure';

export type LeaveType = 'Casual Leave' | 'Sick Leave' | 'Paid Leave' | 'Unpaid Leave' | 'Earned Leave';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string; // ISO String
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface LeaveBalance {
  employeeId: string;
  totalQuota: number;
  casualAllocated: number;
  casualUsed: number;
  sickAllocated: number;
  sickUsed: number;
  paidAllocated: number;
  paidUsed: number;
  unpaidUsed: number;
  pendingDaysCount: number;
  rejectedDaysCount: number;
  rejectedRequestsCount: number;
  daysWorkedCount: number;
  totalPaidDaysCount: number; // Days Worked + Approved Paid Leaves
  totalNonPaidDaysCount: number; // Unpaid / LOP Days
  currentMonthDays: number; // Total days in current month (e.g. 31)
  netPayableDaysThisMonth: number; // Total calculated payable days for current month
}

export interface DistributedFile {
  id: string;
  title: string;
  category: FileCategory;
  fileUrl: string;
  uploadedBy: string;
  uploadedDate: string;
  description: string;
  fileSize?: string;
}

export interface SystemStats {
  onlineEmployees: number;
  activeCalls: number;
  todayCalls: number;
  salesDone: number;
  pendingLeads: number;
  totalBreakTimeMinutes: number;
}
