import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, User, UserPlus, Car, Battery } from 'lucide-react';

const popularCarModels = [
  'Tata Nexon EV Max', 'Tata Tiago EV', 'MG ZS EV', 'BYD Atto 3',
  'Hyundai Ioniq 5', 'Kia EV6', 'Mahindra XUV400', 'Citroen eC3',
  'MG Comet EV', 'Tata Punch EV', 'BMW iX1', 'Mercedes EQS',
  'Volvo XC40 Recharge', 'Audi Q8 e-tron', 'Mini Cooper SE'
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [carModel, setCarModel] = useState('');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return setError('Please fill in all general fields.');
    }
    if (role === 'user' && (!carModel || !batteryCapacityKwh)) {
      return setError('Please specify your car specifications.');
    }
    setError('');
    setLoading(true);

    const payload = {
      name,
      email,
      password,
      role,
      carModel: role === 'user' ? carModel : undefined,
      batteryCapacityKwh: role === 'user' ? Number(batteryCapacityKwh) : undefined,
    };

    const result = await register(payload);
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

  const handleCarSelect = (model) => {
    setCarModel(model);
    const capacities = {
      'Tata Nexon EV Max': 40.5, 'Tata Tiago EV': 24, 'MG ZS EV': 50.3,
      'BYD Atto 3': 60.48, 'Hyundai Ioniq 5': 72.6, 'Kia EV6': 77.4,
      'Mahindra XUV400': 39.4, 'Citroen eC3': 29.2, 'MG Comet EV': 17.3,
      'Tata Punch EV': 35, 'BMW iX1': 66.5, 'Mercedes EQS': 107.8,
      'Volvo XC40 Recharge': 78, 'Audi Q8 e-tron': 114, 'Mini Cooper SE': 32.6
    };
    if (capacities[model]) {
      setBatteryCapacityKwh(capacities[model]);
    }
  };

  return (
    <div className="flex w-full min-h-screen bg-slate-50">
      {/* Left Column: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">

        {/* Title */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white mb-4">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create Your Account</h2>
          <p className="text-sm text-slate-500 mt-1">Join EVNest's community charging network</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">I want to register as:</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`py-2 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${
                  role === 'user'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🚗 EV Driver
              </button>
              <button
                type="button"
                onClick={() => setRole('merchant')}
                className={`py-2 px-3 rounded-md text-sm font-semibold transition-all duration-200 ${
                  role === 'merchant'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🏠 Charger Host
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Ramesh Gupta"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="email"
                placeholder="ramesh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Conditional Driver Fields */}
          {role === 'user' && (
            <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 mt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <Car className="h-4 w-4" />
                Your Electric Vehicle
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Car Model</label>
                <div className="relative">
                  <Car className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <select
                    value={carModel}
                    onChange={(e) => handleCarSelect(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  >
                    <option value="" disabled>Select vehicle...</option>
                    {popularCarModels.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Battery Capacity (kWh)</label>
                <div className="relative">
                  <Battery className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    placeholder="40"
                    value={batteryCapacityKwh}
                    onChange={(e) => setBatteryCapacityKwh(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

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
                <UserPlus className="h-5 w-5" />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 hover:underline">
            Sign in here
          </Link>
        </p>
        </div>
      </div>

      {/* Right Column: Hero Image panel for desktop */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80"
          alt="EV Car Charging"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent"></div>
        <div className="absolute bottom-12 left-12 right-12 z-10">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-3">
            <Zap className="h-5 w-5 fill-current" />
            <span className="tracking-wider text-xs uppercase">Join the movement</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight max-w-lg">
            Turn your idle home charger into a revenue stream.
          </h1>
          <p className="text-slate-300 text-sm mt-3 max-w-md leading-relaxed">
            Register as a Charger Host or an EV Driver to start sharing or booking charging stations in your community.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
