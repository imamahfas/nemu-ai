import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './lib/i18n';
import { registerSW } from 'virtual:pwa-register';
import { ErrorBoundary } from './components/ErrorBoundary';

// Register PWA service worker safely after the window has fully loaded.
// This prevents resource contention on iOS Safari between Framer Motion startup animations and Service Worker caching,
// eliminating the "a problem repeatedly occurred" rendering crash.
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    registerSW({
      immediate: false,
      onOfflineReady() {
        console.log("Nemu PWA is ready for offline use.");
      },
      onNeedRefresh() {
        console.log("New content available, updating PWA in background.");
      }
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

