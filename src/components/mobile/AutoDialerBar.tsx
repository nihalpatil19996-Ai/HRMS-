import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, FastForward, PhoneCall } from 'lucide-react';

interface AutoDialerBarProps {
  isAutoDialerActive: boolean;
  onToggleAutoDialer: () => void;
  pendingCount: number;
  countdownSeconds: number;
  onSkipNext: () => void;
  nextLeadName?: string;
}

export const AutoDialerBar: React.FC<AutoDialerBarProps> = ({
  isAutoDialerActive,
  onToggleAutoDialer,
  pendingCount,
  countdownSeconds,
  onSkipNext,
  nextLeadName,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-xl space-y-3">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isAutoDialerActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
            {isAutoDialerActive ? 'Auto Dialer Active' : 'Auto Dialer Paused'}
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
            {pendingCount} leads in queue
          </span>
        </div>

        <button
          onClick={onToggleAutoDialer}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
            isAutoDialerActive
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isAutoDialerActive ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              Pause Dialer
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Start Campaign
            </>
          )}
        </button>
      </div>

      {/* Countdown overlay if active */}
      {isAutoDialerActive && nextLeadName && countdownSeconds > 0 && (
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 flex items-center justify-between text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Auto dialing next lead in <span className="text-emerald-400 font-extrabold text-sm">{countdownSeconds}s</span>:</div>
            <div className="font-bold text-white mt-0.5">{nextLeadName}</div>
          </div>
          <button
            onClick={onSkipNext}
            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1"
          >
            <FastForward className="w-3.5 h-3.5" />
            Skip Lead
          </button>
        </div>
      )}

    </div>
  );
};
