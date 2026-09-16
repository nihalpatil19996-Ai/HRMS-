import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { AndroidAppModal } from './AndroidAppModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'primary' | 'compact' | 'pill';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'primary',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  const handleAction = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Installed App</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <button
          type="button"
          onClick={handleAction}
          className={`px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${className}`}
          title="Install App on Android Mobile / Download APK"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-300" />
          <span>Get Android App / APK</span>
        </button>

        <AndroidAppModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleAction}
        className={`px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${className}`}
      >
        <Smartphone className="w-4 h-4 text-amber-300 animate-pulse" />
        <span>Install on Android / APK</span>
      </button>

      <AndroidAppModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};
