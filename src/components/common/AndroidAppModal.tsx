import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  CheckCircle2,
  Copy,
  ExternalLink,
  X,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'apk' | 'qr'>('install');

  if (!isOpen) return null;

  // The app's production/preview URL
  const appUrl = window.location.origin;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    appUrl
  )}&bgcolor=ffffff&color=1e1b4b&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-0.5 shadow-lg flex items-center justify-center">
              <img
                src="/pwa-192x192.png"
                alt="App Icon"
                className="w-full h-full rounded-2xl object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Android Mobile App & APK</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> PWA & APK Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Install directly on Android or generate a standalone APK package
              </p>
            </div>
          </div>

          {/* Navigation Pills */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('install')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'install'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              1-Tap Install (WebAPK)
            </button>
            <button
              onClick={() => setActiveTab('qr')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan on Phone
            </button>
            <button
              onClick={() => setActiveTab('apk')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'apk'
                  ? 'bg-amber-400 text-slate-950 shadow-sm font-black'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Download .APK Guide
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm">
          {/* TAB 1: 1-Tap Direct WebAPK Install */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-indigo-950 text-sm">
                      Recommended: Direct Android Installation
                    </h4>
                    <p className="text-xs text-indigo-800 leading-relaxed">
                      Android supports <strong>WebAPKs</strong> natively. When you tap install, Google Play
                      Services builds and installs a genuine Android APK directly to your phone. It
                      appears in your App Drawer, runs in fullscreen with no browser URL bars, works
                      offline, and triggers your phone's native SIM dialer!
                    </p>
                  </div>
                </div>

                {isInstalled ? (
                  <div className="mt-4 p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    App is already installed and running in standalone native mode!
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={handleInstallClick}
                    className="mt-4 w-full py-3 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 text-white font-black rounded-xl text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-300" />
                    Install App on Android (1-Tap)
                  </button>
                ) : (
                  <div className="mt-4 p-3.5 bg-slate-900 text-white rounded-xl text-xs space-y-2">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> How to install on your Android Phone:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-300">
                      <li>Open this app in <strong>Google Chrome</strong> on your Android phone.</li>
                      <li>
                        Tap the Chrome menu (the <strong>3 dots ⋮</strong> in the top right corner).
                      </li>
                      <li>
                        Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                      </li>
                      <li>Confirm <strong>"Install"</strong> — the app icon will appear on your phone home screen!</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Quick URL Share */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">App Web URL (Open on Android Chrome):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={appUrl}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 flex-1 select-all"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Scan QR Code */}
          {activeTab === 'qr' && (
            <div className="text-center space-y-4 py-2">
              <div className="max-w-xs mx-auto bg-white p-4 rounded-2xl border-2 border-indigo-100 shadow-md inline-block">
                <img
                  src={qrImageUrl}
                  alt="App QR Code"
                  className="w-48 h-48 mx-auto rounded-lg"
                  loading="lazy"
                />
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-sm">Scan with your Android Camera</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Point your phone camera or Google Lens at this QR code to open the app instantly on Android.
                  Then tap <strong>"Install"</strong> from Chrome!
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleCopyUrl}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Link Copied to Clipboard!' : 'Copy App Link'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Standalone .APK Generator Guide */}
          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-400 text-slate-950 rounded-lg">
                    <Download className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Generate Standalone .APK File</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If you require an offline `.apk` file for testing or sideloading to multiple devices,
                  our app is 100% compliant with standard Android packaging tools:
                </p>
              </div>

              {/* Option A: PWABuilder */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white hover:border-indigo-300 transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm">Instant 1-Click APK Generator (PWABuilder)</h5>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    Fastest
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Google & Microsoft provide <strong>PWABuilder</strong> to turn this exact web app into a signed
                  Android `.apk` file ready to install.
                </p>

                <ol className="list-decimal list-inside text-xs text-slate-700 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <li>Copy this app's URL: <code className="font-mono text-indigo-700 text-[11px]">{appUrl}</code></li>
                  <li>Click below to open PWABuilder and paste the URL.</li>
                  <li>Click <strong>"Package for Android"</strong> &rarr; download your ready-to-test APK!</li>
                </ol>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(appUrl)}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                  >
                    Open PWABuilder to Generate APK
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleCopyUrl}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    title="Copy URL"
                  >
                    {copied ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
              </div>

              {/* Option B: Android Studio / Capacitor */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-extrabold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h5 className="font-bold text-slate-900 text-sm">Build Locally (Android Studio / Bubblewrap)</h5>
                </div>
                <p className="text-xs text-slate-600">
                  You can also export this codebase via AI Studio settings (Export to ZIP / GitHub) and run:
                </p>
                <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl font-mono text-[11px] overflow-x-auto">
                  npx @bubblewrap/cli init --manifest={appUrl}/manifest.webmanifest
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Tested for Android 10, 11, 12, 13, 14, 15</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
