import React, { useState, useEffect } from 'react';

interface BreakTimerProps {
  startTime?: string;
  className?: string;
  showSeconds?: boolean;
}

export const BreakTimer: React.FC<BreakTimerProps> = ({ startTime, className = '', showSeconds = true }) => {
  const [elapsed, setElapsed] = useState<string>('00m 00s');

  useEffect(() => {
    if (!startTime) {
      setElapsed('00m 00s');
      return;
    }

    const calculateElapsed = () => {
      let startMs = 0;
      if (startTime.includes('T')) {
        startMs = new Date(startTime).getTime();
      } else {
        const today = new Date().toISOString().split('T')[0];
        // Handle HH:mm:ss or HH:mm
        const cleanTime = startTime.trim();
        startMs = new Date(`${today}T${cleanTime}`).getTime();
      }

      if (isNaN(startMs)) {
        setElapsed('Active');
        return;
      }

      const nowMs = Date.now();
      const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));

      const hrs = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;

      const pad = (num: number) => String(num).padStart(2, '0');

      if (hrs > 0) {
        setElapsed(`${hrs}h ${pad(mins)}m ${showSeconds ? pad(secs) + 's' : ''}`.trim());
      } else {
        setElapsed(`${pad(mins)}m ${showSeconds ? pad(secs) + 's' : ''}`.trim());
      }
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime, showSeconds]);

  return <span className={`font-mono ${className}`}>{elapsed}</span>;
};
