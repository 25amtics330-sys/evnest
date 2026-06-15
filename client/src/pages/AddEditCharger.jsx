import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../utils/api';
import { ChevronLeft, Zap, MapPin, Calculator, Sparkles } from 'lucide-react';

// DivIcon for picker
const pickerIcon = L.divIcon({
  className: 'custom-pin-live',
  html: '<div class="custom-pin-live-inner"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Click event listener sub-component
function LocationClickCapture({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Controller to fly map on edit loads
function MapCenterController({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] !== 21.1702) {
      map.setView(coords, 12, { animate: true });
    }
  }, [coords, map]);
  return null;
}

const AddEditCharger = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(21.1702); // default Surat lat
  const [lng, setLng] = useState(72.8311); // default Surat lng
  const [connectorType, setConnectorType] = useState('Type2');
  const [speedKw, setSpeedKw] = useState(7.4);
  const [baseElectricityCost, setBaseElectricityCost] = useState(8);
  const [markupPercent, setMarkupPercent] = useState(35);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchCharger = async () => {
        setFetching(true);
        try {
          const res = await api.get(`/chargers/${id}`);
          const data = res.data;
          setTitle(data.title);
          setDescription(data.description);
          setAddress(data.address);
          setLat(data.lat);
          setLng(data.lng);
          setConnectorType(data.connectorType);
          setSpeedKw(data.speedKw);
          setBaseElectricityCost(data.baseElectricityCost);
          setMarkupPercent(data.markupPercent);
        } catch (err) {
          console.error(err);
          alert('Failed to retrieve charger specifications.');
        } finally {
          setFetching(false);
        }
      };
      fetchCharger();
    }
  }, [id, isEditMode]);

  // Adjust suggested markup percentage automatically when speed field changes
  const handleSpeedChange = (kw) => {
    setSpeedKw(kw);
    if (kw <= 3.3) {
      setMarkupPercent(20); // Slow
    } else if (kw <= 11) {
      setMarkupPercent(35); // Fast
    } else {
      setMarkupPercent(50); // Rapid (22kW+)
    }
  };

  const handleLocationSelect = (selectedLat, selectedLng) => {
    setLat(parseFloat(selectedLat.toFixed(6)));
    setLng(parseFloat(selectedLng.toFixed(6)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !address || !lat || !lng || !speedKw || !baseElectricityCost) {
      return alert('Please fill in all mandatory parameters.');
    }

    setLoading(true);

    const payload = {
      title,
      description,
      address,
      lat,
      lng,
      connectorType,
      speedKw: Number(speedKw),
      baseElectricityCost: Number(baseElectricityCost),
      markupPercent: Number(markupPercent),
      photos: isEditMode ? undefined : ['https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80']
    };

    try {
      if (isEditMode) {
        await api.put(`/chargers/${id}`, payload);
      } else {
        await api.post('/chargers', payload);
      }
      navigate('/merchant');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Listing modification failed.');
    } finally {
      setLoading(false);
    }
  };

  const userPrice = (baseElectricityCost * (1 + markupPercent / 100)).toFixed(2);

  if (fetching) {
    return (
      <div className="flex flex-1 items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const inputClass = "w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

  return (
    <div className="w-full bg-slate-50 py-10 px-4 md:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate('/merchant')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-semibold text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Panel
        </button>

        <h1 className="text-2xl font-extrabold text-slate-900 mb-8">
          {isEditMode ? 'Modify Charger Listing' : 'List New EV Charger'}
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1: Specs, details, markups */}
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                1. Basic Info
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Station Title</label>
                <input
                  type="text"
                  required
                  placeholder="Surat EcoCharge Hub"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description (Optional)</label>
                <textarea
                  placeholder="Provide access hours, safety instructions, nearby landmarks..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="Adajan Road, Surat, Gujarat 395009"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-600" />
                2. Technical Specs
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Connector Type</label>
                  <select
                    value={connectorType}
                    onChange={(e) => setConnectorType(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Type2">Type2</option>
                    <option value="CCS">CCS</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                    <option value="Bharat AC">Bharat AC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Speed (kW)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="7.4"
                    value={speedKw}
                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Maps + Markup pricing config */}
          <div className="space-y-5">
            {/* Map Pin Dropper */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-600" />
                3. Pin Map Location
              </h2>
              <span className="text-[10px] text-slate-400 block leading-tight">
                Click on the map below to position your charger pin. Coordinates auto-fill.
              </span>

              <div className="h-48 w-full rounded-lg overflow-hidden border border-slate-200">
                <MapContainer center={[lat, lng]} zoom={11} className="h-full w-full">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  <Marker position={[lat, lng]} icon={pickerIcon} />
                  <LocationClickCapture onSelect={handleLocationSelect} />
                  <MapCenterController coords={[lat, lng]} />
                </MapContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
                <div>
                  <span>Latitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    readOnly
                    value={lat}
                    className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2.5 rounded-lg text-slate-800 mt-1 cursor-not-allowed outline-none"
                  />
                </div>
                <div>
                  <span>Longitude</span>
                  <input
                    type="number"
                    step="0.000001"
                    readOnly
                    value={lng}
                    className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2.5 rounded-lg text-slate-800 mt-1 cursor-not-allowed outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Calculator className="h-4 w-4 text-emerald-600" />
                4. Pricing Strategy
              </h2>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Base Electricity Cost (₹ / kWh)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="8"
                  value={baseElectricityCost}
                  onChange={(e) => setBaseElectricityCost(Number(e.target.value))}
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-500">Markup Percent (%)</label>
                  <span className="text-xs font-bold text-emerald-600">{markupPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Calculated price display box */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Estimated Markup Payout</span>
                  <span>+ ₹{(baseElectricityCost * (markupPercent / 100)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 border-t border-slate-200 pt-2 flex-wrap">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 fill-current" />
                    Price to Drivers
                  </span>
                  <span className="text-base text-emerald-600">₹{userPrice} / kWh</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all duration-200 disabled:opacity-40"
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent inline-block"></span>
              ) : (
                isEditMode ? 'Update Station Listing' : 'Publish Station Live'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditCharger;
