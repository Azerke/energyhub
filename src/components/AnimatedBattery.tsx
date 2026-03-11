import React, { useState } from 'react';

interface AnimatedBatteryProps {
  level: number; // 0 to 100
  state: 'idle' | 'charging' | 'discharging';
  className?: string;
}

export function AnimatedBattery({ level, state, className = '' }: AnimatedBatteryProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className={`relative flex-1 h-full border-[3px] border-slate-300 rounded-xl p-1 bg-slate-50 shadow-inner overflow-hidden ${state}`}
        style={{ '--battery-level': `${Math.max(0, Math.min(100, level))}%` } as React.CSSProperties}
      >
        <div 
          className="h-full rounded-lg relative overflow-hidden transition-all duration-500 ease-in-out"
          style={{ 
            width: 'var(--battery-level)',
            background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 50%, #10b981 100%)',
            backgroundSize: '200px 100%', // Fixed size so gradient doesn't squish
          }}
        >
          {state !== 'idle' && (
            <div className={`absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent ${state === 'charging' ? 'animate-pulse-charge' : 'animate-pulse-discharge'}`} />
          )}
        </div>
      </div>
      <div className="w-2 h-1/3 min-h-[12px] bg-slate-300 rounded-r-md ml-[2px]" />
    </div>
  );
}

// Optional: A preview component to test it out
export function BatteryPreview() {
  const [level, setLevel] = useState(68);
  const [state, setState] = useState<'idle' | 'charging' | 'discharging'>('idle');

  return (
    <div className="p-8 bg-slate-800 rounded-xl text-white w-80 flex flex-col items-center gap-8">
      <AnimatedBattery level={level} state={state} className="w-full h-16" />
      
      <div className="w-full space-y-4">
        <div className="flex justify-between gap-2">
          <button 
            onClick={() => setState('charging')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${state === 'charging' ? 'bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            Charge
          </button>
          <button 
            onClick={() => setState('idle')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${state === 'idle' ? 'bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            Idle
          </button>
          <button 
            onClick={() => setState('discharging')}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${state === 'discharging' ? 'bg-blue-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            Discharge
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium text-slate-300">Level</label>
            <span className="text-sm font-bold">{level}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={level} 
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
