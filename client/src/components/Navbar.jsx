import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  MessageSquare, 
  Package, 
  BarChart3, 
  AlertTriangle, 
  LogOut, 
  User, 
  ShieldCheck, 
  Zap,
  Layers
} from 'lucide-react';

export const Navbar = () => {
  const { user, profile, isAuthenticated, isAdmin, isCustomer, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-indigo-400 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
                    OmniPulse
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    CX
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 tracking-wider font-mono">
                  Omnichannel AI & Retention
                </span>
              </div>
            </Link>

            {/* Nav Links for Logged in Users */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
                {isCustomer && (
                  <>
                    <Link
                      to="/cx-hub"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isActive('/cx-hub')
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      CX Hub
                    </Link>

                    <Link
                      to="/orders"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isActive('/orders')
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Package className="w-4 h-4 text-emerald-400" />
                      My Orders
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isActive('/admin/dashboard')
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 text-indigo-400" />
                      Executive Insights
                    </Link>

                    <Link
                      to="/admin/escalations"
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isActive('/admin/escalations')
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Escalations Queue
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                
                {/* Active Role & Loyalty Badge */}
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
                  {isAdmin ? (
                    <div className="flex items-center gap-1.5 text-purple-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      <span className="font-semibold">CX Director</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="font-medium text-slate-300">{profile?.loyalty_tier || 'Gold'} Tier</span>
                      {profile?.goodwill_credits > 0 && (
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-1.5 py-0.5 rounded">
                          ₹{profile.goodwill_credits} Credits
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-slate-200 leading-tight">
                    {user?.full_name || user?.email}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {user?.email}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-700/50 hover:border-rose-500/30 transition-all"
                  title="Sign out of session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
