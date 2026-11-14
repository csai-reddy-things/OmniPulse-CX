import axios from 'axios';

export const getApiBaseUrl = () => {
  // 1. Check if user configured a custom URL in localStorage (instant testing on mobile/demo without rebuild)
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('omnipulse_custom_api_url');
    if (customUrl && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, '');
    }
  }

  // 2. Check Vite build-time environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.replace(/\/+$/, '');
  }

  // 3. If accessed via local network IP (e.g. mobile device on http://192.168.x.x:5173)
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    // Check if it's an IPv4 LAN address
    if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host) && host !== '127.0.0.1') {
      return `http://${host}:5000/api`;
    }
  }

  // 4. Default to env or localhost
  return (envUrl || 'http://localhost:5000/api').replace(/\/+$/, '');
};

const axiosClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 35000, // 35s timeout to gracefully allow Render free tier cold starts
});

// Request interceptor to attach JWT token and ensure latest baseURL
axiosClient.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem('omnipulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401 responses
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        localStorage.removeItem('omnipulse_token');
        localStorage.removeItem('omnipulse_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
