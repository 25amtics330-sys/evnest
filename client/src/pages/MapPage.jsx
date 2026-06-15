import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import api, { getChargerPhoto, handleImageError } from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import AIChatWidget from '../components/AIChatWidget';
import { 
  Filter, RotateCcw, MapPin, Zap, Navigation, ArrowRight, 
  Search, SlidersHorizontal, RefreshCw, X, Star
} from 'lucide-react';

// Google Maps-style live blue dot user location icon
const createUserLocationIcon = () => L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(66,133,244,0.25);animation:ripple-blue 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:#4285F4;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(66,133,244,0.7);"></div>
    </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Animated car route marker that travels smoothly along polyline coordinates
const createCarIcon = (type = 'sedan', colorName = 'green') => {
  const colors = {
    green: { primary: '#10b981', secondary: '#34d399' },
    blue: { primary: '#0ea5e9', secondary: '#38bdf8' },
    red: { primary: '#ef4444', secondary: '#f87171' },
    pink: { primary: '#ec4899', secondary: '#f472b6' }
  };
  
  const selectedColor = colors[colorName] || colors.green;
  const prim = selectedColor.primary;
  const sec = selectedColor.secondary;
  
  let svgContent = '';
  
  if (type === 'suv') {
    svgContent = `
      <svg width="22" height="32" viewBox="0 0 22 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 6px ${prim});">
        <rect x="2" y="2" width="18" height="28" rx="5" fill="${prim}" opacity="0.4" />
        <rect x="3" y="4" width="16" height="24" rx="4" fill="${prim}" stroke="${sec}" stroke-width="2"/>
        <path d="M3 9 L19 9" stroke="${sec}" stroke-width="1"/>
        <path d="M5 13 L17 13 L15 9 L7 9 Z" fill="#ffffff" opacity="0.95"/>
        <rect x="5" y="13" width="12" height="10" fill="#1e293b"/>
        <line x1="7" y1="14" x2="7" y2="22" stroke="${sec}" stroke-width="1.5"/>
        <line x1="15" y1="14" x2="15" y2="22" stroke="${sec}" stroke-width="1.5"/>
        <path d="M5 23 L17 23 L16 26 L6 26 Z" fill="#ffffff" opacity="0.6"/>
        <rect x="4.5" y="4.5" width="2" height="1.5" rx="0.5" fill="#fbbf24"/>
        <rect x="15.5" y="4.5" width="2" height="1.5" rx="0.5" fill="#fbbf24"/>
        <rect x="4" y="27.5" width="2.5" height="1" fill="#ef4444"/>
        <rect x="15.5" y="27.5" width="2.5" height="1" fill="#ef4444"/>
      </svg>
    `;
  } else if (type === 'pickup') {
    svgContent = `
      <svg width="22" height="34" viewBox="0 0 22 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 6px ${prim});">
        <rect x="2" y="2" width="18" height="30" rx="4" fill="${prim}" opacity="0.4" />
        <rect x="3" y="4" width="16" height="26" rx="3" fill="${prim}" stroke="${sec}" stroke-width="2"/>
        <path d="M3 9 L19 9" stroke="${sec}" stroke-width="1"/>
        <path d="M5 13 L17 13 L15 9 L7 9 Z" fill="#ffffff" opacity="0.95"/>
        <rect x="5" y="13" width="12" height="7" fill="#1e293b"/>
        <path d="M5 20 L17 20 L16 21.5 L6 21.5 Z" fill="#ffffff" opacity="0.6"/>
        <rect x="5.5" y="22" width="11" height="6" rx="1" fill="#0f172a" stroke="${sec}" stroke-width="1"/>
        <circle cx="5.5" cy="5" r="1.2" fill="#fbbf24"/>
        <circle cx="16.5" cy="5" r="1.2" fill="#fbbf24"/>
        <rect x="4" y="29.5" width="2.5" height="1" fill="#ef4444"/>
        <rect x="15.5" y="29.5" width="2.5" height="1" fill="#ef4444"/>
      </svg>
    `;
  } else {
    // Sedan (default)
    svgContent = `
      <svg width="20" height="32" viewBox="0 0 20 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 6px ${prim});">
        <rect x="2" y="2" width="16" height="28" rx="4" fill="${prim}" opacity="0.4" />
        <rect x="3" y="4" width="14" height="24" rx="3" fill="${prim}" stroke="${sec}" stroke-width="2"/>
        <path d="M5 12 L15 12 L13 8 L7 8 Z" fill="#ffffff" opacity="0.95"/>
        <path d="M6 22 L14 22 L13 25 L7 25 Z" fill="#1e293b"/>
        <circle cx="6" cy="6" r="1.2" fill="#fbbf24"/>
        <circle cx="14" cy="6" r="1.2" fill="#fbbf24"/>
        <rect x="4" y="27" width="2" height="1.2" fill="#ef4444"/>
        <rect x="14" y="27" width="2" height="1.2" fill="#ef4444"/>
      </svg>
    `;
  }

  const width = type === 'sedan' ? 24 : 26;
  const height = type === 'pickup' ? 34 : 32;

  return L.divIcon({
    className: '',
    html: `
      <div class="car-container" style="transform: rotate(0deg); transition: transform 0.3s ease-out; width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center;">
        ${svgContent}
      </div>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2]
  });
};

function getBearing(lat1, lon1, lat2, lon2) {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
            
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
}

function getRouteBearingAtLocation(location, coords) {
  if (!coords || coords.length < 2 || !location) return 0;
  
  let minDistance = Infinity;
  let closestIndex = 0;
  
  for (let i = 0; i < coords.length - 1; i++) {
    const latDiff = location[0] - coords[i][0];
    const lngDiff = location[1] - coords[i][1];
    const d = latDiff * latDiff + lngDiff * lngDiff;
    if (d < minDistance) {
      minDistance = d;
      closestIndex = i;
    }
  }
  
  const p1 = coords[closestIndex];
  const p2 = coords[closestIndex + 1];
  return getBearing(p1[0], p1[1], p2[0], p2[1]);
}

// Helper component to handle map movement
function MapStateController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13, { animate: true, duration: 1.0 });
    }
  }, [center, zoom, map]);
  return null;
}

// Helper component to handle map events like zoom and pan
function MapEventsController({ setCurrentZoom, setCurrentBounds }) {
  const map = useMapEvents({
    moveend() { setCurrentBounds(map.getBounds()); },
    zoomend() {
      setCurrentZoom(map.getZoom());
      setCurrentBounds(map.getBounds());
    }
  });
  useEffect(() => {
    setCurrentBounds(map.getBounds());
    setCurrentZoom(map.getZoom());
  }, [map, setCurrentBounds, setCurrentZoom]);
  return null;
}


// Proximity-based dynamic clustering for zoom levels < 12
const groupIcon = (count) => L.divIcon({
  className: '',
  html: `<div style="display:flex;align-items:center;justify-content:center;height:36px;width:36px;border-radius:50%;background:rgba(16,185,129,0.2);border:2px solid #10b981;color:#6ee7b7;font-weight:800;font-size:12px;box-shadow:0 0 12px rgba(16,185,129,0.4);cursor:pointer;">${count}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});



// Helper component to manage the Car Marker without triggering full MapPage re-renders and icon recreation
function CarMarker({ position, routeCoordinates, avatarType, avatarColor }) {
  const markerRef = useRef(null);
  
  // Memoize the icon so it doesn't get recreated, preventing Leaflet from destroying and recreating the DOM element
  const icon = useMemo(() => createCarIcon(avatarType, avatarColor), [avatarType, avatarColor]);
  
  // Compute bearing whenever position changes
  const bearing = useMemo(() => {
    return getRouteBearingAtLocation(position, routeCoordinates);
  }, [position, routeCoordinates]);

  // Update DOM style directly for buttery smooth rotation without React/Leaflet overhead
  useEffect(() => {
    if (markerRef.current) {
      const el = markerRef.current.getElement();
      if (el) {
        const container = el.querySelector('.car-container');
        if (container) {
          container.style.transform = `rotate(${bearing}deg)`;
        }
      }
    }
  }, [bearing, icon]);

  return (
    <Marker 
      ref={markerRef}
      position={position} 
      icon={icon}
      zIndexOffset={1000}
    >
      <Popup>
        <div style={{fontSize:'11px',fontWeight:'bold',color:'#1e293b'}}>
          🚘 Driving Avatar ({avatarType})
        </div>
      </Popup>
    </Marker>
  );
}

const MapPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Core Data & Loading State
  const [rawChargers, setRawChargers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showFastOnly, setShowFastOnly] = useState(false);
  const [connectorFilter, setConnectorFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState(50);
  const [maxDistance, setMaxDistance] = useState(100);
  const [sortBy, setSortBy] = useState('distance');

  // User position & Routing states
  const [userLocation, setUserLocation] = useState([21.1855, 72.7989]);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [mapCenter, setMapCenter] = useState([21.1855, 72.7989]);
  const [mapZoom, setMapZoom] = useState(15);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [avatarType, setAvatarType] = useState('sedan');
  const [avatarColor, setAvatarColor] = useState('green');
  const locationWatchRef = useRef(null);
  const hasCenteredRef = useRef(false);
  
  // Selected detail panel status
  const [selectedCharger, setSelectedCharger] = useState(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Map viewport bounds tracking
  const [currentZoom, setCurrentZoom] = useState(15);
  const [currentBounds, setCurrentBounds] = useState(null);

  // Haversine formula calculation on frontend
  const getDistance = useCallback((lat1, lon1, lat2, lon2) => {
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
  }, []);

  // Compute distances dynamically in memory whenever user location or raw chargers update
  const chargers = useMemo(() => {
    return rawChargers.map(charger => {
      const dist = getDistance(userLocation[0], userLocation[1], charger.lat, charger.lng);
      return { ...charger, distance: dist };
    });
  }, [rawChargers, userLocation, getDistance]);

  // Start real-time GPS watch — like Google Maps live dot
  // The car avatar moves ONLY when the device physically moves (real GPS)
  useEffect(() => {
    if (!navigator.geolocation) return;

    // Start watching position continuously
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Always update live user location from real GPS
        setUserLocation([lat, lng]);
        setLocationAccuracy(position.coords.accuracy);
        
        // Auto-center map only on first GPS fix
        if (!hasCenteredRef.current) {
          hasCenteredRef.current = true;
          setMapCenter([lat, lng]);
          setMapZoom(15);
        }
      },
      (err) => {
        console.warn('GPS unavailable, using default Surat coordinates:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );

    locationWatchRef.current = watchId;

    // Cleanup watcher on unmount
    return () => {
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, []);

  // Manual re-center button handler
  const handleLocateUser = useCallback(() => {
    setMapCenter([...userLocation]);
    setMapZoom(16);
  }, [userLocation]);

  // Fetch Chargers from API
  const fetchChargers = useCallback(async (isInitial = true) => {
    if (isInitial) setLoading(true);
    else setBackgroundLoading(true);
    setError('');

    try {
      // Get all chargers including offline/unavailable ones
      const res = await api.get('/chargers');
      setRawChargers(res.data);
    } catch (err) {
      console.error('Failed to retrieve chargers:', err);
      setError('Could not establish connection to charging network.');
    } finally {
      setLoading(false);
      setBackgroundLoading(false);
    }
  }, []);

  // Initial Fetch & Live background status updates interval
  useEffect(() => {
    fetchChargers(true);

    // Dynamic background status refresh every 15 seconds to simulate real-time updates
    const interval = setInterval(() => {
      fetchChargers(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchChargers]);

  // Update reviews list when selected charger changes
  useEffect(() => {
    const fetchReviews = async () => {
      if (!selectedCharger) return;
      setReviewsLoading(true);
      try {
        const res = await api.get(`/reviews/${selectedCharger._id}`);
        setReviews(res.data);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [selectedCharger]);

  // Filter & Search & Sort computation
  const filteredAndSortedChargers = useMemo(() => {
    let result = [...chargers];

    // Real-time Text Search (on Title, Address, and City)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        c => c.title.toLowerCase().includes(q) || 
             c.address.toLowerCase().includes(q)
      );
    }

    // Available Now Toggle
    if (showAvailableOnly) {
      result = result.filter(c => c.status === 'available');
    }

    // Fast Chargers Toggle (>= 22 kW)
    if (showFastOnly) {
      result = result.filter(c => c.speedKw >= 22);
    }

    // Connector Type filter
    if (connectorFilter) {
      result = result.filter(c => c.connectorType === connectorFilter);
    }

    // Price Limit slider
    if (maxPrice < 50) {
      result = result.filter(c => c.pricePerKwh <= maxPrice);
    }

    // Distance limit slider
    if (maxDistance < 100) {
      result = result.filter(c => (c.distance || 0) <= maxDistance);
    }

    // Sorting options (Distance, Price, Charging Speed)
    result.sort((a, b) => {
      if (sortBy === 'distance') {
        return (a.distance || 0) - (b.distance || 0);
      } else if (sortBy === 'price') {
        return a.pricePerKwh - b.pricePerKwh;
      } else if (sortBy === 'speed') {
        return b.speedKw - a.speedKw;
      }
      return 0;
    });

    return result;
  }, [chargers, searchQuery, showAvailableOnly, showFastOnly, connectorFilter, maxPrice, maxDistance, sortBy]);

  // Sidebar list: only close-range chargers (≤ 20 km) capped at 30 to prevent lag.
  // The map markers still use filteredAndSortedChargers via getRenderedElements().
  const SIDEBAR_RANGE_KM = 20;
  const SIDEBAR_MAX_CARDS = 30;
  const sidebarChargers = useMemo(() => {
    return filteredAndSortedChargers.filter(c => (c.distance || 0) <= SIDEBAR_RANGE_KM).slice(0, SIDEBAR_MAX_CARDS);
  }, [filteredAndSortedChargers]);
  const hiddenCount = filteredAndSortedChargers.length - sidebarChargers.length;

  // Group / Cull chargers logic based on current zoom and bounds
  const getRenderedElements = () => {
    if (!currentBounds) return filteredAndSortedChargers;

    // Filter list to viewport bounds
    const visibleChargers = filteredAndSortedChargers.filter(c => {
      try {
        return currentBounds.contains([c.lat, c.lng]);
      } catch (err) {
        return true;
      }
    });


    // Zooms greater than 12 display individual markers
    if (currentZoom >= 12) {
      return visibleChargers;
    }

    // Dynamic clustering logic for zoomed out states
    let threshold = 0.015;
    if (currentZoom <= 6) threshold = 1.0;
    else if (currentZoom === 7) threshold = 0.5;
    else if (currentZoom === 8) threshold = 0.25;
    else if (currentZoom === 9) threshold = 0.12;
    else if (currentZoom === 10) threshold = 0.06;
    else if (currentZoom === 11) threshold = 0.03;

    const clusters = [];
    visibleChargers.forEach(charger => {
      let foundCluster = false;
      for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        const latDiff = charger.lat - (cluster.latSum / cluster.count);
        const lngDiff = charger.lng - (cluster.lngSum / cluster.count);
        const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

        if (dist < threshold) {
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
      if (c.count === 1) return c.chargers[0];
      return {
        _id: c._id,
        isGroup: true,
        title: `Cluster Grid`,
        lat: c.latSum / c.count,
        lng: c.lngSum / c.count,
        count: c.count
      };
    });
  };

  // Click card / select charger handler
  const handleSelectCharger = (charger) => {
    setSelectedCharger(charger);
    setMapCenter([charger.lat, charger.lng]);
    setMapZoom(15);
    setDetailPanelOpen(true);
    setRouteCoordinates([]);
  };

  // Trigger OSRM directions mapping
  const handleGetDirections = async (charger, e) => {
    if (e) e.stopPropagation();
    const start = userLocation;
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${charger.lng},${charger.lat}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
          setRouteCoordinates(coords);
        } else {
          setRouteCoordinates([start, [charger.lat, charger.lng]]);
        }
      } else {
        setRouteCoordinates([start, [charger.lat, charger.lng]]);
      }
    } catch (err) {
      console.error('OSRM pathfinder error, fall backing to straight line:', err);
      setRouteCoordinates([start, [charger.lat, charger.lng]]);
    }
  };

  const handleGroupClick = (group) => {
    const nextZoom = Math.min(currentZoom + 2, 14);
    setMapCenter([group.lat, group.lng]);
    setMapZoom(nextZoom);
  };

  const getStatusDetails = (status) => {
    switch (status) {
      case 'available':
        return { label: 'Available', desc: 'Online and ready for charging.', dotClass: 'bg-emerald-500 animate-pulse', textClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' };
      case 'charging':
        return { label: 'In Use', desc: 'An EV is currently charging here.', dotClass: 'bg-blue-500 animate-pulse', textClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50' };
      case 'reserved':
        return { label: 'Reserved', desc: 'This slot has been pre-booked.', dotClass: 'bg-amber-500', textClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' };
      case 'offline':
        return { label: 'Offline', desc: 'Offline - Charger not available', dotClass: 'bg-rose-500', textClass: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50' };
      case 'maintenance':
        return { label: 'Maintenance', desc: 'Under Maintenance - Temporarily unavailable', dotClass: 'bg-slate-500', textClass: 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50' };
      case 'coming_soon':
        return { label: 'Coming Soon', desc: 'Coming Soon - Pending network activation', dotClass: 'bg-indigo-500', textClass: 'text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-indigo-250 dark:border-indigo-800/50' };
      default:
        return { label: 'Unknown', desc: 'Status unknown', dotClass: 'bg-slate-300', textClass: 'text-slate-405' };
    }
  };

  const getLeafletIcon = (status) => {
    let className = 'custom-pin-available';
    let innerClassName = 'custom-pin-available-inner';
    
    if (status === 'charging') {
      className = 'custom-pin-charging';
      innerClassName = 'custom-pin-charging-inner';
    } else if (status === 'reserved') {
      className = 'custom-pin-reserved';
      innerClassName = 'custom-pin-reserved-inner';
    } else if (status === 'offline') {
      className = 'custom-pin-offline';
      innerClassName = 'custom-pin-offline-inner';
    } else if (status === 'maintenance' || status === 'coming_soon') {
      className = 'custom-pin-unavailable';
      innerClassName = 'custom-pin-unavailable-inner';
    }

    return L.divIcon({
      className,
      html: `<div class="${innerClassName}"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setShowAvailableOnly(false);
    setShowFastOnly(false);
    setConnectorFilter('');
    setMaxPrice(50);
    setMaxDistance(100);
    setSortBy('distance');
    setRouteCoordinates([]);
  };

  // Skeleton Loader Component
  const CardSkeleton = () => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="h-4 bg-slate-100 rounded w-2/3"></div>
        <div className="h-5 bg-slate-100 rounded w-16"></div>
      </div>
      <div className="h-3 bg-slate-100 rounded w-3/4"></div>
      <div className="flex justify-between items-center pt-2">
        <div className="flex gap-2">
          <div className="h-5 bg-slate-100 rounded w-12"></div>
          <div className="h-5 bg-slate-100 rounded w-16"></div>
        </div>
        <div className="h-6 bg-slate-100 rounded w-20"></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col md:flex-row relative overflow-hidden bg-slate-50" style={{height:'calc(100vh - 64px)'}}>
      
      {/* Sidebar List and Filters */}
      <aside className="w-full md:w-[400px] bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 relative">
        
        {/* Search Header */}
        <div className="p-4 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search station or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-lg border transition-all flex items-center justify-center ${
                showFilters 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-600' 
                  : 'border-slate-300 text-slate-400 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Filters Row */}
          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
            <button
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                showAvailableOnly
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Available Now
            </button>
            <button
              onClick={() => setShowFastOnly(!showFastOnly)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                showFastOnly
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Fast (22kW+)
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold border bg-slate-100 border-slate-200 text-slate-600 outline-none hover:border-slate-300"
            >
              <option value="distance">Sort: Nearby</option>
              <option value="price">Sort: Cheap</option>
              <option value="speed">Sort: Fastest</option>
            </select>
          </div>
        </div>

        {/* Detailed Filters Panel */}
        {showFilters && (
          <div className="p-4 bg-white border-b border-slate-200 space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Filters</span>
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset All
              </button>
            </div>

            {/* Connector selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Connector Type</label>

              <div className="grid grid-cols-2 gap-2">
                {['CCS', 'Type2', 'CHAdeMO', 'Bharat AC'].map(connector => (
                  <button
                    key={connector}
                    onClick={() => setConnectorFilter(connectorFilter === connector ? '' : connector)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                      connectorFilter === connector
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {connector === 'CCS' ? 'CCS2 (DC Fast)' : connector === 'Type2' ? 'Type2 (AC)' : connector}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider constraints */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                  <span>Max Price</span>
                  <span className="text-emerald-600">₹{maxPrice}/kWh</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1 rounded-lg bg-slate-200"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
                  <span>Max Radius</span>
                  <span className="text-emerald-600">{maxDistance} km</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1 rounded-lg bg-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Listings Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : error ? (
            <div className="text-center py-12 px-6">
              <p className="text-sm font-semibold text-red-500 mb-2">{error}</p>
              <button 
                onClick={() => fetchChargers(true)}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200 transition-colors"
              >
                Retry Grid Scan
              </button>
            </div>
          ) : sidebarChargers.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white rounded-xl border border-slate-200 border-dashed">
              <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700 mb-1">No Nearby Chargers</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">No chargers within 20 km. Try relaxing your filters or expanding the Max Radius slider.</p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {sidebarChargers.map((c) => {
                const statusInfo = getStatusDetails(c.status);
                const isSelected = selectedCharger?._id === c._id;
                
                return (
                  <div
                    key={c._id}
                    onClick={() => handleSelectCharger(c)}
                    className={`rounded-xl border p-3.5 transition-all duration-200 cursor-pointer group flex gap-3.5 items-center ${
                      isSelected 
                        ? 'bg-emerald-50 border-emerald-400 shadow-md ring-1 ring-emerald-500/20'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 bg-slate-100 relative">
                      <img 
                        src={getChargerPhoto(c.photos)} 
                        alt="Charger" 
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={handleImageError}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Status indicator pill */}
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h3 className="text-xs font-extrabold text-slate-800 leading-tight group-hover:text-slate-900 line-clamp-1 flex-1">
                          {c.title}
                        </h3>
                        
                        {/* Status Badge */}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 border shrink-0 ${statusInfo.textClass}`}>
                          <span className={`h-1 w-1 rounded-full ${statusInfo.dotClass}`} />
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Distance and Address */}
                      <p className="text-[10px] text-slate-400 mb-2 flex items-center gap-1.5">
                        <span className="font-extrabold text-emerald-700 shrink-0 bg-emerald-50 px-1 py-0.5 rounded text-[8px] leading-none">
                          {c.distance ? `${c.distance.toFixed(1)} km` : '---'}
                        </span>
                        <span className="truncate">{c.address}</span>
                      </p>

                      {/* Pricing and specifications */}
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                        <div className="flex gap-1.5 text-[9px] text-slate-500">
                          <span className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Zap className="h-2.5 w-2.5 text-amber-500 fill-current shrink-0" />
                            <span className="font-bold text-slate-700">{c.speedKw} kW</span>
                          </span>
                          <span className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            {c.connectorType === 'CCS' ? 'CCS2' : c.connectorType}
                          </span>
                        </div>

                        <div className="text-right leading-none">
                          <span className="text-[11px] font-extrabold text-emerald-600">
                            ₹{c.pricePerKwh.toFixed(2)}
                          </span>
                          <span className="text-[8px] text-slate-400 font-medium block">/kWh</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Beyond-range hint */}
              {hiddenCount > 0 && (
                <div className="text-center py-3 px-4 rounded-lg border border-dashed border-slate-200 bg-white">
                  <p className="text-[10px] text-slate-400 font-medium">
                    +{hiddenCount} more charger{hiddenCount !== 1 ? 's' : ''} beyond 20 km — use the map or expand <span className="text-emerald-600 font-bold">Max Radius</span> in filters.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Background syncing loader indicator */}
        {backgroundLoading && (
          <div className="absolute top-2 right-4 z-20 flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full animate-pulse">
            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            <span>Syncing Grid...</span>
          </div>
        )}
      </aside>

      {/* Map pane — Leaflet requires absolute/explicit sizing */}
      <main style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <div style={{ position: 'absolute', inset: 0 }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Light CARTO Voyager tiles — clean Google Maps-like look */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          <MapStateController center={mapCenter} zoom={mapZoom} />
          <MapEventsController setCurrentZoom={setCurrentZoom} setCurrentBounds={setCurrentBounds} />

          {/* Live user location marker — Google Maps blue dot or Driving Avatar */}
          {userLocation && (
            routeCoordinates.length > 0 ? (
              <CarMarker 
                position={userLocation} 
                routeCoordinates={routeCoordinates}
                avatarType={avatarType}
                avatarColor={avatarColor}
              />
            ) : (
              <Marker position={userLocation} icon={createUserLocationIcon()}>
                <Popup>
                  <div style={{fontSize:'11px',fontWeight:'bold',color:'#1e293b'}}>
                    📍 Your Live Location
                    {locationAccuracy && <div style={{color:'#64748b',fontSize:'9px',marginTop:'2px'}}>Accuracy: ±{Math.round(locationAccuracy)}m</div>}
                  </div>
                </Popup>
              </Marker>
            )
          )}

          {/* Route directions path */}
          {routeCoordinates.length > 0 && (
            <>
              {/* Outer Core Glow */}
              <Polyline
                positions={routeCoordinates}
                pathOptions={{
                  color: '#10b981',
                  weight: 8,
                  opacity: 0.35,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
              {/* Core Line */}
              <Polyline
                positions={routeCoordinates}
                pathOptions={{
                  color: '#34d399',
                  weight: 4,
                  opacity: 0.9,
                  lineCap: 'round',
                  lineJoin: 'round'
                }}
              />
            </>
          )}

          {/* Map markers representing clusters and individual chargers */}
          {getRenderedElements().map((el) => {
            if (el.isGroup) {
              return (
                <Marker
                  key={el._id}
                  position={[el.lat, el.lng]}
                  icon={groupIcon(el.count)}
                  eventHandlers={{
                    click: () => handleGroupClick(el)
                  }}
                />
              );
            }

            return (
              <Marker
                key={el._id}
                position={[el.lat, el.lng]}
                icon={getLeafletIcon(el.status)}
                eventHandlers={{
                  click: () => handleSelectCharger(el)
                }}
              />
            );
          })}
        </MapContainer>
        </div>{/* end absolute map wrapper */}

        {routeCoordinates.length > 0 && (
          <div className="absolute top-6 left-6 z-[1000] p-4 bg-white border border-slate-200 rounded-xl shadow-lg w-64">
            <h4 className="text-xs font-extrabold text-slate-800 mb-2.5 flex items-center gap-1.5">
              <span>🚗</span> Driving Avatar Settings
            </h4>
            
            {/* Avatar Type Selector */}
            <div className="space-y-1.5 mb-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Vehicle Model</span>
              <div className="flex gap-1.5">
                {[
                  { id: 'sedan', label: 'Sedan', icon: '🚘' },
                  { id: 'suv', label: 'SUV', icon: '🚙' },
                  { id: 'pickup', label: 'Pickup', icon: '🛻' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setAvatarType(item.id)}
                    className={`flex-1 py-1 px-1.5 text-[10px] font-extrabold rounded-lg border transition-all flex flex-col items-center justify-center gap-0.5 ${
                      avatarType === item.id 
                        ? 'bg-emerald-600 border-emerald-500 text-white' 
                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[8px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Avatar Color Selector */}
            <div className="space-y-1.5 mb-3">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Avatar Color</span>
              <div className="flex gap-2.5 items-center">
                {[
                  { id: 'green', color: '#10b981', label: 'Green' },
                  { id: 'blue', color: '#0ea5e9', label: 'Blue' },
                  { id: 'red', color: '#ef4444', label: 'Red' },
                  { id: 'pink', color: '#ec4899', label: 'Pink' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setAvatarColor(item.id)}
                    style={{ backgroundColor: item.color }}
                    className={`h-4.5 w-4.5 rounded-full border-2 transition-all hover:scale-110 ${
                      avatarColor === item.id ? 'border-slate-800 scale-110 ring-2 ring-emerald-500/30' : 'border-slate-300'
                    }`}
                    title={item.label}
                  />
                ))}
              </div>
            </div>

            {/* Real-time GPS indicator */}
            <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider">Live GPS Tracking</span>
            </div>
          </div>
        )}

        {/* Locate Me Floating Button */}
        <button
          onClick={handleLocateUser}
          className="absolute bottom-24 right-6 z-[1000] p-3 rounded-full bg-white border border-slate-200 text-slate-600 shadow-lg hover:scale-105 hover:bg-slate-50 transition-all cursor-pointer"
          title="Center on my location"
        >
          <Navigation className="h-5 w-5 rotate-45 text-blue-500 fill-current" />
        </button>

        {/* Detailed charger slide-over Bottom Sheet/Modal */}
        {detailPanelOpen && selectedCharger && (
          <div className="absolute inset-x-0 bottom-0 md:bottom-auto md:top-6 md:right-6 md:left-auto md:w-96 z-[1001] p-4 shrink-0 transition-transform duration-300">
            <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden relative max-h-[85vh] md:max-h-[calc(100vh-120px)] flex flex-col">
              
              {/* Top border header */}
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-emerald-500 to-teal-400 z-20"></div>
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setDetailPanelOpen(false);
                  setRouteCoordinates([]);
                }}
                className="absolute top-4 right-4 z-20 h-8 w-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-600 border border-slate-200 transition-colors shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Photo section */}
              <div className="relative h-44 shrink-0">
                <img 
                  src={getChargerPhoto(selectedCharger.photos)} 
                  alt={selectedCharger.title}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className={`text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full border bg-white/20 text-white border-white/30 inline-block mb-1 backdrop-blur-sm`}>
                    EVNest Host Network
                  </span>
                  <h2 className="text-base font-extrabold text-white leading-tight truncate">{selectedCharger.title}</h2>
                </div>
              </div>

              {/* Scrollable details wrapper */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {/* Status indicator row */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${getStatusDetails(selectedCharger.status).dotClass}`} />
                      <span className="text-sm font-bold text-slate-800">
                        {getStatusDetails(selectedCharger.status).label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Last updated: 3 mins ago</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {getStatusDetails(selectedCharger.status).desc}
                  </p>
                </div>

                {/* Grid details */}
                <div className="grid grid-cols-3 gap-3 border-y border-slate-100 py-3.5 text-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Speed</span>
                    <span className="text-sm font-extrabold text-slate-800 flex items-center justify-center gap-0.5">
                      <Zap className="h-4.5 w-4.5 text-amber-500 fill-current" />
                      {selectedCharger.speedKw} kW
                    </span>
                  </div>
                  <div className="space-y-0.5 border-x border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Connector</span>
                    <span className="text-sm font-extrabold text-slate-800 block">
                      {selectedCharger.connectorType === 'CCS' ? 'CCS2 (DC)' : selectedCharger.connectorType}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Rate</span>
                    <span className="text-sm font-extrabold text-emerald-600 block">
                      ₹{selectedCharger.pricePerKwh}/kWh
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</h4>
                  <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedCharger.address}</span>
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">About Station</h4>
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    "{selectedCharger.description || 'Secure home driveway charger listing.'}"
                  </p>
                </div>

                {/* Host details */}
                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs border border-emerald-200">
                    {selectedCharger.merchantId?.name?.charAt(0) || 'H'}
                  </div>
                  <div className="leading-tight">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Listed by Host</span>
                    <span className="text-xs text-slate-700 font-bold">{selectedCharger.merchantId?.name || 'Local Host'}</span>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500 fill-current" />
                    Reviews ({reviews.length})
                  </h4>
                  {reviewsLoading ? (
                    <div className="space-y-2">
                      <div className="h-8 bg-slate-100 rounded-lg animate-pulse"></div>
                      <div className="h-8 bg-slate-100 rounded-lg animate-pulse"></div>
                    </div>
                  ) : reviews.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">No reviews yet. Be the first driver to submit feedback!</p>
                  ) : (
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {reviews.slice(0, 3).map((r, ri) => (
                        <div key={ri} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px]">
                          <div className="flex justify-between mb-1.5 font-bold">
                            <span className="text-slate-700">{r.userId?.name || 'EV Driver'}</span>
                            <span className="text-amber-500 flex items-center gap-0.5">
                              {r.rating} <Star className="h-2.5 w-2.5 fill-current" />
                            </span>
                          </div>
                          <p className="text-slate-400 italic">"{r.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Footer Buttons */}
              <div className="p-4 bg-white border-t border-slate-100 shrink-0 flex gap-2.5">
                <button
                  onClick={(e) => handleGetDirections(selectedCharger, e)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 font-extrabold text-xs text-slate-700 transition-colors cursor-pointer"
                >
                  <Navigation className="h-4 w-4 text-emerald-500" />
                  Route Map
                </button>
                
                <button
                  onClick={() => navigate(`/charger/${selectedCharger._id}`)}
                  disabled={['offline', 'maintenance', 'coming_soon'].includes(selectedCharger.status)}
                  className="flex-1 flex items-center justify-center gap-1 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all disabled:opacity-40 cursor-pointer"
                >
                  Book Slot
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Floating AI Chat Assistant bottom right */}
        <AIChatWidget onFocusCharger={handleSelectCharger} />
      </main>

    </div>
  );
};

export default MapPage;
