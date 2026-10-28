/* Workout Tracker App — log sets with last time's weights filled in, a rest timer, plans, history, progress with
   estimated 1RM and PRs, body measurements and an exercise library. Yaykit planner engine, gym world (workout.css). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full body', 'Cardio'];
  const EQUIP = ['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Kettlebell', 'Band', 'Other'];
  const MEAS = [['waist', 'Waist'], ['chest', 'Chest'], ['hips', 'Hips'], ['arms', 'Arms'], ['thighs', 'Thighs']];
  const txt = v => (v == null ? '' : String(v));
  const r1 = n => Math.round(n * 10) / 10;
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
  const key = name => txt(name).trim().toLowerCase();

  /* ---------- records ---------- */
  const set = o => Object.assign({ id: P.uid(), ex: '', w: '', r: '', done: false }, o || {});
  const item = (ex, sets, reps) => ({ id: P.uid(), ex: ex || '', sets: txt(sets || '3'), reps: txt(reps || '8') });
  const plan = (name, program, items) => ({ id: P.uid(), name: name || '', program: program || '', items: items || [] });
  const exercise = (name, group, equip, notes) => ({ id: P.uid(), name: name || '', group: GROUPS.includes(group) ? group : 'Full body', equip: EQUIP.includes(equip) ? equip : 'Other', notes: notes || '' });
  const weigh = o => Object.assign({ id: P.uid(), date: D.today(), weight: '', waist: '', chest: '', hips: '', arms: '', thighs: '' }, o || {});

  const LIBRARY = [
    ['Bench press', 'Chest', 'Barbell'], ['Incline dumbbell press', 'Chest', 'Dumbbell'], ['Dumbbell bench press', 'Chest', 'Dumbbell'], ['Push-up', 'Chest', 'Bodyweight'],
    ['Chest fly', 'Chest', 'Cable'], ['Dip', 'Chest', 'Bodyweight'], ['Deadlift', 'Back', 'Barbell'], ['Barbell row', 'Back', 'Barbell'], ['Pull-up', 'Back', 'Bodyweight'],
    ['Chin-up', 'Back', 'Bodyweight'], ['Lat pulldown', 'Back', 'Cable'], ['Seated cable row', 'Back', 'Cable'], ['One-arm dumbbell row', 'Back', 'Dumbbell'], ['Face pull', 'Shoulders', 'Cable'],
    ['Back squat', 'Legs', 'Barbell'], ['Front squat', 'Legs', 'Barbell'], ['Romanian deadlift', 'Legs', 'Barbell'], ['Leg press', 'Legs', 'Machine'], ['Walking lunge', 'Legs', 'Dumbbell'],
    ['Bulgarian split squat', 'Legs', 'Dumbbell'], ['Leg curl', 'Legs', 'Machine'], ['Leg extension', 'Legs', 'Machine'], ['Hip thrust', 'Legs', 'Barbell'], ['Calf raise', 'Legs', 'Machine'],
    ['Goblet squat', 'Legs', 'Kettlebell'], ['Overhead press', 'Shoulders', 'Barbell'], ['Dumbbell shoulder press', 'Shoulders', 'Dumbbell'], ['Lateral raise', 'Shoulders', 'Dumbbell'],
    ['Rear delt fly', 'Shoulders', 'Dumbbell'], ['Biceps curl', 'Arms', 'Dumbbell'], ['Hammer curl', 'Arms', 'Dumbbell'], ['Triceps pushdown', 'Arms', 'Cable'], ['Skull crusher', 'Arms', 'Barbell'],
    ['Overhead triceps extension', 'Arms', 'Dumbbell'], ['Plank', 'Core', 'Bodyweight'], ['Hanging leg raise', 'Core', 'Bodyweight'], ['Cable crunch', 'Core', 'Cable'], ['Russian twist', 'Core', 'Bodyweight'],
    ['Kettlebell swing', 'Full body', 'Kettlebell'], ['Farmer carry', 'Full body', 'Dumbbell'], ['Rowing machine', 'Cardio', 'Machine'], ['Treadmill', 'Cardio', 'Machine']
  ];
  const PROGRAMS = {
    ppl: { label: 'Push / Pull / Legs', days: [
      ['Push', [['Bench press', 3, 5], ['Overhead press', 3, 8], ['Incline dumbbell press', 3, 10], ['Lateral raise', 3, 12], ['Triceps pushdown', 3, 12]]],
      ['Pull', [['Deadlift', 3, 5], ['Barbell row', 3, 8], ['Lat pulldown', 3, 10], ['Face pull', 3, 15], ['Biceps curl', 3, 12]]],
      ['Legs', [['Back squat', 3, 5], ['Romanian deadlift', 3, 8], ['Leg press', 3, 10], ['Leg curl', 3, 12], ['Calf raise', 3, 15]]]] },
    full: { label: 'Full body A / B', days: [
      ['Full body A', [['Back squat', 3, 5], ['Bench press', 3, 5], ['Barbell row', 3, 8], ['Plank', 3, '45 s']]],
      ['Full body B', [['Deadlift', 3, 5], ['Overhead press', 3, 8], ['Lat pulldown', 3, 10], ['Walking lunge', 3, 10]]]] },
    ul: { label: 'Upper / Lower', days: [
      ['Upper', [['Bench press', 4, 6], ['Barbell row', 4, 6], ['Overhead press', 3, 8], ['Lat pulldown', 3, 10], ['Biceps curl', 2, 12], ['Triceps pushdown', 2, 12]]],
      ['Lower', [['Back squat', 4, 6], ['Romanian deadlift', 3, 8], ['Leg press', 3, 10], ['Leg curl', 3, 12], ['Calf raise', 3, 15]]]] }
  };
  const programPlans = k => PROGRAMS[k].days.map(([name, list]) => plan(name, PROGRAMS[k].label, list.map(([e, s, r]) => item(e, s, r))));

  function blank() { return { units: 'lb', exercises: LIBRARY.map(x => exercise(...x)), plans: [], workouts: [], current: null, body: [], notes: '' }; }
  function sample() {
    const s = blank(), t = D.today();
    s.plans = programPlans('ppl');
    const START = { 'Bench press': 135, 'Overhead press': 85, 'Incline dumbbell press': 45, 'Lateral raise': 15, 'Triceps pushdown': 40, 'Deadlift': 225, 'Barbell row': 115,
      'Lat pulldown': 100, 'Face pull': 30, 'Biceps curl': 25, 'Back squat': 185, 'Romanian deadlift': 135, 'Leg press': 270, 'Leg curl': 70, 'Calf raise': 90 };
    const STEP = { 'Bench press': 5, 'Overhead press': 2.5, 'Deadlift': 10, 'Barbell row': 5, 'Back squat': 10, 'Romanian deadlift': 5, 'Leg press': 10, 'Lat pulldown': 5 };
    const sessions = [];
    for (let back = 42; back >= 1; back--) { const d = D.add(t, -back), dow = D.parse(d).getDay(); if (dow === 1 || dow === 3 || dow === 5) sessions.push(d); }
    sessions.forEach((d, n) => {
      const p = s.plans[n % 3], week = Math.floor(n / 3), start = D.parse(d).setHours(18, 5 + (n % 4) * 7, 0, 0);
      const sets = [];
      p.items.forEach(it => {
        const base = START[it.ex], w = base + (STEP[it.ex] || 2.5) * Math.floor(week * (STEP[it.ex] ? 1 : 0.5));
        for (let k = 0; k < +it.sets; k++) sets.push(set({ ex: it.ex, w: String(w), r: String(Math.max(1, +it.reps - (k === 2 && n % 5 === 4 ? 1 : 0))), done: true }));
      });
      s.workouts.push({ id: P.uid(), date: d, name: p.name, planId: p.id, start, end: start + (52 + (n % 5) * 4) * 60000, sets });
    });
    /* today's workout in progress: the next day in the rotation, last time's weights filled in */
    const next = s.plans[sessions.length % 3];
    s.current = startFrom(s, next);
    s.current.start = Date.now() - 26 * 60000;
    s.current.sets.forEach((x, i) => { if (i < 3 || i === 3) x.done = true; });
    for (let k = 0; k < 7; k++) s.body.push(weigh({ date: D.add(t, -42 + k * 7), weight: String(r1(184.6 - k * 0.7 - (k % 2) * 0.3)), waist: String(r1(35 - k * 0.15)), chest: String(r1(41 + k * 0.1)),
      hips: '39.5', arms: String(r1(14.2 + k * 0.05)), thighs: String(r1(23.5 + k * 0.05)) }));
    s.notes = 'Add 5 lb to the big lifts when every set hits the target reps.\n\nDeload week after week 8.';
    return s;
  }
  function normalize(s) {
    s.units = s.units === 'kg' ? 'kg' : 'lb';
    s.exercises = arr(s.exercises, x => Object.assign(exercise(txt(x.name), x.group, x.equip, txt(x.notes)), { id: txt(x.id) || P.uid() }));
    const sets = v => arr(v, x => set({ id: txt(x.id) || P.uid(), ex: txt(x.ex), w: txt(x.w), r: txt(x.r), done: !!x.done }));
    s.plans = arr(s.plans, x => ({ id: txt(x.id) || P.uid(), name: txt(x.name), program: txt(x.program), items: arr(x.items, y => Object.assign(item(txt(y.ex), y.sets, y.reps), { id: txt(y.id) || P.uid() })) }));
    s.workouts = arr(s.workouts, x => ({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), name: txt(x.name), planId: txt(x.planId), start: +x.start || 0, end: +x.end || 0, sets: sets(x.sets) }));
    const c = s.current;
    s.current = c && typeof c === 'object' ? { id: txt(c.id) || P.uid(), date: D.parse(c.date) ? c.date : D.today(), name: txt(c.name), planId: txt(c.planId), start: +c.start || Date.now(), sets: sets(c.sets) } : null;
    s.body = arr(s.body, x => weigh(Object.assign({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), weight: txt(x.weight) }, Object.fromEntries(MEAS.map(([k]) => [k, txt(x[k])])))));
    s.notes = txt(s.notes);
    s.ui = s.ui || {};
    if (typeof s.ui.open !== 'string') s.ui.open = '';
    if (typeof s.ui.lift !== 'string') s.ui.lift = '';
    return s;
  }

  /* ---------- math ---------- */
  const e1rm = (w, r) => { w = P.num(w); r = Math.round(P.num(r)); return w > 0 && r > 0 ? (r === 1 ? w : w * (1 + r / 30)) : 0; };   // Epley
  const done = list => list.filter(x => x.done && P.has(x.ex));
  const volume = list => done(list).reduce((a, x) => a + P.num(x.w) * Math.round(P.num(x.r)), 0);
  const mins = w => (w.end && w.start ? Math.max(1, Math.round((w.end - w.start) / 60000)) : 0);
  const byDate = s => s.workouts.slice().sort((a, b) => (a.date === b.date ? b.start - a.start : a.date < b.date ? 1 : -1));
  /* the most recent finished workout that has this lift, and its done sets of it */
  function lastSets(s, ex) {
    const k = key(ex);
    for (const w of byDate(s)) { const l = done(w.sets).filter(x => key(x.ex) === k); if (l.length) return { w, sets: l }; }
    return null;
  }
  function best(s, ex) {
    const k = key(ex); let w = 0, rm = 0;
    s.workouts.forEach(x => done(x.sets).filter(y => key(y.ex) === k).forEach(y => { w = Math.max(w, P.num(y.w)); rm = Math.max(rm, e1rm(y.w, y.r)); }));
    return { w, rm };
  }
  const isPR = (s, x) => { if (!x.done || !(P.num(x.w) > 0)) return false; const b = best(s, x.ex); return P.num(x.w) > b.w || e1rm(x.w, x.r) > b.rm + 0.05; };
  const firstNum = v => Math.round(P.num(String(v).split(/[-–]/)[0])) || '';
  function startFrom(s, p) {
    const sets = [];
    (p ? p.items : []).filter(it => P.has(it.ex)).forEach(it => {
      const last = lastSets(s, it.ex), n = Math.max(1, Math.round(P.num(it.sets)) || 3);
      for (let k = 0; k < n; k++) { const l = last ? last.sets[Math.min(k, last.sets.length - 1)] : null; sets.push(set({ ex: it.ex, w: l ? l.w : '', r: l ? l.r : String(firstNum(it.reps)) })); }
    });
    return { id: P.uid(), date: D.today(), name: p ? p.name : 'Workout', planId: p ? p.id : '', start: Date.now(), sets };
  }
  const fmt = n => (Math.round(n) === n ? n.toLocaleString('en-US') : r1(n).toLocaleString('en-US'));
  const groups = list => { const out = []; list.forEach((x, i) => { const k = key(x.ex) || '(no name)'; let g = out.find(y => y.k === k); if (!g) out.push(g = { k, ex: x.ex, rows: [] }); g.rows.push(Object.assign({ __i: i }, x)); }); return out; };
  const unitSwitch = s => `<div class="y-seg pl-seg wo-units" role="group" aria-label="Units">${['lb', 'kg'].map(v => `<button type="button" aria-pressed="${s.units === v}" class="${s.units === v ? 'is-active' : ''}" data-act="units" data-u="${v}">${v}</button>`).join('')}</div>`;
  const len = s => (s.units === 'kg' ? 'cm' : 'in');
  const exList = s => `<datalist id="woEx">${s.exercises.filter(x => P.has(x.name)).map(x => `<option value="${esc(x.name)}"></option>`).join('')}</datalist>`;
  const lastLine = (s, ex) => { const l = lastSets(s, ex); return l ? `Last time ${esc(D.short(l.w.date))}: ${l.sets.map(x => `${esc(x.w || '—')} × ${esc(x.r || '—')}`).join(', ')}` : 'First time — pick a weight you can do with good form'; };

  /* ---------- today ---------- */
  const today = {
    id: 'today', label: 'Today', icon: 'flame',
    render(ctx) {
      const s = ctx.state, c = s.current;
      if (!c) {
        const last = byDate(s)[0];
        return `${u.head({ eyebrow: D.long(D.today()), title: 'Ready to <em>train</em>?', lede: 'Pick today’s workout. Last time’s weights and reps are filled in — beat them by a little.', meta: unitSwitch(s) })}
        ${u.panel('Start a workout', `<div class="wo-starts">${s.plans.filter(p => P.has(p.name)).map(p => { const l = byDate(s).find(w => w.planId === p.id);
          return `<button type="button" class="wo-start" data-act="startPlan" data-id="${esc(p.id)}"><b>${esc(p.name)}</b><span>${P.plural(p.items.filter(x => P.has(x.ex)).length, 'exercise')}${l ? ` · last ${esc(D.short(l.date))}` : ''}</span></button>`; }).join('')}
          <button type="button" class="wo-start wo-start--empty" data-act="startEmpty"><b>Empty workout</b><span>add exercises as you go</span></button></div>
          ${s.plans.length ? '' : `<p class="pl-hint">No plans yet — add a starter plan on Plans, or start an empty workout.</p>`}`, { icon: 'flame' })}
        ${last ? u.panel('Last workout', `<p class="wo-lastw"><b>${esc(last.name)}</b> · ${esc(D.full(last.date))} · ${P.plural(done(last.sets).length, 'set')} · ${fmt(volume(last.sets))} ${s.units} · ${mins(last)} min</p>`, { icon: 'calendar' }) : ''}`;
      }
      const g = groups(c.sets);
      return `${u.head({ eyebrow: `Started ${new Date(c.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`, title: `<em>${esc(c.name || 'Workout')}</em> in progress`, lede: 'Last time’s weights are filled in. Change what you lift, tick each set when it’s done, rest, repeat.', meta: unitSwitch(s) })}
      <div data-slot="kpis"></div>
      ${exList(s)}
      <div class="wo-grid">
        <div class="wo-main">${g.map(x => u.panel(x.ex || 'Exercise', `<p class="wo-last">${lastLine(s, x.ex)}</p>
          ${u.table('current.sets', x.rows, [
            { label: 'Set', w: '48px', html: (r, i) => `<span class="wo-setn y-num">${x.rows.findIndex(y => y.__i === i) + 1}</span>` },
            { k: 'w', label: `Weight (${s.units})`, num: true, w: '1fr', ph: '0' },
            { k: 'r', label: 'Reps', num: true, w: '1fr', ph: '0' },
            { k: 'done', label: 'Done', type: 'check', w: '64px', rerender: true },
            { label: '', w: '58px', html: r => (isPR(s, r) ? u.pill('PR', 'good') : '') }
          ], { index: r => r.__i, total: c.sets.length, what: 'set', cls: 'wo-sets', rowClass: r => (r.done ? 'is-done' : '') })}
          <div class="pl-list-foot">${u.btn('Add set', { sm: true, icon: 'plus', act: 'addSet', data: { ex: x.ex } })}</div>`, { icon: 'flame', cls: 'y-panel--flat wo-ex' })).join('') || u.empty('flame', 'No exercises yet', 'Add one below.')}
          ${u.panel('Add an exercise', u.quickAdd('current.sets', { key: 'ex', ph: 'Exercise — e.g. “Bench press”', label: 'Add an exercise', kind: 'world' }).replace('name="q"', 'name="q" list="woEx"'), { icon: 'plus' })}
        </div>
        <div class="wo-side">
          ${u.panel('Rest timer', `${u.timer({ idle: 'Rest' })}<div class="wo-rest">${[60, 90, 120, 180].map(n => u.btn(n < 120 ? `${n} s` : `${n / 60} min`, { sm: true, act: 'timer-start', data: { secs: n, label: 'Rest' } })).join('')}</div>`, { icon: 'timer' })}
          ${u.panel('Done for today?', `<div class="pl-stack">${u.btn('Finish workout', { kind: 'world', icon: 'check', act: 'finish' })}${u.btn('Discard', { sm: true, kind: 'ghost', icon: 'close', act: 'discard' })}</div>`, { icon: 'check' })}
        </div>
      </div>`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, c = s.current; if (!c) return '';
        const last = c.planId ? byDate(s).find(w => w.planId === c.planId) : null, v = volume(c.sets), prs = c.sets.filter(x => isPR(s, x)).length;
        return u.kpis([['Sets done', `${done(c.sets).length}<small>/${c.sets.length}</small>`, 'y-kpi--world', ''],
          ['Volume', `${fmt(v)} <small>${s.units}</small>`, '', last ? `last time ${fmt(volume(last.sets))} ${s.units}` : 'weight × reps, done sets'],
          ['Time', `${Math.max(0, Math.round((Date.now() - c.start) / 60000))} <small>min</small>`, '', ''],
          ['PRs', String(prs), prs ? 'is-good' : '', prs ? 'new personal records' : 'beat a best to get one']]);
      }
    },
    onQuickAdd(ctx, d, it) { const l = lastSets(ctx.state, it.ex); if (l) { it.w = l.sets[0].w; it.r = l.sets[0].r; } },
    actions: {
      startPlan(ctx, d) { const s = ctx.state; s.current = startFrom(s, s.plans.find(p => p.id === d.id)); window.scrollTo({ top: 0 }); },
      startEmpty(ctx) { ctx.state.current = startFrom(ctx.state, null); ctx.focus('form[data-list="current.sets"] input[name=q]'); },
      addSet(ctx, d) {
        const c = ctx.state.current, rows = c.sets.filter(x => key(x.ex) === key(d.ex)), l = rows[rows.length - 1] || {};
        const at = c.sets.lastIndexOf(rows[rows.length - 1]) + 1;
        c.sets.splice(at, 0, set({ ex: d.ex, w: l.w || '', r: l.r || '' }));
        ctx.focus(`[data-bind="current.sets.${at}.w"]`);
      },
      finish(ctx) {
        const s = ctx.state, c = s.current, sets = done(c.sets);
        if (!sets.length) { ctx.toast('Tick at least one set first'); return false; }
        const w = { id: c.id, date: c.date, name: c.name || 'Workout', planId: c.planId, start: c.start, end: Date.now(), sets };
        s.workouts.push(w); s.current = null; ctx.timer.clear();
        ctx.toast(`Saved — ${fmt(volume(sets))} ${s.units} in ${mins(w)} min`);
      },
      async discard(ctx) {
        if (!(await ctx.confirm({ title: 'Discard this workout?', body: 'Its sets will not be saved.', ok: 'Discard', danger: true }))) return false;
        ctx.state.current = null; ctx.save(); ctx.render();
      }
    }
  };

  /* ---------- plans ---------- */
  const plans = {
    id: 'plans', label: 'Plans', icon: 'list',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Workout plans', title: s.plans.length ? `<em>${s.plans.length}</em> workout days` : 'Your <em>plans</em>', lede: 'One card per workout day: exercises with target sets × reps. Start one from here or from Today.' })}
      ${exList(s)}
      <div class="pl-row wo-starter"><span class="pl-muted">Add a starter plan:</span>${Object.keys(PROGRAMS).map(k => u.btn(PROGRAMS[k].label, { sm: true, icon: 'sparkle', act: 'program', data: { k } })).join('')}</div>
      ${u.records('plans', s.plans, {
        what: 'Workout day', titlePh: 'Push, Full body A…', cls: 'wo-plans', add: 'Add workout day', addKind: 'world',
        sub: p => `${esc(p.program || 'Your own')} · ${P.plural(p.items.filter(x => P.has(x.ex)).length, 'exercise')}`,
        fields: [],
        foot: (p, i) => `${u.table(`plans.${i}.items`, p.items, [
            { k: 'ex', label: 'Exercise', title: true, w: '1.6fr', html: (r, j) => u.input(`plans.${i}.items.${j}.ex`, r.ex, { label: `Exercise ${j + 1}`, ph: 'Exercise', list: 'woEx' }) },
            { k: 'sets', label: 'Sets', num: true, w: '70px', ph: '3' },
            { k: 'reps', label: 'Reps', w: '84px', ph: '8–10' }
          ], { what: 'exercise', move: true, add: 'Add exercise', tpl: 'items', cls: 'wo-items' })}
          <div class="pl-list-foot">${u.btn(`Start ${p.name || 'this workout'}`, { kind: 'world', sm: true, icon: 'flame', act: 'startHere', data: { id: p.id } })}</div>`,
        empty: u.empty('list', 'No plans yet', 'Add a starter plan above, or your own workout day.')
      })}`;
    },
    actions: {
      program(ctx, d) { const s = ctx.state, have = new Set(s.plans.map(p => key(p.name))); const add = programPlans(d.k).filter(p => !have.has(key(p.name))); s.plans.push(...add); ctx.toast(add.length ? `${PROGRAMS[d.k].label} added` : 'Already in your plans'); },
      startHere(ctx, d) {
        const s = ctx.state;
        if (s.current && done(s.current.sets).length) { ctx.toast('Finish or discard the workout in progress first'); return false; }
        s.current = startFrom(s, s.plans.find(p => p.id === d.id)); ctx.save(); ctx.go('today'); return false;
      }
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Workout plan</h1><p class="pl-sheet-meta">Weights in ${s.units} · write what you lift in the boxes</p>${s.plans.filter(p => P.has(p.name)).map(p => `<h2>${esc(p.name)}</h2>
        <table><thead><tr><th>Exercise</th><th style="width:20mm">Sets × reps</th><th style="width:22mm">Last</th><th>Set 1</th><th>Set 2</th><th>Set 3</th><th>Set 4</th></tr></thead><tbody>${p.items.filter(x => P.has(x.ex)).map(x => { const l = lastSets(s, x.ex);
          return `<tr><td><b>${esc(x.ex)}</b></td><td>${esc(x.sets)} × ${esc(x.reps)}</td><td>${l ? esc(`${l.sets[0].w} × ${l.sets[0].r}`) : ''}</td><td></td><td></td><td></td><td></td></tr>`; }).join('')}</tbody></table>`).join('')}`;
    }
  };

  /* ---------- history ---------- */
  const history = {
    id: 'history', label: 'History', icon: 'calendar',
    render(ctx) {
      const s = ctx.state, list = byDate(s), wk = D.add(D.today(), -6), week = list.filter(w => w.date >= wk);
      return `${u.head({ eyebrow: 'History', title: `<em>${list.length}</em> workouts`, lede: 'Every finished workout with its volume and time. Open one to see the sets.', meta: unitSwitch(s) })}
      ${u.kpis([['This week', String(week.length), 'y-kpi--world', `${fmt(week.reduce((a, w) => a + volume(w.sets), 0))} ${s.units} lifted`], ['All time', String(list.length), '', list.length ? `since ${D.short(list[list.length - 1].date)}` : ''],
        ['Average', list.length ? `${Math.round(list.reduce((a, w) => a + mins(w), 0) / list.length)} <small>min</small>` : '—', '', 'per workout']])}
      <div class="xm-gap"></div>
      ${list.length ? `<div class="wo-hist">${list.map(w => { const i = s.workouts.indexOf(w), open = s.ui.open === w.id;
        return `<article class="y-panel y-panel--flat wo-h${open ? ' is-open' : ''}"><div class="wo-h-top"><div><b>${esc(w.name || 'Workout')}</b><span class="pl-muted">${esc(D.fmt(w.date, { weekday: 'short' }))} ${esc(D.short(w.date))} · ${mins(w)} min · ${P.plural(done(w.sets).length, 'set')}</span></div>
          <span class="wo-h-vol y-num">${fmt(volume(w.sets))} <small>${s.units}</small></span>${u.btn(open ? 'Close' : 'Open', { sm: true, act: 'set', data: { bind: 'ui.open', value: open ? '' : w.id } })}${u.iconBtn('close', `Remove workout ${w.name}`, 'remove', { list: 'workouts', i, what: w.name })}</div>
          ${open ? `<dl class="wo-h-sets">${groups(done(w.sets)).map(g => `<div><dt>${esc(g.ex)}</dt><dd>${g.rows.map(x => `${esc(x.w)} × ${esc(x.r)}`).join(' · ')}</dd></div>`).join('')}</dl>` : ''}</article>`; }).join('')}</div>`
        : u.empty('calendar', 'No workouts yet', 'Finish a workout on Today and it lands here.')}`;
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Workout history</h1><p class="pl-sheet-meta">${s.workouts.length} workouts · weights in ${s.units}</p><table><thead><tr><th style="width:24mm">Date</th><th>Workout</th><th>Sets</th><th style="width:22mm">Volume</th><th style="width:14mm">Min</th></tr></thead><tbody>${byDate(s).map(w => `<tr><td>${esc(D.short(w.date))}</td><td><b>${esc(w.name)}</b></td><td>${groups(done(w.sets)).map(g => `${esc(g.ex)} ${g.rows.map(x => `${esc(x.w)}×${esc(x.r)}`).join(', ')}`).join('; ')}</td><td>${fmt(volume(w.sets))}</td><td>${mins(w)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- progress ---------- */
  function lifts(s) {
    const map = new Map();
    byDate(s).slice().reverse().forEach(w => done(w.sets).forEach(x => {
      const k = key(x.ex); if (!map.has(k)) map.set(k, { k, ex: x.ex, sessions: [] });
      const L = map.get(k); let sess = L.sessions.find(y => y.id === w.id);
      if (!sess) L.sessions.push(sess = { id: w.id, date: w.date, top: 0, rm: 0 });
      sess.top = Math.max(sess.top, P.num(x.w)); sess.rm = Math.max(sess.rm, e1rm(x.w, x.r));
    }));
    return [...map.values()].map(L => { const rm = Math.max(...L.sessions.map(x => x.rm)), last = L.sessions[L.sessions.length - 1], prev = Math.max(0, ...L.sessions.slice(0, -1).map(x => x.rm));
      return Object.assign(L, { best: Math.max(...L.sessions.map(x => x.top)), rm, last, pr: L.sessions.length > 1 && last.rm > prev + 0.05 }); });
  }
  const progress = {
    id: 'progress', label: 'Progress', icon: 'chart',
    render(ctx) {
      const s = ctx.state, all = lifts(s), cur = all.find(x => x.k === key(s.ui.lift)) || all[0];
      if (!all.length) return `${u.head({ eyebrow: 'Progress', title: 'Your <em>progress</em>', lede: 'Finish a few workouts and your best lifts show up here.' })}${u.empty('chart', 'Nothing yet', 'Progress builds from your history.')}`;
      const last10 = cur.sessions.slice(-10), max = Math.max(...last10.map(x => x.rm)) || 1;
      return `${u.head({ eyebrow: 'Progress', title: `<em>${esc(cur.ex)}</em>`, lede: 'Estimated one-rep max uses the Epley formula: weight × (1 + reps ÷ 30). It’s a guide for planning — never test a real max without a spotter.', meta: unitSwitch(s) })}
      <div class="pl-row wo-pick">${u.select('ui.lift', cur.k, all.map(x => [x.k, x.ex]), { label: 'Choose a lift', rerender: true })}</div>
      ${u.kpis([['Best weight', `${fmt(cur.best)} <small>${s.units}</small>`, 'y-kpi--world'], ['Estimated 1RM', `${fmt(r1(cur.rm))} <small>${s.units}</small>`, cur.pr ? 'is-good' : '', cur.pr ? 'PR last session' : ''],
        ['Sessions', String(cur.sessions.length), '', `since ${D.short(cur.sessions[0].date)}`]])}
      ${u.panel('Last 10 sessions — estimated 1RM', `<div class="wo-bars" role="img" aria-label="Estimated 1RM, last ${last10.length} sessions">${last10.map(x => `<div class="wo-bar"><span class="y-num">${fmt(Math.round(x.rm))}</span><i style="height:${Math.max(6, Math.round(x.rm / max * 100))}%"></i><small>${esc(D.short(x.date))}</small></div>`).join('')}</div>`, { icon: 'chart' })}
      ${u.panel('All lifts', `<div class="y-table pl-table wo-lifts" role="table" style="--y-cols:1.6fr 90px 110px 100px 70px">
        <div class="y-table-row y-table-head" role="row"><span role="columnheader">Lift</span><span role="columnheader">Best</span><span role="columnheader">Est. 1RM</span><span role="columnheader">Last</span><span role="columnheader"><span class="y-sr">PR</span></span></div>
        ${all.map(x => `<div class="y-table-row pl-trow" role="row"><span role="cell" class="pl-cell y-cell-title" data-label="Lift"><b>${esc(x.ex)}</b></span><span role="cell" class="pl-cell y-num" data-label="Best">${fmt(x.best)}</span><span role="cell" class="pl-cell y-num" data-label="Est. 1RM">${fmt(r1(x.rm))}</span><span role="cell" class="pl-cell" data-label="Last">${esc(D.short(x.last.date))}</span><span role="cell" class="pl-cell" data-label="PR">${x.pr ? u.pill('PR', 'good') : ''}</span></div>`).join('')}</div>`, { icon: 'star' })}`;
    }
  };

  /* ---------- body ---------- */
  const body = {
    id: 'body', label: 'Body', icon: 'heart',
    render(ctx) {
      const s = ctx.state, rows = s.body.map((x, i) => Object.assign({ __i: i }, x)).sort((a, b) => (a.date < b.date ? 1 : -1));
      return `${u.head({ eyebrow: 'Body', title: 'Weight & <em>measurements</em>', lede: `Weigh in once a week, same time of day. Weight in ${s.units}, measurements in ${len(s)}.`, meta: unitSwitch(s) })}
      <div data-slot="kpis"></div>
      ${u.panel('Weigh-ins', `${u.table('body', rows, [
          { k: 'date', label: 'Date', type: 'date', w: '150px' },
          { k: 'weight', label: `Weight (${s.units})`, num: true, w: '1fr', ph: '0' }
        ].concat(MEAS.map(([k, l]) => ({ k, label: l, num: true, w: '1fr', ph: '—' }))), { index: r => r.__i, total: s.body.length, what: 'weigh-in', cls: 'wo-body', empty: 'No weigh-ins yet.' })}
        <div class="pl-list-foot">${u.add('Log a weigh-in', 'body', { tpl: 'body', kind: 'world' })}</div>`, { icon: 'heart' })}
      ${u.notes('notes', s.notes, { rows: 4, title: 'Notes', ph: 'Goals, injuries to work around, what to change next block…' })}`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, l = s.body.filter(x => P.num(x.weight) > 0).sort((a, b) => (a.date < b.date ? -1 : 1));
        if (!l.length) return '';
        const now = P.num(l[l.length - 1].weight), first = P.num(l[0].weight), prev = l.length > 1 ? P.num(l[l.length - 2].weight) : now;
        const ch = n => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt(Math.abs(r1(n)))} ${s.units}`;
        const m = l.filter(x => P.num(x.waist) > 0), waist = m.length > 1 ? r1(P.num(m[m.length - 1].waist) - P.num(m[0].waist)) : null;
        return u.kpis([['Weight now', `${fmt(now)} <small>${s.units}</small>`, 'y-kpi--world', esc(D.short(l[l.length - 1].date))], ['Since last', ch(now - prev), '', ''], ['Since first', ch(now - first), '', `since ${esc(D.short(l[0].date))}`],
          waist != null ? ['Waist', `${waist > 0 ? '+' : waist < 0 ? '−' : ''}${fmt(Math.abs(waist))} <small>${len(s)}</small>`, '', 'since first'] : null]);
      }
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Weight & measurements</h1><p class="pl-sheet-meta">Weight in ${s.units}, measurements in ${len(s)}</p><table><thead><tr><th>Date</th><th>Weight</th>${MEAS.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody>${s.body.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map(x => `<tr><td>${esc(D.short(x.date))}</td><td>${esc(x.weight)}</td>${MEAS.map(([k]) => `<td>${esc(x[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- exercises ---------- */
  const exercises = {
    id: 'exercises', label: 'Exercises', icon: 'star',
    render(ctx) {
      const s = ctx.state, g = s.ui.group || 'all', rows = s.exercises.map((x, i) => Object.assign({ __i: i }, x)).filter(x => g === 'all' || x.group === g);
      return `${u.head({ eyebrow: 'Exercise library', title: `<em>${s.exercises.filter(x => P.has(x.name)).length}</em> exercises`, lede: 'The names you type in plans and workouts come from here. Add your own, with notes on form or machine settings.' })}
      ${u.panel('', `${u.quickAdd('exercises', { key: 'name', ph: 'Add an exercise and press Enter', label: 'Add an exercise', kind: 'world' })}
        <div class="wo-bar-chips">${u.chips('ui.group', g, [['all', 'All', s.exercises.length]].concat(GROUPS.map(x => [x, x, s.exercises.filter(y => y.group === x).length]).filter(x => x[2])), 'Muscle group')}</div>
        ${u.table('exercises', rows, [
          { k: 'name', label: 'Exercise', title: true, w: '1.4fr', ph: 'Name' },
          { k: 'group', label: 'Muscle group', type: 'select', options: GROUPS, w: '140px', rerender: true },
          { k: 'equip', label: 'Equipment', type: 'select', options: EQUIP, w: '140px' },
          { k: 'notes', label: 'Notes', w: '1.4fr', ph: 'Seat 4, grip width…' }
        ], { index: r => r.__i, total: s.exercises.length, what: 'exercise', cls: 'wo-lib', empty: 'Nothing in this group.' })}
        ${s.exercises.length < 20 ? `<div class="pl-list-foot">${u.btn('Add the starter library', { sm: true, icon: 'sparkle', act: 'library' })}</div>` : ''}`)}`;
    },
    actions: { library(ctx) { const s = ctx.state, have = new Set(s.exercises.map(x => key(x.name))); LIBRARY.filter(x => !have.has(key(x[0]))).forEach(x => s.exercises.push(exercise(...x))); ctx.toast('Starter library added'); } }
  };

  /* ---------- units ---------- */
  function setUnits(ctx, d) {
    const s = ctx.state, to = d.u === 'kg' ? 'kg' : 'lb';
    if (s.units === to) return false;
    const f = to === 'kg' ? 0.45359237 : 1 / 0.45359237, lf = to === 'kg' ? 2.54 : 1 / 2.54;
    const cv = (v, k) => (P.has(v) && P.num(v) ? String(r1(P.num(v) * k)) : v);
    const sets = l => l.forEach(x => { x.w = cv(x.w, f); });
    s.workouts.forEach(w => sets(w.sets)); if (s.current) sets(s.current.sets);
    s.body.forEach(x => { x.weight = cv(x.weight, f); MEAS.forEach(([k]) => { x[k] = cv(x[k], lf); }); });
    s.units = to;
    ctx.toast(to === 'kg' ? 'Now in kg and cm' : 'Now in lb and inches');
  }

  window.WorkoutMath = { e1rm };
  P.create({
    slug: 'workout-tracker-app', name: 'Workout Tracker', world: 'gym',
    welcome: 'Add a starter plan on Plans, then start today’s workout — last time’s weights fill in by themselves.',
    pages: [today, plans, history, progress, body, exercises],
    blank, sample, normalize,
    timer: { doneText: 'Rest over — next set', defaultSecs: 90, defaultLabel: 'Rest' },
    rows: { sets: () => set(), items: () => item('', 3, 8), plans: () => plan('', '', [item('', 3, 8)]), body: () => weigh(), exercises: () => exercise('', 'Full body', 'Other') },
    actions: { units: setUnits },
    accepts: d => d && typeof d === 'object' && ('workouts' in d || 'plans' in d),
    about: '<p><b>Workout Tracker</b> logs your training on your phone: start a workout from a plan and last time’s weights and reps are filled in, tick each set, rest with a timer, finish and it lands in history. Progress shows your best lifts, estimated one-rep max and new records; Body keeps weight and measurements; the exercise library holds your own notes.</p>',
    disclaimer: 'Workout Tracker is a personal log, not medical or fitness advice. Check with a doctor or a qualified trainer before starting a new program, and stop if anything hurts.'
  });
})();
