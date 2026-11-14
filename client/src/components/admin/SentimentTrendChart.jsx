import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

export const SentimentTrendChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { time: '09:00 AM', sentiment: 0.45, satisfactionPercent: 72 },
    { time: '10:30 AM', sentiment: 0.85, satisfactionPercent: 92 },
    { time: '12:00 PM', sentiment: -0.30, satisfactionPercent: 35 },
    { time: '01:45 PM', sentiment: 0.65, satisfactionPercent: 82 },
    { time: '03:15 PM', sentiment: 0.90, satisfactionPercent: 95 },
  ];

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col h-[340px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Customer Sentiment & Satisfaction Trajectory
          </h3>
          <p className="text-[11px] text-slate-400">
            Real-time sentiment score evaluated across live omnichannel turns
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <TrendingUp className="w-3.5 h-3.5" />
            Live Trend
          </span>
        </div>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              domain={[-1, 1]} 
              tickCount={5} 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value;
                  return (
                    <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-semibold text-slate-200">{payload[0].payload.time}</p>
                      <p className="text-indigo-400 font-mono font-bold">
                        Sentiment Score: {val > 0 ? `+${val}` : val}
                      </p>
                      <p className="text-emerald-400 text-[11px]">
                        Satisfaction Index: {payload[0].payload.satisfactionPercent || Math.round(((val + 1) / 2) * 100)}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="sentiment" 
              stroke="#6366f1" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#sentimentGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SentimentTrendChart;
