import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Interceptor to automatically add JWT token to requests if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('evnest_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Inline SVG fallback placeholder — renders instantly, no network request
const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#bg)"/>
  <g transform="translate(260,140)" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18l6-6-6-6" opacity="0.5"/>
    <rect x="20" y="2" width="40" height="32" rx="4"/>
    <line x1="40" y1="2" x2="40" y2="34"/>
    <path d="M40 10h12M40 18h12M40 26h12"/>
    <circle cx="20" cy="42" r="3" fill="#10b981"/>
    <path d="M23 42h37" stroke-dasharray="4 3"/>
  </g>
  <text x="300" y="230" text-anchor="middle" fill="#334155" font-family="system-ui,sans-serif" font-size="16" font-weight="700">EV Charger</text>
</svg>`)}`;

export const getChargerPhoto = (photos) => {
  if (!photos) return FALLBACK_IMAGE;
  if (Array.isArray(photos)) {
    return photos[0] || FALLBACK_IMAGE;
  }
  if (typeof photos === 'string' && photos.length > 5) {
    return photos;
  }
  return FALLBACK_IMAGE;
};

// Attach to <img onError={handleImageError}> to swap broken images to the placeholder
export const handleImageError = (e) => {
  e.target.onerror = null; // prevent infinite loop
  e.target.src = FALLBACK_IMAGE;
};

export default api;
