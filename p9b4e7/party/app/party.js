/* Party Planner App — a dated party checklist, budget + bookings, guests and RSVPs, menu & supplies, and the party-day plan. Yaykit planner engine, party world.
   Built on the Wedding Planner App code: the same budget module, guest list and run sheet, with a party checklist and a new menu & supplies page; no seating chart. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const txt = v => (v == null ? '' : String(v));
  const r2 = n => Math.round(n * 100) / 100;
  const list = (v, map) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(map);

  /* ---------- checklist ---------- */
  const WHEN = [['6w', '6 weeks before', 42], ['4w', '4 weeks before', 28], ['2w', '2 weeks before', 14], ['1w', 'The week before', 7],
    ['2d', 'The last two days', 2], ['day', 'On the day', 0], ['after', 'After the party', -3]];
  const WHEN_NAME = Object.fromEntries(WHEN.map(w => [w[0], w[1]])), WHEN_DAYS = Object.fromEntries(WHEN.map(w => [w[0], w[2]]));
  const STARTER = {
    '6w': ['Pick the date and a rough budget', 'Draft the guest list', 'Choose a theme'],
    '4w': ['Book the venue or plan the space', 'Send invitations', 'Book entertainment or activities', 'Order or plan the cake'],
    '2w': ['Plan the menu', 'Buy decorations', 'Order party favors', 'Ask a friend or two to help'],
    '1w': ['Chase missing RSVPs', 'Write the shopping list', 'Plan the music playlist', 'Confirm every booking'],
    '2d': ['Do the big grocery shop', 'Prep food that keeps', 'Charge the speaker and the camera', 'Clean and set up the space'],
    day: ['Pick up the cake', 'Decorate', 'Set out food and drinks', 'Have fun'],
    after: ['Send thank-you notes', 'Return rentals', 'Pay any balances']
  };
  const task = (text, when, done) => ({ id: P.uid(), text: text || '', when: WHEN_NAME[when] ? when : '2w', done: !!done });
  const starterTasks = () => WHEN.flatMap(([k]) => STARTER[k].map(t => task(t, k)));

  /* ---------- budget (from the budget module) ---------- */
  const STATUSES = ['Researching', 'Quote received', 'Booked', 'Deposit paid', 'Paid in full'];
  const CATS = ['Venue', 'Food & drinks', 'Cake & desserts', 'Decorations', 'Entertainment', 'Invitations', 'Party favors', 'Supplies & rentals', 'Contingency'];
  const cat = (name, budget, actual) => ({ id: P.uid(), name: name || '', budget: txt(budget), actual: txt(actual) });
  const vendor = () => ({ id: P.uid(), name: '', category: '', status: STATUSES[0], total: '', deposit: '', depositDue: '', paid: '', balanceDue: '', contact: '', notes: '' });

  /* ---------- guests (from Guest List & Seating) ---------- */
  const RSVP = ['Pending', 'Yes', 'No'];
  const MEALS = ['—', 'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut allergy', 'Other'];
  const guest = o => Object.assign({ id: P.uid(), name: '', party: '', side: 'A', rsvp: 'Pending', meal: '—', table: '', notes: '' }, o || {});
  const table = (name, seats) => ({ id: P.uid(), name: name || '', seats: String(seats || 8) });

  /* ---------- day-of (from Day-Of Run Sheet) ---------- */
  const cue = (time, title, who, where, note, dur) => ({ id: P.uid(), time: time || '', title: title || '', who: who || '', where: where || '', note: note || '', mins: dur == null ? '' : String(dur), done: false });
  const crewRow = (role, name, arrive, leave, where, phone, note) => ({ id: P.uid(), role: role || '', name: name || '', arrive: arrive || '', leave: leave || '', where: where || '', phone: phone || '', note: note || '' });
  const contact = (role, name, phone, note) => ({ id: P.uid(), role: role || '', name: name || '', phone: phone || '', note: note || '' });

  /* ---------- menu & supplies (new) ---------- */
  const COURSES = ['Snacks', 'Mains', 'Sides', 'Desserts', 'Drinks'];
  const dish = (course, name, who, note, done) => ({ id: P.uid(), course: COURSES.includes(course) ? course : 'Snacks', name: name || '', who: who || '', note: note || '', done: !!done });
  const supply = (item, qty, got) => ({ id: P.uid(), item: item || '', qty: txt(qty), got: !!got });

  function blank() {
    return { profile: { couple: '', date: '', venue: '', a: '', b: '', lead: '', leadPhone: '' }, tasks: starterTasks(), totalBudget: '', categories: CATS.map(n => cat(n)), vendors: [],
      guests: [], tables: [], cues: [], crew: [], contacts: [], menu: [], supplies: [], notes: '' };
  }
  function sample() {
    const t = D.today(), pd = D.add(t, 24);
    const tasks = starterTasks();
    tasks.forEach(x => { if (['6w', '4w'].includes(x.when) || x.text === 'Plan the menu') x.done = true; });
    const g = (name, party, rsvp, meal, notes) => guest({ name, party, side: 'A', rsvp, meal: meal || '—', notes: notes || '' });
    const v = (name, category, status, total, deposit, depositDue, paid, balanceDue, contactInfo, notes) =>
      Object.assign(vendor(), { name, category, status, total: String(total), deposit: String(deposit), depositDue, paid: String(paid), balanceDue, contact: contactInfo, notes });
    return {
      profile: { couple: 'Maya’s 7th birthday', date: pd, venue: 'Our backyard, 14 Maple Lane', a: 'Under the sea', b: '', lead: 'Dad (Chris)', leadPhone: '(555) 010-4410' },
      tasks,
      totalBudget: '650',
      categories: [cat('Food & drinks', 140, 0), cat('Cake & desserts', 75, 25), cat('Decorations', 60, 48), cat('Entertainment', 220, 80),
        cat('Invitations', 15, 12), cat('Party favors', 60, 0), cat('Supplies & rentals', 50, 0), cat('Contingency', 30, 0)],
      vendors: [
        v('Bouncy Bay Rentals', 'Entertainment', 'Deposit paid', 160, 40, D.add(t, -6), 40, D.add(pd, -2), '(555) 010-7720', 'Ocean bounce house, 4 hours. Drop-off 12:30.'),
        v('Captain Finn', 'Entertainment', 'Deposit paid', 120, 40, D.add(t, -3), 40, pd, 'captainfinn.example', '45-minute pirate show + balloon animals. Cash on the day.'),
        v('Sweet Layers Bakery', 'Cake & desserts', 'Booked', 65, 25, D.add(t, -2), 25, D.add(pd, -1), '(555) 010-3388', 'Blue ombre cake, “Happy 7th Maya”, 20 servings. Pick up 11:00.')
      ],
      guests: [
        g('Maya', 'Birthday girl', 'Yes'), g('Ava Chen', 'Chen family', 'Yes', 'Nut allergy', 'Mom staying'), g('Lily Chen', 'Chen family', 'Yes'),
        g('Noah Brooks', 'Brooks family', 'Yes'), g('Emma Patel', 'Patel family', 'Yes', 'Vegetarian'), g('Leo Kim', 'Kim family', 'Yes'),
        g('Zoe Rivera', 'Rivera family', 'Yes', 'Gluten-free'), g('Jack Moss', 'Moss family', 'Yes'), g('Mia Diaz', 'Diaz family', 'Yes'),
        g('Ethan Lee', 'Lee family', 'Pending', '', 'Asked to confirm by Friday'), g('Sofia Price', 'Price family', 'Pending'), g('Owen Hart', 'Hart family', 'Pending'),
        g('Ella Young', 'Young family', 'No', '', 'Away that weekend'), g('Grandma Rose', 'Family', 'Yes'), g('Uncle Ben', 'Family', 'Yes', '', 'Grill master')],
      tables: [],
      menu: [dish('Snacks', 'Goldfish crackers + veggie cups', 'Us', '', true), dish('Mains', 'Pizza — 2 cheese, 1 pepperoni, 1 gluten-free', 'Us', 'Order Friday, pick up 15:00', false),
        dish('Mains', 'Hot dogs', 'Uncle Ben', 'Grill', false), dish('Sides', 'Fruit skewers', 'Chen family', 'Nut-free', false), dish('Desserts', 'Birthday cake', 'Sweet Layers Bakery', 'Pick up 11:00', false),
        dish('Desserts', 'Ocean jello cups', 'Us', 'Make Thursday night', false), dish('Drinks', 'Juice boxes + lemonade', 'Us', '', true), dish('Drinks', 'Coffee for the grown-ups', 'Grandma Rose', '', false)],
      supplies: [supply('Paper plates + cups', '30', true), supply('Napkins', '50', true), supply('Candles + lighter', '1', false), supply('Blue + teal balloons', '30', true),
        supply('Treasure-hunt prizes', '15', false), supply('Favor bags', '15', false), supply('Ice', '2 bags', false), supply('Trash bags', '1 roll', false)],
      cues: [
        cue('11:00', 'Pick up the cake', 'Dad', 'Sweet Layers Bakery', '', 30),
        cue('12:30', 'Bounce house drop-off', 'Bouncy Bay Rentals', 'Back lawn', 'Clear the lawn first', 30),
        cue('13:00', 'Decorate + set up tables', 'Mom, Grandma Rose', 'Patio', 'Balloons, table cloths, photo corner', 60),
        cue('14:00', 'Guests arrive', 'Everyone', 'Front gate', 'Name stickers at the gate', 15),
        cue('14:15', 'Bounce house + crafts', 'Uncle Ben', 'Back lawn', 'Shell painting table', 45),
        cue('15:00', 'Captain Finn’s pirate show', 'Captain Finn', 'Patio', 'Pay the balance in cash', 45),
        cue('15:45', 'Pizza + hot dogs', 'Dad, Uncle Ben', 'Patio', 'Gluten-free pizza on its own plate', 30),
        cue('16:15', 'Cake + Happy Birthday', 'Everyone', 'Patio', 'Candles + lighter in the kitchen drawer', 20),
        cue('16:45', 'Treasure hunt', 'Mom', 'Whole yard', '', 20),
        cue('17:15', 'Favor bags + goodbyes', 'Maya', 'Front gate', '', 15)
      ],
      crew: [crewRow('Helper', 'Uncle Ben', '13:00', '18:00', 'Grill + games', '(555) 010-4411', ''), crewRow('Helper', 'Grandma Rose', '12:30', '17:30', 'Kitchen + photos', '(555) 010-4412', ''),
        crewRow('Rental', 'Bouncy Bay Rentals', '12:30', '18:30', 'Back lawn', '(555) 010-7720', 'Pick-up 18:30'), crewRow('Entertainer', 'Captain Finn', '14:45', '15:50', 'Patio', '(555) 010-9090', '')],
      contacts: [contact('Pizza place', 'Mario’s', '(555) 010-2323', 'Order #4471'), contact('Ava’s mom', 'Jen Chen', '(555) 010-5151', 'Nut allergy — has an EpiPen'),
        contact('Neighbor', 'Sam (next door)', '(555) 010-3300', 'Parking in their driveway is OK')],
      notes: 'Ideas: photo corner with a big cardboard porthole.\nRain plan: move crafts and cake to the garage; the bounce house company reschedules for free.\nNext year: start invitations a week earlier.'
    };
  }
  function normalize(s) {
    const p = s.profile && typeof s.profile === 'object' ? s.profile : {};
    s.profile = Object.fromEntries(['couple', 'date', 'venue', 'a', 'b', 'lead', 'leadPhone'].map(k => [k, txt(p[k])]));
    s.tasks = list(s.tasks, x => Object.assign(task(txt(x.text), x.when, x.done), { id: txt(x.id) || P.uid() }));
    s.totalBudget = txt(s.totalBudget);
    s.categories = list(s.categories, x => ({ id: txt(x.id) || P.uid(), name: txt(x.name), budget: txt(x.budget), actual: txt(x.actual) }));
    s.vendors = list(s.vendors, x => Object.assign(vendor(), Object.fromEntries(Object.keys(vendor()).map(k => [k, txt(x[k])])), { id: txt(x.id) || P.uid(), status: STATUSES.includes(x.status) ? x.status : STATUSES[0] }));
    s.tables = list(s.tables, x => ({ id: txt(x.id) || P.uid(), name: txt(x.name), seats: txt(x.seats) }));
    const ids = new Set(s.tables.map(x => x.id));
    s.guests = list(s.guests, x => guest({ id: txt(x.id) || P.uid(), name: txt(x.name), party: txt(x.party), side: ['A', 'B', 'Both'].includes(x.side) ? x.side : 'A',
      rsvp: RSVP.includes(x.rsvp) ? x.rsvp : 'Pending', meal: MEALS.includes(x.meal) ? x.meal : '—', table: ids.has(x.table) ? x.table : '', notes: txt(x.notes) }));
    s.menu = list(s.menu, x => Object.assign(dish(x.course, txt(x.name), txt(x.who), txt(x.note), x.done), { id: txt(x.id) || P.uid() }));
    s.supplies = list(s.supplies, x => Object.assign(supply(txt(x.item), txt(x.qty), x.got), { id: txt(x.id) || P.uid() }));
    s.cues = list(s.cues, x => Object.assign(cue(), { id: txt(x.id) || P.uid(), time: txt(x.time), title: txt(x.title), who: txt(x.who), where: txt(x.where), note: txt(x.note), mins: txt(x.mins), done: !!x.done }));
    s.crew = list(s.crew, x => Object.assign(crewRow(), Object.fromEntries(Object.keys(crewRow()).map(k => [k, txt(x[k])])), { id: txt(x.id) || P.uid() }));
    s.contacts = list(s.contacts, x => Object.assign(contact(), Object.fromEntries(Object.keys(contact()).map(k => [k, txt(x[k])])), { id: txt(x.id) || P.uid() }));
    s.notes = txt(s.notes);
    return s;
  }

  /* ---------- shared math ---------- */
  const wdate = s => (D.parse(s.profile.date) ? s.profile.date : '');
  const dueOf = (s, x) => (wdate(s) ? D.add(wdate(s), -WHEN_DAYS[x.when]) : '');
  function budgetTotals(s) {
    const total = P.num(s.totalBudget), allocated = r2(s.categories.reduce((a, c) => a + P.num(c.budget), 0)), spent = r2(s.categories.reduce((a, c) => a + P.num(c.actual), 0));
    const vendorPaid = r2(s.vendors.reduce((a, v) => a + P.num(v.paid), 0)), vendorOwed = r2(s.vendors.reduce((a, v) => a + Math.max(0, P.num(v.total) - P.num(v.paid)), 0));
    const base = total || allocated;
    return { total, allocated, spent, left: r2(base - spent), base, gap: r2(total - allocated), vendorPaid, vendorOwed, pct: base ? spent / base * 100 : 0 };
  }
  function payments(s) {
    const out = [];
    s.vendors.forEach(v => {
      const total = P.num(v.total), paid = P.num(v.paid), dep = P.num(v.deposit);
      const depLeft = dep > paid + 0.005 && D.parse(v.depositDue) ? r2(dep - paid) : 0;
      if (depLeft) out.push({ v, kind: 'Deposit', amount: depLeft, due: v.depositDue });
      const owe = r2(total - paid - depLeft);
      if (owe > 0.005 && D.parse(v.balanceDue)) out.push({ v, kind: 'Balance', amount: owe, due: v.balanceDue });
    });
    return out.sort((a, b) => a.due.localeCompare(b.due));
  }
  const sideName = (s, v) => (v === 'A' ? s.profile.a || 'Side A' : v === 'B' ? s.profile.b || 'Side B' : 'Both');
  const sides = s => [['A', sideName(s, 'A')], ['B', sideName(s, 'B')], ['Both', 'Both']];
  const named = s => s.guests.filter(g => P.has(g.name));
  const seated = (s, t) => s.guests.filter(g => g.table === t.id);
  const cap = t => Math.max(0, Math.round(P.num(t.seats)));
  function counts(s) {
    const c = { all: 0, Yes: 0, Pending: 0, No: 0, seated: 0, needSeat: 0 };
    named(s).forEach(x => { c.all++; c[x.rsvp]++; if (x.table) c.seated++; else if (x.rsvp === 'Yes') c.needSeat++; });
    return c;
  }
  const alpha = l => l.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  const byTime = (a, b) => (D.mins(a.time) == null ? 1e9 : D.mins(a.time)) - (D.mins(b.time) == null ? 1e9 : D.mins(b.time));
  const sortedCues = s => s.cues.slice().sort(byTime);
  const endOf = c => { const m = D.mins(c.time), d = Math.round(P.num(c.mins)); if (m == null || !d) return ''; const e = m + d; return `${String(Math.floor(e / 60) % 24).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`; };
  const openTasks = s => s.tasks.filter(x => P.has(x.text) && !x.done);
  function countdown(s) {
    const d = wdate(s); if (!d) return '';
    const n = D.diff(D.today(), d);
    return `<span class="y-sticker">${I('party')}${n > 0 ? `${n} ${n === 1 ? 'day' : 'days'} to go` : n === 0 ? 'Party day!' : 'What a party!'}</span><span>${esc(D.full(d))}${s.profile.venue ? ' · ' + esc(s.profile.venue) : ''}</span>`;
  }

  /* ---------- overview ---------- */
  const overview = {
    id: 'overview', label: 'Overview', icon: 'party',
    render(ctx) {
      const s = ctx.state, p = s.profile;
      return `${u.head({ eyebrow: p.couple || 'Our party', title: '<span data-slot="title"></span>', meta: '<span data-slot="countdown"></span>' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Next up', '<div data-slot="next"></div>', { icon: 'check', cls: 'pl-7', actions: u.btn('Checklist', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'checklist' } }) })}
        ${u.panel('Payments coming up', '<div data-slot="pay"></div>', { icon: 'calendar', cls: 'pl-5' })}
      </div>
      ${u.fold('The party', `<div class="pl-fields">
        ${u.field('Party', 'profile.couple', p.couple, { ph: 'Maya’s 7th birthday' })}
        ${u.field('Party date', 'profile.date', p.date, { type: 'date', rerender: true, hint: 'The checklist dates count back from it.' })}
        ${u.field('Where', 'profile.venue', p.venue, { ph: 'Venue or address' })}
        ${u.field('Theme', 'profile.a', p.a, { ph: 'e.g. Under the sea' })}</div>`, { icon: 'edit', key: 'party', open: !p.couple && !p.date })}
      ${u.notes('notes', s.notes, { rows: 6, title: 'Notes', ph: 'Ideas, rain plan, things to remember for next time…' })}`;
    },
    slots: {
      title(ctx) { const s = ctx.state, d = wdate(s); if (!d) return 'Plan the <em>whole party</em>'; const n = D.diff(D.today(), d); return n > 0 ? `<em>${n}</em> ${n === 1 ? 'day' : 'days'} to go` : n === 0 ? 'It’s <em>today</em>' : 'What a <em>party!</em>'; },
      countdown(ctx) { return countdown(ctx.state); },
      kpis(ctx) {
        const s = ctx.state, b = budgetTotals(s), c = counts(s), tasks = s.tasks.filter(x => P.has(x.text)), done = tasks.filter(x => x.done).length;
        return u.kpis([['Budget left', ctx.money(b.left, { cents: false }), b.left < 0 ? 'is-bad' : 'y-kpi--world', b.base ? `${ctx.money(b.spent, { cents: false })} spent of ${ctx.money(b.base, { cents: false })}` : 'set a budget'],
          ['Coming', `${c.Yes}<small class="gs-of">/${c.all}</small>`, '', c.Pending ? `${c.Pending} still to answer` : 'all RSVPs in'],
          ['Menu', `${s.menu.filter(x => x.done).length}<small class="gs-of">/${s.menu.filter(x => P.has(x.name)).length}</small>`, '', `${s.supplies.filter(x => P.has(x.item) && !x.got).length} supplies to get`],
          ['Checklist', `${done}<small class="gs-of">/${tasks.length}</small>`, 'y-kpi--accent', `${Math.round(tasks.length ? done / tasks.length * 100 : 0)}% done`]]);
      },
      next(ctx) {
        const s = ctx.state, t = D.today(), open = openTasks(s).map((x, i) => ({ x, due: dueOf(s, x) })).sort((a, b) => (a.due || 'z').localeCompare(b.due || 'z')).slice(0, 6);
        if (!open.length) return u.empty('check', 'Nothing left on the list', 'Enjoy it.');
        return `<ul class="pl-checklist wd-next">${open.map(({ x, due }) => `<li class="pl-ci">${u.tick(`tasks.${s.tasks.indexOf(x)}.done`, false, `Done: ${x.text}`, { rerender: true })}
          <div class="pl-ci-main"><span class="pl-ci-text">${esc(x.text)}</span><span class="pl-ci-meta${due && due < t ? ' is-over' : ''}">${due ? `${due < t ? 'was due ' : ''}${esc(D.short(due))}` : esc(WHEN_NAME[x.when])}</span></div></li>`).join('')}</ul>`;
      },
      pay(ctx) {
        const t = D.today(), l = payments(ctx.state).slice(0, 5);
        if (!l.length) return '<p class="pl-muted">No payments due. Add deposit and balance dates to vendors to see them here.</p>';
        return `<ol class="y-timeline bu-pay">${l.map(p => `<li><span class="y-timeline-dot"></span><b>${esc(p.v.name || 'Vendor')} · ${p.kind.toLowerCase()}</b><span class="y-timeline-when${p.due < t ? ' is-over' : ''}">${esc(D.short(p.due))}</span><span class="y-timeline-meta y-num">${esc(ctx.money(p.amount))} · ${esc(D.rel(p.due))}</span></li>`).join('')}</ol>`;
      }
    }
  };

  /* ---------- checklist ---------- */
  const checklist = {
    id: 'checklist', label: 'Checklist', icon: 'check',
    badge: ctx => { const s = ctx.state, t = D.today(), n = openTasks(s).filter(x => dueOf(s, x) && dueOf(s, x) < t).length; return n || ''; },
    render(ctx) {
      const s = ctx.state, t = D.today(), hide = !!s.ui.hideDone;
      const groups = WHEN.map(([k, name]) => {
        const items = s.tasks.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.when === k && !(hide && x.done));
        const all = s.tasks.filter(x => x.when === k && P.has(x.text)), done = all.filter(x => x.done).length, due = wdate(s) ? D.add(wdate(s), -WHEN_DAYS[k]) : '';
        return `<section class="y-panel wd-when${all.length && done === all.length ? ' is-done' : ''}"><div class="y-panel-head"><h2 class="y-kicker">${esc(name)}</h2>
          <span class="pl-muted y-num">${due ? `${due < t && done < all.length ? '<b class="is-over">' : ''}by ${esc(D.short(due))}${due < t && done < all.length ? '</b>' : ''} · ` : ''}${done}/${all.length}</span></div>
          ${items.length ? `<ul class="pl-checklist">${items.map(x => `<li class="pl-ci${x.done ? ' is-done' : ''}">${u.tick(`tasks.${x.__i}.done`, x.done, `Done: ${x.text}`, { rerender: true })}
            <div class="pl-ci-main">${u.input(`tasks.${x.__i}.text`, x.text, { label: 'Task', ph: 'Task', cls: 'pl-ci-input' })}</div>${u.iconBtn('trash', `Remove ${x.text || 'task'}`, 'removeTask', { i: x.__i })}</li>`).join('')}</ul>` : ''}
          ${u.btn('Add task', { sm: true, kind: 'ghost', icon: 'plus', act: 'addTask', data: { when: k } })}</section>`;
      }).join('');
      return `${u.head({ eyebrow: 'Checklist', title: 'One step at a <em>time</em>', lede: wdate(s) ? 'Every step has a date, counted back from the party. Late ones turn red — no panic, just next.' : 'Set the party date on the Overview and every step gets a real date.', meta: countdown(s) })}
      <div class="pl-row wd-tools">${u.switch('ui.hideDone', s.ui.hideDone, 'Hide done')}</div>
      <div class="wd-whens">${groups}</div>`;
    },
    actions: {
      addTask(ctx, d) { ctx.state.tasks.push(task('', d.when)); ctx.focus(`[data-bind="tasks.${ctx.state.tasks.length - 1}.text"]`); },
      removeTask(ctx, d) { ctx.state.tasks.splice(+d.i, 1); }
    }
  };

  /* ---------- budget ---------- */
  const budget = {
    id: 'budget', label: 'Budget', icon: 'chart',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Budget vs actual', title: '<span data-slot="title"></span>', lede: 'Set one total, plan each category, and update “spent” as money goes out.' })}
      <div data-slot="alerts"></div><div data-slot="kpis"></div>
      ${u.panel('Total', u.field('Total budget', 'totalBudget', s.totalBudget, { num: true, ph: 'e.g. 25000', hint: 'Leave empty to use the sum of the categories.' }), { icon: 'edit', cls: 'wd-total' })}
      ${u.panel('Categories', `${s.categories.length ? u.table('categories', s.categories, [
        { k: 'name', label: 'Category', title: true, ph: 'Category', w: '1.3fr' },
        { k: 'budget', label: 'Budget', num: true, ph: '0', w: '120px' },
        { k: 'actual', label: 'Spent', num: true, ph: '0', w: '120px' },
        { label: 'Left', w: '1fr', html: (c, i) => `<div data-slot="catLeft" data-arg="${i}"></div>` }
      ], { move: true, what: 'category', add: 'Add category', tpl: 'categories' }) : u.empty('list', 'No categories yet', 'Add the usual ones in one tap.')}
        <div class="pl-row bu-cat-foot">${u.btn('Add starter categories', { sm: true, kind: s.categories.length ? 'ghost' : 'world', icon: 'sparkle', act: 'starter' })}</div>`, { icon: 'list' })}`;
    },
    slots: {
      title(ctx) { const b = budgetTotals(ctx.state); if (!b.base) return 'Set a <em>budget</em>'; return b.left < 0 ? `Over by <em>${esc(ctx.money(-b.left))}</em>` : `<em>${esc(ctx.money(b.left))}</em> left of ${esc(ctx.money(b.base))}`; },
      alerts(ctx) {
        const s = ctx.state, b = budgetTotals(s), late = payments(s).filter(p => p.due < D.today()), out = [];
        if (late.length) out.push(u.banner('bad', `<b>${P.plural(late.length, 'payment')} overdue:</b> ${late.slice(0, 3).map(p => `${esc(p.v.name || 'vendor')} ${p.kind.toLowerCase()} ${esc(ctx.money(p.amount))} (${esc(D.short(p.due))})`).join(' · ')}`));
        if (b.left < 0) out.push(u.banner('warn', `Spending is ${esc(ctx.money(-b.left))} over the total budget. Trim a category or raise the total.`));
        if (b.total && b.gap < -0.005) out.push(u.banner('warn', `Categories add up to ${esc(ctx.money(b.allocated))} — ${esc(ctx.money(-b.gap))} more than the total.`));
        return out.join('');
      },
      kpis(ctx) {
        const b = budgetTotals(ctx.state);
        return u.kpis([['Budget', esc(ctx.money(b.base)), '', b.total && Math.abs(b.gap) > 0.005 ? (b.gap > 0 ? `${esc(ctx.money(b.gap))} not yet assigned` : `${esc(ctx.money(-b.gap))} over-assigned`) : b.total ? 'fully assigned' : 'sum of categories'],
          ['Spent', esc(ctx.money(b.spent)), 'y-kpi--world', `${Math.round(b.pct)}% of budget`], ['Left', esc(ctx.money(b.left)), b.left < 0 ? 'is-bad' : 'y-kpi--accent'],
          ['Still owed to vendors', esc(ctx.money(b.vendorOwed)), '', `${esc(ctx.money(b.vendorPaid))} paid so far`]]) + `<div class="bu-overall">${u.meter(b.pct, 'Budget spent', { over: b.left < 0 })}</div>`;
      },
      catLeft(ctx, i) {
        const c = ctx.state.categories[+i]; if (!c) return '';
        const b = P.num(c.budget), a = P.num(c.actual), left = r2(b - a);
        return `<div class="bu-left"><span class="y-num${left < 0 ? ' is-over' : ''}">${left < 0 ? 'Over ' + esc(ctx.money(-left)) : esc(ctx.money(left))}</span>${u.meter(b ? a / b * 100 : a ? 100 : 0, `${c.name} spent`, { over: left < 0 })}</div>`;
      }
    },
    actions: {
      starter(ctx) {
        const s = ctx.state, have = new Set(s.categories.map(c => c.name.toLowerCase())), add = CATS.filter(n => !have.has(n.toLowerCase()));
        add.forEach(n => s.categories.push(cat(n)));
        ctx.toast(add.length ? `Added ${P.plural(add.length, 'category', 'categories')}` : 'All starter categories are already here');
      }
    }
  };

  /* ---------- vendors ---------- */
  const vendors = {
    id: 'vendors', label: 'Bookings', icon: 'briefcase',
    badge: ctx => { const n = payments(ctx.state).filter(p => p.due < D.today()).length; return n || ''; },
    render(ctx) {
      const s = ctx.state, f = STATUSES.includes(s.ui.vf) ? s.ui.vf : 'all';
      const rows = s.vendors.map((v, i) => Object.assign({ __i: i }, v)).filter(v => f === 'all' || v.status === f);
      const catOpts = Array.from(new Set(s.categories.map(c => c.name).filter(Boolean)));
      return `${u.head({ eyebrow: 'Quotes, bookings & payments', title: 'Bookings', lede: 'Venue, cake, entertainment, rentals: what each costs, what you have paid and when the rest is due.' })}
      ${s.vendors.length ? u.chips('ui.vf', f, [['all', 'All', s.vendors.length], ...STATUSES.map(x => [x, x, s.vendors.filter(v => v.status === x).length])], 'Filter by status') : ''}
      ${u.records('vendors', rows, {
        index: v => v.__i, what: 'Booking', titlePh: 'Who you booked', cls: 'bu-vendors',
        sub: v => `<span data-slot="vSub" data-arg="${v.__i}"></span>`,
        cardClass: v => (payments({ vendors: [v] }).some(p => p.due < D.today()) ? 'is-flag' : ''),
        fields: [
          { k: 'category', label: 'Category', options: v => (!v.category || catOpts.includes(v.category) ? catOpts : [v.category].concat(catOpts)), blank: '—' },
          { k: 'status', label: 'Status', options: STATUSES, rerender: true },
          { k: 'total', label: 'Contract total', num: true, ph: '0' }, { k: 'paid', label: 'Paid so far', num: true, ph: '0' },
          { k: 'deposit', label: 'Deposit', num: true, ph: '0' }, { k: 'depositDue', label: 'Deposit due', type: 'date' },
          { k: 'balanceDue', label: 'Balance due', type: 'date' }, { k: 'contact', label: 'Contact', ph: 'Phone, email or site' },
          { k: 'notes', label: 'Notes', type: 'textarea', wide: true, ph: 'What’s included, lead times, contract notes…' }
        ],
        add: 'Add booking', empty: s.vendors.length ? '<p class="pl-muted">Nothing with this status.</p>' : u.empty('briefcase', 'No bookings yet', 'Add each booking as soon as you get a quote — payments show up on the overview.')
      })}`;
    },
    slots: {
      vSub(ctx, i) {
        const v = ctx.state.vendors[+i]; if (!v) return '';
        const owe = r2(P.num(v.total) - P.num(v.paid)), next = payments({ vendors: [v] })[0];
        return `${owe > 0.005 ? `<span class="y-num">${esc(ctx.money(owe))} left to pay</span>` : P.num(v.total) ? u.pill('Paid in full', 'good') : ''}${next ? ` · ${next.due < D.today() ? u.pill(`${next.kind} overdue`, 'bad') : `${next.kind.toLowerCase()} due ${esc(D.short(next.due))}`}` : ''}`;
      }
    }
  };

  /* ---------- guests ---------- */
  const guests = {
    id: 'guests', label: 'Guests', icon: 'user',
    badge: ctx => counts(ctx.state).Pending || '',
    render(ctx) {
      const s = ctx.state, f = RSVP.includes(s.ui.rf) ? s.ui.rf : 'all', q = txt(s.ui.q).trim().toLowerCase(), c = counts(s);
      const rows = s.guests.map((g, i) => Object.assign({ __i: i }, g)).filter(g => (f === 'all' || g.rsvp === f) && (!q || (g.name + ' ' + g.party + ' ' + g.notes).toLowerCase().includes(q)));
      const tableOpts = s.tables.map(t => [t.id, t.name || 'Unnamed table']);
      return `${u.head({ eyebrow: 'Guest list', title: `<em>${c.Yes}</em> coming · ${c.all} invited`, lede: 'One row per person. Use the household column to keep families together, and note allergies.' })}
      <div data-slot="glance"></div>
      ${u.panel('', `${u.quickAdd('guests', { key: 'name', ph: 'Add a guest — type a name and press Enter', label: 'Add a guest', kind: 'world', at: 'top' })}
        <div class="pl-row gs-filter">${u.chips('ui.rf', f, [['all', 'All', c.all], ['Yes', 'Yes', c.Yes], ['Pending', 'Pending', c.Pending], ['No', 'No', c.No]], 'Filter by RSVP')}<span class="pl-spacer"></span>
          <div class="gs-search">${I('search')}${u.input('ui.q', s.ui.q, { label: 'Search guests', ph: 'Search names, parties, notes', live: true })}</div></div>
        ${rows.length ? u.table('guests', rows, [
          { k: 'name', label: 'Name', title: true, w: '1.3fr', ph: 'Full name' }, { k: 'party', label: 'Household', w: '1fr', ph: 'Family' },
          { k: 'rsvp', label: 'RSVP', type: 'select', options: RSVP, w: '112px', rerender: true },
          { k: 'meal', label: 'Diet', type: 'select', options: MEALS, w: '140px' },
          { k: 'notes', label: 'Notes', w: '1fr', ph: 'Dietary, access…' }
        ], { index: g => g.__i, total: s.guests.length, what: 'guest', rowClass: g => (g.rsvp === 'No' ? 'gs-no' : '') })
          : c.all ? '<p class="pl-muted">No guests match.</p>' : u.empty('user', 'No guests yet', 'Type a name above and press Enter. Add everyone first, sort RSVPs later.')}`)}`;
    },
    slots: {
      glance(ctx) {
        const s = ctx.state, g = named(s).filter(x => x.rsvp !== 'No');
        if (!g.length) return '';
        const meals = MEALS.slice(1).map(m => [m, g.filter(x => x.meal === m).length]).filter(x => x[1]);
        return `<div class="wd-glance"><span>Coming or maybe <b class="y-num">${g.length}</b></span>${meals.map(([m, n]) => `<span>${esc(m)} <b class="y-num">${n}</b></span>`).join('')}</div>`;
      }
    },
    sheet(ctx) {
      const s = ctx.state, l = alpha(named(s)), tname = id => (s.tables.find(t => t.id === id) || {}).name || '';
      return `<h1>Guest list</h1><p class="pl-sheet-meta">${esc(s.profile.couple || '')}${wdate(s) ? ' · ' + esc(D.full(wdate(s))) : ''} · ${l.length} guests · ${counts(s).Yes} yes</p>
        <table><thead><tr><th>Name</th><th>Household</th><th>RSVP</th><th>Diet</th><th>Notes</th></tr></thead>
        <tbody>${l.map(g => `<tr><td>${esc(g.name)}</td><td>${esc(g.party)}</td><td>${esc(g.rsvp)}</td><td>${g.meal === '—' ? '' : esc(g.meal)}</td><td>${esc(g.notes)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- menu & supplies ---------- */
  const menu = {
    id: 'menu', label: 'Menu', icon: 'list',
    badge: ctx => ctx.state.supplies.filter(x => P.has(x.item) && !x.got).length || '',
    render(ctx) {
      const s = ctx.state, diets = MEALS.slice(1).map(m => [m, named(s).filter(x => x.rsvp !== 'No' && x.meal === m)]).filter(x => x[1].length);
      const ready = s.menu.filter(x => x.done && P.has(x.name)).length, all = s.menu.filter(x => P.has(x.name)).length;
      return `${u.head({ eyebrow: 'Food & supplies', title: all ? `<em>${ready}</em> of ${all} dishes sorted` : 'What are we <em>serving?</em>', lede: 'Every dish and who brings it, plus everything else to buy. Allergies from the guest list show up here so nobody forgets.' })}
      ${diets.length ? u.banner('warn', `<b>Remember:</b> ${diets.map(([m, l]) => `${esc(m)} — ${l.map(x => esc(x.name)).join(', ')}`).join(' · ')}`) : ''}
      ${u.panel('Menu', u.table('menu', s.menu, [
        { k: 'done', label: 'Sorted', type: 'check', w: '64px', rerender: true }, { k: 'course', label: 'Course', type: 'select', options: COURSES, w: '130px' },
        { k: 'name', label: 'Dish', title: true, w: '1.6fr', ph: 'What' }, { k: 'who', label: 'Who brings it', w: '1fr', ph: 'Us, a guest, the bakery' }, { k: 'note', label: 'Notes', w: '1fr', ph: 'Optional' }
      ], { what: 'dish', move: true, add: 'Add dish', tpl: 'menu', empty: 'Snacks, mains, cake, drinks.', rowClass: x => (x.done ? 'is-done' : '') }), { icon: 'list', hint: 'Tick a dish once it is bought, made or confirmed.' })}
      ${u.panel('Supplies to get', u.table('supplies', s.supplies, [
        { k: 'got', label: 'Got it', type: 'check', w: '64px', rerender: true }, { k: 'item', label: 'Item', title: true, w: '1.6fr', ph: 'Plates, candles, balloons…' }, { k: 'qty', label: 'How many', w: '130px', ph: '1' }
      ], { what: 'supply', add: 'Add supply', tpl: 'supplies', empty: 'Plates, cups, candles, favors, ice.', rowClass: x => (x.got ? 'is-done' : '') }), { icon: 'check' })}`;
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Menu & shopping</h1><p class="pl-sheet-meta">${esc(s.profile.couple || '')}${wdate(s) ? ' · ' + esc(D.full(wdate(s))) : ''}</p>
        ${COURSES.map(c => { const l = s.menu.filter(x => x.course === c && P.has(x.name)); return l.length ? `<h2>${c}</h2><table><tbody>${l.map(x => `<tr><td style="width:6mm"><span class="pl-box"></span></td><td><b>${esc(x.name)}</b></td><td>${esc(x.who)}</td><td>${esc(x.note)}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}
        <h2>Supplies</h2><table><tbody>${s.supplies.filter(x => P.has(x.item) && !x.got).map(x => `<tr><td style="width:6mm"><span class="pl-box"></span></td><td>${esc(x.item)}</td><td>${esc(x.qty)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- seating (not used in the party app) ---------- */
  const seating = {
    id: 'seating', label: 'Seating', icon: 'home',
    badge: ctx => counts(ctx.state).needSeat || '',
    render(ctx) {
      const s = ctx.state, c = counts(s), waiting = alpha(named(s).filter(g => !g.table && g.rsvp !== 'No')), seats = s.tables.reduce((a, t) => a + cap(t), 0);
      const assign = t => {
        const opts = waiting.map(g => `<option value="${esc(g.id)}">${esc(g.name)}${g.rsvp === 'Pending' ? ' (pending)' : ''}</option>`).join('');
        return waiting.length ? `<label class="y-sr" for="as-${t.id}">Seat a guest at ${esc(t.name || 'this table')}</label><select class="y-select gs-assign" id="as-${t.id}" data-onchange="seat" data-table="${esc(t.id)}"><option value="">+ Seat a guest…</option>${opts}</select>` : '';
      };
      return `${u.head({ eyebrow: 'Seating chart', title: c.needSeat ? `<em>${c.needSeat}</em> still need a seat` : c.Yes ? 'Everyone has a <em>seat</em>' : 'Seating chart', lede: `${P.plural(s.tables.length, 'table')} · ${seats} seats for ${c.Yes} “yes” guests.${seats && c.Yes > seats ? ' <b>Not enough seats yet.</b>' : ''}` })}
      ${waiting.length ? u.panel('Waiting for a seat', `<ul class="gs-wait">${waiting.map(g => `<li class="${g.rsvp === 'Pending' ? 'is-pending' : ''}">${esc(g.name)}${g.party ? `<small>${esc(g.party)}</small>` : ''}</li>`).join('')}</ul>`, { icon: 'user', cls: 'y-panel--soft', hint: 'Pick a guest from a table’s “Seat a guest” menu. Pending guests are shown faded.' }) : ''}
      <div class="gs-tables">${s.tables.map((t, i) => {
        const at = seated(s, t), n = cap(t), over = n && at.length > n;
        return `<article class="gs-table${over ? ' is-over' : ''}">
          <header class="gs-table-head"><span class="gs-table-num y-num">${i + 1}</span>${u.input(`tables.${i}.name`, t.name, { label: `Table ${i + 1} name`, ph: 'Table name', cls: 'pl-title-input' })}${u.rowTools('tables', i, s.tables.length, { move: true, what: 'table', label: t.name })}</header>
          <div class="gs-table-cap"><span class="y-num"><b>${at.length}</b> / </span>${u.input(`tables.${i}.seats`, t.seats, { label: `Seats at ${t.name || 'table ' + (i + 1)}`, num: true, cls: 'gs-seats', rerender: true })}<span>seats</span>${over ? u.pill(`${at.length - n} over`, 'bad') : n && at.length === n ? u.pill('Full', 'good') : ''}</div>
          ${u.meter(n ? at.length / n * 100 : 0, 'Seats filled', { over })}
          <ul class="gs-seated">${alpha(at).map(g => `<li><span>${esc(g.name)}${g.meal !== '—' ? ` <small>${esc(g.meal)}</small>` : ''}</span>${u.iconBtn('close', `Unseat ${g.name}`, 'unseat', { id: g.id })}</li>`).join('') || '<li class="pl-muted gs-empty-seat">No one yet</li>'}</ul>
          ${assign(t)}</article>`;
      }).join('')}</div>
      <div class="pl-row">${u.add('Add table', 'tables', { kind: 'world' })}${s.tables.length ? '' : u.btn('Add 8 round tables', { sm: true, icon: 'sparkle', act: 'eight' })}</div>`;
    },
    actions: {
      seat(ctx, d) { const g = ctx.state.guests.find(x => x.id === d.value); if (!g) return false; g.table = d.table; ctx.focus(`#as-${d.table}`); },
      unseat(ctx, d) { const g = ctx.state.guests.find(x => x.id === d.id); if (g) g.table = ''; },
      eight(ctx) { for (let i = 1; i <= 8; i++) ctx.state.tables.push(table(`Table ${i}`, 8)); }
    },
    sheet(ctx) {
      const s = ctx.state, l = alpha(named(s).filter(g => g.table)), tname = id => { const i = s.tables.findIndex(t => t.id === id); return i < 0 ? '' : s.tables[i].name || `Table ${i + 1}`; };
      return `<h1>Seating chart</h1><p class="pl-sheet-meta">${esc(s.profile.couple || '')}${wdate(s) ? ' · ' + esc(D.full(wdate(s))) : ''}${s.profile.venue ? ' · ' + esc(s.profile.venue) : ''}</p>
        <div class="gs-sheet-tables">${s.tables.map((t, i) => `<section><h2>${esc(t.name || `Table ${i + 1}`)}</h2><ol>${alpha(seated(s, t)).map(g => `<li>${esc(g.name)}</li>`).join('')}</ol></section>`).join('')}</div>
        <h2>Find your seat</h2><table class="gs-sheet-alpha"><tbody>${l.map(g => `<tr><td>${esc(g.name)}</td><td>${esc(tname(g.table))}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- day-of ---------- */
  function nowNext(s) {
    if (wdate(s) !== D.today()) return null;
    const now = new Date(), m = now.getHours() * 60 + now.getMinutes();
    let cur = null, next = null;
    sortedCues(s).filter(c => D.mins(c.time) != null).forEach(c => { if (D.mins(c.time) <= m) cur = c; else if (!next) next = c; });
    return { cur, next };
  }
  const dayof = {
    id: 'dayof', label: 'Party day', icon: 'timer',
    render(ctx) {
      const s = ctx.state, p = s.profile, nn = nowNext(s), inOrder = s.cues.every((c, i, a) => !i || byTime(a[i - 1], c) <= 0);
      return `${u.head({ eyebrow: 'Party day', title: 'The party <em>plan</em>', lede: 'What happens when, who does it and where, when helpers and rentals arrive, and the numbers you will need. Print it for your helpers.', meta: countdown(s) })}
      ${nn ? `<section class="y-panel y-panel--world rs-live"><div><span class="rs-live-label">Now</span><b>${nn.cur ? `${esc(D.time(nn.cur.time))} · ${esc(nn.cur.title)}` : 'Not started yet'}</b></div><div><span class="rs-live-label">Next</span><b>${nn.next ? `${esc(D.time(nn.next.time))} · ${esc(nn.next.title)}` : 'That’s everything!'}</b></div></section>` : ''}
      ${u.panel('Timeline', `${s.cues.length && !inOrder ? `<div class="pl-row rs-sortbar">${u.banner('warn', 'Some times are out of order.')}${u.btn('Sort by time', { sm: true, icon: 'list', act: 'sort' })}</div>` : ''}
        ${s.cues.length ? u.table('cues', s.cues, [
          { k: 'done', label: 'Done', type: 'check', w: '52px', rerender: true }, { k: 'time', label: 'Time', type: 'time', w: '128px' },
          { k: 'mins', label: 'Min', num: true, w: '64px', ph: '—' }, { k: 'title', label: 'What happens', title: true, w: '1.5fr', ph: 'Cue' },
          { k: 'who', label: 'Who', w: '1fr', ph: 'Owner' }, { k: 'where', label: 'Where', w: '1fr', ph: 'Location' }, { k: 'note', label: 'Notes', w: '1.2fr', ph: 'Optional' }
        ], { what: 'cue', move: true, rowClass: c => (c.done ? 'is-done' : '') }) : u.empty('timer', 'No cues yet', 'Start with the fixed times — guests arrive, food, cake — then fill in around them.')}
        <div class="pl-list-foot">${u.add('Add cue', 'cues', { kind: 'world' })}</div>`, { icon: 'timer', hint: 'Minutes are optional — they show end times on the printed sheet.' })}
      ${u.panel('Who runs the day', `<div class="pl-fields">${u.field('Host in charge', 'profile.lead', p.lead, { ph: 'Who runs the day' })}${u.field('Their phone', 'profile.leadPhone', p.leadPhone, { type: 'tel', ph: 'Phone' })}</div>`, { icon: 'star' })}
      ${u.panel('Helpers & rentals', u.table('crew', s.crew, [
        { k: 'role', label: 'Role', w: '130px', ph: 'Role' }, { k: 'name', label: 'Name', title: true, w: '1.2fr', ph: 'Company or person' },
        { k: 'arrive', label: 'Arrives', type: 'time', w: '120px' }, { k: 'leave', label: 'Leaves', type: 'time', w: '120px' },
        { k: 'where', label: 'Where', w: '1fr', ph: 'Area' }, { k: 'phone', label: 'Phone', type: 'tel', w: '150px', ph: 'Phone' }
      ], { what: 'helper', move: true, add: 'Add helper', tpl: 'crew', empty: 'Add helpers and rentals with the time they arrive.' }), { icon: 'briefcase' })}
      ${u.panel('Key contacts', u.table('contacts', s.contacts, [
        { k: 'role', label: 'Role', w: '160px', ph: 'e.g. Venue manager' }, { k: 'name', label: 'Name', title: true, w: '1.2fr', ph: 'Name' },
        { k: 'phone', label: 'Phone', type: 'tel', w: '170px', ph: 'Phone' }, { k: 'note', label: 'Notes', w: '1.2fr', ph: 'Has the rings, etc.' }
      ], { what: 'contact', move: true, add: 'Add contact', empty: 'Pizza place, venue, parents with allergy info, emergency.' }), { icon: 'user' })}`;
    },
    actions: { sort(ctx) { ctx.state.cues.sort(byTime); ctx.toast('Sorted by time'); } },
    sheet(ctx) {
      const s = ctx.state, p = s.profile;
      return `<h1>${esc(p.couple || 'Party')} · plan</h1>
        <p class="pl-sheet-meta">${[wdate(s) && D.long(wdate(s)), p.venue, p.lead && `In charge: ${p.lead}${p.leadPhone ? ' · ' + p.leadPhone : ''}`].filter(Boolean).map(esc).join(' · ')}</p>
        <table><thead><tr><th>Time</th><th>What happens</th><th>Who</th><th>Where</th><th>Notes</th></tr></thead>
        <tbody>${sortedCues(s).map(c => `<tr><td style="white-space:nowrap"><b>${esc(D.time(c.time))}</b>${endOf(c) ? `<br><span style="color:#666">to ${esc(D.time(endOf(c)))}</span>` : ''}</td><td><b>${esc(c.title)}</b></td><td>${esc(c.who)}</td><td>${esc(c.where)}</td><td>${esc(c.note)}</td></tr>`).join('')}</tbody></table>
        ${s.crew.length ? `<h2>Helpers & rentals</h2><table><thead><tr><th>Role</th><th>Name</th><th>Arrives</th><th>Leaves</th><th>Where</th><th>Phone</th></tr></thead><tbody>${s.crew.map(v => `<tr><td>${esc(v.role)}</td><td>${esc(v.name)}</td><td>${esc(D.time(v.arrive))}</td><td>${esc(D.time(v.leave))}</td><td>${esc(v.where)}</td><td style="white-space:nowrap">${esc(v.phone)}</td></tr>`).join('')}</tbody></table>` : ''}
        ${s.contacts.length ? `<h2>Key contacts</h2><table><tbody>${s.contacts.map(c => `<tr><td>${esc(c.role)}</td><td><b>${esc(c.name)}</b></td><td style="white-space:nowrap">${esc(c.phone)}</td><td>${esc(c.note)}</td></tr>`).join('')}</tbody></table>` : ''}`;
    }
  };

  P.create({
    slug: 'party-planner-app', name: 'Party Planner', world: 'party', currency: true,
    welcome: 'Set the party date on the Overview — the checklist dates count back from it.',
    pages: [overview, checklist, guests, menu, budget, vendors, dayof],
    blank, sample, normalize,
    open(ctx) { if (ctx.state.cues.length) ctx.state.cues.sort(byTime); },
    rows: {
      categories: () => cat(''), vendors: vendor, guests: () => guest(), tables: ctx => table(`Table ${ctx.state.tables.length + 1}`, 8),
      cues: ctx => { const last = sortedCues(ctx.state).filter(c => D.mins(c.time) != null).pop(); return cue(last ? endOf(last) || '' : ''); },
      crew: () => crewRow(), contacts: () => contact(), menu: () => dish('Snacks'), supplies: () => supply('', '1')
    },
    about: '<p><b>Party Planner</b> keeps a party in one place: a checklist dated back from the party, the guest list with RSVPs and allergies, the menu with who brings what and the supplies to buy, the budget and every booking’s payments, and the party-day plan for your helpers. Print the guest list, the menu and shopping list, or the party plan.</p>',
    disclaimer: 'Party Planner is a personal planning tool. Confirm allergies with parents and guests, and numbers, deadlines and timings with your venue and bookings.'
  });
})();
