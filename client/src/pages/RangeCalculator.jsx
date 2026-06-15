import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../utils/api';
import { Calculator, Battery, Zap, Compass, MapPin } from 'lucide-react';

const evModelsList = [
  { name: 'Tata Nexon EV Max', capacity: 40.5, range: 437 },
  { name: 'Tata Tiago EV', capacity: 24, range: 315 },
  { name: 'MG ZS EV', capacity: 50.3, range: 461 },
  { name: 'BYD Atto 3', capacity: 60.48, range: 521 },
  { name: 'Hyundai Ioniq 5', capacity: 72.6, range: 631 },
  { name: 'Kia EV6', capacity: 77.4, range: 528 },
  { name: 'Mahindra XUV400', capacity: 39.4, range: 456 },
  { name: 'Citroen eC3', capacity: 29.2, range: 320 },
  { name: 'MG Comet EV', capacity: 17.3, range: 230 },
  { name: 'Tata Punch EV', capacity: 35, range: 421 },
  { name: 'BMW iX1', capacity: 66.5, range: 440 },
  { name: 'Mercedes EQS', capacity: 107.8, range: 857 },
  { name: 'Volvo XC40 Recharge', capacity: 78, range: 418 },
  { name: 'Audi Q8 e-tron', capacity: 114, range: 600 },
  { name: 'Mini Cooper SE', capacity: 32.6, range: 234 }
];

// Icons
const userLocationIcon = L.divIcon({
  className: 'custom-pin-live',
  html: '<div class="h-3 w-3 bg-blue-500 rounded-full border border-white animate-pulse"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const chargerIcon = L.divIcon({
  className: 'custom-pin-live',
  html: '<div class="custom-pin-live-inner"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Group icon generator for clusters
const groupIcon = (count) => L.divIcon({
  className: 'custom-pin-hub',
  html: `<div class="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500/25 border-2 border-emerald-500 text-emerald-300 font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.6)] hover:scale-105 transition-all duration-200 cursor-pointer">${count}</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// Helper component to manage map panning/zooming and notify changes to parent component
function MapStateController({ center, zoom, onMapChange }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 8, { animate: true, duration: 1.2 });
    }
  }, [center, zoom, map]);

  useEffect(() => {
    const handleMove = () => {
      onMapChange(map.getZoom(), map.getBounds());
    };
    
    handleMove();

    map.on('moveend', handleMove);
    map.on('zoomend', handleMove);

    return () => {
      map.off('moveend', handleMove);
      map.off('zoomend', handleMove);
    };
  }, [map, onMapChange]);

  return null;
}

const RangeCalculator = () => {
  const [selectedEvIndex, setSelectedEvIndex] = useState(0);
  const [batteryPercent, setBatteryPercent] = useState(70);
  const [chargers, setChargers] = useState([]);

  // Map coordinates & zoom focus state
  const [mapCenter, setMapCenter] = useState([21.1855, 72.7989]);
  const [mapZoom, setMapZoom] = useState(8);

  // Map Viewport bounds states for clustering & culling
  const [currentZoom, setCurrentZoom] = useState(8);
  const [currentBounds, setCurrentBounds] = useState(null);

  const handleMapChange = useCallback((zoom, bounds) => {
    setCurrentZoom(zoom);
    setCurrentBounds(bounds);
  }, []);

  const handleGroupClick = (group) => {
    const nextZoom = Math.min(Math.max(currentZoom + 2, 10), 18);
    setMapCenter([group.lat, group.lng]);
    setMapZoom(nextZoom);
  };
  
  // Default user location (Adajan, Surat)
  const userLat = 21.1855;
  const userLng = 72.7989;

  useEffect(() => {
    const fetchChargers = async () => {
      try {
        const res = await api.get('/chargers');
        setChargers(res.data);
      } catch (err) {
        console.error('Error fetching chargers for calculator:', err);
      }
    };
    fetchChargers();
  }, []);

  const activeEv = evModelsList[selectedEvIndex];
  
  // Calculate remaining range (using standard specs ratio for demo)
  const estimatedRange = Math.round((batteryPercent / 100) * activeEv.range);

  // Geo distance helper
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter chargers within range
  const reachableChargers = chargers.filter(c => {
    const dist = getDistance(userLat, userLng, c.lat, c.lng);
    return dist <= estimatedRange;
  });

  // Get and cluster visible reachable chargers
  const getRenderedElements = () => {
    if (!currentBounds) {
      return reachableChargers.slice(0, 50);
    }

    // 1. Cull out-of-viewport chargers
    const visible = reachableChargers.filter(c => currentBounds.contains([c.lat, c.lng]));

    // 2. If zoomed in closely (zoom >= 13), show individual pins directly
    if (currentZoom >= 13) {
      return visible;
    }

    // 3. Proximity-based dynamic clustering for zoom levels < 13
    let threshold = 0.015;
    if (currentZoom <= 6) threshold = 1.0;
    else if (currentZoom === 7) threshold = 0.5;
    else if (currentZoom === 8) threshold = 0.25;
    else if (currentZoom === 9) threshold = 0.12;
    else if (currentZoom === 10) threshold = 0.06;
    else if (currentZoom === 11) threshold = 0.03;
    else if (currentZoom === 12) threshold = 0.015;

    const clusters = [];

    visible.forEach(charger => {
      let foundCluster = false;
      
      for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        const latDiff = charger.lat - (cluster.latSum / cluster.count);
        const lngDiff = charger.lng - (cluster.lngSum / cluster.count);
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        if (distance < threshold) {
          cluster.count += 1;
          cluster.latSum += charger.lat;
          cluster.lngSum += charger.lng;
          cluster.chargers.push(charger);
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        clusters.push({
          _id: `cluster_${charger._id}`,
          isGroup: true,
          latSum: charger.lat,
          lngSum: charger.lng,
          count: 1,
          chargers: [charger]
        });
      }
    });

    return clusters.map(c => {
      if (c.count === 1) {
        return c.chargers[0];
      }
      
      let clusterName = 'Gujarat';
      const firstAddress = c.chargers[0].address;
      if (firstAddress.includes('segment between') || firstAddress.includes('Near highway')) {
        clusterName = 'Highway Corridor';
      } else {
        const parts = firstAddress.split(',');
        if (parts.length >= 3) {
          clusterName = parts[parts.length - 3].trim();
        } else if (parts.length >= 2) {
          clusterName = parts[parts.length - 2].trim();
        }
      }

      return {
        _id: c._id,
        isGroup: true,
        title: `${clusterName} Grid`,
        lat: c.latSum / c.count,
        lng: c.lngSum / c.count,
        count: c.count
      };
    });
  };

  const getBatteryColor = (percent) => {
    if (percent > 50) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (percent > 20) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <div className="w-full bg-slate-50 py-10 px-4 md:px-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-emerald-600" />
            EV Range Estimator & Map
          </h1>
          <p className="text-slate-500 text-sm mt-1">Estimate remaining range and view reachable charging grid on map</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1: Config sliders */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Compass className="h-4.5 w-4.5 text-emerald-600" />
                Parameters
              </h2>

              {/* EV selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Electric Vehicle (EV)</label>
                <select
                  value={selectedEvIndex}
                  onChange={(e) => setSelectedEvIndex(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                >
                  {evModelsList.map((ev, idx) => (
                    <option key={idx} value={idx}>{ev.name}</option>
                  ))}
                </select>
              </div>

              {/* Battery slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-slate-500">Battery Level (%)</label>
                  <span className="text-xs font-bold text-emerald-600">{batteryPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="1"
                  value={batteryPercent}
                  onChange={(e) => setBatteryPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-950 cursor-pointer"
                />
              </div>

              {/* Vehicle Specs mini box */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Battery Capacity</span>
                  <span className="font-bold text-slate-800">{activeEv.capacity} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span>Full Charge Range</span>
                  <span className="font-bold text-slate-800">{activeEv.range} km</span>
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className={`rounded-xl border p-6 text-center space-y-4 shadow-sm ${getBatteryColor(batteryPercent)}`}>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white border border-slate-200 text-emerald-600">
                <Battery className="h-8 w-8 fill-current" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Estimated Range</span>
                <span className="text-3xl font-extrabold text-slate-900 block mt-1">{estimatedRange} km</span>
              </div>
              <span className="text-[10px] font-bold block text-emerald-700 uppercase tracking-widest bg-emerald-100 w-fit mx-auto px-2 py-0.5 rounded border border-emerald-200">
                {reachableChargers.length} Reachable Stations
              </span>
            </div>

            {/* EV Cockpit Visual */}
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm relative group">
              <div className="h-32 w-full relative">
                <img
                  src="https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80"
                  alt="EV Cockpit"
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
              </div>
              <div className="p-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800">Intelligent Range Analysis</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Real-time range predictions adjust to driving behaviors and battery degradation coefficients.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Map display overlay */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 overflow-hidden h-96 lg:h-auto min-h-[350px] relative shadow-sm">
            <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              
              <MapStateController center={mapCenter} zoom={mapZoom} onMapChange={handleMapChange} />

              {/* User Position Blue Marker */}
              <Marker position={[userLat, userLng]} icon={userLocationIcon}>
                <Popup>
                  <div className="text-xs font-bold text-slate-100">Your Starting Point</div>
                </Popup>
              </Marker>

              {/* Translucent Range Circle overlay */}
              <Circle
                center={[userLat, userLng]}
                radius={estimatedRange * 1000} // radius in meters
                pathOptions={{
                  color: '#10b981',
                  fillColor: '#10b981',
                  fillOpacity: 0.08,
                  weight: 2,
                  dashArray: '5, 10'
                }}
              />

              {/* Reachable Chargers markers */}
              {getRenderedElements().map((element) => {
                if (element.isGroup) {
                  return (
                    <Marker
                      key={element._id}
                      position={[element.lat, element.lng]}
                      icon={groupIcon(element.count)}
                      eventHandlers={{
                        click: () => handleGroupClick(element)
                      }}
                    >
                      <Popup>
                        <div className="p-2 text-center text-xs">
                          <h4 className="font-bold text-sm text-slate-100 mb-1">{element.title}</h4>
                          <p className="text-slate-400 mb-3 leading-relaxed">
                            There are {element.count} reachable stations in this sector.
                          </p>
                          <button
                            onClick={() => handleGroupClick(element)}
                            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-colors cursor-pointer"
                          >
                            Zoom in to View
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                }

                return (
                  <Marker
                    key={element._id}
                    position={[element.lat, element.lng]}
                    icon={chargerIcon}
                  >
                    <Popup>
                      <div className="w-48 p-1">
                        <h4 className="text-xs font-bold text-slate-100">{element.title}</h4>
                        <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                          ₹{element.pricePerKwh}/kWh • {element.speedKw}kW
                        </span>
                        <div className="mt-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          ✅ Within Range
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

        </div>

      </div>
    </div>
  );
};

export default RangeCalculator;
