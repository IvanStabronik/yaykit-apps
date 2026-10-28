/* Habit Tracker App — today's habits and a daily check-in, the habit board with streaks, the long view, and a reading log.
   Yaykit planner engine, focus world. The board and progress come from Habit Streaks (habits.js), reading from Reading Log (reading.js);
   the Today page and the daily check-in (mood, sleep, water, one good thing) are new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon, H = window.HTHabits, R = window.HTReading;
  const MOODS = [['1', 'Rough'], ['2', 'Low'], ['3', 'OK'], ['4', 'Good'], ['5', 'Great']];
  const MOOD = Object.fromEntries(MOODS);
  const txt = v => (v == null ? '' : String(v));
  const day = (s, d) => s.days[d] || {};

  function blank() { return Object.assign(R.blank(), H.blank(), { days: {}, notes: '' }); }
  function normalize(s) {
    H.normalize(s); R.normalize(s);
    const days = s.days && typeof s.days === 'object' ? s.days : {};
    s.days = Object.fromEntries(Object.keys(days).filter(k => D.parse(k) && days[k] && typeof days[k] === 'object').map(k => {
      const x = days[k];
      return [k, { mood: MOOD[x.mood] ? String(x.mood) : '', sleep: txt(x.sleep), water: String(Math.max(0, Math.min(20, Math.round(P.num(x.water)) || 0))), good: txt(x.good) }];
    }));
    return s;
  }
  function sample() {
    const r = R.sample(), h = H.sample(), t = D.today(), days = {};
    const mood = [4, 3, 4, 5, 3, 2, 4, 4, 3, 5, 4, 3, 3, 4, 2, 3, 4, 4, 5, 4, 3, 4, 3, 3, 4, 5, 4, 3, 4, 4];
    const good = ['Long walk at lunch', 'Finished the chapter', 'Called Mom', 'Slept in', '', 'Tough day — still stretched', 'Cooked a real dinner'];
    mood.forEach((m, i) => { if (i === 0) return; days[D.add(t, -i)] = { mood: String(m), sleep: String([7, 6.5, 7.5, 8, 6, 5.5, 7][i % 7]), water: String([6, 5, 7, 8, 4, 3, 6][i % 7]), good: good[i % 7] }; });
    days[t] = { mood: '4', sleep: '7', water: '3', good: '' };
    return Object.assign(r, h, { days, notes: [h.notes, r.notes].filter(Boolean).join('\n\n') });
  }

  /* ---------- today ---------- */
  const today = {
    id: 'today', label: 'Today', icon: 'star',
    render(ctx) {
      const s = ctx.state, t = D.today(), d = day(s, t), b = `days.${t}`;
      const reading = s.books.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.status === 'reading' && P.has(x.title));
      return `${u.head({ eyebrow: D.long(t), title: '<span data-slot="title"></span>', lede: 'Tick what already happened, then a ten-second check-in. Small things, most days.' })}
      <div class="pl-grid">
        ${u.panel('Habits today', s.habits.length ? `<ul class="ht-today">${s.habits.map((h, i) => `<li>${u.check(`habits.${i}.days.${t}`, !!h.days[t], esc(h.name || 'Untitled habit'), { rerender: true, meta: H.streak(h) ? `${I('flame')} ${H.streak(h)}-day streak` : (h.why ? esc(h.why) : 'start a streak today') })}</li>`).join('')}</ul>`
          : u.empty('flame', 'No habits yet', 'Add one tiny habit to start.', u.btn('Add a habit', { kind: 'world', icon: 'plus', act: 'go', data: { page: 'board' } })), { icon: 'check', cls: 'pl-7' })}
        ${u.panel('Check-in', `<div class="pl-stack">
          <div class="y-field"><span class="y-label">Mood</span>${u.seg(`${b}.mood`, d.mood || '', MOODS, 'Mood')}</div>
          <div class="pl-fields">${u.field('Sleep (hours)', `${b}.sleep`, d.sleep || '', { num: true, ph: '7.5' })}
            <div class="y-field"><span class="y-label">Water (glasses)</span><div class="ht-water">${u.iconBtn('minus', 'One glass less', 'water', { n: -1 })}<b class="y-num">${Math.round(P.num(d.water)) || 0}</b>${u.iconBtn('plus', 'One more glass', 'water', { n: 1 })}</div></div></div>
          ${u.field('One good thing', `${b}.good`, d.good || '', { ph: 'Even a small one' })}</div>`, { icon: 'heart', cls: 'pl-5' })}
      </div>
      ${reading.length ? u.panel('Reading now', `<div class="ht-books">${reading.map(x => `<div class="ht-book"><b>${esc(x.title)}</b><span class="pl-muted">${esc(x.author)}</span>${u.meter(R.pct(x), `${x.title} progress`)}<span class="pl-muted y-num">${esc(x.progress || 0)} / ${esc(x.pages || '?')} pages</span></div>`).join('')}</div>`, { icon: 'star', actions: u.btn('Reading', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'shelf' } }) }) : ''}
      ${u.notes('notes', s.notes, { rows: 4, title: 'Notes', ph: 'Your rules, rewards, what to try when a habit slips…' })}`;
    },
    slots: {
      title(ctx) {
        const s = ctx.state, t = D.today(), n = s.habits.filter(h => h.days[t]).length;
        if (!s.habits.length) return 'Small things, <em>most days</em>';
        return n === s.habits.length ? 'All done <em>today</em>' : `<em>${n}</em> of ${s.habits.length} habits today`;
      }
    },
    actions: {
      water(ctx, d) { const s = ctx.state, t = D.today(); s.days[t] = Object.assign({ mood: '', sleep: '', water: '0', good: '' }, s.days[t]); s.days[t].water = String(Math.max(0, Math.min(20, (Math.round(P.num(s.days[t].water)) || 0) + +d.n))); }
    }
  };

  /* the long view also shows the last 30 check-ins */
  const progress = H.pages.progress, progressRender = progress.render;
  progress.render = ctx => {
    const s = ctx.state, t = D.today(), last = Array.from({ length: 30 }, (_, i) => D.add(t, i - 29));
    const moods = last.map(d => P.num(day(s, d).mood)).filter(Boolean), sleep = Array.from({ length: 7 }, (_, i) => P.num(day(s, D.add(t, -i)).sleep)).filter(Boolean);
    const avg = l => (l.length ? l.reduce((a, x) => a + x, 0) / l.length : 0);
    const panel = u.panel('Check-ins, last 30 days', `<div class="ht-moods" role="img" aria-label="Mood for the last 30 days">${last.map(d => `<i class="ht-m${esc(day(s, d).mood || '0')}${d === t ? ' is-today' : ''}" title="${esc(D.full(d))}: ${esc(MOOD[day(s, d).mood] || 'no check-in')}"></i>`).join('')}</div>
      <p class="ht-key">${MOODS.map(([v, l]) => `<span><i class="ht-m${v}"></i>${l}</span>`).join('')}</p>
      ${u.kpis([['Average mood', moods.length ? MOOD[String(Math.round(avg(moods)))] : '—', 'y-kpi--world', `${moods.length} check-ins`], ['Sleep, last 7 days', sleep.length ? `${Math.round(avg(sleep) * 10) / 10} h` : '—', '', 'average a night']])}`, { icon: 'heart' });
    return progressRender(ctx).replace(/(<div class="hs-cards">)/, panel + '$1');
  };
  Object.assign(H.pages.board, { label: 'Habits' });
  Object.assign(R.pages.shelf, { label: 'Reading' });

  P.create({
    slug: 'habit-tracker-app',
    name: 'Habit Tracker',
    world: 'focus',
    welcome: 'Add one or two small habits and tick them as they happen.',
    pages: [today, H.pages.board, progress, R.pages.shelf, R.pages.library, R.pages.stats],
    blank, sample, normalize,
    rows: Object.assign({}, H.rows, R.rows),
    about: '<p><b>Habit Tracker</b> keeps small daily things in one place: tick today’s habits and watch streaks grow, a ten-second check-in (mood, sleep, water, one good thing), twelve weeks at a glance, and a reading log with a yearly goal, ratings and a year in books. Nothing punishes a missed day.</p>',
    disclaimer: 'Habit Tracker is a personal tracker, not medical, therapy or treatment advice. Streaks and check-ins are for your own motivation only.'
  });
})();
