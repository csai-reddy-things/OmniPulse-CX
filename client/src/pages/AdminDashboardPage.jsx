import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import KpiGrid from '../components/admin/KpiGrid';
import SentimentTrendChart from '../components/admin/SentimentTrendChart';
import RootCauseBarChart from '../components/admin/RootCauseBarChart';
import ChannelSplitPieChart from '../components/admin/ChannelSplitPieChart';
import OpsRecommendationsFeed from '../components/admin/OpsRecommendationsFeed';
import { 
  BarChart3, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle 
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setIsRefreshing(true);
      const res = await axiosClient.get('/admin/insights/overview');
      setData(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to load admin overview:', err);
      setError('Unable to load executive metrics.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Executive CX Control Center
              </span>
              <span className="text-xs text-slate-400 font-mono">Live PostgreSQL Stream</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
              AI Omnichannel Intelligence & Retention Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous resolution telemetry, sentiment trends, root-cause categorization, and proactive retention ROI
            </p>
          </div>

          <button
            onClick={fetchOverview}
            disabled={isRefreshing}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all shadow-md"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            {error}
          </div>
        )}

        {/* 1. Executive KPI Summary Cards */}
        <KpiGrid kpis={data?.kpis} />

        {/* 2. Recharts Analytical Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SentimentTrendChart data={data?.sentiment_trend} />
          </div>
          <div>
            <ChannelSplitPieChart data={data?.channel_distribution} />
          </div>
        </div>

        <div>
          <RootCauseBarChart data={data?.root_causes} />
        </div>

        {/* 3. AI Operational Intelligence & Recommendations Feed */}
        <OpsRecommendationsFeed recommendations={data?.operational_recommendations} />

      </div>
    </div>
  );
};

export default AdminDashboardPage;
