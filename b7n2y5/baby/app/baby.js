/* Baby Tracker App — one-tap feeds, sleep and diapers, a day-by-day log, sleep over the week, growth, health visits + medicines
   and milestones. Yaykit planner engine, nursery world (baby.css). New app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const TYPES = ['Feed', 'Sleep', 'Diaper'];
  const KINDS = { Feed: ['Breast', 'Bottle', 'Solids'], Sleep: ['Nap', 'Night'], Diaper: ['Wet', 'Dirty', 'Both'] };
  const SIDES = [['', '—'], ['L', 'Left'], ['R', 'Right']];
  const OZ_ML = 29.5735;
  const MILESTONES = ['First smile', 'Holds head up', 'Laughs out loud', 'Rolls over', 'Sits without help', 'First tooth', 'Crawls', 'First word', 'First steps'];
  const VACCINES = ['Birth: Hepatitis B', '2 months: DTaP, Hib, polio, PCV, rotavirus, Hep B', '4 months: DTaP, Hib, polio, PCV, rotavirus',
    '6 months: DTaP, Hib, PCV, rotavirus, Hep B, flu', '12–15 months: MMR, chickenpox, Hib, PCV, Hep A'];
  const txt = v => (v == null ? '' : String(v));
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
  const r1 = n => Math.round(n * 10) / 10;
  const pad = n => String(n).padStart(2, '0');
  const hm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const isoOf = d => D.iso(d);
  /* the kit has no moon: same stroke style as Yay.icon */
  const MOON = '<svg class="y-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/></svg>';
  const ic = n => (n === 'moon' ? MOON : I(n));

  /* ---------- records ---------- */
  const entry = o => Object.assign({ id: P.uid(), date: D.today(), time: hm(new Date()), type: 'Feed', kind: 'Bottle', side: '', amount: '', mins: '', note: '' }, o || {});
  const grow = o => Object.assign({ id: P.uid(), date: D.today(), weight: '', length: '', head: '' }, o || {});
  const visit = o => Object.assign({ id: P.uid(), date: '', what: '', ask: '' }, o || {});
  const med = o => Object.assign({ id: P.uid(), date: D.today(), time: hm(new Date()), name: '', dose: '' }, o || {});
  const shot = (text, done) => ({ id: P.uid(), text: text || '', done: !!done });
  const stone = (text, date, note) => ({ id: P.uid(), text: text || '', date: date || '', note: note || '' });

  function blank() {
    return { baby: { name: '', born: '' }, feedUnit: 'oz', growUnit: 'lb', entries: [], run: { feed: null, sleep: null }, growth: [], visits: [], meds: [],
      shots: VACCINES.map(v => shot(v)), stones: MILESTONES.map(m => stone(m)), notes: '' };
  }
  function sample() {
    const s = blank(), t = D.today(), now = new Date(), nowHm = hm(now);
    s.baby = { name: 'Mila', born: D.add(t, -96) };
    const E = [];
    const add = (off, time, o) => {   // today only gets what has already happened, sleep included
      const date = D.add(t, off), end = +time.slice(0, 2) * 60 + +time.slice(3) + (P.num(o.mins) || 0) * (o.type === 'Sleep' ? 1 : 0);
      if (off === 0 && (time > nowHm || end > now.getHours() * 60 + now.getMinutes())) return;
      E.push(entry(Object.assign({ date, time }, o)));
    };
    for (let off = -6; off <= 0; off++) {
      [['00:40', 'L'], ['03:50', 'R'], ['06:30', 'B'], ['09:30', 'L'], ['12:40', 'B'], ['15:45', 'R'], ['18:40', 'B'], ['21:30', 'L']].forEach(([time, k], i) => {
        if (k === 'B') add(off, time, { type: 'Feed', kind: 'Bottle', amount: String([4, 4.5, 5][(i + off + 6) % 3]) });
        else add(off, time, { type: 'Feed', kind: 'Breast', side: k, mins: String([14, 18, 12, 20][(i + off + 6) % 4]) });
        add(off, time.replace(/:(\d)\d$/, (m, d) => `:${+d + 2 > 5 ? 5 : +d + 2}5`), { type: 'Diaper', kind: i % 3 === 1 ? 'Dirty' : i === 5 ? 'Both' : 'Wet' });
      });
      [['01:10', 150, 'Night'], ['04:20', 120, 'Night'], ['08:00', 75, 'Nap'], ['11:00', 45, 'Nap'], ['13:30', 95, 'Nap'], ['16:40', 40, 'Nap'], ['19:30', 290 + [0, 10, -15, 5, 20, -10, 0][-off], 'Night']]
        .forEach(([time, mins, kind]) => add(off, time, { type: 'Sleep', kind, mins: String(mins) }));
    }
    s.entries = E;
    s.growth = [grow({ date: s.baby.born, weight: '7.4', length: '19.75', head: '13.5' }), grow({ date: D.add(t, -82), weight: '7.9', length: '20.25', head: '13.8' }),
      grow({ date: D.add(t, -36), weight: '10.6', length: '22.5', head: '15.1' }), grow({ date: D.add(t, -5), weight: '12.4', length: '23.75', head: '15.9' })];
    s.visits = [visit({ date: D.add(t, 9), what: '4-month checkup with Dr. Ramos', ask: 'Night feeds — still 2? · Rash on cheek · When to start tummy-time mat' }),
      visit({ date: D.add(t, -36), what: '2-month checkup', ask: 'Shots done, 10 lb 10 oz' })];
    s.meds = [med({ date: D.add(t, -1), time: '20:15', name: 'Fever reducer', dose: '1.25 ml' }), med({ date: D.add(t, -1), time: '09:00', name: 'Vitamin D drops', dose: '1 drop' }),
      med({ date: t, time: '08:55', name: 'Vitamin D drops', dose: '1 drop' })].filter(m => m.date < t || m.time <= nowHm);
    s.shots = VACCINES.map((v, i) => shot(v, i < 2));
    s.stones = MILESTONES.map((m, i) => stone(m, i === 0 ? D.add(t, -54) : i === 1 ? D.add(t, -30) : i === 2 ? D.add(t, -8) : '', i === 0 ? 'At Grandma’s, right after a bottle' : i === 2 ? 'Peekaboo with Dad' : ''));
    s.notes = 'Dr. Ramos: (555) 014-2286 · nurse line after hours (555) 014-2290\n\nLikes: white noise, the yellow rattle, being bounced.\nBottle: 4–5 oz, paced feeding.';
    return s;
  }
  function normalize(s) {
    const b = s.baby || {};
    s.baby = { name: txt(b.name), born: D.parse(b.born) ? b.born : '' };
    s.feedUnit = s.feedUnit === 'ml' ? 'ml' : 'oz';
    s.growUnit = s.growUnit === 'kg' ? 'kg' : 'lb';
    s.entries = arr(s.entries, x => { const type = TYPES.includes(x.type) ? x.type : 'Feed';
      return entry({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), time: /^\d\d:\d\d$/.test(x.time) ? x.time : '12:00', type, kind: KINDS[type].includes(x.kind) ? x.kind : KINDS[type][0],
        side: x.side === 'L' || x.side === 'R' ? x.side : '', amount: txt(x.amount), mins: txt(x.mins), note: txt(x.note) }); });
    const r = s.run && typeof s.run === 'object' ? s.run : {};
    const run = v => (v && typeof v === 'object' && +v.start > 0 ? { start: +v.start, side: v.side === 'R' ? 'R' : 'L' } : null);
    s.run = { feed: run(r.feed), sleep: run(r.sleep) };
    s.growth = arr(s.growth, x => grow({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), weight: txt(x.weight), length: txt(x.length), head: txt(x.head) }));
    s.visits = arr(s.visits, x => visit({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : '', what: txt(x.what), ask: txt(x.ask) }));
    s.meds = arr(s.meds, x => med({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), time: /^\d\d:\d\d$/.test(x.time) ? x.time : '12:00', name: txt(x.name), dose: txt(x.dose) }));
    s.shots = arr(s.shots, x => Object.assign(shot(txt(x.text), x.done), { id: txt(x.id) || P.uid() }));
    s.stones = arr(s.stones, x => Object.assign(stone(txt(x.text), D.parse(x.date) ? x.date : '', txt(x.note)), { id: txt(x.id) || P.uid() }));
    s.notes = txt(s.notes);
    s.ui = s.ui || {};
    if (!['all', ...TYPES].includes(s.ui.logType)) s.ui.logType = 'all';
    if (typeof s.ui.bottle !== 'string') s.ui.bottle = '';
    return s;
  }

  /* ---------- time math ---------- */
  const ms = x => new Date(`${x.date}T${x.time}:00`).getTime();
  const ended = x => ms(x) + (P.num(x.mins) || 0) * 60000;
  const sorted = s => s.entries.map((x, i) => Object.assign({ __i: i }, x)).sort((a, b) => (`${b.date}${b.time}` < `${a.date}${a.time}` ? -1 : 1));
  const ofDay = (s, d) => sorted(s).filter(x => x.date === d);
  function ago(msv) {
    const m = Math.max(0, Math.floor(msv / 60000));   // entries keep whole minutes, so round down
    if (m < 1) return 'just now';
    const h = Math.floor(m / 60), r = m % 60;
    return h ? `${h} h${r ? ` ${r} min` : ''}` : `${m} min`;
  }
  const dur = m => { m = Math.round(m); const h = Math.floor(m / 60); return h ? `${h} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`; };
  const clockOf = sec => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60; return `${h ? h + ':' + pad(m) : m}:${pad(sec % 60)}`; };
  function totals(s, d) {
    const l = s.entries.filter(x => x.date === d), feeds = l.filter(x => x.type === 'Feed'), sleeps = l.filter(x => x.type === 'Sleep'), dia = l.filter(x => x.type === 'Diaper');
    const nap = sleeps.filter(x => x.kind === 'Nap').reduce((a, x) => a + P.num(x.mins), 0), night = sleeps.filter(x => x.kind === 'Night').reduce((a, x) => a + P.num(x.mins), 0);
    return { feeds: feeds.length, bottle: r1(feeds.filter(x => x.kind === 'Bottle').reduce((a, x) => a + P.num(x.amount), 0)), breastMins: feeds.filter(x => x.kind === 'Breast').reduce((a, x) => a + P.num(x.mins), 0),
      sleep: nap + night, nap, night, naps: sleeps.filter(x => x.kind === 'Nap').length, diapers: dia.length,
      wet: dia.filter(x => x.kind !== 'Dirty').length, dirty: dia.filter(x => x.kind !== 'Wet').length };
  }
  const lastOf = (s, type) => s.entries.filter(x => x.type === type).sort((a, b) => ms(b) - ms(a))[0];
  function age(s) {
    const b = D.parse(s.baby.born); if (!b) return '';
    const days = D.diff(s.baby.born, D.today());
    if (days < 0) return '';
    if (days < 14) return P.plural(days, 'day');
    const now = new Date(); let months = (now.getFullYear() - b.getFullYear()) * 12 + now.getMonth() - b.getMonth(); if (now.getDate() < b.getDate()) months--;
    if (months < 2) return P.plural(Math.floor(days / 7), 'week');
    const anchor = new Date(b); anchor.setMonth(anchor.getMonth() + months);
    const wk = Math.floor((now - anchor) / 6048e5);
    return months < 24 ? `${P.plural(months, 'month')}${wk ? `, ${P.plural(wk, 'week')}` : ''}` : P.plural(Math.floor(months / 12), 'year');
  }
  const amt = (s, v) => (P.has(v) ? `${r1(P.num(v))} ${s.feedUnit}` : '');
  function detail(s, x) {
    if (x.type === 'Feed') return [x.kind, x.side && (x.side === 'L' ? 'left' : 'right'), x.kind === 'Bottle' ? amt(s, x.amount) : P.has(x.mins) ? `${x.mins} min` : '', x.note].filter(Boolean).join(' · ');
    if (x.type === 'Sleep') return [x.kind, P.has(x.mins) ? dur(P.num(x.mins)) : '', x.note].filter(Boolean).join(' · ');
    return [x.kind, x.note].filter(Boolean).join(' · ');
  }
  const ICON = { Feed: 'heart', Sleep: 'moon', Diaper: 'check' };

  /* ---------- today ---------- */
  function logNow(s, o) { const n = new Date(); const e = entry(Object.assign({ date: isoOf(n), time: hm(n) }, o)); s.entries.push(e); return e; }
  function stopRun(s, key, extra) {
    const r = s.run[key]; if (!r) return null;
    const st = new Date(r.start), mins = Math.max(1, Math.round((Date.now() - r.start) / 60000));
    s.run[key] = null;
    return s.entries.push(entry(Object.assign({ date: isoOf(st), time: hm(st), mins: String(mins) }, extra(r)))) && s.entries[s.entries.length - 1];
  }
  const nightAt = d => { const h = d.getHours(); return h >= 19 || h < 6; };
  const today = {
    id: 'today', label: 'Today', icon: 'star',
    render(ctx) {
      const s = ctx.state, f = s.run.feed, sl = s.run.sleep, list = ofDay(s, D.today());
      return `${u.head({ eyebrow: [s.baby.name || 'Your baby', age(s)].filter(Boolean).join(' · '), title: '<span data-slot="title"></span>', lede: 'One tap when it happens. Feeds, sleep and diapers add up by themselves.' })}
      <div data-slot="kpis"></div>
      <div class="bt-log">
        <section class="y-panel bt-card${f ? ' is-on' : ''}"><h2 class="y-kicker"><span class="pl-kicker-icon">${I('heart')}</span>Feed</h2>
          ${f ? `<p class="bt-run">Feeding · ${f.side === 'L' ? 'left' : 'right'} <b class="y-num" data-since="${f.start}">${clockOf((Date.now() - f.start) / 1000)}</b></p>
            <div class="bt-btns">${u.btn('Switch side', { act: 'switchSide', icon: 'shuffle' })}${u.btn('Done', { kind: 'world', act: 'stopFeed', icon: 'check' })}</div>`
          : `<div class="bt-btns">${u.btn('Left', { kind: 'world', act: 'startFeed', data: { side: 'L' }, icon: 'timer' })}${u.btn('Right', { kind: 'world', act: 'startFeed', data: { side: 'R' }, icon: 'timer' })}</div>`}
          <div class="bt-bottle">${u.input('ui.bottle', s.ui.bottle, { label: `Bottle amount in ${s.feedUnit}`, ph: s.feedUnit === 'oz' ? '4' : '120', num: true })}${u.seg('feedUnit', s.feedUnit, [['oz', 'oz'], ['ml', 'ml']], 'Bottle unit')}${u.btn('Bottle', { act: 'bottle', icon: 'plus' })}</div>
          <div class="bt-btns">${u.btn('Solids', { sm: true, act: 'solids', icon: 'plus' })}</div></section>
        <section class="y-panel bt-card${sl ? ' is-on' : ''}"><h2 class="y-kicker"><span class="pl-kicker-icon">${MOON}</span>Sleep</h2>
          ${sl ? `<p class="bt-run">Asleep since ${esc(D.time(hm(new Date(sl.start))))} <b class="y-num" data-since="${sl.start}">${clockOf((Date.now() - sl.start) / 1000)}</b></p><div class="bt-btns">${u.btn('Woke up', { kind: 'world', act: 'wake', icon: 'sparkle' })}</div>`
          : `<p class="bt-run" data-slot="awake"></p><div class="bt-btns">${u.btn('Fell asleep', { kind: 'world', act: 'sleep', icon: 'timer' })}</div>`}</section>
        <section class="y-panel bt-card"><h2 class="y-kicker"><span class="pl-kicker-icon">${I('check')}</span>Diaper</h2>
          <div class="bt-btns bt-three">${['Wet', 'Dirty', 'Both'].map(k => u.btn(k, { kind: 'world', act: 'diaper', data: { kind: k } })).join('')}</div>
          <p class="pl-muted" data-slot="lastdiaper"></p></section>
      </div>
      ${u.panel(`Today · ${list.length} ${list.length === 1 ? 'entry' : 'entries'}`, list.length ? `<ul class="bt-line">${list.map(x => `<li class="bt-${x.type.toLowerCase()}"><span class="bt-time y-num">${esc(D.time(x.time))}</span><span class="bt-dot">${ic(ICON[x.type])}</span><span class="bt-what"><b>${esc(x.type)}</b> ${esc(detail(s, x))}</span>${u.iconBtn('close', `Remove ${x.type} at ${D.time(x.time)}`, 'remove', { list: 'entries', i: x.__i, what: `${x.type} ${D.time(x.time)}` })}</li>`).join('')}</ul>`
        : '<p class="pl-muted">Nothing logged yet today. Tap a button above when it happens.</p>', { icon: 'list', cls: 'bt-today', actions: u.btn('Full log', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'log' } }) })}`;
    },
    slots: {
      title(ctx) {
        const s = ctx.state, f = lastOf(s, 'Feed');
        if (s.run.feed) return 'Feeding <em>now</em>';
        return f ? `Last fed <em data-ago="${ms(f)}">${ago(Date.now() - ms(f))}</em> ago` : 'Ready when <em>you are</em>';
      },
      kpis(ctx) {
        const s = ctx.state, t = totals(s, D.today());
        return u.kpis([
          ['Feeds today', String(t.feeds), 'y-kpi--world', [t.bottle ? `${t.bottle} ${s.feedUnit} bottle` : '', t.breastMins ? `${t.breastMins} min nursing` : ''].filter(Boolean).join(' · ')],
          ['Sleep today', t.sleep ? dur(t.sleep) : '0 h', '', `${P.plural(t.naps, 'nap')}`],
          ['Diapers', String(t.diapers), '', `${t.wet} wet · ${t.dirty} dirty`],
          ['Awake for', s.run.sleep ? 'asleep' : (() => { const l = lastOf(s, 'Sleep'); return l ? ago(Date.now() - ended(l)) : '—'; })(), s.run.sleep ? 'is-good' : '', 'since the last sleep']
        ]);
      },
      awake(ctx) { const l = lastOf(ctx.state, 'Sleep'); return l ? `Awake for <b data-ago="${ended(l)}">${ago(Date.now() - ended(l))}</b>` : 'No sleep logged yet.'; },
      lastdiaper(ctx) { const l = lastOf(ctx.state, 'Diaper'); return l ? `Last change ${ago(Date.now() - ms(l))} ago · ${esc(l.kind.toLowerCase())}` : ''; }
    },
    actions: {
      startFeed(ctx, d) { ctx.state.run.feed = { start: Date.now(), side: d.side }; },
      switchSide(ctx) { const s = ctx.state, side = s.run.feed.side; stopRun(s, 'feed', r => ({ type: 'Feed', kind: 'Breast', side: r.side })); s.run.feed = { start: Date.now(), side: side === 'L' ? 'R' : 'L' }; ctx.toast('Switched sides'); },
      stopFeed(ctx) { const e = stopRun(ctx.state, 'feed', r => ({ type: 'Feed', kind: 'Breast', side: r.side })); if (e) ctx.toast(`Feed logged · ${e.mins} min`); },
      bottle(ctx) {
        const s = ctx.state, a = P.num(s.ui.bottle);
        if (!(a > 0)) { ctx.toast(`Type the amount in ${s.feedUnit} first`); ctx.focus('[data-bind="ui.bottle"]'); return false; }
        logNow(s, { type: 'Feed', kind: 'Bottle', amount: String(r1(a)) }); s.ui.bottle = ''; ctx.toast(`Bottle · ${r1(a)} ${s.feedUnit}`);
      },
      solids(ctx) { logNow(ctx.state, { type: 'Feed', kind: 'Solids' }); ctx.toast('Solids logged — add what in the log'); },
      sleep(ctx) { ctx.state.run.sleep = { start: Date.now(), side: 'L' }; },
      wake(ctx) { const e = stopRun(ctx.state, 'sleep', r => ({ type: 'Sleep', kind: nightAt(new Date(r.start)) ? 'Night' : 'Nap' })); if (e) ctx.toast(`Slept ${dur(P.num(e.mins))}`); },
      diaper(ctx, d) { logNow(ctx.state, { type: 'Diaper', kind: d.kind }); ctx.toast(`Diaper · ${d.kind.toLowerCase()}`); },
      set(ctx, d) {   // the oz/ml switch converts every logged bottle
        const s = ctx.state;
        if (d.bind === 'feedUnit' && d.value !== s.feedUnit) {
          const k = d.value === 'ml' ? OZ_ML : 1 / OZ_ML;
          s.entries.forEach(x => { if (P.has(x.amount)) x.amount = String(d.value === 'ml' ? Math.round(P.num(x.amount) * k / 5) * 5 : Math.round(P.num(x.amount) * k * 2) / 2); });
          s.feedUnit = d.value; return;
        }
        P.set(s, d.bind, d.value);
      }
    }
  };

  /* ---------- log ---------- */
  const log = {
    id: 'log', label: 'Log', icon: 'list',
    render(ctx) {
      const s = ctx.state, v = s.ui.logType, days = [...new Set(s.entries.map(x => x.date))].sort().reverse().slice(0, 21);
      const n = k => s.entries.filter(x => k === 'all' || x.type === k).length;
      return `${u.head({ eyebrow: 'Log', title: 'Every feed, nap and <em>diaper</em>', lede: 'Fix a time or add a note — what you type here is what the pediatrician sheet prints.' })}
      <div class="pl-row bt-logbar">${u.chips('ui.logType', v, [['all', 'All', n('all')], ['Feed', 'Feeds', n('Feed')], ['Sleep', 'Sleep', n('Sleep')], ['Diaper', 'Diapers', n('Diaper')]], 'Show entries')}<span class="pl-spacer"></span>${u.btn('Add entry', { sm: true, icon: 'plus', act: 'addEntry' })}</div>
      ${days.length ? days.map(d => { const rows = ofDay(s, d).filter(x => v === 'all' || x.type === v), t = totals(s, d);
        return rows.length ? u.panel(D.fmt(d, { weekday: 'long', month: 'short', day: 'numeric' }), u.table('entries', rows, [
          { k: 'time', label: 'Time', type: 'time', w: '120px' },
          { k: 'type', label: 'Type', type: 'select', options: TYPES, w: '110px', rerender: true },
          { k: 'kind', label: 'Kind', type: 'select', options: r => KINDS[r.type], w: '110px', rerender: true },
          { k: 'amount', label: s.feedUnit, num: true, w: '80px', ph: '—' },
          { k: 'side', label: 'Side', type: 'select', options: SIDES, w: '96px' },
          { k: 'mins', label: 'Min', num: true, w: '76px', ph: '—' },
          { k: 'note', label: 'Note', title: true, w: '1fr', ph: 'Note' }
        ], { index: x => x.__i, total: s.entries.length, what: 'entry', cls: 'bt-ltab' }), { icon: 'calendar', cls: 'y-panel--flat', actions: `${u.pill(`${t.feeds} feeds${t.bottle ? ` · ${t.bottle} ${s.feedUnit}` : ''}`, 'world')}${u.pill(`${dur(t.sleep)} sleep`)}${u.pill(`${t.diapers} diapers`)}` }) : ''; }).join('')
        : u.empty('list', 'Nothing logged yet', 'Use the buttons on Today — everything lands here.')}`;
    },
    actions: { addEntry(ctx) { const s = ctx.state; s.entries.push(entry({ type: s.ui.logType === 'all' ? 'Feed' : s.ui.logType, kind: KINDS[s.ui.logType === 'all' ? 'Feed' : s.ui.logType][0] })); } },
    sheet: daySheet
  };
  function daySheet(ctx) {
    const s = ctx.state, now = Date.now(), list = s.entries.filter(x => ms(x) > now - 864e5 && ms(x) <= now).sort((a, b) => ms(a) - ms(b));
    const sum = k => list.filter(x => x.type === k);
    const bottle = r1(sum('Feed').filter(x => x.kind === 'Bottle').reduce((a, x) => a + P.num(x.amount), 0)), sl = sum('Sleep').reduce((a, x) => a + P.num(x.mins), 0);
    return `<h1>${esc(s.baby.name || 'Baby')} · last 24 hours</h1><p class="pl-sheet-meta">${[age(s), `printed ${new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`].filter(Boolean).map(esc).join(' · ')}</p>
      <table><thead><tr><th>Feeds</th><th>Bottle</th><th>Sleep</th><th>Wet</th><th>Dirty</th></tr></thead><tbody><tr><td>${sum('Feed').length}</td><td>${bottle} ${esc(s.feedUnit)}</td><td>${esc(dur(sl))}</td><td>${sum('Diaper').filter(x => x.kind !== 'Dirty').length}</td><td>${sum('Diaper').filter(x => x.kind !== 'Wet').length}</td></tr></tbody></table>
      <h2>Log</h2><table><tbody>${list.map(x => `<tr><td style="width:30mm">${esc(D.short(x.date))} ${esc(D.time(x.time))}</td><td style="width:20mm"><b>${esc(x.type)}</b></td><td>${esc(detail(s, x))}</td></tr>`).join('')}</tbody></table>`;
  }

  /* ---------- sleep ---------- */
  const sleep = {
    id: 'sleep', label: 'Sleep', icon: 'timer',
    render(ctx) {
      const s = ctx.state, t = D.today(), days = Array.from({ length: 7 }, (_, i) => D.add(t, i - 6)).map(d => Object.assign({ d }, totals(s, d)));
      const logged = days.filter(x => x.sleep), avg = l => (l.length ? l.reduce((a, x) => a + x, 0) / l.length : 0);
      const longest = Math.max(0, ...s.entries.filter(x => x.type === 'Sleep' && D.diff(x.date, t) <= 6).map(x => P.num(x.mins)));
      const max = Math.max(12 * 60, ...days.map(x => x.sleep));
      return `${u.head({ eyebrow: 'Sleep', title: logged.length ? `<em>${esc(dur(avg(logged.map(x => x.sleep))))}</em> a day` : 'Sleep this <em>week</em>', lede: 'Naps and night sleep for the last seven days. Sleep counts on the day it started.' })}
      ${u.kpis([['Average a day', logged.length ? dur(avg(logged.map(x => x.sleep))) : '—', 'y-kpi--world', `${logged.length} of 7 days logged`], ['Naps a day', logged.length ? String(r1(avg(logged.map(x => x.naps)))) : '—', '', logged.length ? `${dur(avg(logged.map(x => x.nap)))} of naps` : ''], ['Longest stretch', longest ? dur(longest) : '—', 'is-good', 'this week']])}
      <div class="xm-gap"></div>
      ${u.panel('Last 7 days', `<ul class="bt-bars">${days.map(x => `<li><span class="bt-bday">${esc(D.day(x.d))} <small>${esc(D.short(x.d))}</small></span><span class="bt-bar" role="img" aria-label="${esc(D.full(x.d))}: ${esc(dur(x.night))} night, ${esc(dur(x.nap))} naps"><i class="bt-night" style="width:${x.night / max * 100}%"></i><i class="bt-nap" style="width:${x.nap / max * 100}%"></i></span><span class="bt-btot y-num">${x.sleep ? esc(dur(x.sleep)) : '—'}</span></li>`).join('')}</ul>
        <p class="bt-key"><span><i class="bt-night"></i>Night</span><span><i class="bt-nap"></i>Naps</span></p>`, { icon: 'chart' })}`;
    }
  };

  /* ---------- growth ---------- */
  const lbOz = v => { const n = P.num(v), lb = Math.floor(n), oz = Math.round((n - lb) * 16); return oz === 16 ? `${lb + 1} lb` : `${lb} lb${oz ? ` ${oz} oz` : ''}`; };
  const growRows = s => s.growth.map((x, i) => Object.assign({ __i: i }, x)).sort((a, b) => (a.date < b.date ? -1 : 1));
  function change(s, id, key) {
    const rows = growRows(s).filter(x => P.has(x[key])), i = rows.findIndex(x => x.id === id);
    if (i < 1) return null;
    return { d: P.num(rows[i][key]) - P.num(rows[i - 1][key]), days: D.diff(rows[i - 1].date, rows[i].date) };
  }
  const fmtChange = (s, c, key) => {
    if (!c) return '';
    const sign = c.d > 0 ? '+' : c.d < 0 ? '−' : '±', a = Math.abs(c.d);
    if (key === 'weight' && s.growUnit === 'lb') { const oz = Math.round(a * 16); return `${sign}${oz >= 16 ? lbOz(a) : `${oz} oz`}`; }
    return `${sign}${Math.round(a * 100) / 100} ${key === 'weight' ? 'kg' : s.growUnit === 'lb' ? 'in' : 'cm'}`;
  };
  const growth = {
    id: 'growth', label: 'Growth', icon: 'chart',
    render(ctx) {
      const s = ctx.state, rows = growRows(s), last = rows.filter(x => P.has(x.weight)).pop(), wl = s.growUnit === 'lb' ? 'lb' : 'kg', ll = s.growUnit === 'lb' ? 'in' : 'cm';
      const c = last ? change(s, last.id, 'weight') : null;
      return `${u.head({ eyebrow: 'Growth', title: last ? `<em>${esc(s.growUnit === 'lb' ? lbOz(last.weight) : `${last.weight} kg`)}</em> on ${esc(D.short(last.date))}` : 'Weight, length and <em>head</em>', lede: 'Copy the numbers from each checkup. Change is since the visit before.' })}
      <div class="pl-grid">
        ${u.panel('Baby', `<div class="pl-fields">${u.field('Name', 'baby.name', s.baby.name, { ph: 'Name' })}${u.field('Born', 'baby.born', s.baby.born, { type: 'date', rerender: true })}</div>
          <div class="y-field bt-gap"><span class="y-label">Units</span>${u.seg('growUnit', s.growUnit, [['lb', 'lb + in'], ['kg', 'kg + cm']], 'Growth units')}</div>`, { icon: 'user', cls: 'pl-4' })}
        ${u.panel('Since last time', last ? u.kpis([['Weight', esc(s.growUnit === 'lb' ? lbOz(last.weight) : `${last.weight} kg`), 'y-kpi--world', c ? `${fmtChange(s, c, 'weight')} in ${P.plural(c.days, 'day')}` : 'first measurement'],
          ['Gain a week', c && c.days ? (s.growUnit === 'lb' ? `${Math.round(c.d * 16 / c.days * 7)} oz` : `${Math.round(c.d * 1000 / c.days * 7)} g`) : '—', '', 'average since the last visit'], ['Age', esc(age(s) || '—'), '', s.baby.born ? `born ${esc(D.short(s.baby.born))}` : 'add a birth date']]) : '<p class="pl-muted">Add the first measurement below.</p>', { icon: 'star', cls: 'pl-8' })}
      </div>
      ${u.panel('Measurements', u.table('growth', rows, [
        { k: 'date', label: 'Date', type: 'date', w: '160px', rerender: true },
        { k: 'weight', label: `Weight (${wl})`, num: true, w: '1fr', ph: wl === 'lb' ? '12.4' : '5.6', title: true },
        { label: 'Change', w: '110px', html: r => `<span class="bt-chg y-num">${esc(fmtChange(s, change(s, r.id, 'weight'), 'weight'))}</span>` },
        { k: 'length', label: `Length (${ll})`, num: true, w: '1fr', ph: '—' },
        { k: 'head', label: `Head (${ll})`, num: true, w: '1fr', ph: '—' }
      ], { index: x => x.__i, total: s.growth.length, what: 'measurement', add: 'Add measurement', tpl: 'growth', cls: 'bt-gtab' }), { icon: 'chart', hint: s.growUnit === 'lb' ? 'Weight in pounds with decimals: 12 lb 6 oz is 12.4.' : '' })}`;
    },
    actions: {
      set(ctx, d) {   // switching units converts every measurement
        const s = ctx.state;
        if (d.bind === 'growUnit' && d.value !== s.growUnit) {
          const toKg = d.value === 'kg', w = toKg ? 0.45359237 : 1 / 0.45359237, l = toKg ? 2.54 : 1 / 2.54;
          s.growth.forEach(x => { if (P.has(x.weight)) x.weight = String(Math.round(P.num(x.weight) * w * 100) / 100); ['length', 'head'].forEach(k => { if (P.has(x[k])) x[k] = String(Math.round(P.num(x[k]) * l * 10) / 10); }); });
          s.growUnit = d.value; return;
        }
        P.set(s, d.bind, d.value);
      }
    }
  };

  /* ---------- health ---------- */
  const health = {
    id: 'health', label: 'Health', icon: 'heart',
    render(ctx) {
      const s = ctx.state, t = D.today(), next = s.visits.filter(v => v.date >= t && P.has(v.what)).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
      const names = [...new Set(s.meds.filter(m => P.has(m.name)).map(m => m.name))];
      return `${u.head({ eyebrow: 'Health', title: next ? `${esc(next.what)} <em>${esc(D.rel(next.date))}</em>` : 'Visits, shots and <em>medicine</em>', lede: 'Questions for the doctor, the shot schedule and every dose with its time — so nobody doubles a dose at 3 am.' })}
      ${names.length ? `<div class="bt-meds">${names.map(n => { const l = s.meds.filter(m => m.name === n).sort((a, b) => ms(b) - ms(a))[0];
        return `<div class="y-panel bt-medcard"><b>${esc(n)}</b><span>Last given <b data-ago="${ms(l)}">${ago(Date.now() - ms(l))}</b> ago${l.dose ? ` · ${esc(l.dose)}` : ''}</span>${u.btn('Given now', { sm: true, icon: 'plus', act: 'giveNow', data: { name: n, dose: l.dose } })}</div>`; }).join('')}</div>` : ''}
      ${u.panel('Doctor visits', u.table('visits', s.visits, [
        { k: 'date', label: 'Date', type: 'date', w: '160px' }, { k: 'what', label: 'Visit', title: true, w: '1fr', ph: '4-month checkup' }, { k: 'ask', label: 'Questions to ask / notes', w: '1.4fr', ph: 'Write them as you think of them' }
      ], { what: 'visit', add: 'Add visit', tpl: 'visits' }), { icon: 'calendar' })}
      <div class="pl-grid">
        ${u.panel('Medicine given', u.table('meds', s.meds.map((m, i) => Object.assign({ __i: i }, m)).sort((a, b) => ms(b) - ms(a)), [
          { k: 'date', label: 'Date', type: 'date', w: '150px' }, { k: 'time', label: 'Time', type: 'time', w: '116px' }, { k: 'name', label: 'Medicine', title: true, w: '1fr', ph: 'Name' }, { k: 'dose', label: 'Dose', w: '100px', ph: '1.25 ml' }
        ], { index: x => x.__i, total: s.meds.length, what: 'dose', add: 'Add dose', tpl: 'meds' }), { icon: 'list', cls: 'pl-7', hint: 'Always follow the dose your pediatrician or the label gives for your baby’s weight.' })}
        ${u.panel('Shots', u.checklist('shots', s.shots, { ph: 'Vaccine or visit', what: 'shot', add: 'Add', tpl: 'shots' }), { icon: 'check', cls: 'pl-5', hint: 'A typical US schedule to start from — check with your pediatrician.' })}
      </div>`;
    },
    actions: { giveNow(ctx, d) { const n = new Date(); ctx.state.meds.push(med({ date: isoOf(n), time: hm(n), name: d.name, dose: d.dose })); ctx.toast(`${d.name} · logged now`); } }
  };

  /* ---------- milestones ---------- */
  const milestones = {
    id: 'milestones', label: 'Milestones', icon: 'award',
    render(ctx) {
      const s = ctx.state, got = s.stones.filter(x => P.has(x.text) && x.date).sort((a, b) => (a.date < b.date ? 1 : -1));
      return `${u.head({ eyebrow: 'Milestones', title: got.length ? `<em>${got.length}</em> firsts so far` : 'The <em>firsts</em>', lede: 'Add the date when it happens and a line about it. Every baby has their own timing.' })}
      ${got.length ? `<div class="bt-firsts">${got.slice(0, 4).map(x => `<div class="y-panel bt-first">${I('award')}<b>${esc(x.text)}</b><span>${esc(D.full(x.date))}${s.baby.born ? ` · ${P.plural(Math.max(0, Math.round(D.diff(s.baby.born, x.date) / 7)), 'week')} old` : ''}</span>${x.note ? `<em>${esc(x.note)}</em>` : ''}</div>`).join('')}</div>` : ''}
      ${u.panel('', `${u.quickAdd('stones', { ph: 'Add your own — e.g. “First bath she liked”', label: 'Add a milestone', kind: 'world' })}<div class="xm-gap"></div>
        ${u.table('stones', s.stones, [{ k: 'text', label: 'Milestone', title: true, w: '1.2fr', ph: 'Milestone' }, { k: 'date', label: 'Date', type: 'date', w: '160px', rerender: true }, { k: 'note', label: 'Note', w: '1.4fr', ph: 'Where, who saw it' }], { what: 'milestone', cls: 'bt-stab' })}`)}
      ${u.notes('notes', s.notes, { rows: 5, title: 'Notes', ph: 'Doctor’s number, what soothes, bottle routine…' })}`;
    }
  };

  let tick = null;
  P.create({
    slug: 'baby-tracker-app', name: 'Baby Tracker', world: 'nursery',
    welcome: 'Add your baby’s name and birthday on Growth, then tap Feed, Sleep or Diaper on Today as things happen.',
    pages: [today, log, sleep, growth, health, milestones],
    blank, sample, normalize,
    open() {
      clearInterval(tick);
      tick = setInterval(() => {
        document.querySelectorAll('[data-since]').forEach(el => { el.textContent = clockOf((Date.now() - +el.dataset.since) / 1000); });
        document.querySelectorAll('[data-ago]').forEach(el => { const v = ago(Date.now() - +el.dataset.ago); if (el.textContent !== v) el.textContent = v; });
      }, 1000);
    },
    rows: { entries: () => entry(), growth: () => grow(), visits: () => visit({ date: D.add(D.today(), 7) }), meds: () => med(), shots: () => shot(), stones: () => stone() },
    about: '<p><b>Baby Tracker</b> logs feeds (left and right with a timer, bottles, solids), sleep and diapers with one tap, adds up each day, shows sleep over the week, keeps growth from every checkup, doctor visits with your questions, medicine with the time of the last dose, shots and milestones. It prints a 24-hour log for the pediatrician.</p>',
    disclaimer: 'Baby Tracker is a personal log, not medical advice. If you are worried about feeding, sleep, weight or a fever, call your pediatrician.'
  });
})();
