/* Home Binder App — belongings by room with values, serials and proof, plus the insurance policy, from Home Inventory. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const CATS = ['Furniture', 'Electronics', 'Appliances', 'Jewelry & watches', 'Clothing', 'Art & decor', 'Kitchen', 'Tools & outdoor', 'Sports & hobby', 'Documents', 'Other'];
  const STARTER_ROOMS = ['Living room', 'Kitchen', 'Primary bedroom', 'Bedroom 2', 'Bathroom', 'Home office', 'Garage', 'Basement', 'Outdoor / shed'];
  const txt = v => (v == null ? '' : String(v));
  const room = (name, note) => ({ id: P.uid(), name: name || '', note: note || '' });
  const item = o => Object.assign({ id: P.uid(), name: '', room: '', cat: 'Other', qty: '1', value: '', bought: '', price: '', brand: '', serial: '', proof: '', receipt: false, photo: false }, o || {});

  function blank() { return { home: { name: '', address: '', updated: '' }, policy: { insurer: '', number: '', agent: '', phone: '', renews: '', contents: '', deductible: '', claims: '' }, rooms: [], items: [], notes: '' }; }
  function sample() {
    const R = ['Living room', 'Kitchen', 'Primary bedroom', 'Home office', 'Garage'].map(n => room(n));
    const r = n => R.find(x => x.name === n).id;
    return {
      home: { name: 'Maple Street house', address: '18 Maple Ave', updated: D.today() },
      policy: { insurer: 'Harbor Mutual', number: 'HO-3 · 88-41207', agent: 'Dana Ortiz', phone: '(555) 010-7788', renews: D.add(D.today(), 96), contents: '120000', deductible: '1000', claims: '(800) 555-0199' },
      rooms: R,
      items: [
        item({ name: 'Sectional sofa', room: r('Living room'), cat: 'Furniture', value: '1450', bought: '2023-04-12', price: '1699', brand: 'Article', proof: 'Photos/living/sofa.jpg', receipt: true, photo: true }),
        item({ name: '55" TV', room: r('Living room'), cat: 'Electronics', value: '600', bought: '2022-11-25', price: '699', brand: 'Sony X80K', serial: 'SN-448291', proof: 'Email receipt', receipt: true, photo: true }),
        item({ name: 'Stand mixer', room: r('Kitchen'), cat: 'Appliances', value: '379', brand: 'KitchenAid', serial: 'KM-99201', photo: true }),
        item({ name: 'Cookware set', room: r('Kitchen'), cat: 'Kitchen', value: '420', qty: '1', proof: 'Wedding registry list' }),
        item({ name: 'Mattress + frame', room: r('Primary bedroom'), cat: 'Furniture', value: '1200', bought: '2021-06-02', price: '1350', receipt: true }),
        item({ name: 'Engagement ring', room: r('Primary bedroom'), cat: 'Jewelry & watches', value: '4200', proof: 'Appraisal 2024 in the fire box', receipt: true, photo: true }),
        item({ name: 'Laptop', room: r('Home office'), cat: 'Electronics', value: '1499', bought: '2024-02-01', price: '1499', brand: 'MacBook Air 15"', serial: 'C02XL-9K2M', receipt: true, photo: true }),
        item({ name: 'Monitor 27"', room: r('Home office'), cat: 'Electronics', value: '349', brand: 'Dell', serial: 'MON-77120' }),
        item({ name: 'Mountain bike', room: r('Garage'), cat: 'Sports & hobby', value: '900', brand: 'Trek', serial: 'WTU123C4567', photo: true }),
        item({ name: 'Power tools (drill, saw, sander)', room: r('Garage'), cat: 'Tools & outdoor', value: '650' })
      ],
      notes: 'Video walkthrough of every room: phone → Albums → “Home inventory 2026”.\nCopies of this export + receipts live in the fire box and in cloud storage.\nUpdate after big purchases and once a year when the policy renews.'
    };
  }
  function normalize(s) {
    const h = s.home || {}, p = s.policy || {};
    s.home = Object.assign({}, h, { name: txt(h.name), address: txt(h.address), updated: txt(h.updated) });
    s.policy = Object.fromEntries(Object.keys(blank().policy).map(k => [k, txt(p[k])]));
    s.rooms = (Array.isArray(s.rooms) ? s.rooms : []).filter(x => x && typeof x === 'object').map(x => ({ id: txt(x.id) || P.uid(), name: txt(x.name), note: txt(x.note) }));
    const ids = new Set(s.rooms.map(r => r.id));
    s.items = (Array.isArray(s.items) ? s.items : []).filter(x => x && typeof x === 'object').map(x => {
      const o = item(); Object.keys(o).forEach(k => { if (typeof o[k] === 'string') o[k] = txt(x[k]); });
      o.id = o.id || P.uid(); o.room = ids.has(o.room) ? o.room : ''; o.cat = CATS.includes(x.cat) ? x.cat : 'Other'; o.qty = o.qty || '1'; o.receipt = !!x.receipt; o.photo = !!x.photo;
      return o;
    });
    s.notes = txt(s.notes);
    return s;
  }
  const val = it => P.num(it.value) * Math.max(1, P.num(it.qty) || 1);
  const named = s => s.items.filter(i => P.has(i.name));
  const roomName = (s, id) => (s.rooms.find(r => r.id === id) || {}).name || 'No room';
  const total = list => list.reduce((a, i) => a + val(i), 0);

  const overview = {
    id: 'overview', label: 'Overview', icon: 'home',
    render(ctx) {
      const s = ctx.state, h = s.home;
      return `${u.head({ eyebrow: h.name || 'Home inventory', title: '<span data-slot="title"></span>', lede: 'Everything you own, room by room, with the proof an insurer asks for. Update it after big purchases.' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Value by room', '<div data-slot="rooms"></div>', { icon: 'chart', cls: 'pl-7', actions: u.btn('All items', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'items' } }) })}
        ${u.panel('The home', `<div class="pl-fields">${u.field('Name', 'home.name', h.name, { ph: 'Our house' })}${u.field('Address', 'home.address', h.address, { ph: 'Street, city', cls: 'pl-wide' })}${u.field('Last reviewed', 'home.updated', h.updated, { type: 'date' })}</div>`, { icon: 'edit', cls: 'pl-5' })}
      </div>
      <div data-slot="gaps"></div>`;
    },
    slots: {
      title(ctx) { const s = ctx.state, n = named(s).length; return n ? `<em>${esc(ctx.money(total(named(s))))}</em> of belongings` : 'Start your <em>inventory</em>'; },
      kpis(ctx) {
        const s = ctx.state, list = named(s), limit = P.num(s.policy.contents), t = total(list);
        const proof = list.filter(i => i.receipt || i.photo || P.has(i.proof)).length;
        return u.kpis([['Items', String(list.length)], ['Total value', esc(ctx.money(t)), 'y-kpi--world'], ['With proof', list.length ? `${Math.round(proof / list.length * 100)}%` : '—', proof === list.length ? 'is-good' : 'y-kpi--accent', 'receipt, photo or note'], ['Contents coverage', limit ? esc(ctx.money(limit)) : '—', t > limit && limit ? 'is-bad' : '', limit ? (t > limit ? `${esc(ctx.money(t - limit))} more than your limit` : `${esc(ctx.money(limit - t))} headroom`) : 'add it on Policy']]);
      },
      rooms(ctx) {
        const s = ctx.state, groups = s.rooms.map(r => [r.name || 'Unnamed room', total(named(s).filter(i => i.room === r.id)), named(s).filter(i => i.room === r.id).length]);
        const none = named(s).filter(i => !i.room);
        if (none.length) groups.push(['No room', total(none), none.length]);
        const max = Math.max(1, ...groups.map(g => g[1]));
        return groups.length ? `<div class="hi-bars">${groups.map(([n, v, c]) => `<div class="hi-bar"><span>${esc(n)}</span><span class="hi-track"><i style="width:${v / max * 100}%"></i></span><b class="y-num">${esc(ctx.money(v))}</b><small class="pl-muted">${c}</small></div>`).join('')}</div>` : u.empty('home', 'No rooms yet', 'Add the usual rooms in one tap.', u.btn('Add starter rooms', { kind: 'world', icon: 'sparkle', act: 'starter' }));
      },
      gaps(ctx) {
        const s = ctx.state, big = named(s).filter(i => val(i) >= 500 && !i.receipt && !i.photo && !P.has(i.proof));
        return big.length ? u.banner('warn', `<b>${P.plural(big.length, 'valuable item')} with no proof yet:</b> ${big.slice(0, 5).map(i => esc(i.name)).join(', ')}. A quick photo of each (and the serial label) makes claims much easier.`) : '';
      }
    },
    actions: { starter: starterRooms }
  };
  function starterRooms(ctx) { const s = ctx.state, have = new Set(s.rooms.map(r => r.name.toLowerCase())); STARTER_ROOMS.forEach(n => { if (!have.has(n.toLowerCase())) s.rooms.push(room(n)); }); ctx.toast('Rooms added'); }

  const items = {
    id: 'items', label: 'Items', icon: 'list',
    render(ctx) {
      const s = ctx.state, rf = s.rooms.some(r => r.id === s.ui.room) ? s.ui.room : 'all', q = txt(s.ui.q).toLowerCase().trim();
      const list = s.items.map((x, i) => Object.assign({ __i: i }, x)).filter(x => (rf === 'all' || x.room === rf) && (!q || `${x.name} ${x.brand} ${x.serial} ${x.cat}`.toLowerCase().includes(q)));
      return `${u.head({ eyebrow: 'Belongings', title: rf === 'all' ? 'All items' : esc(roomName(s, rf)), lede: 'Value = what it would cost to replace today. Serial numbers and a photo of the label help most with electronics.' })}
      <div class="pl-row hi-tools">${u.chips('ui.room', rf, [['all', 'All rooms', named(s).length], ...s.rooms.map(r => [r.id, r.name || 'Unnamed', named(s).filter(i => i.room === r.id).length])], 'Room')}<span class="pl-spacer"></span>
        <div class="hi-search">${I('eye')}${u.input('ui.q', s.ui.q, { label: 'Search items', ph: 'Search name, brand, serial', live: true })}</div></div>
      ${u.records('items', list, {
        index: x => x.__i, what: 'Item', titlePh: 'Item name', cls: 'hi-items',
        sub: x => `<span data-slot="itemSub" data-arg="${x.__i}"></span>`,
        fields: [
          { k: 'room', label: 'Room', options: s.rooms.map(r => [r.id, r.name || 'Unnamed room']), blank: 'No room' },
          { k: 'cat', label: 'Category', options: CATS },
          { k: 'value', label: 'Value (each)', num: true, ph: '0' }, { k: 'qty', label: 'Qty', num: true, ph: '1' },
          { k: 'brand', label: 'Brand / model', ph: 'Optional' }, { k: 'serial', label: 'Serial #', ph: 'Optional' },
          { k: 'bought', label: 'Bought', type: 'date' }, { k: 'price', label: 'Paid', num: true, ph: '0' },
          { k: 'proof', label: 'Where’s the proof?', ph: 'Photo album, email, folder…', wide: true },
          { k: 'receipt', label: 'Receipt', type: 'check', rerender: true }, { k: 'photo', label: 'Photo', type: 'check', rerender: true }
        ],
        add: rf === 'all' ? 'Add item' : `Add item to ${roomName(s, rf)}`, addKind: 'world',
        empty: named(s).length ? '<p class="pl-muted">No items match.</p>' : u.empty('list', 'No items yet', 'Walk room by room. Start with the expensive things: electronics, jewelry, furniture, bikes.')
      })}`;
    },
    slots: { itemSub(ctx, i) { const x = ctx.state.items[+i]; if (!x) return ''; return `${esc(roomName(ctx.state, x.room))} · <b class="y-num">${esc(ctx.money(val(x)))}</b>${!x.receipt && !x.photo && !P.has(x.proof) ? ' ' + u.pill('no proof', 'warn') : ''}`; } },
    sheet: inventorySheet
  };
  function inventorySheet(ctx) {
    const s = ctx.state, h = s.home, p = s.policy;
    const groups = s.rooms.map(r => [r.name, named(s).filter(i => i.room === r.id)]).concat([['No room', named(s).filter(i => !i.room)]]).filter(g => g[1].length);
    return `<h1>Home inventory</h1><p class="pl-sheet-meta">${[h.name, h.address, h.updated && `Reviewed ${D.full(h.updated)}`, p.insurer && `${p.insurer} ${p.number}`].filter(Boolean).map(esc).join(' · ')} · Total ${esc(ctx.money(total(named(s))))}</p>
      ${groups.map(([n, list]) => `<h2>${esc(n)} · ${esc(ctx.money(total(list)))}</h2><table><thead><tr><th>Item</th><th>Brand / model</th><th>Serial</th><th>Bought</th><th>Qty</th><th>Value</th><th>Proof</th></tr></thead><tbody>${list.map(i => `<tr><td><b>${esc(i.name)}</b></td><td>${esc(i.brand)}</td><td>${esc(i.serial)}</td><td>${i.bought ? esc(D.full(i.bought)) : ''}</td><td>${esc(i.qty)}</td><td style="white-space:nowrap">${esc(ctx.money(val(i)))}</td><td>${[i.receipt && 'receipt', i.photo && 'photo', i.proof].filter(Boolean).map(esc).join(', ')}</td></tr>`).join('')}</tbody></table>`).join('')}`;
  }
  items.sheet = inventorySheet; overview.sheet = inventorySheet;

  const rooms = {
    id: 'rooms', label: 'Rooms', icon: 'home',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Set up', title: 'Rooms', lede: 'Add every room or storage area — garage, shed and storage unit count too.' })}
      ${u.panel('', `${u.table('rooms', s.rooms, [{ k: 'name', label: 'Room', title: true, w: '1fr', ph: 'Room' }, { k: 'note', label: 'Notes', w: '1.4fr', ph: 'Optional' }, { label: 'Items', w: '130px', html: r => `<span class="y-num">${named(s).filter(i => i.room === r.id).length} · ${esc(ctx.money(total(named(s).filter(i => i.room === r.id))))}</span>` }], { what: 'room', move: true, add: 'Add room', empty: 'No rooms yet.' })}
        <div class="pl-list-foot">${u.btn('Add starter rooms', { sm: true, kind: 'ghost', icon: 'sparkle', act: 'starter' })}</div>`)}`;
    },
    actions: { starter: starterRooms }
  };

  const policy = {
    id: 'policy', label: 'Policy', icon: 'lock',
    render(ctx) {
      const p = ctx.state.policy, n = D.parse(p.renews) ? D.diff(D.today(), p.renews) : null;
      return `${u.head({ eyebrow: 'Insurance', title: 'Your policy', lede: 'The details you’ll need on the worst day — keep them next to the inventory.', meta: n != null ? `<span class="y-sticker">${I('calendar')}${n >= 0 ? `Renews in ${n} days` : 'Renewal date passed'}</span>` : '' })}
      ${u.panel('', `<div class="pl-fields">
        ${u.field('Insurer', 'policy.insurer', p.insurer)}${u.field('Policy number', 'policy.number', p.number)}
        ${u.field('Agent', 'policy.agent', p.agent)}${u.field('Agent phone', 'policy.phone', p.phone, { type: 'tel' })}
        ${u.field('Claims line', 'policy.claims', p.claims, { type: 'tel' })}${u.field('Renewal date', 'policy.renews', p.renews, { type: 'date', rerender: true })}
        ${u.field('Contents coverage limit', 'policy.contents', p.contents, { num: true, ph: '0' })}${u.field('Deductible', 'policy.deductible', p.deductible, { num: true, ph: '0' })}</div>`, { icon: 'lock' })}`;
    }
  };

  const notes = {
    id: 'notes', label: 'Notes', icon: 'edit',
    render(ctx) { return `${u.head({ eyebrow: 'Parking lot', title: 'Notes', lede: 'Where the backups and receipts live, walkthrough video location, claim history.' })}${u.notes('notes', ctx.state.notes, { rows: 12 })}`; }
  };

  window.HBInventory = {
    pages: { overview, items, rooms, policy }, blank, sample, normalize,
    rows: { rooms: () => room(), items: ctx => item({ room: ctx.state.rooms.some(r => r.id === ctx.state.ui.room) ? ctx.state.ui.room : '' }) }
  };
})();
