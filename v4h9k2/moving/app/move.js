/* Moving Planner App — countdown, budget, boxes, addresses & docs, contacts, from Moving Planner. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const WHEN = [['8w', '8 weeks out', -56], ['6w', '6 weeks out', -42], ['4w', '4 weeks out', -28], ['2w', '2 weeks out', -14], ['1w', 'Moving week', -7], ['day', 'Moving day', 0], ['after', 'First week after', 7]];
  const OFF = Object.fromEntries(WHEN.map(w => [w[0], w[2]]));
  const ROOMS = ['Kitchen', 'Living room', 'Bedroom', 'Kids’ room', 'Bathroom', 'Office', 'Garage', 'Other'];
  const COST_CATS = ['Movers / van', 'Packing', 'Housing', 'Cleaning', 'Services', 'Travel', 'Other'];
  const DOC_STATUS = ['To do', 'In progress', 'Waiting', 'Done'];
  const txt = v => (v == null ? '' : String(v));
  const task = (when, text, done) => ({ id: P.uid(), when: when || '4w', text: text || '', done: !!done });
  const cost = (item, cat, est, act, paid) => ({ id: P.uid(), item: item || '', cat: cat || 'Other', est: txt(est), act: txt(act), paid: !!paid });
  const box = (n, room, contents, fragile, packed, unpacked) => ({ id: P.uid(), n: txt(n), room: room || 'Kitchen', contents: contents || '', fragile: !!fragile, packed: !!packed, unpacked: !!unpacked });
  const doc = (text, due, status, note) => ({ id: P.uid(), text: text || '', due: due || '', status: status || 'To do', note: note || '' });
  const person = (role, name, phone, note) => ({ id: P.uid(), role: role || '', name: name || '', phone: phone || '', note: note || '' });
  const STARTER = [
    ['8w', 'Set a moving budget'], ['8w', 'Get 3 mover quotes or price a van'], ['8w', 'Start a “moving” folder for papers'],
    ['6w', 'Book movers or van'], ['6w', 'Declutter one room at a time'], ['6w', 'Order boxes, tape, markers'],
    ['4w', 'Give notice / confirm lease dates'], ['4w', 'Schedule utilities: stop old, start new'], ['4w', 'Start packing things you rarely use'],
    ['2w', 'Forward mail'], ['2w', 'Update address: bank, work, subscriptions'], ['2w', 'Use up freezer and pantry food'],
    ['1w', 'Pack an essentials bag'], ['1w', 'Confirm movers and parking'], ['1w', 'Defrost the freezer'],
    ['day', 'Photograph meters and empty rooms'], ['day', 'Final walkthrough + keys'], ['day', 'Unpack essentials + make beds first'],
    ['after', 'Update driver’s license / ID'], ['after', 'Register to vote at the new address'], ['after', 'Unpack one room at a time']
  ];

  function blank() { return { move: { date: '', from: '', to: '', people: '' }, tasks: [], costs: [], boxes: [], docs: [], people: [], notes: '' }; }
  function sample() {
    const md = D.add(D.today(), 24);
    return {
      move: { date: md, from: '4 Oak Street, Apt 2', to: '9 Cedar St', people: '2 + a cat' },
      tasks: STARTER.map(([w, t]) => task(w, t, OFF[w] <= -28 || (w === '2w' && /mail/i.test(t)))),
      costs: [cost('Northside Movers (3 hrs + truck)', 'Movers / van', 650, 625, true), cost('Boxes + tape', 'Packing', 110, 94, true), cost('Home inspection + appraisal', 'Housing', 950, 925, true), cost('Move-out cleaning', 'Cleaning', 180, '', false), cost('Cat carrier + calming spray', 'Other', 45, '', false)],
      boxes: [box(1, 'Kitchen', 'Everyday plates + glasses', true, true), box(2, 'Kitchen', 'Pots, pans, knives', false, true), box(3, 'Bedroom', 'Bedding + towels', false, true), box(4, 'Living room', 'Books A–M', false, false), box(5, 'Living room', 'Lamps + frames', true, false), box(6, 'Office', 'Cables, chargers, printer', false, false), box(7, 'Bathroom', 'First-night toiletries', false, false)],
      docs: [doc('Sign the closing papers', D.add(md, -2), 'In progress', 'Title company, 10:00'), doc('Home insurance for Cedar St', D.add(md, -10), 'In progress', 'Compare 2 quotes'), doc('Internet install', D.add(md, 1), 'Waiting', 'Appointment 9–12'), doc('Bank + credit card address', D.add(md, -7), 'To do'), doc('Vet records transfer', D.add(md, 10), 'To do')],
      people: [person('Movers', 'Northside Movers', '(555) 010-4455', 'Arrive 8:00, 3 hr minimum'), person('Old landlord', 'Pat Morris', '(555) 010-2211', 'Keys + walkthrough'), person('Agent', 'Dana at Keystone Realty', '(555) 010-9800', 'Keys at closing'), person('Helper', 'Sam', '(555) 010-3300', 'Brings the van at noon')],
      notes: 'Parking: reserve the loading zone with the building by Thursday.\nThe essentials bag: chargers, meds, cat food, kettle, 2 mugs, toilet paper, bedsheets.'
    };
  }
  function normalize(s) {
    const m = s.move || {};
    s.move = { date: txt(m.date), from: txt(m.from), to: txt(m.to), people: txt(m.people) };
    const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
    s.tasks = arr(s.tasks, x => Object.assign(task(OFF[x.when] != null ? x.when : '4w', txt(x.text), x.done), { id: txt(x.id) || P.uid() }));
    s.costs = arr(s.costs, x => Object.assign(cost(txt(x.item), COST_CATS.includes(x.cat) ? x.cat : 'Other', x.est, x.act, x.paid), { id: txt(x.id) || P.uid() }));
    s.boxes = arr(s.boxes, x => Object.assign(box(x.n, ROOMS.includes(x.room) ? x.room : 'Other', txt(x.contents), x.fragile, x.packed, x.unpacked), { id: txt(x.id) || P.uid() }));
    s.docs = arr(s.docs, x => Object.assign(doc(txt(x.text), txt(x.due), DOC_STATUS.includes(x.status) ? x.status : 'To do', txt(x.note)), { id: txt(x.id) || P.uid() }));
    s.people = arr(s.people, x => Object.assign(person(txt(x.role), txt(x.name), txt(x.phone), txt(x.note)), { id: txt(x.id) || P.uid() }));
    s.notes = txt(s.notes);
    return s;
  }
  const due = (s, w) => D.parse(s.move.date) ? D.add(s.move.date, OFF[w]) : '';
  const open = s => s.tasks.filter(t => !t.done && P.has(t.text));
  function currentStage(s) { if (!D.parse(s.move.date)) return null; const t = D.today(); let cur = WHEN[0][0]; WHEN.forEach(([k]) => { if (due(s, k) <= t) cur = k; }); return cur; }

  const countdown = {
    id: 'countdown', label: 'Countdown', icon: 'calendar',
    badge: ctx => { const s = ctx.state, t = D.today(); const n = open(s).filter(x => due(s, x.when) && due(s, x.when) < t).length; return n || ''; },
    render(ctx) {
      const s = ctx.state, m = s.move, n = D.parse(m.date) ? D.diff(D.today(), m.date) : null, stage = currentStage(s), t = D.today();
      return `
      ${u.head({ eyebrow: m.to ? `Moving to ${m.to}` : 'Moving planner', title: n == null ? 'When’s the <em>move</em>?' : n > 0 ? `<em>${n}</em> ${n === 1 ? 'day' : 'days'} to moving day` : n === 0 ? '<em>Moving day!</em>' : 'Welcome <em>home</em>', meta: '<span data-slot="progress"></span>' })}
      <div class="pl-grid">
        ${u.panel('The move', `<div class="pl-fields">${u.field('Moving date', 'move.date', m.date, { type: 'date', rerender: true })}${u.field('Who’s moving', 'move.people', m.people, { ph: '2 adults, 1 cat' })}${u.field('From', 'move.from', m.from, { ph: 'Old address', cls: 'pl-wide' })}${u.field('To', 'move.to', m.to, { ph: 'New address', cls: 'pl-wide' })}</div>`, { icon: 'home', cls: 'pl-5' })}
        ${u.panel('This stage', '<div data-slot="now"></div>', { icon: 'check', cls: 'pl-7 y-panel--soft' })}
      </div>
      ${s.tasks.length ? '' : u.empty('calendar', 'No checklist yet', 'Start from a proven 8-week moving checklist, then edit it to fit.', u.btn('Add the 8-week checklist', { kind: 'world', icon: 'sparkle', act: 'starter' }))}
      <div class="mv-stages">${WHEN.map(([k, label]) => {
        const list = s.tasks.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.when === k), d = due(s, k), done = list.filter(x => x.done).length;
        if (!list.length && !s.tasks.length) return '';
        return u.panel(label, `${u.checklist('tasks', list, { index: x => x.__i, total: s.tasks.length, ph: 'Task', what: 'task' })}<div class="pl-list-foot">${u.btn('Add task', { sm: true, icon: 'plus', act: 'addTask', data: { when: k } })}</div>`,
          { cls: `y-panel--flat mv-stage${k === stage ? ' is-now' : ''}${d && d < t && done < list.length && k !== stage ? ' is-late' : ''}`, actions: `${d ? `<span class="pl-pill${k === stage ? ' pl-pill--world' : ''}">${esc(D.fmt(d))}</span>` : ''}<span class="pl-pill${list.length && done === list.length ? ' pl-pill--good' : ''}">${done}/${list.length}</span>` });
      }).join('')}</div>`;
    },
    slots: {
      progress(ctx) {
        const s = ctx.state, all = s.tasks.filter(t => P.has(t.text)), done = all.filter(t => t.done).length;
        return all.length ? `<span class="mv-prog">${u.meter(done / all.length * 100, 'Checklist done')}</span><span><b class="y-num">${done}</b> of ${all.length} done</span>` : '';
      },
      now(ctx) {
        const s = ctx.state, stage = currentStage(s);
        if (!stage) return '<p class="pl-muted">Set the moving date to see which tasks are due now.</p>';
        const list = open(s).filter(x => OFF[x.when] <= OFF[stage]).slice(0, 5);
        const label = WHEN.find(w => w[0] === stage)[1];
        return list.length ? `<p class="mv-now-lead">You’re in <b>${esc(label.toLowerCase())}</b>. Do the next two, then pack one box.</p><ul class="pl-checklist">${list.map(x => { const i = s.tasks.indexOf(x); return `<li class="pl-ci">${u.tick(`tasks.${i}.done`, false, `Done: ${x.text}`, { rerender: true })}<div class="pl-ci-main"><span class="pl-ci-text">${esc(x.text)}</span><span class="pl-ci-meta">${esc(WHEN.find(w => w[0] === x.when)[1])}</span></div></li>`; }).join('')}</ul>` : '<p class="mv-now-lead">Nothing due right now — you’re ahead.</p>';
      }
    },
    actions: {
      starter(ctx) { const s = ctx.state, have = new Set(s.tasks.map(t => t.text.toLowerCase())); STARTER.forEach(([w, t]) => { if (!have.has(t.toLowerCase())) s.tasks.push(task(w, t)); }); ctx.toast('8-week checklist added'); },
      addTask(ctx, d) { const s = ctx.state; s.tasks.push(task(d.when)); ctx.focus(`[data-bind="tasks.${s.tasks.length - 1}.text"]`); }
    }
  };

  const budget = {
    id: 'budget', label: 'Budget', icon: 'money',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Moving costs', title: '<span data-slot="title"></span>', lede: 'Estimate first, then fill in the actual cost as quotes and receipts land.' })}
      <div data-slot="kpis"></div>
      ${u.panel('', u.table('costs', s.costs, [
        { k: 'item', label: 'Expense', title: true, w: '1.5fr', ph: 'What' }, { k: 'cat', label: 'Category', type: 'select', options: COST_CATS, w: '150px' },
        { k: 'est', label: 'Estimate', num: true, w: '120px', ph: '0' }, { k: 'act', label: 'Actual', num: true, w: '120px', ph: '—' }, { k: 'paid', label: 'Paid', type: 'check', w: '60px' }
      ], { what: 'expense', add: 'Add expense', empty: 'Movers or van, boxes, deposits, cleaning, travel…' }))}`;
    },
    slots: {
      title(ctx) { const s = ctx.state, est = s.costs.reduce((a, c) => a + P.num(c.est), 0), act = s.costs.reduce((a, c) => a + (P.has(c.act) ? P.num(c.act) : P.num(c.est)), 0); return est ? `About <em>${esc(ctx.money(act))}</em> all in` : 'Moving <em>budget</em>'; },
      kpis(ctx) {
        const s = ctx.state, est = s.costs.reduce((a, c) => a + P.num(c.est), 0), act = s.costs.filter(c => P.has(c.act)).reduce((a, c) => a + P.num(c.act), 0);
        const estOfActual = s.costs.filter(c => P.has(c.act)).reduce((a, c) => a + P.num(c.est), 0), paid = s.costs.filter(c => c.paid).reduce((a, c) => a + (P.has(c.act) ? P.num(c.act) : P.num(c.est)), 0);
        const diff = act - estOfActual;
        return u.kpis([['Estimated', esc(ctx.money(est))], ['Actual so far', esc(ctx.money(act)), 'y-kpi--world', estOfActual ? (diff > 0 ? `${esc(ctx.money(diff))} over those estimates` : `${esc(ctx.money(-diff))} under those estimates`) : ''], ['Paid', esc(ctx.money(paid)), 'y-kpi--accent']]);
      }
    }
  };

  const boxes = {
    id: 'boxes', label: 'Boxes', icon: 'list',
    render(ctx) {
      const s = ctx.state, f = ROOMS.includes(s.ui.room) ? s.ui.room : 'all';
      const rows = s.boxes.map((b, i) => Object.assign({ __i: i }, b)).filter(b => f === 'all' || b.room === f);
      const rooms = ROOMS.filter(r => s.boxes.some(b => b.room === r));
      return `${u.head({ eyebrow: 'Packing', title: '<span data-slot="title"></span>', lede: 'Number every box and say what’s inside — future you, standing in a hallway of boxes, will be grateful. Print turns this into box labels.' })}
      ${u.panel('', `${rooms.length > 1 ? u.chips('ui.room', f, [['all', 'All rooms', s.boxes.length], ...rooms.map(r => [r, r, s.boxes.filter(b => b.room === r).length])], 'Room') : ''}<div class="mv-gap"></div>
        ${u.table('boxes', rows, [
          { k: 'n', label: 'Box #', w: '76px', ph: '#', num: true }, { k: 'room', label: 'Room', type: 'select', options: ROOMS, w: '140px' },
          { k: 'contents', label: 'What’s inside', title: true, w: '1.6fr', ph: 'Contents' }, { k: 'fragile', label: 'Fragile', type: 'check', w: '64px' },
          { k: 'packed', label: 'Packed', type: 'check', w: '64px' }, { k: 'unpacked', label: 'Unpacked', type: 'check', w: '76px' }
        ], { index: b => b.__i, total: s.boxes.length, what: 'box', empty: 'Add a box as soon as you tape it.' })}
        <div class="pl-list-foot">${u.add('Add box', 'boxes', { kind: 'world' })}</div>`)}`;
    },
    slots: {
      title(ctx) { const s = ctx.state, n = s.boxes.length, p = s.boxes.filter(b => b.packed).length, un = s.boxes.filter(b => b.unpacked).length; return n ? (un ? `<em>${un}</em> of ${n} boxes unpacked` : `<em>${p}</em> of ${n} boxes packed`) : 'Boxes'; }
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<div class="mv-labels">${s.boxes.map(b => `<div class="mv-label"><span class="mv-label-n">${esc(b.n || '—')}</span><div><b>${esc(b.room.toUpperCase())}</b>${b.fragile ? '<span class="mv-label-f">FRAGILE</span>' : ''}<p>${esc(b.contents)}</p></div></div>`).join('')}</div>`;
    }
  };

  const docs = {
    id: 'docs', label: 'Addresses & docs', icon: 'doc',
    render(ctx) {
      const s = ctx.state, t = D.today();
      return `${u.head({ eyebrow: 'Paperwork', title: 'Address changes & documents', lede: 'Leases, insurance, utilities and every “update your address” — each with a due date.' })}
      ${u.panel('', u.table('docs', s.docs, [
        { k: 'text', label: 'Document or change', title: true, w: '1.5fr', ph: 'What' }, { k: 'due', label: 'Due', type: 'date', w: '160px' },
        { k: 'status', label: 'Status', type: 'select', options: DOC_STATUS, w: '140px', rerender: true }, { k: 'note', label: 'Notes', w: '1fr', ph: 'Optional' }
      ], { what: 'item', add: 'Add item', rowClass: d => d.status === 'Done' ? 'is-done' : D.parse(d.due) && d.due < t ? 'is-flag' : '', empty: 'Lease, insurance, internet, bank, post office, ID…' }))}`;
    }
  };

  const people = {
    id: 'people', label: 'Contacts', icon: 'user',
    render(ctx) {
      return `${u.head({ eyebrow: 'Who to call', title: 'Contacts', lede: 'Movers, landlords, utilities, helpers — one list for moving week.' })}
      ${u.panel('', u.table('people', ctx.state.people, [
        { k: 'role', label: 'Role', w: '150px', ph: 'Movers' }, { k: 'name', label: 'Name', title: true, w: '1.2fr', ph: 'Name' },
        { k: 'phone', label: 'Phone', type: 'tel', w: '170px', ph: 'Phone' }, { k: 'note', label: 'Notes', w: '1.2fr', ph: 'Optional' }
      ], { what: 'contact', move: true, add: 'Add contact' }))}`;
    }
  };

  const notes = {
    id: 'notes', label: 'Notes', icon: 'edit',
    render(ctx) { return `${u.head({ eyebrow: 'Parking lot', title: 'Notes', lede: 'Building rules, parking, what goes in the essentials bag.' })}${u.notes('notes', ctx.state.notes, { rows: 12 })}`; }
  };

  window.MVMove = {
    pages: { countdown, budget, boxes, docs, people }, blank, sample, normalize,
    rows: {
      tasks: () => task(), costs: () => cost(), docs: () => doc(), people: () => person(),
      boxes: ctx => box(String(ctx.state.boxes.reduce((m, b) => Math.max(m, Math.round(P.num(b.n))), 0) + 1), (ctx.state.boxes[ctx.state.boxes.length - 1] || {}).room)
    }
  };
})();
