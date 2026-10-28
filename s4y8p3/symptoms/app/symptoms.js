/* Symptom Tracker App — a daily check-in for chronic illness: energy spoons, pain and where, symptoms with severity, sleep, mood,
   flares and triggers; meds taken; a month view; patterns over 30 days; doctors, appointments and a summary sheet for the doctor.
   Yaykit planner engine, calm world (symptoms.css). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const SYMPTOMS = ['Fatigue', 'Headache', 'Migraine', 'Brain fog', 'Muscle pain', 'Joint pain', 'Stiffness', 'Nausea', 'Dizziness', 'Light sensitivity', 'Anxiety', 'Insomnia'];
  const AREAS = ['Head', 'Neck', 'Shoulders', 'Back', 'Chest', 'Stomach', 'Hips', 'Arms', 'Hands', 'Legs', 'Knees', 'Feet'];
  const TRIGGERS = ['Poor sleep', 'Stress', 'Weather', 'Food', 'Screen time', 'Overdid it', 'Hormones', 'Skipped meal', 'Alcohol', 'Caffeine'];
  const MOODS = [['1', 'Awful'], ['2', 'Low'], ['3', 'OK'], ['4', 'Good'], ['5', 'Great']];
  const MOOD = Object.fromEntries(MOODS);
  const SEV = ['', 'mild', 'moderate', 'severe'];
  const KINDS = ['Medication', 'Supplement', 'As needed'];
  const txt = v => (v == null ? '' : String(v));
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
  const r1 = n => Math.round(n * 10) / 10;

  const task = (text, cost, done) => ({ id: P.uid(), text: text || '', cost: cost == null ? '1' : String(cost), done: !!done });
  const med = o => Object.assign({ id: P.uid(), name: '', kind: 'Medication', dose: '', times: '1', purpose: '', prescriber: '', refill: '' }, o || {});
  const doctor = o => Object.assign({ id: P.uid(), name: '', specialty: '', phone: '' }, o || {});
  const visit = o => Object.assign({ id: P.uid(), date: '', time: '', doctor: '', reason: '', questions: '', notes: '' }, o || {});
  function dayRec(o, spoons) {
    o = o || {};
    const syms = o.syms && typeof o.syms === 'object' ? o.syms : {};
    const taken = o.taken && typeof o.taken === 'object' ? o.taken : {};
    const prn = o.prn && typeof o.prn === 'object' ? o.prn : {};
    return {
      spoons: txt(o.spoons != null ? o.spoons : spoons), tasks: arr(o.tasks, x => Object.assign(task(txt(x.text), txt(x.cost), x.done), { id: txt(x.id) || P.uid() })),
      pain: o.pain === '' || o.pain == null ? '' : String(Math.max(0, Math.min(10, Math.round(P.num(o.pain))))),
      areas: (Array.isArray(o.areas) ? o.areas : []).filter(a => AREAS.includes(a)),
      syms: Object.fromEntries(Object.keys(syms).map(k => [k, Math.max(0, Math.min(3, Math.round(P.num(syms[k]))))]).filter(x => x[1] > 0)),
      sleep: txt(o.sleep), mood: MOOD[o.mood] ? String(o.mood) : '', flare: !!o.flare,
      triggers: (Array.isArray(o.triggers) ? o.triggers : []).map(txt).filter(Boolean), notes: txt(o.notes),
      taken: Object.fromEntries(Object.keys(taken).filter(k => taken[k]).map(k => [k, true])),
      prn: Object.fromEntries(Object.keys(prn).map(k => [k, Math.max(0, Math.round(P.num(prn[k])))]).filter(x => x[1] > 0))
    };
  }
  const has = d => d && (d.pain !== '' || Object.keys(d.syms).length || P.has(d.sleep) || d.mood || d.flare || P.has(d.notes) || d.tasks.length);

  function blank() {
    return { profile: { name: '', conditions: '', allergies: '', emergency: '' }, spoons: '12', symptoms: SYMPTOMS.slice(), days: {}, meds: [], doctors: [], visits: [] };
  }
  /* a fixed pseudo-random sequence, so the example always shows the same 45 days counted back from today */
  function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function sample() {
    const s = blank(), t = D.today(), R = rng(7);
    const meds = [med({ name: 'Amitriptyline', dose: '10 mg at night', times: '1', purpose: 'Sleep and pain', prescriber: 'Dr. Shah', refill: D.add(t, 5) }),
      med({ name: 'Magnesium glycinate', kind: 'Supplement', dose: '400 mg', times: '1', purpose: 'Migraine prevention', prescriber: 'Dr. Shah', refill: D.add(t, 21) }),
      med({ name: 'Vitamin D3', kind: 'Supplement', dose: '2000 IU', times: '1', purpose: 'Low vitamin D', prescriber: 'Dr. Lee', refill: D.add(t, 40) }),
      med({ name: 'Sumatriptan', kind: 'As needed', dose: '50 mg', times: '1', purpose: 'Migraine attacks', prescriber: 'Dr. Shah', refill: D.add(t, 33) })];
    s.meds = meds;
    s.profile = { name: 'Alex', conditions: 'Chronic migraine · fibromyalgia', allergies: 'Penicillin', emergency: 'Sam (partner) · (555) 201-7788' };
    for (let i = 44; i >= 1; i--) {
      const d = D.add(t, -i), sleep = Math.round((5 + R() * 3.5) * 2) / 2, migraine = R() < 0.2;
      let pain = Math.round(3 + (sleep < 6 ? 2 : 0) + R() * 3 + (migraine ? 2 : 0));
      pain = Math.min(10, pain);
      const syms = { Fatigue: 1 + Math.floor(R() * 3) };
      if (R() < 0.6) syms['Muscle pain'] = 1 + Math.floor(R() * 3);
      if (R() < 0.35) syms['Brain fog'] = 1 + Math.floor(R() * 2);
      if (R() < 0.3) syms['Joint pain'] = 1 + Math.floor(R() * 2);
      if (migraine) Object.assign(syms, { Migraine: 3, 'Light sensitivity': 2, Nausea: 1 });
      const areas = ['Neck', 'Shoulders', 'Back', 'Hips'].filter(() => R() < 0.45);
      if (migraine) areas.unshift('Head');
      const trig = [];
      if (sleep < 6) trig.push('Poor sleep');
      if (R() < 0.25) trig.push('Weather');
      if (R() < 0.2) trig.push('Stress');
      if (migraine && R() < 0.5) trig.push('Screen time');
      const taken = {};
      meds.slice(0, 3).forEach(m => { if (R() < 0.9) taken[`${m.id}_0`] = true; });
      s.days[d] = dayRec({ spoons: pain >= 7 ? '8' : '12', pain: String(pain), areas, syms, sleep: String(sleep), mood: String(Math.max(1, 5 - Math.round(pain / 3))),
        flare: pain >= 7, triggers: trig, taken, prn: migraine ? { [meds[3].id]: 1 } : {}, notes: migraine ? 'Migraine — dark room, took sumatriptan.' : '' });
    }
    s.days[t] = dayRec({ spoons: '12', tasks: [task('Shower', 2, true), task('Work, 4 hours', 5, true), task('Cook dinner', 3), task('10-minute walk', 2)],
      pain: '5', areas: ['Neck', 'Shoulders'], syms: { Fatigue: 2, 'Muscle pain': 2 }, sleep: '6.5', mood: '3', triggers: ['Weather'],
      taken: { [`${meds[1].id}_0`]: true, [`${meds[2].id}_0`]: true }, notes: 'Rain all day. Shoulders tight — heat pad helped.' });
    s.doctors = [doctor({ name: 'Dr. Priya Shah', specialty: 'Neurology', phone: '(555) 310-4400' }), doctor({ name: 'Dr. Marcus Lee', specialty: 'Primary care', phone: '(555) 310-2200' })];
    s.visits = [visit({ date: D.add(t, 6), time: '10:30', doctor: s.doctors[0].id, reason: 'Migraine follow-up', questions: 'Is the amitriptyline dose still right?\nShould I keep the magnesium?\nWhat to do when a migraine lasts more than 2 days?' }),
      visit({ date: D.add(t, -30), time: '14:00', doctor: s.doctors[1].id, reason: 'Check-up + blood work', notes: 'Vitamin D low — started D3 2000 IU. Recheck in 3 months.' })];
    return s;
  }
  function normalize(s) {
    const p = s.profile && typeof s.profile === 'object' ? s.profile : {};
    s.profile = { name: txt(p.name), conditions: txt(p.conditions), allergies: txt(p.allergies), emergency: txt(p.emergency) };
    s.spoons = String(Math.max(0, Math.min(30, Math.round(P.num(s.spoons)) || 12)));
    s.symptoms = (Array.isArray(s.symptoms) && s.symptoms.length ? s.symptoms : SYMPTOMS).map(txt).filter(Boolean);
    const days = s.days && typeof s.days === 'object' ? s.days : {};
    s.days = Object.fromEntries(Object.keys(days).filter(k => D.parse(k) && days[k] && typeof days[k] === 'object').map(k => [k, dayRec(days[k], s.spoons)]));
    s.meds = arr(s.meds, x => med({ id: txt(x.id) || P.uid(), name: txt(x.name), kind: KINDS.includes(x.kind) ? x.kind : 'Medication', dose: txt(x.dose),
      times: String(Math.max(1, Math.min(4, Math.round(P.num(x.times)) || 1))), purpose: txt(x.purpose), prescriber: txt(x.prescriber), refill: D.parse(x.refill) ? x.refill : '' }));
    s.doctors = arr(s.doctors, x => doctor({ id: txt(x.id) || P.uid(), name: txt(x.name), specialty: txt(x.specialty), phone: txt(x.phone) }));
    s.visits = arr(s.visits, x => visit({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : '', time: txt(x.time), doctor: txt(x.doctor), reason: txt(x.reason), questions: txt(x.questions), notes: txt(x.notes) }));
    s.ui = s.ui || {};
    if (!/^\d{4}-\d\d$/.test(s.ui.month || '')) s.ui.month = D.today().slice(0, 7);
    if (!D.parse(s.ui.sel || '')) s.ui.sel = D.today();
    if (typeof s.ui.symf !== 'string') s.ui.symf = '';
    return s;
  }

  /* ---------- math ---------- */
  const day = (s, d) => s.days[d] || (s.days[d] = dayRec({}, s.spoons));
  function spoons(d) {
    const total = Math.max(0, Math.round(P.num(d.spoons))), planned = d.tasks.reduce((a, x) => a + Math.max(0, P.num(x.cost)), 0);
    const spent = d.tasks.filter(x => x.done).reduce((a, x) => a + Math.max(0, P.num(x.cost)), 0);
    return { total, planned, spent, left: total - spent, over: planned > total };
  }
  const window30 = s => { const t = D.today(); return Array.from({ length: 30 }, (_, i) => D.add(t, i - 29)).filter(d => has(s.days[d])); };
  const avg = l => (l.length ? l.reduce((a, x) => a + x, 0) / l.length : null);
  function patterns(s) {
    const ds = window30(s).map(d => s.days[d]);
    const pains = ds.filter(d => d.pain !== '').map(d => P.num(d.pain)), sleeps = ds.filter(d => P.has(d.sleep)).map(d => P.num(d.sleep)), moods = ds.filter(d => d.mood).map(d => P.num(d.mood));
    const short = ds.filter(d => d.pain !== '' && P.has(d.sleep) && P.num(d.sleep) < 6).map(d => P.num(d.pain));
    const rested = ds.filter(d => d.pain !== '' && P.has(d.sleep) && P.num(d.sleep) >= 7).map(d => P.num(d.pain));
    const symCount = {}, symSev = {}, trig = {};
    ds.forEach(d => { Object.keys(d.syms).forEach(k => { symCount[k] = (symCount[k] || 0) + 1; symSev[k] = (symSev[k] || 0) + d.syms[k]; }); d.triggers.forEach(k => { trig[k] = (trig[k] || 0) + 1; }); });
    return {
      days: ds.length, pain: avg(pains), sleep: avg(sleeps), mood: avg(moods), flares: ds.filter(d => d.flare).length,
      short: avg(short), rested: avg(rested), nShort: short.length, nRested: rested.length,
      top: Object.keys(symCount).map(k => [k, symCount[k], symSev[k] / symCount[k]]).sort((a, b) => b[1] - a[1] || b[2] - a[2]),
      triggers: Object.entries(trig).sort((a, b) => b[1] - a[1])
    };
  }
  const refillSoon = m => m.refill && D.diff(D.today(), m.refill) <= 7;
  const scheduled = s => s.meds.filter(m => P.has(m.name) && m.kind !== 'As needed');
  function dueToday(s) { const d = day(s, D.today()); let n = 0, done = 0; scheduled(s).forEach(m => { for (let k = 0; k < +m.times; k++) { n++; if (d.taken[`${m.id}_${k}`]) done++; } }); return { n, done }; }
  const fmt = n => (n == null ? '—' : String(r1(n)));
  const painTone = p => (p === '' ? '' : P.num(p) >= 7 ? 'bad' : P.num(p) >= 4 ? 'warn' : 'good');
  const docName = (s, id) => (s.doctors.find(x => x.id === id) || {}).name || '';
  const SLOT = ['Morning', 'Midday', 'Evening', 'Bedtime'];

  /* ---------- the day editor (Today and Log share it) ---------- */
  function editor(ctx, date, o) {
    o = o || {};
    const s = ctx.state, d = day(s, date), b = `days.${date}`;
    const scale = `<div class="sy-scale" role="group" aria-label="Pain from 0 to 10">${Array.from({ length: 11 }, (_, n) => `<button type="button" class="sy-pain sy-p${n}${d.pain === String(n) ? ' is-on' : ''}" aria-pressed="${d.pain === String(n)}" data-act="set" data-bind="${b}.pain" data-value="${n}">${n}</button>`).join('')}</div>`;
    const chips = (list, on, act, label) => `<div class="pl-chips sy-chips" role="group" aria-label="${esc(label)}">${list.map(x => `<button type="button" class="y-chip pl-chip${on(x) ? ' is-on' : ''}" aria-pressed="${!!on(x)}" data-act="${act}" data-v="${esc(x)}" data-date="${date}">${esc(x)}</button>`).join('')}</div>`;
    const syms = `<div class="pl-chips sy-chips sy-syms" role="group" aria-label="Symptoms — tap again for worse">${s.symptoms.map(x => { const v = d.syms[x] || 0; return `<button type="button" class="y-chip pl-chip sy-sev${v}${v ? ' is-on' : ''}" aria-pressed="${!!v}" data-act="sym" data-v="${esc(x)}" data-date="${date}">${esc(x)}${v ? ` <span class="sy-sevtag">${SEV[v]}</span>` : ''}</button>`; }).join('')}</div>`;
    return `<div class="pl-stack sy-editor">
      <div class="y-field"><span class="y-label">Pain right now <span class="pl-opt">0 = none · 10 = worst</span></span>${scale}</div>
      <div class="y-field"><span class="y-label">Where</span>${chips(AREAS, x => d.areas.includes(x), 'area', 'Where it hurts')}</div>
      <div class="y-field"><span class="y-label">Symptoms <span class="pl-opt">tap again for moderate, severe</span></span>${syms}</div>
      <div class="pl-fields">${u.field('Sleep last night (hours)', `${b}.sleep`, d.sleep, { num: true, ph: '7.5' })}<div class="y-field"><span class="y-label">Mood</span>${u.seg(`${b}.mood`, d.mood, MOODS, 'Mood')}</div></div>
      <div class="y-field">${u.switch(`${b}.flare`, d.flare, 'Flare day')}</div>
      ${o.triggers === false ? '' : `<div class="y-field"><span class="y-label">Possible triggers</span>${chips(TRIGGERS, x => d.triggers.includes(x), 'trig', 'Possible triggers')}</div>`}
      ${u.field('Notes', `${b}.notes`, d.notes, { type: 'textarea', rows: 3, ph: 'What helped, what made it worse' })}</div>`;
  }
  const toggleIn = (list, v) => { const i = list.indexOf(v); if (i >= 0) list.splice(i, 1); else list.push(v); };
  const dayActions = {
    area(ctx, x) { toggleIn(day(ctx.state, x.date).areas, x.v); },
    trig(ctx, x) { toggleIn(day(ctx.state, x.date).triggers, x.v); },
    sym(ctx, x) { const d = day(ctx.state, x.date), v = ((d.syms[x.v] || 0) + 1) % 4; if (v) d.syms[x.v] = v; else delete d.syms[x.v]; }
  };

  /* ---------- today ---------- */
  const today = {
    id: 'today', label: 'Today', icon: 'heart',
    render(ctx) {
      const s = ctx.state, t = D.today(), d = day(s, t), b = `days.${t}`;
      const prn = s.meds.filter(m => P.has(m.name) && m.kind === 'As needed');
      return `${u.head({ eyebrow: D.long(t), title: '<span data-slot="title"></span>', lede: 'A one-minute check-in. Skip anything that doesn’t apply — every bit you log makes the patterns clearer.' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Spoons for today', `<div class="sy-spoonset">${u.field('Spoons I have today', `${b}.spoons`, d.spoons, { num: true, ph: '12', rerender: true })}<div data-slot="spoonbar" class="sy-spoonbar-wrap"></div></div>
          <div class="xm-gap"></div>${u.quickAdd(`${b}.tasks`, { ph: 'Add a task — e.g. “Laundry”', label: 'Add a task for today', kind: 'world' })}
          ${u.checklist(`${b}.tasks`, d.tasks, { ph: 'Task', what: 'task', rerender: true, extra: (x, i) => `<label class="sy-cost">${u.input(`${b}.tasks.${i}.cost`, x.cost, { num: true, label: `Spoons for ${x.text || 'task'}`, rerender: true })}<span>spoons</span></label>`, empty: 'Add what you hope to do — and what each costs.' })}`, { icon: 'star', cls: 'pl-6' })}
        ${u.panel('Meds today', `${scheduled(s).length ? `<ul class="pl-checklist sy-meds">${scheduled(s).map(m => Array.from({ length: +m.times }, (_, k) => `<li class="pl-ci${d.taken[`${m.id}_${k}`] ? ' is-done' : ''}">${u.tick(`${b}.taken.${m.id}_${k}`, !!d.taken[`${m.id}_${k}`], `Taken: ${m.name}`, { rerender: true })}<div class="pl-ci-main"><span class="pl-ci-text">${esc(m.name)}</span><span class="pl-ci-meta">${esc([m.dose, +m.times > 1 ? SLOT[k] : '', m.kind === 'Supplement' ? 'supplement' : ''].filter(Boolean).join(' · '))}</span></div></li>`).join('')).join('')}</ul>` : '<p class="pl-muted">Add your medications and supplements on Meds.</p>'}
          ${prn.length ? `<div class="sy-prn">${prn.map(m => `<div class="sy-prn-row"><span><b>${esc(m.name)}</b> <span class="pl-muted">${esc(m.dose)} · as needed${d.prn[m.id] ? ` · ${d.prn[m.id]} today` : ''}</span></span>${u.btn('Took one', { sm: true, icon: 'plus', act: 'prn', data: { id: m.id } })}</div>`).join('')}</div>` : ''}`, { icon: 'check', cls: 'pl-6', actions: u.btn('Meds', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'meds' } }) })}
      </div>
      ${u.panel('How are you today?', editor(ctx, t), { icon: 'heart' })}`;
    },
    slots: {
      title(ctx) { const d = day(ctx.state, D.today()); return d.pain === '' ? 'How are you <em>today</em>?' : `Pain <em>${esc(d.pain)}</em> of 10 today`; },
      kpis(ctx) {
        const s = ctx.state, d = day(s, D.today()), sp = spoons(d), m = dueToday(s), p = patterns(s);
        return u.kpis([
          ['Spoons left', `${sp.left}<small>/${sp.total}</small>`, sp.left < 0 ? 'y-kpi--accent' : 'y-kpi--world', `${sp.spent} spent · ${Math.max(0, sp.planned - sp.spent)} still planned`],
          ['Pain', d.pain === '' ? '—' : `${esc(d.pain)}<small>/10</small>`, d.pain !== '' && P.num(d.pain) >= 7 ? 'y-kpi--accent' : '', p.pain != null ? `30-day average ${fmt(p.pain)}` : ''],
          ['Meds taken', `${m.done}<small>/${m.n}</small>`, m.n && m.done === m.n ? 'is-good' : '', 'scheduled today'],
          ['Flare days', String(p.flares), '', 'in the last 30 days']
        ]);
      },
      spoonbar(ctx) {
        const sp = spoons(day(ctx.state, D.today())), n = Math.max(sp.total, sp.planned, 1);
        return `<div class="sy-spoons" role="img" aria-label="${sp.spent} spoons spent, ${sp.left} left of ${sp.total}">${Array.from({ length: Math.min(30, n) }, (_, i) => `<i class="${i < sp.spent ? 'is-spent' : i < sp.planned ? 'is-planned' : ''}${i >= sp.total ? ' is-over' : ''}"></i>`).join('')}</div>
          <p class="pl-hint">${sp.over ? `<span class="is-over">Planned ${sp.planned} — that’s ${sp.planned - sp.total} more than you have. Drop or move something.</span>` : `${sp.left} left · ${sp.planned} planned`}</p>`;
      }
    },
    actions: Object.assign({ prn(ctx, x) { const d = day(ctx.state, D.today()); d.prn[x.id] = (d.prn[x.id] || 0) + 1; ctx.toast('Logged'); } }, dayActions)
  };

  /* ---------- log (month) ---------- */
  const log = {
    id: 'log', label: 'Log', icon: 'calendar',
    render(ctx) {
      const s = ctx.state, ym = s.ui.month, first = `${ym}-01`, start = D.monday(first), t = D.today(), f = s.ui.symf;
      const cells = Array.from({ length: 42 }, (_, i) => D.add(start, i)).filter((d, i) => i < 35 || d.slice(0, 7) === ym);
      const label = D.fmt(first, { month: 'long', year: 'numeric' });
      return `${u.head({ eyebrow: 'Log', title: `<em>${esc(label)}</em>`, lede: 'Each day colored by pain. Tap a day to see or change it.', meta: `<div class="bp-nav sy-nav">${u.iconBtn('prev', 'Previous month', 'month', { n: -1 })}${u.iconBtn('next', 'Next month', 'month', { n: 1 })}${ym === t.slice(0, 7) ? '' : u.btn('This month', { sm: true, act: 'month', data: { n: 0 } })}</div>` })}
      <div class="sy-filter">${u.chips('ui.symf', f, [['', 'All days'], ...s.symptoms.map(x => [x, x])], 'Highlight a symptom')}</div>
      <div class="sy-month" role="grid" aria-label="${esc(label)}">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => `<span class="sy-wd">${w}</span>`).join('')}
        ${cells.map(d => { const x = s.days[d], on = has(x), dim = f && !(on && x.syms[f]);
          return `<button type="button" class="sy-cell${d.slice(0, 7) !== ym ? ' is-out' : ''}${d === s.ui.sel ? ' is-sel' : ''}${d === t ? ' is-today' : ''}${on && x.pain !== '' ? ` sy-p${x.pain}` : ''}${dim ? ' is-dim' : ''}${on && x.flare ? ' is-flare' : ''}" data-act="pick" data-date="${d}" aria-label="${esc(D.full(d))}${on && x.pain !== '' ? `, pain ${x.pain}` : ''}"><b>${+d.slice(8)}</b>${on && x.pain !== '' ? `<span class="sy-cp">${x.pain}</span>` : ''}${on && x.flare ? `<i class="sy-fl" aria-hidden="true">${I('warn')}</i>` : ''}</button>`; }).join('')}</div>
      <p class="sy-key"><span><i class="sy-p1"></i>0–3</span><span><i class="sy-p5"></i>4–6</span><span><i class="sy-p8"></i>7–10</span><span>${I('warn')} flare</span></p>
      ${u.panel(D.long(s.ui.sel), editor(ctx, s.ui.sel), { icon: 'edit', cls: 'sy-dayed' })}`;
    },
    actions: Object.assign({
      month(ctx, x) { const s = ctx.state; if (+x.n === 0) { s.ui.month = D.today().slice(0, 7); return; } const d = D.parse(`${s.ui.month}-15`); d.setMonth(d.getMonth() + +x.n); s.ui.month = D.iso(d).slice(0, 7); },
      pick(ctx, x) { ctx.state.ui.sel = x.date; ctx.focus('.sy-dayed'); }
    }, dayActions)
  };

  /* ---------- meds ---------- */
  const meds = {
    id: 'meds', label: 'Meds', icon: 'timer',
    render(ctx) {
      const s = ctx.state, t = D.today(), soon = s.meds.filter(m => P.has(m.name) && refillSoon(m));
      const last7 = Array.from({ length: 7 }, (_, i) => D.add(t, i - 6));
      return `${u.head({ eyebrow: 'Medications & supplements', title: `<em>${s.meds.filter(m => P.has(m.name)).length}</em> on the list`, lede: 'What you take, how often and why — and when to call for a refill.' })}
      ${soon.length ? u.banner('warn', `<b>Refill soon:</b> ${soon.map(m => `${esc(m.name)} (${esc(D.short(m.refill))})`).join(' · ')}`) : ''}
      ${u.panel('', u.table('meds', s.meds, [
        { k: 'name', label: 'Name', title: true, w: '1.2fr', ph: 'Name' },
        { k: 'kind', label: 'Type', type: 'select', options: KINDS, w: '130px', rerender: true },
        { k: 'dose', label: 'Dose', w: '1fr', ph: '10 mg' },
        { k: 'times', label: 'Times a day', type: 'select', options: ['1', '2', '3', '4'], w: '90px', rerender: true },
        { k: 'purpose', label: 'For', w: '1fr', ph: 'What it’s for' },
        { k: 'prescriber', label: 'Prescriber', w: '120px', ph: 'Dr.' },
        { k: 'refill', label: 'Refill by', type: 'date', w: '150px' },
        { label: '', w: '96px', html: m => (refillSoon(m) ? u.pill(D.diff(t, m.refill) < 0 ? 'overdue' : 'refill soon', 'bad') : '') }
      ], { what: 'medication', add: 'Add medication', tpl: 'meds', cls: 'sy-mtab', empty: 'Nothing yet. Add medications and supplements you take.' }), { icon: 'list' })}
      ${u.panel('Taken, last 7 days', scheduled(s).length ? `<div class="sy-adh">${scheduled(s).map(m => { const n = +m.times, done = last7.reduce((a, d) => a + Array.from({ length: n }, (_, k) => (s.days[d] && s.days[d].taken[`${m.id}_${k}`] ? 1 : 0)).reduce((x, y) => x + y, 0), 0);
          return `<div class="sy-adh-row"><span class="sy-adh-name">${esc(m.name)}</span><span class="sy-dots">${last7.map(d => { const c = Array.from({ length: n }, (_, k) => (s.days[d] && s.days[d].taken[`${m.id}_${k}`] ? 1 : 0)).reduce((x, y) => x + y, 0); return `<i class="${c >= n ? 'is-on' : c ? 'is-part' : ''}" title="${esc(D.short(d))}: ${c} of ${n}"></i>`; }).join('')}</span><b class="y-num">${done}/${7 * n}</b></div>`; }).join('')}</div>` : '<p class="pl-muted">Scheduled meds show up here.</p>', { icon: 'check' })}`;
    }
  };

  /* ---------- patterns ---------- */
  const patternsPage = {
    id: 'patterns', label: 'Patterns', icon: 'chart',
    render(ctx) {
      const s = ctx.state, p = patterns(s), t = D.today(), last = Array.from({ length: 30 }, (_, i) => D.add(t, i - 29));
      const maxTop = Math.max(1, ...p.top.map(x => x[1])), maxTrig = Math.max(1, ...p.triggers.map(x => x[1]));
      return `${u.head({ eyebrow: 'Last 30 days', title: p.days ? `<em>${p.days}</em> days logged` : 'Your <em>patterns</em>', lede: 'Not a diagnosis — just what your own log shows. Bring it to your next appointment.' })}
      ${u.kpis([['Average pain', p.pain == null ? '—' : `${fmt(p.pain)}<small>/10</small>`, 'y-kpi--world'], ['Average sleep', p.sleep == null ? '—' : `${fmt(p.sleep)}<small> h</small>`, ''],
        ['Average mood', p.mood == null ? '—' : MOOD[String(Math.round(p.mood))], ''], ['Flare days', String(p.flares), p.flares ? 'y-kpi--accent' : 'is-good']])}
      ${u.panel('Pain, day by day', `<div class="sy-strip" role="img" aria-label="Pain for the last 30 days">${last.map(d => { const x = s.days[d], v = x && x.pain !== '' ? P.num(x.pain) : null; return `<span class="sy-bar${v == null ? ' is-empty' : ''}${x && x.flare ? ' is-flare' : ''}" title="${esc(D.short(d))}: ${v == null ? 'not logged' : `pain ${v}`}"><i class="sy-p${v == null ? '' : v}" style="height:${v == null ? 4 : Math.max(6, v * 10)}%"></i></span>`; }).join('')}</div>`, { icon: 'chart' })}
      <div class="pl-grid">
        ${u.panel('Sleep and pain', p.nShort && p.nRested ? `<dl class="sy-cmp"><div><dt>Nights under 6 h</dt><dd class="y-num">${fmt(p.short)}</dd><span class="pl-muted">average pain · ${P.plural(p.nShort, 'day')}</span></div><div><dt>Nights of 7 h or more</dt><dd class="y-num">${fmt(p.rested)}</dd><span class="pl-muted">average pain · ${P.plural(p.nRested, 'day')}</span></div></dl>
          <p class="pl-hint">${p.short > p.rested + 0.5 ? 'Pain runs higher after short nights in your log.' : 'No big difference between short and long nights in your log.'}</p>` : '<p class="pl-muted">Log sleep and pain on a few short and a few long nights to compare.</p>', { icon: 'timer', cls: 'pl-5' })}
        ${u.panel('Top symptoms', p.top.length ? p.top.slice(0, 8).map(([k, n, sev]) => `<div class="sy-row"><span>${esc(k)}</span><span class="rl-track sy-track"><i style="width:${n / maxTop * 100}%"></i></span><b class="y-num">${n}</b><span class="pl-muted sy-sevavg">${SEV[Math.round(sev)]}</span></div>`).join('') : '<p class="pl-muted">Symptoms you log show up here.</p>', { icon: 'list', cls: 'pl-7' })}
        ${u.panel('Possible triggers', p.triggers.length ? p.triggers.map(([k, n]) => `<div class="sy-row sy-row--trig"><span>${esc(k)}</span><span class="rl-track sy-track"><i style="width:${n / maxTrig * 100}%"></i></span><b class="y-num">${n}</b></div>`).join('') : '<p class="pl-muted">Tag possible triggers in your check-in to count them here.</p>', { icon: 'warn' })}
      </div>`;
    }
  };

  /* ---------- appointments ---------- */
  const visits = {
    id: 'visits', label: 'Doctors', icon: 'user',
    render(ctx) {
      const s = ctx.state, t = D.today(), rows = s.visits.map((v, i) => Object.assign({ __i: i }, v)).sort((a, b) => ((a.date || '9') < (b.date || '9') ? 1 : -1));
      const next = s.visits.filter(v => v.date && v.date >= t).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
      return `${u.head({ eyebrow: 'Doctors & appointments', title: next ? `Next: <em>${esc(D.short(next.date))}</em>` : 'Doctors & <em>appointments</em>', lede: 'Write questions as you think of them. Print the 30-day summary and bring it along.', meta: next ? `<span class="y-sticker">${I('calendar')}${esc([docName(s, next.doctor), next.reason].filter(Boolean).join(' · '))}</span>` : '' })}
      <div class="pl-row sy-print">${u.btn('Print summary for my doctor', { kind: 'world', icon: 'print', act: 'print' })}<span class="pl-muted">Averages, flare days, top symptoms, triggers and meds for the last 30 days.</span></div>
      ${u.records('visits', rows, {
        index: v => v.__i, what: 'Appointment', titleKey: 'reason', titlePh: 'Reason — e.g. “Follow-up”', cls: 'sy-visits', add: 'Add appointment', addKind: 'world',
        sub: v => (v.date ? `${esc(D.full(v.date))}${v.time ? ` · ${esc(D.time(v.time))}` : ''}${v.date >= t ? ` ${u.pill('upcoming', 'world')}` : ''}` : 'No date yet'),
        fields: [{ k: 'date', label: 'Date', type: 'date', rerender: true }, { k: 'time', label: 'Time', type: 'time' }, { k: 'doctor', label: 'Doctor', options: s.doctors.map(d => [d.id, d.name || 'Unnamed']), blank: 'Choose…' },
          { k: 'questions', label: 'Questions to ask', type: 'textarea', wide: true, ph: 'One per line' }, { k: 'notes', label: 'What they said', type: 'textarea', wide: true, ph: 'Changes, tests, next steps' }],
        empty: u.empty('calendar', 'No appointments yet', 'Add the next one and the questions you want to ask.')
      })}
      <div class="pl-grid">
        ${u.panel('Doctors', u.table('doctors', s.doctors, [
          { k: 'name', label: 'Name', title: true, w: '1.2fr', ph: 'Dr.' }, { k: 'specialty', label: 'Specialty', w: '1fr', ph: 'Neurology' }, { k: 'phone', label: 'Phone', w: '1fr', ph: 'Phone' }
        ], { what: 'doctor', add: 'Add doctor', tpl: 'doctors', empty: 'Add your doctors here.' }), { icon: 'user', cls: 'pl-7' })}
        ${u.panel('About me', `<div class="pl-stack">${u.field('Name', 'profile.name', s.profile.name, { ph: 'Your name' })}${u.field('Conditions', 'profile.conditions', s.profile.conditions, { ph: 'Diagnoses' })}${u.field('Allergies', 'profile.allergies', s.profile.allergies, { ph: 'Drug or food allergies' })}${u.field('Emergency contact', 'profile.emergency', s.profile.emergency, { ph: 'Name · phone' })}</div>`, { icon: 'heart', cls: 'pl-5' })}
      </div>`;
    }
  };

  /* ---------- summary sheet for the doctor ---------- */
  function summary(ctx) {
    const s = ctx.state, p = patterns(s), t = D.today(), pr = s.profile;
    const prnCount = id => window30(s).reduce((a, d) => a + (s.days[d].prn[id] || 0), 0);
    return `<h1>Symptom summary${pr.name ? ` · ${esc(pr.name)}` : ''}</h1><p class="pl-sheet-meta">${esc(D.full(D.add(t, -29)))} – ${esc(D.full(t))} · ${p.days} days logged</p>
      ${pr.conditions || pr.allergies ? `<p>${pr.conditions ? `<b>Conditions:</b> ${esc(pr.conditions)}` : ''}${pr.conditions && pr.allergies ? ' · ' : ''}${pr.allergies ? `<b>Allergies:</b> ${esc(pr.allergies)}` : ''}</p>` : ''}
      <table><tbody><tr><td><b>Average pain</b></td><td>${fmt(p.pain)} / 10</td><td><b>Flare days</b></td><td>${p.flares}</td></tr>
        <tr><td><b>Average sleep</b></td><td>${p.sleep == null ? '—' : `${fmt(p.sleep)} h`}</td><td><b>Average mood</b></td><td>${p.mood == null ? '—' : esc(MOOD[String(Math.round(p.mood))])}</td></tr>
        ${p.nShort && p.nRested ? `<tr><td><b>Pain after &lt; 6 h sleep</b></td><td>${fmt(p.short)}</td><td><b>Pain after 7 h +</b></td><td>${fmt(p.rested)}</td></tr>` : ''}</tbody></table>
      <h2>Top symptoms</h2><table><tbody>${p.top.slice(0, 8).map(([k, n, sev]) => `<tr><td>${esc(k)}</td><td>${P.plural(n, 'day')}</td><td>usually ${SEV[Math.round(sev)]}</td></tr>`).join('') || '<tr><td>None logged</td></tr>'}</tbody></table>
      ${p.triggers.length ? `<h2>Possible triggers</h2><p>${p.triggers.map(([k, n]) => `${esc(k)} (${n})`).join(' · ')}</p>` : ''}
      <h2>Medications & supplements</h2><table><tbody>${s.meds.filter(m => P.has(m.name)).map(m => `<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.dose)}</td><td>${m.kind === 'As needed' ? `as needed · taken ${P.plural(prnCount(m.id), 'time')}` : `${m.times}× a day`}</td><td>${esc(m.purpose)}</td></tr>`).join('')}</tbody></table>
      ${(() => { const v = s.visits.filter(x => x.date && x.date >= t).sort((a, b) => (a.date < b.date ? -1 : 1))[0]; return v && P.has(v.questions) ? `<h2>Questions</h2><ol>${v.questions.split('\n').filter(x => x.trim()).map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''; })()}`;
  }
  [today, log, patternsPage, visits].forEach(p => { p.sheet = summary; });
  meds.sheet = ctx => `<h1>Medications & supplements</h1><table><thead><tr><th>Name</th><th>Dose</th><th>How often</th><th>For</th><th>Prescriber</th><th>Refill by</th></tr></thead><tbody>${ctx.state.meds.filter(m => P.has(m.name)).map(m => `<tr><td><b>${esc(m.name)}</b></td><td>${esc(m.dose)}</td><td>${m.kind === 'As needed' ? 'as needed' : `${m.times}× a day`}</td><td>${esc(m.purpose)}</td><td>${esc(m.prescriber)}</td><td>${m.refill ? esc(D.short(m.refill)) : ''}</td></tr>`).join('')}</tbody></table>`;

  P.create({
    slug: 'symptom-tracker-app', name: 'Symptom Tracker', world: 'calm',
    welcome: 'Start with today: your pain, a symptom or two and how you slept. Add your meds on Meds.',
    pages: [today, log, meds, patternsPage, visits],
    blank, sample, normalize,
    open(ctx) { ctx.state.ui.month = D.today().slice(0, 7); ctx.state.ui.sel = D.today(); },
    rows: { tasks: () => task('', 1), meds: () => med(), doctors: () => doctor(), visits: () => visit({ date: D.add(D.today(), 14) }) },
    about: '<p><b>Symptom Tracker</b> is a daily check-in for chronic illness: energy spoons and what to spend them on, pain and where it hurts, symptoms with severity, sleep, mood, flares and possible triggers, and the meds you took. A month view, 30-day patterns, your doctors and appointments, and a one-page summary to print for your doctor.</p>',
    disclaimer: 'Symptom Tracker is a personal log, not medical advice. It does not diagnose anything. Call your doctor with worries, and your local emergency number in an emergency.'
  });
})();
