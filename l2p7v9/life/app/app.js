/* Life Planner App — one app for the whole week: Today (top 3, tasks due, habits, meals, money, a check-in), tasks by life area,
   goals with steps, a habit board, meals + groceries + recipes, money until payday with bills, and a daily journal.
   Yaykit planner engine, life world (life.css; window.LIFE_SKIN can swap name, slug and world). Habits come from Habit Tracker (habits.js),
   money from Budget Planner (money.js), meals from Meal Planner (meals.js); Today, tasks, goals and the journal are new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon, H = window.HTHabits, M = window.LPMoney, F = window.LPMeals;
  const AREAS = ['Home', 'Work', 'Health', 'Money', 'People', 'Me'];
  const MOODS = [['1', 'Rough'], ['2', 'Low'], ['3', 'OK'], ['4', 'Good'], ['5', 'Great']];
  const MOOD = Object.fromEntries(MOODS);
  const PROMPTS = ['What made today easier than expected?', 'Who would you like to thank, and for what?', 'What is one thing you want to remember about today?',
    'What drained you today — and what refilled you?', 'What would make tomorrow a good day?', 'What are you proud of this week, even a little?',
    'What did you learn today?', 'What can you let go of tonight?', 'Where did you feel most like yourself today?', 'What is something small you are looking forward to?'];
  const txt = v => (v == null ? '' : String(v));
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);

  const task = o => Object.assign({ id: P.uid(), text: '', area: 'Me', due: '', done: false }, o || {});
  const step = (text, done) => ({ id: P.uid(), text: text || '', done: !!done });
  const aim = o => Object.assign({ id: P.uid(), name: '', area: 'Me', by: '', why: '', steps: [] }, o || {});
  const top3 = () => [0, 1, 2].map(() => ({ text: '', done: false }));
  const dayRec = o => { o = o || {}; const top = Array.isArray(o.top) ? o.top : []; return { mood: MOOD[o.mood] ? String(o.mood) : '', good: txt(o.good), journal: txt(o.journal), top: [0, 1, 2].map(i => ({ text: txt((top[i] || {}).text), done: !!(top[i] || {}).done })) }; };
  const day = (s, d) => s.days[d] || (s.days[d] = dayRec());

  function blank() { return Object.assign(F.blank(), M.blank(), H.blank(), { tasks: [], aims: [], days: {}, notes: '', ui: {} }); }
  function sample() {
    const t = D.today(), f = F.sample(), m = M.sample(), h = H.sample();
    const days = {};
    const goods = ['Long walk at lunch', 'Finished the report early', 'Called Mom', 'Tacos with Sam', 'Slept eight hours', 'The garden is blooming', 'Cooked a real dinner'];
    const notes = ['Busy day but I stuck to the top 3. Skipped the gym and that is fine.', 'Felt scattered in the morning. Writing the list helped.', '', 'Good talk with Maya about the project. Less stressed about Friday.',
      '', 'Tired. Early night.', 'Meal prep on Sunday paid off — no takeout all week.'];
    for (let i = 1; i < 21; i++) days[D.add(t, -i)] = dayRec({ mood: String([4, 3, 5, 4, 3, 2, 4][i % 7]), good: goods[i % 7], journal: i < 12 ? notes[i % 7] : '' });
    days[t] = dayRec({ mood: '4', top: [{ text: 'Finish the budget review', done: true }, { text: 'Book the dentist', done: false }, { text: '30-minute walk', done: false }] });
    const due = n => D.add(t, n);
    return Object.assign(f, m, h, {
      tasks: [task({ text: 'Call the dentist to reschedule', area: 'Health', due: due(-1) }), task({ text: 'Pay the water bill', area: 'Money', due: t }),
        task({ text: 'Send Maya the slides', area: 'Work', due: t }), task({ text: 'Return library books', area: 'Home', due: due(2) }),
        task({ text: 'Book flights for the holidays', area: 'People', due: due(5) }), task({ text: 'Plan Mom’s birthday dinner', area: 'People', due: due(9) }),
        task({ text: 'Renew passport', area: 'Me', due: due(24) }), task({ text: 'Clean out the garage', area: 'Home' }),
        task({ text: 'Water the plants', area: 'Home', due: due(-1), done: true }), task({ text: 'Submit expense report', area: 'Work', due: due(-2), done: true })],
      aims: [aim({ name: 'Run a 5K', area: 'Health', by: due(120), why: 'Feel strong again and have an hour to myself.', steps: [step('Buy proper running shoes', true), step('Run three times a week for four weeks', true), step('Run two miles without stopping'), step('Sign up for a race'), step('Race day!')] }),
        aim({ name: 'Emergency fund of $3,000', area: 'Money', by: due(300), why: 'No panic when the car breaks down.', steps: [step('Open a separate savings account', true), step('Auto-transfer $150 every payday', true), step('Reach $1,500'), step('Reach $3,000')] }),
        aim({ name: 'Speak basic Spanish', area: 'Me', by: due(200), why: 'Hold a five-minute conversation on the trip to Mexico City next year.', steps: [step('Pick a course', true), step('15 minutes a day for 30 days'), step('Book one online lesson'), step('Order dinner in Spanish')] }),
        aim({ name: 'Monthly family dinner', area: 'People', by: due(90), steps: [step('Pick a standing Sunday', true), step('Make a rotation of who cooks')] })],
      days,
      notes: 'Sunday reset: plan meals, check bills, pick next week’s top 3.\n\nIf a day goes sideways, one tiny habit still counts.'
    });
  }
  function normalize(s) {
    F.normalize(s); M.normalize(s); H.normalize(s);
    s.tasks = arr(s.tasks, x => task({ id: txt(x.id) || P.uid(), text: txt(x.text), area: AREAS.includes(x.area) ? x.area : 'Me', due: D.parse(x.due) ? x.due : '', done: !!x.done }));
    s.aims = arr(s.aims, x => aim({ id: txt(x.id) || P.uid(), name: txt(x.name), area: AREAS.includes(x.area) ? x.area : 'Me', by: D.parse(x.by) ? x.by : '', why: txt(x.why),
      steps: arr(x.steps, y => Object.assign(step(txt(y.text), y.done), { id: txt(y.id) || P.uid() })) }));
    const days = s.days && typeof s.days === 'object' ? s.days : {};
    s.days = Object.fromEntries(Object.keys(days).filter(k => D.parse(k) && days[k] && typeof days[k] === 'object').map(k => [k, dayRec(days[k])]));
    s.notes = txt(s.notes);
    if (!['today', 'week', 'later', 'done'].includes(s.ui.taskView)) s.ui.taskView = 'today';
    return s;
  }

  /* ---------- helpers ---------- */
  const open = s => s.tasks.map((x, i) => Object.assign({ __i: i }, x)).filter(x => P.has(x.text) && !x.done);
  const dueNow = s => { const t = D.today(); return open(s).filter(x => x.due && x.due <= t).sort((a, b) => (a.due < b.due ? -1 : 1)); };
  function inView(x, v) {
    const t = D.today(), wk = D.add(t, 7);
    if (v === 'done') return x.done;
    if (x.done) return false;
    if (v === 'today') return x.due && x.due <= t;
    if (v === 'week') return x.due && x.due > t && x.due <= wk;
    return !x.due || x.due > wk;
  }
  const aimPct = a => { const n = a.steps.filter(x => P.has(x.text)); return n.length ? n.filter(x => x.done).length / n.length * 100 : 0; };
  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
  const prompt = d => PROMPTS[Math.floor(D.parse(d).getTime() / 864e5) % PROMPTS.length];
  const taskMeta = x => { const t = D.today(); return `${esc(x.area)}${x.due ? ` · ${x.due < t ? `<span class="is-over">${esc(D.short(x.due))} · late</span>` : x.due === t ? 'today' : esc(D.short(x.due))}` : ''}`; };
  const taskList = (s, list) => `<ul class="pl-checklist lp-tasks">${list.map(x => `<li class="pl-ci">${u.tick(`tasks.${x.__i}.done`, x.done, `Done: ${x.text}`, { rerender: true })}<div class="pl-ci-main"><span class="pl-ci-text">${esc(x.text)}</span><span class="pl-ci-meta">${taskMeta(x)}</span></div></li>`).join('')}</ul>`;

  /* ---------- today ---------- */
  const today = {
    id: 'today', label: 'Today', icon: 'star',
    render(ctx) {
      const s = ctx.state, t = D.today(), d = day(s, t), b = `days.${t}`, now = dueNow(s);
      const mon = D.monday(t), w = s.weeks[mon], di = D.diff(mon, t), meals = w ? F.SLOTS.slice(0, 3).map(([k, l]) => [l, w.days[di][k].dish]) : [];
      return `${u.head({ eyebrow: D.long(t), title: '<span data-slot="title"></span>', lede: 'Pick three things that matter, tick what happens, and let the rest wait without guilt.' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Top 3 today', `<ol class="lp-top">${d.top.map((x, i) => `<li class="${x.done ? 'is-done' : ''}">${u.tick(`${b}.top.${i}.done`, x.done, `Done: top ${i + 1}`, { rerender: true })}${u.input(`${b}.top.${i}.text`, x.text, { label: `Top ${i + 1} today`, ph: ['The one that matters most', 'Second', 'Third'][i] })}</li>`).join('')}</ol>`, { icon: 'star', cls: 'pl-5' })}
        ${u.panel('Due today', `${now.length ? taskList(s, now) : '<p class="pl-muted">Nothing due today. A good day to pick something from Tasks — or rest.</p>'}
          <div class="xm-gap"></div>${u.quickAdd('tasks', { ph: 'Add a task for today', label: 'Add a task for today', kind: 'world' })}`, { icon: 'check', cls: 'pl-7', actions: u.btn('All tasks', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'tasks' } }) })}
        ${u.panel('Habits', s.habits.length ? `<ul class="ht-today">${s.habits.map((h, i) => `<li>${u.check(`habits.${i}.days.${t}`, !!h.days[t], esc(h.name || 'Untitled habit'), { rerender: true, meta: H.streak(h) ? `${I('flame')} ${H.streak(h)}-day streak` : 'start a streak today' })}</li>`).join('')}</ul>`
          : u.empty('flame', 'No habits yet', 'Add one tiny habit to start.', u.btn('Add a habit', { kind: 'world', icon: 'plus', act: 'go', data: { page: 'board' } })), { icon: 'flame', cls: 'pl-5' })}
        ${u.panel('Meals today', meals.some(m => P.has(m[1])) ? `<dl class="lp-meals">${meals.map(([l, v]) => `<div><dt>${l}</dt><dd>${P.has(v) ? esc(v) : '<span class="pl-muted">—</span>'}</dd></div>`).join('')}</dl>` : '<p class="pl-muted">No meals planned for today.</p>', { icon: 'calendar', cls: 'pl-4', actions: u.btn('Meals', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'week' } }) })}
        ${u.panel('Money', '<div data-slot="money"></div>', { icon: 'money', cls: 'pl-3' })}
        ${u.panel('Check-in', `<div class="pl-stack"><div class="y-field"><span class="y-label">Mood</span>${u.seg(`${b}.mood`, d.mood, MOODS, 'Mood')}</div>
          ${u.field('One good thing', `${b}.good`, d.good, { ph: 'Even a small one' })}</div>`, { icon: 'heart', actions: u.btn('Journal', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'journal' } }) })}
      </div>`;
    },
    slots: {
      title(ctx) {
        const s = ctx.state, d = day(s, D.today()), left = d.top.filter(x => P.has(x.text) && !x.done).length + dueNow(s).length;
        return left ? `${greet()} — <em>${left}</em> ${left === 1 ? 'thing' : 'things'} today` : `${greet()}, <em>all clear</em>`;
      },
      kpis(ctx) {
        const s = ctx.state, t = D.today(), d = day(s, t), named = d.top.filter(x => P.has(x.text)), hab = s.habits.filter(h => h.days[t]).length, x = M.safe(s);
        return u.kpis([
          ['Top 3', `${named.filter(y => y.done).length}<small>/${named.length || 3}</small>`, 'y-kpi--world', 'done today'],
          ['Tasks due', String(dueNow(s).length), dueNow(s).some(y => y.due < t) ? 'y-kpi--accent' : '', `${open(s).length} open in all`],
          ['Habits', `${hab}<small>/${s.habits.length}</small>`, s.habits.length && hab === s.habits.length ? 'is-good' : '', 'ticked today'],
          ['Safe to spend', x.hasBalance ? ctx.money(x.left, { cents: false }) : '—', x.left < 0 ? 'y-kpi--accent' : '', x.hasBalance ? `until ${esc(D.short(x.pay))}` : 'set it on Money']
        ]);
      },
      money(ctx) {
        const x = M.safe(ctx.state);
        return x.hasBalance ? `<p class="lp-big y-num">${esc(ctx.money(x.left, { cents: false }))}</p><p class="pl-muted">safe to spend · ${esc(ctx.money(Math.max(0, x.perDay), { cents: false }))} a day until payday</p>${u.btn('Money', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'money' } })}`
          : `<p class="pl-muted">Type your balance and next payday to see what is safe to spend.</p>${u.btn('Set it up', { sm: true, act: 'go', data: { page: 'money' } })}`;
      }
    },
    onQuickAdd(ctx, d, item) { item.due = D.today(); }
  };

  /* ---------- tasks ---------- */
  const tasks = {
    id: 'tasks', label: 'Tasks', icon: 'check',
    render(ctx) {
      const s = ctx.state, v = s.ui.taskView, rows = s.tasks.map((x, i) => Object.assign({ __i: i }, x)).filter(x => inView(x, v)).sort((a, b) => (a.due || '9') < (b.due || '9') ? -1 : 1);
      const n = k => s.tasks.filter(x => P.has(x.text) && inView(x, k)).length;
      return `${u.head({ eyebrow: 'Tasks', title: `<em>${open(s).length}</em> open`, lede: 'Everything on your mind, by life area. Give it a date when it has one — Today shows what is due.' })}
      ${u.panel('', `${u.quickAdd('tasks', { ph: 'Add a task and press Enter', label: 'Add a task', kind: 'world' })}
        <div class="lp-bar">${u.chips('ui.taskView', v, [['today', 'Today', n('today')], ['week', 'Next 7 days', n('week')], ['later', 'Later', n('later')], ['done', 'Done', n('done')]], 'Show tasks')}</div>
        ${u.table('tasks', rows, [
          { k: 'done', label: 'Done', type: 'check', w: '60px', rerender: true },
          { k: 'text', label: 'Task', title: true, w: '1.6fr', ph: 'Task' },
          { k: 'area', label: 'Area', type: 'select', options: AREAS, w: '120px' },
          { k: 'due', label: 'Due', type: 'date', w: '160px', rerender: true }
        ], { index: x => x.__i, total: s.tasks.length, what: 'task', empty: v === 'done' ? 'Nothing ticked off yet.' : 'Nothing here. Add a task above.', cls: 'lp-ttab', rowClass: x => (x.done ? 'is-done' : x.due && x.due < D.today() ? 'is-late' : '') })}`)}
      <div class="lp-areas">${AREAS.map(a => { const k = open(s).filter(x => x.area === a).length; return `<span class="pl-pill${k ? ' pl-pill--world' : ''}">${esc(a)} · ${k}</span>`; }).join('')}</div>`;
    },
    onQuickAdd(ctx, d, item) { if (ctx.state.ui.taskView === 'today') item.due = D.today(); else if (ctx.state.ui.taskView === 'week') item.due = D.add(D.today(), 1); },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Tasks</h1><p class="pl-sheet-meta">${open(s).length} open · ${esc(D.long(D.today()))}</p>${AREAS.map(a => { const l = open(s).filter(x => x.area === a); return l.length ? `<h2>${esc(a)}</h2><table><tbody>${l.map(x => `<tr><td style="width:6mm"><span class="pl-box"></span></td><td>${esc(x.text)}</td><td style="width:26mm">${x.due ? esc(D.short(x.due)) : ''}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}`;
    }
  };

  /* ---------- goals ---------- */
  const goals = {
    id: 'goals', label: 'Goals', icon: 'heart',
    render(ctx) {
      const s = ctx.state, named = s.aims.filter(a => P.has(a.name)), steps = named.flatMap(a => a.steps.filter(x => P.has(x.text)));
      return `${u.head({ eyebrow: 'Goals', title: named.length ? `<em>${named.length}</em> goals, one step at a time` : 'Your <em>goals</em>', lede: 'A goal is a few small steps. Write why it matters, tick a step when it is done, and watch the bar move.' })}
      ${u.kpis([['Goals', String(named.length), 'y-kpi--world'], ['Steps done', `${steps.filter(x => x.done).length}<small>/${steps.length}</small>`, ''], ['Next deadline', (() => { const n = named.filter(a => a.by && aimPct(a) < 100).sort((a, b) => (a.by < b.by ? -1 : 1))[0]; return n ? esc(D.short(n.by)) : '—'; })(), '']])}
      <div class="xm-gap"></div>
      ${u.records('aims', s.aims, {
        what: 'Goal', titlePh: 'Goal — e.g. “Run a 5K”', cls: 'lp-goals', add: 'Add goal', addKind: 'world',
        sub: a => `${u.meter(aimPct(a), `${a.name || 'Goal'} progress`)}<span class="y-num">${Math.round(aimPct(a))}%</span>${a.by ? ` · by ${esc(D.short(a.by))}` : ''}`,
        fields: [{ k: 'area', label: 'Area', options: AREAS }, { k: 'by', label: 'By', type: 'date' }, { k: 'why', label: 'Why it matters', type: 'textarea', wide: true, ph: 'So that…' }],
        foot: (a, i) => `<h3 class="lp-sub">Steps</h3>${u.checklist(`aims.${i}.steps`, a.steps, { ph: 'Next small step', what: 'step', rerender: true, add: 'Add step', tpl: 'steps' })}`,
        empty: u.empty('heart', 'No goals yet', 'Start with one goal and three small steps.')
      })}`;
    },
    sheet(ctx) {
      return `<h1>Goals</h1>${ctx.state.aims.filter(a => P.has(a.name)).map(a => `<h2>${esc(a.name)}${a.by ? ` · by ${esc(D.short(a.by))}` : ''}</h2>${a.why ? `<p>${esc(a.why)}</p>` : ''}<table><tbody>${a.steps.filter(x => P.has(x.text)).map(x => `<tr><td style="width:6mm"><span class="pl-box${x.done ? ' is-on' : ''}"></span></td><td>${esc(x.text)}</td></tr>`).join('')}</tbody></table>`).join('')}`;
    }
  };

  /* ---------- money: safe to spend + bills on one page ---------- */
  const mo = M.pages.overview, bi = M.pages.bills;
  const money = Object.assign({}, mo, {
    render: ctx => mo.render(ctx) + bi.render(ctx).replace(/<header class="y-page-head[\s\S]*?<\/header>/, '').replace('data-slot="kpis"', 'data-slot="bkpis"'),
    slots: Object.assign({}, mo.slots, { bkpis: bi.slots.kpis }),
    actions: Object.assign({}, mo.actions, bi.actions)
  });

  /* ---------- journal ---------- */
  const journal = {
    id: 'journal', label: 'Journal', icon: 'edit',
    render(ctx) {
      const s = ctx.state, t = D.today(), d = day(s, t), b = `days.${t}`;
      const past = Object.keys(s.days).filter(k => k < t && (P.has(s.days[k].journal) || P.has(s.days[k].good))).sort().reverse().slice(0, 30);
      return `${u.head({ eyebrow: D.long(t), title: 'A few lines, <em>most days</em>', lede: 'No blank-page pressure: answer the prompt, or just write one good thing.' })}
      ${u.panel('Today', `<p class="lp-prompt">${I('sparkle')}${esc(prompt(t))}</p>
        <div class="pl-stack"><div class="y-field"><span class="y-label">Mood</span>${u.seg(`${b}.mood`, d.mood, MOODS, 'Mood')}</div>
        ${u.field('One good thing', `${b}.good`, d.good, { ph: 'Even a small one' })}
        ${u.field('Journal', `${b}.journal`, d.journal, { type: 'textarea', rows: 7, ph: 'Write as much or as little as you like…' })}</div>`, { icon: 'edit' })}
      ${u.panel('Earlier', past.length ? `<div class="lp-entries">${past.map(k => { const x = s.days[k]; return `<article class="lp-entry"><h3>${esc(D.fmt(k, { weekday: 'short' }))} ${esc(D.short(k))}${x.mood ? u.pill(MOOD[x.mood], +x.mood >= 4 ? 'good' : +x.mood <= 2 ? 'bad' : '') : ''}</h3>${x.good ? `<p class="lp-good">${I('heart')}${esc(x.good)}</p>` : ''}${x.journal ? `<p>${esc(x.journal)}</p>` : ''}</article>`; }).join('')}</div>` : '<p class="pl-muted">Your earlier entries show up here.</p>', { icon: 'calendar' })}
      ${u.notes('notes', s.notes, { rows: 4, title: 'Notes', ph: 'Rules for yourself, a Sunday reset list, ideas…' })}`;
    },
    sheet(ctx) {
      const s = ctx.state, keys = Object.keys(s.days).filter(k => P.has(s.days[k].journal) || P.has(s.days[k].good)).sort().reverse().slice(0, 31);
      return `<h1>Journal</h1>${keys.map(k => { const x = s.days[k]; return `<h2>${esc(D.full(k))}${x.mood ? ` · ${esc(MOOD[x.mood])}` : ''}</h2>${x.good ? `<p><b>Good thing:</b> ${esc(x.good)}</p>` : ''}${x.journal ? `<p>${esc(x.journal)}</p>` : ''}`; }).join('')}`;
    }
  };

  Object.assign(H.pages.board, { label: 'Habits' });
  const shop = Object.assign({}, F.pages.shop, { badge: null });   // nine tabs: only Today counts what is due
  const SKIN = Object.assign({ slug: 'life-planner-app', name: 'Life Planner', world: 'life' }, window.LIFE_SKIN);
  P.create({
    slug: SKIN.slug, name: SKIN.name, world: SKIN.world, currency: true,
    welcome: 'Start with Today: write your top 3, then add a few tasks and one habit.',
    pages: [today, tasks, H.pages.board, goals, F.pages.plan, shop, F.pages.box, money, journal],
    blank, sample, normalize,
    open(ctx) { ctx.state.ui.week = D.monday(D.today()); ctx.state.ui.month = D.today().slice(0, 7); },
    rows: Object.assign({}, H.rows, M.rows, F.rows, { tasks: () => task(), aims: () => aim({ steps: [step()] }), steps: () => step() }),
    about: `<p><b>${esc(SKIN.name)}</b> keeps your week in one place: Today with your top 3, tasks due, habits, meals and money; tasks by life area; goals broken into steps; a habit board with streaks; a meal plan that builds the grocery list from your recipes; safe to spend until payday with your bills; and a short daily journal with a prompt.</p>`,
    disclaimer: `${esc(SKIN.name)} is a personal planning tool, not financial, medical or therapy advice.`
  });
})();
