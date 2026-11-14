import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Coins, 
  Clock 
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export const EscalationModal = ({ escalation, onClose, onResolved }) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!escalation) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (resolutionNotes.trim().length < 3) {
      setError('Resolution notes must be at least 3 characters.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await axiosClient.patch(`/admin/escalations/${escalation.conversation_id}/resolve`, {
        admin_resolution_notes: resolutionNotes.trim()
      });
      onResolved(escalation.conversation_id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit resolution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Resolve Human Escalation Ticket
              </h3>
              <p className="text-xs text-slate-400">
                Conversation ID: {escalation.conversation_id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Customer Summary Card */}
          <div className="bg-slate-800/60 rounded-xl p-3.5 border border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Customer</span>
              <span className="font-bold text-white text-sm">{escalation.full_name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Loyalty Tier</span>
              <span className="font-bold text-amber-300">{escalation.loyalty_tier || 'Gold'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Churn Risk</span>
              <span className="font-bold text-rose-400 uppercase">{escalation.churn_risk_level || 'High'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">Channel</span>
              <span className="font-bold text-indigo-300 uppercase">{escalation.active_channel}</span>
            </div>
          </div>

          {/* AI Escalation Context */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Trigger Reason & AI Executive Summary
            </span>
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 text-xs text-slate-200 space-y-2">
              <p className="font-semibold text-rose-300">
                &bull; Reason: {escalation.escalation_reason || 'Escalated by customer request'}
              </p>
              {escalation.executive_summary && (
                <p className="text-slate-300">
                  <span className="font-medium text-white">AI Summary: </span>
                  {escalation.executive_summary}
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                CX Lead Resolution Notes
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="E.g., Contacted courier depot supervisor. Expedited delivery for 9 AM tomorrow and granted ₹500 VIP apology credit."
                rows={4}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This resolution note will be appended directly to the customer's cross-channel thread.
              </p>
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Resolving...' : 'Confirm & Mark Resolved'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EscalationModal;
