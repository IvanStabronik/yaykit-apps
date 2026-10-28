/* Bachelorette Weekend App — day plans, bookings, the cost split and packing, from Bachelorette Weekend. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const TYPES = ['Stay', 'Restaurant', 'Activity', 'Transport', 'Other'];
  const STATUS = ['Idea', 'Soft hold', 'Booked', 'Paid'];
  const BAGS = ['Everyone', 'Bride', 'Host bag', 'Shared'];
  const txt = v => (v == null ? '' : String(v));
  const plan = (date, time, what, where, booked, note) => ({ id: P.uid(), date: date || '', time: time || '', what: what || '', where: where || '', booked: !!booked, note: note || '' });
  const booking = (name, type, when, ref, contact, status, note) => ({ id: P.uid(), name: name || '', type: type || 'Activity', when: when || '', ref: ref || '', contact: contact || '', status: status || 'Idea', note: note || '' });
  const cost = (item, total, split, paidBy, paid) => ({ id: P.uid(), item: item || '', total: txt(total), split: split !== false, paidBy: paidBy || '', paid: !!paid });
  const pack = (text, bag, done) => ({ id: P.uid(), text: text || '', bag: bag || 'Everyone', done: !!done });

  function blank() { return { trip: { bride: '', host: '', place: '', start: '', end: '', vibe: '', people: '', brideFree: true }, plans: [], bookings: [], costs: [], packing: [], notes: '' }; }
  function sample() {
    const s = D.add(D.today(), 45), d1 = s, d2 = D.add(s, 1), d3 = D.add(s, 2);
    return {
      trip: { bride: 'Maya', host: 'Jordan (maid of honor)', place: 'Nashville, TN', start: d1, end: d3, vibe: 'Soft glam · brunch · one big night out', people: '8', brideFree: true },
      plans: [
        plan(d1, '15:00', 'Check in + welcome snacks', 'East Nashville loft', true, 'Door code in the group chat'),
        plan(d1, '19:00', 'Welcome dinner', 'Husk', true, 'Reservation under Jordan'),
        plan(d2, '10:30', 'Brunch', 'Biscuit Love', false, 'Patio if it’s warm'),
        plan(d2, '14:00', 'Spa afternoon', 'The Spa at the Joseph', true, 'Arrive 15 minutes early'),
        plan(d2, '20:00', 'Dinner + live music', 'Broadway', false, 'Comfy shoes!'),
        plan(d3, '10:00', 'Slow breakfast + photo walk', 'Near the loft', false, 'Optional'),
        plan(d3, '12:00', 'Check out + rides to the airport', 'East Nashville loft', true, 'Keys on the counter')
      ],
      bookings: [
        booking('East Nashville loft', 'Stay', 'Fri 3 pm – Sun noon', 'VRBO #44821', 'Host via app', 'Paid', 'Quiet hours after 10 pm'),
        booking('Husk', 'Restaurant', 'Fri 7:00 pm', 'OpenTable · 8 people', '(615) 555-0142', 'Booked', ''),
        booking('The Spa at the Joseph', 'Activity', 'Sat 2–5 pm', 'Conf SPA-2291', 'Spa desk', 'Booked', 'Deposit $200 paid by Jordan'),
        booking('Biscuit Love', 'Restaurant', 'Sat 10:30 am', '', '', 'Idea', 'No reservations — go early'),
        booking('Airport rides', 'Transport', 'Sun 12:00', '', '', 'Idea', 'Book two XL rides Saturday night')
      ],
      costs: [cost('Loft (2 nights)', 1480, true, 'Jordan', true), cost('Spa packages', 960, true, 'Jordan', false), cost('Welcome dinner', 440, true, '', false), cost('Decor + sashes', 85, true, 'Priya', true), cost('Maya’s spa upgrade (gift from Jordan)', 60, false, 'Jordan', true)],
      packing: [pack('Matching sashes', 'Shared', true), pack('Phone chargers + power bank', 'Everyone'), pack('Going-out outfit for Saturday', 'Everyone'), pack('Comfy walking shoes', 'Everyone'), pack('Veil + tiara', 'Bride', true), pack('Portable speaker', 'Host bag'), pack('Pain reliever, blister plasters', 'Host bag'), pack('Games for Friday night', 'Shared')],
      notes: 'Group chat: “Maya’s Nashville weekend”.\nAllergies: Priya — shellfish.\nBudget cap agreed: about $450 each.'
    };
  }
  function normalize(s) {
    const t = s.trip || {};
    s.trip = { bride: txt(t.bride), host: txt(t.host), place: txt(t.place), start: txt(t.start), end: txt(t.end), vibe: txt(t.vibe), people: txt(t.people), brideFree: t.brideFree !== false };
    const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
    s.plans = arr(s.plans, x => Object.assign(plan(txt(x.date), txt(x.time), txt(x.what), txt(x.where), x.booked, txt(x.note)), { id: txt(x.id) || P.uid() }));
    s.bookings = arr(s.bookings, x => Object.assign(booking(txt(x.name), TYPES.includes(x.type) ? x.type : 'Other', txt(x.when), txt(x.ref), txt(x.contact), STATUS.includes(x.status) ? x.status : 'Idea', txt(x.note)), { id: txt(x.id) || P.uid() }));
    s.costs = arr(s.costs, x => Object.assign(cost(txt(x.item), txt(x.total), x.split !== false, txt(x.paidBy), x.paid), { id: txt(x.id) || P.uid() }));
    s.packing = arr(s.packing, x => Object.assign(pack(txt(x.text), BAGS.includes(x.bag) ? x.bag : 'Everyone', x.done), { id: txt(x.id) || P.uid() }));
    s.notes = txt(s.notes);
    return s;
  }

  function days(s) {
    const a = D.parse(s.trip.start) ? s.trip.start : null, b = D.parse(s.trip.end) ? s.trip.end : a;
    const out = [];
    if (a) for (let d = a, n = 0; d <= b && n < 14; d = D.add(d, 1), n++) out.push(d);
    s.plans.forEach(p => { if (D.parse(p.date) && !out.includes(p.date)) out.push(p.date); });
    out.sort();
    return out;
  }
  const byTime = (a, b) => (D.mins(a.time) == null ? 1e9 : D.mins(a.time)) - (D.mins(b.time) == null ? 1e9 : D.mins(b.time));
  function money(s) {
    const total = s.costs.reduce((a, c) => a + P.num(c.total), 0);
    const shared = s.costs.filter(c => c.split).reduce((a, c) => a + P.num(c.total), 0);
    const crew = (s.crew || []).filter(c => P.has(c.name)).length, people = crew || Math.max(0, Math.round(P.num(s.trip.people)));   // the Crew list wins when it has names
    const payers = Math.max(1, people - (s.trip.brideFree && people > 1 ? 1 : 0));
    const paid = s.costs.filter(c => c.paid).reduce((a, c) => a + P.num(c.total), 0);
    return { total, shared, people, payers, each: people ? shared / payers : 0, paid };
  }

  const weekend = {
    id: 'weekend', label: 'Weekend', icon: 'party',
    render(ctx) {
      const s = ctx.state, t = s.trip, ds = days(s), until = D.parse(t.start) ? D.diff(D.today(), t.start) : null;
      const noDate = s.plans.map((p, i) => Object.assign({ __i: i }, p)).filter(p => !D.parse(p.date));
      const dayCard = (d, list) => `<article class="bw-day">
          <header><h3>${d ? esc(D.fmt(d, { weekday: 'long' })) : 'No date yet'}</h3>${d ? `<span class="pl-muted">${esc(D.short(d))}</span>` : ''}</header>
          <ol class="bw-plans">${list.sort(byTime).map(p => `<li class="bw-plan${p.booked ? ' is-booked' : ''}">
            <div class="bw-plan-time">${u.input(`plans.${p.__i}.time`, p.time, { type: 'time', label: `Time for ${p.what || 'plan'}` })}</div>
            <div class="bw-plan-main">${u.input(`plans.${p.__i}.what`, p.what, { label: 'What', ph: 'What’s happening', cls: 'bw-what' })}${u.input(`plans.${p.__i}.where`, p.where, { label: 'Where', ph: 'Where', cls: 'bw-where' })}${u.input(`plans.${p.__i}.note`, p.note, { label: 'Note', ph: 'Note for the group', cls: 'bw-where' })}</div>
            <div class="bw-plan-side">${u.check(`plans.${p.__i}.booked`, p.booked, 'Booked', { cls: 'bw-booked', rerender: true })}${u.iconBtn('close', `Remove ${p.what || 'plan'}`, 'remove', { list: 'plans', i: p.__i, what: p.what })}</div></li>`).join('')}</ol>
          ${d ? u.btn('Add to this day', { sm: true, icon: 'plus', act: 'addPlan', data: { date: d } }) : ''}</article>`;
      return `
      ${u.head({ eyebrow: t.bride ? `${t.bride}’s weekend` : 'Bachelorette weekend', title: t.place ? `<em>${esc(t.place)}</em>` : 'Plan the <em>weekend</em>', meta: `${until != null && until >= 0 ? `<span class="y-sticker">${I('party')}${until ? `${until} days to go` : 'It’s today!'}</span>` : ''}${t.vibe ? `<span>${esc(t.vibe)}</span>` : ''}` })}
      <div data-slot="kpis"></div>
      ${u.fold('Trip details', `<div class="pl-fields">
        ${u.field('Bride', 'trip.bride', t.bride, { ph: 'Name' })}${u.field('Host', 'trip.host', t.host, { ph: 'Maid of honor' })}
        ${u.field('Destination', 'trip.place', t.place, { ph: 'City' })}${u.field('Group size', 'trip.people', t.people, { num: true, ph: 'incl. the bride' })}
        ${u.field('First day', 'trip.start', t.start, { type: 'date', rerender: true })}${u.field('Last day', 'trip.end', t.end, { type: 'date', rerender: true })}
        ${u.field('Vibe', 'trip.vibe', t.vibe, { ph: 'Brunch, spa, one big night out', cls: 'pl-wide' })}</div>`, { icon: 'edit', key: 'trip', open: !t.place && !t.start })}
      ${ds.length || noDate.length ? `<div class="bw-days">${ds.map(d => dayCard(d, s.plans.map((p, i) => Object.assign({ __i: i }, p)).filter(p => p.date === d))).join('')}${noDate.length ? dayCard(null, noDate) : ''}</div>`
        : u.empty('calendar', 'Set the dates first', 'Add the first and last day in Trip details — each day gets its own card.', '')}`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, m = money(s), booked = s.plans.filter(p => p.booked).length, packed = s.packing.filter(p => p.done).length;
        return u.kpis([['Plans booked', `${booked}<small class="bw-of">/${s.plans.length}</small>`, 'y-kpi--world'], ['Per person', m.people ? esc(ctx.money(m.each)) : '—', 'y-kpi--accent', m.people ? `${m.payers} paying${s.trip.brideFree && m.people > 1 ? ' · bride’s on the house' : ''}` : 'set the group size'], ['Weekend total', esc(ctx.money(m.total))], ['Packed', `${packed}<small class="bw-of">/${s.packing.length}</small>`]]);
      }
    },
    actions: { addPlan(ctx, d) { const s = ctx.state; s.plans.push(plan(d.date)); ctx.focus(`[data-bind="plans.${s.plans.length - 1}.what"]`); } },
    sheet(ctx) {
      const s = ctx.state, t = s.trip;
      return `<h1>${esc(t.bride ? `${t.bride}’s weekend` : 'The weekend')}${t.place ? ' · ' + esc(t.place) : ''}</h1>
        <p class="pl-sheet-meta">${[t.start && `${D.full(t.start)}${t.end && t.end !== t.start ? ' – ' + D.full(t.end) : ''}`, t.host && `Host: ${t.host}`, t.vibe].filter(Boolean).map(esc).join(' · ')}</p>
        ${days(s).map(d => { const list = s.plans.filter(p => p.date === d).sort(byTime); return list.length ? `<h2>${esc(D.long(d))}</h2><table><tbody>${list.map(p => `<tr><td style="width:22mm;white-space:nowrap"><b>${esc(D.time(p.time))}</b></td><td><b>${esc(p.what)}</b>${p.where ? `<br>${esc(p.where)}` : ''}</td><td>${esc(p.note)}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}
        ${money(s).people ? `<p style="margin-top:6mm"><b>Your share: ${esc(ctx.money(money(s).each))}</b> per person</p>` : ''}`;
    }
  };

  const bookings = {
    id: 'bookings', label: 'Bookings', icon: 'calendar',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Reservations', title: 'Bookings', lede: 'Every stay, table and activity with its confirmation number — so nobody has to scroll the group chat.' })}
      ${u.records('bookings', s.bookings, {
        what: 'Booking', titlePh: 'Place or company', cardClass: b => b.status === 'Idea' ? 'is-muted' : '',
        sub: b => `${u.pill(b.status, b.status === 'Idea' ? '' : b.status === 'Soft hold' ? 'warn' : 'good')} ${esc(b.type)}`,
        fields: [{ k: 'type', label: 'Type', options: TYPES }, { k: 'status', label: 'Status', options: STATUS, rerender: true }, { k: 'when', label: 'When', ph: 'Sat 2–5 pm' }, { k: 'ref', label: 'Confirmation #', ph: 'Reference' }, { k: 'contact', label: 'Contact', ph: 'Phone or email', wide: true }, { k: 'note', label: 'Notes', type: 'textarea', wide: true, ph: 'Deposits, dress codes, cancellation rules' }],
        add: 'Add booking', addKind: 'world', empty: u.empty('calendar', 'No bookings yet', 'Add the stay first — everything else is easier once you know where you’re sleeping.')
      })}`;
    }
  };

  const moneyPage = {
    id: 'money', label: 'Money', icon: 'money',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Split it fairly', title: '<span data-slot="title"></span>', lede: 'List what the weekend costs. Split items are shared by everyone paying; untick “split” for gifts or personal extras.' })}
      ${u.panel('', `<div class="pl-row bw-money-top">${u.field('People on the trip', 'trip.people', s.trip.people, { num: true, ph: '8' })}${u.switch('trip.brideFree', s.trip.brideFree, 'Bride doesn’t pay', { rerender: false })}</div>
        ${u.table('costs', s.costs, [
          { k: 'item', label: 'Item', title: true, w: '1.5fr', ph: 'What' },
          { k: 'total', label: 'Total', num: true, w: '120px', ph: '0' },
          { k: 'split', label: 'Split', type: 'check', w: '64px' },
          { k: 'paidBy', label: 'Paid / paying', w: '1fr', ph: 'Name' },
          { k: 'paid', label: 'Paid', type: 'check', w: '64px' }
        ], { what: 'cost', add: 'Add cost', empty: 'Stay, activities, dinners, decor, rides…' })}
        <div data-slot="split"></div>`)}`;
    },
    slots: {
      title(ctx) { const m = money(ctx.state); return m.people && m.shared ? `<em>${esc(ctx.money(m.each))}</em> each` : 'Weekend <em>money</em>'; },
      split(ctx) {
        const s = ctx.state, m = money(s);
        return `<div class="bw-split">${u.kpis([['Total', esc(ctx.money(m.total))], ['Shared', esc(ctx.money(m.shared)), 'y-kpi--world', m.people ? `÷ ${m.payers} people` : ''], ['Per person', m.people ? esc(ctx.money(m.each)) : '—', 'y-kpi--accent'], ['Already paid', esc(ctx.money(m.paid)), '', `${esc(ctx.money(Math.max(0, m.total - m.paid)))} still to pay`]])}</div>`;
      }
    }
  };

  const packing = {
    id: 'packing', label: 'Packing', icon: 'check',
    badge: ctx => { const n = ctx.state.packing.filter(p => !p.done && P.has(p.text)).length; return n || ''; },
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Don’t forget', title: 'Packing list', lede: 'Split into what everyone brings, what the bride needs, and what the host carries.' })}
      <div class="bw-bags">${BAGS.map(bag => {
        const items = s.packing.map((p, i) => Object.assign({ __i: i }, p)).filter(p => p.bag === bag);
        return u.panel(bag, `${u.checklist('packing', items, { index: p => p.__i, total: s.packing.length, ph: 'Item', what: 'item' })}<div class="bw-bag-add">${u.btn(`Add to ${bag.toLowerCase()}`, { sm: true, icon: 'plus', act: 'addPack', data: { bag } })}</div>`, { icon: bag === 'Bride' ? 'heart' : bag === 'Host bag' ? 'briefcase' : 'check', cls: 'y-panel--flat' });
      }).join('')}</div>`;
    },
    actions: { addPack(ctx, d) { const s = ctx.state; s.packing.push(pack('', d.bag)); ctx.focus(`[data-bind="packing.${s.packing.length - 1}.text"]`); } }
  };

  const notes = {
    id: 'notes', label: 'Notes', icon: 'edit',
    render(ctx) { return `${u.head({ eyebrow: 'Host notes', title: 'Notes', lede: 'Allergies, surprise plans, the budget cap everyone agreed to.' })}${u.notes('notes', ctx.state.notes, { rows: 12 })}`; }
  };

  window.BWWeekend = { pages: { weekend, bookings, moneyPage, packing }, blank, sample, normalize, money, rows: { plans: () => plan(), bookings: () => booking(), costs: () => cost(), packing: () => pack() } };
})();
