import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  MessageSquare, 
  MessageCircle, 
  Mail, 
  Zap, 
  ShieldCheck, 
  RotateCcw, 
  Truck, 
  Calendar, 
  BarChart3, 
  ArrowRight,
  Database,
  Bot,
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();

  const pillars = [
    {
      icon: MessageSquare,
      title: 'Persistent Omnichannel Memory',
      description: 'Unified conversation context across Web Chat, WhatsApp, and Email. Customers switch channels seamlessly without repeating their problem.',
      accent: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
    },
    {
      icon: Zap,
      title: 'Autonomous Support Actions',
      description: 'Powered by Google Gemini to execute real transactional mutations in Supabase: instant refunds, delivery slot rescheduling, and zero-cost replacements.',
      accent: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
    },
    {
      icon: HeartHandshake,
      title: 'Proactive Disruption & Retention',
      description: 'Detects carrier transit delays and initiates empathetic outreach across preferred channels with pre-approved goodwill credits before the customer complains.',
      accent: 'border-amber-500/30 bg-amber-500/10 text-amber-400'
    },
    {
      icon: BarChart3,
      title: 'Executive Intelligence & Recharts',
      description: 'Real-time operational business intelligence dashboard visualizing customer sentiment trajectories, root-cause categorization, and churn risk queues.',
      accent: 'border-purple-500/30 bg-purple-500/10 text-purple-400'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.2),rgba(255,255,255,0))] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Next-Generation Omnichannel Customer Experience & Retention</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Stop Bot Frustration. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400">
              Autonomous AI Resolutions
            </span> Across Every Channel.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            OmniPulse CX unifies Web Chat, WhatsApp, and Email into a single persistent memory thread. Empowered by Google Gemini to perform real database mutations and proactively resolve logistics disruptions before churn strikes.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                to={user?.role === 'admin' ? '/admin/dashboard' : '/cx-hub'}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-sm font-bold text-white shadow-xl shadow-indigo-600/25 transition-all"
              >
                <span>Enter {user?.role === 'admin' ? 'Admin Dashboard' : 'CX Hub'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-sm font-bold text-white shadow-xl shadow-indigo-600/25 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch 1-Click Interactive Demo</span>
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-slate-200 border border-slate-700 transition-all"
                >
                  <span>Create Account</span>
                </Link>
              </>
            )}
          </div>

          {/* Tech Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <Bot className="w-3.5 h-3.5 text-indigo-400" />
              Google Gemini 2.5 Flash
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              Supabase PostgreSQL
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Express + Render
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              React + Vite + Vercel
            </span>
          </div>
        </div>
      </section>

      {/* 4 Pillars Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1">
        <div className="text-center mb-16 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
            Engineered for Modern Quick-Commerce & D2C Brands
          </h2>
          <p className="text-3xl font-extrabold text-white">
            Four Core Pillars of OmniPulse CX
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={i}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-4 hover:border-slate-700 transition-all shadow-xl"
              >
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${pillar.accent}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {pillar.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
        OmniPulse CX &bull; Production-Grade AI Customer Experience & Proactive Retention Platform
      </footer>
    </div>
  );
};

export default LandingPage;
