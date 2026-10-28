/* Rental Property Tracker App — a small landlord's rent roll, properties and units, tenants and leases, expenses by category
   and maintenance requests. Yaykit planner engine, estate world (rentals.css). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const CATS = ['Repairs', 'Maintenance', 'Insurance', 'Taxes', 'Mortgage interest', 'Utilities', 'Management', 'Supplies', 'Travel', 'Legal & professional', 'Advertising', 'Other'];
  const METHODS = ['Transfer', 'Check', 'Cash', 'Card', 'App', 'Other'];
  const PRIORITY = ['Low', 'Normal', 'High', 'Urgent'];
  const STATUS = ['Open', 'Scheduled', 'Done'];
  const txt = v => (v == null ? '' : String(v));
  const r2 = n => Math.round(n * 100) / 100;
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);

  const prop = o => Object.assign({ id: P.uid(), name: '', address: '', mortgage: '', taxes: '', insurance: '', notes: '' }, o || {});
  const unit = o => Object.assign({ id: P.uid(), prop: '', name: '', beds: '', baths: '', rent: '', deposit: '' }, o || {});
  const tenant = o => Object.assign({ id: P.uid(), unit: '', name: '', phone: '', email: '', start: '', end: '', deposit: '', notes: '' }, o || {});
  const expense = o => Object.assign({ id: P.uid(), date: D.today(), prop: '', cat: 'Repairs', amount: '', note: '' }, o || {});
  const job = o => Object.assign({ id: P.uid(), unit: '', issue: '', reported: D.today(), priority: 'Normal', vendor: '', cost: '', status: 'Open' }, o || {});

  /* ---------- months ---------- */
  const ymOf = iso => iso.slice(0, 7);
  const ymAdd = (ym, n) => { const d = new Date(+ym.slice(0, 4), +ym.slice(5, 7) - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const monthEnd = ym => `${ym}-${String(new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate()).padStart(2, '0')}`;
  const monthLabel = ym => D.fmt(`${ym}-01`, { month: 'long', year: 'numeric' });
  const thisYm = () => ymOf(D.today());

  function blank() {
    return { settings: { dueDay: '1', grace: '5', lateFee: '50' }, props: [], units: [], tenants: [], rent: {}, expenses: [], maint: [], notes: '' };
  }
  function sample() {
    const t = D.today(), now = thisYm();
    const duplex = prop({ name: 'Maple Street Duplex', address: '418 Maple St, Columbus, OH 43215', mortgage: '1180', taxes: '3200', insurance: '1380' });
    const house = prop({ name: 'Birch Lane House', address: '27 Birch Ln, Westerville, OH 43081', mortgage: '1240', taxes: '2900', insurance: '1450' });
    const a = unit({ prop: duplex.id, name: 'Unit A', beds: '2', baths: '1', rent: '1450', deposit: '1450' });
    const b = unit({ prop: duplex.id, name: 'Unit B', beds: '2', baths: '1', rent: '1400', deposit: '1400' });
    const c = unit({ prop: house.id, name: 'Main house', beds: '3', baths: '2', rent: '2100', deposit: '2100' });
    const tenants = [
      tenant({ unit: a.id, name: 'Maria Lopez', phone: '(614) 555-0142', email: 'maria.lopez@example.com', start: D.add(t, -305), end: D.add(t, 60), deposit: '1450', notes: 'Asked about renewing — wants a 2-year lease.' }),
      tenant({ unit: b.id, name: 'James Carter', phone: '(614) 555-0187', email: 'jcarter@example.com', start: D.add(t, -500), end: D.add(t, 230), deposit: '1400', notes: 'Pays by check. Has a cat (pet deposit included).' }),
      tenant({ unit: c.id, name: 'The Nguyen family', phone: '(614) 555-0133', email: 'nguyen.home@example.com', start: D.add(t, -700), end: D.add(t, 320), deposit: '2100', notes: 'Mow the lawn themselves; we do gutters.' })];
    const rent = {};
    for (let n = -9; n <= 0; n++) {
      const ym = ymAdd(now, n), m = {};
      [[a, 'Transfer', 1], [b, 'Check', 3], [c, 'Transfer', 2]].forEach(([x, how, day]) => {
        if (n === 0 && x === b) return;                       // this month: Unit B has not paid yet
        const late = n === -3 && x === b;                      // one late payment, with a late fee
        const date = `${ym}-${String(late ? 12 : day).padStart(2, '0')}`;
        if (n === 0 && date > t) return;
        m[x.id] = { paid: x.rent, date, method: how, fee: late ? '50' : '' };
      });
      rent[ym] = m;
    }
    const y = t.slice(0, 4), inYear = d => (d.slice(0, 4) === y ? d : `${y}-01-15`);
    const e = (days, p, cat, amount, note) => expense({ date: inYear(D.add(t, -days)), prop: p.id, cat, amount: String(amount), note });
    return {
      settings: { dueDay: '1', grace: '5', lateFee: '50' },
      props: [duplex, house], units: [a, b, c], tenants, rent,
      expenses: [e(150, duplex, 'Repairs', 285, 'Plumber — kitchen faucet, Unit A'), e(120, house, 'Maintenance', 120, 'Gutter cleaning'),
        e(200, duplex, 'Taxes', 1600, 'Property tax, first half'), e(40, duplex, 'Taxes', 1600, 'Property tax, second half'),
        e(180, house, 'Insurance', 1450, 'Landlord policy, annual'), e(170, duplex, 'Insurance', 1380, 'Landlord policy, annual'),
        e(90, duplex, 'Utilities', 96, 'Water + sewer, shared meter'), e(60, duplex, 'Utilities', 102, 'Water + sewer, shared meter'), e(30, duplex, 'Utilities', 94, 'Water + sewer, shared meter'),
        e(75, house, 'Supplies', 64, 'Smoke detectors + batteries'), e(25, house, 'Legal & professional', 250, 'Lease review'),
        e(14, duplex, 'Mortgage interest', 610, 'Interest part of this month’s payment'), e(14, house, 'Mortgage interest', 655, 'Interest part of this month’s payment'),
        e(8, duplex, 'Repairs', 140, 'Handyman — Unit B closet door')],
      maint: [job({ unit: a.id, issue: 'Leaking kitchen faucet', reported: D.add(t, -152), priority: 'High', vendor: 'Ace Plumbing', cost: '285', status: 'Done' }),
        job({ unit: b.id, issue: 'Smoke detector chirping in hallway', reported: D.add(t, -2), priority: 'Urgent', vendor: '', cost: '', status: 'Open' }),
        job({ unit: c.id, issue: 'Gutters before winter', reported: D.add(t, -10), priority: 'Normal', vendor: 'Clean Sweep Gutters', cost: '140', status: 'Scheduled' }),
        job({ unit: c.id, issue: 'Garage door sticks halfway', reported: D.add(t, -6), priority: 'Low', vendor: '', cost: '', status: 'Open' })],
      notes: 'Raise rent 3% at renewals. Get two quotes for anything over $500.'
    };
  }
  function normalize(s) {
    const st = s.settings && typeof s.settings === 'object' ? s.settings : {};
    s.settings = { dueDay: String(Math.min(28, Math.max(1, Math.round(P.num(st.dueDay)) || 1))), grace: String(Math.max(0, Math.round(P.num(st.grace)))), lateFee: txt(st.lateFee) };
    s.props = arr(s.props, x => prop({ id: txt(x.id) || P.uid(), name: txt(x.name), address: txt(x.address), mortgage: txt(x.mortgage), taxes: txt(x.taxes), insurance: txt(x.insurance), notes: txt(x.notes) }));
    s.units = arr(s.units, x => unit({ id: txt(x.id) || P.uid(), prop: txt(x.prop), name: txt(x.name), beds: txt(x.beds), baths: txt(x.baths), rent: txt(x.rent), deposit: txt(x.deposit) }));
    s.tenants = arr(s.tenants, x => tenant({ id: txt(x.id) || P.uid(), unit: txt(x.unit), name: txt(x.name), phone: txt(x.phone), email: txt(x.email), start: D.parse(x.start) ? x.start : '', end: D.parse(x.end) ? x.end : '', deposit: txt(x.deposit), notes: txt(x.notes) }));
    const rent = s.rent && typeof s.rent === 'object' ? s.rent : {};
    s.rent = Object.fromEntries(Object.keys(rent).filter(k => /^\d{4}-\d\d$/.test(k) && rent[k] && typeof rent[k] === 'object').map(k => [k, Object.fromEntries(Object.keys(rent[k]).filter(id => rent[k][id] && typeof rent[k][id] === 'object')
      .map(id => { const p = rent[k][id]; return [id, { paid: txt(p.paid), date: D.parse(p.date) ? p.date : '', method: METHODS.includes(p.method) ? p.method : 'Transfer', fee: txt(p.fee) }]; }))]));
    s.expenses = arr(s.expenses, x => expense({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), prop: txt(x.prop), cat: CATS.includes(x.cat) ? x.cat : 'Other', amount: txt(x.amount), note: txt(x.note) }));
    s.maint = arr(s.maint, x => job({ id: txt(x.id) || P.uid(), unit: txt(x.unit), issue: txt(x.issue), reported: D.parse(x.reported) ? x.reported : '', priority: PRIORITY.includes(x.priority) ? x.priority : 'Normal', vendor: txt(x.vendor), cost: txt(x.cost), status: STATUS.includes(x.status) ? x.status : 'Open' }));
    s.notes = txt(s.notes);
    s.ui = s.ui || {};
    if (!/^\d{4}-\d\d$/.test(s.ui.month || '')) s.ui.month = thisYm();
    if (!['open', 'done', 'all'].includes(s.ui.mf)) s.ui.mf = 'open';
    if (typeof s.ui.ep !== 'string') s.ui.ep = '';
    s.ui.draft = Object.assign({ date: '', prop: '', cat: 'Repairs', amount: '', note: '' }, s.ui.draft || {});
    return s;
  }

  /* ---------- math ---------- */
  const unitName = (s, id) => { const x = s.units.find(v => v.id === id); if (!x) return 'Unknown unit'; const p = s.props.find(v => v.id === x.prop); return [p && p.name, x.name].filter(Boolean).join(' · ') || 'Unnamed unit'; };
  const propName = (s, id) => (s.props.find(v => v.id === id) || {}).name || 'No property';
  const unitOpts = s => s.units.map(x => [x.id, unitName(s, x)]);
  const propOpts = s => s.props.map(x => [x.id, x.name || 'Unnamed property']);
  /* the tenant whose lease covers any part of the month (latest start wins) */
  function tenantFor(s, unitId, ym) {
    const a = `${ym}-01`, b = monthEnd(ym);
    return s.tenants.filter(x => x.unit === unitId && P.has(x.name) && (!x.start || x.start <= b) && (!x.end || x.end >= a)).sort((x, y) => (x.start < y.start ? 1 : -1))[0] || null;
  }
  const activeToday = (s, unitId) => { const t = D.today(); return s.tenants.some(x => x.unit === unitId && P.has(x.name) && (!x.start || x.start <= t) && (!x.end || x.end >= t)); };
  const pay = (s, ym, id) => (s.rent[ym] && s.rent[ym][id]) || { paid: '', date: '', method: 'Transfer', fee: '' };
  const dueDate = (s, ym) => `${ym}-${String(s.settings.dueDay).padStart(2, '0')}`;
  function roll(s, ym) {
    const t = D.today(), lateAfter = D.add(dueDate(s, ym), +s.settings.grace);
    return s.units.map(x => {
      const tn = tenantFor(s, x.id, ym), p = pay(s, ym, x.id), due = tn ? P.num(x.rent) : 0, paid = P.num(p.paid), fee = P.num(p.fee);
      const late = !!tn && due > 0 && paid < due && t > lateAfter;
      const status = !tn ? 'Vacant' : paid >= due && due > 0 ? 'Paid' : late ? 'Late' : paid > 0 ? 'Partial' : 'Due';
      return { unit: x, tenant: tn, p, due, paid, fee, late, status };
    });
  }
  function month(s, ym) {
    const r = roll(s, ym), exp = r2(s.expenses.filter(x => ymOf(x.date) === ym).reduce((a, x) => a + P.num(x.amount), 0));
    const due = r2(r.reduce((a, x) => a + x.due, 0)), got = r2(r.reduce((a, x) => a + Math.min(x.paid, x.due || x.paid) + x.fee, 0));
    const lateRows = r.filter(x => x.late);
    return { rows: r, due, got, exp, net: r2(got - exp), late: lateRows.length, lateAmt: r2(lateRows.reduce((a, x) => a + x.due - x.paid, 0)) };
  }
  function ytd(s) {
    const now = thisYm(), y = now.slice(0, 4);
    let got = 0, exp = 0;
    for (let ym = `${y}-01`; ym <= now; ym = ymAdd(ym, 1)) { const m = month(s, ym); got += m.got; exp += m.exp; }
    return { got: r2(got), exp: r2(exp), net: r2(got - exp) };
  }
  const occupancy = s => { const n = s.units.length, on = s.units.filter(x => activeToday(s, x.id)).length; return { n, on, pct: n ? on / n * 100 : 0 }; };
  const endingSoon = s => { const t = D.today(), lim = D.add(t, 90); return s.tenants.filter(x => P.has(x.name) && x.end && x.end >= t && x.end <= lim).sort((a, b) => (a.end < b.end ? -1 : 1)); };
  const openJobs = s => s.maint.filter(x => P.has(x.issue) && x.status !== 'Done');
  /* one year per property: rent in, expenses by category */
  function yearByProp(s, y) {
    const now = thisYm(), last = y === now.slice(0, 4) ? now : `${y}-12`;
    return s.props.map(p => {
      const ids = new Set(s.units.filter(x => x.prop === p.id).map(x => x.id));
      let income = 0;
      for (let ym = `${y}-01`; ym <= last; ym = ymAdd(ym, 1)) roll(s, ym).filter(x => ids.has(x.unit.id)).forEach(x => { income += Math.min(x.paid, x.due || x.paid) + x.fee; });
      const cats = Object.fromEntries(CATS.map(c => [c, r2(s.expenses.filter(x => x.prop === p.id && x.cat === c && x.date.startsWith(y)).reduce((a, x) => a + P.num(x.amount), 0))]));
      const exp = r2(Object.values(cats).reduce((a, v) => a + v, 0));
      return { p, income: r2(income), cats, exp, net: r2(income - exp) };
    });
  }
  const PILL = { Paid: 'good', Late: 'bad', Partial: 'warn', Due: '', Vacant: '' };

  /* shared actions */
  const ACTIONS = {
    payFull(ctx, d) {
      const s = ctx.state, ym = d.ym || thisYm(), x = s.units.find(v => v.id === d.unit); if (!x) return false;
      s.rent[ym] = s.rent[ym] || {};
      const p = Object.assign({ paid: '', date: '', method: 'Transfer', fee: '' }, s.rent[ym][x.id]);
      p.paid = x.rent; if (!p.date) p.date = ym === thisYm() ? D.today() : dueDate(s, ym);
      s.rent[ym][x.id] = p; ctx.toast(`${unitName(s, x.id)}: paid in full`);
    },
    month(ctx, d) { const s = ctx.state; s.ui.month = +d.n === 0 ? thisYm() : ymAdd(s.ui.month, +d.n); }
  };
  const monthNav = s => `<div class="rp-nav" role="group" aria-label="Choose a month">${u.iconBtn('prev', 'Previous month', 'month', { n: -1 })}<span class="rp-month y-num">${esc(monthLabel(s.ui.month))}</span>${u.iconBtn('next', 'Next month', 'month', { n: 1 })}${s.ui.month === thisYm() ? '' : u.btn('This month', { sm: true, act: 'month', data: { n: 0 } })}</div>`;

  /* ---------- overview ---------- */
  const overview = {
    id: 'overview', label: 'Overview', icon: 'home',
    render(ctx) {
      const s = ctx.state, ym = thisYm(), m = month(s, ym), soon = endingSoon(s), jobs = openJobs(s), t = D.today();
      return `${u.head({ eyebrow: monthLabel(ym), title: '<span data-slot="title"></span>', lede: 'This month’s rent, what’s late, leases ending soon and open repairs — for every door you own.' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Rent this month', m.rows.length ? `<ul class="rp-roll">${m.rows.filter(x => x.tenant).map(x => `<li class="${x.late ? 'is-late' : ''}"><span class="rp-roll-main"><b>${esc(unitName(s, x.unit.id))}</b><span class="pl-muted">${esc(x.tenant.name)}</span></span>
            <span class="y-num rp-amt">${esc(ctx.money(x.paid, { cents: false }))} <small>of ${esc(ctx.money(x.due, { cents: false }))}</small></span>${u.pill(x.status, PILL[x.status])}
            ${x.status === 'Paid' ? '<span></span>' : u.btn('Paid in full', { sm: true, icon: 'check', act: 'payFull', data: { unit: x.unit.id, ym } })}</li>`).join('')}</ul>`
          : u.empty('home', 'No units yet', 'Add a property and its units first.', u.btn('Add a property', { kind: 'world', icon: 'plus', act: 'go', data: { page: 'properties' } })), { icon: 'money', cls: 'pl-7', actions: u.btn('Rent roll', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'rent' } }) })}
        ${u.panel('Leases ending soon', soon.length ? `<ul class="rp-list">${soon.map(x => `<li><span><b>${esc(x.name)}</b><span class="pl-muted">${esc(unitName(s, x.unit))}</span></span>${u.pill(`${D.short(x.end)} · ${P.plural(D.diff(t, x.end), 'day')}`, D.diff(t, x.end) <= 30 ? 'bad' : 'warn')}</li>`).join('')}</ul>` : '<p class="pl-muted">No lease ends in the next 90 days.</p>', { icon: 'calendar', cls: 'pl-5' })}
        ${u.panel('Open maintenance', jobs.length ? `<ul class="rp-list">${jobs.map(x => `<li><span><b>${esc(x.issue)}</b><span class="pl-muted">${esc(unitName(s, x.unit))}${x.vendor ? ` · ${esc(x.vendor)}` : ''}</span></span>${u.pill(x.priority, x.priority === 'Urgent' || x.priority === 'High' ? 'bad' : '')}</li>`).join('')}</ul>` : '<p class="pl-muted">Nothing open. Nice.</p>', { icon: 'warn', cls: 'pl-5', actions: u.btn('Maintenance', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'maintenance' } }) })}
        ${u.panel(`This year by property`, '<div data-slot="years"></div>', { icon: 'chart', cls: 'pl-7' })}
      </div>
      ${u.notes('notes', s.notes, { rows: 3, title: 'Notes', ph: 'Rules for yourself, renewal plans, vendors you trust…' })}`;
    },
    slots: {
      title(ctx) { const m = month(ctx.state, thisYm()); return m.due ? `<em>${esc(ctx.money(m.got, { cents: false }))}</em> of ${esc(ctx.money(m.due, { cents: false }))} collected` : 'Your <em>rentals</em>'; },
      kpis(ctx) {
        const s = ctx.state, m = month(s, thisYm()), y = ytd(s), o = occupancy(s);
        return u.kpis([
          ['Rent due', ctx.money(m.due, { cents: false }), 'y-kpi--world', `${P.plural(m.rows.filter(x => x.tenant).length, 'unit')} this month`],
          ['Collected', ctx.money(m.got, { cents: false }), m.got >= m.due && m.due ? 'is-good' : '', m.due ? `${Math.round(m.got / m.due * 100)}% of rent due` : ''],
          ['Late', m.late ? ctx.money(m.lateAmt, { cents: false }) : '0', m.late ? 'y-kpi--accent' : '', m.late ? P.plural(m.late, 'unit') : `after ${s.settings.grace} grace days`],
          ['Net this month', ctx.money(m.net, { cents: false }), m.net < 0 ? 'y-kpi--accent' : '', 'rent in − costs logged'],
          ['Net this year', ctx.money(y.net, { cents: false }), y.net < 0 ? 'y-kpi--accent' : '', `${ctx.money(y.got, { cents: false })} in · ${ctx.money(y.exp, { cents: false })} out`],
          ['Occupancy', `${Math.round(o.pct)}<small>%</small>`, o.pct === 100 ? 'is-good' : '', `${o.on} of ${P.plural(o.n, 'unit')} let`]
        ]);
      },
      years(ctx) {
        const s = ctx.state, list = yearByProp(s, D.today().slice(0, 4));
        if (!list.length) return '<p class="pl-muted">Add a property to see its year.</p>';
        return `<dl class="rp-years">${list.map(x => `<div><dt>${esc(x.p.name || 'Unnamed property')}</dt><dd class="y-num">${esc(ctx.money(x.income, { cents: false }))} <small>in</small></dd><dd class="y-num">${esc(ctx.money(x.exp, { cents: false }))} <small>out</small></dd><dd class="y-num ${x.net < 0 ? 'is-over' : 'rp-net'}">${esc(ctx.money(x.net, { cents: false }))}</dd></div>`).join('')}</dl>`;
      }
    },
    actions: ACTIONS
  };

  /* ---------- rent roll ---------- */
  const rentPage = {
    id: 'rent', label: 'Rent', icon: 'money',
    badge: ctx => month(ctx.state, thisYm()).late || '',
    render(ctx) {
      const s = ctx.state, ym = s.ui.month, m = month(s, ym), b = `rent.${ym}`;
      const rows = m.rows.filter(x => x.tenant || x.paid);
      return `${u.head({ eyebrow: 'Rent roll', title: `<em>${esc(ctx.money(m.got, { cents: false }))}</em> collected`, lede: `Rent is due on day ${esc(s.settings.dueDay)}; after ${esc(P.plural(+s.settings.grace, 'grace day'))} it’s marked late. Tap “Paid in full” or type a partial amount.`, meta: monthNav(s) })}
      ${u.kpis([['Due', ctx.money(m.due, { cents: false }), 'y-kpi--world'], ['Collected', ctx.money(m.got, { cents: false }), m.got >= m.due && m.due ? 'is-good' : ''], ['Late', m.late ? `${m.late} · ${ctx.money(m.lateAmt, { cents: false })}` : '0', m.late ? 'y-kpi--accent' : '']])}
      ${u.panel(monthLabel(ym), rows.length ? `<div class="rp-rows">${rows.map(x => { const id = x.unit.id; return `<article class="rp-row is-${x.status.toLowerCase()}">
          <div class="rp-row-head"><span><b>${esc(unitName(s, id))}</b><span class="pl-muted">${esc(x.tenant ? x.tenant.name : 'No tenant')} · due ${esc(ctx.money(x.due, { cents: false }))}</span></span>${u.pill(x.status, PILL[x.status])}</div>
          <div class="rp-row-fields">
            <label class="y-field"><span class="y-label">Paid</span>${u.input(`${b}.${id}.paid`, x.p.paid, { num: true, ph: '0', label: `Paid for ${unitName(s, id)}`, rerender: true })}</label>
            <label class="y-field"><span class="y-label">Date</span>${u.input(`${b}.${id}.date`, x.p.date, { type: 'date', label: `Date paid for ${unitName(s, id)}` })}</label>
            <label class="y-field"><span class="y-label">Method</span>${u.select(`${b}.${id}.method`, x.p.method, METHODS, { label: `Method for ${unitName(s, id)}` })}</label>
            <label class="y-field"><span class="y-label">Late fee paid</span>${u.input(`${b}.${id}.fee`, x.p.fee, { num: true, ph: '0', label: `Late fee for ${unitName(s, id)}`, rerender: true })}</label>
            ${x.status === 'Paid' ? '<span></span>' : u.btn('Paid in full', { sm: true, kind: 'world', icon: 'check', act: 'payFull', data: { unit: id, ym } })}
          </div></article>`; }).join('')}</div>` : u.empty('money', 'No rent due this month', 'Units need a tenant whose lease covers this month.'), { icon: 'list' })}
      ${u.panel('Rent rules', `<div class="pl-fields">${u.field('Rent due on day', 'settings.dueDay', s.settings.dueDay, { num: true, rerender: true })}${u.field('Grace days', 'settings.grace', s.settings.grace, { num: true, rerender: true })}${u.field('Usual late fee', 'settings.lateFee', s.settings.lateFee, { num: true, hint: 'Check your lease and local rules.' })}</div>`, { icon: 'edit' })}`;
    },
    actions: ACTIONS,
    sheet(ctx) {
      const s = ctx.state, ym = s.ui.month, m = month(s, ym);
      return `<h1>Rent roll · ${esc(monthLabel(ym))}</h1><p class="pl-sheet-meta">Due ${esc(ctx.money(m.due))} · collected ${esc(ctx.money(m.got))} · ${m.late} late</p>
        <table><thead><tr><th>Unit</th><th>Tenant</th><th>Due</th><th>Paid</th><th>Date</th><th>Method</th><th>Late fee</th><th>Status</th></tr></thead><tbody>${m.rows.filter(x => x.tenant || x.paid).map(x => `<tr><td>${esc(unitName(s, x.unit.id))}</td><td>${esc(x.tenant ? x.tenant.name : '')}</td><td>${esc(ctx.money(x.due))}</td><td>${esc(ctx.money(x.paid))}</td><td>${x.p.date ? esc(D.short(x.p.date)) : ''}</td><td>${esc(x.paid ? x.p.method : '')}</td><td>${x.fee ? esc(ctx.money(x.fee)) : ''}</td><td>${esc(x.status)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- properties + units ---------- */
  const properties = {
    id: 'properties', label: 'Properties', icon: 'home',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Properties', title: `<em>${s.props.length}</em> ${s.props.length === 1 ? 'property' : 'properties'}, ${P.plural(s.units.length, 'unit')}`, lede: 'Each property with its fixed costs, and the units inside it with their rent and deposit.' })}
      <div class="rp-props">${s.props.map((p, i) => { const list = s.units.map((x, k) => Object.assign({ __i: k }, x)).filter(x => x.prop === p.id);
        const rent = list.reduce((a, x) => a + P.num(x.rent), 0), fixed = P.num(p.mortgage) + P.num(p.taxes) / 12 + P.num(p.insurance) / 12;
        return `<section class="y-panel rp-prop">
          <div class="rp-prop-head">${u.input(`props.${i}.name`, p.name, { label: `Property ${i + 1} name`, ph: 'Property name', cls: 'pl-title-input' })}${u.rowTools('props', i, s.props.length, { what: 'property', label: p.name })}</div>
          <div class="pl-fields">${u.field('Address', `props.${i}.address`, p.address, { ph: 'Street, city, ZIP', cls: 'pl-wide' })}${u.field('Mortgage a month', `props.${i}.mortgage`, p.mortgage, { num: true, ph: '0', rerender: true })}${u.field('Property taxes a year', `props.${i}.taxes`, p.taxes, { num: true, ph: '0', rerender: true })}${u.field('Insurance a year', `props.${i}.insurance`, p.insurance, { num: true, ph: '0', rerender: true })}</div>
          <p class="rp-flow">${u.pill(`${ctx.money(rent, { cents: false })} rent − ${ctx.money(fixed, { cents: false })} fixed = ${ctx.money(rent - fixed, { cents: false })} a month`, rent - fixed < 0 ? 'bad' : 'good')}</p>
          <h3 class="rp-sub">Units</h3>
          ${list.length ? u.table('units', list, [
            { k: 'name', label: 'Unit', title: true, w: '1.2fr', ph: 'Unit A' },
            { k: 'beds', label: 'Beds', num: true, w: '70px', ph: '0' }, { k: 'baths', label: 'Baths', num: true, w: '70px', ph: '0' },
            { k: 'rent', label: 'Rent', num: true, w: '100px', ph: '0' }, { k: 'deposit', label: 'Deposit', num: true, w: '100px', ph: '0' },
            { label: 'Tenant', w: '1fr', html: x => { const tn = tenantFor(s, x.id, thisYm()); return tn ? esc(tn.name) : '<span class="pl-muted">Vacant</span>'; } }
          ], { index: x => x.__i, total: s.units.length, what: 'unit', cls: 'rp-utab' }) : '<p class="pl-muted">No units yet.</p>'}
          <div class="pl-list-foot">${u.btn('Add unit', { sm: true, icon: 'plus', act: 'addUnit', data: { prop: p.id } })}</div></section>`; }).join('')}</div>
      ${s.props.length ? '' : u.empty('home', 'No properties yet', 'Add your first property, then its units.')}
      <div class="pl-list-foot">${u.add('Add property', 'props', { kind: 'world' })}</div>`;
    },
    actions: { addUnit(ctx, d) { const s = ctx.state; s.units.push(unit({ prop: d.prop })); ctx.focus(`[data-bind="units.${s.units.length - 1}.name"]`); } }
  };

  /* ---------- tenants ---------- */
  const tenants = {
    id: 'tenants', label: 'Tenants', icon: 'user',
    badge: ctx => endingSoon(ctx.state).length || '',
    render(ctx) {
      const s = ctx.state, t = D.today(), soon = new Set(endingSoon(s).map(x => x.id));
      return `${u.head({ eyebrow: 'Tenants & leases', title: `<em>${s.tenants.filter(x => P.has(x.name)).length}</em> tenants`, lede: 'Who lives where, how to reach them, the lease dates and the deposit you hold.' })}
      ${u.records('tenants', s.tenants, {
        what: 'Tenant', titlePh: 'Tenant name', cls: 'rp-tenants', add: 'Add tenant', addKind: 'world',
        sub: x => `${esc(unitName(s, x.unit))}${x.end ? ` · lease ends ${esc(D.short(x.end))}` : ''}${soon.has(x.id) ? ` ${u.pill(`ends in ${P.plural(D.diff(t, x.end), 'day')}`, 'warn')}` : x.end && x.end < t ? ` ${u.pill('lease ended', 'bad')}` : ''}`,
        fields: [{ k: 'unit', label: 'Unit', options: unitOpts(s), blank: 'Choose…', rerender: true, wide: true }, { k: 'phone', label: 'Phone', ph: '(555) 555-0100' }, { k: 'email', label: 'Email', ph: 'name@example.com' },
          { k: 'start', label: 'Lease start', type: 'date', rerender: true }, { k: 'end', label: 'Lease end', type: 'date', rerender: true }, { k: 'deposit', label: 'Deposit held', num: true, ph: '0' },
          { k: 'notes', label: 'Notes', type: 'textarea', wide: true, ph: 'Pets, parking, renewal talk' }],
        empty: u.empty('user', 'No tenants yet', 'Add a tenant and pick their unit — rent then shows up on the rent roll.')
      })}`;
    }
  };

  /* ---------- expenses ---------- */
  const expenses = {
    id: 'expenses', label: 'Expenses', icon: 'chart',
    render(ctx) {
      const s = ctx.state, d = s.ui.draft, y = D.today().slice(0, 4), f = s.ui.ep;
      const rows = s.expenses.map((x, i) => Object.assign({ __i: i }, x)).filter(x => !f || x.prop === f).sort((a, b) => (a.date < b.date ? 1 : -1));
      return `${u.head({ eyebrow: 'Expenses', title: '<span data-slot="title"></span>', lede: 'Log every cost by property and category. A record-keeping aid for tax time — not tax advice; ask your tax professional what you can deduct.' })}
      ${u.panel('Log an expense', `<div class="rp-add">${u.input('ui.draft.date', d.date || D.today(), { type: 'date', label: 'Date' })}${u.select('ui.draft.prop', d.prop || (s.props[0] || {}).id || '', propOpts(s), { label: 'Property', blank: 'Property…' })}${u.select('ui.draft.cat', d.cat, CATS, { label: 'Category' })}${u.input('ui.draft.amount', d.amount, { num: true, ph: 'Amount', label: 'Amount' })}${u.input('ui.draft.note', d.note, { ph: 'What for (optional)', label: 'Note' })}${u.btn('Add', { kind: 'world', icon: 'plus', act: 'addExpense' })}</div>`, { icon: 'plus' })}
      ${u.panel(`${y} by category`, '<div data-slot="summary"></div>', { icon: 'chart' })}
      ${u.panel('All expenses', `<div class="rp-chips">${u.chips('ui.ep', f, [['', 'All properties', s.expenses.length], ...s.props.map(p => [p.id, p.name || 'Unnamed', s.expenses.filter(x => x.prop === p.id).length])], 'Filter by property')}</div>
        ${rows.length ? u.table('expenses', rows, [
          { k: 'date', label: 'Date', type: 'date', w: '150px', rerender: true },
          { k: 'prop', label: 'Property', type: 'select', options: propOpts(s), blank: '—', w: '1fr', rerender: true },
          { k: 'cat', label: 'Category', type: 'select', options: CATS, w: '200px', rerender: true },
          { k: 'amount', label: 'Amount', num: true, w: '100px', ph: '0', rerender: true },
          { k: 'note', label: 'Note', title: true, w: '1.2fr', ph: 'What for' }
        ], { index: x => x.__i, total: s.expenses.length, what: 'expense', cls: 'rp-etab' }) : '<p class="pl-muted">No expenses logged.</p>'}`, { icon: 'list' })}`;
    },
    slots: {
      title(ctx) { const s = ctx.state, y = D.today().slice(0, 4), n = r2(s.expenses.filter(x => x.date.startsWith(y)).reduce((a, x) => a + P.num(x.amount), 0)); return `<em>${esc(ctx.money(n, { cents: false }))}</em> spent in ${y}`; },
      summary(ctx) {
        const s = ctx.state, list = yearByProp(s, D.today().slice(0, 4)), used = CATS.filter(c => list.some(x => x.cats[c]));
        if (!list.length) return '<p class="pl-muted">Add a property first.</p>';
        return `<div class="rp-sum-wrap"><table class="rp-sum"><thead><tr><th>Category</th>${list.map(x => `<th>${esc(x.p.name || 'Unnamed')}</th>`).join('')}<th>Total</th></tr></thead><tbody>
          <tr class="rp-sum-in"><td>Rent collected</td>${list.map(x => `<td class="y-num">${esc(ctx.money(x.income, { cents: false }))}</td>`).join('')}<td class="y-num">${esc(ctx.money(list.reduce((a, x) => a + x.income, 0), { cents: false }))}</td></tr>
          ${used.map(c => `<tr data-cat="${esc(c)}"><td>${esc(c)}</td>${list.map(x => `<td class="y-num">${x.cats[c] ? esc(ctx.money(x.cats[c], { cents: false })) : '—'}</td>`).join('')}<td class="y-num">${esc(ctx.money(list.reduce((a, x) => a + x.cats[c], 0), { cents: false }))}</td></tr>`).join('')}
          <tr class="rp-sum-net"><td>Net</td>${list.map(x => `<td class="y-num ${x.net < 0 ? 'is-over' : ''}">${esc(ctx.money(x.net, { cents: false }))}</td>`).join('')}<td class="y-num">${esc(ctx.money(list.reduce((a, x) => a + x.net, 0), { cents: false }))}</td></tr></tbody></table></div>`;
      }
    },
    actions: {
      addExpense(ctx) {
        const s = ctx.state, d = s.ui.draft, amt = P.num(d.amount);
        if (!(amt > 0)) { ctx.toast('Type an amount first'); ctx.focus('[data-bind="ui.draft.amount"]'); return false; }
        s.expenses.push(expense({ date: d.date || D.today(), prop: d.prop || (s.props[0] || {}).id || '', cat: d.cat || 'Other', amount: String(r2(amt)), note: txt(d.note) }));
        s.ui.draft = { date: d.date, prop: d.prop, cat: d.cat, amount: '', note: '' };
        ctx.toast(`${ctx.money(amt)} · ${d.cat}`); ctx.focus('[data-bind="ui.draft.amount"]');
      }
    },
    sheet(ctx) {
      const s = ctx.state, y = D.today().slice(0, 4);
      return `<h1>${y} summary by property</h1><p class="pl-sheet-meta">Record-keeping aid — not tax advice.</p>${yearByProp(s, y).map(x => `<h2>${esc(x.p.name || 'Unnamed property')}</h2><table><tbody><tr><td><b>Rent collected</b></td><td>${esc(ctx.money(x.income))}</td></tr>${CATS.filter(c => x.cats[c]).map(c => `<tr><td>${esc(c)}</td><td>${esc(ctx.money(x.cats[c]))}</td></tr>`).join('')}<tr><td><b>Expenses</b></td><td><b>${esc(ctx.money(x.exp))}</b></td></tr><tr><td><b>Net</b></td><td><b>${esc(ctx.money(x.net))}</b></td></tr></tbody></table>`).join('')}`;
    }
  };
  overview.sheet = expenses.sheet;

  /* ---------- maintenance ---------- */
  const maintenance = {
    id: 'maintenance', label: 'Repairs', icon: 'warn',
    badge: ctx => openJobs(ctx.state).length || '',
    render(ctx) {
      const s = ctx.state, f = s.ui.mf, show = x => f === 'all' || (f === 'open' ? x.status !== 'Done' : x.status === 'Done');
      const rows = s.maint.map((x, i) => Object.assign({ __i: i }, x)).filter(show).sort((a, b) => (PRIORITY.indexOf(b.priority) - PRIORITY.indexOf(a.priority)) || ((a.reported || '') < (b.reported || '') ? 1 : -1));
      const spent = r2(s.maint.filter(x => x.status === 'Done').reduce((a, x) => a + P.num(x.cost), 0));
      return `${u.head({ eyebrow: 'Maintenance', title: `<em>${openJobs(s).length}</em> open ${openJobs(s).length === 1 ? 'request' : 'requests'}`, lede: 'Every repair request with its unit, priority, vendor and cost. Mark it Done when it’s fixed.' })}
      ${u.panel('', `<div class="pl-row rp-chips">${u.chips('ui.mf', f, [['open', 'Open', openJobs(s).length], ['done', 'Done', s.maint.filter(x => x.status === 'Done').length], ['all', 'All', s.maint.length]], 'Filter requests')}<span class="pl-spacer"></span>${spent ? `<span class="pl-muted">Done so far: ${esc(ctx.money(spent, { cents: false }))}</span>` : ''}</div>
        ${rows.length ? u.table('maint', rows, [
          { k: 'issue', label: 'Issue', title: true, w: '1.5fr', ph: 'What’s wrong' },
          { k: 'unit', label: 'Unit', type: 'select', options: unitOpts(s), blank: '—', w: '1fr' },
          { k: 'reported', label: 'Reported', type: 'date', w: '150px' },
          { k: 'priority', label: 'Priority', type: 'select', options: PRIORITY, w: '110px', rerender: true },
          { k: 'vendor', label: 'Vendor', w: '1fr', ph: 'Who fixes it' },
          { k: 'cost', label: 'Cost', num: true, w: '90px', ph: '0' },
          { k: 'status', label: 'Status', type: 'select', options: STATUS, w: '120px', rerender: true }
        ], { index: x => x.__i, total: s.maint.length, what: 'request', cls: 'rp-mtab', rowClass: x => (x.status === 'Done' ? 'is-done' : '') }) : `<p class="pl-muted pl-list-empty">${f === 'open' ? 'Nothing open.' : 'Nothing here.'}</p>`}
        <div class="pl-list-foot">${u.add('Add request', 'maint', { kind: 'world' })}</div>`, { icon: 'warn' })}`;
    }
  };

  P.create({
    slug: 'rental-property-app', name: 'Rental Property Tracker', world: 'estate', currency: true,
    welcome: 'Add a property and its units, then your tenants — the rent roll fills in by itself.',
    pages: [overview, rentPage, properties, tenants, expenses, maintenance],
    blank, sample, normalize,
    open(ctx) { ctx.state.ui.month = thisYm(); },
    actions: ACTIONS,
    rows: { props: () => prop(), units: () => unit(), tenants: () => tenant(), expenses: () => expense(), maint: () => job() },
    about: '<p><b>Rental Property Tracker</b> keeps a small landlord’s books in one place: a monthly rent roll with late flags and one-tap “paid in full”, properties and units with their fixed costs, tenants and lease dates, expenses by property and category with a yearly summary, and maintenance requests.</p>',
    disclaimer: 'Rental Property Tracker is a record-keeping tool, not legal, tax or financial advice. Check late fees, deposits and deductions with your lease, local rules and a tax professional.'
  });
})();
