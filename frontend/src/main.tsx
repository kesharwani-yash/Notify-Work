import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

window.addEventListener('error', (e) => {
  console.error('Global Error Captured:', e.error || e.message);
  const rootEl = document.getElementById('root');
  if (rootEl && (!rootEl.innerHTML || rootEl.innerHTML.trim() === '' || rootEl.innerHTML.includes('Loader2'))) {
    rootEl.innerHTML = `<div style="color:#ef4444;background:#09090b;padding:32px;font-family:system-ui,sans-serif;min-height:100vh;box-sizing:border-box;">
      <h2 style="font-size:20px;font-weight:bold;margin-bottom:12px;color:#f43f5e;">Runtime Application Error</h2>
      <pre style="background:#18181b;padding:16px;border-radius:12px;overflow:auto;font-size:12px;color:#f4f4f5;border:1px solid #27272a;">${e.error?.stack || e.message}</pre>
    </div>`;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled Promise Rejection:', e.reason);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
