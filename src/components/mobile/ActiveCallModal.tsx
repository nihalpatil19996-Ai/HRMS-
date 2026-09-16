import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, User, PhoneCall, ExternalLink, Smartphone } from 'lucide-react';
import { Lead } from '../../types/crm';

interface ActiveCallModalProps {
  lead: Lead;
  onCallEnd: (durationSeconds: number) => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({ lead, onCallEnd }) => {
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [hasDialedNative, setHasDialedNative] = useState(false);

  // Clean phone number for tel: protocol (remove spaces and special chars except +)
  const cleanPhone = lead.mobile.replace(/[^0-9+]/g, '');

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerNativeDial = () => {
    setHasDialedNative(true);
    // Trigger native Android / mobile cellular dialer
    window.location.href = `tel:${cleanPhone}`;
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    onCallEnd(Math.max(seconds, 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-white text-center shadow-2xl space-y-5 relative overflow-hidden">
        
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Call status header */}
        <div className="space-y-1 pt-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {hasDialedNative ? 'SIM Cellular Call Dialed' : 'Active Call Session'}
          </div>
          <div className="text-3xl font-mono font-extrabold text-slate-100 tracking-wider mt-2">
            {formatTime(seconds)}
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-2 py-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/30">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">{lead.customerName}</h2>
          <p className="text-sm font-mono text-emerald-300 font-semibold">{lead.mobile}</p>
          <div className="text-xs text-slate-400 font-medium">
            Product: <span className="text-amber-300 font-semibold">{lead.product}</span> {lead.city ? `(${lead.city})` : ''}
          </div>
        </div>

        {/* Direct Mobile SIM Dialing Button */}
        <div className="space-y-2">
          <a
            href={`tel:${cleanPhone}`}
            onClick={triggerNativeDial}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-98 border border-emerald-400/30"
          >
            <Smartphone className="w-4 h-4 text-emerald-200" />
            <span>Dial via Android Phone SIM ({cleanPhone})</span>
            <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
          </a>
          <p className="text-[10px] text-slate-400">
            Tap button above to trigger your phone&apos;s native SIM dialer instantly.
          </p>
        </div>

        {/* Audio Wave Visualizer */}
        <div className="flex items-center justify-center gap-1.5 h-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-emerald-400/80 rounded-full animate-bounce"
              style={{
                height: `${Math.floor(Math.random() * 16) + 6}px`,
                animationDelay: `${(i % 5) * 0.15}s`,
                animationDuration: '0.8s',
              }}
            />
          ))}
        </div>

        {/* In-call Action Controls */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all ${
              isMuted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="text-[11px]">{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          <button
            type="button"
            onClick={handleEndCall}
            className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-600/40 transition-transform active:scale-95 cursor-pointer"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wide">End & Log</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSpeaker(!isSpeaker)}
            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-all ${
              isSpeaker ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isSpeaker ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px]">{isSpeaker ? 'Speaker' : 'Earpiece'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};

