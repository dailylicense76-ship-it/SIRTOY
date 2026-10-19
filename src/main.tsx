import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
// @ts-ignore
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker on web host to cache all compiled assets for full offline usage (bypass in Electron file:// mode)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol !== 'file:') {
  try {
    registerSW({ immediate: true });
  } catch (err) {
    console.warn('PWA ServiceWorker registration bypassed:', err);
  }
}

createRoot(document.getElementById('root')!).render(<App />);
