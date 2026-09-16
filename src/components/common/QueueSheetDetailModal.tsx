import React, { useState } from 'react';
import {
  FileSpreadsheet,
  X,
  PhoneCall,
  Play,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  PhoneOff,
  AlertCircle,
  MessageSquare,
  History,
  ChevronDown,
  ChevronUp,
  UserCheck,
  ListOrdered
} from 'lucide-react';
import { Lead, CallLog, CallStatus } from '../../types/crm';
import { StorageService } from '../../services/storage';

interface QueueSheetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueOrFileName: string;
  queueDescription?: string;
  assignedToName?: string;
  leads: Lead[];
  onStartAutoDial: (filteredLeads: Lead[], categoryName: string) => void;
  onManualDialLead: (lead: Lead) => void;
}

export const QueueSheetDetailModal: React.FC<QueueSheetDetailModalProps> = ({
  isOpen,
  onClose,
  queueOrFileName,
  queueDescription,
  assignedToName,
  leads,
  onStartAutoDial,
  onManualDialLead,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'NOT_DIALED' | 'DIALED' | 'INTERESTED' | 'FOLLOWUP' | 'NOT_INTERESTED' | 'BUSY'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter leads by queue name, ID, or source file name
  const queueLeads = leads.filter(
    (l) =>
      l.queueName === queueOrFileName ||
      l.queueId === queueOrFileName ||
      l.sourceFile === queueOrFileName ||
      (l.sourceFile && queueOrFileName.includes(l.sourceFile))
  );

  // Get all call logs from storage
  const allCallLogs = StorageService.getCallLogs();

  // Categorization counts
  const totalCount = queueLeads.length;
  const notDialedLeads = queueLeads.filter((l) => l.status === 'Pending');
  const dialedLeads = queueLeads.filter((l) => l.status !== 'Pending');

  const interestedLeads = queueLeads.filter((l) => l.status === 'Interested' || l.status === 'Meeting Fixed' || l.status === 'Converted');
  const followupLeads = queueLeads.filter((l) => l.status === 'Follow-up');
  const notInterestedLeads = queueLeads.filter((l) => l.status === 'Not Interested' || l.status === 'Wrong Number');
  const busyLeads = queueLeads.filter((l) => l.status === 'Busy' || l.status === 'Switch Off' || l.status === 'Out of Coverage');

  // Filtered dataset according to active tab
  let currentFilteredLeads = queueLeads;
  let categoryTitle = 'All Numbers';

  if (selectedFilter === 'NOT_DIALED') {
    currentFilteredLeads = notDialedLeads;
    categoryTitle = 'Not Dialed Numbers';
  } else if (selectedFilter === 'DIALED') {
    currentFilteredLeads = dialedLeads;
    categoryTitle = 'Dialed Numbers';
  } else if (selectedFilter === 'INTERESTED') {
    currentFilteredLeads = interestedLeads;
    categoryTitle = 'Interested & Converted';
  } else if (selectedFilter === 'FOLLOWUP') {
    currentFilteredLeads = followupLeads;
    categoryTitle = 'Follow-up Scheduled';
  } else if (selectedFilter === 'NOT_INTERESTED') {
    currentFilteredLeads = notInterestedLeads;
    categoryTitle = 'Not Interested / Wrong No.';
  } else if (selectedFilter === 'BUSY') {
    currentFilteredLeads = busyLeads;
    categoryTitle = 'Busy / Switch Off';
  }

  // Apply Search Term
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    currentFilteredLeads = currentFilteredLeads.filter(
      (l) =>
        l.customerName.toLowerCase().includes(term) ||
        l.mobile.includes(term) ||
        l.city.toLowerCase().includes(term) ||
        l.product.toLowerCase().includes(term) ||
        (l.remarks && l.remarks.toLowerCase().includes(term))
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 text-slate-900 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h2 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                  {queueOrFileName}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="font-semibold text-indigo-700">📄 Sheet / Queue</span>
                  {assignedToName && (
                    <span>• Assigned to: <strong className="text-slate-800">{assignedToName}</strong></span>
                  )}
                </div>
              </div>
            </div>
            {queueDescription && (
              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                {queueDescription}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categorized Count Option Cards */}
        <div className="py-3 border-b border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Filter Numbers & Call Counts</span>
            <span>Total: {totalCount} Numbers</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {/* All Numbers */}
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedFilter === 'ALL'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="text-[10px] uppercase font-extrabold opacity-80">All Numbers</div>
              <div className="text-lg font-black mt-0.5">{totalCount}</div>
            </button>

            {/* Not Dialed */}
            <button
              onClick={() => setSelectedFilter('NOT_DIALED')}
              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedFilter === 'NOT_DIALED'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md scale-[1.02]'
                  : 'bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <div className="text-[10px] uppercase font-extrabold opacity-80 flex items-center gap-1">
                ⏳ Not Dialed
              </div>
              <div className="text-lg font-black mt-0.5">{notDialedLeads.length}</div>
            </button>

            {/* Dialed */}
            <button
              onClick={() => setSelectedFilter('DIALED')}
              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedFilter === 'DIALED'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-[1.02]'
                  : 'bg-blue-50/80 text-blue-900 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <div className="text-[10px] uppercase font-extrabold opacity-80 flex items-center gap-1">
                📞 Dialed
              </div>
              <div className="text-lg font-black mt-0.5">{dialedLeads.length}</div>
            </button>

            {/* Interested */}
            <button
              onClick={() => setSelectedFilter('INTERESTED')}
              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedFilter === 'INTERESTED'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                  : 'bg-emerald-50/80 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <div className="text-[10px] uppercase font-extrabold opacity-80 flex items-center gap-1">
                🌟 Interested
              </div>
              <div className="text-lg font-black mt-0.5">{interestedLeads.length}</div>
            </button>

            {/* Follow up */}
            <button
              onClick={() => setSelectedFilter('FOLLOWUP')}
              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedFilter === 'FOLLOWUP'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-[1.02]'
                  : 'bg-purple-50/80 text-purple-900 border-purple-200 hover:bg-purple-100'
              }`}
            >
              <div className="text-[10px] uppercase font-extrabold opacity-80 flex items-center gap-1">
                📅 Follow-Up
              </div>
              <div className="text-lg font-black mt-0.5">{followupLeads.length}</div>
            </button>

            {/* Busy / Switch Off */}
            <button
              onClick={() => setSelectedFilter('BUSY')}
              className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedFilter === 'BUSY'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md scale-[1.02]'
                  : 'bg-rose-50/80 text-rose-900 border-rose-200 hover:bg-rose-100'
              }`}
            >
              <div className="text-[10px] uppercase font-extrabold opacity-80 flex items-center gap-1">
                ⚡ Busy/No Ans
              </div>
              <div className="text-lg font-black mt-0.5">{busyLeads.length}</div>
            </button>
          </div>
        </div>

        {/* Action Panel & Search Input */}
        <div className="py-3 flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-slate-100">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                if (currentFilteredLeads.length === 0) {
                  alert('No numbers available in this selected filter to auto-dial.');
                  return;
                }
                onClose();
                onStartAutoDial(currentFilteredLeads, categoryTitle);
              }}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 text-emerald-200 fill-emerald-200" />
              Auto Dial {categoryTitle} ({currentFilteredLeads.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, number, comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>

        {/* Numbers List with Status & Comments */}
        <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 pr-1">
          {currentFilteredLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <PhoneOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No numbers found for <strong>{categoryTitle}</strong>.
            </div>
          ) : (
            currentFilteredLeads.map((lead, idx) => {
              const leadLogs = allCallLogs.filter((log) => log.leadId === lead.id || log.customerMobile === lead.mobile);
              const isExpanded = expandedLeadId === lead.id;

              return (
                <div
                  key={lead.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs hover:border-indigo-300 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {idx + 1}. {lead.customerName}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            lead.status === 'Pending'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : lead.status === 'Interested' || lead.status === 'Converted'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : lead.status === 'Follow-up'
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                        <strong className="text-slate-800">{lead.mobile}</strong>
                        <span>• {lead.product}</span>
                        {lead.city && <span>• {lead.city}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onManualDialLead(lead);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Dial
                    </button>
                  </div>

                  {/* Comment / Remarks Display */}
                  {lead.remarks ? (
                    <div className="bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                        <span>Agent Comment / Call Remark:</span>
                      </div>
                      <p className="text-amber-900 text-xs font-medium pl-5">{lead.remarks}</p>
                      {lead.nextFollowup && (
                        <div className="text-[11px] text-amber-800 font-extrabold pl-5 pt-0.5">
                          📅 Scheduled Follow-up: {lead.nextFollowup}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                      No remarks recorded yet for this lead.
                    </div>
                  )}

                  {/* Call Log History Toggle */}
                  {leadLogs.length > 0 && (
                    <div>
                      <button
                        onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                        className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3 h-3" />
                        {isExpanded ? 'Hide Call Log History' : `View Call History (${leadLogs.length} calls logged)`}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                          {leadLogs.map((log) => (
                            <div key={log.id} className="bg-white p-2 rounded-lg border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-800">{log.status}</span>
                                <span className="text-slate-400 font-mono">
                                  {new Date(log.callStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({log.durationSeconds}s)
                                </span>
                              </div>
                              {log.comments && (
                                <p className="text-[11px] text-slate-600">💬 {log.comments}</p>
                              )}
                              <div className="text-[10px] text-slate-400">Agent: {log.employeeName}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
