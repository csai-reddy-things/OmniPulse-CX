import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { 
  User, 
  Package, 
  MessageSquare, 
  MessageCircle, 
  Mail, 
  Coins, 
  Crown, 
  ArrowLeft, 
  Clock, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const AdminCustomer360Page = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomer360();
  }, [id]);

  const fetchCustomer360 = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/admin/customers/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load customer 360:', err);
      setError('Customer not found or failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading Customer 360 profile...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 bg-slate-950 p-8 text-center space-y-4">
        <p className="text-sm text-rose-400">{error || 'Customer profile not found.'}</p>
        <Link to="/admin/dashboard" className="text-xs text-indigo-400 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { customer, orders = [], conversations = [], messages = [] } = data;

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Executive Insights</span>
        </Link>

        {/* Customer Header 360 Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-indigo-500/20">
                {customer.full_name ? customer.full_name[0] : 'C'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-white">
                    {customer.full_name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    {customer.loyalty_tier || 'Gold'} Tier
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {customer.email} &bull; {customer.phone_number || '+91 98765 43210'} &bull; {customer.city || 'Bengaluru'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800/80 rounded-xl px-3.5 py-2 border border-slate-700 text-center">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Lifetime Spend
                </span>
                <span className="text-sm font-extrabold text-white font-mono">
                  ₹{Number(customer.lifetime_spend || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="bg-slate-800/80 rounded-xl px-3.5 py-2 border border-emerald-500/30 text-center">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold block">
                  Goodwill Balance
                </span>
                <span className="text-sm font-extrabold text-emerald-300 font-mono">
                  ₹{Number(customer.goodwill_credits || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {customer.persona_notes && (
            <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <strong className="text-indigo-300">Customer Persona Profile: </strong>
              {customer.persona_notes}
            </div>
          )}
        </div>

        {/* 2-Column: Orders & Cross-Channel Transcript */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Customer Orders History */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-400" />
              <span>Customer Transactional Orders ({orders.length})</span>
            </h3>

            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No orders found.</p>
              ) : (
                orders.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-3.5 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-indigo-300 font-bold">{o.order_number}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-700 text-slate-200">
                        {o.status}
                      </span>
                    </div>
                    <div className="text-slate-100 font-semibold">{o.product_name}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Carrier: {o.carrier_name}</span>
                      <span className="text-emerald-400 font-bold">₹{o.total_amount}</span>
                    </div>
                    {o.delay_reason && (
                      <p className="text-[10px] text-rose-400">Delay Reason: {o.delay_reason}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Unified Cross-Channel Transcript */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl space-y-4 flex flex-col h-[500px]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Omnichannel Interaction Transcript ({messages.length})</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {messages.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No messages in thread.</p>
              ) : (
                messages.map((m, idx) => {
                  const isUser = m.sender_type === 'customer';
                  return (
                    <div
                      key={m.id || idx}
                      className={`p-3 rounded-xl text-xs space-y-1 ${
                        isUser
                          ? 'bg-indigo-950/40 border border-indigo-500/30 ml-4'
                          : m.sender_type === 'system_proactive'
                          ? 'bg-amber-950/40 border border-amber-500/30'
                          : 'bg-slate-800/70 border border-slate-700 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="uppercase font-bold text-slate-300">
                          {m.sender_type} &bull; [{m.channel}]
                        </span>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-100 whitespace-pre-line leading-relaxed">
                        {m.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminCustomer360Page;
