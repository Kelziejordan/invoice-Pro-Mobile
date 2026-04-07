// Polyfill process.env for browser environment
if (typeof window !== 'undefined' && !window.process) {
  (window as any).process = { env: {} };
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA support
const updateSW = registerSW({
  onNeedRefresh() {
    // Optional: show a prompt to user
  },
  onOfflineReady() {
    console.log('App is ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
