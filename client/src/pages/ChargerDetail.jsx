import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getChargerPhoto, handleImageError } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Zap, MapPin, Shield, Star, Calendar, Clock, DollarSign, Calculator, ChevronLeft, Send } from 'lucide-react';

const ChargerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [charger, setCharger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Calculator Fields
  const [kwhNeeded, setKwhNeeded] = useState(25);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [duration, setDuration] = useState(60); // minutes
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    const fetchChargerAndReviews = async () => {
      try {
        const chargerRes = await api.get(`/chargers/${id}`);
        setCharger(chargerRes.data);
        
        const reviewsRes = await api.get(`/reviews/${id}`);
        setReviews(reviewsRes.data);
      } catch (err) {
        setError('Could not retrieve charger details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChargerAndReviews();
    
    // Set default booking date as tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split('T')[0]);
  }, [id]);

  const handleBookSession = () => {
    if (user.role === 'merchant') {
      return alert('Merchants cannot book charger slots.');
    }
    if (!bookingDate || !bookingTime || !kwhNeeded || kwhNeeded <= 0) {
      return alert('Please enter valid slot details and energy amount.');
    }

    const scheduledTime = new Date(`${bookingDate}T${bookingTime}`);
    const cost = kwhNeeded * charger.pricePerKwh;

    // Navigate to Checkout Page passing state
    navigate(`/booking/${charger._id}`, {
      state: {
        scheduledAt: scheduledTime.toISOString(),
        durationMinutes: duration,
        kwhNeeded: Number(kwhNeeded),
        estimatedCost: parseFloat(cost.toFixed(2))
      }
    });
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!comment.trim()) {
      return setReviewError('Please write a comment.');
    }

    try {
      const res = await api.post(`/reviews/${id}`, { rating, comment });
      setReviews(prev => [res.data, ...prev]);
      setComment('');
      setReviewSuccess('Review posted successfully!');
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !charger) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-6">
        <p className="text-red-500 text-lg mb-4">{error || 'Charger not found'}</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm">
          Back to Map
        </button>
      </div>
    );
  }

  const calculatedCost = (kwhNeeded * charger.pricePerKwh).toFixed(2);

  return (
    <div className="w-full bg-slate-50 py-8 px-4 md:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Back Link */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Map
        </button>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Left Columns - Photos & Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative h-80 w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <img 
                src={getChargerPhoto(charger.photos)} 
                alt={charger.title} 
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider mb-2 inline-block ${
                  charger.isLive 
                    ? 'bg-emerald-500/20 text-white border border-emerald-400/40 backdrop-blur-sm' 
                    : 'bg-white/20 text-white border border-white/30 backdrop-blur-sm'
                }`}>
                  {charger.isLive ? 'Live Grid' : 'Offline'}
                </span>
                <h1 className="text-3xl font-extrabold text-white leading-tight mt-1">{charger.title}</h1>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
              {/* Core Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-6">
                <div>
                  <span className="text-slate-400 text-xs block uppercase font-bold mb-1">Connector</span>
                  <span className="text-slate-800 font-bold text-lg">{charger.connectorType}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block uppercase font-bold mb-1">Charging Speed</span>
                  <span className="text-slate-800 font-bold text-lg flex items-center gap-1">
                    <Zap className="h-5 w-5 text-amber-500 fill-current" />
                    {charger.speedKw} kW
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-xs block uppercase font-bold mb-1">Rate</span>
                  <span className="text-emerald-600 font-extrabold text-lg">₹{charger.pricePerKwh}/kWh</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2.5">About this charger</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {charger.description || 'No description provided by host.'}
                </p>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  Address
                </h3>
                <p className="text-sm text-slate-600">{charger.address}</p>
              </div>

              {/* Host info */}
              <div className="flex items-center gap-3 border-t border-slate-100 pt-6">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
                  {charger.merchantId?.name?.charAt(0) || 'H'}
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase font-bold block">Listed by Host</span>
                  <span className="text-sm text-slate-800 font-semibold">{charger.merchantId?.name || 'Local Host'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Actions Card */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400"></div>

              <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-600" />
                Book Charging Session
              </h2>

              <div className="space-y-4">
                {/* Energy Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Energy needed (kWh)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={kwhNeeded}
                    onChange={(e) => setKwhNeeded(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 px-4 text-slate-800 font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    (e.g., Nexon EV battery: 30-40 kWh)
                  </span>
                </div>

                {/* Date slot */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 px-4 text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Time slot */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Arrival Time
                  </label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 px-4 text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Duration select */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 px-4 text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={60}>1 Hour</option>
                    <option value={120}>2 Hours</option>
                    <option value={180}>3 Hours</option>
                  </select>
                </div>

                {/* Live Estimator Breakdown */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2.5">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Base Energy cost</span>
                    <span>₹{charger.baseElectricityCost} / kWh</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Network Markup ({charger.markupPercent}%)</span>
                    <span>+ ₹{(charger.pricePerKwh - charger.baseElectricityCost).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 border-t border-slate-200 pt-2">
                    <span>Rate / kWh</span>
                    <span>₹{charger.pricePerKwh}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-2.5">
                    <span className="text-emerald-600">Total Price</span>
                    <span className="text-lg text-emerald-600">₹{calculatedCost}</span>
                  </div>
                </div>

                <button
                  onClick={handleBookSession}
                  disabled={!charger.isLive}
                  className="w-full py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm transition-all duration-200 disabled:opacity-40"
                >
                  Book & Pay
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500 fill-current" />
            Reviews & Feedback ({reviews.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Reviews List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {reviews.length === 0 ? (
                <p className="text-slate-400 text-sm">No reviews yet. Be the first to share your experience!</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev._id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-slate-800 block text-xs">{rev.userId?.name || 'Driver'}</span>
                        <span className="text-[10px] text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 italic">"{rev.comment}"</p>
                  </div>
                ))
              )}
            </div>

            {/* Write a Review (Only drivers can leave reviews) */}
            {user && user.role === 'user' && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Leave a Review</h3>
                
                {reviewError && <div className="text-red-500 text-xs">{reviewError}</div>}
                {reviewSuccess && <div className="text-emerald-600 text-xs">{reviewSuccess}</div>}

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Rating</label>
                    <div className="flex gap-2 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star className={`h-6 w-6 ${rating >= star ? 'fill-current' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Your Feedback</label>
                    <textarea
                      placeholder="How was the experience? (e.g. Charging speed, host behavior, location security...)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors"
                  >
                    Submit Review
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default ChargerDetail;
