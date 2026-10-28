/* Content Creator Planner App — content plan, pillars, launch checklist and gear, from Creator Launch Planner. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const STATUS = [['idea', 'Idea'], ['draft', 'Drafting'], ['ready', 'Ready'], ['posted', 'Posted']];
  const ST = Object.fromEntries(STATUS);
  const FORMATS = ['Short video', 'Carousel', 'Photo', 'Long video', 'Story', 'Live', 'Blog / newsletter', 'Pin'];
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Pinterest', 'LinkedIn', 'Newsletter', 'Blog', 'Other'];
  const GEAR = [['need', 'Need'], ['have', 'Have'], ['skip', 'Skip for now']];
  const txt = v => (v == null ? '' : String(v));
  const check = (text, done) => ({ id: P.uid(), text: text || '', done: !!done });
  const pillar = (name, why, examples) => ({ id: P.uid(), name: name || '', why: why || '', examples: examples || '' });
  const post = o => Object.assign({ id: P.uid(), date: '', idea: '', pillar: '', format: 'Short video', status: 'idea', hook: '', result: '' }, o || {});
  const gear = (item, status, cost, note) => ({ id: P.uid(), item: item || '', status: status || 'need', cost: txt(cost), note: note || '' });
  const LAUNCH = ['Pick one main platform for the first month', 'Claim the handle + write the bio', 'Write your one-sentence niche', 'Choose 3–4 content pillars', 'Draft 10 post ideas', 'Set a cadence you can keep (e.g. 3× a week)', 'Batch 3 posts before launch day', 'Write a pinned “start here” post', 'Decide what you’ll track (saves, follows, clicks)'];

  function blank() { return { me: { name: '', handle: '', niche: '', platform: 'Instagram', launch: '', cadence: '3' }, launch: LAUNCH.map(t => check(t)), pillars: [], posts: [], gear: [], notes: '' }; }
  function sample() {
    const t = D.today(), P1 = pillar('Before & after', 'Shows the win in under 30 seconds', 'Drawer reset · closet shelf · entryway hooks'), P2 = pillar('Renter-safe tips', 'No-damage fixes landlords won’t hate', 'Tension rods · removable hooks · peel-and-stick'), P3 = pillar('Weekend reset', 'Short, doable routines', '15-min kitchen · laundry race · fridge purge'), P4 = pillar('Honest gear', 'What I actually use, not hauls', 'Label maker · clear bins · folding cart');
    const s = blank();
    Object.assign(s.me, { name: 'Maya Chen', handle: '@mayamakeshome', niche: 'Small-space organizing for renters who hate clutter but love their deposit back', platform: 'Instagram', launch: D.add(t, 6), cadence: '3' });
    s.launch.forEach((c, i) => { c.done = i < 5; });
    s.pillars = [P1, P2, P3, P4];
    s.posts = [
      post({ date: D.add(t, 6), idea: 'Hi, I’m Maya — who this account is for', pillar: P3.id, format: 'Short video', status: 'ready', hook: '“My whole apartment is 400 sq ft. Here’s how it doesn’t feel like it.”' }),
      post({ date: D.add(t, 8), idea: 'Junk drawer before/after in 20 seconds', pillar: P1.id, format: 'Short video', status: 'draft', hook: 'Start on the messiest frame' }),
      post({ date: D.add(t, 10), idea: '3 renter-safe hooks that actually hold coats', pillar: P2.id, format: 'Carousel', status: 'draft' }),
      post({ date: D.add(t, 13), idea: 'Sunday reset checklist', pillar: P3.id, format: 'Carousel', status: 'idea' }),
      post({ date: D.add(t, 15), idea: 'Label maker: worth it?', pillar: P4.id, format: 'Short video', status: 'idea' }),
      post({ date: D.add(t, 17), idea: 'Closet shelf makeover with dollar-store bins', pillar: P1.id, format: 'Short video', status: 'idea' }),
      post({ date: D.add(t, -20), idea: 'Test post: my desk reset', pillar: P1.id, format: 'Photo', status: 'posted', result: '42 saves — people liked the bin labels' })
    ];
    s.gear = [gear('Phone tripod with light', 'have', 35), gear('Clip-on mic', 'need', 29, 'For talking videos'), gear('Editing app', 'have', 0, 'Free version is enough'), gear('Backdrop / tidy corner', 'have', 0), gear('Ring light', 'skip', 60, 'Window light is fine for now')];
    s.notes = 'What’s working: close-up hands + before shot in the first second.\nIdeas from comments: “how do you store pots in a tiny kitchen?”';
    return s;
  }
  function normalize(s) {
    const m = s.me || {};
    s.me = { name: txt(m.name), handle: txt(m.handle), niche: txt(m.niche), platform: PLATFORMS.includes(m.platform) ? m.platform : 'Instagram', launch: txt(m.launch), cadence: txt(m.cadence) || '3' };
    const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
    s.launch = arr(s.launch, x => Object.assign(check(txt(x.text), x.done), { id: txt(x.id) || P.uid() }));
    s.pillars = arr(s.pillars, x => Object.assign(pillar(txt(x.name), txt(x.why), txt(x.examples)), { id: txt(x.id) || P.uid() }));
    const ids = new Set(s.pillars.map(p => p.id));
    s.posts = arr(s.posts, x => { const o = post(); Object.keys(o).forEach(k => { o[k] = txt(x[k]) || (k === 'id' ? P.uid() : o[k]); }); o.status = ST[x.status] ? x.status : 'idea'; o.format = FORMATS.includes(x.format) ? x.format : 'Short video'; o.pillar = ids.has(x.pillar) ? x.pillar : ''; return o; });
    s.gear = arr(s.gear, x => Object.assign(gear(txt(x.item), GEAR.some(g => g[0] === x.status) ? x.status : 'need', txt(x.cost), txt(x.note)), { id: txt(x.id) || P.uid() }));
    s.notes = txt(s.notes);
    return s;
  }
  const pname = (s, id) => (s.pillars.find(p => p.id === id) || {}).name || '';

  const launch = {
    id: 'launch', label: 'Launch', icon: 'sparkle',
    render(ctx) {
      const s = ctx.state, m = s.me, n = D.parse(m.launch) ? D.diff(D.today(), m.launch) : null;
      const ready = s.posts.filter(p => p.status === 'ready').length, need = Math.round(P.num(m.cadence)) || 3;
      return `${u.head({ eyebrow: m.handle || 'Creator launch', title: n == null ? 'Plan your <em>launch</em>' : n > 0 ? `<em>${n}</em> ${n === 1 ? 'day' : 'days'} to launch` : n === 0 ? 'Launch <em>day!</em>' : 'You’re <em>live</em>', meta: '<span data-slot="prog"></span>' })}
      <section class="y-panel y-panel--world cr-niche"><h2 class="y-kicker"><label for="crNiche">My niche, in one sentence</label></h2>
        <textarea id="crNiche" class="cr-niche-in y-textarea--auto" rows="1" data-bind="me.niche" placeholder="I help [who] with [what] so they can [result].">${esc(m.niche)}</textarea></section>
      ${u.kpis([['Posts ready', `${ready}<small class="cr-of">/${need}</small>`, ready >= need ? 'is-good' : 'y-kpi--world', `aim for one week (${need}) before launch`], ['Ideas', String(s.posts.filter(p => p.status === 'idea').length)], ['Pillars', String(s.pillars.filter(p => P.has(p.name)).length), 'y-kpi--accent'], ['Posted', String(s.posts.filter(p => p.status === 'posted').length)]])}
      <div class="pl-grid">
        ${u.panel('Launch checklist', u.checklist('launch', s.launch, { ph: 'Step', what: 'step', add: 'Add step', move: true }), { icon: 'check', cls: 'pl-7' })}
        ${u.panel('About you', `<div class="pl-fields">${u.field('Name', 'me.name', m.name)}${u.field('Handle', 'me.handle', m.handle, { ph: '@handle' })}${u.field('Main platform', 'me.platform', m.platform, { options: PLATFORMS })}${u.field('Launch date', 'me.launch', m.launch, { type: 'date', rerender: true })}${u.field('Posts per week', 'me.cadence', m.cadence, { num: true, hint: 'Pick a number you could keep on a bad week.' })}</div>`, { icon: 'user', cls: 'pl-5' })}
      </div>`;
    },
    slots: { prog(ctx) { const l = ctx.state.launch.filter(c => P.has(c.text)), d = l.filter(c => c.done).length; return l.length ? `<span class="cr-prog">${u.meter(d / l.length * 100, 'Launch checklist')}</span><span><b class="y-num">${d}</b> of ${l.length} launch steps done</span>` : ''; } }
  };

  const posts = {
    id: 'posts', label: 'Content plan', icon: 'calendar',
    badge: ctx => ctx.state.posts.filter(p => p.status === 'ready').length || '',
    render(ctx) {
      const s = ctx.state, view = s.ui.view === 'board' ? 'board' : 'list', f = ST[s.ui.f] ? s.ui.f : 'all';
      const rows = s.posts.map((p, i) => Object.assign({ __i: i }, p)).filter(p => f === 'all' || p.status === f).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
      const pillarOpts = s.pillars.filter(p => P.has(p.name)).map(p => [p.id, p.name]);
      return `${u.head({ eyebrow: 'Content plan', title: `<em>${s.posts.filter(p => p.status !== 'posted').length}</em> posts in the pipeline`, lede: 'Ideas to posted. Give ready posts a date; log what happened after posting so you can do more of what works.' })}
      <div class="pl-row cr-tools">${u.seg('ui.view', view, [['list', 'List'], ['board', 'Board']], 'View')}${view === 'list' ? u.chips('ui.f', f, [['all', 'All', s.posts.length], ...STATUS.map(([k, l]) => [k, l, s.posts.filter(p => p.status === k).length])], 'Status') : ''}<span class="pl-spacer"></span>${u.btn('Add post idea', { kind: 'world', icon: 'plus', act: 'add', data: { list: 'posts', at: 'top' } })}</div>
      ${view === 'board' ? `<div class="cr-board">${STATUS.map(([k, l]) => { const list = s.posts.map((p, i) => Object.assign({ __i: i }, p)).filter(p => p.status === k && P.has(p.idea)); return `<section class="cr-col"><h2>${l} <span class="pl-chip-n">${list.length}</span></h2>${list.map(p => `<article class="cr-card"><b>${esc(p.idea)}</b><span class="pl-muted">${esc([pname(s, p.pillar), p.format, p.date && D.short(p.date)].filter(Boolean).join(' · '))}</span><div class="cr-card-btns">${k !== 'idea' ? u.iconBtn('prev', `Move ${p.idea} back`, 'step', { i: p.__i, n: -1 }) : '<span></span>'}${k !== 'posted' ? u.iconBtn('next', `Move ${p.idea} forward`, 'step', { i: p.__i, n: 1 }) : ''}</div></article>`).join('') || '<p class="pl-muted">—</p>'}</section>`; }).join('')}</div>`
        : u.panel('', rows.length ? u.table('posts', rows, [
          { k: 'date', label: 'Date', type: 'date', w: '150px' }, { k: 'idea', label: 'Idea', title: true, w: '1.6fr', ph: 'Post idea' },
          { k: 'pillar', label: 'Pillar', type: 'select', options: pillarOpts, blank: '—', w: '150px' }, { k: 'format', label: 'Format', type: 'select', options: FORMATS, w: '140px' },
          { k: 'status', label: 'Status', type: 'select', options: STATUS, w: '124px', rerender: true }, { k: 'hook', label: 'Hook / result', w: '1fr', ph: 'Opening line or what happened' }
        ], { index: p => p.__i, total: s.posts.length, what: 'post', rowClass: p => p.status === 'posted' ? 'is-done' : '' }) : u.empty('calendar', 'No posts yet', 'Brain-dump ten ideas. Rough is fine — you’ll sort them into pillars later.'))}`;
    },
    actions: { step(ctx, d) { const p = ctx.state.posts[+d.i]; if (!p) return false; const i = STATUS.findIndex(x => x[0] === p.status); p.status = STATUS[Math.max(0, Math.min(3, i + +d.n))][0]; } }
  };

  const pillars = {
    id: 'pillars', label: 'Pillars', icon: 'star',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'What you post about', title: 'Content pillars', lede: 'Three or four recurring themes. When you’re stuck, pick a pillar and make one more.' })}
      ${u.records('pillars', s.pillars, { what: 'Pillar', titlePh: 'Pillar name', sub: p => `${s.posts.filter(x => x.pillar === p.id).length} posts`, fields: [{ k: 'why', label: 'Why people care', wide: true }, { k: 'examples', label: 'Example posts', type: 'textarea', wide: true, ph: 'Three quick examples' }], add: 'Add pillar', addKind: 'world', move: true, empty: u.empty('star', 'No pillars yet', 'Start with three themes you could post about for a year.') })}`;
    }
  };

  const gearPage = {
    id: 'gear', label: 'Gear', icon: 'briefcase',
    render(ctx) {
      const s = ctx.state, need = s.gear.filter(g => g.status === 'need').reduce((a, g) => a + P.num(g.cost), 0);
      return `${u.head({ eyebrow: 'Setup', title: 'Gear', lede: `Start with your phone. Buy only what solves a problem you actually have.${need ? ` Still to buy: ${ctx.money(need)}.` : ''}` })}
      ${u.panel('', u.table('gear', s.gear, [{ k: 'item', label: 'Item', title: true, w: '1.4fr', ph: 'Item' }, { k: 'status', label: 'Status', type: 'select', options: GEAR, w: '150px', rerender: true }, { k: 'cost', label: 'Cost', num: true, w: '110px', ph: '0' }, { k: 'note', label: 'Notes', w: '1.2fr', ph: 'Why / which one' }], { what: 'item', add: 'Add gear', rowClass: g => g.status === 'have' ? 'is-done' : '' }))}
      ${u.notes('notes', s.notes, { title: 'What’s working', rows: 6, ph: 'Patterns in saves, comments and follows' })}`;
    }
  };

  window.CCCreator = { pages: { launch, posts, pillars, gearPage }, blank, sample, normalize, PLATFORMS, rows: { launch: () => check(), pillars: () => pillar(), posts: () => post(), gear: () => gear() } };
})();
