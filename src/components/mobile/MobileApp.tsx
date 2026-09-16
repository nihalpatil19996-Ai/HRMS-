import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Play,
  Coffee,
  Clock,
  CheckCircle2,
  FileText,
  UserCheck,
  Search,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Calendar,
  Sparkles,
  LogOut,
  LogIn,
  PauseCircle,
  FileSpreadsheet,
  Download,
  Users,
  Layers,
  Pause,
  X,
  ListOrdered,
  Upload,
  Plus,
  Target,
  Flame,
  Zap,
  Award,
  BarChart3,
  Activity,
  CheckCircle,
  ArrowRight,
  Smartphone,
} from 'lucide-react';
import { Employee, Lead, AttendanceRecord, BreakRecord, DistributedFile, CallStatus, BreakType, LeaveRequest, CallQueue } from '../../types/crm';
import { StorageService } from '../../services/storage';
import { ActiveCallModal } from './ActiveCallModal';
import { CallOutcomePopup } from './CallOutcomePopup';
import { AutoDialerBar } from './AutoDialerBar';
import { BreakTimer } from '../common/BreakTimer';
import { UserLeaveTracker } from '../user/UserLeaveTracker';
import { QueueSheetDetailModal } from '../common/QueueSheetDetailModal';
import { parseExcelOrCsvFile, downloadSampleExcelTemplate } from '../../utils/excelHelper';
import { AndroidAppModal } from '../common/AndroidAppModal';

interface MobileAppProps {
  activeEmployee: Employee;
  leads: Lead[];
  attendance: AttendanceRecord[];
  breaks: BreakRecord[];
  files: DistributedFile[];
  onRefresh: () => void;
  isFrame: boolean;
}

export const MobileApp: React.FC<MobileAppProps> = ({
  activeEmployee,
  leads,
  attendance,
  breaks,
  files,
  onRefresh,
  isFrame,
}) => {
  const [activeTab, setActiveTab] = useState<'queues' | 'leads' | 'autodialer' | 'leaves' | 'files' | 'performance'>('queues');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);

  // Login Screen Modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmpId, setLoginEmpId] = useState(activeEmployee.id);
  const [loginPassword, setLoginPassword] = useState('1234');
  const [loginDutyAction, setLoginDutyAction] = useState<'On Duty' | 'On Break' | 'Offline'>('On Duty');

  // Excel Upload & File Sheet View State
  const [selectedUploadedFile, setSelectedUploadedFile] = useState<string | null>(null);
  const [showUploadedSheetModal, setShowUploadedSheetModal] = useState(false);

  // Break modal
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [selectedBreakType, setSelectedBreakType] = useState<BreakType>('Tea');

  // Active call states
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  const [callDuration, setCallDuration] = useState<number | null>(null);
  const [showOutcomePopup, setShowOutcomePopup] = useState(false);

  // Agent Add Queue Modal state
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [queueName, setQueueName] = useState('');
  const [queueDesc, setQueueDesc] = useState('');
  const [queueFile, setQueueFile] = useState<File | null>(null);

  // Queue & Sheet Detailed Filter Window State
  const [detailModalQueueOrFileName, setDetailModalQueueOrFileName] = useState<string | null>(null);
  const [detailModalDesc, setDetailModalDesc] = useState<string | undefined>(undefined);
  const [detailModalAssignedName, setDetailModalAssignedName] = useState<string | undefined>(undefined);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  const handleAgentCreateQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueName.trim()) {
      alert('Please enter a Queue Name (e.g. My Field Leads Queue)');
      return;
    }

    let parsedLeadsList: Array<Omit<Lead, 'id' | 'createdAt'>> = [];

    if (queueFile) {
      try {
        const parsedRows = await parseExcelOrCsvFile(queueFile);
        if (parsedRows.length === 0) {
          alert('No valid lead records found in the uploaded file.');
          return;
        }

        parsedLeadsList = parsedRows.map((row) => ({
          customerName: row.customerName,
          mobile: row.mobile,
          city: row.city || 'Mumbai',
          state: row.state || 'Maharashtra',
          product: row.product || 'Share Market Sales',
          status: 'Pending' as CallStatus,
          assignedTo: activeEmployee.id,
          assignedToName: activeEmployee.name,
          sourceFile: queueFile.name,
          remarks: row.remarks || `Imported via Queue "${queueName}"`,
        }));
      } catch (err) {
        alert('Failed to parse uploaded Excel file. Please verify file format.');
        return;
      }
    } else {
      parsedLeadsList = [
        { customerName: 'Sameer Sen', mobile: '9899112233', city: 'Mumbai', state: 'Maharashtra', product: 'Share Market Sales', status: 'Pending', assignedTo: activeEmployee.id, assignedToName: activeEmployee.name },
        { customerName: 'Priya Verma', mobile: '9899223344', city: 'Delhi', state: 'NCR', product: 'Health Insurance', status: 'Pending', assignedTo: activeEmployee.id, assignedToName: activeEmployee.name },
        { customerName: 'Anil Deshmukh', mobile: '9899334455', city: 'Pune', state: 'Maharashtra', product: 'Personal Loan', status: 'Pending', assignedTo: activeEmployee.id, assignedToName: activeEmployee.name },
      ];
    }

    const created = StorageService.createCallQueue({
      name: queueName.trim(),
      description: queueDesc.trim(),
      assignedTo: activeEmployee.id,
      assignedToName: activeEmployee.name,
      fileName: queueFile ? queueFile.name : 'Agent_Batch_Leads.xlsx',
      leadsList: parsedLeadsList,
    });

    onRefresh();
    setShowQueueModal(false);
    setQueueName('');
    setQueueDesc('');
    setQueueFile(null);
    setSelectedQueueId(created.id);
    alert(`Queue "${queueName}" created with ${parsedLeadsList.length} leads! You can now auto dial or manual dial.`);
  };

  // Auto-Dialer Campaign state
  const [isAutoDialerActive, setIsAutoDialerActive] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState<number>(0);
  const [queuedLead, setQueuedLead] = useState<Lead | null>(null);

  const allEmployees = StorageService.getEmployees();

  // Agent Call Queues
  const agentQueues = StorageService.getQueuesForAgent(activeEmployee.id);

  // Extract distinct uploaded lead files
  const uploadedLeadFiles = Array.from(
    new Set(leads.map((l) => l.sourceFile).filter(Boolean) as string[])
  );

  // Get leads assigned to current active agent (filtered by selected queue if active)
  const myLeads = leads.filter((l) => {
    const isAssigned = l.assignedTo === activeEmployee.id || !l.assignedTo || l.assignedTo === 'ALL';
    if (selectedQueueId) {
      const q = agentQueues.find((queue) => queue.id === selectedQueueId);
      if (q) {
        return (l.queueId === q.id || l.queueName === q.name || l.sourceFile === q.fileName) && isAssigned;
      }
    }
    return isAssigned;
  });

  const pendingQueue = myLeads.filter((l) => l.status === 'Pending' || l.status === 'Busy' || l.status === 'Switch Off');

  // Attendance check
  const today = new Date().toISOString().split('T')[0];
  const myAttendance = attendance.find((a) => a.employeeId === activeEmployee.id && a.date === today);

  const handleAgentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = allEmployees.find((emp) => emp.id.toLowerCase() === loginEmpId.trim().toLowerCase());
    if (!targetEmp) {
      alert(`Employee ID "${loginEmpId}" not found. Please check Employee Manager.`);
      return;
    }

    StorageService.setActiveEmployeeId(targetEmp.id);
    if (loginDutyAction === 'On Duty') {
      StorageService.punchIn(targetEmp.id, targetEmp.name);
    } else if (loginDutyAction === 'On Break') {
      StorageService.startBreak(targetEmp.id, targetEmp.name, 'Tea');
    } else {
      StorageService.punchOut(targetEmp.id);
    }

    setShowLoginModal(false);
    onRefresh();
  };

  const handleMeetingPause = () => {
    StorageService.startBreak(activeEmployee.id, activeEmployee.name, 'Meeting');
    onRefresh();
  };

  const handleMobileFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedRows = await parseExcelOrCsvFile(file);
      if (parsedRows.length === 0) {
        alert('No valid lead records found in uploaded file.');
        return;
      }

      const formattedLeads = parsedRows.map((row) => ({
        customerName: row.customerName,
        mobile: row.mobile,
        city: row.city || 'Mumbai',
        state: row.state || 'Maharashtra',
        product: row.product || 'Share Market Sales',
        status: 'Pending' as CallStatus,
        assignedTo: activeEmployee.id,
        assignedToName: activeEmployee.name,
        sourceFile: file.name,
        remarks: row.remarks || `Mobile upload ${file.name}`,
      }));

      StorageService.batchImportLeads(formattedLeads);
      onRefresh();
      setSelectedUploadedFile(file.name);
      setShowUploadedSheetModal(true);
      alert(`Successfully uploaded sheet "${file.name}" with ${formattedLeads.length} leads assigned to you!`);
    } catch (err) {
      alert('Error parsing uploaded file. Please use standard Excel or CSV template.');
    }
  };

  const handlePunchIn = () => {
    StorageService.punchIn(activeEmployee.id, activeEmployee.name);
    onRefresh();
  };

  const handlePunchOut = () => {
    if (confirm('Are you sure you want to Punch Out for today?')) {
      StorageService.punchOut(activeEmployee.id);
      onRefresh();
    }
  };

  const handleStartBreak = () => {
    StorageService.startBreak(activeEmployee.id, activeEmployee.name, selectedBreakType);
    setShowBreakModal(false);
    onRefresh();
  };

  const handleEndBreak = () => {
    StorageService.endBreak(activeEmployee.id);
    onRefresh();
  };

  // Initiate call
  const handleStartCall = (lead: Lead) => {
    if (activeEmployee.status === 'On Break') {
      alert('You are currently on break! Please end your break before placing customer calls.');
      return;
    }
    setActiveCallLead(lead);
    setCallDuration(null);
  };

  // Triggered when phone call ends
  const handleCallEnd = (seconds: number) => {
    setCallDuration(seconds);
    setShowOutcomePopup(true);
  };

  // Save outcome & automatically trigger next dialer lead if auto-dialer active
  const handleSaveOutcome = (
    status: CallStatus,
    remarks: string,
    nextFollowup?: string,
    meetingTime?: string,
    dealValue?: number,
    aiSummary?: string
  ) => {
    if (activeCallLead) {
      StorageService.updateLeadStatus(activeCallLead.id, status, remarks, nextFollowup, meetingTime, dealValue);

      // Add call log entry
      StorageService.addCallLog({
        leadId: activeCallLead.id,
        customerName: activeCallLead.customerName,
        customerMobile: activeCallLead.mobile,
        employeeId: activeEmployee.id,
        employeeName: activeEmployee.name,
        callStart: new Date(Date.now() - (callDuration || 10) * 1000).toLocaleTimeString('en-US', { hour12: false }),
        callEnd: new Date().toLocaleTimeString('en-US', { hour12: false }),
        durationSeconds: callDuration || 10,
        status,
        comments: remarks,
        nextFollowup,
        aiSummary,
      });

      onRefresh();
    }

    setShowOutcomePopup(false);
    setActiveCallLead(null);

    // Auto-Dialer flow: load next lead if campaign active
    if (isAutoDialerActive) {
      const remainingLeads = myLeads.filter(
        (l) => l.id !== activeCallLead?.id && (l.status === 'Pending' || l.status === 'Busy' || l.status === 'Switch Off')
      );
      if (remainingLeads.length > 0) {
        setQueuedLead(remainingLeads[0]);
        setAutoCountdown(3);
      } else {
        setIsAutoDialerActive(false);
        alert('Auto Dialer Campaign Complete! All pending leads called.');
      }
    }
  };

  // Auto-dialer countdown timer effect
  useEffect(() => {
    let timer: any;
    if (isAutoDialerActive && autoCountdown > 0) {
      timer = setInterval(() => {
        setAutoCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isAutoDialerActive && autoCountdown === 0 && queuedLead) {
      const target = queuedLead;
      setQueuedLead(null);
      handleStartCall(target);
    }
    return () => clearInterval(timer);
  }, [isAutoDialerActive, autoCountdown, queuedLead]);

  const handleStartAutoDialerCampaign = () => {
    if (pendingQueue.length === 0) {
      alert('No pending leads in your queue to dial.');
      return;
    }
    setIsAutoDialerActive(true);
    setQueuedLead(pendingQueue[0]);
    setAutoCountdown(2);
  };

  const filteredMyLeads = myLeads.filter((l) => {
    const matchesSearch =
      l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.mobile.includes(searchTerm) ||
      l.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Target & Real-Time Call Progress Calculations
  const agentDailyTarget = activeEmployee.dailyTarget || 40;
  const agentMonthlyTarget = activeEmployee.monthlyTarget || (agentDailyTarget * 24);

  // All call logs for this employee
  const myCallLogs = StorageService.getCallLogs().filter((c) => c.employeeId === activeEmployee.id);
  const totalCallsDone = myCallLogs.length;
  const remainingCalls = Math.max(0, agentDailyTarget - totalCallsDone);
  const targetProgressPercent = Math.min(100, Math.round((totalCallsDone / agentDailyTarget) * 100));

  const totalConnected = myCallLogs.filter((c) => c.durationSeconds && c.durationSeconds > 0).length;
  const totalConverted = myLeads.filter((l) => l.status === 'Converted').length;
  const totalFollowups = myLeads.filter((l) => l.status === 'Interested' || l.status === 'Meeting Fixed' || l.status === 'Follow-up').length;
  const totalTalkSeconds = myCallLogs.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  const totalTalkMinutes = Math.round(totalTalkSeconds / 60);

  const content = (
    <div className="bg-slate-100 min-h-full pb-16 flex flex-col justify-between">
      
      <div>
        {/* Mobile App Header */}
        <div className="bg-slate-900 text-white p-4 space-y-3 sticky top-0 z-30 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={activeEmployee.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                alt={activeEmployee.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-500"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-sm text-white">{activeEmployee.name}</h1>
                  <span className="font-mono text-[10px] bg-blue-900/80 text-blue-200 border border-blue-700/80 px-1.5 py-0.2 rounded font-semibold">
                    {activeEmployee.id}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{activeEmployee.role} • {activeEmployee.mobile}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-2.5 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1 border border-blue-400/40"
                title="Go to Agent Login Page"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login Page
              </button>

              {/* Punch In / Out Button */}
              {activeEmployee.status === 'Offline' ? (
                <button
                  onClick={handlePunchIn}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Punch In Duty
                </button>
              ) : (
                <button
                  onClick={handlePunchOut}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-semibold border border-slate-700"
                >
                  Punch Out
                </button>
              )}
            </div>
          </div>

          {/* Duty & Break Status Strip with Quick Action Buttons */}
          <div className="bg-slate-800/90 border border-slate-700/80 p-2.5 rounded-2xl text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Duty:</span>
                {activeEmployee.status === 'On Duty' && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    On Duty ({myAttendance ? myAttendance.loginTime : 'Active'})
                  </span>
                )}
                {activeEmployee.status === 'On Break' && (
                  <span className="text-amber-300 font-bold flex items-center gap-1">
                    On {activeEmployee.currentBreak} Break • Pause: <BreakTimer startTime={activeEmployee.currentBreakStart} className="text-amber-200 font-extrabold" />
                  </span>
                )}
                {activeEmployee.status === 'Offline' && (
                  <span className="text-slate-400 font-medium">Off Duty / Logged Out</span>
                )}
              </div>

              {activeEmployee.status === 'On Break' && (
                <button
                  onClick={handleEndBreak}
                  className="px-2.5 py-1 bg-emerald-500 text-slate-950 rounded-lg font-bold text-[11px] hover:bg-emerald-400 shadow-xs"
                >
                  End Break
                </button>
              )}
            </div>

            {/* Direct Duty Control Actions Bar */}
            <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-700/60">
              <button
                onClick={handlePunchIn}
                className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center transition-all ${
                  activeEmployee.status === 'On Duty'
                    ? 'bg-emerald-600 text-white ring-1 ring-emerald-400'
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ● Login / Duty
              </button>

              <button
                onClick={() => setShowBreakModal(true)}
                className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center transition-all ${
                  activeEmployee.status === 'On Break' && activeEmployee.currentBreak !== 'Meeting'
                    ? 'bg-amber-600 text-white ring-1 ring-amber-400'
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ☕ Break Pause
              </button>

              <button
                onClick={handleMeetingPause}
                className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center transition-all ${
                  activeEmployee.status === 'On Break' && activeEmployee.currentBreak === 'Meeting'
                    ? 'bg-purple-600 text-white ring-1 ring-purple-400'
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🤝 Meeting Pause
              </button>

              <button
                onClick={handlePunchOut}
                className={`py-1 px-1 rounded-lg text-[10px] font-bold text-center transition-all ${
                  activeEmployee.status === 'Offline'
                    ? 'bg-slate-600 text-slate-200'
                    : 'bg-slate-700/80 text-slate-300 hover:bg-rose-900/60 hover:text-rose-200'
                }`}
              >
                🚪 Logout
              </button>
            </div>
          </div>

          {/* Quick Android Mobile App & APK Banner */}
          <button
            onClick={() => setShowAndroidModal(true)}
            className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-900/20 flex items-center justify-between transition-all cursor-pointer border border-emerald-400/30"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 bg-white/20 rounded-lg">
                <Smartphone className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-extrabold text-white flex items-center gap-1">
                  <span>Install App on Android / APK</span>
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">
                    PWA / APK
                  </span>
                </div>
                <div className="text-[9px] text-emerald-100 font-normal">
                  1-Tap install to home screen or get .apk file
                </div>
              </div>
            </div>
            <span className="text-[11px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded-xl font-bold flex items-center gap-1">
              Get App <ArrowRight className="w-3 h-3" />
            </span>
          </button>

          {/* Daily Target, Total Calls & Remaining Calls Hero Card on Mobile Phone */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 rounded-2xl p-3 text-white shadow-lg space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>Daily Call Target</span>
                    {remainingCalls === 0 ? (
                      <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-bold border border-emerald-400/40 animate-pulse">
                        🏆 Goal Achieved!
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold border border-amber-400/30">
                        {targetProgressPercent}% Done
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-300 font-mono">
                  {totalCallsDone} / <strong className="text-amber-300 font-bold">{agentDailyTarget}</strong>
                </span>
              </div>
            </div>

            {/* 3 Core Metric Blocks: Target Total, Calls Done, Remaining Calls */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/90 border border-slate-700/80 p-2 rounded-xl text-center">
                <div className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">Target</div>
                <div className="text-base font-extrabold text-white mt-0.5">{agentDailyTarget}</div>
                <div className="text-[9px] text-slate-400">Total Calls</div>
              </div>

              <div className="bg-slate-800/90 border border-slate-700/80 p-2 rounded-xl text-center">
                <div className="text-[10px] font-semibold text-blue-300 uppercase tracking-wider">Total Made</div>
                <div className="text-base font-extrabold text-emerald-400 mt-0.5">{totalCallsDone}</div>
                <div className="text-[9px] text-slate-400 font-medium">{totalConnected} Connected</div>
              </div>

              <div className={`p-2 rounded-xl text-center border ${
                remainingCalls === 0
                  ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/50 border-amber-500/50 text-amber-300'
              }`}>
                <div className="text-[10px] font-bold uppercase tracking-wider">Remaining</div>
                <div className="text-base font-extrabold mt-0.5">{remainingCalls}</div>
                <div className="text-[9px] opacity-90 font-medium">Calls Left</div>
              </div>
            </div>

            {/* Target Progress Bar with dynamic state */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    remainingCalls === 0
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-500'
                  }`}
                  style={{ width: `${targetProgressPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-300">
                <span className="flex items-center gap-1">
                  {remainingCalls === 0 ? (
                    <span className="text-emerald-300 font-bold">🎉 Outstanding! Target accomplished today!</span>
                  ) : (
                    <span>
                      🔥 <strong className="text-amber-300">{remainingCalls} calls remaining</strong> to meet target
                    </span>
                  )}
                </span>
                <span className="font-bold text-amber-300">{targetProgressPercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="bg-white border-b border-slate-200 px-2 py-2 flex items-center justify-around text-xs font-semibold overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('queues')}
            className={`py-1.5 px-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'queues' ? 'bg-indigo-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Queues ({agentQueues.length})
          </button>
          <button
            onClick={() => setActiveTab('leads')}
            className={`py-1.5 px-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'leads' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leads ({myLeads.length})
          </button>
          <button
            onClick={() => setActiveTab('autodialer')}
            className={`py-1.5 px-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'autodialer' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Auto Dialer ({pendingQueue.length})
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`py-1.5 px-2.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'leaves' ? 'bg-emerald-700 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📅 Leaves
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-1.5 px-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'files' ? 'bg-purple-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Files ({files.length})
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-1.5 px-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'performance' ? 'bg-slate-800 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stats
          </button>
        </div>

        {/* Main Tab Content */}
        <div className="p-4 space-y-4">

          {/* TAB 0: CALL QUEUES / CAMPAIGNS */}
          {activeTab === 'queues' && (
            <div className="space-y-3">
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-amber-400" />
                    <h2 className="text-sm font-extrabold uppercase tracking-wide">Call Queues & Campaigns</h2>
                  </div>
                  <span className="text-[10px] bg-indigo-700/80 text-indigo-100 font-bold px-2 py-0.5 rounded-full">
                    {agentQueues.length} Active Queues
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Select an assigned Queue uploaded from admin panel, or upload your own Excel file to start Auto-Dialing or Manual-Dialing leads.
                </p>

                <button
                  onClick={() => setShowQueueModal(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                >
                  <Upload className="w-4 h-4 text-slate-950" />
                  + Upload Excel / CSV File to Add New Queue
                </button>
              </div>

              {selectedQueueId && (
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-amber-900">
                  <span className="font-bold">
                    Filter Active: {agentQueues.find((q) => q.id === selectedQueueId)?.name}
                  </span>
                  <button
                    onClick={() => setSelectedQueueId(null)}
                    className="text-xs bg-amber-200 hover:bg-amber-300 px-2 py-1 rounded-lg font-bold cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {agentQueues.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-500 text-xs space-y-1">
                    <p className="font-bold text-slate-700">No Call Queues assigned yet</p>
                    <p className="text-[11px] text-slate-400">Ask your admin to upload an Excel queue or campaign list for your account.</p>
                  </div>
                ) : (
                  agentQueues.map((q) => {
                    const queueLeads = leads.filter(
                      (l) => (l.queueId === q.id || l.queueName === q.name || l.sourceFile === q.fileName) &&
                             (l.assignedTo === activeEmployee.id || !l.assignedTo || l.assignedTo === 'ALL')
                    );
                    const pendingCount = queueLeads.filter((l) => l.status === 'Pending' || l.status === 'Busy' || l.status === 'Switch Off').length;
                    const totalCount = queueLeads.length || q.totalLeads;
                    const isSelected = selectedQueueId === q.id;

                    return (
                      <div
                        key={q.id}
                        className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 transition-all ${
                          isSelected ? 'border-2 border-indigo-600 bg-indigo-50/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                              <span className="text-indigo-600 font-mono">📁</span>
                              {q.name}
                            </div>
                            {q.description && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{q.description}</div>
                            )}
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                            {q.assignedToName || 'Assigned'}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-500 font-medium">Pending to Call: </span>
                            <span className="font-bold text-emerald-600">{pendingCount} leads</span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Total: {totalCount}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setDetailModalQueueOrFileName(q.name);
                            setDetailModalDesc(q.description || `Queue with ${totalCount} numbers`);
                            setDetailModalAssignedName(q.assignedToName || 'Assigned Agent');
                          }}
                          className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Search className="w-3.5 h-3.5 text-indigo-600" />
                          View Dialed / Not Dialed Counts & Comments
                        </button>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => {
                              setSelectedQueueId(q.id);
                              setActiveTab('autodialer');
                              handleStartAutoDialerCampaign();
                            }}
                            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Auto Dial Queue
                          </button>

                          <button
                            onClick={() => {
                              setSelectedQueueId(q.id);
                              setActiveTab('leads');
                            }}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            Manual Dial
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          
          {/* TAB 1: TODAY'S LEADS */}
          {activeTab === 'leads' && (
            <div className="space-y-3">
              
              {selectedQueueId && (
                <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-indigo-900 shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ListOrdered className="w-4 h-4 text-indigo-600" />
                    <span>Dialing Queue: {agentQueues.find((q) => q.id === selectedQueueId)?.name || 'Custom Queue'}</span>
                  </div>
                  <button
                    onClick={() => setSelectedQueueId(null)}
                    className="text-[11px] bg-indigo-200 hover:bg-indigo-300 text-indigo-900 font-extrabold px-2 py-0.5 rounded-md cursor-pointer"
                  >
                    View All Leads
                  </button>
                </div>
              )}

              {/* Top Action & Search */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, phone, city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl w-full focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleStartAutoDialerCampaign}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm whitespace-nowrap flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5" />
                  Auto Dialer Mode
                </button>
              </div>

              {/* Status Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold">
                {['ALL', 'Pending', 'Follow-up', 'Meeting Fixed', 'Converted', 'Busy', 'Switch Off'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-full whitespace-nowrap border transition-all ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Lead Cards List */}
              <div className="space-y-3">
                {filteredMyLeads.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-400 text-xs">
                    No leads match your filter or search query.
                  </div>
                ) : (
                  filteredMyLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{lead.customerName}</h3>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{lead.mobile}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {lead.city}, {lead.state}
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                            lead.status === 'Converted'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : lead.status === 'Interested' || lead.status === 'Meeting Fixed'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : lead.status === 'Follow-up'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-xs flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Product:</span>
                        <span className="font-bold text-indigo-700">{lead.product}</span>
                      </div>

                      {lead.remarks && (
                        <div className="text-[11px] text-slate-500 bg-amber-50/50 border border-amber-100/60 p-2 rounded-xl">
                          <span className="font-bold text-amber-900">Latest Remark:</span> {lead.remarks}
                          {lead.nextFollowup && (
                            <div className="text-[10px] text-amber-800 font-bold mt-0.5">
                              📅 Scheduled Follow-up: {lead.nextFollowup}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <span className="text-[10px] text-slate-400">
                          {lead.lastCalledAt ? `Last called: ${new Date(lead.lastCalledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not called yet'}
                        </span>

                        <button
                          onClick={() => handleStartCall(lead)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          Tap to Call Customer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 2: AUTO DIALER CAMPAIGN */}
          {activeTab === 'autodialer' && (
            <div className="space-y-4">
              <AutoDialerBar
                isAutoDialerActive={isAutoDialerActive}
                onToggleAutoDialer={() => setIsAutoDialerActive(!isAutoDialerActive)}
                pendingCount={pendingQueue.length}
                countdownSeconds={autoCountdown}
                onSkipNext={() => setAutoCountdown(0)}
                nextLeadName={queuedLead?.customerName}
              />

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Auto Dialer Queue ({pendingQueue.length} leads)</h3>
                <p className="text-xs text-slate-500">
                  Calls lead #1, opens phone dialer simulation, auto-opens CRM response popup upon call end, and loads lead #2 automatically!
                </p>

                <div className="space-y-2">
                  {pendingQueue.map((lead, idx) => (
                    <div
                      key={lead.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{lead.customerName}</div>
                          <div className="text-[11px] text-slate-500">{lead.mobile} • {lead.product}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartCall(lead)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg font-semibold text-[11px]"
                      >
                        Dial
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: LEAVES & ATTENDANCE TRACKER */}
          {activeTab === 'leaves' && (
            <UserLeaveTracker
              activeEmployee={activeEmployee}
              leaveRequests={StorageService.getLeaveRequests()}
              onRefresh={onRefresh}
            />
          )}

          {/* TAB 3: EXCEL / CSV SHEETS & DOCUMENTS */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              
              {/* Excel / CSV Lead Sheet Upload Card */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                    <h3 className="font-bold text-sm">Upload Excel / CSV Lead Sheet</h3>
                  </div>
                  <span className="text-[10px] bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    User Panel
                  </span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Upload your client leads file (.xlsx, .csv). Uploaded files will be stored in your app and ready for Manual or Auto Dialing!
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={downloadSampleExcelTemplate}
                    className="px-3 py-2 bg-emerald-800/90 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 border border-emerald-500/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Sample Excel
                  </button>

                  <label className="px-3 py-2 bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    Upload File (.xlsx / .csv)
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={handleMobileFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Uploaded Lead Batches / File List */}
              {uploadedLeadFiles.length > 0 && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Uploaded Lead Sheets & Batches ({uploadedLeadFiles.length})
                  </h4>

                  <div className="space-y-2">
                    {uploadedLeadFiles.map((fileName) => {
                      const sheetLeads = leads.filter((l) => l.sourceFile === fileName);
                      const pendingCount = sheetLeads.filter((l) => l.status === 'Pending').length;

                      return (
                        <div
                          key={fileName}
                          onClick={() => {
                            setDetailModalQueueOrFileName(fileName);
                            setDetailModalDesc(`Uploaded Lead Sheet: ${fileName}`);
                            setDetailModalAssignedName(activeEmployee.name);
                          }}
                          className="p-3 bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-bold text-slate-900 text-xs group-hover:text-blue-600 flex items-center gap-1.5">
                              📄 {fileName}
                              <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                Tap to View Numbers →
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Total Numbers: <strong>{sheetLeads.length}</strong> • Pending Calls: <strong className="text-emerald-700">{pendingCount}</strong>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Branch Shared Documents */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Branch Shared Documents & Circulars</h3>
                {files.map((file) => (
                  <div key={file.id} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                        {file.category}
                      </span>
                      <span className="text-[10px] text-slate-400">{file.uploadedDate}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs">{file.title}</h4>
                    <p className="text-[11px] text-slate-500">{file.description}</p>
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-blue-600 font-bold hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> Open File
                    </a>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 4: MY PERFORMANCE & TARGETS */}
          {activeTab === 'performance' && (
            <div className="space-y-4">
              {/* Daily Target Performance Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Daily Calling Target</h3>
                      <p className="text-[11px] text-slate-500">Live tracker for today's assignment</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                    remainingCalls === 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {remainingCalls === 0 ? '🏆 100% Achieved' : `${remainingCalls} calls left`}
                  </span>
                </div>
                
                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">Target</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-0.5">{agentDailyTarget}</div>
                    <div className="text-[9px] text-slate-400">Total Goal</div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-center">
                    <div className="text-[10px] font-semibold text-blue-700 uppercase">Total Done</div>
                    <div className="text-xl font-extrabold text-blue-900 mt-0.5">{totalCallsDone}</div>
                    <div className="text-[9px] text-blue-600 font-semibold">{targetProgressPercent}% Done</div>
                  </div>
                  <div className={`p-3 rounded-xl text-center border ${
                    remainingCalls === 0
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-900'
                      : 'bg-amber-50 border-amber-100 text-amber-900'
                  }`}>
                    <div className="text-[10px] font-semibold uppercase">Remaining</div>
                    <div className="text-xl font-extrabold mt-0.5">{remainingCalls}</div>
                    <div className="text-[9px] font-medium">To Dial</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Target Completion Rate</span>
                    <span className="text-indigo-700 font-bold">{totalCallsDone} / {agentDailyTarget} calls ({targetProgressPercent}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        remainingCalls === 0
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-indigo-500 via-blue-500 to-amber-500'
                      }`}
                      style={{ width: `${targetProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Monthly Target & Talk Time Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Monthly Target</span>
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {totalCallsDone} / {agentMonthlyTarget}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {Math.max(0, agentMonthlyTarget - totalCallsDone)} calls remaining this month
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>Total Talk Time</span>
                    <Clock className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {totalTalkMinutes} <span className="text-xs text-slate-500 font-normal">mins</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-medium">
                    {totalConnected} connected calls
                  </div>
                </div>
              </div>

              {/* Outcomes Breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Lead Conversion & Pipeline</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      Sales Converted
                    </div>
                    <div className="text-2xl font-extrabold text-emerald-900 mt-1">
                      {totalConverted}
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">Deals Closed</div>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="text-xs text-blue-800 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                      Pipeline & Follow-ups
                    </div>
                    <div className="text-2xl font-extrabold text-blue-900 mt-1">
                      {totalFollowups}
                    </div>
                    <div className="text-[10px] text-blue-700 mt-0.5">Interested / Meeting</div>
                  </div>
                </div>

                {/* Quick Auto Dialer Action */}
                {remainingCalls > 0 && pendingQueue.length > 0 && (
                  <button
                    onClick={() => {
                      setActiveTab('autodialer');
                      handleStartAutoDialerCampaign();
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    Auto-Dial Next {remainingCalls} Leads to Complete Target
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Break Selection Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xs w-full p-5 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-base">Select Break Category</h3>
            
            <div className="grid grid-cols-2 gap-2">
              {(['Tea', 'Lunch', 'Meeting', 'Personal'] as BreakType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedBreakType(type)}
                  className={`p-3 rounded-xl font-bold border text-center ${
                    selectedBreakType === type
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {type} Break
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setShowBreakModal(false)}
                className="px-3 py-1.5 text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStartBreak}
                className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl shadow-sm"
              >
                Start Break
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Agent Login Screen Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Agent Mobile Login</h2>
                  <p className="text-xs text-slate-500">Access field sales CRM & auto dialer</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAgentLogin} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Select / Enter Registered Agent ID *</label>
                <select
                  value={loginEmpId}
                  onChange={(e) => setLoginEmpId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.id} - {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Password / Security PIN *</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter 4-digit PIN (default 1234)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Initial Duty Status *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Login / Duty', value: 'On Duty' },
                    { label: 'Break Pause', value: 'On Break' },
                    { label: 'Logout', value: 'Offline' },
                  ].map((act) => (
                    <button
                      key={act.value}
                      type="button"
                      onClick={() => setLoginDutyAction(act.value as any)}
                      className={`py-2 px-1 rounded-xl font-bold text-[11px] border text-center transition-all ${
                        loginDutyAction === act.value
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm"
                >
                  <LogIn className="w-4 h-4" />
                  LOGIN & OPEN CRM MOBILE APP
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Uploaded Sheet Lead Numbers Modal */}
      {showUploadedSheetModal && selectedUploadedFile && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-slate-900 space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm truncate max-w-[240px]">
                    {selectedUploadedFile}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  Total {leads.filter((l) => l.sourceFile === selectedUploadedFile).length} leads in this sheet
                </p>
              </div>

              <button
                onClick={() => setShowUploadedSheetModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auto Dial File Leads Action */}
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <div className="font-bold text-emerald-950 text-xs">Ready for Auto Dialing</div>
                <div className="text-[11px] text-emerald-700">Dial all numbers in sequence automatically</div>
              </div>
              <button
                onClick={() => {
                  setShowUploadedSheetModal(false);
                  setActiveTab('autodialer');
                  setIsAutoDialerActive(true);
                  setAutoCountdown(2);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5" />
                Auto Dial File
              </button>
            </div>

            {/* List of Numbers in Sheet */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {leads
                .filter((l) => l.sourceFile === selectedUploadedFile)
                .map((ld, idx) => (
                  <div
                    key={ld.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{idx + 1}. {ld.customerName}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{ld.mobile} • {ld.product}</div>
                      <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ld.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ld.status}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setShowUploadedSheetModal(false);
                        handleStartCall(ld);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Dial
                    </button>
                  </div>
                ))}
            </div>

          </div>
        </div>
      )}

      {/* Agent Add Queue Modal */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Upload Excel & Create Queue</h3>
              </div>
              <button onClick={() => setShowQueueModal(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleAgentCreateQueue} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-800 font-bold mb-1">Queue / Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Field Calling Batch / Aug Health Leads"
                  value={queueName}
                  onChange={(e) => setQueueName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Field leads collected today"
                  value={queueDesc}
                  onChange={(e) => setQueueDesc(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-xs"
                />
              </div>

              <div className="bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-indigo-950 font-extrabold text-xs">
                    📄 Select Excel / CSV File
                  </label>
                  <button
                    type="button"
                    onClick={downloadSampleExcelTemplate}
                    className="text-[10px] text-indigo-700 underline font-bold flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Sample Template
                  </button>
                </div>
                
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setQueueFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
                <p className="text-[10px] text-indigo-800 font-medium leading-tight">
                  Supports columns: <span className="font-bold">Customer Name, Mobile, City, State, Product, Remarks</span>. If empty, sample leads will be created for demo.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQueueModal(false)}
                  className="px-3.5 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Create & Start Dialing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Queue & Sheet Detail Modal */}
      {detailModalQueueOrFileName && (
        <QueueSheetDetailModal
          isOpen={!!detailModalQueueOrFileName}
          onClose={() => setDetailModalQueueOrFileName(null)}
          queueOrFileName={detailModalQueueOrFileName}
          queueDescription={detailModalDesc}
          assignedToName={detailModalAssignedName}
          leads={leads}
          onStartAutoDial={(filteredLeads, categoryTitle) => {
            if (filteredLeads.length === 0) return;
            setQueuedLead(filteredLeads[0]);
            setIsAutoDialerActive(true);
            setAutoCountdown(2);
            setActiveTab('autodialer');
          }}
          onManualDialLead={(lead) => {
            handleStartCall(lead);
          }}
        />
      )}

      {/* Active Call Simulator Overlay Modal */}
      {activeCallLead && !showOutcomePopup && (
        <ActiveCallModal lead={activeCallLead} onCallEnd={handleCallEnd} />
      )}

      {/* Post-call Response Log Popup */}
      {showOutcomePopup && activeCallLead && (
        <CallOutcomePopup
          lead={activeCallLead}
          callDurationSeconds={callDuration || 0}
          onSaveAndNext={handleSaveOutcome}
          isAutoDialer={isAutoDialerActive}
        />
      )}

      {/* Android App & APK Modal */}
      <AndroidAppModal
        isOpen={showAndroidModal}
        onClose={() => setShowAndroidModal(false)}
      />

    </div>
  );

  if (isFrame) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-900 py-8 px-4 flex items-center justify-center">
        {/* Realistic Mobile Device Frame mockup */}
        <div className="w-full max-w-[420px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700/50 relative overflow-hidden">
          {/* Top Notch / Camera Pill */}
          <div className="w-32 h-5 bg-slate-900 rounded-full mx-auto mb-2 flex items-center justify-center gap-2 z-40 relative">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950" />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          </div>

          <div className="bg-white rounded-[36px] overflow-hidden min-h-[720px] max-h-[800px] overflow-y-auto">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};
