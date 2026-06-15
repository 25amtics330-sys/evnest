import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, LogIn, Sparkles } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please fill in all fields.');
    }
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      if (result.user.role === 'merchant') {
        navigate('/merchant');
      } else {
        navigate('/');
      }
    } else {
      setError(result.error);
    }
  };

  const loginAsDemo = async (role) => {
    setError('');
    setLoading(true);
    const demoEmail = role === 'merchant' ? 'merchant@evnest.com' : 'driver@evnest.com';
    const demoPassword = 'password123';
    
    setEmail(demoEmail);
    setPassword(demoPassword);

    const result = await login(demoEmail, demoPassword);
    setLoading(false);

    if (result.success) {
      if (role === 'merchant') {
        navigate('/merchant');
      } else {
        navigate('/');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-50">
      {/* Left Column: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">

          {/* Title */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white mb-4">
              <Zap className="h-6 w-6 fill-current" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to your EVNest account</p>
            <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-[11px] text-emerald-700 font-medium max-w-[90%] mx-auto">
              ✨ Demo Mode: Enter any email & password or use the shortcuts below
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="driver@evnest.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-base font-semibold text-white hover:bg-emerald-700 focus:outline-none transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo shortcuts */}
          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 uppercase tracking-widest mb-3">
              <Sparkles className="h-3 w-3" />
              Quick Demo Logins
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => loginAsDemo('user')}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors duration-200"
              >
                🚗 Demo Driver
              </button>
              <button
                onClick={() => loginAsDemo('merchant')}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors duration-200"
              >
                🏠 Demo Host
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column: Hero Image panel for desktop */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80"
          alt="EV Charging Station"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
            <Zap className="h-5 w-5 fill-current" />
            <span className="tracking-wider text-xs uppercase">EVNest Network</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight max-w-lg">
            Empowering EV drivers through peer-to-peer charging networks.
          </h1>
          <p className="text-slate-300 text-sm mt-3 max-w-md leading-relaxed">
            Find nearby private host charger points, reserve time slots, and calculate real-time charge ranges instantly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
