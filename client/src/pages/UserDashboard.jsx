import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getChargerPhoto, handleImageError } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Car, Battery, Clock, MapPin, Calendar, CreditCard, XSquare, CheckCircle, HelpCircle } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/me');
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching user bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm('Are you sure you want to cancel this booking session?');
    if (!confirmCancel) return;

    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: 'cancelled' });
      fetchBookings();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel booking.');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      completed: 'bg-blue-50 text-blue-700 border-blue-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    };
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${styles[status] || styles.pending}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 py-10 px-4 md:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header greeting */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Driver Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your charging slots and profile settings</p>
        </div>

        {/* Profile Card & Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Driver details */}
          <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm">
            <div className="flex gap-4 items-center">
              <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 border border-emerald-200">
                <Car className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
                <p className="text-slate-400 text-xs">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 mt-6">
              <div className="flex gap-2.5 items-center">
                <Car className="h-5 w-5 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Vehicle</span>
                  <span className="text-xs text-slate-700 font-semibold">{user.carModel || 'Not Specified'}</span>
                </div>
              </div>
              <div className="flex gap-2.5 items-center">
                <Battery className="h-5 w-5 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Battery Pack</span>
                  <span className="text-xs text-slate-700 font-semibold">{user.batteryCapacityKwh ? `${user.batteryCapacityKwh} kWh` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Calculator Tool Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">EV Range Estimator</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Estimate remaining range in kilometers based on your battery percentage and locate reachable chargers on map.
              </p>
            </div>
            <button
              onClick={() => navigate('/range-calculator')}
              className="mt-6 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition-all text-center"
            >
              Open Calculator
            </button>
          </div>
        </div>

        {/* Bookings log */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Your Charging Sessions</h2>

          {bookings.length === 0 ? (
            <div className="text-center py-10 rounded-lg border border-dashed border-slate-200">
              <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">You haven't booked any charger sessions yet.</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-lg transition-colors"
              >
                Search Live Map
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div 
                  key={booking._id} 
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex gap-4 items-center flex-1 min-w-0">
                    {/* Charger Image Thumbnail */}
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 relative">
                      <img 
                        src={getChargerPhoto(booking.chargerId?.photos)} 
                        alt="Charger" 
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-800 truncate">{booking.chargerId?.title || 'Unknown Charger'}</h3>
                        {getStatusBadge(booking.status)}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {new Date(booking.scheduledAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({booking.durationMinutes}m)</span>
                        </span>
                        <span className="flex items-center gap-1 col-span-2 sm:col-span-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{booking.chargerId?.address || 'Private Hub'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-100 pt-3.5 md:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Paid</span>
                      <span className="text-sm font-extrabold text-emerald-600">₹{booking.estimatedCost}</span>
                    </div>

                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-600 hover:bg-red-100 transition-all"
                      >
                        <XSquare className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UserDashboard;
