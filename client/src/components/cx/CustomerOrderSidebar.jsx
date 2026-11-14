import React, { useState } from 'react';
import { 
  Package, 
  Crown, 
  Coins, 
  AlertOctagon, 
  Clock, 
  Truck, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const CustomerOrderSidebar = ({
  profile,
  orders = [],
  onSimulateDelay,
  onSelectOrderForAi,
  simulatingOrderId
}) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
            <CheckCircle2 className="w-3 h-3" />
            Delivered
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
            <Truck className="w-3 h-3 animate-pulse" />
            Out for Delivery
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20 uppercase tracking-wide">
            <AlertOctagon className="w-3 h-3" />
            Delayed
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20 uppercase tracking-wide">
            <RotateCcw className="w-3 h-3" />
            Refunded
          </span>
        );
      case 'replacement_dispatched':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
            <Package className="w-3 h-3" />
            Replacement Dispatched
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/20 uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            Processing
          </span>
        );
    }
  };

  return (
    <aside className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden">
      
      {/* 1. Customer Loyalty & Retention Profile Card */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5">
              <div className="w-full h-full bg-slate-900 rounded-[6px] flex items-center justify-center font-bold text-xs text-white">
                {profile?.full_name ? profile.full_name[0] : 'C'}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {profile?.full_name || 'Aarav Sharma'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {profile?.city || 'Bengaluru, IN'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>{profile?.loyalty_tier || 'Gold'} Tier</span>
          </div>
        </div>

        {/* Financial CX Metrics */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
              Lifetime Spend
            </span>
            <span className="text-sm font-extrabold text-white font-mono">
              ₹{Number(profile?.lifetime_spend || 48200).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-emerald-500/30">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium flex items-center gap-1">
              <Coins className="w-3 h-3" />
              Goodwill Wallet
            </span>
            <span className="text-sm font-extrabold text-emerald-300 font-mono">
              ₹{Number(profile?.goodwill_credits || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Orders Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Active Orders ({orders.length})
          </h4>
        </div>
        <span className="text-[10px] text-slate-400">Real-time DB State</span>
      </div>

      {/* 3. Orders Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No active orders found.
          </div>
        ) : (
          orders.map((order) => {
            const isSimulating = simulatingOrderId === order.id;
            const canDelay = order.status !== 'delivered' && order.status !== 'refunded' && order.status !== 'delayed';

            return (
              <div
                key={order.id}
                className="rounded-xl bg-slate-800/70 border border-slate-700/70 p-3.5 hover:border-slate-600 transition-all space-y-2.5"
              >
                {/* Order Top Bar */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-indigo-300">
                        {order.order_number}
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-100 line-clamp-1 mt-0.5">
                      {order.product_name}
                    </h5>
                  </div>
                  <div>
                    {getStatusBadge(order.status)}
                  </div>
                </div>

                {/* Details */}
                <div className="text-[11px] text-slate-400 space-y-0.5 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                  <div className="flex justify-between">
                    <span>Carrier:</span>
                    <span className="text-slate-200 font-medium">{order.carrier_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hub:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[170px]">{order.tracking_hub}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ETA Slot:</span>
                    <span className="text-emerald-400 font-semibold">{order.delivery_slot || '10:00 AM - 2:00 PM'}</span>
                  </div>
                  {order.delay_reason && (
                    <div className="pt-1 text-rose-400 text-[10px] leading-tight">
                      Reason: {order.delay_reason}
                    </div>
                  )}
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex items-center gap-1.5 pt-1">
                  
                  {/* Ask AI Shortcut */}
                  <button
                    type="button"
                    onClick={() => onSelectOrderForAi(order.order_number)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-all"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Ask AI</span>
                  </button>

                  {/* Simulate Delay Trigger */}
                  <button
                    type="button"
                    disabled={!canDelay || isSimulating}
                    onClick={() => onSimulateDelay(order.id)}
                    className={`flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all border ${
                      order.status === 'delayed'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 opacity-70 cursor-not-allowed'
                        : canDelay
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30 shadow-sm'
                        : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                    }`}
                    title={order.status === 'delayed' ? 'Already marked delayed' : 'Simulate carrier logistics delay and trigger AI retention'}
                  >
                    <AlertOctagon className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
                    <span>
                      {isSimulating ? 'Simulating...' : order.status === 'delayed' ? 'Delayed' : 'Simulate Delay'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 text-center">
        Direct mutations to PostgreSQL tables
      </div>
    </aside>
  );
};

export default CustomerOrderSidebar;
