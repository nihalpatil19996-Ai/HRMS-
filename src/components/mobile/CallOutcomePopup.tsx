import React, { useState } from 'react';
import { CheckCircle2, Sparkles, Calendar, Clock, DollarSign, Save, PhoneCall, X } from 'lucide-react';
import { Lead, CallStatus } from '../../types/crm';
import { generateCallSummary } from '../../services/aiService';

interface CallOutcomePopupProps {
  lead: Lead;
  callDurationSeconds: number;
  onSaveAndNext: (status: CallStatus, remarks: string, nextFollowup?: string, meetingTime?: string, dealValue?: number, aiSummary?: string) => void;
  isAutoDialer: boolean;
}

export const CallOutcomePopup: React.FC<CallOutcomePopupProps> = ({
  lead,
  callDurationSeconds,
  onSaveAndNext,
  isAutoDialer,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<CallStatus>('Interested');
  const [remarks, setRemarks] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [dealValue, setDealValue] = useState<number | undefined>(25000);
  const [aiSummary, setAiSummary] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const statuses: { label: string; value: CallStatus; color: string }[] = [
    { label: 'Interested', value: 'Interested', color: 'bg-emerald-500 text-white border-emerald-600' },
    { label: 'Follow-up', value: 'Follow-up', color: 'bg-amber-500 text-white border-amber-600' },
    { label: 'Meeting Fixed', value: 'Meeting Fixed', color: 'bg-blue-600 text-white border-blue-700' },
    { label: 'Converted (Sale)', value: 'Converted', color: 'bg-emerald-700 text-white border-emerald-800' },
    { label: 'Busy', value: 'Busy', color: 'bg-slate-700 text-white border-slate-800' },
    { label: 'Switch Off', value: 'Switch Off', color: 'bg-slate-600 text-white border-slate-700' },
    { label: 'Out of Coverage', value: 'Out of Coverage', color: 'bg-slate-600 text-white border-slate-700' },
    { label: 'Wrong Number', value: 'Wrong Number', color: 'bg-slate-600 text-white border-slate-700' },
    { label: 'Not Interested', value: 'Not Interested', color: 'bg-rose-600 text-white border-rose-700' },
  ];

  const handleGenerateAiSummary = async () => {
    setIsAiGenerating(true);
    const summary = await generateCallSummary(lead.customerName, lead.product, selectedStatus, remarks);
    setAiSummary(summary);
    setIsAiGenerating(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAndNext(selectedStatus, remarks, nextFollowup, meetingTime, dealValue, aiSummary);
  };

  const mins = Math.floor(callDurationSeconds / 60);
  const secs = callDurationSeconds % 60;
  const durationText = `${mins}m ${secs}s`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900">Call Outcome Log</h2>
            </div>
            <p className="text-xs text-slate-500">Call ended ({durationText}) • Log response</p>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
            {isAutoDialer ? 'Auto-Dialer Queue' : 'Manual Call'}
          </span>
        </div>

        {/* Customer Header summary */}
        <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900 text-sm">{lead.customerName}</div>
            <div className="text-xs text-slate-500 font-mono">{lead.mobile} • {lead.city}</div>
          </div>
          <div className="text-right text-xs">
            <div className="text-slate-400">Product:</div>
            <div className="font-semibold text-indigo-700">{lead.product}</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* Status selection pill options */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">Select Call Status Disposition *</label>
            <div className="grid grid-cols-3 gap-2">
              {statuses.map((st) => {
                const isSelected = selectedStatus === st.value;
                return (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setSelectedStatus(st.value)}
                    className={`py-2 px-1.5 rounded-xl font-semibold text-[11px] border text-center transition-all ${
                      isSelected
                        ? `${st.color} shadow-md scale-95 ring-2 ring-blue-500/30`
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional inputs */}
          {selectedStatus === 'Follow-up' && (
            <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-2xl space-y-1">
              <label className="block font-semibold text-amber-900">Next Follow-up Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={nextFollowup}
                onChange={(e) => setNextFollowup(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl focus:outline-none"
              />
            </div>
          )}

          {selectedStatus === 'Meeting Fixed' && (
            <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-2xl space-y-1">
              <label className="block font-semibold text-blue-900">Appointment Meeting Time *</label>
              <input
                type="datetime-local"
                required
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-xl focus:outline-none"
              />
            </div>
          )}

          {selectedStatus === 'Converted' && (
            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-2xl space-y-1">
              <label className="block font-semibold text-emerald-900">Deal Value / Premium Collected (₹) *</label>
              <input
                type="number"
                required
                min="500"
                value={dealValue}
                onChange={(e) => setDealValue(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl focus:outline-none font-bold text-slate-900"
              />
            </div>
          )}

          {/* Agent Comments */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800">Agent Call Remarks / Feedback</label>
              <button
                type="button"
                onClick={handleGenerateAiSummary}
                disabled={isAiGenerating}
                className="text-[11px] text-indigo-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                {isAiGenerating ? 'Generating AI Note...' : 'Auto AI Summary'}
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="e.g. Discussed family health cover. Customer requested quote on WhatsApp..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Generated AI Summary Display */}
          {aiSummary && (
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-2xl text-[11px] text-indigo-950 font-medium">
              <div className="font-bold text-indigo-800 flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                AI Generated CRM Note:
              </div>
              {aiSummary}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Save className="w-4 h-4" />
              {isAutoDialer ? 'Save & Automatically Dial Next Lead' : 'Save Call Log'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
