import React, { useEffect, useRef } from 'react';
import { 
  Bot, 
  User, 
  ShieldCheck, 
  CheckCheck, 
  Mail, 
  MessageSquare, 
  MessageCircle, 
  Sparkles, 
  AlertCircle,
  Clock
} from 'lucide-react';
import ActionConfirmationCard from './ActionConfirmationCard';

export const UnifiedThread = ({ 
  messages = [], 
  actions = [], 
  isTyping = false, 
  currentChannel = 'web_chat' 
}) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getChannelBadge = (channel) => {
    switch (channel) {
      case 'whatsapp':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            <MessageCircle className="w-2.5 h-2.5 text-emerald-400" />
            WhatsApp
          </span>
        );
      case 'email':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            <Mail className="w-2.5 h-2.5 text-amber-400" />
            Email
          </span>
        );
      case 'web_chat':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
            <MessageSquare className="w-2.5 h-2.5 text-indigo-400" />
            Web Chat
          </span>
        );
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/60">
      
      {/* Intro Memory Card */}
      <div className="mx-auto max-w-lg text-center p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-indigo-400 font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>OmniPulse CX Unified Thread</span>
        </div>
        <p className="text-[11px] text-slate-400">
          All messages across Web Chat, WhatsApp, and Email are synchronized into this single continuous memory timeline.
        </p>
      </div>

      {messages.map((msg, index) => {
        const isUser = msg.sender_type === 'customer';
        const isProactive = msg.sender_type === 'system_proactive';
        const isAdmin = msg.sender_type === 'admin';
        const channel = msg.channel || 'web_chat';

        // Parse metadata if needed
        let metadata = {};
        if (typeof msg.metadata === 'string') {
          try { metadata = JSON.parse(msg.metadata); } catch {}
        } else if (msg.metadata) {
          metadata = msg.metadata;
        }

        // Check if there is an associated action
        const matchedAction = actions.find(a => 
          (metadata.action_id && a.id === metadata.action_id) ||
          (metadata.action && a.action_type === metadata.action)
        );

        // System Proactive Alert Style
        if (isProactive) {
          return (
            <div key={msg.id || index} className="my-4 max-w-2xl mx-auto">
              <div className="rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-indigo-950/50 border border-amber-500/40 p-4 shadow-xl shadow-amber-500/5">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Proactive Retention Engine Alert
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getChannelBadge(channel)}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>

                {msg.email_subject && (
                  <div className="text-xs font-semibold text-amber-200 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-400" />
                    <span>Subject: {msg.email_subject}</span>
                  </div>
                )}

                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {msg.content}
                </p>

                {metadata.offered_credit > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                    <span>✨ Pre-approved Goodwill Credit: ₹{metadata.offered_credit} deposited</span>
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Admin Specialist Resolution Style
        if (isAdmin) {
          return (
            <div key={msg.id || index} className="my-3 max-w-2xl mx-auto">
              <div className="rounded-xl bg-purple-950/40 border border-purple-500/40 p-3.5 text-xs text-purple-200 shadow-md">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-purple-500/20">
                  <div className="flex items-center gap-1.5 font-bold text-purple-300">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>CX Leadership Resolution</span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono">{formatTime(msg.created_at)}</span>
                </div>
                <p className="text-sm text-white font-medium">{msg.content}</p>
              </div>
            </div>
          );
        }

        // Channel-specific styling
        return (
          <div
            key={msg.id || index}
            className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
              isUser ? 'ml-auto' : 'mr-auto'
            }`}
          >
            {/* Header info above bubble */}
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {isUser ? 'You' : 'OmniPulse AI'}
              </span>
              {getChannelBadge(channel)}
              <span className="text-[10px] text-slate-400 font-mono">
                {formatTime(msg.created_at)}
              </span>
            </div>

            {/* Bubble Container */}
            <div
              className={`rounded-2xl p-4 text-sm leading-relaxed max-w-xl transition-all shadow-md ${
                isUser
                  ? channel === 'whatsapp'
                    ? 'bg-emerald-900/40 text-emerald-50 border border-emerald-500/30 rounded-tr-sm'
                    : 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-600/10'
                  : channel === 'whatsapp'
                  ? 'bg-slate-900 border border-emerald-500/30 text-slate-100 rounded-tl-sm'
                  : channel === 'email'
                  ? 'bg-slate-900 border border-amber-500/30 text-slate-100 rounded-tl-sm shadow-lg'
                  : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm'
              }`}
            >
              {/* Email subject header if email channel */}
              {channel === 'email' && msg.email_subject && (
                <div className="mb-2 pb-2 border-b border-slate-700/60 text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Subject: {msg.email_subject}</span>
                </div>
              )}

              {/* Message text */}
              <div className="whitespace-pre-line">
                {msg.content}
              </div>

              {/* WhatsApp read receipts tick marks */}
              {channel === 'whatsapp' && (
                <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-emerald-400/80">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
              )}
            </div>

            {/* Inline Action Card if triggered */}
            {metadata.selected_action && metadata.selected_action !== 'none' && (
              <div className="w-full max-w-xl mt-1.5">
                <ActionConfirmationCard
                  actionType={metadata.selected_action}
                  summary={matchedAction?.action_summary || 'Autonomous database action executed.'}
                  payload={matchedAction?.action_payload || metadata.action_params || {}}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 max-w-xs animate-pulse">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-3.5 h-3.5 animate-spin" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200">
              OmniPulse AI is typing...
            </span>
            <span className="text-[10px] text-slate-400">
              Evaluating order state & executing resolutions
            </span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default UnifiedThread;
