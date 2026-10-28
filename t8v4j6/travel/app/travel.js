/* Travel Planner App — the trip day by day, bookings with confirmation numbers, a budget with a fair split and settle-up,
   packing by bag, travel documents and places to go. Yaykit planner engine, voyage world (travel.css).
   Day cards, bookings, the split and packing come from Bachelorette Weekend (weekend.js); travelers, the budget by category
   with a home-currency rate, settle-up, documents with passport checks and the ideas list are new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon, Y = window.Yay;
  const TYPES = ['Flight', 'Stay', 'Train', 'Car', 'Tour', 'Restaurant', 'Other'];
  const CAT_OF = { Flight: 'Transport', Train: 'Transport', Car: 'Transport', Stay: 'Stay', Tour: 'Activities', Restaurant: 'Food', Other: 'Other' };
  const CATS = ['Stay', 'Transport', 'Food', 'Activities', 'Shopping', 'Other'];
  const STATUS = ['Idea', 'Booked', 'Paid'];
  const DOCS = ['Passport', 'Visa / entry form', 'Travel insurance', 'Vaccines', 'ID / driver’s license', 'Other'];
  const KINDS = ['See', 'Eat', 'Do', 'Shop'];
  const PRIO = ['Must', 'Nice', 'Maybe'];
  const HOMES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD'];
  const STARTER = [['Passports + copies', 'Documents'], ['Boarding passes / tickets', 'Documents'], ['Travel insurance card', 'Documents'], ['Cards + a little cash', 'Documents'],
    ['Phone + charger', 'Tech'], ['Plug adapter', 'Tech'], ['Power bank', 'Tech'], ['Headphones', 'Tech'],
    ['Toothbrush + toothpaste', 'Toiletries'], ['Sunscreen', 'Toiletries'], ['Deodorant', 'Toiletries'], ['Shampoo (travel size)', 'Toiletries'],
    ['Walking shoes', 'Clothes'], ['Underwear + socks', 'Clothes'], ['Light jacket', 'Clothes'], ['Sleepwear', 'Clothes'],
    ['Prescription meds', 'Meds'], ['Pain reliever', 'Meds'], ['Band-aids + blister plasters', 'Meds']];
  const txt = v => (v == null ? '' : String(v));
  const r2 = n => Math.round(n * 100) / 100;
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);

  const traveler = o => Object.assign({ id: P.uid(), name: '' }, o || {});
  const plan = o => Object.assign({ id: P.uid(), date: '', time: '', what: '', where: '', booked: false, note: '' }, o || {});
  const booking = o => Object.assign({ id: P.uid(), name: '', type: 'Stay', status: 'Idea', date: '', time: '', ref: '', cost: '', payer: '', cancelBy: '', address: '', note: '' }, o || {});
  const cat = (name, planned) => ({ id: P.uid(), name: name || '', plan: txt(planned) });
  const spend = o => Object.assign({ id: P.uid(), date: D.today(), what: '', cat: 'Food', amount: '', payer: '', forWho: 'all' }, o || {});
  const pack = o => Object.assign({ id: P.uid(), text: '', bag: 'Everyone', kind: '', done: false }, o || {});
  const doc = o => Object.assign({ id: P.uid(), tid: '', kind: 'Passport', number: '', expires: '', have: false }, o || {});
  const idea = o => Object.assign({ id: P.uid(), name: '', kind: 'See', area: '', prio: 'Nice', link: '', day: '' }, o || {});

  function blank() {
    return { trip: { place: '', start: '', end: '', home: 'USD', rate: '' }, travelers: [], plans: [], bookings: [], cats: CATS.map(c => cat(c)), spends: [], packing: [], docs: [],
      emergency: { embassy: '', insurance: '', stay: '', contact: '' }, ideas: [], notes: '' };
  }
  function sample() {
    const s = D.add(D.today(), 40), d = n => D.add(s, n);
    const a = traveler({ name: 'Alex' }), b = traveler({ name: 'Sam' });
    const pl = (n, time, what, where, booked, note) => plan({ date: d(n), time, what, where, booked: !!booked, note: note || '' });
    return {
      currency: 'EUR',
      trip: { place: 'Lisbon + Porto', start: s, end: d(6), home: 'USD', rate: '1.08' },
      travelers: [a, b],
      plans: [pl(0, '07:05', 'Land in Lisbon', 'Lisbon airport (LIS)', true, 'Metro red line to the city'), pl(0, '15:00', 'Check in', 'Casa Alfama Hotel', true), pl(0, '19:30', 'Sunset at a viewpoint', 'Miradouro da Graça', false, 'Bring a jacket'),
        pl(1, '10:00', 'Belém: tower, monastery, custard tarts', 'Belém', false), pl(1, '20:30', 'Seafood dinner', 'Cervejaria Ramiro', false, 'No reservations — go early'),
        pl(2, '09:00', 'Sintra day tour', 'Pickup at the hotel', true, 'Comfy shoes, water'),
        pl(3, '11:00', 'LX Factory + tram 28', 'Alcântara', false), pl(4, '10:39', 'Train to Porto', 'Santa Apolónia station', true, 'Coach 4'),
        pl(4, '14:00', 'Check in', 'Ribeira Loft, Porto', true), pl(5, '08:30', 'Douro Valley wine tour', 'Pickup in Ribeira', true),
        pl(6, '11:50', 'Fly home', 'Porto airport (OPO)', true, 'Be there by 9:30')],
      bookings: [booking({ name: 'Flights BOS → LIS, OPO → BOS', type: 'Flight', status: 'Paid', date: d(0), time: '07:05', ref: 'K6QLM2', cost: '1240', payer: a.id, note: 'Two seats, one checked bag each' }),
        booking({ name: 'Casa Alfama Hotel', type: 'Stay', status: 'Paid', date: d(0), time: '15:00', ref: 'BK-3816552904', cost: '860', payer: b.id, cancelBy: d(-7), address: 'Rua dos Remédios 12, Lisbon', note: '4 nights, breakfast included' }),
        booking({ name: 'Sintra day tour', type: 'Tour', status: 'Booked', date: d(2), time: '09:00', ref: 'GT-77120', cost: '138', payer: a.id, cancelBy: d(1) }),
        booking({ name: 'Train Lisbon → Porto', type: 'Train', status: 'Booked', date: d(4), time: '10:39', ref: 'CP 4471 · coach 4', cost: '62', payer: b.id }),
        booking({ name: 'Ribeira Loft', type: 'Stay', status: 'Booked', date: d(4), time: '14:00', ref: 'HMQ8N2TZ', cost: '540', payer: a.id, cancelBy: d(-14), address: 'Rua da Fonte Taurina 30, Porto', note: '2 nights · self check-in code by email' }),
        booking({ name: 'Douro Valley wine tour', type: 'Tour', status: 'Booked', date: d(5), time: '08:30', ref: 'DV-2210', cost: '190', payer: b.id }),
        booking({ name: 'Cervejaria Ramiro', type: 'Restaurant', status: 'Idea', date: d(1), time: '20:30' })],
      cats: [cat('Stay', 1500), cat('Transport', 1400), cat('Food', 700), cat('Activities', 400), cat('Shopping', 200), cat('Other', 150)],
      spends: [spend({ date: D.add(D.today(), -6), what: 'Travel insurance (both)', cat: 'Other', amount: '96', payer: a.id }), spend({ date: D.add(D.today(), -4), what: 'eSIM data plans', cat: 'Other', amount: '24', payer: b.id }),
        spend({ date: D.add(D.today(), -3), what: 'Plug adapters', cat: 'Shopping', amount: '18', payer: b.id }), spend({ date: D.add(D.today(), -2), what: 'Guidebook', cat: 'Shopping', amount: '22', payer: a.id, forWho: a.id })],
      packing: STARTER.slice(0, 12).map(([t, k], i) => pack({ text: t, kind: k, bag: k === 'Documents' ? 'Shared' : 'Everyone', done: i < 3 }))
        .concat([pack({ text: 'Camera + spare battery', bag: 'Alex', kind: 'Tech' }), pack({ text: 'Running shoes', bag: 'Sam', kind: 'Clothes', done: true }), pack({ text: 'Allergy tablets', bag: 'Sam', kind: 'Meds' })]),
      docs: [doc({ tid: a.id, kind: 'Passport', number: '•••• 4821', expires: D.add(D.today(), 1100), have: true }), doc({ tid: a.id, kind: 'Travel insurance', number: 'TS-448210', expires: d(10), have: true }),
        doc({ tid: a.id, kind: 'ID / driver’s license', expires: D.add(D.today(), 900), have: true }),
        doc({ tid: b.id, kind: 'Passport', number: '•••• 1907', expires: D.add(D.today(), 760), have: true }), doc({ tid: b.id, kind: 'Travel insurance', number: 'TS-448210', expires: d(10), have: true })],
      emergency: { embassy: 'Your embassy in Lisbon — save the address and phone before you go', insurance: 'TripSafe 24/7 line (on the card) · policy TS-448210', stay: 'Casa Alfama Hotel, Rua dos Remédios 12 · then Ribeira Loft, Rua da Fonte Taurina 30', contact: 'Mom: (617) 555-0134' },
      ideas: [idea({ name: 'Custard tarts in Belém', kind: 'Eat', area: 'Belém', prio: 'Must', day: d(1) }), idea({ name: 'Miradouro da Senhora do Monte', kind: 'See', area: 'Graça', prio: 'Must', day: d(0) }),
        idea({ name: 'LX Factory', kind: 'Shop', area: 'Alcântara', prio: 'Nice', day: d(3) }), idea({ name: 'Time Out Market', kind: 'Eat', area: 'Cais do Sodré', prio: 'Nice' }),
        idea({ name: 'Livraria Lello', kind: 'See', area: 'Porto · Baixa', prio: 'Maybe' }), idea({ name: 'Francesinha for lunch', kind: 'Eat', area: 'Porto', prio: 'Must', day: d(4) }),
        idea({ name: 'Fado night', kind: 'Do', area: 'Alfama', prio: 'Nice' })],
      notes: 'Tipping: round up in cafés, ~10% at dinner.\nMuseums are closed most Mondays.\nTram 28 gets packed after 10 am — go early.'
    };
  }
  function normalize(s) {
    const t = s.trip || {};
    s.trip = { place: txt(t.place), start: D.parse(t.start) ? t.start : '', end: D.parse(t.end) ? t.end : '', home: HOMES.includes(t.home) ? t.home : 'USD', rate: txt(t.rate) };
    s.travelers = arr(s.travelers, x => traveler({ id: txt(x.id) || P.uid(), name: txt(x.name) }));
    s.plans = arr(s.plans, x => plan({ id: txt(x.id) || P.uid(), date: txt(x.date), time: txt(x.time), what: txt(x.what), where: txt(x.where), booked: !!x.booked, note: txt(x.note) }));
    s.bookings = arr(s.bookings, x => booking({ id: txt(x.id) || P.uid(), name: txt(x.name), type: TYPES.includes(x.type) ? x.type : 'Other', status: STATUS.includes(x.status) ? x.status : 'Idea',
      date: txt(x.date), time: txt(x.time), ref: txt(x.ref), cost: txt(x.cost), payer: txt(x.payer), cancelBy: txt(x.cancelBy), address: txt(x.address), note: txt(x.note) }));
    s.cats = arr(s.cats, x => Object.assign(cat(txt(x.name), x.plan), { id: txt(x.id) || P.uid() }));
    s.spends = arr(s.spends, x => spend({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), what: txt(x.what), cat: txt(x.cat) || 'Other', amount: txt(x.amount), payer: txt(x.payer), forWho: txt(x.forWho) || 'all' }));
    s.packing = arr(s.packing, x => pack({ id: txt(x.id) || P.uid(), text: txt(x.text), bag: txt(x.bag) || 'Everyone', kind: txt(x.kind), done: !!x.done }));
    s.docs = arr(s.docs, x => doc({ id: txt(x.id) || P.uid(), tid: txt(x.tid), kind: DOCS.includes(x.kind) ? x.kind : 'Other', number: txt(x.number), expires: D.parse(x.expires) ? x.expires : '', have: !!x.have }));
    const e = s.emergency || {};
    s.emergency = { embassy: txt(e.embassy), insurance: txt(e.insurance), stay: txt(e.stay), contact: txt(e.contact) };
    s.ideas = arr(s.ideas, x => idea({ id: txt(x.id) || P.uid(), name: txt(x.name), kind: KINDS.includes(x.kind) ? x.kind : 'See', area: txt(x.area), prio: PRIO.includes(x.prio) ? x.prio : 'Nice', link: txt(x.link), day: D.parse(x.day) ? x.day : '' }));
    s.notes = txt(s.notes);
    return s;
  }

  /* ---------- math ---------- */
  function days(s) {
    const a = s.trip.start, b = s.trip.end && s.trip.end >= a ? s.trip.end : a, out = [];
    if (a) for (let d = a, n = 0; d <= b && n < 30; d = D.add(d, 1), n++) out.push(d);
    return out;
  }
  const byTime = (a, b) => (D.mins(a.time) == null ? 1e9 : D.mins(a.time)) - (D.mins(b.time) == null ? 1e9 : D.mins(b.time));
  const people = s => s.travelers.filter(t => P.has(t.name));
  const nameOf = (s, id) => (s.travelers.find(t => t.id === id) || {}).name || '';
  const bags = s => ['Everyone'].concat(people(s).map(t => t.name), ['Shared']);
  /* money spent = paid bookings + the spending log; everything here is in the trip currency */
  function money(s) {
    const spent = {}; CATS.concat(s.cats.map(c => c.name)).forEach(c => { spent[c] = 0; });
    s.bookings.filter(b => b.status === 'Paid').forEach(b => { const c = CAT_OF[b.type]; spent[c] = (spent[c] || 0) + P.num(b.cost); });
    s.spends.forEach(x => { spent[x.cat] = (spent[x.cat] || 0) + P.num(x.amount); });
    const total = r2(Object.values(spent).reduce((a, v) => a + v, 0)), planned = r2(s.cats.reduce((a, c) => a + P.num(c.plan), 0));
    return { spent, total, planned, left: r2(planned - total), booked: r2(s.bookings.filter(b => b.status !== 'Idea').reduce((a, b) => a + P.num(b.cost), 0)) };
  }
  /* who paid what for whom: paid bookings are shared by everyone, a spending entry by everyone or one person */
  function settle(s) {
    const ppl = people(s), bal = Object.fromEntries(ppl.map(t => [t.id, { paid: 0, share: 0 }]));
    const share = (amount, payer, forWho) => {
      const v = P.num(amount), who = forWho === 'all' || !bal[forWho] ? ppl.map(t => t.id) : [forWho];
      if (!v || !who.length || !bal[payer]) return;
      bal[payer].paid += v; who.forEach(id => { bal[id].share += v / who.length; });
    };
    s.bookings.filter(b => b.status === 'Paid').forEach(b => share(b.cost, b.payer, 'all'));
    s.spends.forEach(x => share(x.amount, x.payer, x.forWho));
    const rows = ppl.map(t => ({ id: t.id, name: t.name, paid: r2(bal[t.id].paid), share: r2(bal[t.id].share), net: r2(bal[t.id].paid - bal[t.id].share) }));
    const pos = rows.filter(r => r.net > 0.004).map(r => Object.assign({}, r)).sort((a, b) => b.net - a.net), neg = rows.filter(r => r.net < -0.004).map(r => Object.assign({}, r)).sort((a, b) => a.net - b.net), moves = [];
    let i = 0, j = 0;
    while (i < neg.length && j < pos.length) {
      const v = r2(Math.min(-neg[i].net, pos[j].net));
      if (v > 0) moves.push({ from: neg[i].name, to: pos[j].name, amount: v });
      neg[i].net = r2(neg[i].net + v); pos[j].net = r2(pos[j].net - v);
      if (Math.abs(neg[i].net) < 0.005) i++;
      if (Math.abs(pos[j].net) < 0.005) j++;
    }
    return { rows, moves };
  }
  const home = (ctx, v) => { const s = ctx.state, rate = P.num(s.trip.rate); return rate && s.trip.home !== s.currency ? Y.fmt.money(v * rate, { currency: s.trip.home }) : ''; };
  /* passports should be valid six months past the day you come home */
  function docWarn(s) {
    const back = s.trip.end || s.trip.start;
    if (!back) return [];
    const need = D.add(back, 182);
    return s.docs.filter(x => x.kind === 'Passport' && x.expires && x.expires < need).map(x => ({ x, name: nameOf(s, x.tid) || 'Someone', expired: x.expires < back }));
  }
  const dayLabel = d => `${D.fmt(d, { weekday: 'short' })} ${D.short(d)}`;

  /* ---------- trip ---------- */
  const trip = {
    id: 'trip', label: 'Trip', icon: 'star',
    render(ctx) {
      const s = ctx.state, t = s.trip, ds = days(s), until = t.start ? D.diff(D.today(), t.start) : null;
      const lost = s.plans.map((p, i) => Object.assign({ __i: i }, p)).filter(p => !ds.includes(p.date));
      const card = (d, list) => {
        const ideas = d ? s.ideas.filter(x => x.day === d && P.has(x.name)) : [];
        return `<article class="tp-day">
          <header><h3>${d ? esc(D.fmt(d, { weekday: 'long' })) : 'Outside the trip dates'}</h3>${d ? `<span class="pl-muted">${esc(D.short(d))} · day ${ds.indexOf(d) + 1}</span>` : ''}</header>
          <ol class="tp-plans">${list.sort(byTime).map(p => `<li class="tp-plan${p.booked ? ' is-booked' : ''}">
            <div class="tp-plan-time">${u.input(`plans.${p.__i}.time`, p.time, { type: 'time', label: `Time for ${p.what || 'plan'}` })}</div>
            <div class="tp-plan-main">${u.input(`plans.${p.__i}.what`, p.what, { label: 'What', ph: 'What’s happening', cls: 'tp-what' })}${u.input(`plans.${p.__i}.where`, p.where, { label: 'Where', ph: 'Where', cls: 'tp-where' })}${u.input(`plans.${p.__i}.note`, p.note, { label: 'Note', ph: 'Note', cls: 'tp-where' })}</div>
            <div class="tp-plan-side">${u.check(`plans.${p.__i}.booked`, p.booked, 'Booked', { cls: 'tp-booked', rerender: true })}${u.iconBtn('close', `Remove ${p.what || 'plan'}`, 'remove', { list: 'plans', i: p.__i, what: p.what })}</div></li>`).join('')}</ol>
          ${ideas.length ? `<ul class="tp-day-ideas">${ideas.map(x => `<li>${I('star')}<b>${esc(x.name)}</b><span>${esc(x.kind)}${x.area ? ` · ${esc(x.area)}` : ''}</span></li>`).join('')}</ul>` : ''}
          ${d ? u.btn('Add to this day', { sm: true, icon: 'plus', act: 'addPlan', data: { date: d } }) : ''}</article>`;
      };
      return `${u.head({ eyebrow: t.start ? `${D.short(t.start)}${t.end && t.end !== t.start ? ` – ${D.short(t.end)}` : ''}` : 'Travel planner', title: t.place ? `<em>${esc(t.place)}</em>` : 'Plan the <em>trip</em>',
        meta: `${until != null && until >= 0 ? `<span class="y-sticker">${I('calendar')}${until ? `${P.plural(until, 'day')} to go` : 'You leave today!'}</span>` : ''}${people(s).length ? `<span>${esc(people(s).map(x => x.name).join(' + '))}</span>` : ''}` })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('The trip', `<div class="pl-fields">${u.field('Destination', 'trip.place', t.place, { ph: 'City or country', cls: 'pl-wide' })}${u.field('First day', 'trip.start', t.start, { type: 'date', rerender: true })}${u.field('Last day', 'trip.end', t.end, { type: 'date', rerender: true })}</div>`, { icon: 'edit', cls: 'pl-7' })}
        ${u.panel('Travelers', `${u.quickAdd('travelers', { key: 'name', ph: 'Add a traveler', label: 'Add a traveler', kind: 'world' })}<div class="tp-gap"></div>
          ${u.table('travelers', s.travelers, [{ k: 'name', label: 'Name', title: true, ph: 'Name', w: '1fr' }], { what: 'traveler', cls: 'tp-people', empty: 'Who’s going? The split and packing use these names.' })}`, { icon: 'user', cls: 'pl-5' })}
      </div>
      ${ds.length ? `<div class="tp-days">${ds.map(d => card(d, s.plans.map((p, i) => Object.assign({ __i: i }, p)).filter(p => p.date === d))).join('')}${lost.length ? card(null, lost) : ''}</div>`
        : u.empty('calendar', 'Set the dates first', 'Add the first and last day above — each day gets its own plan card.', '')}`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, m = money(s), real = s.bookings.filter(b => P.has(b.name)), ok = real.filter(b => b.status !== 'Idea').length, packed = s.packing.filter(p => p.done && P.has(p.text)).length, all = s.packing.filter(p => P.has(p.text)).length;
        return u.kpis([['Days', String(days(s).length), 'y-kpi--world', s.trip.place ? esc(s.trip.place) : 'set the dates'], ['Bookings confirmed', `${ok}<small class="tp-of">/${real.length}</small>`, ok === real.length && real.length ? 'is-good' : ''],
          ['Budget left', m.planned ? esc(ctx.money(m.left, { cents: false })) : '—', m.left < 0 ? 'y-kpi--accent' : '', m.planned ? `${esc(ctx.money(m.total, { cents: false }))} spent of ${esc(ctx.money(m.planned, { cents: false }))}` : 'set it on Budget'],
          ['Packed', `${packed}<small class="tp-of">/${all}</small>`, all && packed === all ? 'is-good' : '']]);
      }
    },
    actions: { addPlan(ctx, d) { const s = ctx.state; s.plans.push(plan({ date: d.date })); ctx.focus(`[data-bind="plans.${s.plans.length - 1}.what"]`); } },
    sheet(ctx) {
      const s = ctx.state, t = s.trip;
      return `<h1>${esc(t.place || 'Our trip')}</h1><p class="pl-sheet-meta">${[t.start && `${D.full(t.start)}${t.end && t.end !== t.start ? ' – ' + D.full(t.end) : ''}`, people(s).map(x => x.name).join(', ')].filter(Boolean).map(esc).join(' · ')}</p>
        ${days(s).map(d => { const list = s.plans.filter(p => p.date === d && P.has(p.what)).sort(byTime), bk = s.bookings.filter(b => b.date === d && b.status !== 'Idea' && P.has(b.name));
          return list.length || bk.length ? `<h2>${esc(D.long(d))}</h2><table><tbody>${list.map(p => `<tr><td style="width:22mm;white-space:nowrap"><b>${esc(D.time(p.time))}</b></td><td><b>${esc(p.what)}</b>${p.where ? `<br>${esc(p.where)}` : ''}</td><td>${esc(p.note)}</td></tr>`).join('')}
            ${bk.map(b => `<tr><td style="width:22mm">${esc(D.time(b.time))}</td><td>${esc(b.type)}: <b>${esc(b.name)}</b>${b.address ? `<br>${esc(b.address)}` : ''}</td><td>${b.ref ? `Conf. ${esc(b.ref)}` : ''}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}
        ${Object.values(s.emergency).some(Boolean) ? `<h2>Emergency</h2><p>${[s.emergency.embassy, s.emergency.insurance, s.emergency.stay, s.emergency.contact].filter(Boolean).map(esc).join('<br>')}</p>` : ''}`;
    }
  };

  /* ---------- bookings ---------- */
  const bookings = {
    id: 'bookings', label: 'Bookings', icon: 'calendar',
    badge: ctx => ctx.state.bookings.filter(b => P.has(b.name) && b.status === 'Idea').length || '',
    render(ctx) {
      const s = ctx.state, t = D.today();
      const list = s.bookings.map((b, i) => Object.assign({ __i: i }, b)).sort((a, b) => `${a.date || '9'} ${a.time}` < `${b.date || '9'} ${b.time}` ? -1 : 1);
      return `${u.head({ eyebrow: 'Reservations', title: 'Bookings', lede: 'Flights, stays, trains, tours and tables in date order — each with its confirmation number, cost and the last day to cancel for free.' })}
      ${u.records('bookings', list, {
        what: 'Booking', titlePh: 'Hotel, airline, tour…', index: b => b.__i, cls: 'tp-bookings', cardClass: b => (b.status === 'Idea' ? 'is-muted' : ''),
        sub: b => `${u.pill(b.status, b.status === 'Paid' ? 'good' : b.status === 'Booked' ? 'world' : '')} ${esc(b.type)}${b.date ? ` · ${esc(dayLabel(b.date))}${b.time ? ` ${esc(D.time(b.time))}` : ''}` : ''}${b.cancelBy && b.status !== 'Idea' && b.cancelBy >= t && D.diff(t, b.cancelBy) <= 7 ? ` ${u.pill(`free cancel until ${D.short(b.cancelBy)}`, 'warn')}` : ''}`,
        fields: [{ k: 'type', label: 'Type', options: TYPES, rerender: true }, { k: 'status', label: 'Status', options: STATUS, rerender: true }, { k: 'date', label: 'Date', type: 'date', rerender: true }, { k: 'time', label: 'Time', type: 'time' },
          { k: 'ref', label: 'Confirmation #', ph: 'Reference' }, { k: 'cost', label: `Cost (${s.currency})`, num: true, ph: '0' },
          { k: 'payer', label: 'Paid by', options: people(s).map(x => [x.id, x.name]), blank: 'Who pays?', rerender: true }, { k: 'cancelBy', label: 'Free cancel until', type: 'date' },
          { k: 'address', label: 'Address', wide: true, ph: 'Street, city' }, { k: 'note', label: 'Notes', type: 'textarea', wide: true, ph: 'Baggage, check-in times, door codes' }],
        add: 'Add booking', addKind: 'world', empty: u.empty('calendar', 'No bookings yet', 'Start with the flights and the first night’s stay.')
      })}`;
    }
  };

  /* ---------- budget ---------- */
  const budget = {
    id: 'budget', label: 'Budget', icon: 'money',
    render(ctx) {
      const s = ctx.state, who = [['all', 'Everyone']].concat(people(s).map(x => [x.id, `Only ${x.name}`]));
      const rows = s.spends.map((x, i) => Object.assign({ __i: i }, x)).sort((a, b) => (a.date < b.date ? 1 : -1));
      return `${u.head({ eyebrow: 'Trip money', title: '<span data-slot="title"></span>', lede: `Paid bookings count by themselves; log everything else as you go. Amounts are in the trip currency, ${esc(s.currency)}.` })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Budget by category', u.table('cats', s.cats, [
          { k: 'name', label: 'Category', title: true, w: '1.3fr', ph: 'Category' },
          { k: 'plan', label: 'Planned', num: true, w: '110px', ph: '0' },
          { label: 'Spent', w: '110px', html: c => `<span class="tp-cell y-num" data-slot="cspent" data-arg="${esc(c.id)}"></span>` },
          { label: 'Left', w: '110px', html: c => `<span class="tp-cell y-num" data-slot="cleft" data-arg="${esc(c.id)}"></span>` }
        ], { what: 'category', add: 'Add category', tpl: 'cats', cls: 'tp-cats' }), { icon: 'chart', cls: 'pl-7' })}
        ${u.panel('Settle up', '<div data-slot="settle"></div>', { icon: 'user', cls: 'pl-5' })}
      </div>
      ${u.panel('Spending log', `${u.table('spends', rows, [
          { k: 'date', label: 'Date', type: 'date', w: '150px' },
          { k: 'what', label: 'What', title: true, w: '1.4fr', ph: 'Dinner, taxi, museum' },
          { k: 'cat', label: 'Category', type: 'select', options: s.cats.map(c => c.name).filter(Boolean), w: '130px', rerender: true },
          { k: 'amount', label: 'Amount', num: true, w: '100px', ph: '0' },
          { k: 'payer', label: 'Paid by', type: 'select', options: people(s).map(x => [x.id, x.name]), blank: 'Who?', w: '120px', rerender: true },
          { k: 'forWho', label: 'For', type: 'select', options: who, w: '130px', rerender: true }
        ], { index: x => x.__i, total: s.spends.length, what: 'expense', cls: 'tp-spends', empty: 'Nothing logged yet — add what you pay on the trip.' })}
        <div class="pl-list-foot">${u.btn('Add expense', { sm: true, kind: 'world', icon: 'plus', act: 'addSpend' })}</div>`, { icon: 'list' })}
      ${u.panel('Currencies', `<div class="pl-fields tp-rate">${u.field('Trip currency', 'currency', s.currency, { options: HOMES, rerender: true })}${u.field('Home currency', 'trip.home', s.trip.home, { options: HOMES, rerender: true })}${u.field(`1 ${s.currency} = ? ${s.trip.home}`, 'trip.rate', s.trip.rate, { num: true, ph: '1.08', rerender: true, hint: 'Optional. Shows totals in your home money too.' })}</div>`, { icon: 'money' })}`;
    },
    slots: {
      title(ctx) { const m = money(ctx.state); return m.planned ? `<em>${esc(ctx.money(m.left, { cents: false }))}</em> ${m.left < 0 ? 'over budget' : 'left'}` : 'Trip <em>budget</em>'; },
      kpis(ctx) {
        const m = money(ctx.state), h = v => home(ctx, v);
        return `${u.kpis([['Planned', esc(ctx.money(m.planned, { cents: false })), 'y-kpi--world', h(m.planned) ? `≈ ${esc(h(m.planned))}` : ''], ['Spent', esc(ctx.money(m.total)), m.left < 0 ? 'y-kpi--accent' : '', h(m.total) ? `≈ ${esc(h(m.total))}` : 'paid bookings + the log'],
          ['Booked so far', esc(ctx.money(m.booked, { cents: false })), '', 'booked or paid'], ['Left', esc(ctx.money(m.left)), m.left < 0 ? 'y-kpi--accent' : 'is-good', h(m.left) ? `≈ ${esc(h(m.left))}` : '']])}${u.meter(m.planned ? m.total / m.planned * 100 : 0, 'Budget used', { over: m.left < 0, cls: 'tp-meter' })}`;
      },
      cspent(ctx, id) { const s = ctx.state, c = s.cats.find(x => x.id === id); return c ? esc(ctx.money(money(s).spent[c.name] || 0)) : ''; },
      cleft(ctx, id) { const s = ctx.state, c = s.cats.find(x => x.id === id); if (!c || !P.has(c.plan)) return ''; const l = r2(P.num(c.plan) - (money(s).spent[c.name] || 0)); return `<span class="${l < 0 ? 'is-over' : ''}">${esc(ctx.money(l))}</span>`; },
      settle(ctx) {
        const s = ctx.state, x = settle(s);
        if (x.rows.length < 2) return '<p class="pl-muted">Add two or more travelers on the Trip page to split costs.</p>';
        return `${x.moves.length ? `<div class="tp-settle">${x.moves.map(m => `<p class="tp-move"><b>${esc(m.from)}</b> pays <b>${esc(m.to)}</b> <span class="y-num">${esc(ctx.money(m.amount))}</span></p>`).join('')}</div>` : u.banner('good', 'All square — nobody owes anything.')}
          <dl class="tp-who">${x.rows.map(r => `<div><dt>${esc(r.name)}</dt><dd class="y-num">paid ${esc(ctx.money(r.paid))} · share ${esc(ctx.money(r.share))}</dd></div>`).join('')}</dl>`;
      }
    },
    actions: {
      addSpend(ctx) { const s = ctx.state; s.spends.push(spend({ payer: (people(s)[0] || {}).id || '' })); ctx.focus(`[data-bind="spends.${s.spends.length - 1}.what"]`); }
    }
  };

  /* ---------- packing ---------- */
  const packing = {
    id: 'packing', label: 'Packing', icon: 'check',
    badge: ctx => ctx.state.packing.filter(p => !p.done && P.has(p.text)).length || '',
    render(ctx) {
      const s = ctx.state, bs = bags(s), extra = [...new Set(s.packing.map(p => p.bag))].filter(b => !bs.includes(b));
      return `${u.head({ eyebrow: 'Don’t forget', title: 'Packing list', lede: 'One list for everyone, one per traveler, and the shared things. Tick as it goes in the bag.' })}
      <div class="pl-row tp-packtools">${u.btn('Add the starter list', { icon: 'sparkle', kind: 'world', act: 'starter' })}<span class="pl-muted">Documents, tech, toiletries, clothes and meds — skips what you already have.</span></div>
      <div class="tp-bags">${bs.concat(extra).map(bag => {
        const items = s.packing.map((p, i) => Object.assign({ __i: i }, p)).filter(p => p.bag === bag);
        if (!items.length && extra.includes(bag)) return '';
        return u.panel(bag, `${u.checklist('packing', items, { index: p => p.__i, total: s.packing.length, ph: 'Item', what: 'item', meta: p => (p.kind ? esc(p.kind) : '') })}<div class="tp-bag-add">${u.btn(`Add to ${bag}`, { sm: true, icon: 'plus', act: 'addPack', data: { bag } })}</div>`,
          { icon: bag === 'Shared' ? 'briefcase' : bag === 'Everyone' ? 'check' : 'user', cls: 'y-panel--flat', actions: items.length ? u.pill(`${items.filter(p => p.done).length}/${items.length}`, items.every(p => p.done) ? 'good' : '') : '' });
      }).join('')}</div>`;
    },
    actions: {
      addPack(ctx, d) { const s = ctx.state; s.packing.push(pack({ bag: d.bag })); ctx.focus(`[data-bind="packing.${s.packing.length - 1}.text"]`); },
      starter(ctx) {
        const s = ctx.state, have = new Set(s.packing.map(p => p.text.trim().toLowerCase()));
        const add = STARTER.filter(([t]) => !have.has(t.toLowerCase()));
        add.forEach(([t, k]) => s.packing.push(pack({ text: t, kind: k, bag: k === 'Documents' ? 'Shared' : 'Everyone' })));
        ctx.toast(add.length ? `${P.plural(add.length, 'item')} added` : 'You already have the starter list');
      }
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Packing list</h1><p class="pl-sheet-meta">${esc([s.trip.place, s.trip.start && D.full(s.trip.start)].filter(Boolean).join(' · '))}</p>
        ${bags(s).map(bag => { const l = s.packing.filter(p => p.bag === bag && P.has(p.text)); return l.length ? `<h2>${esc(bag)}</h2><table><tbody>${l.map(p => `<tr><td style="width:6mm"><span class="pl-box${p.done ? ' is-on' : ''}"></span></td><td>${esc(p.text)}</td><td style="width:30mm">${esc(p.kind)}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}`;
    }
  };

  /* ---------- documents ---------- */
  const docs = {
    id: 'docs', label: 'Documents', icon: 'doc',
    badge: ctx => docWarn(ctx.state).length || '',
    render(ctx) {
      const s = ctx.state, warn = docWarn(s), ppl = people(s);
      return `${u.head({ eyebrow: 'Papers + safety', title: 'Documents', lede: 'Passports, visas, insurance and IDs for each traveler — with a check that every passport is valid six months past the day you come home.' })}
      ${warn.map(w => u.banner(w.expired ? 'bad' : 'warn', `<b>${esc(w.name)}’s passport</b> ${w.expired ? 'expires before you come home' : `expires ${esc(D.short(w.x.expires))} — less than 6 months after you come home`}. Many countries won’t let you in; renew it now.`)).join('')}
      ${ppl.length ? `<div class="tp-bags tp-docgrid">${ppl.map(p => {
        const rows = s.docs.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.tid === p.id);
        return u.panel(p.name, `${u.table('docs', rows, [
          { k: 'kind', label: 'Document', type: 'select', options: DOCS, w: '1.2fr', rerender: true },
          { k: 'number', label: 'Number', w: '1fr', ph: 'Last 4 digits' },
          { k: 'expires', label: 'Expires', w: '150px', html: x => u.input(`docs.${x.__i}.expires`, x.expires, { type: 'date', label: `${x.kind} expires`, rerender: true }) },
          { k: 'have', label: 'Ready', type: 'check', w: '64px' }
        ], { index: x => x.__i, total: s.docs.length, what: 'document', cls: 'tp-docs', empty: 'Nothing yet.' })}
          <div class="pl-list-foot">${u.btn('Add document', { sm: true, icon: 'plus', act: 'addDoc', data: { tid: p.id } })}</div>`, { icon: 'user', cls: 'y-panel--flat' });
      }).join('')}</div>` : u.empty('doc', 'Add travelers first', 'Each traveler gets a document checklist.', u.btn('Go to Trip', { kind: 'world', act: 'go', data: { page: 'trip' } }))}
      ${u.panel('In an emergency', `<div class="pl-fields">${u.field('Embassy / consulate', 'emergency.embassy', s.emergency.embassy, { ph: 'Address and phone', cls: 'pl-wide' })}
        ${u.field('Travel insurance', 'emergency.insurance', s.emergency.insurance, { ph: '24/7 phone + policy number', cls: 'pl-wide' })}${u.field('Where we’re staying', 'emergency.stay', s.emergency.stay, { ph: 'Hotel names and addresses', cls: 'pl-wide' })}
        ${u.field('Contact at home', 'emergency.contact', s.emergency.contact, { ph: 'Name + phone', cls: 'pl-wide' })}</div><p class="pl-hint">Keep numbers short here — don’t type full passport or card numbers.</p>`, { icon: 'warn' })}
      ${u.notes('notes', s.notes, { rows: 5, title: 'Trip notes', ph: 'Tipping, opening hours, phrases, local tips…' })}`;
    },
    actions: { addDoc(ctx, d) { const s = ctx.state; s.docs.push(doc({ tid: d.tid })); ctx.focus(`[data-bind="docs.${s.docs.length - 1}.number"]`); } }
  };

  /* ---------- ideas ---------- */
  const ideas = {
    id: 'ideas', label: 'Ideas', icon: 'sparkle',
    render(ctx) {
      const s = ctx.state, ds = days(s), list = s.ideas.map((x, i) => Object.assign({ __i: i }, x)).sort((a, b) => PRIO.indexOf(a.prio) - PRIO.indexOf(b.prio));
      return `${u.head({ eyebrow: 'Places to go', title: `<em>${s.ideas.filter(x => P.has(x.name)).length}</em> ideas`, lede: 'Everything you might want to see, eat or do. Give one a day and it shows on that day’s card.' })}
      ${u.panel('', `${u.quickAdd('ideas', { key: 'name', ph: 'Add a place, dish or thing to do', label: 'Add an idea', kind: 'world' })}<div class="tp-gap"></div>
        ${u.table('ideas', list, [
          { k: 'name', label: 'Idea', title: true, w: '1.5fr', ph: 'Place or thing' },
          { k: 'kind', label: 'Type', type: 'select', options: KINDS, w: '96px' },
          { k: 'area', label: 'Area', w: '1fr', ph: 'Neighborhood' },
          { k: 'prio', label: 'Priority', type: 'select', options: PRIO, w: '104px', rerender: true },
          { k: 'link', label: 'Link', w: '1fr', ph: 'Map or website' },
          { k: 'day', label: 'Day', type: 'select', options: ds.map(d => [d, dayLabel(d)]), blank: 'Any day', w: '140px', rerender: true }
        ], { index: x => x.__i, total: s.ideas.length, what: 'idea', cls: 'tp-ideas', empty: 'Type an idea above and press Enter.' })}`)}`;
    }
  };

  window.TPTravel = { pages: { trip, bookings, budget, packing, docs, ideas }, blank, sample, normalize, money, settle, docWarn, days,
    rows: { travelers: () => traveler(), plans: () => plan(), bookings: () => booking({ date: '' }), cats: () => cat(), spends: () => spend(), packing: () => pack(), docs: () => doc(), ideas: () => idea() } };
})();
