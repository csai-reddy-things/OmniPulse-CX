import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import EscalationModal from '../components/admin/EscalationModal';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Filter, 
  RefreshCw, 
  User, 
  MessageSquare, 
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

export const AdminEscalationsPage = () => {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'critical' | 'escalated'
  const [selectedEscalation, setSelectedEscalation] = useState(null);

  useEffect(() => {
    fetchEscalations();
  }, []);

  const fetchEscalations = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/admin/escalations');
      setEscalations(res.data);
    } catch (err) {
      console.error('Failed to fetch escalations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolved = (convId) => {
    setEscalations((prev) => 
      prev.map(item => item.conversation_id === convId ? { ...item, conversation_status: 'resolved', churn_risk_level: 'low' } : item)
    );
  };

  const filtered = escalations.filter(e => {
    if (activeTab === 'critical') return e.churn_risk_level === 'critical' || e.churn_risk_level === 'high';
    if (activeTab === 'escalated') return e.conversation_status === 'escalated';
    return true;
  });

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Human Agent Escalations & Critical Churn Desk
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">
              Priority Human Intervention Queue
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Tickets escalated by AI guardrails due to high frustration, churn risk, or customer manager requests
            </p>
          </div>

          <button
            onClick={fetchEscalations}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition-all self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            All Priority Tickets ({escalations.length})
          </button>
          <button
            onClick={() => setActiveTab('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'critical'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Critical Churn Risk
          </button>
          <button
            onClick={() => setActiveTab('escalated')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'escalated'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Open Escalations
          </button>
        </div>

        {/* Escalation Queue Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-16 text-xs text-slate-400">
              Loading escalation records...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 rounded-2xl bg-slate-900 border border-slate-800 p-8 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Queue Clear</h3>
              <p className="text-xs">No unresolved escalations currently require attention.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isResolved = item.conversation_status === 'resolved';

              return (
                <div
                  key={item.conversation_id}
                  className={`rounded-2xl border p-5 transition-all shadow-xl space-y-4 ${
                    isResolved
                      ? 'bg-slate-900/40 border-slate-800 opacity-75'
                      : item.churn_risk_level === 'critical'
                      ? 'bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border-rose-500/40'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-400">
                        {item.full_name ? item.full_name[0] : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white leading-tight">
                            {item.full_name}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {item.loyalty_tier || 'Gold'} Tier
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {item.email} &bull; Channel: <strong className="text-slate-200 uppercase">{item.active_channel}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.churn_risk_level === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {item.churn_risk_level} Churn Risk
                      </span>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isResolved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {item.conversation_status}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Escalation Trigger
                      </span>
                      <p className="text-slate-200 font-medium">
                        {item.escalation_reason || 'Customer requested senior CX support team.'}
                      </p>
                      {item.admin_resolution_notes && (
                        <p className="text-emerald-400 text-[11px] pt-1 border-t border-slate-800">
                          <strong>Resolution Note:</strong> {item.admin_resolution_notes}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Executive Summary & Ops Fix
                      </span>
                      <p className="text-slate-300">
                        {item.executive_summary || 'Customer experiencing order logistics disruption.'}
                      </p>
                      {item.recommended_ops_action && (
                        <p className="text-amber-300 text-[11px] pt-1 border-t border-slate-800">
                          <strong>Recommended Fix:</strong> {item.recommended_ops_action}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Last contact: {new Date(item.last_message_at).toLocaleString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/customers/${item.user_id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1"
                      >
                        <span>Customer 360</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {!isResolved && (
                        <button
                          onClick={() => setSelectedEscalation(item)}
                          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolve Ticket</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Resolution Modal */}
        {selectedEscalation && (
          <EscalationModal
            escalation={selectedEscalation}
            onClose={() => setSelectedEscalation(null)}
            onResolved={handleResolved}
          />
        )}
      </div>
    </div>
  );
};

export default AdminEscalationsPage;
