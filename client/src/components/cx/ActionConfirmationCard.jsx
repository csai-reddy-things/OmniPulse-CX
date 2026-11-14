import React from 'react';
import { 
  Package, 
  RotateCcw, 
  Calendar, 
  ShieldAlert, 
  Coins, 
  CheckCircle2, 
  Truck, 
  Clock, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export const ActionConfirmationCard = ({ actionType, summary, payload = {} }) => {
  if (!actionType || actionType === 'none') return null;

  // Render variations based on actionType
  switch (actionType) {
    case 'track_order':
      return (
        <div className="my-2.5 rounded-xl bg-slate-800/90 border border-indigo-500/30 p-3.5 shadow-lg text-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <Truck className="w-4 h-4 text-indigo-400" />
              <span>Live Carrier Tracking Record</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-bold uppercase">
              {payload.status || 'Active'}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Order No.</span>
              <span className="font-mono font-semibold text-white">{payload.order_number || '#ORD'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Carrier</span>
              <span className="font-semibold text-white">{payload.carrier_name || 'BlueDart Express'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Current Hub</span>
              <span className="font-medium text-slate-200">{payload.tracking_hub || 'Central Sort Facility'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Estimated Window</span>
              <span className="font-medium text-emerald-400">{payload.delivery_slot || '10:00 AM - 2:00 PM'}</span>
            </div>
          </div>

          <div className="bg-slate-900/60 rounded-lg p-2 text-[11px] text-slate-300 flex items-center gap-1.5 border border-slate-700/40">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Telemetry verified in Supabase PostgreSQL</span>
          </div>
        </div>
      );

    case 'issue_instant_refund':
      return (
        <div className="my-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 p-3.5 shadow-lg text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>Instant Refund Executed</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
              ₹{payload.refund_amount || '100%'}
            </span>
          </div>

          <p className="text-slate-200 text-xs">
            {summary || 'Full refund has been approved and issued back to the customer payment method.'}
          </p>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
            <span>TX ID: {payload.refund_tx_id || 'REF-AUTO-9482'}</span>
            <span className="text-emerald-400 font-medium">Order Status &rarr; Refunded</span>
          </div>
        </div>
      );

    case 'reschedule_delivery':
      return (
        <div className="my-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 p-3.5 shadow-lg text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Delivery Slot Updated</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-200 font-mono text-[10px] font-bold">
              Courier Re-Routed
            </span>
          </div>

          <div className="text-slate-200">
            <p className="font-medium text-white">
              New Date: <span className="text-indigo-300">{payload.new_delivery_date || 'Tomorrow'}</span>
            </p>
            <p className="text-slate-300 text-[11px]">
              Slot: <span className="text-emerald-400 font-semibold">{payload.new_delivery_slot || '10:00 AM - 2:00 PM'}</span>
            </p>
          </div>

          <p className="text-[11px] text-slate-400 border-t border-indigo-500/20 pt-1.5">
            {summary}
          </p>
        </div>
      );

    case 'create_replacement_order':
      return (
        <div className="my-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 p-3.5 shadow-lg text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
            <div className="flex items-center gap-2 text-purple-300 font-semibold">
              <Package className="w-4 h-4 text-purple-400" />
              <span>Complimentary Replacement Dispatched</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-mono text-[11px] font-bold">
              ₹0.00
            </span>
          </div>

          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">New Order Ref:</span>
              <span className="font-mono text-purple-300 font-semibold">{payload.replacement_order_number || 'ORD-REP'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Delivery:</span>
              <span className="text-emerald-400 font-medium">{payload.estimated_delivery || 'Within 48 Hours'}</span>
            </div>
          </div>
        </div>
      );

    case 'apply_goodwill_credit':
      return (
        <div className="my-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 p-3.5 shadow-lg text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Retention Goodwill Credit Credited</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 font-mono text-[11px] font-bold">
              +₹{payload.credit_amount || '250.00'}
            </span>
          </div>

          <p className="text-slate-200 text-xs">
            {summary || 'Retention credit automatically deposited into customer wallet.'}
          </p>
          
          {payload.new_balance && (
            <p className="text-[11px] text-amber-400 font-mono">
              Total Goodwill Wallet Balance: ₹{payload.new_balance}
            </p>
          )}
        </div>
      );

    case 'escalate_to_human':
      return (
        <div className="my-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 p-3.5 shadow-lg text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
            <div className="flex items-center gap-2 text-rose-300 font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Escalated to Executive CX Lead</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] uppercase">
              Priority: Critical
            </span>
          </div>

          <p className="text-slate-200 text-xs">
            {summary || 'This conversation has been prioritized into the CX Manager escalation queue.'}
          </p>

          <p className="text-[11px] text-slate-400">
            Routing: <span className="text-rose-300 font-medium">{payload.routed_to || 'Senior Support Desk'}</span>
          </p>
        </div>
      );

    default:
      return (
        <div className="my-2 rounded-lg bg-slate-800 p-2.5 text-xs text-slate-300 border border-slate-700">
          <span className="font-semibold text-indigo-400">{actionType}: </span>
          {summary}
        </div>
      );
  }
};

export default ActionConfirmationCard;
