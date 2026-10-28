/* Thanksgiving Planner App — guests, menu, a turkey calculator, the day-of oven timeline, a three-week countdown and shopping.
   Yaykit planner engine, harvest world (defined in thanksgiving.css). Guests, menu, countdown and shopping come from Christmas Planner;
   the turkey calculator and the timeline built back from dinner time are new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const RSVP = ['Pending', 'Yes', 'Maybe', 'No'];
  const COURSES = [['Starter', 'Starters'], ['Main', 'Turkey & mains'], ['Side', 'Sides'], ['Dessert', 'Desserts'], ['Drinks', 'Drinks'], ['Other', 'Other']];
  const COURSE = Object.fromEntries(COURSES);
  const WHEN = [['3w', '3 weeks out', -21], ['2w', '2 weeks out', -14], ['1w', '1 week out', -7], ['3d', '3 days out', -3], ['1d', 'Day before', -1], ['day', 'Thanksgiving Day', 0], ['after', 'After', 1]];
  const WHEN_OFF = Object.fromEntries(WHEN.map(w => [w[0], w[2]]));
  const AISLES = ['Produce', 'Meat & fish', 'Dairy', 'Bakery', 'Pantry', 'Drinks', 'Household', 'Other'];
  const TURKEY_F = 325, REST = 30;
  /* USDA roasting chart at 325°F: up to [lb], hours low–high, unstuffed / stuffed */
  const CHART = { plain: [[12, 2.75, 3], [14, 3, 3.75], [18, 3.75, 4.25], [20, 4.25, 4.5], [24, 4.5, 5]], stuffed: [[12, 3, 3.5], [14, 3.5, 4], [18, 4, 4.25], [20, 4.25, 4.75], [24, 4.75, 5.25]] };
  const txt = v => (v == null ? '' : String(v));
  const fToC = f => Math.round((f - 32) * 5 / 9 / 5) * 5;
  const deg = f => `${f}°F / ${fToC(f)}°C`;
  const hm = m => { m = ((Math.round(m) % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
  const dur = m => { const h = Math.floor(m / 60), r = Math.round(m % 60); return h ? `${h} h${r ? ` ${r} min` : ''}` : `${r} min`; };

  const guest = o => Object.assign({ id: P.uid(), name: '', count: '1', rsvp: 'Pending', diet: '', bringing: '' }, o || {});
  const dish = o => Object.assign({ id: P.uid(), course: 'Side', name: '', who: '', diet: '', temp: '', mins: '', note: '' }, o || {});
  const task = (when, text, who, done) => ({ id: P.uid(), when: when || '1w', text: text || '', who: who || '', done: !!done });
  const buy = (text, qty, aisle, done) => ({ id: P.uid(), text: text || '', qty: qty || '', aisle: aisle || 'Other', done: !!done });
  const step = o => Object.assign({ id: P.uid(), time: '', text: '', who: '', temp: '', mins: '', done: false, auto: false }, o || {});
  const STARTER = [
    ['3w', 'Set the guest list and send invites'], ['3w', 'Ask about allergies and dietary needs'], ['3w', 'Order a fresh turkey or buy a frozen one'], ['3w', 'Plan the menu + who brings what'],
    ['2w', 'Check the roasting pan, rack and meat thermometer'], ['2w', 'Count chairs, plates, glasses, serving dishes'], ['2w', 'Write the shopping list'],
    ['1w', 'Shop for pantry items + drinks'], ['1w', 'Clear fridge space for the turkey'], ['1w', 'Confirm “maybe” guests'], ['1w', 'Make and freeze pie crust'],
    ['3d', 'Big grocery shop: produce + dairy'], ['3d', 'Make cranberry sauce'],
    ['1d', 'Bake the pies'], ['1d', 'Chop vegetables + dry the stuffing bread'], ['1d', 'Set the table'],
    ['day', 'Turkey in the oven — follow the timeline'], ['day', 'Coats area, extra chairs, music'],
    ['after', 'Leftovers in the fridge within 2 hours'], ['after', 'Send leftovers home with guests'], ['after', 'Note what to change next year']
  ];

  /* fourth Thursday of November; after it has passed, next year's */
  function thanksgiving(y) { const w = new Date(y, 10, 1).getDay(); return `${y}-11-${String(1 + ((4 - w + 7) % 7) + 21).padStart(2, '0')}`; }
  function nextDay() { const y = new Date().getFullYear(), d = thanksgiving(y); return D.today() > d ? thanksgiving(y + 1) : d; }

  function blank() {
    return { event: { name: '', host: '', date: nextDay(), arrive: '', serve: '', place: '', theme: '' }, turkey: { heads: '', leftovers: false, stuffed: false, fresh: false, lbs: '' },
      guests: [], menu: [], timeline: [], prep: [], shopping: [], notes: '' };
  }
  function sample() {
    const s = {
      event: { name: 'Thanksgiving at the Millers’', host: 'Dana + Chris Miller', date: nextDay(), arrive: '13:00', serve: '15:00', place: 'Home · 27 Maple Avenue', theme: 'Kids’ table in the den · football at 4 · pie at 6' },
      turkey: { heads: '', leftovers: false, stuffed: false, fresh: false, lbs: '' },
      guests: [guest({ name: 'Us (Millers)', count: '4', rsvp: 'Yes' }), guest({ name: 'Grandma June', count: '1', rsvp: 'Yes', diet: 'Low salt', bringing: 'Pumpkin pie' }),
        guest({ name: 'Aunt Carol + Jim', count: '2', rsvp: 'Yes', diet: 'Vegetarian (Carol)', bringing: 'Cheese board' }), guest({ name: 'The Garcias', count: '4', rsvp: 'Yes', diet: 'Nut allergy (Mia, 7)', bringing: 'Acorn squash' }),
        guest({ name: 'Uncle Ray', count: '1', rsvp: 'Yes', bringing: 'Cider + wine' }), guest({ name: 'Ben + Priya', count: '2', rsvp: 'Maybe', diet: 'Gluten-free (Priya)' }), guest({ name: 'Tom next door', count: '1', rsvp: 'Pending' })],
      menu: [dish({ course: 'Starter', name: 'Cheese board + crackers', who: 'Aunt Carol', diet: 'Vegetarian', note: 'GF crackers on the side' }),
        dish({ course: 'Main', name: 'Roast turkey + gravy', who: 'Chris', note: 'See the Turkey tab' }),
        dish({ course: 'Main', name: 'Stuffed acorn squash', who: 'The Garcias', diet: 'Vegetarian, nut-free', temp: '350', mins: '40' }),
        dish({ course: 'Side', name: 'Sausage + herb stuffing', who: 'Dana', temp: '350', mins: '30', note: 'Baked in a dish, not in the bird' }),
        dish({ course: 'Side', name: 'Mashed potatoes', who: 'Dana', diet: 'Vegetarian, GF', note: 'Stovetop · keep warm in the slow cooker' }),
        dish({ course: 'Side', name: 'Green bean casserole', who: 'Chris', diet: 'Vegetarian', temp: '350', mins: '25' }),
        dish({ course: 'Side', name: 'Sweet potato casserole', who: 'Dana', diet: 'Vegetarian, GF', temp: '350', mins: '30', note: 'No pecans — nut allergy' }),
        dish({ course: 'Side', name: 'Cranberry sauce', who: 'Dana', diet: 'Vegan, GF', note: 'Made Monday' }),
        dish({ course: 'Side', name: 'Dinner rolls', who: 'Chris', temp: '350', mins: '12' }),
        dish({ course: 'Dessert', name: 'Pumpkin pie', who: 'Grandma June', note: 'Baked the day before' }), dish({ course: 'Dessert', name: 'Apple crisp', who: '', diet: 'Nut-free' }),
        dish({ course: 'Drinks', name: 'Apple cider, wine, sparkling water', who: 'Uncle Ray' })],
      timeline: [step({ time: '13:00', text: 'Guests arrive · cheese board out', who: 'Dana' }), step({ time: '14:15', text: 'Potatoes on the stove', who: 'Dana' }), step({ time: '14:40', text: 'Gravy from the drippings', who: 'Chris' })],
      prep: STARTER.map(([w, t], i) => task(w, t, i % 2 ? 'Chris' : 'Dana', i < 5)),
      shopping: [buy('Turkey', '15 lb', 'Meat & fish', true), buy('Breakfast sausage', '1 lb', 'Meat & fish'), buy('Russet potatoes', '5 lb', 'Produce'), buy('Sweet potatoes', '4 lb', 'Produce'),
        buy('Green beans', '2 lb', 'Produce'), buy('Fresh cranberries', '2 bags', 'Produce', true), buy('Celery + onions', '', 'Produce'), buy('Butter', '4 sticks', 'Dairy'), buy('Heavy cream', '1 pint', 'Dairy'),
        buy('Chicken stock', '2 cartons', 'Pantry'), buy('Crispy fried onions', '1 can', 'Pantry'), buy('Dinner rolls', '2 dozen', 'Bakery'), buy('Aluminum foil + roasting bags', '', 'Household')],
      notes: 'Turkey goes in the fridge to thaw on Sunday — bottom shelf, on a tray.\n\nNut allergy at the table (Mia): no pecans on the sweet potatoes, check the pie crust.\n\nNext year: borrow a second oven rack.'
    };
    build(s);
    return s;
  }
  function normalize(s) {
    const e = s.event || {};
    s.event = { name: txt(e.name), host: txt(e.host), date: txt(e.date), arrive: txt(e.arrive), serve: txt(e.serve), place: txt(e.place), theme: txt(e.theme) };
    const t = s.turkey && typeof s.turkey === 'object' ? s.turkey : {};
    s.turkey = { heads: txt(t.heads), leftovers: !!t.leftovers, stuffed: !!t.stuffed, fresh: !!t.fresh, lbs: txt(t.lbs) };
    const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
    s.guests = arr(s.guests, x => guest({ id: txt(x.id) || P.uid(), name: txt(x.name), count: txt(x.count) || '1', rsvp: RSVP.includes(x.rsvp) ? x.rsvp : 'Pending', diet: txt(x.diet), bringing: txt(x.bringing) }));
    s.menu = arr(s.menu, x => dish({ id: txt(x.id) || P.uid(), course: COURSE[x.course] ? x.course : 'Other', name: txt(x.name), who: txt(x.who), diet: txt(x.diet), temp: txt(x.temp), mins: txt(x.mins), note: txt(x.note) }));
    s.timeline = arr(s.timeline, x => step({ id: txt(x.id) || P.uid(), time: txt(x.time), text: txt(x.text), who: txt(x.who), temp: txt(x.temp), mins: txt(x.mins), done: !!x.done, auto: !!x.auto }));
    s.prep = arr(s.prep, x => Object.assign(task(WHEN_OFF[x.when] != null ? x.when : '1w', txt(x.text), txt(x.who), x.done), { id: txt(x.id) || P.uid() }));
    s.shopping = arr(s.shopping, x => Object.assign(buy(txt(x.text), txt(x.qty), AISLES.includes(x.aisle) ? x.aisle : 'Other', x.done), { id: txt(x.id) || P.uid() }));
    s.notes = txt(s.notes);
    s.ui = s.ui || {};
    return s;
  }

  /* ---------- math ---------- */
  const heads = (s, r) => s.guests.filter(g => P.has(g.name) && (!r || g.rsvp === r)).reduce((a, g) => a + Math.max(1, Math.round(P.num(g.count) || 1)), 0);
  const dueDate = (s, w) => D.parse(s.event.date) ? D.add(s.event.date, WHEN_OFF[w]) : '';
  const openPrep = s => s.prep.filter(t => !t.done && P.has(t.text));
  const dishes = s => s.menu.filter(d => P.has(d.name));
  const covered = s => dishes(s).filter(d => P.has(d.who)).length;
  function bird(s) {
    const t = s.turkey, people = Math.round(P.num(t.heads)) || heads(s, 'Yes'), per = t.leftovers ? 1.5 : 1.25;
    const rec = Math.ceil(people * per), lbs = P.num(t.lbs) || rec;
    const rows = CHART[t.stuffed ? 'stuffed' : 'plain'], row = rows.find(r => lbs <= r[0]) || rows[rows.length - 1];
    const extra = lbs > 24 ? (lbs - 24) * 13 / 60 : 0;   // past the chart: about 13 more minutes a pound
    const low = Math.round((row[1] + extra) * 60), high = Math.round((row[2] + extra) * 60);
    const thaw = t.fresh || !lbs ? 0 : Math.ceil(lbs / 4), date = D.parse(s.event.date) ? s.event.date : '';
    const serve = D.mins(s.event.serve);
    const out = serve != null ? serve - REST : null, inAt = out != null ? out - high : null;
    return { people, per, rec, lbs, own: !!P.num(t.lbs), kg: Math.round(lbs * 0.4536 * 10) / 10, low, high, thaw, thawOn: thaw && date ? D.add(date, -thaw) : '',
      serve, out, inAt, check: inAt != null ? inAt + low : null };
  }
  /* oven steps on the timeline that overlap at different temperatures */
  function clashes(s) {
    const list = [];
    const oven = s.timeline.filter(x => P.num(x.mins) > 0 && P.num(x.temp) > 0 && D.mins(x.time) != null).map(x => ({ x, a: D.mins(x.time), z: D.mins(x.time) + P.num(x.mins), f: P.num(x.temp) }));
    oven.forEach((p, i) => oven.slice(i + 1).forEach(q => { if (p.f !== q.f && p.a < q.z && q.a < p.z) list.push([p, q]); }));
    return list;
  }
  /* rebuild the automatic steps: turkey in / check / out / carve, and every dish with oven minutes, counted back from dinner */
  function build(s) {
    const b = bird(s);
    s.timeline = s.timeline.filter(x => !x.auto);
    if (b.serve == null) return false;
    const add = (m, text, who, temp, mins) => s.timeline.push(step({ time: hm(m), text, who: who || '', temp: temp ? String(temp) : '', mins: mins ? String(mins) : '', auto: true }));
    const cook = (s.menu.find(d => /turkey/i.test(d.name)) || {}).who;
    if (b.lbs) {
      add(b.inAt, `Turkey in the oven — ${b.lbs} lb${s.turkey.stuffed ? ', stuffed' : ''}`, cook, TURKEY_F, b.high);
      add(b.check, 'Check the turkey: 165°F / 74°C in the thigh', cook);
      add(b.out, 'Turkey out — rest under foil', cook);
      add(b.serve - 10, 'Carve the turkey', cook);
    }
    dishes(s).filter(d => P.num(d.mins) > 0).forEach(d => add(b.serve - P.num(d.mins), `${d.name} in the oven`, d.who, P.num(d.temp) || '', P.num(d.mins)));
    add(b.serve, 'Dinner is served', '');
    return true;
  }
  const sorted = s => s.timeline.map((x, i) => Object.assign({ __i: i }, x)).sort((a, z) => (D.mins(a.time) == null ? 1e4 : D.mins(a.time)) - (D.mins(z.time) == null ? 1e4 : D.mins(z.time)));

  /* ---------- overview ---------- */
  const overview = {
    id: 'overview', label: 'Overview', icon: 'star',
    render(ctx) {
      const s = ctx.state, e = s.event, n = D.parse(e.date) ? D.diff(D.today(), e.date) : null;
      return `
      ${u.head({ eyebrow: e.host || 'Thanksgiving planner', title: e.name ? `<em>${esc(e.name)}</em>` : 'A calm <em>Thanksgiving</em>', meta: `${n != null && n >= 0 ? `<span class="y-sticker">${I('heart')}${n ? `${P.plural(n, 'day')} to go` : 'It’s today!'}</span>` : ''}<span>${[e.date && D.long(e.date), e.serve && `dinner ${D.time(e.serve)}`].filter(Boolean).map(esc).join(' · ')}</span>` })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        <div class="pl-7 tg-col">${u.panel('The turkey', '<div data-slot="bird"></div>', { icon: 'timer', actions: u.btn('Turkey', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'turkey' } }) })}
        ${u.panel('Your Thanksgiving', `<div class="pl-fields">
          ${u.field('Name', 'event.name', e.name, { ph: 'Thanksgiving at our place' })}${u.field('Hosts', 'event.host', e.host, { ph: 'Your names' })}
          ${u.field('The day', 'event.date', e.date, { type: 'date', rerender: true })}${u.field('Where', 'event.place', e.place, { ph: 'Home, Grandma’s…' })}
          ${u.field('Guests arrive', 'event.arrive', e.arrive, { type: 'time' })}${u.field('Dinner served', 'event.serve', e.serve, { type: 'time', rerender: true })}
          ${u.field('Plans & notes', 'event.theme', e.theme, { ph: 'Kids’ table, football, pie time…', cls: 'pl-wide' })}</div>`, { icon: 'edit' })}</div>
        <div class="pl-5 tg-col">${u.panel('Next up', '<div data-slot="next"></div>', { icon: 'check', actions: u.btn('Countdown', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'prep' } }) })}
        ${u.panel('Menu', '<div data-slot="menu"></div>', { icon: 'list', actions: u.btn('Menu', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'menu' } }) })}</div>
      </div>`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, n = D.parse(s.event.date) ? D.diff(D.today(), s.event.date) : null, open = openPrep(s).length, all = dishes(s).length, cov = covered(s), maybe = heads(s, 'Maybe');
        return u.kpis([
          ['Days to go', n == null ? '—' : n < 0 ? '0' : String(n), 'y-kpi--world', s.event.date ? esc(D.long(s.event.date)) : 'Set the day below'],
          ['Coming', String(heads(s, 'Yes')), '', maybe ? `+${maybe} maybe` : 'people with a yes'],
          ['Dishes covered', `${cov}<small>/${all}</small>`, all && cov === all ? 'is-good' : '', all - cov ? `${all - cov} still need a cook` : all ? 'Every dish has a name' : 'Add dishes on Menu'],
          ['Prep left', String(open), open ? '' : 'is-good', s.prep.length ? `${s.prep.length - open} done` : '']
        ]);
      },
      bird(ctx) {
        const s = ctx.state, b = bird(s);
        if (!b.lbs) return u.empty('timer', 'How big a turkey?', 'Add who’s coming on Guests — the bird size, thaw day and oven time fill in.', u.btn('Add guests', { kind: 'world', icon: 'user', act: 'go', data: { page: 'guests' } }));
        return `<dl class="tg-facts">
          <div><dt>Buy</dt><dd class="y-num">${b.lbs} lb <small>${b.kg} kg</small></dd><p>${b.own ? 'the bird you bought' : `for ${P.plural(b.people, 'person', 'people')}`}</p></div>
          <div><dt>Thaw from</dt><dd class="y-num">${b.thawOn ? esc(D.fmt(b.thawOn)) : '—'}</dd><p>${s.turkey.fresh ? 'fresh, no thawing' : `${P.plural(b.thaw, 'day')} in the fridge`}</p></div>
          <div><dt>In the oven</dt><dd class="y-num">${b.inAt != null ? esc(D.time(hm(b.inAt))) : '—'}</dd><p>${b.inAt != null ? `${deg(TURKEY_F)}` : 'set the dinner time'}</p></div></dl>`;
      },
      next(ctx) {
        const s = ctx.state, b = bird(s), list = openPrep(s).sort((a, z) => WHEN_OFF[a.when] - WHEN_OFF[z.when]).slice(0, 5), t = D.today();
        const thaw = b.thawOn && b.thawOn >= t ? u.banner('info', `Move the turkey to the fridge to thaw on <b>${esc(D.long(b.thawOn))}</b>.`) : '';
        if (!list.length) return thaw + (s.prep.length ? '<p class="pl-muted">All prep done. Enjoy it!</p>' : u.empty('calendar', 'No countdown yet', 'Start from a three-week Thanksgiving countdown.', u.btn('Add starter countdown', { kind: 'world', icon: 'sparkle', act: 'starter' })));
        return `${thaw}<ul class="pl-checklist">${list.map(x => { const i = s.prep.indexOf(x), d = dueDate(s, x.when); return `<li class="pl-ci">${u.tick(`prep.${i}.done`, x.done, `Done: ${x.text}`, { rerender: true })}<div class="pl-ci-main"><span class="pl-ci-text">${esc(x.text)}</span><span class="pl-ci-meta">${d ? esc(D.short(d)) : esc(WHEN.find(w => w[0] === x.when)[1])}${d && d < t ? ' ' + u.pill('overdue', 'bad') : ''}${x.who ? ` · ${esc(x.who)}` : ''}</span></div></li>`; }).join('')}</ul>`;
      },
      menu(ctx) {
        const s = ctx.state, list = dishes(s);
        if (!list.length) return u.empty('list', 'No dishes yet', 'Turkey first, then sides, desserts and drinks.', u.btn('Plan the menu', { kind: 'world', icon: 'list', act: 'go', data: { page: 'menu' } }));
        return `<ul class="tg-menu">${COURSES.map(([c, l]) => { const d = list.filter(x => x.course === c); return d.length ? `<li><b>${esc(l)}</b><span>${d.map(x => `${esc(x.name)}${x.who ? '' : ' <i class="tg-need">needs a cook</i>'}`).join(' · ')}</span></li>` : ''; }).join('')}</ul>`;
      }
    },
    actions: { starter: starterAct }
  };
  function starterAct(ctx) { const s = ctx.state, have = new Set(s.prep.map(p => p.text.toLowerCase())); STARTER.forEach(([w, t]) => { if (!have.has(t.toLowerCase())) s.prep.push(task(w, t)); }); ctx.toast('Starter countdown added'); }

  /* ---------- guests ---------- */
  const guests = {
    id: 'guests', label: 'Guests', icon: 'user',
    render(ctx) {
      const s = ctx.state, maybe = heads(s, 'Maybe');
      return `${u.head({ eyebrow: 'Who’s coming', title: `<em>${heads(s, 'Yes')}</em> coming`, lede: `One row per household — count yourselves too. “People” is everyone in it, kids included.${maybe ? ` ${esc(P.plural(maybe, 'more person', 'more people'))} on maybe.` : ''}` })}
      ${u.panel('', `${u.quickAdd('guests', { key: 'name', ph: 'Add a household — e.g. “Aunt Carol + Jim”', label: 'Add guests', kind: 'world' })}
        <div class="tg-gap"></div>
        ${u.table('guests', s.guests, [
          { k: 'name', label: 'Guest / household', title: true, w: '1.3fr', ph: 'Name' },
          { k: 'count', label: 'People', num: true, w: '80px', ph: '1' },
          { k: 'rsvp', label: 'RSVP', type: 'select', options: RSVP, w: '118px', rerender: true },
          { k: 'diet', label: 'Dietary needs', w: '1fr', ph: 'Allergies, vegetarian…' },
          { k: 'bringing', label: 'Bringing', w: '1fr', ph: 'Optional' }
        ], { what: 'guest', empty: 'Type a name above and press Enter.' })}`)}`;
    }
  };

  /* ---------- menu ---------- */
  const menu = {
    id: 'menu', label: 'Menu', icon: 'list',
    badge: ctx => { const s = ctx.state, n = dishes(s).length - covered(s); return n || ''; },
    render(ctx) {
      const s = ctx.state, diets = s.guests.filter(g => g.rsvp !== 'No' && P.has(g.diet)).map(g => `${g.name}: ${g.diet}`);
      return `${u.head({ eyebrow: 'Thanksgiving dinner', title: 'Menu', lede: 'Every dish, who makes it and what it’s safe for. Give oven dishes a temperature and minutes — the timeline uses them.' })}
      ${diets.length ? u.banner('warn', `<b>Dietary needs:</b> ${diets.map(esc).join(' · ')}`) : ''}
      ${COURSES.map(([c, l]) => { const list = s.menu.map((d, i) => Object.assign({ __i: i }, d)).filter(d => d.course === c); return list.length ? u.panel(l, u.table('menu', list, [
        { k: 'name', label: 'Dish', title: true, w: '1.4fr', ph: 'Dish' }, { k: 'course', label: 'Course', type: 'select', options: COURSES, w: '138px', rerender: true },
        { k: 'who', label: 'Who makes it', w: '128px', ph: 'Name' }, { k: 'diet', label: 'Safe for', w: '1fr', ph: 'Vegetarian, GF…' },
        { k: 'temp', label: 'Oven °F', num: true, w: '84px', ph: '—' }, { k: 'mins', label: 'Minutes', num: true, w: '84px', ph: '—' }, { k: 'note', label: 'Notes', w: '1fr', ph: 'Make ahead, reheat…' }
      ], { index: d => d.__i, total: s.menu.length, what: 'dish', cls: 'tg-mtab' }), { icon: 'star', cls: 'y-panel--flat' }) : ''; }).join('')}
      ${s.menu.length ? '' : u.empty('list', 'No dishes yet', 'Start with the turkey, then sides, desserts and drinks.')}
      <div class="pl-row">${COURSES.slice(0, 5).map(([c, l]) => u.btn(`Add ${c === 'Main' ? 'main' : l.toLowerCase().replace(/s$/, '')}`, { sm: true, icon: 'plus', act: 'addDish', data: { course: c } })).join('')}</div>`;
    },
    actions: { addDish(ctx, d) { const s = ctx.state; s.menu.push(dish({ course: d.course })); ctx.focus(`[data-bind="menu.${s.menu.length - 1}.name"]`); } }
  };

  /* ---------- turkey ---------- */
  const turkey = {
    id: 'turkey', label: 'Turkey', icon: 'timer',
    render(ctx) {
      const s = ctx.state, t = s.turkey, from = heads(s, 'Yes');
      return `${u.head({ eyebrow: 'Turkey calculator', title: '<span data-slot="title"></span>', lede: 'How big a bird, when it goes in the fridge to thaw and when it goes in the oven — counted back from dinner.' })}
      <div class="pl-grid">
        ${u.panel('Your bird', `<div class="pl-stack">
          <div class="pl-fields">${u.field('People eating', 'turkey.heads', t.heads, { num: true, ph: from ? `${from} from guests` : '12', hint: from ? `Leave empty to use the ${from} with a yes.` : 'Or add guests with a yes.' })}
            ${u.field('Bird you bought (lb)', 'turkey.lbs', t.lbs, { num: true, ph: 'optional', optional: true, hint: 'Leave empty to use the suggested size.' })}</div>
          ${u.switch('turkey.leftovers', t.leftovers, 'Leftovers for everyone (1.5 lb a person)')}
          ${u.switch('turkey.stuffed', t.stuffed, 'Stuffing inside the bird')}
          ${u.switch('turkey.fresh', t.fresh, 'Fresh, not frozen (no thawing)')}
          ${u.field('Dinner served', 'event.serve', s.event.serve, { type: 'time', rerender: true })}</div>`, { icon: 'edit', cls: 'pl-5' })}
        ${u.panel('The plan', '<div data-slot="plan"></div>', { icon: 'calendar', cls: 'pl-7 tg-planpanel', actions: u.btn('Put it on the timeline', { sm: true, kind: 'world', icon: 'next', act: 'build' }) })}
      </div>
      ${u.banner('warn', 'Times are estimates for an oven at 325°F / 165°C. The turkey is done when a meat thermometer reads <b>165°F / 74°C</b> in the thickest part of the thigh and breast — and in the center of the stuffing.')}`;
    },
    slots: {
      title(ctx) { const b = bird(ctx.state); return b.lbs ? `<em>${b.lbs} lb</em> turkey${b.own ? '' : ` for ${b.people}`}` : 'Your <em>turkey</em>'; },
      plan(ctx) {
        const s = ctx.state, b = bird(s);
        if (!b.lbs) return u.empty('timer', 'Who’s eating?', 'Type the number of people, or add guests with a yes.');
        const row = (k, label, val, sub) => `<li class="tg-step tg-step--${k}"><span class="tg-step-ico">${I(k === 'buy' ? 'list' : k === 'thaw' ? 'calendar' : k === 'eat' ? 'heart' : 'timer')}</span><span class="tg-step-label">${label}</span><b class="tg-step-val y-num">${val}</b><span class="tg-step-sub">${sub}</span></li>`;
        return `<ol class="tg-plan">
          ${row('buy', 'Buy', `${b.lbs} lb <small>${b.kg} kg</small>`, b.own ? `suggested ${b.rec} lb for ${P.plural(b.people, 'person', 'people')}` : `${b.per} lb × ${P.plural(b.people, 'person', 'people')}, bones included`)}
          ${row('thaw', 'Thaw in the fridge', s.turkey.fresh ? 'No thawing' : b.thawOn ? esc(D.long(b.thawOn)) : P.plural(b.thaw, 'day'), s.turkey.fresh ? 'keep it cold until it goes in' : `${P.plural(b.thaw, 'day')} — about a day for every 4 lb`)}
          ${row('roast', 'Roast', `${esc(dur(b.low))}–${esc(dur(b.high))}`, `at ${deg(TURKEY_F)}${s.turkey.stuffed ? ', stuffed' : ', unstuffed'}`)}
          ${b.inAt != null ? `${row('in', 'In the oven', esc(D.time(hm(b.inAt))), `start checking the temperature at ${esc(D.time(hm(b.check)))}`)}
          ${row('out', 'Out + rest', esc(D.time(hm(b.out))), `${REST} min under foil, then carve`)}
          ${row('eat', 'Dinner', esc(D.time(hm(b.serve))), esc(D.long(s.event.date) || ''))}` : `<li class="tg-step"><span class="pl-muted">Set the dinner time to see when it goes in.</span></li>`}
        </ol>`;
      }
    },
    actions: { build: buildAct }
  };
  function buildAct(ctx) {
    if (!build(ctx.state)) { ctx.toast('Set the dinner time first'); return; }
    ctx.toast('Timeline built from the menu + turkey'); ctx.go('timeline');
  }

  /* ---------- timeline ---------- */
  const timeline = {
    id: 'timeline', label: 'Timeline', icon: 'calendar',
    render(ctx) {
      const s = ctx.state, b = bird(s);
      return `${u.head({ eyebrow: 'Thanksgiving Day', title: s.event.serve ? `Dinner at <em>${esc(D.time(s.event.serve))}</em>` : 'The <em>timeline</em>', lede: 'The turkey and every oven dish counted back from dinner. Add your own steps — they stay when you rebuild.' })}
      <div class="pl-row tg-tools">${u.btn('Build from menu + turkey', { kind: 'world', icon: 'sparkle', act: 'build' })}${u.btn('Add a step', { icon: 'plus', act: 'addStep' })}</div>
      <div data-slot="clash"></div>
      ${u.panel('', s.timeline.length ? u.table('timeline', sorted(s), [
        { k: 'time', label: 'Time', type: 'time', w: '120px' },
        { k: 'text', label: 'Step', title: true, w: '1.6fr', ph: 'What happens' },
        { k: 'who', label: 'Who', w: '120px', ph: 'Name' },
        { k: 'temp', label: 'Oven °F', num: true, w: '84px', ph: '—' },
        { k: 'mins', label: 'Minutes', num: true, w: '84px', ph: '—' },
        { k: 'done', label: 'Done', type: 'check', w: '64px', rerender: true }
      ], { index: x => x.__i, total: s.timeline.length, what: 'step', cls: 'tg-ttab', rowClass: x => `${x.done ? 'is-done' : ''}${P.num(x.mins) > 0 ? ' tg-oven' : ''}` })
        : u.empty('calendar', 'No timeline yet', b.serve == null ? 'Set the dinner time, then build it from the menu and the turkey.' : 'Build it from the menu and the turkey, then add your own steps.'), { cls: 'tg-tpanel' })}`;
    },
    slots: {
      clash(ctx) {
        const c = clashes(ctx.state);
        if (!c.length) return ctx.state.timeline.some(x => P.num(x.mins) > 0) ? u.banner('good', 'No oven clashes: everything in the oven at the same time shares one temperature.') : '';
        return u.banner('warn', `<b>Oven clash:</b> ${c.slice(0, 3).map(([p, q]) => `${esc(p.x.text.replace(/ in the oven.*$/, ''))} (${p.f}°F) and ${esc(q.x.text.replace(/ in the oven.*$/, ''))} (${q.f}°F) overlap ${esc(D.time(hm(Math.max(p.a, q.a))))}–${esc(D.time(hm(Math.min(p.z, q.z))))}`).join(' · ')}. Use one temperature, a second oven or move one dish.`);
      }
    },
    actions: { build: buildAct, addStep(ctx) { const s = ctx.state; s.timeline.push(step()); ctx.focus(`[data-bind="timeline.${s.timeline.length - 1}.text"]`); } }
  };

  /* ---------- countdown ---------- */
  const prep = {
    id: 'prep', label: 'Countdown', icon: 'check',
    badge: ctx => { const s = ctx.state, t = D.today(); const n = openPrep(s).filter(x => { const d = dueDate(s, x.when); return d && d <= t; }).length; return n || ''; },
    render(ctx) {
      const s = ctx.state, t = D.today(), b = bird(s);
      return `${u.head({ eyebrow: 'Three-week countdown', title: 'A little <em>each week</em>', lede: D.parse(s.event.date) ? `Dates count back from ${esc(D.long(s.event.date))}.` : 'Set the day on the Overview to see real due dates.' })}
      ${b.thawOn ? u.banner('info', `Turkey to the fridge to thaw: <b>${esc(D.long(b.thawOn))}</b> (${esc(P.plural(b.thaw, 'day'))} for ${b.lbs} lb).`) : ''}
      ${s.prep.length ? '' : u.empty('calendar', 'No tasks yet', 'Start from a classic Thanksgiving countdown and make it yours.', u.btn('Add starter countdown', { kind: 'world', icon: 'sparkle', act: 'starter' }))}
      <div class="tg-when">${WHEN.map(([k, label]) => {
        const list = s.prep.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.when === k), d = dueDate(s, k);
        const done = list.filter(x => x.done).length;
        return u.panel(label, `${u.checklist('prep', list, { index: x => x.__i, total: s.prep.length, ph: 'Task', what: 'task', meta: x => `${u.select(`prep.${x.__i}.when`, x.when, WHEN.map(w => [w[0], w[1]]), { label: 'When', cls: 'tg-mini', rerender: true })}${u.input(`prep.${x.__i}.who`, x.who, { label: 'Who', ph: 'Who', cls: 'tg-who' })}` })}
          <div class="pl-list-foot">${u.btn('Add task', { sm: true, icon: 'plus', act: 'addTask', data: { when: k } })}</div>`, { icon: 'calendar', cls: `y-panel--flat${d && d < t && done < list.length ? ' tg-late' : ''}`, actions: `${d ? `<span class="pl-pill${d === t ? ' pl-pill--world' : ''}">${esc(D.fmt(d))}</span>` : ''}${list.length ? `<span class="pl-pill${done === list.length ? ' pl-pill--good' : ''}">${done}/${list.length}</span>` : ''}` });
      }).join('')}</div>
      <div class="tg-gap"></div>${u.notes('notes', s.notes, { title: 'Notes', rows: 6, ph: 'Family traditions, who sits where, what to change next year…' })}`;
    },
    actions: { starter: starterAct, addTask(ctx, d) { const s = ctx.state; s.prep.push(task(d.when)); ctx.focus(`[data-bind="prep.${s.prep.length - 1}.text"]`); } }
  };

  /* ---------- shopping ---------- */
  const shopping = {
    id: 'shopping', label: 'Shopping', icon: 'list',
    badge: ctx => { const n = ctx.state.shopping.filter(x => !x.done && P.has(x.text)).length; return n || ''; },
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Grocery list', title: `<em>${s.shopping.filter(x => !x.done && P.has(x.text)).length}</em> to buy`, lede: 'Grouped by aisle so it’s one lap of the store.' })}
      ${u.panel('', `${u.quickAdd('shopping', { ph: 'Add an item and press Enter', label: 'Add a shopping item', kind: 'world' })}
        ${AISLES.map(a => { const list = s.shopping.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.aisle === a); return list.length ? `<section class="tg-aisle"><h3>${esc(a)}</h3>${u.checklist('shopping', list, { index: x => x.__i, total: s.shopping.length, ph: 'Item', what: 'item', extra: x => `${u.input(`shopping.${x.__i}.qty`, x.qty, { label: `Quantity of ${x.text}`, ph: 'Qty', cls: 'tg-qty' })}${u.select(`shopping.${x.__i}.aisle`, x.aisle, AISLES, { label: `Aisle for ${x.text}`, cls: 'tg-mini tg-aisle-sel', rerender: true })}` })}</section>` : ''; }).join('')}`)}`;
    }
  };

  /* ---------- print: one host sheet ---------- */
  function hostSheet(ctx) {
    const s = ctx.state, e = s.event, b = bird(s);
    return `<h1>${esc(e.name || 'Thanksgiving dinner')}</h1><p class="pl-sheet-meta">${[e.date && D.long(e.date), e.arrive && `Guests ${D.time(e.arrive)}`, e.serve && `Dinner ${D.time(e.serve)}`, e.place, `${heads(s, 'Yes')} coming`].filter(Boolean).map(esc).join(' · ')}</p>
      ${b.lbs ? `<h2>Turkey</h2><p>${b.lbs} lb · ${s.turkey.fresh ? 'fresh' : `thaw in the fridge from ${esc(D.long(b.thawOn))}`} · roast ${esc(dur(b.low))}–${esc(dur(b.high))} at ${deg(TURKEY_F)}${b.inAt != null ? ` · in at ${esc(D.time(hm(b.inAt)))}, out at ${esc(D.time(hm(b.out)))}` : ''} · done at 165°F / 74°C</p>` : ''}
      <h2>Timeline</h2><table><tbody>${sorted(s).filter(x => P.has(x.text)).map(x => `<tr><td style="width:6mm"><span class="pl-box${x.done ? ' is-on' : ''}"></span></td><td style="width:22mm">${esc(D.time(x.time))}</td><td><b>${esc(x.text)}</b></td><td>${esc(x.who)}</td><td style="width:26mm">${P.num(x.temp) ? esc(`${P.num(x.temp)}°F`) : ''}${P.num(x.mins) ? esc(` · ${P.num(x.mins)} min`) : ''}</td></tr>`).join('')}</tbody></table>
      <h2>Menu</h2><table><tbody>${dishes(s).map(d => `<tr><td style="width:28mm">${esc(COURSE[d.course])}</td><td><b>${esc(d.name)}</b></td><td>${esc(d.who)}</td><td>${esc(d.diet)}</td><td>${esc(d.note)}</td></tr>`).join('')}</tbody></table>
      <h2>Shopping</h2><table><tbody>${s.shopping.filter(x => P.has(x.text) && !x.done).map(x => `<tr><td style="width:6mm"><span class="pl-box"></span></td><td>${esc(x.text)}</td><td>${esc(x.qty)}</td><td>${esc(x.aisle)}</td></tr>`).join('')}</tbody></table>`;
  }
  function prepSheet(ctx) {
    const s = ctx.state;
    return `<h1>Thanksgiving countdown</h1><p class="pl-sheet-meta">${s.event.date ? esc(D.long(s.event.date)) : ''}</p>
      <table><tbody>${WHEN.map(([k, l]) => s.prep.filter(x => x.when === k && P.has(x.text)).map(x => `<tr><td style="width:6mm"><span class="pl-box${x.done ? ' is-on' : ''}"></span></td><td>${esc(x.text)}</td><td>${esc(l)}${dueDate(s, k) ? ' · ' + esc(D.short(dueDate(s, k))) : ''}</td><td>${esc(x.who)}</td></tr>`).join('')).join('')}</tbody></table>`;
  }
  [overview, guests, menu, turkey, timeline, shopping].forEach(p => { p.sheet = hostSheet; });
  prep.sheet = prepSheet;

  P.create({
    slug: 'thanksgiving-planner-app', name: 'Thanksgiving Planner', world: 'harvest',
    welcome: 'Add who’s coming and the dinner time — the turkey size, thaw day and oven timeline fill in.',
    pages: [overview, guests, menu, turkey, timeline, prep, shopping],
    blank, sample, normalize,
    rows: { guests: () => guest(), menu: () => dish(), timeline: () => step(), prep: () => task(), shopping: () => buy() },
    accepts: d => d && typeof d === 'object' && ('turkey' in d || 'menu' in d || 'event' in d),
    about: '<p><b>Thanksgiving Planner</b> keeps the whole dinner in one place: who’s coming and their dietary needs, the menu with a name on every dish, a turkey calculator (bird size, the day to start thawing, roasting time and when it goes in the oven), a day-of timeline counted back from dinner that flags oven clashes, a three-week countdown with real dates and a grocery list by aisle.</p>',
    disclaimer: 'Thanksgiving Planner is a personal planning tool. Roasting times are estimates — always check the turkey with a meat thermometer (165°F / 74°C) and follow food-safety guidance for thawing and leftovers. Check allergy information yourself.'
  });
})();
