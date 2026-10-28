/* Side Hustle Tracker App — mileage trips and summary, from Mileage Log. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const KINDS = [['business', 'Business'], ['medical', 'Medical'], ['charity', 'Charity'], ['personal', 'Personal']];
  const KIND = Object.fromEntries(KINDS);
  const txt = v => (v == null ? '' : String(v));
  const trip = o => Object.assign({ id: P.uid(), date: D.today(), purpose: '', from: '', to: '', start: '', end: '', miles: '', round: false, kind: 'business', client: '' }, o || {});

  function blank() { return { log: { name: '', vehicle: '', unit: 'mi', year: String(new Date().getFullYear()) }, rates: { business: '', medical: '', charity: '', personal: '' }, trips: [], notes: '' }; }
  function sample() {
    const t = D.today(), d = n => D.add(t, n);
    return {
      log: { name: 'Photography side gig', vehicle: '2019 Honda Fit', unit: 'mi', year: t.slice(0, 4) },
      rates: { business: '0.70', medical: '0.21', charity: '0.14', personal: '' },
      trips: [
        trip({ date: d(-1), purpose: 'Family portrait session', from: 'Home', to: 'Riverside Park', miles: '12.4', round: true, client: 'Nguyen family' }),
        trip({ date: d(-3), purpose: 'Print pickup', from: 'Home', to: 'PrintLab downtown', miles: '6.2', round: true }),
        trip({ date: d(-6), purpose: 'Wedding (second shooter)', from: 'Home', to: 'Willow Hall', start: '48210', end: '48297', client: 'Northlight Studio' }),
        trip({ date: d(-9), purpose: 'Client consult', from: 'Home', to: 'Café Luna', miles: '4.8', round: true, client: 'Priya S.' }),
        trip({ date: d(-15), purpose: 'Dentist', from: 'Home', to: 'Oak St Dental', miles: '3.1', round: true, kind: 'medical' }),
        trip({ date: d(-33), purpose: 'Headshots at an office', from: 'Home', to: 'Summit Tower', miles: '15.0', round: true, client: 'Summit Group' }),
        trip({ date: d(-40), purpose: 'Food bank volunteer shoot', from: 'Home', to: 'Eastside Food Bank', miles: '7.5', round: true, kind: 'charity' })
      ],
      notes: 'Odometer on Jan 1: 41,020.\nKeep parking receipts in the glovebox envelope.'
    };
  }
  function normalize(s) {
    const l = s.log || {}, r = s.rates || {};
    s.log = { name: txt(l.name), vehicle: txt(l.vehicle), unit: l.unit === 'km' ? 'km' : 'mi', year: /^\d{4}$/.test(l.year) ? l.year : String(new Date().getFullYear()) };
    s.rates = Object.fromEntries(KINDS.map(([k]) => [k, txt(r[k])]));
    s.trips = (Array.isArray(s.trips) ? s.trips : []).filter(x => x && typeof x === 'object').map(x => { const o = trip(); Object.keys(o).forEach(k => { if (typeof o[k] === 'string') o[k] = txt(x[k]) || (k === 'id' ? P.uid() : k === 'date' ? '' : o[k]); }); o.round = !!x.round; o.kind = KIND[x.kind] ? x.kind : 'business'; return o; });
    s.notes = txt(s.notes);
    return s;
  }
  function dist(x) { const odo = P.num(x.end) - P.num(x.start); const base = P.has(x.start) && P.has(x.end) && odo > 0 ? odo : P.num(x.miles); return Math.round(base * (x.round ? 2 : 1) * 10) / 10; }
  const value = (s, x) => dist(x) * P.num(s.rates[x.kind]);
  const inYear = (s, x) => (x.date || '').startsWith(s.log.year);
  const fmtD = (s, n) => `${P.num(n).toLocaleString('en-US', { maximumFractionDigits: 1 })} ${s.log.unit}`;

  const trips = {
    id: 'trips', label: 'Trips', icon: 'calendar',
    render(ctx) {
      const s = ctx.state, f = KIND[s.ui.k] ? s.ui.k : 'all', m = /^\d{4}-\d{2}$/.test(s.ui.m) ? s.ui.m : 'all';
      const rows = s.trips.map((x, i) => Object.assign({ __i: i }, x)).filter(x => (f === 'all' || x.kind === f) && (m === 'all' || (x.date || '').startsWith(m))).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const months = Array.from(new Set(s.trips.map(x => (x.date || '').slice(0, 7)).filter(Boolean))).sort().reverse();
      return `${u.head({ eyebrow: s.log.name || 'Mileage log', title: '<span data-slot="title"></span>', lede: 'Log each trip the same day: where, why, and either the distance or the odometer at start and end.' })}
      <div data-slot="kpis"></div>
      <div class="pl-row ml-tools">${u.chips('ui.k', f, [['all', 'All'], ...KINDS], 'Trip type')}<span class="pl-spacer"></span>${months.length ? u.select('ui.m', m, [['all', 'All months'], ...months.map(x => [x, new Date(+x.slice(0, 4), +x.slice(5) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })])], { label: 'Month', rerender: true, cls: 'ml-month' }) : ''}${u.btn('Log a trip', { kind: 'world', icon: 'plus', act: 'add', data: { list: 'trips', at: 'top' } })}</div>
      ${rows.length ? `<div class="ml-trips">${rows.map(x => `<article class="ml-trip">
        <div class="ml-trip-top">${u.input(`trips.${x.__i}.date`, x.date, { type: 'date', label: 'Date', cls: 'ml-date' })}${u.input(`trips.${x.__i}.purpose`, x.purpose, { label: 'Purpose', ph: 'Purpose of the trip', cls: 'ml-purpose' })}${u.check(`trips.${x.__i}.round`, x.round, 'Round trip', { cls: 'pl-plain ml-roundchk' })}<span class="ml-dist y-num" data-slot="dist" data-arg="${x.__i}"></span>${u.rowTools('trips', x.__i, s.trips.length, { what: 'trip', label: x.purpose })}</div>
        <div class="ml-trip-grid">
          ${u.field('From', `trips.${x.__i}.from`, x.from, { ph: 'Start' })}${u.field('To', `trips.${x.__i}.to`, x.to, { ph: 'Destination' })}
          ${u.field(`Distance (${s.log.unit})`, `trips.${x.__i}.miles`, x.miles, { num: true, ph: 'or use odometer' })}
          ${u.field('Odometer start', `trips.${x.__i}.start`, x.start, { num: true, ph: 'optional' })}${u.field('Odometer end', `trips.${x.__i}.end`, x.end, { num: true, ph: 'optional' })}
          ${u.field('Type', `trips.${x.__i}.kind`, x.kind, { options: KINDS })}${u.field('Client / job', `trips.${x.__i}.client`, x.client, { ph: 'optional' })}
        </div></article>`).join('')}</div>` : u.empty('calendar', s.trips.length ? 'No trips match' : 'No trips yet', 'Tap “Log a trip” after each drive — it takes ten seconds.')}`;
    },
    slots: {
      title(ctx) { const s = ctx.state, y = s.trips.filter(x => inYear(s, x) && x.kind === 'business'); return `<em>${esc(fmtD(s, y.reduce((a, x) => a + dist(x), 0)))}</em> for business in ${esc(s.log.year)}`; },
      kpis(ctx) {
        const s = ctx.state, y = s.trips.filter(x => inYear(s, x)), mo = D.today().slice(0, 7), thisM = s.trips.filter(x => (x.date || '').startsWith(mo));
        const val = y.reduce((a, x) => a + value(s, x), 0);
        return u.kpis([['Trips this year', String(y.length)], [`This month`, esc(fmtD(s, thisM.reduce((a, x) => a + dist(x), 0))), 'y-kpi--world', P.plural(thisM.length, 'trip')], ['Estimated value', val ? esc(ctx.money(val)) : '—', 'y-kpi--accent', 'distance × your rates'], ['All types', esc(fmtD(s, y.reduce((a, x) => a + dist(x), 0)))]]);
      },
      dist(ctx, i) { const s = ctx.state, x = s.trips[+i]; if (!x) return ''; const v = value(s, x); return `<b>${esc(fmtD(s, dist(x)))}</b>${v ? `<small>${esc(ctx.money(v))}</small>` : ''}`; }
    },
    sheet: logSheet
  };

  function logSheet(ctx) {
    const s = ctx.state, list = s.trips.filter(x => inYear(s, x)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const tot = k => list.filter(x => x.kind === k).reduce((a, x) => a + dist(x), 0);
    return `<h1>Mileage log · ${esc(s.log.year)}</h1><p class="pl-sheet-meta">${[s.log.name, s.log.vehicle].filter(Boolean).map(esc).join(' · ')}</p>
      <table><thead><tr><th>Date</th><th>Purpose</th><th>From → to</th><th>Type</th><th>Odometer</th><th>${esc(s.log.unit)}</th></tr></thead><tbody>${list.map(x => `<tr><td style="white-space:nowrap">${esc(D.full(x.date))}</td><td>${esc(x.purpose)}${x.client ? `<br><span style="color:#666">${esc(x.client)}</span>` : ''}</td><td>${esc(x.from)} → ${esc(x.to)}${x.round ? ' (round trip)' : ''}</td><td>${esc(KIND[x.kind])}</td><td>${P.has(x.start) ? `${esc(x.start)}–${esc(x.end)}` : ''}</td><td style="text-align:right"><b>${esc(String(dist(x)))}</b></td></tr>`).join('')}</tbody></table>
      <h2>Totals</h2><table><tbody>${KINDS.map(([k, l]) => tot(k) ? `<tr><td>${esc(l)}</td><td style="text-align:right"><b>${esc(fmtD(s, tot(k)))}</b></td><td>${P.num(s.rates[k]) ? esc(ctx.money(tot(k) * P.num(s.rates[k]))) + ` at ${esc(s.rates[k])}/${esc(s.log.unit)}` : ''}</td></tr>` : '').join('')}</tbody></table>`;
  }

  const summary = {
    id: 'summary', label: 'Summary', icon: 'chart',
    render(ctx) {
      const s = ctx.state, y = s.log.year, months = Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`);
      const byM = months.map(m => s.trips.filter(x => (x.date || '').startsWith(m)));
      const max = Math.max(1, ...byM.map(l => l.reduce((a, x) => a + dist(x), 0)));
      return `${u.head({ eyebrow: 'Summary', title: `${esc(y)} by <em>month</em>`, lede: 'Totals by month and by trip type. Rates are yours to set — check the current official rate for your country and situation.' })}
      ${u.panel('Distance by month', `<div class="ml-months">${byM.map((l, i) => { const b = l.filter(x => x.kind === 'business').reduce((a, x) => a + dist(x), 0), o = l.filter(x => x.kind !== 'business').reduce((a, x) => a + dist(x), 0); return `<div class="ml-m"><span class="ml-stack"><i class="ml-b" style="height:${b / max * 100}%"></i><i class="ml-o" style="height:${o / max * 100}%"></i></span><b class="y-num">${b + o ? Math.round(b + o) : ''}</b><small>${new Date(2000, i, 1).toLocaleDateString('en-US', { month: 'short' })}</small></div>`; }).join('')}</div><p class="pl-hint ml-key"><i class="ml-b"></i> business <i class="ml-o"></i> other</p>`, { icon: 'chart' })}
      ${u.panel('Settings & rates', `<div class="pl-fields">${u.field('Log name', 'log.name', s.log.name, { ph: 'My delivery gig' })}${u.field('Vehicle', 'log.vehicle', s.log.vehicle, { ph: 'Make, model' })}${u.field('Year', 'log.year', s.log.year, { num: true, rerender: true })}${u.field('Units', 'log.unit', s.log.unit, { options: [['mi', 'Miles'], ['km', 'Kilometers']], rerender: true })}
        ${KINDS.map(([k, l]) => u.field(`${l} rate per ${s.log.unit}`, `rates.${k}`, s.rates[k], { num: true, ph: 'optional' })).join('')}</div>`, { icon: 'edit', hint: 'Rates only feed the “estimated value” — they’re not tax advice.' })}
      ${u.notes('notes', s.notes, { rows: 5, ph: 'Odometer on Jan 1, where receipts are, parking and tolls' })}`;
    },
    sheet: logSheet
  };

  window.SHMiles = { pages: { trips, summary }, blank, sample, normalize, dist, value, rows: { trips: ctx => { const last = ctx.state.trips.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0]; return trip({ from: last ? last.from : '' }); } } };
})();
