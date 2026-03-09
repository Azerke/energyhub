import React, { useState, useEffect } from 'react';
import { Home, Sun, Battery, BatteryCharging, Car, Droplets, X, Calendar, WifiOff, AlertCircle } from 'lucide-react';

const API_URL_EVDATA = 'https://100.74.104.126:1881/evdata';
const API_URL_SOLARDATA = 'https://100.74.104.126:1881/solardata';

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
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
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
                  <div className="flex items-baseline gap-2 mb-1">
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

  const batteryStatus = evData?.battery?.status?.value?.toLowerCase() || '';
  const isBatteryCharging = batteryStatus.includes('laad') || batteryStatus.includes('charg');
  const isBatteryDischarging = batteryStatus.includes('ontlaad') || batteryStatus.includes('discharg');

  let batteryBarColor = 'bg-slate-400';
  let batteryTextColor = 'text-slate-700';
  let batteryIconColor = 'text-slate-600';

  if (isBatteryCharging) {
    batteryBarColor = 'bg-emerald-400';
    batteryTextColor = 'text-emerald-700';
    batteryIconColor = 'text-emerald-600';
  } else if (isBatteryDischarging) {
    batteryBarColor = 'bg-blue-400';
    batteryTextColor = 'text-blue-700';
    batteryIconColor = 'text-blue-600';
  }

  const summaryText = evData?.forecast?.summary?.value || '';
  const summaryChars = Array.from(summaryText.trim()) as string[];
  const firstChar = summaryChars[0] || '';
  const isEmoji = firstChar && !/^[a-zA-Z0-9\s]$/.test(firstChar);
  const forecastEmoji = isEmoji ? firstChar : '🌞';
  const summaryWithoutEmoji = isEmoji ? summaryChars.slice(1).join('').trim() : summaryText;

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
        <header className="flex items-center justify-between mb-6 px-1">
          <h1 
            className="text-2xl font-black tracking-tight text-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => window.location.href = 'https://100.74.104.126:1881/evdata'}
          >
            Energy
          </h1>
          {error ? (
            <div className="text-xs font-bold px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1.5 shadow-sm">
              <WifiOff size={14} strokeWidth={2.5} />
              Offline
            </div>
          ) : (
            <div className="text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1.5 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Live
            </div>
          )}
        </header>

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium p-3 rounded-2xl flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Top Row: Grid and Solar */}
        <div className="grid grid-cols-2 gap-4">
          <Card onClick={() => window.location.href = 'https://100.74.104.126:1881/dashboard/page1'} className="bg-white border-slate-200 col-span-1">
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 text-slate-100">
              <Home size={140} strokeWidth={1} />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
              <div>
                <div className="text-sm font-bold text-slate-400 mb-0.5 uppercase tracking-wider">House</div>
                <div className="text-3xl font-black text-slate-800 tracking-tight">
                  {formatValue(evData?.grid?.ac_power?.value)} <span className="text-lg font-bold text-slate-400">{evData?.grid?.ac_power?.unit}</span>
                </div>
              </div>
              <div className="flex justify-between items-end mt-4">
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
                <div className="text-3xl font-black text-amber-600 tracking-tight">
                  {formatValue(evData?.solar?.total_power?.value)} <span className="text-lg font-bold text-amber-600/70">{evData?.solar?.total_power?.unit}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-end">
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
            <div className="flex items-center gap-4">
              <div className="w-3/4">
                <div className="flex items-center gap-2 mb-2">
                  {isBatteryCharging ? (
                    <BatteryCharging size={20} className={batteryIconColor} strokeWidth={2.5} />
                  ) : (
                    <Battery size={20} className={batteryIconColor} strokeWidth={2.5} />
                  )}
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Battery</span>
                </div>
                <div className="relative h-10 bg-slate-100 rounded-xl overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full ${batteryBarColor} transition-all duration-500 flex items-center px-3`}
                    style={{ width: `${evData?.battery?.soc?.value || 0}%` }}
                  >
                    <span className="text-lg font-black text-white drop-shadow-sm">
                      {formatValue(evData?.battery?.soc?.value)}%
                    </span>
                  </div>
                  {(evData?.battery?.soc?.value || 0) < 15 && (
                    <div className="absolute top-0 left-0 h-full w-full flex items-center px-3">
                      <span className={`text-lg font-black ${batteryTextColor} ml-10`}>
                        {formatValue(evData?.battery?.soc?.value)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-1/4 text-right flex flex-col justify-end h-full pt-6">
                <div className="text-xs font-bold text-slate-400 mb-0.5 uppercase tracking-wider truncate">{evData?.battery?.status?.value}</div>
                <div className="text-xl font-bold text-slate-700">
                  {formatValue(evData?.battery?.power?.value)} <span className="text-sm font-bold text-slate-500">{evData?.battery?.power?.unit}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Third Row: EV and Boiler */}
        <div className="grid grid-cols-2 gap-4">
          <Card onClick={() => setSelectedSection('ev')} className={`${getEvCardStyles()} col-span-1`}>
            <div className="flex flex-col h-full justify-between min-h-[110px]">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-xl shadow-sm ${getEvIconStyles()}`}>
                  <Car size={20} strokeWidth={2.5} />
                </div>
                <span className={`text-sm font-bold uppercase tracking-wider ${evState === 'idle' ? 'text-slate-400' : 'opacity-70'}`}>EV Charger</span>
              </div>
              <div>
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

          <Card onClick={() => setSelectedSection('boiler')} className={`${getBoilerCardStyles()} col-span-1`}>
            <div className="flex flex-col h-full justify-between min-h-[110px]">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-xl shadow-sm ${getBoilerIconStyles()}`}>
                  <Droplets size={20} strokeWidth={2.5} />
                </div>
                <span className={`text-sm font-bold uppercase tracking-wider ${boilerIdle ? 'text-slate-400' : 'opacity-70'}`}>Boiler</span>
              </div>
              <div>
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
                <div className="text-lg font-bold text-indigo-700 leading-tight">
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
                <div className="text-xs font-bold text-amber-700/50 mb-1">{displayDate}</div>
                <div className="flex items-baseline gap-1">
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
    </div>
  );
}
