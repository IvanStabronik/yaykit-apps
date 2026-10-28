/* Yaykit runtime v1.0 — tiny, dependency-free helpers shared by every product.
   Works from file:// with no network. Exposes window.Yay.

   Yay.icon(name, opts)                 inline SVG string
   Yay.store(key, opts)                 localStorage with in-memory fallback + status
   Yay.saveBadge(el, store)             keeps a .y-save element in sync with store status
   Yay.download / exportJSON / pickJSON file in/out
   Yay.toast(msg) · Yay.confirm(opts)   feedback
   Yay.autosize(textarea)               grow-to-fit
   Yay.print({ paper })                 print page or only the .y-print-target sheet
   Yay.fmt.money / number / percent / monthYear
   Yay.chart.area(series, w, h, pad)    SVG path data
   Yay.tablist(el)                      arrow-key navigation for [role=tablist]
*/
(function () {
  'use strict';

  /* ---------- icons (24px grid, stroke) ---------- */
  const P = {
    focus: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>',
    party: '<path d="M4 20 9.5 7.5l7 7L4 20Z"/><path d="M14 4.5c.5 1 1.5 1.5 2.5 1.2M18.5 9.5c1-.3 2 .2 2.5 1.1M15.5 8.5 20 4"/>',
    heart: '<path d="M12 20s-7.5-4.5-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.5 12 20 12 20Z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
    home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    trash: '<path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
    print: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="7" rx="2"/><path d="M7 14h10v6H7z"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14"/>',
    upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 20h14"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    prev: '<path d="M14.5 6 8.5 12l6 6"/>',
    next: '<path d="M9.5 6l6 6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 1.5M9.5 3h5"/>',
    flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.1 0-3.2 2.4-5.1 3.6-7.9.5 1.6 1.4 2.6 2.6 3.1C12 7 13.4 4.8 15.6 3c-.3 2.9 3 5.4 3 10.1C18.6 17.9 15.9 21 12 21Z"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M12 9v11M4 13h16M12 9c-1.5-3.5-5.5-4-5.5-1.5S9.5 9 12 9Zm0 0c1.5-3.5 5.5-4 5.5-1.5S14.5 9 12 9Z"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    star: '<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6Z"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="m7 15 4-4 3 3 5-6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
    warn: '<path d="M12 4 2.8 19.5h18.4L12 4Z"/><path d="M12 10v4.5M12 17v.01"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    grid: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
    award: '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.3-1.5 7.2 5-2.5 5 2.5-1.5-7.2"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    shuffle: '<path d="M4 7h3.5c4.5 0 4.5 10 9 10H20M4 17h3.5c1.4 0 2.3-.9 3-2.2M13.5 9.2c.7-1.3 1.6-2.2 3-2.2H20M17.5 4.5 20 7l-2.5 2.5M17.5 14.5 20 17l-2.5 2.5"/>'
  };
  function icon(name, opts) {
    opts = opts || {};
    const d = P[name] || P.info;
    const cls = 'y-icon' + (opts.size ? ' y-icon--' + opts.size : '') + (opts.cls ? ' ' + opts.cls : '');
    const a11y = opts.label ? `role="img" aria-label="${esc(opts.label)}"` : 'aria-hidden="true"';
    return `<svg class="${cls}" viewBox="0 0 24 24" ${a11y} fill="none" stroke="currentColor" stroke-width="${opts.stroke || 1.9}" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------- storage ----------
     All file:// pages in Chrome share ONE origin and one ~5 MB quota, so keys are
     namespaced ("yaykit:<product>:v1") and failures never lose the session:
     data stays in memory and status tells the user to export.            */
  function store(key, opts) {
    opts = opts || {};
    const fullKey = 'yaykit:' + key;
    const listeners = [];
    let memory = null, status = 'idle', savedAt = null, timer = null, firstPending = 0;
    const setStatus = s => { status = s; listeners.forEach(fn => fn(status, savedAt)); };
    function write() {
      timer = null; firstPending = 0;
      try { localStorage.setItem(fullKey, JSON.stringify(memory)); savedAt = new Date(); setStatus('saved'); }
      catch (e) { setStatus(e && (e.name === 'QuotaExceededError' || e.code === 22) ? 'full' : 'blocked'); }
    }
    // closing, reloading or switching away must not drop the last edits
    window.addEventListener('pagehide', () => api.flush());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') api.flush(); });
    const api = {
      key: fullKey,
      get status() { return status; },
      get savedAt() { return savedAt; },
      onStatus(fn) { listeners.push(fn); fn(status, savedAt); return api; },
      load(fallback) {
        try {
          const raw = localStorage.getItem(fullKey);
          if (raw) { memory = JSON.parse(raw); setStatus('saved'); return memory; }
          setStatus('idle');
        } catch (e) { setStatus('blocked'); }
        memory = memory || (typeof fallback === 'function' ? fallback() : fallback);
        return memory;
      },
      save(data, immediate) {
        memory = data;
        clearTimeout(timer);
        const now = Date.now();
        if (!firstPending) firstPending = now;
        // debounce, but never hold unsaved changes for more than a second
        if (immediate || now - firstPending > 1000) write();
        else timer = setTimeout(write, opts.delay == null ? 250 : opts.delay);
      },
      flush() { if (timer) { clearTimeout(timer); write(); } },
      clear() { memory = null; try { localStorage.removeItem(fullKey); } catch (e) { /* ignore */ } setStatus('idle'); },
      peek() { return memory; }
    };
    return api;
  }

  const SAVE_TEXT = {
    idle: 'Autosave is on',
    saved: t => 'Saved on this device' + (t ? ' · ' + t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
    blocked: 'Not saving — browser storage is blocked. Export a backup.',
    full: 'Storage full — export a backup to keep your work.'
  };
  function saveBadge(el, st) {
    if (!el) return;
    st.onStatus((s, t) => {
      const text = typeof SAVE_TEXT[s] === 'function' ? SAVE_TEXT[s](t) : SAVE_TEXT[s];
      el.dataset.state = s;
      el.innerHTML = icon(s === 'blocked' || s === 'full' ? 'warn' : 'check', { size: 'sm' }) + '<span>' + esc(text) + '</span>';
    });
  }

  /* ---------- files ---------- */
  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function exportJSON(obj, name) {
    const stamp = new Date().toISOString().slice(0, 10);
    download(`${name || 'yaykit-backup'}-${stamp}.json`, JSON.stringify({ app: name, exportedAt: new Date().toISOString(), data: obj }, null, 2), 'application/json');
  }
  function pickJSON() {
    return new Promise((resolve, reject) => {
      const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'application/json,.json' });
      input.addEventListener('change', () => {
        const f = input.files && input.files[0];
        if (!f) return reject(new Error('No file chosen'));
        const r = new FileReader();
        r.onload = () => { try { const j = JSON.parse(r.result); resolve(j && j.data !== undefined ? j.data : j); } catch (e) { reject(new Error('That file is not a Yaykit backup')); } };
        r.onerror = () => reject(r.error);
        r.readAsText(f);
      });
      input.click();
    });
  }

  /* ---------- feedback ---------- */
  function toast(msg, ms) {
    let host = document.querySelector('.y-toasts');
    if (!host) { host = document.createElement('div'); host.className = 'y-toasts'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
    host.querySelectorAll('.y-toast').forEach(old => { if (old.textContent === msg) old.remove(); }); // no stacks of the same message
    const t = document.createElement('div'); t.className = 'y-toast'; t.textContent = msg; host.appendChild(t);
    setTimeout(() => { t.classList.add('is-leaving'); setTimeout(() => t.remove(), 160); }, ms || 2400);
  }
  function confirm(o) {
    o = Object.assign({ title: 'Are you sure?', body: '', ok: 'Confirm', cancel: 'Cancel', danger: false }, o);
    return new Promise(resolve => {
      const d = document.createElement('dialog');
      d.className = 'y-dialog';
      d.innerHTML = `<form method="dialog"><div class="y-dialog-body"><h2>${esc(o.title)}</h2>${o.body ? `<p>${esc(o.body)}</p>` : ''}</div>
        <div class="y-dialog-actions"><button class="y-btn y-btn--secondary" value="cancel">${esc(o.cancel)}</button>
        <button class="y-btn ${o.danger ? 'y-btn--danger' : 'y-btn--world'}" value="ok">${esc(o.ok)}</button></div></form>`;
      (document.querySelector('.y-app') || document.body).appendChild(d);
      d.addEventListener('close', () => { resolve(d.returnValue === 'ok'); d.remove(); });
      if (typeof d.showModal === 'function') d.showModal(); else resolve(window.confirm(o.title));
    });
  }

  /* ---------- inputs ---------- */
  function autosize(ta) {
    const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
    ta.addEventListener('input', fit);
    window.addEventListener('resize', fit, { passive: true });
    requestAnimationFrame(fit);
    return fit;
  }
  function tablist(el, onSelect) {
    const tabs = () => Array.from(el.querySelectorAll('[role="tab"]'));
    el.addEventListener('keydown', e => {
      const list = tabs(), i = list.indexOf(document.activeElement);
      if (i < 0) return;
      let n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % list.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + list.length) % list.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = list.length - 1;
      if (n !== null) { e.preventDefault(); list[n].focus(); if (onSelect) onSelect(list[n]); else list[n].click(); }
    });
  }

  /* ---------- print ----------
     Yay.print() prints the page without app chrome.
     Yay.print({ paper: true }) prints only the element with .y-print-target
     (a .y-paper-shell holding a .y-paper): documents leave with no Yaykit UI. */
  function print(o) {
    o = o || {};
    const root = document.documentElement;
    if (o.paper) root.setAttribute('data-print', 'paper');
    const done = () => { root.removeAttribute('data-print'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    if (!('onafterprint' in window)) setTimeout(done, 1000);
  }

  /* ---------- formatting ---------- */
  const fmt = {
    money(n, o) {
      o = o || {};
      const v = +n || 0;
      try { return v.toLocaleString(o.locale || 'en-US', { style: 'currency', currency: o.currency || 'USD', minimumFractionDigits: o.cents ? 2 : 0, maximumFractionDigits: o.cents ? 2 : 0 }); }
      catch (e) { return '$' + v.toFixed(o.cents ? 2 : 0); }
    },
    number(n, d) { return (+n || 0).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d }); },
    percent(n, d) { return (+n || 0).toLocaleString('en-US', { maximumFractionDigits: d == null ? 1 : d }) + '%'; },
    monthYear(date, addMonths) {
      const d = new Date(date.getFullYear(), date.getMonth() + (addMonths || 0), 1);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
  };

  /* ---------- charts ---------- */
  const chart = {
    area(series, w, h, pad) {
      pad = pad || 4;
      const max = Math.max(1, ...series), n = Math.max(1, series.length - 1);
      const pts = series.map((v, i) => [pad + (w - 2 * pad) * i / n, pad + (h - 2 * pad) * (1 - v / max)]);
      const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
      return { line, area: `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${h - pad} L ${pad} ${h - pad} Z` };
    },
    grid(w, h, rows) {
      rows = rows || 3;
      let d = '';
      for (let i = 1; i <= rows; i++) { const y = (h * i / (rows + 1)).toFixed(1); d += `M4 ${y} H${w - 4} `; }
      return d.trim();
    }
  };

  window.Yay = { version: '1.0.0', icon, esc, store, saveBadge, download, exportJSON, pickJSON, toast, confirm, autosize, tablist, print, fmt, chart };
})();
