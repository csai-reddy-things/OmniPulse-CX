import React from 'react';
import { 
  Smile, 
  Bot, 
  AlertTriangle, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck,
  Zap
} from 'lucide-react';

export const KpiGrid = ({ kpis = {} }) => {
  const {
    avg_sentiment = 0.75,
    automated_resolution_rate = 88,
    high_churn_alerts = 1,
    goodwill_credits_issued = 750,
    total_orders_saved = 14
  } = kpis;

  const sentimentPercent = Math.round(((avg_sentiment + 1) / 2) * 100);

  const cards = [
    {
      title: 'Customer Sentiment Score',
      value: `${(avg_sentiment > 0 ? '+' : '')}${avg_sentiment.toFixed(2)}`,
      subvalue: `${sentimentPercent}% positive sentiment`,
      icon: Smile,
      trend: '+12% vs last week',
      isPositive: true,
      accentColor: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20 text-emerald-400'
    },
    {
      title: 'Automated Resolution Rate',
      value: `${automated_resolution_rate}%`,
      subvalue: 'Zero-touch autonomous resolutions',
      icon: Bot,
      trend: '+5.4% efficiency',
      isPositive: true,
      accentColor: 'from-indigo-500/20 to-indigo-500/5',
      borderColor: 'border-indigo-500/30',
      textColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/20 text-indigo-400'
    },
    {
      title: 'High Churn Alerts',
      value: high_churn_alerts,
      subvalue: 'Urgent human intervention required',
      icon: AlertTriangle,
      trend: high_churn_alerts > 0 ? 'Requires attention' : 'Optimal',
      isPositive: high_churn_alerts === 0,
      accentColor: 'from-rose-500/20 to-rose-500/5',
      borderColor: 'border-rose-500/30',
      textColor: high_churn_alerts > 0 ? 'text-rose-400' : 'text-slate-200',
      iconBg: 'bg-rose-500/20 text-rose-400'
    },
    {
      title: 'Goodwill Credits Disbursed',
      value: `₹${Number(goodwill_credits_issued).toLocaleString('en-IN')}`,
      subvalue: `${total_orders_saved} customer orders saved`,
      icon: Coins,
      trend: 'Proactive retention ROI: 9.2x',
      isPositive: true,
      accentColor: 'from-amber-500/20 to-amber-500/5',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20 text-amber-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.accentColor} bg-slate-900/90 border ${card.borderColor} p-5 shadow-xl shadow-slate-950/40`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-2xl font-extrabold font-mono tracking-tight ${card.textColor}`}>
                {card.value}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-medium mb-2">
              {card.subvalue}
            </p>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-medium">
              {card.isPositive ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>{card.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiGrid;
