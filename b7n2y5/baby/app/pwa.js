/* Phone install: only when served over http(s) — the downloaded file:// copy skips this (no manifest or service worker there). */
(function () {
  'use strict';
  if (!/^https?:$/.test(location.protocol)) return;
  const l = document.createElement('link');
  l.rel = 'manifest'; l.href = 'manifest.webmanifest';
  document.head.appendChild(l);
  if ('serviceWorker' in navigator) window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
})();
