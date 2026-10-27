/* ADHD Planner App — daily planner, brain dump, focus timer, routines, week, habits, meds. Yaykit planner engine, focus world.
   Grew out of Daily Focus (products/adhd-daily-focus-planner); the timer and routines are new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;

  const BUCKETS = [['quick', 'Low energy', 'quick wins · 5–15 min'], ['deep', 'Focus time', 'deep work · 30+ min'], ['maybe', 'If energy allows', 'optional']];
  const BUCKET_NAME = Object.fromEntries(BUCKETS.map(b => [b[0], b[1]]));
  const MORNING = ['Choose one kind priority', 'Drink water', 'Set a 10-minute starting timer', 'Clear one small surface'];
  const EVENING = ['Notice one win', 'Set out tomorrow’s first step', 'Put one item away', 'Choose a gentle bedtime cue'];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const HOURS = ['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  const PRIORITY = ['Must', 'Should', 'Could'];
  const EFFORT = [['quick', 'Low energy'], ['deep', 'Focus time'], ['maybe', 'If energy allows']];
  const BLOCKS = [[10, 'Just start', 'a 10-minute starter'], [25, 'Focus block', '25 minutes'], [45, 'Long block', '45 minutes'], [5, 'Break', '5 minutes']];
  const SCALE = ['1', '2', '3', '4', '5'];
  const MOOD = ['Low', 'Steady', 'Good'];

  /* ---------- model ---------- */
  const item = (text, done) => ({ text: text || '', done: !!done });
  const newDay = () => ({
    big: '', essentials: [item(), item(), item()], reward: '',
    tasks: { quick: [], deep: [], maybe: [] },
    morning: { energy: '', anxiety: '', mood: '', checks: MORNING.map(t => item(t)) },
    evening: { energy: '', anxiety: '', mood: '', checks: EVENING.map(t => item(t)), win: '', ok: '', drained: '', first: '' },
    intention: '', buddy: '', pomodoros: ''
  });
  const newWeek = () => ({
    classic: Object.fromEntries(DAYS.map(d => [d, { focus: '', notes: '' }])),
    hours: Object.fromEntries(DAYS.map(d => [d, {}])),
    boxes: Object.fromEntries(DAYS.map(d => [d, ''])), flow: '', wins: []
  });
  const list = (v, map) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(map);
  const txt = v => (v == null ? '' : String(v));
  function normDay(raw) {
    const d = newDay(), r = raw && typeof raw === 'object' ? raw : {};
    ['big', 'reward', 'intention', 'buddy', 'pomodoros'].forEach(k => { d[k] = txt(r[k]); });
    const ess = list(r.essentials, x => item(txt(x.text), x.done));
    d.essentials = ess.slice(0, 3).concat([item(), item(), item()]).slice(0, 3);
    BUCKETS.forEach(([k]) => { d.tasks[k] = list(r.tasks && r.tasks[k], x => item(txt(x.text), x.done)); });
    ['morning', 'evening'].forEach(k => {
      const src = r[k] && typeof r[k] === 'object' ? r[k] : {};
      ['energy', 'anxiety', 'mood', 'win', 'ok', 'drained', 'first'].forEach(f => { if (f in d[k]) d[k][f] = txt(src[f]); });
      if (Array.isArray(src.checks)) d[k].checks = list(src.checks, x => item(txt(x.text), x.done));
    });
    return d;
  }
  function normWeek(raw) {
    const w = newWeek(), r = raw && typeof raw === 'object' ? raw : {};
    DAYS.forEach(d => {
      const c = r.classic && r.classic[d] || {};
      w.classic[d] = { focus: txt(c.focus), notes: txt(c.notes) };
      w.boxes[d] = txt(r.boxes && r.boxes[d]);
      const h = r.hours && r.hours[d] || {};
      HOURS.forEach(t => { if (txt(h[t])) w.hours[d][t] = txt(h[t]); });
    });
    w.flow = txt(r.flow);
    w.wins = list(r.wins, x => ({ day: DAYS.includes(x.day) ? x.day : 'Mon', win: txt(x.win), helped: txt(x.helped) }));
    return w;
  }
  const EMPTY_DAY = JSON.stringify(newDay()), EMPTY_WEEK = JSON.stringify(newWeek());

  function normalize(s) {
    const days = {};
    Object.keys(s.days || {}).forEach(k => { if (D.parse(k)) { const d = normDay(s.days[k]); if (JSON.stringify(d) !== EMPTY_DAY) days[k] = d; } });
    const weeks = {};
    Object.keys(s.weeks || {}).forEach(k => { if (D.parse(k)) { const w = normWeek(s.weeks[k]); if (JSON.stringify(w) !== EMPTY_WEEK) weeks[D.monday(k)] = w; } });
    return Object.assign(s, {
      days, weeks,
      dump: list(s.dump, x => ({ text: txt(x.text), done: !!x.done, priority: PRIORITY.includes(x.priority) ? x.priority : 'Should', effort: BUCKET_NAME[x.effort] ? x.effort : 'quick', step: txt(x.step) })),
      habits: list(s.habits, x => ({ name: txt(x.name), days: x.days && typeof x.days === 'object' ? Object.fromEntries(Object.keys(x.days).filter(k => x.days[k] && D.parse(k)).map(k => [k, true])) : {} })),
      meds: list(s.meds, x => ({ taken: !!x.taken, date: txt(x.date), name: txt(x.name), time: txt(x.time), notes: txt(x.notes) })),
      notes: txt(s.notes),
      routines: list(s.routines, r => ({ id: txt(r.id) || P.uid(), name: txt(r.name), steps: list(r.steps, x => ({ id: txt(x.id) || P.uid(), text: txt(x.text), mins: txt(x.mins) })) })),
      rdone: Object.fromEntries(Object.keys(s.rdone || {}).filter(k => D.parse(k) && s.rdone[k] && typeof s.rdone[k] === 'object')
        .map(k => [k, Object.fromEntries(Object.keys(s.rdone[k]).filter(x => s.rdone[k][x]).map(x => [x, true]))])),
      log: list(s.log, x => ({ date: D.parse(x.date) ? x.date : D.today(), time: txt(x.time), mins: Math.max(1, Math.round(P.num(x.mins)) || 25), label: txt(x.label) })),
      weekMode: ['classic', 'hourly', 'boxes', 'flow'].includes(s.weekMode) ? s.weekMode : 'classic',
      hourDay: DAYS.includes(s.hourDay) ? s.hourDay : DAYS[(new Date().getDay() + 6) % 7]
    });
  }

  const step = (text, mins) => ({ id: P.uid(), text: text || '', mins: String(mins == null ? 5 : mins) });
  const routine = (name, steps) => ({ id: P.uid(), name: name || '', steps: steps || [] });
  function starterRoutines() {
    return [
      routine('Morning launch', [step('Meds + a glass of water', 2), step('Get dressed', 5), step('Breakfast', 10), step('Keys, phone, bag by the door', 3)]),
      routine('Evening wind-down', [step('Set out tomorrow’s clothes', 3), step('Phone on the charger, outside the bedroom', 1), step('Dishes into the sink', 5), step('Write tomorrow’s first step', 2)]),
      routine('10-minute reset', [step('Trash out', 2), step('Dishes away', 4), step('Clear one surface', 4)])
    ];
  }
  function blank() { return { days: {}, weeks: {}, dump: [], habits: [], meds: [], notes: '', routines: starterRoutines(), rdone: {}, log: [] }; }
  function sample() {
    const t = D.today(), mon = D.monday(t), days = {};
    for (let i = 1; i <= 4; i++) {
      const d = newDay();
      d.big = ['Finish the grocery order', 'Call the dentist', 'Clear the desk', 'Pay the electricity bill'][i - 1];
      d.essentials = [item('Take morning meds reminder', 1), item('Drink water before noon', 1), item(['One 25-minute focus block', 'Ten-minute tidy', 'Walk outside', 'Reply to one message'][i - 1], 1)];
      d.reward = 'Episode of my comfort show';
      days[D.add(t, -i)] = d;
    }
    const d = newDay();
    Object.assign(d, {
      big: 'Send the lease renewal email',
      essentials: [item('Take morning meds reminder', 1), item('Drink water before noon'), item('One 25-minute deep-work block')],
      reward: 'Iced latte from the good place',
      tasks: {
        quick: [item('Reply to Mia about Saturday'), item('Put laundry in the dryer', 1), item('Pay electricity bill')],
        deep: [item('Draft portfolio case study'), item('Lease email (30+ min)')],
        maybe: [item('Organize the downloads folder')]
      },
      intention: 'Start small, finish one thing', buddy: 'Focus mate on a call', pomodoros: '2'
    });
    d.morning = Object.assign(d.morning, { energy: '3', anxiety: '2', mood: 'Steady' });
    d.morning.checks[0].done = true; d.morning.checks[1].done = true;
    days[t] = d;
    const w = newWeek();
    const today = DAYS[(new Date().getDay() + 6) % 7];
    w.classic.Mon = { focus: 'Lease email', notes: 'Ten-minute start' };
    w.classic.Wed = { focus: 'Laundry + fold', notes: '' };
    w.classic.Fri = { focus: 'Desk clear', notes: 'Weekly win' };
    w.hours[today] = { '9:00': 'Draft lease reply', '10:00': 'Send + file it', '13:00': 'Walk + lunch', '15:00': 'Portfolio case study (45 min)' };
    w.boxes.Mon = 'Hard email before noon'; w.boxes.Fri = 'Desk clear + weekly win';
    w.flow = 'Parking lot for the week:\n• Call the bank about autopay\n• Book a haircut if energy allows\n• Return library books';
    w.wins = [{ day: 'Mon', win: 'Started the hard email', helped: 'Ten-minute timer' }, { day: 'Wed', win: 'Finished a laundry load', helped: 'Body doubling on a call' }];
    const back = n => Array.from({ length: n }, (_, i) => D.add(t, -i - 1));
    const on = dates => Object.fromEntries(dates.map(x => [x, true]));
    const routines = starterRoutines(), rdone = { [t]: {} };
    routines[0].steps.slice(0, 3).forEach(x => { rdone[t][x.id] = true; });
    rdone[D.add(t, -1)] = Object.fromEntries(routines[0].steps.concat(routines[1].steps).map(x => [x.id, true]));
    const log = [{ date: t, time: '09:10', mins: 10, label: 'Send the lease renewal email' }, { date: t, time: '09:25', mins: 25, label: 'Send the lease renewal email' },
      { date: D.add(t, -1), time: '14:00', mins: 25, label: 'Draft portfolio case study' }, { date: D.add(t, -1), time: '14:30', mins: 5, label: 'Break' }];
    return {
      routines, rdone, log,
      days, weeks: { [mon]: w },
      dump: [
        { text: 'Call the bank about autopay', done: false, priority: 'Must', effort: 'quick', step: 'Find the card number' },
        { text: 'Ask landlord about the balcony door', done: false, priority: 'Should', effort: 'quick', step: 'Take a photo of the latch' },
        { text: 'Birthday gift idea: film camera', done: false, priority: 'Could', effort: 'maybe', step: '' },
        { text: 'Return library books', done: true, priority: 'Should', effort: 'quick', step: 'Put them by the door' }
      ],
      habits: [
        { name: 'Take meds reminder', days: on(back(6).concat([t])) },
        { name: 'Ten-minute reset', days: on([back(6)[0], back(6)[1], back(6)[3], back(6)[5]]) },
        { name: 'Drink water before noon', days: on(back(3)) },
        { name: 'Lights out by 11', days: on([back(6)[1], back(6)[2]]) }
      ],
      meds: [
        { taken: true, date: t, name: 'Morning reminder', time: '08:00', notes: 'With breakfast' },
        { taken: true, date: D.add(t, -1), name: 'Morning reminder', time: '08:15', notes: '' },
        { taken: false, date: D.add(t, -2), name: 'Morning reminder', time: '', notes: 'Forgot — set a second alarm' }
      ],
      notes: 'Body doubling ideas (who or what helps me start):\n• Focus mate on a call\n• Library co-working hour\n• Quiet study-with-me video\n\nLow-energy wins that still count:\n• Five-minute tidy\n• Reply to one message'
    };
  }

  /* ---------- helpers ---------- */
  const sel = s => (D.parse(s.ui.date) ? s.ui.date : (s.ui.date = D.today()));
  const wk = s => (D.parse(s.ui.week) ? s.ui.week : (s.ui.week = D.monday(D.today())));
  function day(s, iso) { if (!s.days[iso]) s.days[iso] = newDay(); return s.days[iso]; }
  function week(s, mon) { if (!s.weeks[mon]) s.weeks[mon] = newWeek(); return s.weeks[mon]; }
  const complete = d => { const e = (d && d.essentials || []).filter(x => P.has(x.text)); return e.length > 0 && e.every(x => x.done); };
  function streak(s) {
    let iso = D.today(), n = 0;
    if (!complete(s.days[iso])) iso = D.add(iso, -1);
    while (complete(s.days[iso]) && n < 3660) { n++; iso = D.add(iso, -1); }
    return n;
  }
  function habitStreak(h) {
    let iso = D.today(), n = 0;
    if (!h.days[iso]) iso = D.add(iso, -1);
    while (h.days[iso] && n < 3660) { n++; iso = D.add(iso, -1); }
    return n;
  }
  const weekDates = mon => DAYS.map((_, i) => D.add(mon, i));
  const flame = n => `<span class="y-sticker fo-streak">${I('flame')}${n}-day streak</span>`;

  /* ---------- pages ---------- */
  function dateNav(iso) {
    const isToday = iso === D.today();
    return `<div class="fo-datenav" role="group" aria-label="Choose a day">
      ${u.iconBtn('prev', 'Previous day', 'day', { n: -1 }, { cls: 'fo-nav-btn' })}
      <label class="y-sr" for="foDate">Date</label><input class="y-input fo-date" id="foDate" type="date" data-bind="ui.date" data-rerender value="${esc(iso)}">
      ${u.iconBtn('next', 'Next day', 'day', { n: 1 }, { cls: 'fo-nav-btn' })}
      ${isToday ? '' : u.btn('Back to today', { sm: true, act: 'day', data: { n: 0 } })}</div>`;
  }
  function scale(bind, value, opts, label, hint) {
    return `<div class="fo-scale"><span class="y-label">${esc(label)}${hint ? ` <span class="pl-opt">${esc(hint)}</span>` : ''}</span>${u.seg(bind, value, opts, label)}</div>`;
  }

  const today = {
    id: 'today', label: 'Today', icon: 'focus',
    render(ctx) {
      const s = ctx.state, iso = sel(s), d = day(s, iso), b = `days.${iso}`;
      const bucket = BUCKET_NAME[s.ui.bucket] ? s.ui.bucket : 'quick';
      const isToday = iso === D.today();
      const openDump = s.dump.filter(x => !x.done);
      const leftover = BUCKETS.reduce((n, [k]) => n + d.tasks[k].filter(x => !x.done && P.has(x.text)).length, 0);
      return `
      ${u.head({ eyebrow: isToday ? 'Today' : D.rel(iso), title: esc(D.long(iso)), meta: `<span data-slot="streak"></span>${dateNav(iso)}<span class="fo-note">Everything else is optional.</span>` })}
      <div class="fo-grid">
        <section class="y-panel y-panel--world fo-big">
          <h2 class="y-kicker"><span class="y-kicker-num">1</span><label for="foBig">One big thing</label></h2>
          <textarea id="foBig" class="fo-bigthing y-textarea--auto" rows="1" data-bind="${b}.big" placeholder="What would make today a win?">${esc(d.big)}</textarea>
          <p class="y-hint">Protect this before smaller tasks.</p>
        </section>
        <section class="y-panel fo-ess">
          <h2 class="y-kicker"><span class="y-kicker-num">2</span>Three essentials</h2>
          ${u.checklist(`${b}.essentials`, d.essentials, { tools: false, ph: 'A must-do for today', itemLabel: i => `Essential ${i + 1}` })}
          <div class="fo-reward">
            ${u.field('Reward when they’re done', `${b}.reward`, d.reward, { ph: 'Something small and nice' })}
            <div data-slot="reward"></div>
          </div>
        </section>
        <section class="y-panel y-panel--soft fo-energy">
          <div class="y-panel-head"><h2 class="y-kicker"><span class="y-kicker-num">3</span>Match your energy</h2></div>
          <div data-slot="buckets"></div>
          ${u.checklist(`${b}.tasks.${bucket}`, d.tasks[bucket], {
            ph: 'Task', what: 'task', itemLabel: i => `${BUCKET_NAME[bucket]} task ${i + 1}`,
            extra: (it, i) => u.iconBtn('next', `Move “${it.text || 'task'}” to tomorrow`, 'carry', { i, bucket }, { cls: 'fo-carry' }),
            empty: bucket === 'deep' ? 'Nothing heavy planned. That’s allowed.' : 'Nothing here yet.'
          })}
          <div class="fo-add">${u.quickAdd(`${b}.tasks.${bucket}`, { ph: `Add to ${BUCKET_NAME[bucket].toLowerCase()}`, label: `Add a ${BUCKET_NAME[bucket].toLowerCase()} task`, tpl: 'task' })}</div>
        </section>
        <section class="y-panel fo-capture">
          <div class="y-panel-head"><h2 class="y-kicker"><span class="y-kicker-num">4</span>Brain dump</h2>
            ${s.dump.length ? u.btn(`Open brain dump${openDump.length ? ` (${openDump.length})` : ''}`, { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'dump' } }) : ''}</div>
          ${u.quickAdd('dump', { ph: 'Park a thought, deal with it later', label: 'Park a thought', at: 'top' })}
          ${openDump.length ? `<ul class="y-tags fo-tags">${openDump.slice(0, 8).map(x => `<li>${esc(x.text)}</li>`).join('')}</ul>` : ''}
        </section>
      </div>
      ${u.fold('Morning check-in', `
        <div class="fo-scales">${scale(`${b}.morning.energy`, d.morning.energy, SCALE, 'Energy', '1 depleted · 5 energized')}${scale(`${b}.morning.anxiety`, d.morning.anxiety, SCALE, 'Anxiety', '1 calm · 5 wired')}${scale(`${b}.morning.mood`, d.morning.mood, MOOD, 'Mood')}</div>
        <h3 class="fo-sub">Starter cues</h3>
        ${u.checklist(`${b}.morning.checks`, d.morning.checks, { ph: 'Cue', what: 'cue', add: 'Add cue', tpl: 'check' })}
        <div class="pl-fields fo-details">
          ${u.field('Today’s intention', `${b}.intention`, d.intention, { ph: 'Start small, finish one thing' })}
          ${u.field('Body double', `${b}.buddy`, d.buddy, { ph: 'Who or what helps you start?' })}
          ${u.field('Focus blocks done', `${b}.pomodoros`, d.pomodoros, { num: true, ph: '0' })}
        </div>`, { icon: 'star', key: 'morning', meta: d.morning.mood || d.morning.energy ? esc([d.morning.mood, d.morning.energy && 'energy ' + d.morning.energy].filter(Boolean).join(' · ')) : '' })}
      ${u.fold('Evening reflection', `
        <div class="fo-scales">${scale(`${b}.evening.energy`, d.evening.energy, SCALE, 'Energy', '1 depleted · 5 energized')}${scale(`${b}.evening.anxiety`, d.evening.anxiety, SCALE, 'Anxiety', '1 calm · 5 wired')}${scale(`${b}.evening.mood`, d.evening.mood, MOOD, 'Mood')}</div>
        <div class="pl-fields fo-details">
          ${u.field('One win from today', `${b}.evening.win`, d.evening.win, { ph: 'Even a tiny one counts' })}
          ${u.field('What went OK', `${b}.evening.ok`, d.evening.ok)}
          ${u.field('What drained me', `${b}.evening.drained`, d.evening.drained)}
          ${u.field('Tomorrow’s first step', `${b}.evening.first`, d.evening.first, { ph: 'Make it tiny' })}
        </div>
        <h3 class="fo-sub">Wind-down</h3>
        ${u.checklist(`${b}.evening.checks`, d.evening.checks, { ph: 'Cue', what: 'cue', add: 'Add cue', tpl: 'check' })}
        ${leftover ? `<div class="pl-row fo-carryall"><span class="pl-muted">${P.plural(leftover, 'open task')} left today.</span>${u.btn('Carry open tasks to tomorrow', { sm: true, icon: 'next', act: 'carryAll' })}</div>` : ''}`,
        { icon: 'sparkle', key: 'evening', meta: d.evening.win ? 'win logged' : '' })}`;
    },
    slots: {
      streak(ctx) { const n = streak(ctx.state); return n ? flame(n) : ''; },
      reward(ctx) {
        const d = day(ctx.state, sel(ctx.state));
        const named = d.essentials.filter(x => P.has(x.text));
        return u.reward({ done: named.filter(x => x.done).length, total: named.length || 3, text: d.reward, ph: 'Name a small reward above' });
      },
      buckets(ctx) {
        const s = ctx.state, d = day(s, sel(s)), cur = BUCKET_NAME[s.ui.bucket] ? s.ui.bucket : 'quick';
        return `<div class="y-seg pl-seg fo-buckets" role="group" aria-label="Task size">${BUCKETS.map(([k, label, sub]) => {
          const open = d.tasks[k].filter(x => !x.done && P.has(x.text)).length;
          return `<button type="button" data-act="set" data-bind="ui.bucket" data-value="${k}" aria-pressed="${k === cur}" class="${k === cur ? 'is-active' : ''}">${esc(label)}<span class="fo-bucket-sub">${esc(sub)}${open ? ` · ${open}` : ''}</span></button>`;
        }).join('')}</div>`;
      }
    },
    actions: {
      day(ctx, d) { const s = ctx.state; s.ui.date = +d.n === 0 ? D.today() : D.add(sel(s), +d.n); },
      carry(ctx, d) {
        const s = ctx.state, iso = sel(s), from = day(s, iso).tasks[d.bucket], it = from[+d.i];
        if (!it) return false;
        from.splice(+d.i, 1);
        day(s, D.add(iso, 1)).tasks[d.bucket].push(item(it.text));
        ctx.toast('Moved to tomorrow');
      },
      carryAll(ctx) {
        const s = ctx.state, iso = sel(s), src = day(s, iso), dst = day(s, D.add(iso, 1));
        let n = 0;
        BUCKETS.forEach(([k]) => { src.tasks[k] = src.tasks[k].filter(x => { if (!x.done && P.has(x.text)) { dst.tasks[k].push(item(x.text)); n++; return false; } return true; }); });
        ctx.toast(`${P.plural(n, 'task')} moved to tomorrow`);
      }
    }
  };

  const dump = {
    id: 'dump', label: 'Brain dump', icon: 'list',
    badge: ctx => { const n = ctx.state.dump.filter(x => !x.done && P.has(x.text)).length; return n || ''; },
    render(ctx) {
      const s = ctx.state, f = PRIORITY.includes(s.ui.dumpFilter) ? s.ui.dumpFilter : 'all';
      const rows = s.dump.map((r, i) => Object.assign({ __i: i }, r)).filter(r => (f === 'all' || r.priority === f) && !(s.ui.hideDone && r.done));
      const count = p => s.dump.filter(x => !x.done && (p === 'all' || x.priority === p)).length;
      return `
      ${u.head({ eyebrow: 'Brain dump', title: 'Get it out of your head', lede: 'Capture first, sort later. Tag what matters, pick one tiny next step, then send it to a day.' })}
      ${u.panel('', `${u.quickAdd('dump', { ph: 'Park a thought — press Enter', label: 'Park a thought', at: 'top', kind: 'world' })}`, { cls: 'fo-dump-add' })}
      ${u.panel('Everything parked', `
        <div class="pl-row fo-dump-tools">${u.chips('ui.dumpFilter', f, [['all', 'All', count('all')], ...PRIORITY.map(p => [p, p, count(p)])], 'Filter by priority')}<span class="pl-spacer"></span>${u.switch('ui.hideDone', s.ui.hideDone, 'Hide done')}</div>
        ${s.dump.length ? u.table('dump', rows, [
          { k: 'done', label: 'Done', type: 'check', w: '52px', rerender: true },
          { k: 'text', label: 'Thought or task', title: true, w: '1.6fr', ph: 'Thought or task' },
          { k: 'priority', label: 'Priority', type: 'select', options: PRIORITY, w: '112px' },
          { k: 'effort', label: 'Effort', type: 'select', options: EFFORT, w: '150px' },
          { k: 'step', label: 'Next tiny step', w: '1.2fr', ph: 'Smallest first move' },
          { label: 'Send', w: '124px', html: (r, i) => u.btn('To today', { sm: true, icon: 'next', act: 'toToday', data: { i }, cls: 'fo-send' }) }
        ], { index: r => r.__i, total: s.dump.length, what: 'thought', rowClass: r => r.done ? 'is-done' : '', cls: 'fo-dump', empty: 'Nothing matches this filter.' })
          : u.empty('list', 'Nothing parked yet', 'Type a thought above and press Enter. Getting it out of your head is the win.')}`, { icon: 'list' })}
      ${u.notes('notes', s.notes, { rows: 8, title: 'Notes', ph: 'Body-doubling ideas, low-energy wins that still count, things that aren’t today’s job…' })}`;
    },
    actions: {
      toToday(ctx, d) {
        const s = ctx.state, it = s.dump[+d.i];
        if (!it || !P.has(it.text)) return false;
        const iso = D.today();
        day(s, iso).tasks[it.effort].push(item(it.text + (P.has(it.step) ? ` — ${it.step}` : '')));
        s.dump.splice(+d.i, 1);
        ctx.toast(`Added to today · ${BUCKET_NAME[it.effort]}`);
      }
    }
  };

  function weekNav(s) {
    const mon = wk(s), isThis = mon === D.monday(D.today());
    return `<div class="fo-datenav" role="group" aria-label="Choose a week">
      ${u.iconBtn('prev', 'Previous week', 'week', { n: -7 }, { cls: 'fo-nav-btn' })}
      <span class="fo-weeklabel y-num">${esc(D.short(mon))} – ${esc(D.short(D.add(mon, 6)))}</span>
      ${u.iconBtn('next', 'Next week', 'week', { n: 7 }, { cls: 'fo-nav-btn' })}
      ${isThis ? '' : u.btn('This week', { sm: true, act: 'week', data: { n: 0 } })}</div>`;
  }
  const weekActions = { week(ctx, d) { const s = ctx.state; s.ui.week = +d.n === 0 ? D.monday(D.today()) : D.add(wk(s), +d.n); } };

  const weekPage = {
    id: 'week', label: 'Week', icon: 'calendar',
    render(ctx) {
      const s = ctx.state, mon = wk(s), w = week(s, mon), b = `weeks.${mon}`, dates = weekDates(mon), t = D.today();
      let body = '';
      if (s.weekMode === 'classic') {
        body = `<div class="fo-days">${DAYS.map((dn, i) => `<article class="fo-day${dates[i] === t ? ' is-today' : ''}">
          <h3>${dn} <span class="y-num">${esc(D.short(dates[i]))}</span></h3>
          ${u.input(`${b}.classic.${dn}.focus`, w.classic[dn].focus, { label: `${dn} focus`, ph: 'One focus', cls: 'fo-day-focus' })}
          ${u.textarea(`${b}.classic.${dn}.notes`, w.classic[dn].notes, { label: `${dn} notes`, ph: 'Notes', rows: 2 })}</article>`).join('')}</div>`;
      } else if (s.weekMode === 'hourly') {
        const dn = s.hourDay;
        body = `${u.seg('hourDay', dn, DAYS.map((x, i) => [x, `${x} ${D.parse(dates[i]).getDate()}`]), 'Day')}
          <div class="fo-hours">${HOURS.map(h => `<label class="fo-hour"><span class="y-num">${esc(D.time(h.padStart(5, '0')))}</span>${u.input(`${b}.hours.${dn}.${h}`, w.hours[dn][h], { label: `${dn} ${h}`, ph: '' })}</label>`).join('')}</div>`;
      } else if (s.weekMode === 'boxes') {
        body = `<div class="fo-boxes">${DAYS.map((dn, i) => `<label class="fo-box${dates[i] === t ? ' is-today' : ''}"><span class="fo-box-day">${dn} <span class="y-num">${D.parse(dates[i]).getDate()}</span></span>${u.textarea(`${b}.boxes.${dn}`, w.boxes[dn], { label: `${dn} box`, rows: 4, ph: 'Anything for this day' })}</label>`).join('')}</div>`;
      } else {
        body = u.textarea(`${b}.flow`, w.flow, { label: 'Flow dump for the week', rows: 12, ph: 'No structure. Just the week, as it comes.', cls: 'fo-flow' });
      }
      return `
      ${u.head({ eyebrow: 'This week', title: 'Plan loosely', lede: 'Pick the layout that feels lightest this week. Three wins still beat a perfect week.', meta: weekNav(s) })}
      ${u.panel('Week plan', `<div class="fo-modes">${u.seg('weekMode', s.weekMode, [['classic', 'Classic'], ['hourly', 'Hourly'], ['boxes', 'Boxes'], ['flow', 'Flow dump']], 'Week layout')}</div>${body}`, { icon: 'calendar' })}
      ${u.panel('Weekly wins', u.table(`${b}.wins`, w.wins, [
        { k: 'day', label: 'Day', type: 'select', options: DAYS, w: '100px' },
        { k: 'win', label: 'One win', title: true, ph: 'What went right' },
        { k: 'helped', label: 'What helped', ph: 'Timer, music, a friend…' }
      ], { add: 'Add a win', tpl: 'win', what: 'win', empty: 'Add one while you remember what helped.' }), { icon: 'star' })}`;
    },
    actions: weekActions
  };

  const hEnd = s => (D.parse(s.ui.habitEnd) && s.ui.habitEnd <= D.today() ? s.ui.habitEnd : (s.ui.habitEnd = D.today()));
  function habitNav(s) {
    const end = hEnd(s), isNow = end === D.today();
    return `<div class="fo-datenav" role="group" aria-label="Choose days">
      ${u.iconBtn('prev', 'Earlier 7 days', 'hdays', { n: -7 }, { cls: 'fo-nav-btn' })}
      <span class="fo-weeklabel y-num">${isNow ? 'Last 7 days' : `${esc(D.short(D.add(end, -6)))} – ${esc(D.short(end))}`}</span>
      ${u.iconBtn('next', 'Later 7 days', 'hdays', { n: 7 }, { cls: 'fo-nav-btn', disabled: isNow })}
      ${isNow ? '' : u.btn('Back to today', { sm: true, act: 'hdays', data: { n: 0 } })}</div>`;
  }
  const habits = {
    id: 'habits', label: 'Habits', icon: 'flame',
    render(ctx) {
      const s = ctx.state, end = hEnd(s), dates = Array.from({ length: 7 }, (_, i) => D.add(end, i - 6)), t = D.today();
      const checks = s.habits.reduce((n, h) => n + dates.filter(x => h.days[x]).length, 0);
      const best = s.habits.reduce((m, h) => Math.max(m, habitStreak(h)), 0);
      const grid = s.habits.length ? `<div class="fo-habits" role="table" aria-label="Habits this week">
        <div class="fo-hrow fo-hhead" role="row"><span role="columnheader">Habit</span>${dates.map((x, i) => `<span role="columnheader" class="${x === t ? 'is-today' : ''}">${esc(D.day(x))}<b class="y-num">${D.parse(x).getDate()}</b></span>`).join('')}<span role="columnheader">Streak</span><span role="columnheader"><span class="y-sr">Actions</span></span></div>
        ${s.habits.map((h, i) => `<div class="fo-hrow" role="row">
          <span role="cell" class="fo-hname">${u.input(`habits.${i}.name`, h.name, { label: `Habit ${i + 1}`, ph: 'Habit', cls: 'pl-ci-input' })}</span>
          ${dates.map((x, j) => `<span role="cell" class="fo-hcell${x === t ? ' is-today' : ''}">${u.tick(`habits.${i}.days.${x}`, !!h.days[x], `${h.name || 'Habit'} on ${D.day(x)} ${D.short(x)}`, { rerender: true })}</span>`).join('')}
          <span role="cell" class="fo-hstreak y-num">${habitStreak(h) ? `${I('flame', { size: 'sm' })}${habitStreak(h)}` : '<span class="pl-muted">—</span>'}</span>
          <span role="cell">${u.rowTools('habits', i, s.habits.length, { move: true, what: 'habit', label: h.name })}</span></div>`).join('')}</div>`
        : u.empty('flame', 'No habits yet', 'Add one or two small ones. Tiny habits you actually tick beat ambitious ones you don’t.');
      return `
      ${u.head({ eyebrow: 'Habits', title: 'Small things, most days', lede: 'Tick what already happened. Missed days are normal — weekends count too.', meta: habitNav(s) })}
      ${s.habits.length ? u.kpis([['Habits', s.habits.length], ['Ticks in these 7 days', checks, 'y-kpi--world'], ['Best streak now', best ? `${best} ${best === 1 ? 'day' : 'days'}` : '—', 'y-kpi--accent']]) : ''}
      ${u.panel('Habit board', `${grid}<div class="fo-add">${u.quickAdd('habits', { ph: 'Add a habit, e.g. “Ten-minute tidy”', key: 'name', label: 'Add a habit' })}</div>`, { icon: 'check' })}`;
    },
    actions: { hdays(ctx, d) { const s = ctx.state; s.ui.habitEnd = +d.n === 0 ? D.today() : D.add(hEnd(s), +d.n); if (s.ui.habitEnd > D.today()) s.ui.habitEnd = D.today(); } }
  };

  const meds = {
    id: 'meds', label: 'Meds', icon: 'lock',
    render(ctx) {
      const s = ctx.state, t = D.today();
      const takenToday = s.meds.some(m => m.date === t && m.taken);
      return `
      ${u.head({ eyebrow: 'Optional', title: 'Meds & reminders log', lede: 'A private place to note reminders you already use. Follow your clinician’s directions — this page gives no medical advice.' })}
      ${u.panel('Log', `
        <div class="pl-row fo-medbar">${takenToday ? u.pill('Logged today', 'good') : ''}<span class="pl-spacer"></span>${u.btn('Log today', { kind: 'world', icon: 'plus', act: 'logToday' })}</div>
        ${u.table('meds', s.meds, [
          { k: 'taken', label: 'Taken', type: 'check', w: '64px' },
          { k: 'date', label: 'Date', type: 'date', w: '160px' },
          { k: 'name', label: 'Medication or reminder', title: true, ph: 'Name' },
          { k: 'time', label: 'Time', type: 'time', w: '130px' },
          { k: 'notes', label: 'Notes', ph: 'Optional' }
        ], { what: 'entry', empty: 'No entries yet. “Log today” adds a row for today.' })}`, { icon: 'calendar' })}`;
    },
    actions: {
      logToday(ctx) {
        const s = ctx.state, last = s.meds.find(m => P.has(m.name));
        s.meds.unshift({ taken: true, date: D.today(), name: last ? last.name : '', time: new Date().toTimeString().slice(0, 5), notes: '' });
        ctx.focus('[data-bind="meds.0.name"]');
      }
    }
  };


  /* ---------- focus timer ---------- */
  function openTasks(s) {
    const d = day(s, D.today());
    return [d.big].concat(BUCKETS.flatMap(([k]) => d.tasks[k].filter(x => !x.done).map(x => x.text))).filter(P.has);
  }
  const focusLabel = s => (P.has(s.ui.focusOn) ? s.ui.focusOn : openTasks(s)[0] || 'Focus block');
  const focus = {
    id: 'focus', label: 'Focus', icon: 'timer',
    render(ctx) {
      const s = ctx.state, open = openTasks(s);
      return `${u.head({ eyebrow: 'Focus', title: 'Start small. <em>Start now.</em>', lede: 'Pick one thing, start a block and stop when it rings. Ten minutes counts — starting is the hard part.' })}
      <div class="ad-focus">
        <section class="y-panel y-panel--world ad-on">
          <h2 class="y-kicker"><label for="adOn">Working on</label></h2>
          ${u.input('ui.focusOn', P.has(s.ui.focusOn) ? s.ui.focusOn : '', { id: 'adOn', ph: open[0] || 'One thing', list: 'adOpen', cls: 'y-input--big' })}
          <datalist id="adOpen">${open.map(x => `<option value="${esc(x)}">`).join('')}</datalist>
          <div class="ad-blocks">${BLOCKS.map(([m, l, sub]) => `<button type="button" class="ad-block${m === 5 ? ' is-break' : ''}" data-act="startBlock" data-m="${m}"><b class="y-num">${m}</b><span>${esc(l)}<small>${esc(sub)}</small></span></button>`).join('')}</div>
        </section>
        ${u.timer({ idle: 'Pick a block to start', cls: 'ad-timer' })}
      </div>
      ${u.panel('Today’s focus', '<div data-slot="log"></div>', { icon: 'chart', hint: 'Finished blocks log themselves and count toward today’s focus blocks.' })}`;
    },
    slots: {
      log(ctx) {
        const s = ctx.state, t = D.today(), mine = s.log.filter(x => x.date === t), work = mine.filter(x => x.label !== 'Break');
        const week = s.log.filter(x => x.date >= D.monday(t) && x.label !== 'Break');
        return `${u.kpis([['Blocks today', work.length, 'y-kpi--world'], ['Minutes today', work.reduce((a, x) => a + x.mins, 0)], ['Minutes this week', week.reduce((a, x) => a + x.mins, 0), 'y-kpi--accent']])}
          ${mine.length ? `<ul class="ad-log">${mine.map(x => `<li><span class="y-num">${esc(D.time(x.time))}</span><b>${esc(x.label)}</b><span class="y-num">${x.mins} min</span></li>`).join('')}</ul>`
            : u.empty('timer', 'No blocks yet today', 'Start with “Just start” — 10 minutes, then decide if you keep going.')}`;
      }
    },
    actions: {
      startBlock(ctx, d) { const s = ctx.state, m = +d.m; ctx.timer.start(m * 60, m === 5 ? 'Break' : focusLabel(s), `focus:${m}`); return false; }
    }
  };

  /* ---------- routines ---------- */
  const smins = x => Math.max(1, Math.min(120, Math.round(P.num(x.mins)) || 5));
  const rToday = s => s.rdone[D.today()] || {};
  const routines = {
    id: 'routines', label: 'Routines', icon: 'check',
    badge: ctx => { const dn = rToday(ctx.state), left = ctx.state.routines.reduce((n, r) => n + r.steps.filter(x => P.has(x.text) && !dn[x.id]).length, 0); return left || ''; },
    render(ctx) {
      const s = ctx.state, t = D.today(), dn = rToday(s);
      const cards = s.routines.map((r, i) => {
        const steps = r.steps.filter(x => P.has(x.text)), done = steps.filter(x => dn[x.id]).length, total = steps.reduce((a, x) => a + smins(x), 0);
        return `<section class="y-panel ad-routine${steps.length && done === steps.length ? ' is-done' : ''}">
          <div class="y-panel-head"><h2 class="y-kicker">${esc(r.name || `Routine ${i + 1}`)}</h2><span class="pl-muted y-num">${done}/${steps.length} · ${total} min</span></div>
          ${u.meter(steps.length ? done / steps.length * 100 : 0, `${r.name || 'Routine'} progress`)}
          ${steps.length ? `<ul class="pl-checklist ad-steps">${steps.map(x => `<li class="pl-ci${dn[x.id] ? ' is-done' : ''}">
            ${u.tick(`rdone.${t}.${x.id}`, !!dn[x.id], `Done: ${x.text}`, { rerender: true })}
            <div class="pl-ci-main"><span class="pl-ci-text">${esc(x.text)}</span>${dn[x.id] ? `<span class="pl-ci-meta">${smins(x)} min</span>` : ''}</div>
            ${dn[x.id] ? '' : u.btn(`${smins(x)} min`, { sm: true, icon: 'timer', act: 'timer-start', data: { secs: smins(x) * 60, label: x.text, ref: `step:${x.id}` }, cls: 'ad-go' })}</li>`).join('')}</ul>`
            : u.empty('check', 'No steps yet', 'Add steps under “Edit routines” below.')}</section>`;
      }).join('');
      return `${u.head({ eyebrow: 'Routines', title: 'Same steps, <em>less thinking</em>', lede: 'Tick steps as you go — ticks are for today only, the routine stays. Tap a step’s timer if you lose track of time.' })}
      <div class="ad-rtop">${u.timer({ idle: 'Tap a step’s timer', cls: 'ad-timer ad-timer--sm' })}</div>
      <div class="ad-routines">${cards || u.empty('check', 'No routines yet', 'Add one below — morning, evening or a 10-minute reset.')}</div>
      ${u.fold('Edit routines', u.records('routines', s.routines, {
        what: 'Routine', titlePh: 'Routine name', move: true, cls: 'ad-redit',
        sub: r => `${P.plural(r.steps.filter(x => P.has(x.text)).length, 'step')} · ${r.steps.reduce((a, x) => a + (P.has(x.text) ? smins(x) : 0), 0)} min`,
        foot: (r, i) => u.table(`routines.${i}.steps`, r.steps, [{ k: 'text', label: 'Step', title: true, ph: 'Short step' }, { k: 'mins', label: 'Min', num: true, w: '64px', ph: '5' }], { add: 'Add step', what: 'step', tpl: 'step', move: true, empty: 'No steps yet.' }),
        add: 'Add routine', tpl: 'routine'
      }), { icon: 'edit', key: 'redit' })}`;
    }
  };

  /* a finished focus block or routine step logs itself */
  function finished(ctx) {
    const s = ctx.state, t = ctx.timer.state, ref = t.ref || '';
    if (t.running || t.left > 0 || !t.total || !/^(focus|step):/.test(ref)) return;
    t.ref = '';
    const [kind, v] = ref.split(':');
    if (kind === 'focus') {
      s.log.unshift({ date: D.today(), time: new Date().toTimeString().slice(0, 5), mins: Math.round(t.total / 60), label: t.label || 'Focus block' });
      if (t.label !== 'Break') { const d = day(s, D.today()); d.pomodoros = String((Math.round(P.num(d.pomodoros)) || 0) + 1); }
    } else {
      s.rdone[D.today()] = Object.assign({}, s.rdone[D.today()], { [v]: true });
    }
    ctx.save(); ctx.render();
  }

  P.create({
    slug: 'adhd-planner-app', name: 'ADHD Planner', world: 'focus',
    welcome: 'Start with one big thing for today.',
    pages: [today, dump, focus, routines, weekPage, habits, meds],
    blank, sample, normalize,
    timer: { doneText: 'Time’s up — nice work', onTick(ctx) { finished(ctx); } },
    open(ctx) { ctx.state.ui.date = D.today(); ctx.state.ui.week = D.monday(D.today()); ctx.state.ui.habitEnd = D.today(); },
    rows: {
      task: () => item(), check: () => item(), dump: () => ({ text: '', done: false, priority: 'Should', effort: 'quick', step: '' }),
      win: () => ({ day: DAYS[(new Date().getDay() + 6) % 7], win: '', helped: '' }),
      habits: () => ({ name: '', days: {} }),
      meds: () => ({ taken: false, date: D.today(), name: '', time: '', notes: '' }),
      routine: () => routine('', [step('', 5)]), step: () => step('', 5)
    },
    about: '<p><b>ADHD Planner</b> is a gentle all-in-one planner built around how ADHD brains actually start: one big thing, three essentials with a reward, tasks sorted by the energy they take, a brain dump, a focus timer that logs your blocks, routines with step timers, a loose week plan, habits and a private meds log. Each date keeps its own page; move unfinished tasks to tomorrow with one tap.</p>',
    disclaimer: 'ADHD Planner is a personal planning tool. It is not medical advice, diagnosis or treatment. The meds page is only a private log of reminders you already use.'
  });
})();
