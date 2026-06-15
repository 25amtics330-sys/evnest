import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getChargerPhoto, handleImageError } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Plus, ToggleLeft, ToggleRight, Edit, Trash2, IndianRupee,
  TrendingUp, Calendar, Zap, List, WifiOff, Wifi,
  Clock, Star
} from 'lucide-react';

// Estimate monthly revenue for a charger card
// Assumes avg 3 sessions/day × 30 days × 1hr each
function estimateMonthlyRevenue(charger) {
  const sessionsPerDay = charger.speedKw >= 22 ? 6 : charger.speedKw >= 7 ? 4 : 2;
  const avgKwhPerSession = charger.speedKw * 1.0; // 1 hr avg session
  const revenuePerSession = avgKwhPerSession * charger.pricePerKwh;
  const monthly = revenuePerSession * sessionsPerDay * 30;
  return Math.round(monthly);
}

// Revenue breakdown tiers
function revenueTier(monthly) {
  if (monthly >= 15000) return { label: 'High Earner', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
  if (monthly >= 6000)  return { label: 'Steady Income', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' };
  return                       { label: 'Starter',       color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' };
}

const MerchantDashboard = () => {
  const navigate = useNavigate();
  const [chargers, setChargers]     = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  // Stats
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [bookingsRes, chargersRes] = await Promise.all([
        api.get('/bookings/merchant'),
        api.get('/chargers')
      ]);

      const merchantBookings = bookingsRes.data;
      setBookings(merchantBookings);

      let earnings = 0, sessions = 0;
      merchantBookings.forEach(b => {
        if (b.status === 'confirmed' || b.status === 'completed') {
          earnings += b.estimatedCost || 0;
          sessions += 1;
        }
      });
      setTotalEarnings(earnings);
      setSessionsCount(sessions);

      const localUser = JSON.parse(localStorage.getItem('evnest_user') || '{}');
      const merchantChargers = chargersRes.data.filter(
        c => c.merchantId?._id === localUser._id || c.merchantId === localUser._id
      );

      // Sort: live first, offline last
      merchantChargers.sort((a, b) => (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0));
      setChargers(merchantChargers);
    } catch (err) {
      console.error('Error fetching merchant dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Optimistic toggle — instantly flip card and re-sort, then confirm via API
  const handleToggleLive = async (chargerId) => {
    setTogglingId(chargerId);

    // Optimistic update in state
    setChargers(prev => {
      const updated = prev.map(c =>
        c._id === chargerId ? { ...c, isLive: !c.isLive } : c
      );
      // Re-sort: live first, offline last
      return updated.sort((a, b) => (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0));
    });

    try {
      await api.patch(`/chargers/${chargerId}/toggle`);
    } catch (err) {
      console.error(err);
      // Revert on failure
      setChargers(prev => {
        const reverted = prev.map(c =>
          c._id === chargerId ? { ...c, isLive: !c.isLive } : c
        );
        return reverted.sort((a, b) => (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0));
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteCharger = async (chargerId) => {
    if (!window.confirm('Permanently delete this charger listing?')) return;
    try {
      await api.delete(`/chargers/${chargerId}`);
      setChargers(prev => prev.filter(c => c._id !== chargerId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete charger.');
    }
  };

  // Build chart data per charger from real bookings
  const chartData = chargers.slice(0, 6).map(c => {
    const chargerBookings = bookings.filter(
      b => (b.chargerId?._id || b.chargerId) === c._id
        && (b.status === 'confirmed' || b.status === 'completed')
    );
    const revenue = chargerBookings.reduce((s, b) => s + (b.estimatedCost || 0), 0);
    return {
      name: c.title.split("'s")[0] || c.title.slice(0, 10),
      revenue: parseFloat(revenue.toFixed(2)),
      projected: estimateMonthlyRevenue(c)
    };
  });

  const liveCount     = chargers.filter(c => c.isLive).length;
  const totalProjected = chargers.reduce((s, c) => s + estimateMonthlyRevenue(c), 0);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <span className="text-xs text-slate-400">Loading console...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 py-10 px-4 md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">

        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Host Console</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your stations and track earnings</p>
          </div>
          <button
            onClick={() => navigate('/merchant/add')}
            className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-bold text-white shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Add New Charger
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Actual Revenue',
              value: `₹${totalEarnings.toFixed(0)}`,
              sub: 'confirmed + completed',
              icon: <IndianRupee className="h-5 w-5" />,
              accent: 'emerald'
            },
            {
              label: 'Projected / Month',
              value: `₹${totalProjected.toLocaleString('en-IN')}`,
              sub: 'if all stations live',
              icon: <TrendingUp className="h-5 w-5" />,
              accent: 'blue'
            },
            {
              label: 'Active Stations',
              value: `${liveCount} / ${chargers.length}`,
              sub: 'live right now',
              icon: <Zap className="h-5 w-5" />,
              accent: 'emerald'
            },
            {
              label: 'Paid Sessions',
              value: sessionsCount,
              sub: 'total bookings',
              icon: <Calendar className="h-5 w-5" />,
              accent: 'purple'
            }
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between gap-3 shadow-sm">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">{s.label}</span>
                <span className="text-xl font-extrabold text-slate-900 mt-1 block">{s.value}</span>
                <span className="text-[10px] text-slate-400">{s.sub}</span>
              </div>
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                s.accent === 'emerald' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                s.accent === 'blue'    ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                'bg-purple-50 text-purple-600 border border-purple-200'
              }`}>
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Chart + Expected Revenue Explainer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-slate-900">Revenue by Station</h3>
              <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500 inline-block" /> Actual</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-200 border border-blue-400 inline-block" /> Projected</span>
              </div>
            </div>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                No booking data yet — projected values shown in charger cards below
              </div>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4} barCategoryGap="25%">
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={v => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '10px', fontSize: '11px' }}
                      labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      formatter={(val, name) => [`₹${val}`, name === 'revenue' ? 'Actual' : 'Projected']}
                    />
                    <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="projected" fill="rgba(59,130,246,0.15)" stroke="#3b82f6" strokeWidth={1} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Expected Revenue Explainer */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col gap-4 shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                How Revenue is Estimated
              </h3>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Each station's projected monthly income is calculated based on your speed and price, assuming realistic daily utilization:
              </p>
            </div>

            <div className="space-y-3">
              {[
                { speed: '≤ 3.3 kW (Slow)', sessions: '2 sessions/day', hrs: '~1 hr each', color: 'text-amber-700' },
                { speed: '7.4 kW (Fast)',   sessions: '4 sessions/day', hrs: '~1 hr each', color: 'text-emerald-700' },
                { speed: '≥ 22 kW (Rapid)', sessions: '6 sessions/day', hrs: '~1 hr each', color: 'text-blue-700' },
              ].map(t => (
                <div key={t.speed} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className={`text-[11px] font-bold ${t.color} mb-1`}>{t.speed}</div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" />{t.sessions}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{t.hrs}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-[10px] text-emerald-700 font-semibold">Formula</p>
              <p className="text-[10px] text-slate-600 mt-1">
                <span className="text-slate-900 font-bold">Sessions × Speed(kW) × Price/kWh × 30 days</span>
              </p>
              <p className="text-[10px] text-slate-500 mt-1">All projections are estimates. Actual earnings depend on driver demand in your area.</p>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <List className="h-5 w-5 text-emerald-600" />
              Your Charger Listings
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold">
              {liveCount} live · {chargers.length - liveCount} offline
            </span>
          </div>

          {chargers.length === 0 ? (
            <div className="text-center py-12 rounded-lg border border-dashed border-slate-200">
              <Zap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">You haven't listed any EV chargers yet.</p>
              <button
                onClick={() => navigate('/merchant/add')}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-lg transition-colors"
              >
                Add Your First Charger
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chargers.map((charger) => {
                const isToggling    = togglingId === charger._id;
                const monthlyEst    = estimateMonthlyRevenue(charger);
                const tier          = revenueTier(monthlyEst);

                return (
                  <div
                    key={charger._id}
                    className={`rounded-xl border p-4 transition-all duration-500 shadow-sm ${
                      charger.isLive
                        ? 'border-slate-200 bg-white hover:border-slate-300'
                        : 'border-slate-200 bg-slate-50 opacity-70'
                    }`}
                  >
                    {/* Top row: image + name + toggle */}
                    <div className="flex gap-3 items-start">
                      <div className="relative shrink-0">
                        <img
                          src={getChargerPhoto(charger.photos)}
                          alt=""
                          className={`w-16 h-16 rounded-xl object-cover border border-slate-200 ${!charger.isLive ? 'grayscale' : ''} transition-all duration-300`}
                          loading="lazy"
                          onError={handleImageError}
                        />
                        {/* Live/Offline dot */}
                        <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${charger.isLive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-xs font-bold text-slate-800 line-clamp-1 flex-1">{charger.title}</h3>

                          {/* Toggle button */}
                          <button
                            onClick={() => handleToggleLive(charger._id)}
                            disabled={isToggling}
                            title={charger.isLive ? 'Click to take offline' : 'Click to go live'}
                            className={`flex items-center gap-1 text-[10px] font-bold uppercase rounded-full px-2 py-0.5 border transition-all duration-200 shrink-0 ${
                              charger.isLive
                                ? 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                                : 'text-slate-500 border-slate-200 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                            } ${isToggling ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                          >
                            {isToggling ? (
                              <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                            ) : charger.isLive ? (
                              <><Wifi className="h-3 w-3" /> Live</>
                            ) : (
                              <><WifiOff className="h-3 w-3" /> Offline</>
                            )}
                          </button>
                        </div>

                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{charger.address}</p>

                        {/* Specs row */}
                        <div className="flex gap-2 items-center mt-2 flex-wrap">
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            <Zap className="h-2.5 w-2.5 fill-current" />{charger.speedKw}kW
                          </span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {charger.connectorType}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600">
                            ₹{charger.pricePerKwh}/kWh
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Estimated Revenue Strip */}
                    <div className={`mt-3 rounded-lg border px-3 py-2.5 flex items-center justify-between ${tier.bg}`}>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Est. Monthly Revenue</p>
                        <p className={`text-base font-extrabold ${tier.color} mt-0.5`}>
                          ₹{monthlyEst.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color}`}>
                          {tier.label}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1">
                          ~₹{Math.round(monthlyEst / 30)}/day
                        </p>
                      </div>
                    </div>

                    {/* Actions row */}
                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => navigate(`/merchant/edit/${charger._id}`)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-slate-300 transition-colors text-[10px] font-bold"
                      >
                        <Edit className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCharger(charger._id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-[10px] font-bold"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboard;
