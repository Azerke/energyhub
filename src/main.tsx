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
    window.addEventListener('load', async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          const scriptURL =
            reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || '';
          if (scriptURL.includes('dev-sw.js')) {
            await reg.unregister();
          }
        }

        await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      } catch {
        // Ignore service worker registration errors in restricted preview contexts
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
