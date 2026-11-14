import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, 
  User, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  Mail, 
  ArrowRight,
  AlertCircle 
} from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/cx-hub');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (role) => {
    setError('');
    setLoading(true);

    try {
      const loggedUser = await demoLogin(role);
      if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/cx-hub');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Demo login failed. Please ensure the server database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            OmniPulse <span className="text-indigo-400">CX</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold text-slate-100">
          Sign In to OmniPulse CX
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Continuous omnichannel memory and real-time retention engine
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl space-y-6">
          
          {/* 1-Click Instant Demo Login Buttons */}
          <div className="space-y-2.5">
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                1-Click Frictionless Demo Access
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoAccess('customer')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-900/40 via-indigo-800/30 to-indigo-900/40 hover:from-indigo-800/50 hover:to-indigo-700/50 border border-indigo-500/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-300">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Login as Demo Customer
                    </span>
                    <span className="text-[10px] text-indigo-300">
                      Aarav Sharma &bull; Gold Tier &bull; 4 Active Orders
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoAccess('admin')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-purple-900/40 hover:from-purple-800/50 hover:to-purple-700/50 border border-purple-500/40 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center text-purple-300">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Login as Demo Admin
                    </span>
                    <span className="text-[10px] text-purple-300">
                      Priya Iyer &bull; CX Insights & Escalations Queue
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-medium">
                Or sign in with email
              </span>
            </div>
          </div>

          {/* Standard Email/Password Form */}
          <form className="space-y-4" onSubmit={handleStandardLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-400">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-indigo-400 hover:underline font-semibold">
                Register Customer
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
