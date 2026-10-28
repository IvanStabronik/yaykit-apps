/* Habit Tracker App — habit board with streaks and the 12-week view, from Habit Streaks. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const txt = v => (v == null ? '' : String(v));
  const habit = (name, why) => ({ id: P.uid(), name: name || '', why: why || '', days: {} });

  function blank() { return { title: '', habits: [], notes: '' }; }
  function sample() {
    const t = D.today();
    const pat = (n, fn) => { const o = {}; for (let i = 0; i < n; i++) if (fn(i)) o[D.add(t, -i)] = true; return o; };
    const h = (name, why, days) => Object.assign(habit(name, why), { days });
    return {
      title: 'Autumn reset',
      habits: [
        h('Drink water before noon', 'Fewer 3 pm crashes', pat(80, i => i < 9 || (i > 10 && i % 3 !== 0))),
        h('Move 20 minutes', 'Walk counts', pat(80, i => i > 0 && i < 6 || (i > 8 && i % 2 === 0))),
        h('Stretch', '', pat(80, i => i % 4 !== 1 && i < 40)),
        h('Read 10 pages', 'Phone away first', pat(80, i => i < 5 || (i > 12 && i < 30))),
        h('Lights out by 11', '', pat(80, i => i > 0 && i % 3 === 0))
      ],
      notes: 'Rules: two-day rule — never skip twice in a row.\n\nIf a habit keeps failing, make it smaller before dropping it.'
    };
  }
  function normalize(s) {
    s.title = txt(s.title); s.notes = txt(s.notes);
    s.habits = (Array.isArray(s.habits) ? s.habits : []).filter(x => x && typeof x === 'object').map(x => ({
      id: txt(x.id) || P.uid(), name: txt(x.name), why: txt(x.why),
      days: x.days && typeof x.days === 'object' ? Object.fromEntries(Object.keys(x.days).filter(k => x.days[k] && D.parse(k)).map(k => [k, true])) : {}
    }));
    if (![7, 30].includes(+s.ui.span)) s.ui.span = 7;
    return s;
  }

  function streak(h) { let d = D.today(), n = 0; if (!h.days[d]) d = D.add(d, -1); while (h.days[d] && n < 4000) { n++; d = D.add(d, -1); } return n; }
  function best(h) {
    const ds = Object.keys(h.days).sort(); let b = 0, run = 0, prev = null;
    ds.forEach(d => { run = prev && D.diff(prev, d) === 1 ? run + 1 : 1; b = Math.max(b, run); prev = d; });
    return b;
  }
  const rate = (h, n) => { let c = 0; for (let i = 0; i < n; i++) if (h.days[D.add(D.today(), -i)]) c++; return Math.round(c / n * 100); };

  const board = {
    id: 'board', label: 'Board', icon: 'flame',
    render(ctx) {
      const s = ctx.state, span = +s.ui.span, t = D.today();
      const dates = Array.from({ length: span }, (_, i) => D.add(t, i - span + 1));
      const ticks = s.habits.reduce((a, h) => a + dates.filter(d => h.days[d]).length, 0);
      const possible = s.habits.length * span;
      const top = s.habits.reduce((m, h) => Math.max(m, streak(h)), 0);
      const doneToday = s.habits.filter(h => h.days[t]).length;
      return `
      <header class="y-page-head pl-head hs-head">
        <p class="y-eyebrow">Habit board</p>
        <label class="y-sr" for="hsTitle">Board name</label>
        <input id="hsTitle" class="hs-title" data-bind="title" value="${esc(s.title)}" placeholder="Name this board" autocomplete="off">
        <div class="y-head-meta">${top ? `<span class="y-sticker">${I('flame')}${top}-day top streak</span>` : ''}<span>${s.habits.length ? `${doneToday} of ${s.habits.length} done today` : 'Small things, most days.'}</span></div>
      </header>
      ${s.habits.length ? u.kpis([['Habits', String(s.habits.length)], [`Ticks · last ${span} days`, `${ticks}<small class="hs-of">/${possible}</small>`, 'y-kpi--world'], ['Hit rate', possible ? Math.round(ticks / possible * 100) + '%' : '—', 'y-kpi--accent'], ['Top streak', top ? `${top} ${top === 1 ? 'day' : 'days'}` : '—']]) : ''}
      ${u.panel('Tick what already happened', `
        <div class="pl-row hs-tools">${u.seg('ui.span', String(span), [['7', '7 days'], ['30', '30 days']], 'Window')}<span class="pl-spacer"></span><span class="pl-hint">Missing a day is normal. Never missing twice is the trick.</span></div>
        ${s.habits.length ? `<div class="hs-scroll"><div class="hs-grid hs-grid--${span}" role="table" aria-label="Habit ticks" style="--n:${span}">
          <div class="hs-row hs-hrow" role="row"><span role="columnheader">Habit</span>${dates.map(d => `<span role="columnheader" class="${d === t ? 'is-today' : ''}">${span === 7 ? esc(D.day(d)) : ''}<b class="y-num">${D.parse(d).getDate()}</b></span>`).join('')}<span role="columnheader">Streak</span></div>
          ${s.habits.map((h, i) => `<div class="hs-row" role="row">
            <span role="cell" class="hs-name"><b>${esc(h.name || 'Untitled habit')}</b>${h.why ? `<small>${esc(h.why)}</small>` : ''}</span>
            ${dates.map(d => `<span role="cell" class="hs-cell${d === t ? ' is-today' : ''}">${u.tick(`habits.${i}.days.${d}`, !!h.days[d], `${h.name || 'Habit'} on ${D.full(d)}`, { rerender: true })}</span>`).join('')}
            <span role="cell" class="hs-streak y-num">${streak(h) ? `${I('flame', { size: 'sm' })}${streak(h)}` : '—'}<small>best ${best(h)}</small></span></div>`).join('')}
        </div></div>` : u.empty('flame', 'No habits yet', 'Start with one or two tiny ones — “drink water before noon” is a perfectly good habit.')}
        <div class="hs-add">${u.quickAdd('habits', { key: 'name', ph: 'Add a habit', label: 'Add a habit', kind: 'world' })}</div>`, { icon: 'check' })}`;
    }
  };

  const progress = {
    id: 'progress', label: 'Progress', icon: 'chart',
    render(ctx) {
      const s = ctx.state, t = D.today(), end = D.add(D.monday(t), 6);
      const weeks = 12, start = D.add(end, -weeks * 7 + 1);
      const heat = h => `<div class="hs-heat" role="img" aria-label="${esc(h.name || 'Habit')}: last 12 weeks">${Array.from({ length: weeks }, (_, w) => `<span class="hs-heat-col">${Array.from({ length: 7 }, (_, d) => { const iso = D.add(start, w * 7 + d); return `<i class="${iso > t ? 'is-future' : h.days[iso] ? 'is-on' : ''}${iso === t ? ' is-today' : ''}" title="${esc(D.full(iso))}"></i>`; }).join('')}</span>`).join('')}</div>`;
      return `
      ${u.head({ eyebrow: 'Progress', title: 'The long view', lede: 'Twelve weeks at a glance. Gaps are information, not failure.' })}
      ${s.habits.length ? '' : u.empty('chart', 'Nothing to show yet', 'Add habits on the Board first.', u.btn('Go to the board', { kind: 'world', act: 'go', data: { page: 'board' } }))}
      <div class="hs-cards">${s.habits.map((h, i) => `
        <article class="pl-rec hs-card">
          <header class="pl-rec-head"><div class="pl-rec-title">${u.input(`habits.${i}.name`, h.name, { label: `Habit ${i + 1} name`, ph: 'Habit', cls: 'pl-title-input' })}</div>${u.rowTools('habits', i, s.habits.length, { move: true, what: 'habit', label: h.name })}</header>
          ${u.field('Why it matters', `habits.${i}.why`, h.why, { ph: 'Optional — one line' })}
          <dl class="hs-stats"><div><dt>Streak</dt><dd class="y-num">${streak(h)}</dd></div><div><dt>Best</dt><dd class="y-num">${best(h)}</dd></div><div><dt>Last 30 days</dt><dd class="y-num">${rate(h, 30)}%</dd></div></dl>
          ${heat(h)}
        </article>`).join('')}</div>`;
    }
  };

  const notes = {
    id: 'notes', label: 'Notes', icon: 'edit',
    render(ctx) { return `${u.head({ eyebrow: 'Rules & reminders', title: 'Notes', lede: 'Your rules, rewards and what to try when a habit keeps slipping.' })}${u.notes('notes', ctx.state.notes, { rows: 12 })}`; }
  };

  window.HTHabits = { pages: { board, progress }, blank, sample, normalize, streak, best, rate, rows: { habits: () => habit('') } };
})();
