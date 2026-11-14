import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Share2 } from 'lucide-react';

export const ChannelSplitPieChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { name: 'WhatsApp', value: 45, color: '#10b981' },
    { name: 'Web Chat', value: 35, color: '#6366f1' },
    { name: 'Email', value: 20, color: '#f59e0b' },
  ];

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col h-[340px]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-emerald-400" />
            Channel Engagement Distribution
          </h3>
          <p className="text-[11px] text-slate-400">
            Cross-channel message traffic volume
          </p>
        </div>
        <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Omnichannel
        </span>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-800 border border-slate-700 p-2 rounded-xl shadow-xl text-xs space-y-0.5">
                      <p className="font-semibold text-slate-200">{payload[0].name}</p>
                      <p className="text-emerald-400 font-bold">
                        {payload[0].value} Messages ({payload[0].payload.percent ? `${Math.round(payload[0].payload.percent * 100)}%` : ''})
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChannelSplitPieChart;
