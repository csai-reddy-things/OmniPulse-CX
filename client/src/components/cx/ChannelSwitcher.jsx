import React from 'react';
import { MessageSquare, MessageCircle, Mail, Sparkles, ShieldCheck } from 'lucide-react';

export const ChannelSwitcher = ({ activeChannel, onSelectChannel, unreadCounts = {} }) => {
  const channels = [
    {
      id: 'web_chat',
      label: 'Web Live Chat',
      shortLabel: 'Web Chat',
      icon: MessageSquare,
      color: 'indigo',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      activeClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30',
      inactiveClass: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
      description: 'Instant browser widget with rich order tracking'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Support',
      shortLabel: 'WhatsApp',
      icon: MessageCircle,
      color: 'emerald',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      activeClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30',
      inactiveClass: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
      description: 'Conversational quick updates & mobile read receipts'
    },
    {
      id: 'email',
      label: 'Email Support',
      shortLabel: 'Email',
      icon: Mail,
      color: 'amber',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      activeClass: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30',
      inactiveClass: 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
      description: 'Structured formal records with subject headers'
    }
  ];

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 p-3.5 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Memory continuity indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Unified Omnichannel Memory
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Active Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Switch channels at any time — AI retains full context of orders and earlier messages.
            </p>
          </div>
        </div>

        {/* Channel Segmented Buttons */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-start sm:self-auto">
          {channels.map((ch) => {
            const Icon = ch.icon;
            const isSelected = activeChannel === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => onSelectChannel(ch.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isSelected ? ch.activeClass : ch.inactiveClass
                }`}
                title={ch.description}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`} />
                <span>{ch.shortLabel}</span>
                {unreadCounts[ch.id] > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {unreadCounts[ch.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChannelSwitcher;
