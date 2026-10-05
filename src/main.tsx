import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import type { BeforeInstallPromptEvent } from './usePWAInstall';

// Capture beforeinstallprompt immediately before React mounts so it is never missed
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    window.__deferredPWAInstallPrompt = e as BeforeInstallPromptEvent;
  });

  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        if (name.startsWith('energy-dashboard-v')) {
          caches.delete(name);
        }
      });
    });
  }
}

// Register the service worker for PWA support and offline caching
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
