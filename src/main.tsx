import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Clear any legacy v1 service worker caches so old IP addresses are never served from cache
if ('caches' in window) {
  caches.keys().then((names) => {
    names.forEach((name) => {
      if (name === 'energy-dashboard-v1' || name === 'energy-dashboard-v2') {
        caches.delete(name);
      }
    });
  });
}

// Register the service worker for PWA support and offline caching
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
