/* Christmas Gift Tracker App — a budget per person, every gift from idea to given, sizes and wish lists, stocking stuffers,
   a Secret Santa draw and thank-you notes. Yaykit planner engine, holiday world (defined in gifts.css).
   The gift list and per-person budgets come from Christmas Planner; sizes, stockings, Secret Santa and thank-yous are new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const GROUPS = ['Family', 'Kids', 'Friends', 'Work', 'Other'];
  const STATUS = ['Idea', 'Ordered', 'Bought', 'Wrapped', 'Given'];
  const PAID = new Set(['Ordered', 'Bought', 'Wrapped', 'Given']);
  const txt = v => (v == null ? '' : String(v));
  const r2 = n => Math.round(n * 100) / 100;

  const person = o => Object.assign({ id: P.uid(), name: '', group: 'Family', budget: '', likes: '', top: '', bottom: '', shoes: '', other: '', wish: '', avoid: '' }, o || {});
  const gift = o => Object.assign({ id: P.uid(), pid: '', text: '', where: '', price: '', status: 'Idea' }, o || {});
  const stuffer = o => Object.assign({ id: P.uid(), pid: '', text: '', price: '', done: false }, o || {});
  const player = o => Object.assign({ id: P.uid(), name: '', avoid: '', wish: '' }, o || {});
  const thanks = o => Object.assign({ id: P.uid(), from: '', what: '', sent: false }, o || {});

  function nextXmas() { const y = new Date().getFullYear(); return D.today() > `${y}-12-25` ? `${y + 1}-12-25` : `${y}-12-25`; }
  function blank() {
    return { season: { name: '', date: nextXmas() }, people: [], gifts: [], stuffers: [], santa: { name: '', budget: '', date: '', players: [], pairs: {}, drawn: '' }, received: [], notes: '' };
  }
  function sample() {
    const p = [person({ name: 'Mom', group: 'Family', budget: '80', likes: 'Gardening, mystery novels, good coffee', top: 'M', shoes: '8', wish: 'Kindle cover · new pruning shears', avoid: 'More candles' }),
      person({ name: 'Dad', group: 'Family', budget: '80', likes: 'Grilling, football, history podcasts', top: 'L', bottom: '34/32', shoes: '10.5', avoid: 'Socks (he has 40 pairs)' }),
      person({ name: 'Emma (9)', group: 'Kids', budget: '120', likes: 'Drawing, horses, The Wild Robot', top: 'Kids 10', bottom: 'Kids 10', shoes: 'Youth 3', wish: 'LEGO Friends horse stable · art markers' }),
      person({ name: 'Leo (6)', group: 'Kids', budget: '120', likes: 'Dinosaurs, trucks, anything that goes fast', top: 'Kids 6', bottom: 'Kids 6', shoes: 'Kids 12' }),
      person({ name: 'Grandma Rose', group: 'Family', budget: '50', likes: 'Family photos, crossword puzzles, tea', top: 'L', other: 'Ring 7' }),
      person({ name: 'Sam + Riley', group: 'Friends', budget: '40', likes: 'Board games, wine, their dog Biscuit', avoid: 'Nuts — Riley is allergic' }),
      person({ name: 'Ms. Patel (teacher)', group: 'Work', budget: '25', likes: 'Plants, stationery' })];
    const g = (i, text, where, price, status) => gift({ pid: p[i].id, text, where, price, status });
    const st = (i, text, price, done) => stuffer({ pid: p[i].id, text, price, done });
    const players = [player({ name: 'Mom', wish: 'Gardening gloves' }), player({ name: 'Dad', wish: 'Anything for the grill' }), player({ name: 'Aunt Lisa', wish: 'Cozy socks or a puzzle' }), player({ name: 'Uncle Mark', wish: 'Hot sauce, BBQ rubs' }),
      player({ name: 'Grandma Rose', wish: 'Tea sampler' }), player({ name: 'Cousin Jen', wish: 'Bookstore gift card' })];
    players[0].avoid = players[1].id; players[1].avoid = players[0].id; players[2].avoid = players[3].id; players[3].avoid = players[2].id;
    return {
      season: { name: 'Christmas gifts', date: nextXmas() },
      people: p,
      gifts: [
        g(0, 'Cozy knit throw', 'Target', '39', 'Wrapped'), g(0, 'Photo book of the year', 'Shutterfly', '32', 'Ordered'),
        g(1, 'Grill tool set', 'Home Depot', '45', 'Bought'), g(1, 'Coffee sampler', '', '24', 'Idea'),
        g(2, 'LEGO Friends horse stable', 'Amazon', '49.99', 'Wrapped'), g(2, 'Art markers + sketchbook', 'Michaels', '28', 'Bought'), g(2, 'Book: The Wild Robot Escapes', '', '9.99', 'Idea'),
        g(3, 'Remote-control truck', 'Walmart', '42', 'Bought'), g(3, 'Dinosaur pajamas', 'Old Navy', '19', 'Idea'),
        g(4, 'Framed family photo', 'Local frame shop', '35', 'Ordered'),
        g(5, 'Two-player board game', 'Game store', '30', 'Idea'),
        g(6, 'Succulent in a painted pot', 'Garden center', '18', 'Given')
      ],
      stuffers: [st(2, 'Gel pens', '6', true), st(2, 'Horse stickers', '4', true), st(2, 'Hot cocoa bomb', '3', false), st(3, 'Mini dinosaur figures', '8', true), st(3, 'Glow stick bracelets', '5', false),
        st(3, 'Chocolate coins', '3', false), st(0, 'Seed packets', '7', false), st(1, 'BBQ rub', '9', true)],
      santa: { name: 'Family Secret Santa', budget: '30', date: D.add(nextXmas(), -1), players, pairs: Object.fromEntries([[0, 2], [1, 4], [2, 1], [3, 5], [4, 3], [5, 0]].map(([g, r]) => [players[g].id, players[r].id])), drawn: D.today() },
      received: [thanks({ from: 'Aunt Lisa + family', what: 'Board game for the kids', sent: true }), thanks({ from: 'Grandma Rose', what: 'Knitted scarves for everyone' }),
        thanks({ from: 'The Nguyens', what: 'Cookie tin' }), thanks({ from: 'Coach Miller', what: 'Gift card for Leo' })],
      notes: 'Order the photo book before Dec 1 next year.\n\nEmma asked Santa for “a real horse” — the LEGO stable is the compromise.\n\nRiley: nut allergy, check any food gifts.'
    };
  }
  function normalize(s) {
    const e = s.season || {};
    s.season = { name: txt(e.name), date: txt(e.date) };
    const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
    s.people = arr(s.people, x => person({ id: txt(x.id) || P.uid(), name: txt(x.name), group: GROUPS.includes(x.group) ? x.group : 'Other', budget: txt(x.budget), likes: txt(x.likes),
      top: txt(x.top), bottom: txt(x.bottom), shoes: txt(x.shoes), other: txt(x.other), wish: txt(x.wish), avoid: txt(x.avoid) }));
    s.gifts = arr(s.gifts, x => gift({ id: txt(x.id) || P.uid(), pid: txt(x.pid), text: txt(x.text), where: txt(x.where), price: txt(x.price), status: STATUS.includes(x.status) ? x.status : 'Idea' }));
    s.stuffers = arr(s.stuffers, x => stuffer({ id: txt(x.id) || P.uid(), pid: txt(x.pid), text: txt(x.text), price: txt(x.price), done: !!x.done }));
    const sa = s.santa && typeof s.santa === 'object' ? s.santa : {};
    const players = arr(sa.players, x => player({ id: txt(x.id) || P.uid(), name: txt(x.name), avoid: txt(x.avoid), wish: txt(x.wish) }));
    const pairs = sa.pairs && typeof sa.pairs === 'object' ? sa.pairs : {};
    s.santa = { name: txt(sa.name), budget: txt(sa.budget), date: txt(sa.date), players, pairs: Object.fromEntries(Object.keys(pairs).map(k => [k, txt(pairs[k])])), drawn: txt(sa.drawn) };
    s.received = arr(s.received, x => thanks({ id: txt(x.id) || P.uid(), from: txt(x.from), what: txt(x.what), sent: !!x.sent }));
    s.notes = txt(s.notes);
    s.ui = s.ui || {};
    if (!['all', 'buy', 'wrap'].includes(s.ui.giftView)) s.ui.giftView = 'all';
    if (typeof s.ui.reveal !== 'string') s.ui.reveal = '';
    return s;
  }

  /* ---------- math ---------- */
  const realGifts = s => s.gifts.filter(x => P.has(x.text));
  const realStuff = s => s.stuffers.filter(x => P.has(x.text));
  const paid = x => (PAID.has(x.status) ? P.num(x.price) : 0);
  const ready = x => x.status === 'Wrapped' || x.status === 'Given';
  function giftMath(s, pid) {
    const list = realGifts(s).filter(x => pid == null || x.pid === pid), stuff = realStuff(s).filter(x => pid == null || x.pid === pid);
    const p = pid != null ? s.people.find(x => x.id === pid) : null;
    return {
      n: list.length, toBuy: list.filter(x => x.status === 'Idea').length, done: list.filter(ready).length,
      spent: r2(list.reduce((a, x) => a + paid(x), 0) + stuff.reduce((a, x) => a + (x.done ? P.num(x.price) : 0), 0)),
      planned: r2(list.reduce((a, x) => a + P.num(x.price), 0) + stuff.reduce((a, x) => a + P.num(x.price), 0)),
      budget: p ? P.num(p.budget) : r2(s.people.reduce((a, x) => a + P.num(x.budget), 0))
    };
  }
  const orphan = s => { const ids = new Set(s.people.map(p => p.id)); return s.gifts.map((x, i) => Object.assign({ __i: i }, x)).filter(x => !ids.has(x.pid)); };
  const toThank = s => s.received.filter(x => P.has(x.from) && !x.sent).length;
  const players = s => s.santa.players.filter(x => P.has(x.name));
  const nameOf = (s, id) => (s.santa.players.find(x => x.id === id) || {}).name || '';
  /* the draw is stale when anyone was added, renamed away or removed since it was made */
  function drawState(s) {
    const list = players(s), pairs = s.santa.pairs, keys = Object.keys(pairs);
    if (!keys.length) return 'none';
    const ids = new Set(list.map(x => x.id));
    return keys.length === list.length && keys.every(k => ids.has(k) && ids.has(pairs[k])) ? 'ok' : 'stale';
  }
  /* a random giver → receiver loop: nobody draws themselves or the person they should avoid (either way round) */
  function draw(list) {
    const bad = (a, b) => a.id === b.id || a.avoid === b.id || b.avoid === a.id;
    for (let t = 0; t < 4000; t++) {
      const r = list.slice();
      for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
      if (list.every((g, i) => !bad(g, r[i]))) return Object.fromEntries(list.map((g, i) => [g.id, r[i].id]));
    }
    return null;
  }

  /* ---------- overview ---------- */
  const overview = {
    id: 'overview', label: 'Overview', icon: 'star',
    render(ctx) {
      const s = ctx.state, e = s.season, n = D.parse(e.date) ? D.diff(D.today(), e.date) : null;
      return `
      ${u.head({ eyebrow: e.name || 'Christmas gift tracker', title: 'Every gift, <em>handled</em>', meta: `${n != null && n >= 0 ? `<span class="y-sticker">${I('gift')}${n ? `${P.plural(n, 'day')} to Christmas` : 'It’s Christmas!'}</span>` : ''}<span>${e.date ? esc(D.long(e.date)) : ''}</span>` })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Gift progress', '<div data-slot="gifts"></div>', { icon: 'gift', cls: 'pl-7', actions: u.btn('All gifts', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'gifts' } }) })}
        ${u.panel('Still to buy', '<div data-slot="buy"></div>', { icon: 'check', cls: 'pl-5' })}
        ${u.panel('This season', `<div class="pl-fields">${u.field('Name', 'season.name', e.name, { ph: 'Christmas gifts' })}${u.field('Christmas Day', 'season.date', e.date, { type: 'date', rerender: true })}</div>`, { icon: 'edit', cls: 'pl-5' })}
        ${u.notes('notes', s.notes, { rows: 5, title: 'Notes', ph: 'Ideas for next year, shipping cut-off dates, hiding spots…', cls: 'pl-7' })}
      </div>`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, g = giftMath(s), left = r2(g.budget - g.spent), st = realStuff(s);
        return u.kpis([
          ['Gifts ready', `${g.done}<small>/${g.n}</small>`, 'y-kpi--world', 'wrapped or given'],
          ['Spent', ctx.money(g.spent, { cents: false }), left < 0 ? 'y-kpi--accent' : '', g.budget ? `${ctx.money(Math.abs(left), { cents: false })} ${left < 0 ? 'over' : 'left'} of ${ctx.money(g.budget, { cents: false })}` : 'Set budgets on Gifts'],
          ['To buy', String(g.toBuy), g.n && !g.toBuy ? 'is-good' : '', st.length ? `+ ${st.filter(x => !x.done).length} stocking stuffers` : ''],
          ['Thank-yous', String(toThank(s)), '', s.received.length ? 'still to write' : '']
        ]);
      },
      gifts(ctx) {
        const s = ctx.state, people = s.people.filter(p => P.has(p.name));
        if (!people.length) return u.empty('gift', 'No one on the list yet', 'Add the people you buy for, with a budget for each.', u.btn('Open gift list', { kind: 'world', icon: 'gift', act: 'go', data: { page: 'gifts' } }));
        return `<ul class="xm-prog">${people.map(p => { const g = giftMath(s, p.id), over = g.budget && g.spent > g.budget;
          return `<li><span class="xm-prog-name">${esc(p.name)}</span>${u.meter(g.n ? g.done / g.n * 100 : 0, `${p.name}: gifts ready`)}<span class="xm-prog-n y-num">${g.done}/${g.n}</span><span class="xm-prog-money y-num${over ? ' is-over' : ''}">${ctx.money(g.spent, { cents: false })}${g.budget ? ` <small>of ${ctx.money(g.budget, { cents: false })}</small>` : ''}</span></li>`; }).join('')}</ul>`;
      },
      buy(ctx) {
        const s = ctx.state, names = Object.fromEntries(s.people.map(p => [p.id, p.name]));
        const list = s.gifts.map((x, i) => Object.assign({ __i: i }, x)).filter(x => P.has(x.text) && x.status === 'Idea').slice(0, 7);
        if (!list.length) return realGifts(s).length ? '<p class="pl-muted">Nothing left to buy. Time to wrap!</p>' : '<p class="pl-muted">Gift ideas you haven’t bought yet show up here.</p>';
        return `<ul class="gt-buy">${list.map(x => `<li><span class="gt-buy-main"><b>${esc(x.text)}</b><span>${esc([names[x.pid], x.where].filter(Boolean).join(' · '))}</span></span>${P.has(x.price) ? u.pill(ctx.money(P.num(x.price), { cents: false }), 'world') : '<span></span>'}${u.btn('Bought', { sm: true, icon: 'check', act: 'bought', data: { i: x.__i } })}</li>`).join('')}</ul>`;
      }
    },
    actions: { bought(ctx, d) { const x = ctx.state.gifts[+d.i]; if (x) { x.status = 'Bought'; ctx.toast(`${x.text}: bought`); } } }
  };

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
      return `${u.head({ eyebrow: 'Gift tracker', title: g.toBuy ? `<em>${g.toBuy}</em> to buy` : g.n ? 'All <em>bought</em>' : 'Gift <em>list</em>', lede: 'One budget per person. A gift counts as spent once it’s ordered or bought; stocking stuffers once they’re ticked.' })}
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
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Gift list</h1><p class="pl-sheet-meta">${[s.season.name, `${giftMath(s).toBuy} to buy`, `${giftMath(s).done} ready`].filter(Boolean).map(esc).join(' · ')}</p>
        ${s.people.filter(p => P.has(p.name)).map(p => { const list = realGifts(s).filter(x => x.pid === p.id); return `<h2>${esc(p.name)}${P.num(p.budget) ? ` · ${esc(ctx.money(P.num(p.budget), { cents: false }))}` : ''}</h2><table><tbody>${list.length ? list.map(x => `<tr><td style="width:6mm"><span class="pl-box${PAID.has(x.status) ? ' is-on' : ''}"></span></td><td>${esc(x.text)}</td><td>${esc(x.where)}</td><td style="width:20mm">${P.has(x.price) ? esc(ctx.money(P.num(x.price))) : ''}</td><td style="width:20mm">${esc(x.status)}</td></tr>`).join('') : '<tr><td>&nbsp;</td></tr>'}</tbody></table>`; }).join('')}`;
    }
  };

  /* ---------- sizes & wish lists ---------- */
  const people = {
    id: 'people', label: 'Sizes', icon: 'user',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Sizes & wish lists', title: 'What they <em>actually</em> want', lede: 'Sizes, likes and the things not to buy — so you can shop in a hurry and still get it right.' })}
      ${s.people.length ? u.records('people', s.people, {
        what: 'Person', titlePh: 'Name', cls: 'gt-recs',
        sub: p => { const g = giftMath(s, p.id); return `${esc(p.group)} · ${g.n ? `${g.done}/${g.n} gifts ready` : 'no gift ideas yet'}`; },
        fields: [
          { k: 'likes', label: 'Loves', type: 'textarea', wide: true, ph: 'Hobbies, colors, favorite things' },
          { k: 'top', label: 'Top', ph: 'M, Kids 10' }, { k: 'bottom', label: 'Bottoms', ph: '32/30, Kids 10' },
          { k: 'shoes', label: 'Shoes', ph: '9, Youth 3' }, { k: 'other', label: 'Other sizes', ph: 'Ring, hat, gloves' },
          { k: 'wish', label: 'Wish list', type: 'textarea', wide: true, ph: 'What they asked for, links' },
          { k: 'avoid', label: 'Please don’t buy', wide: true, ph: 'Allergies, duplicates, no more mugs' }
        ],
        foot: p => `<div class="pl-list-foot">${u.btn('Add a gift idea', { sm: true, icon: 'plus', act: 'ideaFor', data: { pid: p.id } })}</div>`
      }) : u.empty('user', 'No one on the list yet', 'Add the people you buy for on Gifts.', u.btn('Open gift list', { kind: 'world', icon: 'gift', act: 'go', data: { page: 'gifts' } }))}`;
    },
    actions: {
      ideaFor(ctx, d) { const s = ctx.state; s.ui.giftView = 'all'; s.gifts.push(gift({ pid: d.pid })); ctx.go('gifts'); ctx.focus(`[data-bind="gifts.${s.gifts.length - 1}.text"]`); }
    },
    sheet(ctx) {
      const list = ctx.state.people.filter(p => P.has(p.name));
      return `<h1>Sizes & wish lists</h1><p class="pl-sheet-meta">${list.length} people</p>
        <table><thead><tr><th>Name</th><th>Sizes</th><th>Loves</th><th>Wish list</th><th>Don’t buy</th></tr></thead><tbody>${list.map(p => `<tr><td><b>${esc(p.name)}</b></td><td>${esc([p.top && `Top ${p.top}`, p.bottom && `Bottoms ${p.bottom}`, p.shoes && `Shoes ${p.shoes}`, p.other].filter(Boolean).join(' · '))}</td><td>${esc(p.likes)}</td><td>${esc(p.wish)}</td><td>${esc(p.avoid)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- stockings ---------- */
  const stockings = {
    id: 'stockings', label: 'Stockings', icon: 'heart',
    badge: ctx => realStuff(ctx.state).filter(x => !x.done).length || '',
    render(ctx) {
      const s = ctx.state, list = realStuff(s), left = list.filter(x => !x.done).length;
      return `${u.head({ eyebrow: 'Stocking stuffers', title: list.length ? (left ? `<em>${left}</em> still to get` : 'Stockings <em>full</em>') : 'Fill the <em>stockings</em>', lede: 'Small things per person. Tick one when it’s in the hiding spot — it counts toward that person’s budget.' })}
      ${s.people.length ? `<div class="xm-people">${s.people.map(p => { const rows = s.stuffers.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.pid === p.id);
        const cost = r2(rows.reduce((a, x) => a + P.num(x.price), 0));
        return u.panel(p.name || 'Unnamed', `${u.checklist('stuffers', rows, { index: x => x.__i, total: s.stuffers.length, ph: 'Stocking stuffer', what: 'stuffer', rerender: true, extra: x => u.input(`stuffers.${x.__i}.price`, x.price, { label: `Price of ${x.text || 'stuffer'}`, ph: '0', num: true, cls: 'xm-qty' }), empty: 'Nothing yet.' })}
          <div class="pl-list-foot">${u.btn('Add stuffer', { sm: true, icon: 'plus', act: 'addStuff', data: { pid: p.id } })}</div>`, { icon: 'heart', cls: 'y-panel--flat xm-person', actions: rows.length ? u.pill(`${rows.filter(x => x.done).length}/${rows.length} · ${ctx.money(cost, { cents: false })}`, 'world') : '' });
      }).join('')}</div>` : u.empty('heart', 'No one on the list yet', 'Add the people you buy for on Gifts.', u.btn('Open gift list', { kind: 'world', icon: 'gift', act: 'go', data: { page: 'gifts' } }))}`;
    },
    actions: { addStuff(ctx, d) { const s = ctx.state; s.stuffers.push(stuffer({ pid: d.pid })); ctx.focus(`[data-bind="stuffers.${s.stuffers.length - 1}.text"]`); } },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Stocking stuffers</h1>${s.people.filter(p => P.has(p.name)).map(p => { const rows = realStuff(s).filter(x => x.pid === p.id); return rows.length ? `<h2>${esc(p.name)}</h2><table><tbody>${rows.map(x => `<tr><td style="width:6mm"><span class="pl-box${x.done ? ' is-on' : ''}"></span></td><td>${esc(x.text)}</td><td style="width:20mm">${P.has(x.price) ? esc(ctx.money(P.num(x.price))) : ''}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}`;
    }
  };

  /* ---------- Secret Santa ---------- */
  const santa = {
    id: 'santa', label: 'Secret Santa', icon: 'sparkle',
    render(ctx) {
      const s = ctx.state, sa = s.santa, list = players(s), st = drawState(s);
      return `${u.head({ eyebrow: sa.name || 'Secret Santa', title: st === 'ok' ? 'Names are <em>drawn</em>' : 'Draw <em>names</em>', lede: 'Add everyone, mark couples so they don’t draw each other, then draw. Each person taps their own name to see who they got — or print the slips.' })}
      <div class="pl-grid">
        ${u.panel('The exchange', `<div class="pl-fields">${u.field('Name', 'santa.name', sa.name, { ph: 'Family Secret Santa' })}${u.field('Spending limit', 'santa.budget', sa.budget, { num: true, ph: '30' })}${u.field('Gift swap on', 'santa.date', sa.date, { type: 'date' })}</div>`, { icon: 'edit', cls: 'pl-4' })}
        ${u.panel(`Players (${list.length})`, `${u.quickAdd('santa.players', { key: 'name', ph: 'Add a player and press Enter', label: 'Add a Secret Santa player', kind: 'world' })}
          <div class="xm-gap"></div>
          ${u.table('santa.players', sa.players, [
            { k: 'name', label: 'Name', title: true, w: '1fr', ph: 'Name' },
            { k: 'avoid', label: 'Don’t draw', type: 'select', options: r => sa.players.filter(x => x.id !== r.id && P.has(x.name)).map(x => [x.id, x.name]), blank: 'Anyone is fine', w: '160px', rerender: true },
            { k: 'wish', label: 'Wish', w: '1fr', ph: 'Optional hint' }
          ], { what: 'player', empty: 'Add at least three players.', cls: 'xm-compact' })}`, { icon: 'user', cls: 'pl-8' })}
      </div>
      ${u.panel('The draw', `${st === 'stale' ? u.banner('warn', 'The player list changed since the draw. Draw again so everyone has a match.') : ''}
        ${list.length < 3 ? '<p class="pl-muted">You need at least three players to draw names.</p>'
          : `<div class="pl-row">${u.btn(st === 'none' ? 'Draw names' : 'Draw again', { kind: st === 'none' ? 'world' : 'secondary', icon: 'sparkle', act: 'draw' })}${st === 'ok' && sa.drawn ? `<span class="pl-muted">Drawn ${esc(D.short(sa.drawn))}</span>` : ''}</div>`}
        ${st === 'ok' ? `<div class="xm-gap"></div><ul class="gt-santa">${list.map(x => { const open = s.ui.reveal === x.id, to = sa.players.find(y => y.id === sa.pairs[x.id]) || {};
          return `<li><b>${esc(x.name)}</b>${open ? `<span class="gt-to">${I('gift')} You’re Secret Santa for ${esc(to.name)}</span>${to.wish ? `<span class="pl-muted">Hint: ${esc(to.wish)}</span>` : ''}` : '<span class="gt-hidden">Only you should look</span>'}${u.btn(open ? 'Hide' : 'Show my match', { sm: true, kind: open ? 'ghost' : 'secondary', act: 'reveal', data: { id: x.id } })}</li>`; }).join('')}</ul>` : ''}`, { icon: 'sparkle' })}`;
    },
    actions: {
      draw(ctx) {
        const s = ctx.state, pairs = draw(players(s));
        if (!pairs) { ctx.toast('No fair draw with these “don’t draw” rules — loosen one'); return; }
        s.santa.pairs = pairs; s.santa.drawn = D.today(); s.ui.reveal = ''; ctx.toast('Names drawn');
      },
      reveal(ctx, d) { const s = ctx.state; s.ui.reveal = s.ui.reveal === d.id ? '' : d.id; }
    },
    sheet(ctx) {
      const s = ctx.state, sa = s.santa;
      if (drawState(s) !== 'ok') return `<h1>${esc(sa.name || 'Secret Santa')}</h1><p>Draw names first, then print the slips.</p>`;
      return `<h1>${esc(sa.name || 'Secret Santa')}</h1><p class="pl-sheet-meta">${[sa.budget && `Limit ${ctx.money(P.num(sa.budget), { cents: false })}`, sa.date && `Swap on ${D.long(sa.date)}`].filter(Boolean).map(esc).join(' · ')} · cut along the lines and fold each slip</p>
        <div class="gt-slips">${players(s).map(x => { const to = sa.players.find(y => y.id === sa.pairs[x.id]) || {}; return `<div class="gt-slip"><p>For <b>${esc(x.name)}</b> — open in private</p><p class="gt-slip-to">You’re Secret Santa for ${esc(to.name)}</p>${to.wish ? `<p>Hint: ${esc(to.wish)}</p>` : ''}${sa.budget ? `<p>Spend up to ${esc(ctx.money(P.num(sa.budget), { cents: false }))}</p>` : ''}</div>`; }).join('')}</div>`;
    }
  };

  /* ---------- thank-yous ---------- */
  const thanksPage = {
    id: 'thanks', label: 'Thank-yous', icon: 'mail',
    badge: ctx => toThank(ctx.state) || '',
    render(ctx) {
      const s = ctx.state, n = toThank(s);
      return `${u.head({ eyebrow: 'Gifts received', title: n ? `<em>${n}</em> thank-yous to write` : s.received.length ? 'All <em>thanked</em>' : 'Thank-you <em>list</em>', lede: 'Write down who gave what while you open them — then tick each note as it goes out.' })}
      ${u.panel('', `${u.quickAdd('received', { key: 'from', ph: 'Who is it from? Press Enter', label: 'Add a gift received', kind: 'world' })}
        <div class="xm-gap"></div>
        ${u.table('received', s.received, [
          { k: 'from', label: 'From', title: true, w: '1fr', ph: 'Name' },
          { k: 'what', label: 'Gift', w: '1.4fr', ph: 'What they gave' },
          { k: 'sent', label: 'Thanked', type: 'check', w: '84px', rerender: true }
        ], { what: 'gift received', empty: 'Type a name above and press Enter.', cls: 'xm-compact xm-ctab' })}`)}`;
    },
    sheet(ctx) {
      const list = ctx.state.received.filter(x => P.has(x.from));
      return `<h1>Thank-you notes</h1><p class="pl-sheet-meta">${list.length} gifts · ${toThank(ctx.state)} to write</p>
        <table><tbody>${list.map(x => `<tr><td style="width:6mm"><span class="pl-box${x.sent ? ' is-on' : ''}"></span></td><td><b>${esc(x.from)}</b></td><td>${esc(x.what)}</td></tr>`).join('')}</tbody></table>`;
    }
  };
  overview.sheet = gifts.sheet;

  P.create({
    slug: 'christmas-gift-tracker-app', name: 'Christmas Gift Tracker', world: 'holiday', currency: true,
    welcome: 'Add the people you buy for with a budget each, then every gift idea under their name.',
    pages: [overview, gifts, people, stockings, santa, thanksPage],
    blank, sample, normalize,
    rows: { people: () => person(), gifts: () => gift(), stuffers: () => stuffer(), players: () => player(), received: () => thanks() },
    accepts: d => d && typeof d === 'object' && ('people' in d || 'gifts' in d),
    about: '<p><b>Christmas Gift Tracker</b> keeps every gift in one place: a budget for each person, every gift from idea to ordered, bought, wrapped and given, sizes and wish lists, stocking stuffers, a Secret Santa draw with printable slips, and a list of thank-you notes to write.</p>',
    disclaimer: 'Christmas Gift Tracker is a personal planning tool. The Secret Santa draw is random on your device; nothing is sent to anyone.'
  });
})();
