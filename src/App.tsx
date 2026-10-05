import React, { useState, useEffect } from 'react';
import { Home, Sun, Car, Droplets, X, Calendar, WifiOff, AlertCircle, WashingMachine, Download, Maximize2, Minimize2 } from 'lucide-react';
import { AnimatedBattery } from './components/AnimatedBattery';
import { usePWAInstall } from './usePWAInstall';

const API_URL_EVDATA = 'https://einstein-victron.taile3356b.ts.net:1881/evdata';
const API_URL_SOLARDATA = 'https://einstein-victron.taile3356b.ts.net:1881/solardata';

const MOCK_EVDATA = {
  "ev": {
    "current_power": { "value": 6, "unit": "W", "description": "Current Power drawn by the EV Charger" },
    "charged_today": { "value": 163.7, "unit": "kWh", "description": "Current total of EV charged kWh of this day" },
    "charged_month": { "value": 205.9, "unit": "kWh", "description": "Current total of EV charged kWh of this month" },
    "total_counter": { "value": 2953.9, "unit": "kWh", "description": "Current total of EV charged kWh (Lifetime)" },
    "start_day": { "value": "2790.2", "unit": "kWh", "description": "Total of EV charged kWh at the end of last day" },
    "start_month": { "value": "2748", "unit": "kWh", "description": "Total of EV charged kWh at the end of last month" },
    "status": { "value": "Idle", "raw_value": 0, "unit": "State", "description": "Charging On or Off" }
  },
  "solar": {
    "total_power": { "value": 2859, "unit": "W", "description": "Sum of both PV Outputs (both DC and grid connected)" },
    "ac_pv_power": { "value": 2024, "unit": "W", "description": "The current PV output from the grid connected PV system" },
    "dc_pv_power": { "value": 835, "unit": "W", "description": "The current PV output from the DC connected PV system" },
    "dc_pv_total": { "value": 6.8, "unit": "W", "description": "The total day PV output from the DC connected PV system in kWh" },
    "ac_pv_totalday": { "value": 3235.5, "unit": "kWh", "description": "The total day PV output from the DC connected PV system in kWh" },
    "total_powerday": { "value": 5.3, "unit": "kWh", "description": "Total Sum of both PV Outputs (both DC and grid connected) in kWh of the day" }
  },
  "grid": {
    "total_power": { "value": 7, "unit": "W", "description": "Total Power drawn from the grid" },
    "setpoint": { "value": 0, "unit": "W", "description": "Current Setting of the Grid Setpoint" },
    "ac_power": { "value": 2201, "unit": "W", "description": "Total Power drawn by the house" },
    "dc_power": { "value": 0, "unit": "W", "description": "Total Power provided by the dc charger" },
    "boilerpower": { "value": 2.1, "unit": "W", "description": "Power drawn by the boiler" },
    "boilerpowerday": { "value": 9645.6, "unit": "W", "description": "Total Power drawn by the boiler today" },
    "boilerpowertotal": { "value": 12895.596, "unit": "W", "description": "Total Power drawn by the boiler since beginning" },
    "boilerpowertotaldaystart": { "value": "3250", "unit": "W", "description": "Total Power drawn by the boiler since beginning at start of day" },
    "waspower": { "value": 0, "unit": "W", "description": "Power drawn by the was" },
    "waspowerday": { "value": 13464.5, "unit": "Wh", "description": "Total Power drawn by the was today" },
    "waspowertotal": { "value": 13464.497, "unit": "W", "description": "Total Power drawn by the was since beginning" },
    "waspowertotaldaystart": { "value": 0, "unit": "W", "description": "Total Power drawn by the was since beginning at start of day" },
    "acpowerday": { "value": 0, "unit": "W", "description": "Total Power drawn by the boiler today" },
    "gridpowerday": { "value": 22683, "unit": "W", "description": "Total Power drawn from grid today" }
  },
  "battery": {
    "soc": { "value": 68, "unit": "%", "description": "Current Battery State of Charge" },
    "status": { "value": "Opladen", "unit": "text", "description": "Current Status of Battery" },
    "power": { "value": 574, "unit": "W", "description": "Current power of Battery" }
  },
  "forecast": {
    "prediction": { "value": "19.36", "unit": "kWh", "description": "Forecast total of both connected PV systems" },
    "summary": { "value": "🌞 Forecast 19.36 kWh = 102.4%", "unit": "Text", "description": "Description of the Forecast (with emoticon and percentage)" }
  },
  "meta": {
    "timestamp": "2026-03-09T10:31:28.650Z",
    "system": "Victron Venus OS via Node-RED"
  }
};

const MOCK_SOLARDATA = {
  "solar": {
    "yield_today_actual": { "value": 5.559887716546655, "unit": "kWh", "date": "09/03/2026", "description": "Actual solar energy produced today so far (from global.PVTotal)" },
    "forecast_today": { "value": "19.36", "unit": "kWh", "date": "09/03/2026", "description": "Total estimated solar yield for today" },
    "forecast_d+1": { "value": 15.06, "unit": "kWh", "date": "10/03/2026", "description": "Total estimated solar yield for tomorrow" },
    "forecast_d+2": { "value": 12.73, "unit": "kWh", "date": "11/03/2026", "description": "Total estimated solar yield for D+2" },
    "forecast_d+3": { "value": 16.93, "unit": "kWh", "date": "12/03/2026", "description": "Total estimated solar yield for D+3" },
    "forecast_d+4": { "value": 12.53, "unit": "kWh", "date": "13/03/2026", "description": "Total estimated solar yield for D+4" },
    "forecast_d+5": { "value": 14.9, "unit": "kWh", "date": "14/03/2026", "description": "Total estimated solar yield for D+5" },
    "forecast_d+6": { "value": 15.99, "unit": "kWh", "date": "15/03/2026", "description": "Total estimated solar yield for D+6" }
  }
};

const formatValue = (val: any) => {
  if (typeof val === 'number') {
    return val % 1 !== 0 ? val.toFixed(1) : val;
  }
  const num = parseFloat(val);
  if (!isNaN(num) && val.toString().trim() === num.toString()) {
     return num % 1 !== 0 ? num.toFixed(1) : num;
  }
  return val;
};

const Card = ({ children, onClick, className = '' }: any) => (
  <div 
    onClick={onClick}
    className={`relative overflow-hidden rounded-3xl p-5 shadow-sm border cursor-pointer transition-transform active:scale-95 ${className}`}
  >
    {children}
  </div>
);

const Modal = ({ isOpen, onClose, title, data }: any) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-0" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 capitalize">{title} Details</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-3">
            {Object.entries(data).map(([key, item]: [string, any]) => {
              if (!item || typeof item !== 'object' || item.value === undefined) return null;
              return (
                <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="flex items-baseline gap-2 mb-1 tabular-nums">
                    <span className="text-xl font-bold text-slate-800">
                      {formatValue(item.value)}
                    </span>
                    {item.unit && <span className="text-sm font-medium text-slate-500">{item.unit}</span>}
                  </div>
                  {item.description && <div className="text-sm text-slate-500 leading-snug">{item.description}</div>}
                  {item.date && <div className="text-xs text-slate-400 mt-2">Date: {item.date}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [evData, setEvData] = useState<any>(null);
  const [solarData, setSolarData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const fetchData = async () => {
    try {
      const [evRes, solarRes] = await Promise.all([
        fetch(API_URL_EVDATA, { cache: 'no-store' }),
        fetch(API_URL_SOLARDATA, { cache: 'no-store' })
      ]);
      
      if (!evRes.ok || !solarRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const evJson = await evRes.json();
      const solarJson = await solarRes.json();
      
      setEvData(evJson);
      setSolarData(solarJson);
      setError(null);
    } catch (err: any) {
      // Fallback to mock data if VPN is not connected or fetch fails
      setEvData(MOCK_EVDATA);
      setSolarData(MOCK_SOLARDATA);
      setError('Offline mode. Ensure VPN is connected, Node-RED has CORS enabled, and the HTTPS certificate is trusted.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement;
      setIsFullscreen(!!fsElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const docEl = document.documentElement as any;
      const doc = document as any;
      const isCurrentlyFs =
        doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;

      if (!isCurrentlyFs) {
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
          await docEl.webkitRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowInstallGuide(true);
  };

  const getModalData = () => {
    if (!selectedSection || !evData) return {};
    
    switch (selectedSection) {
      case 'grid':
        return evData.grid ? Object.fromEntries(Object.entries(evData.grid).filter(([k]) => !k.includes('boiler'))) : {};
      case 'boiler':
        return evData.grid ? Object.fromEntries(Object.entries(evData.grid).filter(([k]) => k.includes('boiler'))) : {};
      case 'solar':
        return { ...(evData.solar || {}), ...(solarData?.solar || {}) };
      case 'battery':
        return evData.battery || {};
      case 'ev':
        return evData.ev || {};
      case 'forecast':
        return { ...(evData.forecast || {}), ...Object.fromEntries(Object.entries(solarData?.solar || {}).filter(([k]) => k.includes('forecast'))) };
      default:
        return {};
    }
  };

  const evDcPower = evData?.grid?.dc_power?.value || 0;
  const evAcPower = evData?.ev?.current_power?.value || 0;

  let evState = 'idle';
  let evDisplayPower = 0;
  let evDisplayUnit = 'W';

  if (evDcPower > 0) {
    evState = 'discharging';
    evDisplayPower = evDcPower;
    evDisplayUnit = evData?.grid?.dc_power?.unit || 'W';
  } else if (evAcPower >= 10) {
    evState = 'charging';
    evDisplayPower = evAcPower;
    evDisplayUnit = evData?.ev?.current_power?.unit || 'W';
  }

  const getEvCardStyles = () => {
    if (evState === 'discharging') return 'bg-emerald-50 border-emerald-100 text-emerald-700';
    if (evState === 'charging') return 'bg-red-50 border-red-100 text-red-700';
    return 'bg-slate-50 border-slate-200 text-slate-500';
  };

  const getEvIconStyles = () => {
    if (evState === 'discharging') return 'bg-emerald-100 text-emerald-600';
    if (evState === 'charging') return 'bg-red-100 text-red-600';
    return 'bg-slate-200 text-slate-500';
  };

  const boilerPower = evData?.grid?.boilerpower?.value || 0;
  const boilerIdle = boilerPower < 5;

  const getBoilerCardStyles = () => {
    if (boilerIdle) return 'bg-slate-50 border-slate-200 text-slate-500';
    return 'bg-rose-50 border-rose-100 text-rose-700';
  };

  const getBoilerIconStyles = () => {
    if (boilerIdle) return 'bg-slate-200 text-slate-500';
    return 'bg-rose-100 text-rose-600';
  };

  const laundryPower = evData?.grid?.waspower?.value || 0;
  const laundryIdle = laundryPower < 5;

  const getLaundryCardStyles = () => {
    if (laundryIdle) return 'bg-slate-50 border-slate-200 text-slate-500';
    return 'bg-blue-50 border-blue-100 text-blue-700';
  };

  const getLaundryIconStyles = () => {
    if (laundryIdle) return 'bg-slate-200 text-slate-500';
    return 'bg-blue-100 text-blue-600';
  };

  const batteryStatus = evData?.battery?.status?.value?.toLowerCase() || '';
  const isBatteryDischarging = batteryStatus.includes('ontlaad') || batteryStatus.includes('discharg');
  const isBatteryCharging = (batteryStatus.includes('laad') || batteryStatus.includes('charg')) && !isBatteryDischarging;

  const summaryText = evData?.forecast?.summary?.value || '';
  const summaryChars = Array.from(summaryText.trim()) as string[];
  const firstChar = summaryChars[0] || '';
  const isEmoji = firstChar && !/^[a-zA-Z0-9\s]$/.test(firstChar);
  const forecastEmoji = isEmoji ? firstChar : '🌞';
  const summaryWithoutEmoji = isEmoji ? summaryChars.slice(1).join('').trim() : summaryText;

  const launchAndroidPackage = (packageName: string, playStoreUrl: string, customSchemeUrl?: string) => {
    const win = window as any;
    if (win.AndroidAppLauncher && typeof win.AndroidAppLauncher.launchApp === 'function') {
      win.AndroidAppLauncher.launchApp(packageName, playStoreUrl);
      return;
    }

    const userAgent = navigator.userAgent || navigator.vendor || win.opera;
    if (/android/i.test(userAgent)) {
      const encodedFallback = encodeURIComponent(playStoreUrl);
      if (customSchemeUrl) {
        const [scheme, rest] = customSchemeUrl.split('://');
        window.location.href = `intent://${rest || ''}#Intent;scheme=${scheme};package=${packageName};S.browser_fallback_url=${encodedFallback};end;`;
      } else {
        window.location.href = `intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;package=${packageName};S.browser_fallback_url=${encodedFallback};end;`;
      }
    } else {
      window.location.href = playStoreUrl;
    }
  };

  const openTailscaleApp = () => {
    launchAndroidPackage(
      'com.tailscale.ipn',
      'https://play.google.com/store/apps/details?id=com.tailscale.ipn',
      'tailscale://ipn'
    );
  };

  const openKiaApp = () => {
    launchAndroidPackage(
      'com.kia.oneapp.eu',
      'https://play.google.com/store/apps/details?id=com.kia.oneapp.eu'
    );
  };

  const openShellyApp = () => {
    const win = window as any;
    if (win.AndroidAppLauncher && typeof win.AndroidAppLauncher.launchApp === 'function') {
      win.AndroidAppLauncher.launchApp('cloud.shelly.smartcontrol', 'https://control.shelly.cloud/');
      return;
    }

    const userAgent = navigator.userAgent || navigator.vendor || win.opera;
    
    if (/iPad|iPhone|iPod/.test(userAgent) && !win.MSStream) {
      // iOS
      window.location.href = 'shellysmartcontrol://';
      setTimeout(() => {
        window.location.href = 'https://apps.apple.com/app/shelly-smart-control/id1658182208';
      }, 1500);
    } else if (/android/i.test(userAgent)) {
      // Android
      window.location.href = 'intent://control.shelly.cloud/#Intent;scheme=https;package=cloud.shelly.smartcontrol;S.browser_fallback_url=https%3A%2F%2Fcontrol.shelly.cloud%2F;end;';
    } else {
      // Desktop / Fallback
      window.location.href = 'https://control.shelly.cloud/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!evData || !solarData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm text-center max-w-sm w-full">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Data Unavailable</h2>
          <p className="text-sm text-slate-600 mb-4">
            Could not load energy data. Please ensure your VPN is connected and the Node-RED server is accessible.
          </p>
          <button 
            onClick={() => { setLoading(true); fetchData(); }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-900 selection:bg-emerald-200">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between gap-2 mb-6 px-1">
          <h1 
            className="text-2xl font-black tracking-tight text-slate-800 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            onClick={() => window.location.href = 'https://einstein-victron.taile3356b.ts.net:1881/evdata'}
          >
            Energy
          </h1>

          <div className="flex items-center gap-2">
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                title="Install standalone app"
                className="min-h-[40px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download size={14} strokeWidth={2.5} />
                <span>Install App</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
              className="min-h-[40px] px-3 py-1.5 bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={14} strokeWidth={2.5} />
                  <span>Exit Full</span>
                </>
              ) : (
                <>
                  <Maximize2 size={14} strokeWidth={2.5} />
                  <span>Full Screen</span>
                </>
              )}
            </button>

            {error ? (
              <button
                onClick={openTailscaleApp}
                title="Open Tailscale App"
                className="min-h-[40px] text-xs font-bold px-3 py-1.5 bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-700 rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-all shadow-sm"
              >
                <WifiOff size={14} strokeWidth={2.5} />
                <span>Offline</span>
              </button>
            ) : (
              <div className="text-xs font-bold px-2.5 py-1.5 text-emerald-700 flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            )}
          </div>
        </header>

        {error && (
          <div
            onClick={openTailscaleApp}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openTailscaleApp(); }}
            className="bg-amber-50 hover:bg-amber-100/80 active:scale-[0.99] border border-amber-200 text-amber-800 text-xs font-medium p-3 rounded-2xl flex items-start gap-2 cursor-pointer transition-all"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{error} Tap here to open Tailscale.</p>
          </div>
        )}

        {/* Top Row: Grid and Solar */}
        <div className="grid grid-cols-2 gap-4">
          <Card onClick={() => window.location.href = 'https://einstein-victron.taile3356b.ts.net:1881/dashboard/page1'} className="bg-white border-slate-200 col-span-1">
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 text-slate-100">
              <Home size={140} strokeWidth={1} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
              <div>
                <div className="text-sm font-bold text-slate-400 mb-0.5 uppercase tracking-wider">House</div>
                <div className="text-3xl font-black text-slate-800 tracking-tight tabular-nums">
                  {formatValue(evData?.grid?.ac_power?.value)} <span className="text-lg font-bold text-slate-400">{evData?.grid?.ac_power?.unit}</span>
                </div>
              </div>
              <div className="flex justify-between items-end mt-4 tabular-nums">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grid</div>
                  <div className="text-lg font-bold text-slate-700">
                    {formatValue(evData?.grid?.total_power?.value)} <span className="text-sm font-bold text-slate-500">{evData?.grid?.total_power?.unit}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Set</div>
                  <div className="text-sm font-bold text-slate-600">
                    {formatValue(evData?.grid?.setpoint?.value)} {evData?.grid?.setpoint?.unit}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card onClick={() => setSelectedSection('solar')} className="bg-amber-50 border-amber-100 col-span-1">
            <div className="absolute -right-10 top-1/2 -translate-y-1/2 text-amber-200/60">
              <Sun size={140} strokeWidth={1} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
              <div>
                <div className="text-sm font-bold text-amber-700/60 mb-0.5 uppercase tracking-wider">Solar</div>
                <div className="text-3xl font-black text-amber-600 tracking-tight tabular-nums">
                  {formatValue(evData?.solar?.total_power?.value)} <span className="text-lg font-bold text-amber-600/70">{evData?.solar?.total_power?.unit}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-end tabular-nums">
                <div>
                  <div className="text-xs font-bold text-amber-700/50 uppercase tracking-wider">Yield</div>
                  <div className="text-lg font-bold text-amber-700">
                    {solarData?.solar?.yield_today_actual?.value ? formatValue(solarData.solar.yield_today_actual.value) : '--'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-amber-700/50 uppercase tracking-wider">Forecast</div>
                  <div className="text-sm font-bold text-amber-700/80">
                    {solarData?.solar?.forecast_today?.value ? formatValue(solarData.solar.forecast_today.value) : '--'} kWh
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Second Row: Battery */}
        <div className="grid grid-cols-1">
          <Card onClick={() => setSelectedSection('battery')} className="bg-white border-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <AnimatedBattery 
                  level={evData?.battery?.soc?.value || 0} 
                  state={isBatteryCharging ? 'charging' : isBatteryDischarging ? 'discharging' : 'idle'} 
                  className="w-full h-12" 
                />
              </div>
              <div className="text-right flex flex-col justify-center h-full min-w-[100px] tabular-nums">
                <div className="text-3xl font-black text-slate-800 mb-1">
                  {formatValue(evData?.battery?.soc?.value)}<span className="text-lg text-slate-500">%</span>
                </div>
                <div className="text-sm font-bold text-slate-700">
                  {formatValue(evData?.battery?.power?.value)} <span className="text-xs font-bold text-slate-500">{evData?.battery?.power?.unit}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Third Row: EV, Boiler, Laundry */}
        <div className="grid grid-cols-2 gap-4">
          <Card onClick={openKiaApp} className={`${getEvCardStyles()} col-span-1`}>
            <div className="flex flex-col h-full justify-between min-h-[110px]">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-xl shadow-sm ${getEvIconStyles()}`}>
                  <Car size={20} strokeWidth={2.5} />
                </div>
                <span className={`text-sm font-bold uppercase tracking-wider ${evState === 'idle' ? 'text-slate-400' : 'opacity-70'}`}>EV Charger</span>
              </div>
              <div className="tabular-nums">
                {evState === 'idle' ? (
                  <div className="text-2xl font-black tracking-tight">Idle</div>
                ) : (
                  <div className="text-2xl font-black tracking-tight">
                    {formatValue(evDisplayPower)} <span className="text-sm font-bold opacity-70">{evDisplayUnit}</span>
                  </div>
                )}
                <div className={`text-xs font-bold mt-1 ${evState === 'idle' ? 'text-slate-400' : 'opacity-70'}`}>
                  {evState === 'discharging' ? 'Discharging (V2G)' : evData?.ev?.status?.value}
                </div>
              </div>
            </div>
          </Card>

          <Card onClick={openShellyApp} className={`${getBoilerCardStyles()} col-span-1`}>
            <div className="flex flex-col h-full justify-between min-h-[110px]">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-xl shadow-sm ${getBoilerIconStyles()}`}>
                  <Droplets size={20} strokeWidth={2.5} />
                </div>
                <span className={`text-sm font-bold uppercase tracking-wider ${boilerIdle ? 'text-slate-400' : 'opacity-70'}`}>Boiler</span>
              </div>
              <div className="tabular-nums">
                {boilerIdle ? (
                  <div className="text-2xl font-black tracking-tight">Idle</div>
                ) : (
                  <div className="text-2xl font-black tracking-tight">
                    {formatValue(boilerPower)} <span className="text-sm font-bold opacity-70">{evData?.grid?.boilerpower?.unit}</span>
                  </div>
                )}
                <div className={`text-xs font-bold mt-1 ${boilerIdle ? 'text-slate-400' : 'opacity-70'}`}>
                  Today: {formatValue(evData?.grid?.boilerpowerday?.value)} {evData?.grid?.boilerpowerday?.unit}
                </div>
              </div>
            </div>
          </Card>

          <Card onClick={openShellyApp} className={`${getLaundryCardStyles()} col-span-1`}>
            <div className="flex flex-col h-full justify-between min-h-[110px]">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-xl shadow-sm ${getLaundryIconStyles()}`}>
                  <WashingMachine size={20} strokeWidth={2.5} />
                </div>
                <span className={`text-sm font-bold uppercase tracking-wider ${laundryIdle ? 'text-slate-400' : 'opacity-70'}`}>Laundry</span>
              </div>
              <div className="tabular-nums">
                {laundryIdle ? (
                  <div className="text-2xl font-black tracking-tight">Idle</div>
                ) : (
                  <div className="text-2xl font-black tracking-tight">
                    {formatValue(laundryPower)} <span className="text-sm font-bold opacity-70">{evData?.grid?.waspower?.unit || 'W'}</span>
                  </div>
                )}
                <div className={`text-xs font-bold mt-1 ${laundryIdle ? 'text-slate-400' : 'opacity-70'}`}>
                  Today: {formatValue(evData?.grid?.waspowerday?.value)} {evData?.grid?.waspowerday?.unit || 'Wh'}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Fourth Row: Forecast */}
        <div className="grid grid-cols-1">
          <Card onClick={() => setSelectedSection('forecast')} className="bg-indigo-50 border-indigo-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 shadow-sm flex items-center justify-center text-2xl w-12 h-12">
                {isEmoji ? forecastEmoji : <Calendar size={28} strokeWidth={2.5} />}
              </div>
              <div>
                <div className="text-sm font-bold text-indigo-700/60 mb-0.5 uppercase tracking-wider">Forecast</div>
                <div className="text-lg font-bold text-indigo-700 leading-tight tabular-nums">
                  {summaryWithoutEmoji}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Fifth Row: 6-Day Forecast */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((dayOffset) => {
            const forecastData = solarData?.solar?.[`forecast_d+${dayOffset}`];
            if (!forecastData) return null;
            
            // Format date from "10/03/2026" to "10/03"
            const dateParts = forecastData.date?.split('/');
            const displayDate = dateParts?.length >= 2 ? `${dateParts[0]}/${dateParts[1]}` : `Day +${dayOffset}`;
            
            let dayName = '';
            if (dateParts?.length === 3) {
              const dateObj = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
              dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            }
            
            return (
              <Card key={dayOffset} onClick={() => setSelectedSection('forecast')} className="bg-amber-50/50 border-amber-100/50 p-3 flex flex-col items-center justify-center text-center">
                <div className="text-sm font-bold text-amber-700/80 mb-0.5">{dayName}</div>
                <div className="text-xs font-bold text-amber-700/50 mb-1 tabular-nums">{displayDate}</div>
                <div className="flex items-baseline gap-1 tabular-nums">
                  <div className="text-xl font-black text-amber-700">
                    {formatValue(forecastData.value)}
                  </div>
                  <div className="text-[10px] font-bold text-amber-700/60 uppercase">kWh</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Modal 
        isOpen={!!selectedSection} 
        onClose={() => setSelectedSection(null)} 
        title={selectedSection}
        data={getModalData()}
      />

      {showInstallGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => setShowInstallGuide(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-800">Install Standalone App</h2>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                <p>To install Energy Dashboard as a standalone app on iPhone or iPad:</p>
                <ol className="list-decimal list-inside space-y-2 font-medium text-slate-700">
                  <li>Tap the <strong>Share</strong> button in Safari&apos;s toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                <p>
                  To install as a full standalone Android app (without the Chrome address bar):
                </p>
                <ol className="list-decimal list-inside space-y-2 font-medium text-slate-700">
                  <li>
                    If you previously created a home screen shortcut, <strong>remove the old shortcut</strong> from your phone&apos;s home screen first.
                  </li>
                  <li>
                    Make sure you clicked <strong>Share</strong> in AI Studio to publish the latest update, then reload this page in Chrome.
                  </li>
                  <li>
                    Tap Chrome&apos;s <strong>⋮ menu → Add to Home screen → Install</strong>, or tap <strong>Full Screen</strong> below to immediately hide Chrome&apos;s bars.
                  </li>
                </ol>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowInstallGuide(false);
                  toggleFullscreen();
                }}
                className="flex-1 min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Maximize2 size={16} />
                <span>Enter Full Screen Now</span>
              </button>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="min-h-[44px] py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
