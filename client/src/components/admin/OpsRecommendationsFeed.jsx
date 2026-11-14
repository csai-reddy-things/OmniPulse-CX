import React from 'react';
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  User, 
  Clock 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OpsRecommendationsFeed = ({ recommendations = [] }) => {
  const getChurnBadge = (level) => {
    switch (level) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider animate-pulse">
            Critical Churn Risk
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
            High Risk
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 uppercase tracking-wider">
            Moderate Risk
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
            Low Churn Risk
          </span>
        );
    }
  };

  const getEmotionBadge = (emotion) => {
    switch (emotion) {
      case 'angry':
        return <span className="text-rose-400 font-semibold">😡 Angry</span>;
      case 'frustrated':
        return <span className="text-amber-400 font-semibold">😤 Frustrated</span>;
      case 'confused':
        return <span className="text-yellow-400 font-semibold">🤔 Confused</span>;
      case 'delighted':
        return <span className="text-emerald-300 font-semibold">🤩 Delighted</span>;
      case 'satisfied':
        return <span className="text-emerald-400 font-semibold">😊 Satisfied</span>;
      default:
        return <span className="text-slate-400 font-semibold">😐 Neutral</span>;
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              AI Operational Intelligence & Retention Recommendations
            </h3>
            <p className="text-[11px] text-slate-400">
              Live root-cause solutions synthesized by Gemini to prevent customer churn
            </p>
          </div>
        </div>
        <span className="text-xs text-indigo-400 font-semibold">Automated Insights</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.length === 0 ? (
          <div className="col-span-2 text-center py-8 text-xs text-slate-400">
            No customer operational recommendations logged yet.
          </div>
        ) : (
          recommendations.map((rec) => (
            <div
              key={rec.id}
              className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4 space-y-3 hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                      {rec.full_name ? rec.full_name[0] : 'U'}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block leading-tight">
                        {rec.full_name || 'Customer'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {rec.loyalty_tier || 'Gold'} Tier &bull; {getEmotionBadge(rec.emotion_tag)}
                      </span>
                    </div>
                  </div>
                  <div>{getChurnBadge(rec.churn_risk_level)}</div>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-slate-200">Incident: </span>
                  {rec.executive_summary}
                </p>
              </div>

              {/* Actionable recommendation */}
              <div className="pt-2 border-t border-slate-700/40">
                <div className="flex items-start gap-2 bg-indigo-950/30 border border-indigo-500/20 p-2.5 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-indigo-200">
                    <span className="font-bold text-white block">Recommended Ops Fix:</span>
                    {rec.recommended_ops_action}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(rec.analyzed_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Link
                    to={`/admin/customers/${rec.user_id}`}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <span>Inspect Customer 360</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OpsRecommendationsFeed;
