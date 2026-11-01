/* Christmas Planner App — gifts, holiday budget, cards, guests, menu, prep countdown and shopping. Yaykit planner engine, holiday world (defined in christmas.css). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const GROUPS = ['Family', 'Kids', 'Friends', 'Work', 'Other'];
  const STATUS = ['Idea', 'Ordered', 'Bought', 'Wrapped', 'Given'];
  const PAID = new Set(['Ordered', 'Bought', 'Wrapped', 'Given']);
  const RSVP = ['Pending', 'Yes', 'Maybe', 'No'];
  const COURSES = ['Starter', 'Main', 'Side', 'Dessert', 'Drinks', 'Other'];
  const WHEN = [['6w', '6 weeks out', -42], ['4w', '4 weeks out', -28], ['2w', '2 weeks out', -14], ['1w', '1 week out', -7], ['3d', '3 days out', -3], ['1d', 'Day before', -1], ['day', 'On the day', 0], ['after', 'After', 1]];
  const WHEN_OFF = Object.fromEntries(WHEN.map(w => [w[0], w[2]]));
  const AISLES = ['Produce', 'Meat & fish', 'Dairy', 'Bakery', 'Pantry', 'Drinks', 'Household', 'Other'];
  const CATS = ['Food & drinks', 'Decorations & tree', 'Cards & postage', 'Wrapping & stockings', 'Travel', 'Outings & events', 'Giving & donations'];
  const txt = v => (v == null ? '' : String(v));
  const r2 = n => Math.round(n * 100) / 100;

  const person = o => Object.assign({ id: P.uid(), name: '', group: 'Family', budget: '' }, o || {});
  const gift = o => Object.assign({ id: P.uid(), pid: '', text: '', where: '', price: '', status: 'Idea' }, o || {});
  const cat = (name, budget, spent) => ({ id: P.uid(), name: name || '', budget: txt(budget), spent: txt(spent) });
  const card = o => Object.assign({ id: P.uid(), name: '', address: '', sent: false, got: false }, o || {});
  const guest = o => Object.assign({ id: P.uid(), name: '', count: '1', rsvp: 'Pending', diet: '', bringing: '' }, o || {});
  const dish = o => Object.assign({ id: P.uid(), course: 'Main', name: '', who: '', diet: '', note: '' }, o || {});
  const task = (when, text, who, done) => ({ id: P.uid(), when: when || '1w', text: text || '', who: who || '', done: !!done });
  const buy = (text, qty, aisle, done) => ({ id: P.uid(), text: text || '', qty: qty || '', aisle: aisle || 'Other', done: !!done });
  const STARTER = [
    ['6w', 'Set the holiday budget'], ['6w', 'Make the gift list for everyone'], ['6w', 'Decide who hosts + book travel'],
    ['4w', 'Order or make Christmas cards'], ['4w', 'Order gifts that ship'], ['4w', 'Plan decorations + the tree'],
    ['2w', 'Mail the cards'], ['2w', 'Send dinner invites + ask about dietary needs'], ['2w', 'Plan the menu'], ['2w', 'Last online orders — check shipping dates'],
    ['1w', 'Wrap gifts'], ['1w', 'Order the roast / specialty items'], ['1w', 'Check chairs, plates, glasses'], ['1w', 'Confirm “maybe” guests'],
    ['3d', 'Big grocery shop'], ['3d', 'Make ahead: desserts, sauces, soup'],
    ['1d', 'Set the table'], ['1d', 'Thaw anything frozen'], ['1d', 'Stockings + gifts under the tree'],
    ['day', 'Oven schedule on the fridge'], ['day', 'Candles, music, coats area'],
    ['after', 'Thank-you notes'], ['after', 'Returns + exchanges'], ['after', 'Note what to change next year']
  ];

  function nextXmas() { const y = new Date().getFullYear(); return D.today() > `${y}-12-25` ? `${y + 1}-12-25` : `${y}-12-25`; }
  function blank() {
    return { event: { name: '', host: '', date: nextXmas(), arrive: '', serve: '', place: '', theme: '' }, budget: { total: '', cats: CATS.map(c => cat(c)) },
      people: [], gifts: [], cards: [], guests: [], menu: [], prep: [], shopping: [], notes: '' };
  }
  function sample() {
    const p = [person({ name: 'Mom', group: 'Family', budget: '80' }), person({ name: 'Dad', group: 'Family', budget: '80' }), person({ name: 'Emma (9)', group: 'Kids', budget: '120' }),
      person({ name: 'Leo (6)', group: 'Kids', budget: '120' }), person({ name: 'Grandma Rose', group: 'Family', budget: '50' }), person({ name: 'Sam + Riley', group: 'Friends', budget: '40' }), person({ name: 'Office Secret Santa', group: 'Work', budget: '25' })];
    const g = (i, text, where, price, status) => gift({ pid: p[i].id, text, where, price, status });
    return {
      event: { name: 'Christmas at our place', host: 'The Parker family', date: nextXmas(), arrive: '13:00', serve: '15:00', place: 'Home · 12 Cedar Street', theme: 'Evergreen + candlelight · kids’ table in the sunroom' },
      budget: { total: '1500', cats: [cat('Food & drinks', '250', '64.50'), cat('Decorations & tree', '120', '95'), cat('Cards & postage', '60', '48.20'), cat('Wrapping & stockings', '50', '22'), cat('Travel', '0', ''), cat('Outings & events', '90', '36'), cat('Giving & donations', '75', '50')] },
      people: p,
      gifts: [
        g(0, 'Cozy knit throw', 'Target', '39', 'Wrapped'), g(0, 'Photo book of the year', 'Shutterfly', '32', 'Ordered'),
        g(1, 'Grill tool set', 'Home Depot', '45', 'Bought'), g(1, 'Coffee sampler', '', '24', 'Idea'),
        g(2, 'LEGO Friends set', 'Amazon', '49.99', 'Wrapped'), g(2, 'Art kit + sketchbook', 'Michaels', '28', 'Bought'), g(2, 'Book: The Wild Robot', '', '9.99', 'Idea'),
        g(3, 'Remote-control truck', 'Walmart', '42', 'Bought'), g(3, 'Dinosaur pajamas', 'Old Navy', '19', 'Idea'),
        g(4, 'Framed family photo', 'Etsy', '35', 'Ordered'),
        g(5, 'Candle + cocoa basket', 'Local market', '30', 'Idea'),
        g(6, 'Mug + gourmet hot chocolate', 'Target', '20', 'Bought')
      ],
      cards: [card({ name: 'Grandma Rose', address: '45 Oak Lane, Springfield, IL 62704', sent: true }), card({ name: 'Aunt Lisa + family', address: '210 Lake Dr, Madison, WI 53703', sent: true, got: true }),
        card({ name: 'The Nguyens', address: '88 Pine St, Denver, CO 80203' }), card({ name: 'Coach Miller', address: '' }), card({ name: 'Sam + Riley', address: '3 Birch Ct, Austin, TX 78701', got: true }), card({ name: 'Neighbors at no. 14', address: 'Hand deliver' })],
      guests: [guest({ name: 'Grandma Rose', count: '1', rsvp: 'Yes', diet: 'Low salt' }), guest({ name: 'Aunt Lisa + family', count: '4', rsvp: 'Yes', diet: 'Vegetarian (Lisa)', bringing: 'Mushroom wellington' }),
        guest({ name: 'Sam + Riley', count: '2', rsvp: 'Maybe', diet: 'Nut allergy (Riley)', bringing: 'Wine' }), guest({ name: 'Uncle Mark', count: '1', rsvp: 'Pending' })],
      menu: [dish({ course: 'Starter', name: 'Butternut squash soup', who: 'Mom', diet: 'Vegetarian, GF', note: 'Make ahead, reheat gently' }), dish({ course: 'Main', name: 'Glazed ham', who: 'Dad', note: 'In at 12:30 · rest 20 min' }),
        dish({ course: 'Main', name: 'Mushroom wellington', who: 'Aunt Lisa', diet: 'Vegetarian' }), dish({ course: 'Side', name: 'Garlic mashed potatoes', who: 'Mom', diet: 'Vegetarian, GF' }),
        dish({ course: 'Side', name: 'Roasted sprouts + cranberries', who: 'Dad', diet: 'Vegan, nut-free' }), dish({ course: 'Dessert', name: 'Gingerbread cake', who: 'Emma + Mom', note: 'No nuts' }),
        dish({ course: 'Drinks', name: 'Mulled cider, wine, cocoa for kids', who: 'Hosts' })],
      prep: STARTER.map(([w, t], i) => task(w, t, i % 2 ? 'Dad' : 'Mom', i < 3)),
      shopping: [buy('Spiral ham', '1', 'Meat & fish', true), buy('Butternut squash', '2', 'Produce'), buy('Potatoes', '5 lb', 'Produce'), buy('Brussels sprouts', '2 lb', 'Produce'), buy('Cranberries', '1 bag', 'Produce'),
        buy('Butter', '2 sticks', 'Dairy'), buy('Heavy cream', '1 pint', 'Dairy'), buy('Apple cider', '1 gal', 'Drinks'), buy('Wrapping paper + tape', '', 'Household', true), buy('Napkins', '1 pack', 'Household')],
      notes: 'Oven plan: ham 12:30–14:40 → potatoes + sprouts 14:00 → cake warms while we eat.\n\nNut allergy at the table — no nuts anywhere, check the cake decorations.\n\nNext year: order the photo book before Dec 1.'
    };
  }
  function normalize(s) {
    const e = s.event || {};
    s.event = { name: txt(e.name), host: txt(e.host), date: txt(e.date), arrive: txt(e.arrive), serve: txt(e.serve), place: txt(e.place), theme: txt(e.theme) };
    const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
    const b = s.budget && typeof s.budget === 'object' ? s.budget : {};
    s.budget = { total: txt(b.total), cats: arr(b.cats, x => Object.assign(cat(txt(x.name), x.budget, x.spent), { id: txt(x.id) || P.uid() })) };
    s.people = arr(s.people, x => person({ id: txt(x.id) || P.uid(), name: txt(x.name), group: GROUPS.includes(x.group) ? x.group : 'Other', budget: txt(x.budget) }));
    s.gifts = arr(s.gifts, x => gift({ id: txt(x.id) || P.uid(), pid: txt(x.pid), text: txt(x.text), where: txt(x.where), price: txt(x.price), status: STATUS.includes(x.status) ? x.status : 'Idea' }));
    s.cards = arr(s.cards, x => card({ id: txt(x.id) || P.uid(), name: txt(x.name), address: txt(x.address), sent: !!x.sent, got: !!x.got }));
    s.guests = arr(s.guests, x => guest({ id: txt(x.id) || P.uid(), name: txt(x.name), count: txt(x.count) || '1', rsvp: RSVP.includes(x.rsvp) ? x.rsvp : 'Pending', diet: txt(x.diet), bringing: txt(x.bringing) }));
    s.menu = arr(s.menu, x => dish({ id: txt(x.id) || P.uid(), course: COURSES.includes(x.course) ? x.course : 'Other', name: txt(x.name), who: txt(x.who), diet: txt(x.diet), note: txt(x.note) }));
    s.prep = arr(s.prep, x => Object.assign(task(WHEN_OFF[x.when] != null ? x.when : '1w', txt(x.text), txt(x.who), x.done), { id: txt(x.id) || P.uid() }));
    s.shopping = arr(s.shopping, x => Object.assign(buy(txt(x.text), txt(x.qty), AISLES.includes(x.aisle) ? x.aisle : 'Other', x.done), { id: txt(x.id) || P.uid() }));
    s.notes = txt(s.notes);
    s.ui = s.ui || {};
    if (!['all', 'buy', 'wrap'].includes(s.ui.giftView)) s.ui.giftView = 'all';
    return s;
  }

  /* ---------- math ---------- */
  const heads = (s, r) => s.guests.filter(g => P.has(g.name) && (!r || g.rsvp === r)).reduce((a, g) => a + Math.max(1, Math.round(P.num(g.count) || 1)), 0);
  const dueDate = (s, w) => D.parse(s.event.date) ? D.add(s.event.date, WHEN_OFF[w]) : '';
  const openPrep = s => s.prep.filter(t => !t.done && P.has(t.text));
  const realGifts = s => s.gifts.filter(x => P.has(x.text));
  const paid = x => (PAID.has(x.status) ? P.num(x.price) : 0);
  const ready = x => x.status === 'Wrapped' || x.status === 'Given';
  function giftMath(s, pid) {
    const list = realGifts(s).filter(x => pid == null || x.pid === pid);
    const p = pid != null ? s.people.find(x => x.id === pid) : null;
    return {
      n: list.length, toBuy: list.filter(x => x.status === 'Idea').length, done: list.filter(ready).length,
      spent: r2(list.reduce((a, x) => a + paid(x), 0)), planned: r2(list.reduce((a, x) => a + P.num(x.price), 0)),
      budget: p ? P.num(p.budget) : r2(s.people.reduce((a, x) => a + P.num(x.budget), 0))
    };
  }
  function money(s) {
    const g = giftMath(s), total = P.num(s.budget.total);
    const catBudget = r2(s.budget.cats.reduce((a, c) => a + P.num(c.budget), 0)), catSpent = r2(s.budget.cats.reduce((a, c) => a + P.num(c.spent), 0));
    const allocated = r2(g.budget + catBudget), spent = r2(g.spent + catSpent), base = total || allocated;
    return { total, allocated, spent, base, left: r2(base - spent), gap: r2(total - allocated), gift: g, pct: base ? spent / base * 100 : 0 };
  }
  const orphan = s => { const ids = new Set(s.people.map(p => p.id)); return s.gifts.map((x, i) => Object.assign({ __i: i }, x)).filter(x => !ids.has(x.pid)); };
  const toSend = s => s.cards.filter(c => P.has(c.name) && !c.sent).length;

  /* ---------- overview ---------- */
  const overview = {
    id: 'overview', label: 'Overview', icon: 'star',
    render(ctx) {
      const s = ctx.state, e = s.event, n = D.parse(e.date) ? D.diff(D.today(), e.date) : null;
      return `
      ${u.head({ eyebrow: e.host || 'Christmas planner', title: e.name ? `<em>${esc(e.name)}</em>` : 'A calm <em>Christmas</em>', meta: `${n != null && n >= 0 ? `<span class="y-sticker">${I('gift')}${n ? `${P.plural(n, 'day')} to go` : 'It’s today!'}</span>` : ''}<span>${[e.date && D.long(e.date), e.serve && `dinner ${D.time(e.serve)}`].filter(Boolean).map(esc).join(' · ')}</span>` })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Gift progress', '<div data-slot="gifts"></div>', { icon: 'gift', cls: 'pl-7', actions: u.btn('All gifts', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'gifts' } }) })}
        ${u.panel('Next up', '<div data-slot="next"></div>', { icon: 'check', cls: 'pl-5', actions: u.btn('Countdown', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'prep' } }) })}
        ${u.panel('Your Christmas', `<div class="pl-fields">
          ${u.field('Name', 'event.name', e.name, { ph: 'Christmas at our place' })}${u.field('Hosts / family', 'event.host', e.host, { ph: 'Your names' })}
          ${u.field('Big day', 'event.date', e.date, { type: 'date', rerender: true })}${u.field('Where', 'event.place', e.place, { ph: 'Home, Grandma’s…' })}
          ${u.field('Guests arrive', 'event.arrive', e.arrive, { type: 'time' })}${u.field('Dinner served', 'event.serve', e.serve, { type: 'time' })}
          ${u.field('Theme & notes', 'event.theme', e.theme, { ph: 'Colors, playlist, kids’ table…', cls: 'pl-wide' })}</div>`, { icon: 'edit', cls: 'pl-7' })}
        ${u.panel('Budget', '<div data-slot="budget"></div>', { icon: 'chart', cls: 'pl-5', actions: u.btn('Budget', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'budget' } }) })}
      </div>`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, m = money(s), g = m.gift, open = openPrep(s).length, cards = s.cards.filter(c => P.has(c.name));
        return u.kpis([
          ['Gifts ready', `${g.done}<small>/${g.n}</small>`, 'y-kpi--world', g.toBuy ? `${g.toBuy} still to buy` : g.n ? 'Nothing left to buy' : 'Add people on Gifts'],
          ['Budget left', ctx.money(m.left, { cents: false }), m.left < 0 ? 'y-kpi--accent' : '', m.base ? `${ctx.money(m.spent, { cents: false })} spent of ${ctx.money(m.base, { cents: false })}` : 'Set a total on Budget'],
          ['Cards to send', String(toSend(s)), '', cards.length ? `${cards.filter(c => c.got).length} received` : ''],
          ['Prep left', String(open), open ? '' : 'is-good', `${heads(s, 'Yes')} coming for dinner`]
        ]);
      },
      gifts(ctx) {
        const s = ctx.state, people = s.people.filter(p => P.has(p.name));
        if (!people.length) return u.empty('gift', 'No one on the list yet', 'Add the people you buy for, with a budget for each.', u.btn('Open gift list', { kind: 'world', icon: 'gift', act: 'go', data: { page: 'gifts' } }));
        return `<ul class="xm-prog">${people.map(p => { const g = giftMath(s, p.id), over = g.budget && g.spent > g.budget;
          return `<li><span class="xm-prog-name">${esc(p.name)}</span>${u.meter(g.n ? g.done / g.n * 100 : 0, `${p.name}: gifts ready`)}<span class="xm-prog-n y-num">${g.done}/${g.n}</span><span class="xm-prog-money y-num${over ? ' is-over' : ''}">${ctx.money(g.spent, { cents: false })}${g.budget ? ` <small>of ${ctx.money(g.budget, { cents: false })}</small>` : ''}</span></li>`; }).join('')}</ul>`;
      },
      next(ctx) {
        const s = ctx.state, list = openPrep(s).sort((a, b) => WHEN_OFF[a.when] - WHEN_OFF[b.when]).slice(0, 6);
        if (!list.length) return s.prep.length ? '<p class="pl-muted">All prep done. Enjoy it!</p>' : u.empty('calendar', 'No countdown yet', 'Start from a six-week Christmas countdown.', u.btn('Add starter countdown', { kind: 'world', icon: 'sparkle', act: 'starter' }));
        const t = D.today();
        return `<ul class="pl-checklist">${list.map(x => { const i = s.prep.indexOf(x), d = dueDate(s, x.when); return `<li class="pl-ci">${u.tick(`prep.${i}.done`, x.done, `Done: ${x.text}`, { rerender: true })}<div class="pl-ci-main"><span class="pl-ci-text">${esc(x.text)}</span><span class="pl-ci-meta">${d ? esc(D.short(d)) : esc(WHEN.find(w => w[0] === x.when)[1])}${d && d < t ? ' ' + u.pill('overdue', 'bad') : ''}${x.who ? ` · ${esc(x.who)}` : ''}</span></div></li>`; }).join('')}</ul>`;
      },
      budget(ctx) {
        const s = ctx.state, m = money(s);
        if (!m.base) return u.empty('chart', 'No budget yet', 'Set one total for the season — gifts, food, decorations and the rest.', u.btn('Set the budget', { kind: 'world', icon: 'chart', act: 'go', data: { page: 'budget' } }));
        return `<p class="xm-big y-num">${ctx.money(m.left, { cents: false })} <small>${m.left < 0 ? 'over budget' : 'left'}</small></p>${u.meter(m.pct, 'Budget used', { over: m.left < 0 })}
          <dl class="xm-mini"><div><dt>Gifts</dt><dd class="y-num">${ctx.money(m.gift.spent, { cents: false })}</dd></div>${s.budget.cats.filter(c => P.num(c.spent)).slice(0, 4).map(c => `<div><dt>${esc(c.name)}</dt><dd class="y-num">${ctx.money(P.num(c.spent), { cents: false })}</dd></div>`).join('')}</dl>`;
      }
    },
    actions: { starter: starterAct }
  };
  function starterAct(ctx) { const s = ctx.state, have = new Set(s.prep.map(p => p.text.toLowerCase())); STARTER.forEach(([w, t]) => { if (!have.has(t.toLowerCase())) s.prep.push(task(w, t)); }); ctx.toast('Starter countdown added'); }

  /* ---------- gifts ---------- */
  const giftCols = (withFor, s) => [
    { k: 'text', label: 'Gift', title: true, w: '1.5fr', ph: 'Gift idea' },
    withFor ? { k: 'pid', label: 'For', type: 'select', options: s.people.map(p => [p.id, p.name || 'Unnamed']), blank: 'Choose…', w: '140px', rerender: true } : null,
    { k: 'where', label: 'Where', w: '1fr', ph: 'Store or link' },
    { k: 'price', label: 'Price', num: true, w: '96px', ph: '0' },
    { k: 'status', label: 'Status', type: 'select', options: STATUS, w: '120px', rerender: true }
  ].filter(Boolean);
  const gifts = {
    id: 'gifts', label: 'Gifts', icon: 'gift',
    badge: ctx => giftMath(ctx.state).toBuy || '',
    render(ctx) {
      const s = ctx.state, view = s.ui.giftView, g = giftMath(s);
      const show = x => view === 'all' || (view === 'buy' ? x.status === 'Idea' : x.status === 'Bought' || x.status === 'Ordered');
      const rows = pid => s.gifts.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.pid === pid && show(x));
      const lost = orphan(s).filter(show);
      return `${u.head({ eyebrow: 'Gift tracker', title: g.toBuy ? `<em>${g.toBuy}</em> to buy` : g.n ? 'All <em>bought</em>' : 'Gift <em>list</em>', lede: 'One budget per person. A gift counts as spent once it’s ordered or bought.' })}
      <div data-slot="kpis"></div>
      ${u.panel('People & budgets', `${u.quickAdd('people', { key: 'name', ph: 'Add someone you buy for — e.g. “Grandma Rose”', label: 'Add a person', kind: 'world' })}
        <div class="xm-gap"></div>
        ${u.table('people', s.people, [
          { k: 'name', label: 'Name', title: true, w: '1.4fr', ph: 'Name' },
          { k: 'group', label: 'Group', type: 'select', options: GROUPS, w: '118px' },
          { k: 'budget', label: 'Budget', num: true, w: '100px', ph: '0' },
          { k: 'spent', label: 'Spent', w: '120px', html: r => `<span class="xm-cell-money y-num" data-slot="pspent" data-arg="${esc(r.id)}"></span>` }
        ], { what: 'person', empty: 'Type a name above and press Enter.', cls: 'xm-compact xm-ptab' })}`, { icon: 'user' })}
      ${s.people.length ? `<div class="xm-giftbar">${u.chips('ui.giftView', view, [['all', 'All gifts', g.n], ['buy', 'To buy', g.toBuy], ['wrap', 'To wrap', realGifts(s).filter(x => x.status === 'Bought' || x.status === 'Ordered').length]], 'Show gifts')}</div>` : ''}
      <div class="xm-people">${s.people.map(p => { const list = rows(p.id);
        return u.panel(p.name || 'Unnamed', `${list.length ? u.table('gifts', list, giftCols(false, s), { index: x => x.__i, total: s.gifts.length, what: 'gift', cls: 'xm-compact xm-gtab' }) : `<p class="pl-muted pl-list-empty">${view === 'all' ? 'No gift ideas yet.' : 'Nothing here in this view.'}</p>`}
          <div class="pl-list-foot">${u.btn('Add gift', { sm: true, icon: 'plus', act: 'addGift', data: { pid: p.id } })}</div>`, { icon: 'gift', cls: 'y-panel--flat xm-person', actions: `<span data-slot="ppill" data-arg="${esc(p.id)}"></span>` }); }).join('')}
      ${lost.length ? u.panel('Not assigned', u.table('gifts', lost, giftCols(true, s), { index: x => x.__i, total: s.gifts.length, what: 'gift' }), { icon: 'warn', cls: 'y-panel--flat xm-person' }) : ''}</div>`;
    },
    slots: {
      kpis(ctx) {
        const g = giftMath(ctx.state);
        return u.kpis([['Gift budget', ctx.money(g.budget, { cents: false }), 'y-kpi--world', g.planned ? `${ctx.money(g.planned, { cents: false })} if you buy every idea` : ''],
          ['Spent', ctx.money(g.spent), g.budget && g.spent > g.budget ? 'y-kpi--accent' : '', g.budget ? `${ctx.money(r2(g.budget - g.spent), { cents: false })} left` : ''],
          ['Ready', `${g.done}<small>/${g.n}</small>`, g.n && g.done === g.n ? 'is-good' : '', 'wrapped or given']]);
      },
      pspent(ctx, id) { const g = giftMath(ctx.state, id), over = g.budget && g.spent > g.budget; return `<span class="${over ? 'is-over' : ''}">${ctx.money(g.spent)}</span>`; },
      ppill(ctx, id) { const g = giftMath(ctx.state, id), over = g.budget && g.spent > g.budget; return `${u.pill(`${g.done}/${g.n} ready`, g.n && g.done === g.n ? 'good' : '')}${u.pill(g.budget ? `${ctx.money(g.spent, { cents: false })} of ${ctx.money(g.budget, { cents: false })}` : ctx.money(g.spent, { cents: false }), over ? 'bad' : 'world')}`; }
    },
    actions: {
      addGift(ctx, d) { const s = ctx.state; s.ui.giftView = 'all'; s.gifts.push(gift({ pid: d.pid })); ctx.focus(`[data-bind="gifts.${s.gifts.length - 1}.text"]`); }
    }
  };

  /* ---------- budget ---------- */
  const budget = {
    id: 'budget', label: 'Budget', icon: 'chart',
    render(ctx) {
      const s = ctx.state, m = money(s);
      return `${u.head({ eyebrow: 'Holiday budget', title: m.base ? `<em>${esc(ctx.money(m.left, { cents: false }))}</em> ${m.left < 0 ? 'over' : 'left'}` : 'Set your <em>budget</em>', lede: 'One number for the whole season. Gifts come straight from the gift tracker; type what you spend on everything else.' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Total for the season', `${u.field('Total holiday budget', 'budget.total', s.budget.total, { num: true, ph: '1500', cls: 'xm-total' })}<div data-slot="gap"></div>`, { icon: 'chart', cls: 'pl-4' })}
        ${u.panel('Where it goes', `<div class="xm-giftrow"><span class="xm-giftrow-name">${I('gift')}Gifts <small>from the gift tracker</small></span><span data-slot="giftrow" class="xm-giftrow-nums"></span>${u.btn('Gifts', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'gifts' } })}</div>
          ${u.table('budget.cats', s.budget.cats, [
            { k: 'name', label: 'Category', title: true, w: '1.4fr', ph: 'Category' },
            { k: 'budget', label: 'Budget', num: true, w: '110px', ph: '0' },
            { k: 'spent', label: 'Spent', num: true, w: '110px', ph: '0' },
            { k: 'left', label: 'Left', w: '110px', html: r => `<span class="xm-cell-money y-num" data-slot="catleft" data-arg="${esc(r.id)}"></span>` }
          ], { what: 'category', tpl: 'cats', add: 'Add category', cls: 'xm-compact xm-ptab' })}`, { icon: 'list', cls: 'pl-8' })}
      </div>`;
    },
    slots: {
      kpis(ctx) {
        const m = money(ctx.state);
        return `${u.kpis([['Budget', ctx.money(m.base, { cents: false }), 'y-kpi--world', m.total ? '' : 'sum of the categories'], ['Spent', ctx.money(m.spent), '', `${Math.round(m.pct)}% of the budget`], ['Left', ctx.money(m.left), m.left < 0 ? 'y-kpi--accent' : 'is-good', m.left < 0 ? 'over budget' : '']])}${u.meter(m.pct, 'Budget used', { over: m.left < 0, cls: 'xm-meter' })}`;
      },
      gap(ctx) {
        const m = money(ctx.state);
        if (!m.total) return '<p class="pl-hint">Leave it empty to use the sum of the categories.</p>';
        if (Math.abs(m.gap) < 0.005) return u.banner('good', 'Every dollar has a job.');
        return m.gap > 0 ? `<p class="pl-hint">${esc(ctx.money(m.gap))} not given to a category yet.</p>` : u.banner('warn', `Categories add up to ${esc(ctx.money(-m.gap))} more than the total.`);
      },
      giftrow(ctx) { const g = giftMath(ctx.state); return `<span>${ctx.money(g.budget, { cents: false })}</span><span>${ctx.money(g.spent)}</span><span class="${g.budget - g.spent < 0 ? 'is-over' : ''}">${ctx.money(r2(g.budget - g.spent))}</span>`; },
      catleft(ctx, id) { const c = ctx.state.budget.cats.find(x => x.id === id); if (!c) return ''; const left = r2(P.num(c.budget) - P.num(c.spent)); return P.has(c.budget) || P.has(c.spent) ? `<span class="${left < 0 ? 'is-over' : ''}">${ctx.money(left)}</span>` : ''; }
    }
  };

  /* ---------- cards ---------- */
  const cards = {
    id: 'cards', label: 'Cards', icon: 'mail',
    badge: ctx => toSend(ctx.state) || '',
    render(ctx) {
      const s = ctx.state, n = toSend(s);
      return `${u.head({ eyebrow: 'Christmas cards', title: n ? `<em>${n}</em> to send` : s.cards.length ? 'All <em>sent</em>' : 'Card <em>list</em>', lede: 'Addresses in one place, ticked off as they go out — and as theirs arrive.' })}
      ${u.panel('', `${u.quickAdd('cards', { key: 'name', ph: 'Add a name or household and press Enter', label: 'Add to card list', kind: 'world' })}
        <div class="xm-gap"></div>
        ${u.table('cards', s.cards, [
          { k: 'name', label: 'Name / household', title: true, w: '1.1fr', ph: 'Name' },
          { k: 'address', label: 'Address', w: '1.6fr', ph: 'Street, city, ZIP' },
          { k: 'sent', label: 'Sent', type: 'check', w: '64px', rerender: true },
          { k: 'got', label: 'Got one', type: 'check', w: '76px' }
        ], { what: 'card', empty: 'Type a name above and press Enter.', cls: 'xm-compact xm-ctab' })}`)}`;
    },
    sheet(ctx) {
      const list = ctx.state.cards.filter(c => P.has(c.name));
      return `<h1>Christmas card list</h1><p class="pl-sheet-meta">${list.length} on the list · ${toSend(ctx.state)} to send</p>
        <table><tbody>${list.map(c => `<tr><td style="width:6mm"><span class="pl-box${c.sent ? ' is-on' : ''}"></span></td><td><b>${esc(c.name)}</b></td><td>${esc(c.address)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- guests ---------- */
  const guests = {
    id: 'guests', label: 'Guests', icon: 'user',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Who’s coming for dinner', title: `<em>${heads(s, 'Yes')}</em> coming`, lede: 'One row per household. “People” counts everyone in it, including kids.' })}
      ${u.panel('', `${u.quickAdd('guests', { key: 'name', ph: 'Add a household — e.g. “Sam + Riley”', label: 'Add guests', kind: 'world' })}
        <div class="xm-gap"></div>
        ${u.table('guests', s.guests, [
          { k: 'name', label: 'Guest / household', title: true, w: '1.3fr', ph: 'Name' },
          { k: 'count', label: 'People', num: true, w: '80px', ph: '1' },
          { k: 'rsvp', label: 'RSVP', type: 'select', options: RSVP, w: '118px' },
          { k: 'diet', label: 'Dietary needs', w: '1fr', ph: 'Allergies, vegetarian…' },
          { k: 'bringing', label: 'Bringing', w: '1fr', ph: 'Optional' }
        ], { what: 'guest', empty: 'Type a name above and press Enter.' })}`)}`;
    }
  };

  /* ---------- menu ---------- */
  const menu = {
    id: 'menu', label: 'Menu', icon: 'list',
    render(ctx) {
      const s = ctx.state, diets = s.guests.filter(g => g.rsvp !== 'No' && P.has(g.diet)).map(g => `${g.name}: ${g.diet}`);
      return `${u.head({ eyebrow: 'Christmas dinner', title: 'Menu', lede: 'Every dish, who makes it and what it’s safe for.' })}
      ${diets.length ? u.banner('warn', `<b>Dietary needs:</b> ${diets.map(esc).join(' · ')}`) : ''}
      ${COURSES.map(c => { const list = s.menu.map((d, i) => Object.assign({ __i: i }, d)).filter(d => d.course === c); return list.length ? u.panel(c, u.table('menu', list, [
        { k: 'name', label: 'Dish', title: true, w: '1.4fr', ph: 'Dish' }, { k: 'course', label: 'Course', type: 'select', options: COURSES, w: '120px', rerender: true },
        { k: 'who', label: 'Who makes it', w: '140px', ph: 'Name' }, { k: 'diet', label: 'Safe for', w: '1fr', ph: 'Vegetarian, GF…' }, { k: 'note', label: 'Notes', w: '1fr', ph: 'Timing, reheating' }
      ], { index: d => d.__i, total: s.menu.length, what: 'dish' }), { icon: 'star', cls: 'y-panel--flat' }) : ''; }).join('')}
      ${s.menu.length ? '' : u.empty('list', 'No dishes yet', 'Start with the main, then sides, dessert and drinks.')}
      <div class="pl-row">${COURSES.slice(0, 5).map(c => u.btn(`Add ${c.toLowerCase()}`, { sm: true, icon: 'plus', act: 'addDish', data: { course: c } })).join('')}</div>`;
    },
    actions: { addDish(ctx, d) { const s = ctx.state; s.menu.push(dish({ course: d.course })); ctx.focus(`[data-bind="menu.${s.menu.length - 1}.name"]`); } }
  };

  /* ---------- prep countdown ---------- */
  const prep = {
    id: 'prep', label: 'Countdown', icon: 'calendar',
    badge: ctx => { const s = ctx.state, t = D.today(); const n = openPrep(s).filter(x => { const d = dueDate(s, x.when); return d && d <= t; }).length; return n || ''; },
    render(ctx) {
      const s = ctx.state, t = D.today();
      return `${u.head({ eyebrow: 'Six-week countdown', title: 'A little <em>each week</em>', lede: D.parse(s.event.date) ? `Dates count back from ${esc(D.long(s.event.date))}.` : 'Set the big day on the Overview to see real due dates.' })}
      ${s.prep.length ? '' : u.empty('calendar', 'No tasks yet', 'Start from a classic Christmas countdown and make it yours.', u.btn('Add starter countdown', { kind: 'world', icon: 'sparkle', act: 'starter' }))}
      <div class="xm-when">${WHEN.map(([k, label]) => {
        const list = s.prep.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.when === k), d = dueDate(s, k);
        const done = list.filter(x => x.done).length;
        return u.panel(label, `${u.checklist('prep', list, { index: x => x.__i, total: s.prep.length, ph: 'Task', what: 'task', meta: x => `${u.select(`prep.${x.__i}.when`, x.when, WHEN.map(w => [w[0], w[1]]), { label: 'When', cls: 'xm-mini', rerender: true })}${u.input(`prep.${x.__i}.who`, x.who, { label: 'Who', ph: 'Who', cls: 'xm-who' })}` })}
          <div class="pl-list-foot">${u.btn('Add task', { sm: true, icon: 'plus', act: 'addTask', data: { when: k } })}</div>`, { icon: 'calendar', cls: `y-panel--flat${d && d < t && done < list.length ? ' xm-late' : ''}`, actions: `${d ? `<span class="pl-pill${d === t ? ' pl-pill--world' : ''}">${esc(D.fmt(d))}</span>` : ''}${list.length ? `<span class="pl-pill${done === list.length ? ' pl-pill--good' : ''}">${done}/${list.length}</span>` : ''}` });
      }).join('')}</div>
      <div class="xm-gap"></div>${u.notes('notes', s.notes, { title: 'Notes', rows: 8, ph: 'Oven schedule, traditions, what to change next year…' })}`;
    },
    actions: { starter: starterAct, addTask(ctx, d) { const s = ctx.state; s.prep.push(task(d.when)); ctx.focus(`[data-bind="prep.${s.prep.length - 1}.text"]`); } }
  };

  /* ---------- shopping ---------- */
  const shopping = {
    id: 'shopping', label: 'Shopping', icon: 'check',
    badge: ctx => { const n = ctx.state.shopping.filter(x => !x.done && P.has(x.text)).length; return n || ''; },
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Grocery list', title: `<em>${s.shopping.filter(x => !x.done && P.has(x.text)).length}</em> to buy`, lede: 'Grouped by aisle so it’s one lap of the store.' })}
      ${u.panel('', `${u.quickAdd('shopping', { ph: 'Add an item and press Enter', label: 'Add a shopping item', kind: 'world' })}
        ${AISLES.map(a => { const list = s.shopping.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.aisle === a); return list.length ? `<section class="xm-aisle"><h3>${esc(a)}</h3>${u.checklist('shopping', list, { index: x => x.__i, total: s.shopping.length, ph: 'Item', what: 'item', extra: x => `${u.input(`shopping.${x.__i}.qty`, x.qty, { label: `Quantity of ${x.text}`, ph: 'Qty', cls: 'xm-qty' })}${u.select(`shopping.${x.__i}.aisle`, x.aisle, AISLES, { label: `Aisle for ${x.text}`, cls: 'xm-mini xm-aisle-sel', rerender: true })}` })}</section>` : ''; }).join('')}`)}`;
    }
  };

  /* ---------- print sheets ---------- */
  function giftSheet(ctx) {
    const s = ctx.state;
    return `<h1>Gift list</h1><p class="pl-sheet-meta">${[s.event.name, `${giftMath(s).toBuy} to buy`, `${giftMath(s).done} ready`].filter(Boolean).map(esc).join(' · ')}</p>
      ${s.people.filter(p => P.has(p.name)).map(p => { const list = realGifts(s).filter(x => x.pid === p.id); return `<h2>${esc(p.name)}${P.num(p.budget) ? ` · ${esc(ctx.money(P.num(p.budget), { cents: false }))}` : ''}</h2><table><tbody>${list.length ? list.map(x => `<tr><td style="width:6mm"><span class="pl-box${PAID.has(x.status) ? ' is-on' : ''}"></span></td><td>${esc(x.text)}</td><td>${esc(x.where)}</td><td style="width:20mm">${P.has(x.price) ? esc(ctx.money(P.num(x.price))) : ''}</td><td style="width:20mm">${esc(x.status)}</td></tr>`).join('') : '<tr><td>&nbsp;</td></tr>'}</tbody></table>`; }).join('')}`;
  }
  function hostSheet(ctx) {
    const s = ctx.state, e = s.event;
    return `<h1>${esc(e.name || 'Christmas dinner')}</h1><p class="pl-sheet-meta">${[e.date && D.long(e.date), e.arrive && `Guests ${D.time(e.arrive)}`, e.serve && `Dinner ${D.time(e.serve)}`, e.place, `${heads(s, 'Yes')} coming`].filter(Boolean).map(esc).join(' · ')}</p>
      <h2>Menu</h2><table><tbody>${s.menu.filter(d => P.has(d.name)).map(d => `<tr><td style="width:24mm">${esc(d.course)}</td><td><b>${esc(d.name)}</b></td><td>${esc(d.who)}</td><td>${esc(d.diet)}</td><td>${esc(d.note)}</td></tr>`).join('')}</tbody></table>
      <h2>Countdown</h2><table><tbody>${WHEN.map(([k, l]) => s.prep.filter(x => x.when === k && P.has(x.text)).map(x => `<tr><td style="width:6mm"><span class="pl-box${x.done ? ' is-on' : ''}"></span></td><td>${esc(x.text)}</td><td>${esc(l)}${dueDate(s, k) ? ' · ' + esc(D.short(dueDate(s, k))) : ''}</td><td>${esc(x.who)}</td></tr>`).join('')).join('')}</tbody></table>
      <h2>Shopping</h2><table><tbody>${s.shopping.filter(x => P.has(x.text) && !x.done).map(x => `<tr><td style="width:6mm"><span class="pl-box"></span></td><td>${esc(x.text)}</td><td>${esc(x.qty)}</td><td>${esc(x.aisle)}</td></tr>`).join('')}</tbody></table>`;
  }
  function budgetSheet(ctx) {
    const s = ctx.state, m = money(s), row = (n, b, sp) => `<tr><td><b>${esc(n)}</b></td><td>${esc(ctx.money(b))}</td><td>${esc(ctx.money(sp))}</td><td>${esc(ctx.money(r2(b - sp)))}</td></tr>`;
    return `<h1>Holiday budget</h1><p class="pl-sheet-meta">Budget ${esc(ctx.money(m.base))} · spent ${esc(ctx.money(m.spent))} · left ${esc(ctx.money(m.left))}</p>
      <table><thead><tr><th>Category</th><th>Budget</th><th>Spent</th><th>Left</th></tr></thead><tbody>${row('Gifts', m.gift.budget, m.gift.spent)}${s.budget.cats.filter(c => P.has(c.name)).map(c => row(c.name, P.num(c.budget), P.num(c.spent))).join('')}</tbody></table>`;
  }
  gifts.sheet = giftSheet; budget.sheet = budgetSheet;
  [overview, guests, menu, prep, shopping].forEach(p => { p.sheet = hostSheet; });

  P.create({
    slug: 'christmas-planner-app', name: 'Christmas Planner', world: 'holiday', currency: true,
    welcome: 'Add the people you buy for, set a budget, and the countdown fills in real dates.',
    pages: [overview, gifts, budget, cards, guests, menu, prep, shopping],
    blank, sample, normalize,
    rows: { people: () => person(), gifts: () => gift(), cats: () => cat(), cards: () => card(), guests: () => guest(), menu: () => dish(), prep: () => task(), shopping: () => buy() },
    accepts: d => d && typeof d === 'object' && ('people' in d || 'gifts' in d || 'event' in d),
    about: '<p><b>Christmas Planner</b> keeps the whole season in one place: a gift tracker with a budget for each person, one holiday budget, the Christmas card list, and the big dinner — guests, menu, a six-week countdown with real dates and a grocery list by aisle.</p>',
    disclaimer: 'Christmas Planner is a personal planning tool. Check allergy and food-safety information yourself.'
  });
})();
