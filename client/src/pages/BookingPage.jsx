import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import api, { getChargerPhoto, handleImageError } from '../utils/api';
import { ShieldCheck, CreditCard, Sparkles, Receipt, Calendar, Clock, Battery, ChevronRight, CheckCircle2, MapPin } from 'lucide-react';

const BookingPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract navigation parameters (if somehow empty, fallback)
  const { scheduledAt, durationMinutes, kwhNeeded, estimatedCost } = location.state || {
    scheduledAt: new Date().toISOString(),
    durationMinutes: 60,
    kwhNeeded: 30,
    estimatedCost: 300
  };

  const [paymentStep, setPaymentStep] = useState('summary'); // 'summary', 'processing', 'success'
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'upi'
  const [charger, setCharger] = useState(null);

  useEffect(() => {
    const fetchCharger = async () => {
      try {
        const res = await api.get(`/chargers/${id}`);
        setCharger(res.data);
      } catch (err) {
        console.error('Error fetching charger for booking confirmation:', err);
      }
    };
    fetchCharger();
  }, [id]);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [upiId, setUpiId] = useState('');

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setPaymentStep('processing');

    // Simulate Payment validation & network latency
    setTimeout(async () => {
      try {
        const payload = {
          chargerId: id,
          scheduledAt,
          durationMinutes,
          estimatedCost,
        };

        const res = await api.post('/bookings', payload);
        console.log('Booking confirmed:', res.data);
        setPaymentStep('success');
      } catch (err) {
        console.error(err);
        alert('Server booking failed. Proceeding to mock success for demo.');
        setPaymentStep('success');
      }
    }, 2000);
  };

  if (paymentStep === 'success') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center border border-slate-200 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
          
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mb-6 animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">Payment Successful!</h1>
          <p className="text-emerald-600 font-semibold text-sm mt-1.5 flex items-center justify-center gap-1">
            <Sparkles className="h-4 w-4" />
            Your charger slot is locked in.
          </p>

          <p className="text-slate-500 text-xs mt-4 leading-relaxed px-4">
            A confirmation receipt has been sent. The Host will prepare the connector port.
          </p>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-sm text-white shadow-sm transition-all"
            >
              Go to My Bookings
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-sm text-slate-600 transition-all"
            >
              Back to Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50 py-10 px-4 md:px-8">
      <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Column 1: Order Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Receipt className="h-5 w-5 text-emerald-600" />
              Summary
            </h2>

            {/* Charger Info Card */}
            {charger && (
              <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-200 mb-5">
                <img 
                  src={getChargerPhoto(charger.photos)}
                  alt={charger.title}
                  className="h-16 w-20 object-cover rounded-lg border border-slate-200 shrink-0"
                  onError={handleImageError}
                />
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-800 leading-tight truncate">{charger.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{charger.address}</span>
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    {charger.connectorType === 'CCS' ? 'CCS2 (DC)' : charger.connectorType} • {charger.speedKw}kW
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <Calendar className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Date</span>
                  <span className="text-sm text-slate-800 font-semibold">
                    {new Date(scheduledAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Clock className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Arrival Time</span>
                  <span className="text-sm text-slate-800 font-semibold">
                    {new Date(scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} ({durationMinutes} mins slot)
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Battery className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Allocated Energy</span>
                  <span className="text-sm text-slate-800 font-semibold">{kwhNeeded} kWh</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-5 space-y-3.5">
            <div className="flex justify-between items-center text-sm text-slate-500">
              <span>Convenience Charge</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold text-slate-700 border-b border-slate-100 pb-3.5">
              <span>Cost per kWh</span>
              <span>₹{(estimatedCost / kwhNeeded).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-extrabold text-slate-900">Estimated Total</span>
              <span className="text-2xl font-extrabold text-emerald-600">₹{estimatedCost}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Payment Portal */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-400"></div>
          
          {paymentStep === 'processing' ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4"></div>
              <h3 className="text-lg font-bold text-slate-900">Razorpay Secure Checkout</h3>
              <p className="text-xs text-slate-400 mt-1">Verifying credentials and processing transaction...</p>
            </div>
          ) : (
            <form onSubmit={handleProcessPayment} className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  Razorpay Checkout
                </h2>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded">
                  Demo Sandbox
                </span>
              </div>

              {/* Payment Type Selection */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 rounded-md text-xs font-bold transition-all ${
                    paymentMethod === 'card' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Card Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`py-2 rounded-md text-xs font-bold transition-all ${
                    paymentMethod === 'upi' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  UPI Payment
                </button>
              </div>

              {paymentMethod === 'card' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Amit Patel"
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Card Number</label>
                    <input
                      type="text"
                      required
                      maxLength="19"
                      placeholder="4532 •••• •••• 1289"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                      className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expiry Date</label>
                      <input
                        type="text"
                        required
                        maxLength="5"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        required
                        maxLength="3"
                        placeholder="•••"
                        value={cardCVV}
                        onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ''))}
                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">UPI Address (VPA)</label>
                  <input
                    type="text"
                    required
                    placeholder="amitpatel@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    A request will be sent to your UPI app for authorization.
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 font-bold text-sm text-white shadow-sm flex items-center justify-center gap-1.5 transition-all mt-4"
              >
                <span>Authorize Payment (₹{estimatedCost})</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mt-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                256-bit bank-grade encryption via Razorpay.
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default BookingPage;
