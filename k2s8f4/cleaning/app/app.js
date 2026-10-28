/* Cleaning Schedule App — a cleaning schedule that knows what's due, a quick daily reset with a timer, and the zones.
   Yaykit planner engine, fresh world. Today and zones come from Clean Loop (clean.js); the schedule (repeating chores with a
   next-due date, done in one tap) is new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, C = window.CSClean;
  const EVERY = [['1d', 'Every day'], ['2d', 'Every 2 days'], ['3d', 'Twice a week'], ['1w', 'Every week'], ['2w', 'Every 2 weeks'], ['1m', 'Every month'], ['3m', 'Every 3 months'], ['6m', 'Twice a year'], ['12m', 'Once a year']];
  const EV = Object.fromEntries(EVERY);
  const txt = v => (v == null ? '' : String(v));
  const chore = o => Object.assign({ id: P.uid(), text: '', room: '', every: '1w', last: '', who: '', mins: '' }, o || {});

  function next(c) {
    if (!D.parse(c.last)) return D.today();
    const n = parseInt(c.every, 10), unit = c.every.slice(-1);
    if (unit === 'd') return D.add(c.last, n);
    if (unit === 'w') return D.add(c.last, n * 7);
    const d = D.parse(c.last); d.setMonth(d.getMonth() + n); return D.iso(d);
  }
  const named = s => s.chores.filter(c => P.has(c.text));
  const GROUPS = [['late', 'Overdue'], ['today', 'Due today'], ['week', 'Next 7 days'], ['later', 'Later']];
  const groupOf = c => { const n = next(c), t = D.today(); return n < t ? 'late' : n === t ? 'today' : n <= D.add(t, 7) ? 'week' : 'later'; };

  function blank() { return Object.assign(C.blank(), { chores: [], log: [] }); }
  function normalize(s) {
    C.normalize(s);
    s.chores = (Array.isArray(s.chores) ? s.chores : []).filter(x => x && typeof x === 'object').map(x => {
      const c = chore(); Object.keys(c).forEach(k => { c[k] = txt(x[k]) || (k === 'id' ? P.uid() : c[k]); }); if (!EV[c.every]) c.every = '1w'; if (c.last && !D.parse(c.last)) c.last = ''; return c;
    });
    const keep = D.add(D.today(), -120);
    s.log = (Array.isArray(s.log) ? s.log : []).filter(x => x && D.parse(x.date) && x.date >= keep).map(x => ({ id: txt(x.id), date: x.date }));
    return s;
  }
  function sample() {
    const s = Object.assign(blank(), C.sample()), t = D.today(), a = n => D.add(t, -n);
    const c = (text, room, every, last, who, mins) => chore({ text, room, every, last: last == null ? '' : a(last), who: who || '', mins: String(mins || '') });
    s.chores = [
      c('Dishes + wipe counters', 'Kitchen', '1d', 0, '', 10), c('10-minute tidy', 'Living room', '1d', 1, '', 10),
      c('Wipe bathroom sink + mirror', 'Bathroom', '3d', 2, 'Sam', 5), c('Vacuum all floors', 'Whole home', '1w', 8, 'Alex', 30),
      c('Mop kitchen + bathroom', 'Kitchen', '1w', 5, 'Alex', 20), c('Clean the toilet', 'Bathroom', '1w', 7, 'Sam', 10),
      c('Change bed sheets', 'Bedroom', '1w', 3, 'Alex', 15), c('Laundry', 'Laundry', '1w', 2, 'Sam', 45), c('Trash + recycling out', 'Kitchen', '1w', 6, 'Sam', 5),
      c('Dust surfaces', 'Living room', '2w', 16, 'Alex', 15), c('Clean the fridge', 'Kitchen', '1m', 20, 'Alex', 25), c('Wipe baseboards + switches', 'Whole home', '1m', 40, '', 30),
      c('Wash the shower curtain', 'Bathroom', '1m', 12, 'Sam', 10), c('Clean the oven', 'Kitchen', '3m', 70, 'Alex', 40), c('Descale the kettle + coffee maker', 'Kitchen', '3m', 30, '', 10),
      c('Flip or rotate the mattress', 'Bedroom', '6m', 100, 'Alex', 10), c('Wash windows inside', 'Whole home', '6m', 150, '', 60), c('Test smoke alarms', 'Whole home', '6m', 170, 'Alex', 10)];
    s.log = [];
    for (let i = 0; i < 7; i++) s.chores.forEach(x => { if (x.last === a(i)) s.log.push({ id: x.id, date: a(i) }); });
    return s;
  }

  /* ---------- schedule ---------- */
  const schedule = {
    id: 'schedule', label: 'Schedule', icon: 'calendar',
    badge: ctx => named(ctx.state).filter(c => groupOf(c) === 'late' || groupOf(c) === 'today').length || '',
    render(ctx) {
      const s = ctx.state, who = s.ui.who && named(s).some(c => c.who === s.ui.who) ? s.ui.who : 'all';
      const people = Array.from(new Set(named(s).map(c => c.who).filter(Boolean)));
      const list = named(s).map(c => Object.assign({ __i: s.chores.indexOf(c) }, c)).filter(c => who === 'all' || c.who === who || !c.who);
      const groups = GROUPS.map(([g, name]) => {
        const l = list.filter(c => groupOf(c) === g).sort((a, b) => next(a).localeCompare(next(b)));
        if (!l.length || (g === 'later' && !s.ui.showLater)) return g === 'later' && l.length ? `<div class="pl-row">${u.btn(`Show ${P.plural(l.length, 'later chore')}`, { sm: true, kind: 'ghost', act: 'set', data: { bind: 'ui.showLater', value: '1' } })}</div>` : '';
        return `<section class="y-panel cs-group${g === 'late' ? ' is-late' : ''}"><div class="y-panel-head"><h2 class="y-kicker">${esc(name)}</h2><span class="pl-muted y-num">${l.length}</span></div>
          <ul class="cs-list">${l.map(c => `<li><span><b>${esc(c.text)}</b><small>${[c.room, EV[c.every], c.who, c.mins && `${c.mins} min`].filter(Boolean).map(esc).join(' · ')} · <span class="${g === 'late' ? 'is-over' : ''}">${c.last ? (g === 'late' ? `was due ${esc(D.short(next(c)))}` : g === 'today' ? 'due today' : `next ${esc(D.short(next(c)))}`) : 'never done yet'}</span></small></span>${u.btn('Done', { sm: true, kind: g === 'late' || g === 'today' ? 'world' : 'secondary', icon: 'check', act: 'markDone', data: { i: c.__i } })}</li>`).join('')}</ul></section>`;
      }).join('');
      return `${u.head({ eyebrow: 'Cleaning schedule', title: '<span data-slot="title"></span>', lede: 'Each chore comes back on its own schedule. Tap Done and it moves to its next date — nothing to plan from scratch.' })}
      <div data-slot="kpis"></div>
      ${people.length ? `<div class="pl-row cs-tools">${u.chips('ui.who', who, [['all', 'Everyone'], ...people.map(p => [p, p])], 'Whose chores')}</div>` : ''}
      <div class="cs-groups">${groups || u.empty('check', named(s).length ? 'Nothing due' : 'No chores yet', named(s).length ? 'All caught up — enjoy it.' : 'Add the chores you repeat below, with how often.')}</div>
      ${u.panel('All chores', u.table('chores', s.chores, [
        { k: 'text', label: 'Chore', title: true, w: 'minmax(0,1.6fr)', ph: 'Vacuum all floors' }, { k: 'room', label: 'Room', w: 'minmax(0,1fr)', ph: 'Kitchen' },
        { k: 'every', label: 'How often', type: 'select', options: EVERY, w: '160px', rerender: true }, { k: 'last', label: 'Last done', type: 'date', w: '150px', rerender: true },
        { k: 'who', label: 'Who', w: '120px', ph: 'Anyone' }, { k: 'mins', label: 'Min', num: true, w: '70px', ph: '10' }
      ], { what: 'chore', move: true, add: 'Add chore', empty: 'No chores yet.' }), { icon: 'edit', hint: 'How often and when you last did it decide the next date.' })}`;
    },
    slots: {
      title(ctx) {
        const s = ctx.state, n = named(s).filter(c => ['late', 'today'].includes(groupOf(c))).length;
        return !named(s).length ? 'Clean on a <em>schedule</em>' : n ? `<em>${n}</em> ${n === 1 ? 'chore' : 'chores'} due today` : 'All <em>caught up</em>';
      },
      kpis(ctx) {
        const s = ctx.state, t = D.today(), mon = D.monday(t), l = named(s);
        if (!l.length) return '';
        const days = Array.from({ length: 7 }, (_, i) => D.add(mon, i));
        const late = l.filter(c => groupOf(c) === 'late').length, wk = s.log.filter(x => x.date >= mon).length;
        const mins = l.filter(c => ['late', 'today'].includes(groupOf(c))).reduce((a, c) => a + (Math.round(P.num(c.mins)) || 0), 0);
        return u.kpis([['Overdue', String(late), late ? 'is-bad' : 'is-good', late ? 'catch up a little at a time' : 'nothing overdue'], ['Due today', String(l.filter(c => groupOf(c) === 'today').length), 'y-kpi--world', mins ? `about ${mins} min with overdue` : ''],
          ['Done this week', String(wk), 'y-kpi--accent'], ['Next 7 days', String(l.filter(c => groupOf(c) === 'week').length)]]) +
          `<div class="cs-week">${days.map(d => `<div class="${d === t ? 'is-today' : ''}">${esc(D.fmt(d, { weekday: 'short' }))}<b class="y-num">${s.log.filter(x => x.date === d).length}</b></div>`).join('')}</div>`;
      }
    },
    actions: {
      markDone(ctx, d) {
        const s = ctx.state, c = s.chores[+d.i]; if (!c) return false;
        c.last = D.today(); s.log.push({ id: c.id, date: D.today() });
        ctx.toast(`Done — next ${D.short(next(c))}`);
      }
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Cleaning schedule</h1>${EVERY.map(([k, l]) => { const cs = named(s).filter(c => c.every === k); return cs.length ? `<h2>${esc(l)}</h2><table><tbody>${cs.map(c => `<tr><td style="width:6mm"><span class="pl-box"></span></td><td><b>${esc(c.text)}</b></td><td>${esc(c.room)}</td><td>${esc(c.who)}</td><td>${c.mins ? esc(c.mins) + ' min' : ''}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}`;
    }
  };

  /* Today keeps the notes; its label says what it is */
  const today = C.pages.today, todayRender = today.render;
  today.render = ctx => todayRender(ctx) + u.notes('notes', ctx.state.notes, { rows: 4, title: 'Notes', ph: 'Where supplies live, what to skip, your low-energy minimum…' });
  Object.assign(today, { label: 'Quick reset' });

  P.create({
    slug: 'cleaning-schedule-app',
    name: 'Cleaning Schedule',
    world: 'fresh',
    welcome: 'Add the chores you repeat, with how often — the schedule works out what’s due.',
    pages: [schedule, today, C.pages.zones],
    blank, sample, normalize,
    timer: { doneText: 'Time’s up — nice work' },
    rows: Object.assign({ chores: () => chore() }, C.rows),
    about: '<p><b>Cleaning Schedule</b> keeps a home clean without a big plan: every chore comes back on its own schedule — daily to once a year — and shows up when it is due. Tap Done and it moves on. For low-energy days there is a quick reset: one zone, three short tasks and a timer.</p>',
    disclaimer: 'Cleaning Schedule is a personal planning tool. Follow the label on any cleaning product, and never mix bleach with other cleaners.'
  });
})();
