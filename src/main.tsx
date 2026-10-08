import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import type { BeforeInstallPromptEvent } from './usePWAInstall';

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    window.__deferredPWAInstallPrompt = e as BeforeInstallPromptEvent;
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Unregister any broken dev-sw.js registrations and register /sw.js at root scope
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          if (reg.active?.scriptURL.includes('dev-sw.js')) {
            reg.unregister();
          }
        }
      });

      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          reg.update();
        })
        .catch((err) => {
          console.error('SW registration error:', err);
        });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
