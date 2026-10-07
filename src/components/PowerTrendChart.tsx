import React, { useMemo, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Home, Sun } from 'lucide-react';

interface TrendPoint {
  timestamp: number;
  time: string;
  house: number;
  solar: number;
}

interface PowerTrendChartProps {
  housePower: number;
  solarPower: number;
  houseUnit?: string;
  solarUnit?: string;
}

const STORAGE_KEY = 'energy_dashboard_12h_power_trend_v1';
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const BUCKET_MS = 30 * 60 * 1000; // 30-minute intervals across 12 hours (25 points)

function formatTimeLabel(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function generateBaselinePoint(ts: number, currentHouse: number, currentSolar: number): { house: number; solar: number } {
  const date = new Date(ts);
  const hourFloat = date.getHours() + date.getMinutes() / 60;

  // Deterministic pseudo-variation based on 30-min bucket index
  const bucketIndex = Math.floor(ts / BUCKET_MS);
  const wave1 = Math.sin(bucketIndex * 0.85);
  const wave2 = Math.cos(bucketIndex * 1.35);

  // Solar bell curve between 07:00 and 19:30 peaking around 13:15
  let solarEstimate = 0;
  if (hourFloat >= 7 && hourFloat <= 19.5) {
    const daylightProgress = (hourFloat - 7) / 12.5;
    const bell = Math.sin(daylightProgress * Math.PI);
    const peakReference = Math.max(currentSolar * 1.4, 2600);
    solarEstimate = Math.max(0, Math.round(peakReference * Math.pow(bell, 1.35) * (0.88 + 0.12 * wave1)));
  }

  // House consumption baseline with morning & evening peaks
  const baseLoad = Math.max(450, Math.min(currentHouse * 0.65, 1600));
  const morningPeak = hourFloat >= 6.5 && hourFloat <= 9.5 ? 750 : 0;
  const eveningPeak = hourFloat >= 17 && hourFloat <= 22 ? 1150 : 0;
  const middayActivity = hourFloat > 9.5 && hourFloat < 17 ? 450 : 0;
  const jitter = Math.round((wave1 * 220) + (wave2 * 140));
  const houseEstimate = Math.max(180, Math.round(baseLoad + morningPeak + eveningPeak + middayActivity + jitter));

  return { house: houseEstimate, solar: solarEstimate };
}

export const PowerTrendChart: React.FC<PowerTrendChartProps> = ({
  housePower,
  solarPower,
  houseUnit = 'W',
  solarUnit = 'W',
}) => {
  const [recordedPoints, setRecordedPoints] = useState<Record<number, { house: number; solar: number }>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const cutoff = Date.now() - TWELVE_HOURS_MS - BUCKET_MS;
      const filtered: Record<number, { house: number; solar: number }> = {};
      for (const [k, v] of Object.entries(parsed)) {
        const ts = Number(k);
        if (ts >= cutoff && v && typeof v === 'object') {
          filtered[ts] = v as { house: number; solar: number };
        }
      }
      return filtered;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const now = Date.now();
    const currentBucket = Math.floor(now / BUCKET_MS) * BUCKET_MS;
    const cleanHouse = Math.round(Number(housePower) || 0);
    const cleanSolar = Math.round(Number(solarPower) || 0);

    setRecordedPoints((prev) => {
      const cutoff = now - TWELVE_HOURS_MS - BUCKET_MS;
      const next: Record<number, { house: number; solar: number }> = {};
      for (const [k, v] of Object.entries(prev)) {
        const ts = Number(k);
        if (ts >= cutoff) {
          next[ts] = v;
        }
      }
      next[currentBucket] = { house: cleanHouse, solar: cleanSolar };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
      return next;
    });
  }, [housePower, solarPower]);

  const chartData: TrendPoint[] = useMemo(() => {
    const now = Date.now();
    const currentBucket = Math.floor(now / BUCKET_MS) * BUCKET_MS;
    const cleanHouse = Math.round(Number(housePower) || 0);
    const cleanSolar = Math.round(Number(solarPower) || 0);

    const points: TrendPoint[] = [];
    const totalBuckets = 24; // 24 * 30min = 12 hours

    for (let i = totalBuckets; i >= 0; i--) {
      const bucketTs = currentBucket - i * BUCKET_MS;
      if (i === 0) {
        points.push({
          timestamp: now,
          time: formatTimeLabel(now),
          house: cleanHouse,
          solar: cleanSolar,
        });
      } else if (recordedPoints[bucketTs]) {
        points.push({
          timestamp: bucketTs,
          time: formatTimeLabel(bucketTs),
          house: recordedPoints[bucketTs].house,
          solar: recordedPoints[bucketTs].solar,
        });
      } else {
        const synthetic = generateBaselinePoint(bucketTs, cleanHouse, cleanSolar);
        points.push({
          timestamp: bucketTs,
          time: formatTimeLabel(bucketTs),
          house: synthetic.house,
          solar: synthetic.solar,
        });
      }
    }

    return points;
  }, [housePower, solarPower, recordedPoints]);

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 shadow-sm border bg-white border-slate-200">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">
            12-Hour Power Trend
          </div>
          <div className="text-xs font-medium text-slate-400">
            House consumption vs. Solar production
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
          <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl">
            <Home size={13} strokeWidth={2.5} className="text-slate-600" />
            <span>{Math.round(Number(housePower) || 0)} {houseUnit}</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xl">
            <Sun size={13} strokeWidth={2.5} className="text-amber-500" />
            <span>{Math.round(Number(solarPower) || 0)} {solarUnit}</span>
          </div>
        </div>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              interval={5}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.08)',
                fontSize: '12px',
                fontWeight: 700,
              }}
              labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 800 }}
              formatter={(value: any, name: string) => [
                `${value} W`,
                name === 'house' ? 'House' : 'Solar',
              ]}
            />
            <Line
              type="monotone"
              dataKey="house"
              name="house"
              stroke="#334155"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#334155', stroke: '#ffffff', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="solar"
              name="solar"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-3 pt-2 border-t border-slate-100 text-xs font-bold text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 rounded-full bg-slate-700 inline-block"></span>
          <span>House (W)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-1 rounded-full bg-amber-500 inline-block"></span>
          <span>Solar (W)</span>
        </div>
      </div>
    </div>
  );
};
