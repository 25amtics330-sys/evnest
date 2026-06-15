import React, { useState, useEffect } from 'react';
import api, { getChargerPhoto, handleImageError } from '../utils/api';
import {
  Check, X, CheckSquare, Clock, Calendar, User, Car,
  Zap, RefreshCw, Inbox, Home, ChevronRight, IndianRupee
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   dot: 'bg-amber-500',    text: 'text-amber-700',   border: 'border-amber-200',  bg: 'bg-amber-50'  },
  confirmed: { label: 'Confirmed', dot: 'bg-emerald-500',  text: 'text-emerald-700', border: 'border-emerald-200',bg: 'bg-emerald-50'},
  completed: { label: 'Completed', dot: 'bg-blue-500',     text: 'text-blue-700',    border: 'border-blue-200',   bg: 'bg-blue-50'  },
  cancelled: { label: 'Cancelled', dot: 'bg-red-500',      text: 'text-red-700',     border: 'border-red-200',    bg: 'bg-red-50'   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${cfg.text} ${cfg.border} ${cfg.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const MerchantBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchBookings = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/bookings/merchant');
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching incoming merchant bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // Live poll every 20s
    const interval = setInterval(() => fetchBookings(true), 20000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      await fetchBookings();
    } catch (err) {
      console.error(err);
      alert('Failed to update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  const displayed = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const totalEarned = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + (b.estimatedCost || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <span className="text-xs text-slate-400">Loading requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 min-h-full py-8 px-4 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Incoming Requests</h1>
            <p className="text-slate-500 text-sm mt-1">
              Driver booking requests for your charger stations
            </p>
          </div>
          <button
            onClick={() => fetchBookings(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 self-start shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Requests', value: counts.all, color: 'text-slate-900' },
            { label: 'Pending', value: counts.pending, color: 'text-amber-600' },
            { label: 'Active', value: counts.confirmed, color: 'text-emerald-600' },
            { label: 'Revenue', value: `₹${totalEarned.toFixed(0)}`, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">{s.label}</p>
              <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap capitalize border transition-all ${
                filter === tab
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {counts[tab] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                  filter === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                }`}>{counts[tab]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {displayed.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-dashed border-slate-200 bg-white">
            <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-600">No {filter !== 'all' ? filter : ''} requests yet</p>
            <p className="text-xs text-slate-400 mt-1">Booking requests from drivers will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((booking) => {
              const charger = booking.chargerId;
              const driver = booking.userId;
              const isUpdating = updatingId === booking._id;

              return (
                <div
                  key={booking._id}
                  className={`rounded-xl border bg-white overflow-hidden transition-all shadow-sm ${
                    booking.status === 'pending'
                      ? 'border-amber-200 hover:border-amber-300'
                      : booking.status === 'confirmed'
                        ? 'border-emerald-200 hover:border-emerald-300'
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Status bar top accent */}
                  <div className={`h-[3px] w-full ${
                    booking.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                    booking.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                    booking.status === 'completed' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                    'bg-slate-200'
                  }`} />

                  <div className="p-5 flex flex-col md:flex-row gap-5">
                    {/* Charger Image Thumbnail */}
                    <div className="h-20 w-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 relative hidden sm:block">
                      <img 
                        src={getChargerPhoto(charger?.photos)} 
                        alt="Charger" 
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    </div>

                    {/* Left: Charger + Driver Info */}
                    <div className="flex-1 min-w-0 space-y-4">

                      {/* Charger Name + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-extrabold text-slate-800 truncate">
                              {charger?.title || 'Private Charger'}
                            </h3>
                            <StatusBadge status={booking.status} />
                          </div>
                          {charger?.address && (
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                              <Home className="h-3 w-3 shrink-0" />
                              {charger.address}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Charger Specs */}
                      {charger && (
                        <div className="flex gap-2 flex-wrap">
                          <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-700">
                            <Zap className="h-3 w-3 fill-current" />
                            {charger.speedKw} kW
                          </span>
                          <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-600">
                            {charger.connectorType}
                          </span>
                          <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold text-emerald-700">
                            <IndianRupee className="h-3 w-3" />
                            {charger.pricePerKwh}/kWh
                          </span>
                        </div>
                      )}

                      {/* Driver Info */}
                      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 font-bold text-sm border border-emerald-200">
                          {(driver?.name || 'D')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800">{driver?.name || 'Driver'}</p>
                          <p className="text-[11px] text-slate-400">{driver?.email || ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Car className="h-3 w-3" />
                            <span className="font-semibold">{driver?.carModel || 'EV'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Schedule */}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold">{formatTime(booking.scheduledAt)}</span>
                        </span>
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{booking.durationMinutes} min</span>
                        </span>
                        <span className="ml-auto text-[10px] text-slate-400">
                          Requested {timeAgo(booking.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Right: Payout + Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-between gap-4 md:w-40 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Payout</p>
                        <p className="text-xl font-extrabold text-emerald-600">₹{(booking.estimatedCost || 0).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">{booking.durationMinutes} min session</p>
                      </div>

                      <div className="flex flex-col gap-2 items-end">
                        {isUpdating ? (
                          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                        ) : (
                          <>
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(booking._id, 'confirmed')}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors shadow-sm w-full justify-center"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(booking._id, 'cancelled')}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors w-full justify-center"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Decline
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateStatus(booking._id, 'completed')}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors w-full justify-center"
                              >
                                <CheckSquare className="h-3.5 w-3.5" />
                                Complete
                              </button>
                            )}
                            {(booking.status === 'completed' || booking.status === 'cancelled') && (
                              <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border ${
                                booking.status === 'completed'
                                  ? 'text-blue-600 border-blue-200 bg-blue-50'
                                  : 'text-slate-500 border-slate-200 bg-slate-50'
                              }`}>
                                {booking.status === 'completed' ? '✓ Done' : '✕ Cancelled'}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantBookings;
