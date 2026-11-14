import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { Layers } from 'lucide-react';

export const RootCauseBarChart = ({ data = [] }) => {
  const chartData = data.length > 0 ? data : [
    { category: 'Delivery Delay', count: 9, key: 'delivery_delay' },
    { category: 'Reschedule', count: 6, key: 'reschedule_request' },
    { category: 'Refund/Billing', count: 4, key: 'refund_billing' },
    { category: 'Product Inquiry', count: 5, key: 'product_inquiry' },
    { category: 'Damaged Item', count: 2, key: 'damaged_item' },
    { category: 'Wrong Item', count: 1, key: 'wrong_item' },
  ];

  const barColors = ['#ef4444', '#f59e0b', '#6366f1', '#10b981', '#8b5cf6', '#ec4899'];

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col h-[340px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-400" />
            Top Root Causes for Support Contacts
          </h3>
          <p className="text-[11px] text-slate-400">
            AI-categorized issue taxonomy driving operational friction
          </p>
        </div>
        <span className="text-xs text-slate-400 font-mono">Taxonomy Sync</span>
      </div>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="category" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              angle={-20}
              textAnchor="end"
              interval={0}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              allowDecimals={false} 
              tickLine={false} 
              axisLine={false} 
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-800 border border-slate-700 p-2 rounded-xl shadow-xl text-xs space-y-1">
                      <p className="font-semibold text-slate-200">{payload[0].payload.category}</p>
                      <p className="text-indigo-400 font-bold">
                        Incident Volume: {payload[0].value} tickets
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RootCauseBarChart;
