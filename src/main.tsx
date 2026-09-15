import { createRoot } from 'react-dom/client';
import './index.css';
import AppRouter from './AppRouter';
import { ThemeProvider } from './context/ThemeContext';
import { PwaProvider } from './context/PwaContext';

// Register PWA service worker in production browser environments
if (
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator
) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.update();
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
  });
} else if (
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator
) {
  // In development, unregister any active service worker and clean caches to prevent stale caching
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
}

// Request persistent storage to protect offline IndexedDB and Cache Storage from browser eviction
if (
  typeof navigator !== 'undefined' &&
  navigator.storage &&
  navigator.storage.persist
) {
  navigator.storage.persist().catch(() => {
    // Best-effort; silently ignore if denied or in private mode
  });
}

createRoot(document.getElementById('runjs')!).render(
  <ThemeProvider>
    <PwaProvider>
      <AppRouter />
    </PwaProvider>
  </ThemeProvider>
);
