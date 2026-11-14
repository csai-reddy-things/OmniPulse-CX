import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import ChannelSwitcher from '../components/cx/ChannelSwitcher';
import UnifiedThread from '../components/cx/UnifiedThread';
import CustomerOrderSidebar from '../components/cx/CustomerOrderSidebar';
import { 
  Send, 
  Sparkles, 
  Mail, 
  MessageSquare, 
  MessageCircle, 
  AlertCircle,
  Paperclip,
  CheckCircle2
} from 'lucide-react';

export const CustomerCxHubPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [actions, setActions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customerProfile, setCustomerProfile] = useState(profile);
  
  const [activeChannel, setActiveChannel] = useState(profile?.preferred_channel || 'web_chat');
  const [emailSubject, setEmailSubject] = useState('');
  const [inputContent, setInputContent] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [simulatingOrderId, setSimulatingOrderId] = useState(null);
  const [errorNotice, setErrorNotice] = useState('');

  // Fetch unified conversation and orders on mount
  useEffect(() => {
    fetchActiveConversation();
  }, []);

  const fetchActiveConversation = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get('/conversations/active');
      setConversation(res.data.conversation);
      setMessages(res.data.messages || []);
      setActions(res.data.actions || []);
      setOrders(res.data.orders || []);
      if (res.data.profile) {
        setCustomerProfile(res.data.profile);
        if (!activeChannel) {
          setActiveChannel(res.data.profile.preferred_channel || 'web_chat');
        }
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
      setErrorNotice('Could not connect to database conversation thread.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = inputContent.trim();
    if (!trimmed || isTyping) return;

    setErrorNotice('');

    // Optimistic customer message
    const tempCustomerMsg = {
      id: `temp-${Date.now()}`,
      sender_type: 'customer',
      channel: activeChannel,
      email_subject: activeChannel === 'email' ? (emailSubject.trim() || 'Customer Support Inquiry') : null,
      content: trimmed,
      metadata: { channel: activeChannel },
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempCustomerMsg]);
    setInputContent('');
    if (activeChannel === 'email') setEmailSubject('');
    setIsTyping(true);

    try {
      const res = await axiosClient.post('/conversations/message', {
        content: trimmed,
        channel: activeChannel,
        email_subject: activeChannel === 'email' ? (tempCustomerMsg.email_subject) : undefined
      });

      const { customer_message, ai_message, action, updated_orders } = res.data;

      // Replace temp customer message with saved DB message and add AI reply
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempCustomerMsg.id);
        return [...withoutTemp, customer_message, ai_message];
      });

      if (action) {
        setActions((prev) => [...prev, action]);
      }

      if (updated_orders) {
        setOrders(updated_orders);
      }

      // Refresh customer profile to reflect credits if any action modified wallet
      refreshProfile();
    } catch (err) {
      console.error('Error sending message:', err);
      setErrorNotice(err.response?.data?.error || 'Failed to receive AI response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSimulateDelay = async (orderId) => {
    try {
      setSimulatingOrderId(orderId);
      setErrorNotice('');

      const res = await axiosClient.post(`/orders/${orderId}/simulate-delay`);
      const { order, proactive_message, action } = res.data;

      // Update orders state
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));

      // Append proactive retention alert to thread
      if (proactive_message) {
        setMessages((prev) => [...prev, proactive_message]);
      }

      if (action) {
        setActions((prev) => [...prev, action]);
      }

      // Refresh profile to reflect new goodwill credit balance
      await refreshProfile();
      const profRes = await axiosClient.get('/auth/me');
      if (profRes.data.profile) setCustomerProfile(profRes.data.profile);
    } catch (err) {
      console.error('Simulate delay error:', err);
      setErrorNotice(err.response?.data?.error || 'Failed to simulate carrier delay.');
    } finally {
      setSimulatingOrderId(null);
    }
  };

  const handleSelectOrderForAi = (orderNumber) => {
    setInputContent(`Where is my order #${orderNumber}? I need tracking details and delivery window.`);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      
      {/* Main Omnichannel Chat Thread Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900/40">
        
        {/* Interactive Channel Switcher */}
        <ChannelSwitcher
          activeChannel={activeChannel}
          onSelectChannel={(ch) => setActiveChannel(ch)}
        />

        {/* Error Banner if any */}
        {errorNotice && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 text-xs text-rose-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice('')}
              className="text-xs hover:underline text-rose-300 font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Unified Cross-Channel Conversation Stream */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400">Loading continuous omnichannel timeline...</p>
            </div>
          </div>
        ) : (
          <UnifiedThread
            messages={messages}
            actions={actions}
            isTyping={isTyping}
            currentChannel={activeChannel}
          />
        )}

        {/* Channel-Aware Message Composer */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto space-y-2">
            
            {/* Optional Email Subject Header input when Email is active */}
            {activeChannel === 'email' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-500/30 text-xs">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject: (e.g., Delivery Reschedule Request for #ORD-1042)"
                  maxLength={255}
                  className="w-full bg-transparent text-amber-200 placeholder-slate-500 focus:outline-none"
                />
              </div>
            )}

            {/* Input Composer Box */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-700/80 focus-within:border-indigo-500 transition-colors p-2 shadow-inner">
              <textarea
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  activeChannel === 'whatsapp'
                    ? 'Type WhatsApp message... (Press Enter to send)'
                    : activeChannel === 'email'
                    ? 'Compose email body... (Press Enter to send)'
                    : 'Ask anything about your orders, refunds, tracking, or rescheduling...'
                }
                rows={2}
                maxLength={2000}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 resize-none focus:outline-none px-2 py-1"
              />

              <div className="flex items-center justify-between pt-1 px-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px]">
                    {inputContent.length}/2000
                  </span>
                  <span className="hidden sm:inline text-slate-500">
                    &bull; Active: <strong className="text-slate-300 capitalize">{activeChannel.replace('_', ' ')}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!inputContent.trim() || isTyping}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                      !inputContent.trim() || isTyping
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : activeChannel === 'whatsapp'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        : activeChannel === 'email'
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    }`}
                  >
                    <span>{isTyping ? 'Thinking...' : 'Send'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Customer 360 & Active Orders Sidebar */}
      <CustomerOrderSidebar
        profile={customerProfile || profile}
        orders={orders}
        onSimulateDelay={handleSimulateDelay}
        onSelectOrderForAi={handleSelectOrderForAi}
        simulatingOrderId={simulatingOrderId}
      />
    </div>
  );
};

export default CustomerCxHubPage;
