/* Side Hustle Tracker App — this year at a glance with a tax set-aside, income & expenses, a mileage log and the tax-season document checklist.
   Yaykit planner engine, work world. Income & expenses come from Seller Toolkit's profit tracker (calc.js + seller-math.js), mileage from
   Mileage Log (mileage.js), tax documents from Tax Docs (tax.js); "This year" (set-aside and quarterly estimated payments) is new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, M = window.SellerMath, CALC = window.SBSeller, MI = window.SHMiles, TX = window.SHTax;
  const txt = v => (v == null ? '' : String(v));
  const r2 = n => Math.round(n * 100) / 100;
  /* US federal estimated-tax due dates for a tax year (the IRS moves a date that falls on a weekend or holiday to the next business day) */
  const QUARTERS = y => [['Q1', 'Jan–Mar', `${y}-04-15`], ['Q2', 'Apr–May', `${y}-06-15`], ['Q3', 'Jun–Aug', `${y}-09-15`], ['Q4', 'Sep–Dec', `${+y + 1}-01-15`]];

  function blank() { return Object.assign(CALC.blank(), TX.blank(), MI.blank(), { side: { name: '', setAside: '25' }, paid: [], notes: '' }); }
  function normalize(s) {
    CALC.normalize(s); TX.normalize(s); MI.normalize(s);
    const x = s.side && typeof s.side === 'object' ? s.side : {};
    s.side = { name: txt(x.name), setAside: txt(x.setAside) || '25' };
    s.paid = (Array.isArray(s.paid) ? s.paid : []).filter(p => p && typeof p === 'object').map(p => ({ id: txt(p.id) || P.uid(), date: txt(p.date), amount: txt(p.amount), note: txt(p.note) }));
    delete s.price; delete s.sale; delete s.margin; delete s.rate;
    return s;
  }
  function sample() {
    const t = D.today(), y = t.slice(0, 4), now = new Date(t + 'T12:00:00');
    const s = Object.assign(blank(), TX.sample(), MI.sample());
    s.side = { name: 'Weekend photography', setAside: '25' };
    // income + expenses this year, month by month up to now
    const lines = [], add = (kind, date, label, cat, amount) => { if (date <= t) lines.push({ kind, date, label, cat, amount: String(amount) }); };
    for (let m = 0; m <= now.getMonth(); m++) {
      const d = day => `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      add('income', d(8), ['Family portraits', 'Headshots', 'Mini sessions'][m % 3], 'Sessions', [380, 450, 520][m % 3]);
      if (m % 2 === 0) add('income', d(19), 'Second shooter — wedding', 'Sessions', 300);
      add('income', d(26), 'Print orders', 'Prints', [60, 85, 40][m % 3]);
      add('expense', d(3), 'Editing software', 'Software', 22);
      add('expense', d(15), m % 3 === 0 ? 'New lens filter' : 'Props + backdrops', 'Gear', m % 3 === 0 ? 89 : 35);
      if (m % 4 === 1) add('expense', d(21), 'Online gallery plan', 'Software', 48);
    }
    s.ledger = { name: 'Weekend photography', view: 'all', notes: '', lines };
    const done = QUARTERS(y).filter(q => q[2] < t);
    s.paid = done.map((q, i) => ({ id: P.uid(), date: q[2], amount: String([420, 380, 450, 400][i]), note: `${q[0]} estimated payment` }));
    const nec = s.docs.find(x => x.label === '1099-NEC (freelance / contract pay)'); if (nec) nec.from = 'Northlight Studio';
    s.household = 'Jordan';
    s.notes = 'Set aside 25% of every payment the day it lands — separate savings account.\nAsk the preparer about the home office (spare room, 120 sq ft).';
    return s;
  }

  /* ---------- the year's numbers ---------- */
  function year(s) {
    const y = D.today().slice(0, 4), lines = s.ledger.lines.filter(l => (l.date || '').startsWith(y));
    const r = M.ledger(lines, 'all');
    const miles = s.trips.filter(x => x.kind === 'business' && (x.date || '').startsWith(y)).reduce((a, x) => a + MI.dist(x), 0);
    const mileVal = r2(s.trips.filter(x => x.kind === 'business' && (x.date || '').startsWith(y)).reduce((a, x) => a + MI.value(s, x), 0));
    const profit = r2(r.income - r.expense - mileVal), pct = Math.max(0, P.num(s.side.setAside));
    const setAside = r2(Math.max(0, profit) * pct / 100), paid = r2(s.paid.filter(p => (p.date || '') >= `${y}-01-01` && (p.date || '') <= `${+y + 1}-01-31`).reduce((a, p) => a + P.num(p.amount), 0));
    return { y, r, miles, mileVal, profit, setAside, paid, left: r2(setAside - paid) };
  }

  const yearPage = {
    id: 'year', label: 'This year', icon: 'chart',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: s.side.name || 'Side hustle', title: '<span data-slot="title"></span>', lede: 'Income and expenses, the miles you drove for it, and what to set aside for tax — so April is not a surprise.' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Set aside for tax', `<div class="pl-fields">${u.field('Side hustle', 'side.name', s.side.name, { ph: 'Weekend photography' })}${u.field('Set aside % of profit', 'side.setAside', s.side.setAside, { num: true, ph: '25', rerender: true, hint: 'Many self-employed people set aside 25–30%. Ask a tax professional for your number.' })}</div><div data-slot="aside"></div>`, { icon: 'money', cls: 'pl-6' })}
        ${u.panel('Quarterly estimated payments', '<div data-slot="quarters"></div>', { icon: 'calendar', cls: 'pl-6', hint: 'US federal due dates. A date on a weekend or holiday moves to the next business day.' })}
      </div>
      ${u.panel('Payments you made', u.table('paid', s.paid, [{ k: 'date', label: 'Date', type: 'date', w: '160px' }, { k: 'amount', label: 'Amount', num: true, w: '140px', ph: '0' }, { k: 'note', label: 'Note', w: 'minmax(0,1fr)', ph: 'Q3 federal' }],
        { what: 'payment', add: 'Add payment', empty: 'Log each estimated tax payment here.' }), { icon: 'check' })}
      ${u.notes('notes', s.notes, { rows: 4, title: 'Notes', ph: 'Questions for your preparer, where receipts live…' })}`;
    },
    slots: {
      title(ctx) { const a = year(ctx.state); return a.r.income ? `<em>${esc(ctx.money(a.profit))}</em> profit in ${a.y}` : 'Track the <em>side hustle</em>'; },
      kpis(ctx) {
        const s = ctx.state, a = year(s);
        return u.kpis([['Income', esc(ctx.money(a.r.income)), 'y-kpi--world', `${a.y} so far`], ['Expenses', esc(ctx.money(a.r.expense)), '', P.plural(s.ledger.lines.filter(l => l.kind === 'expense' && (l.date || '').startsWith(a.y)).length, 'expense')],
          ['Mileage', esc(ctx.money(a.mileVal)), '', `${Math.round(a.miles).toLocaleString('en-US')} ${s.log.unit} for business`], ['Still to set aside', esc(ctx.money(Math.max(0, a.left))), a.left > 0 ? 'y-kpi--accent' : 'is-good', a.left > 0 ? `${esc(ctx.money(a.paid))} paid so far` : 'you’re covered']]);
      },
      aside(ctx) {
        const a = year(ctx.state), m = n => esc(ctx.money(n, { cents: true }));
        return `<table class="st-table"><tbody><tr><td>Income</td><td class="y-num">${m(a.r.income)}</td></tr><tr><td>Expenses</td><td class="y-num">−${m(a.r.expense)}</td></tr><tr><td>Mileage at your rate</td><td class="y-num">−${m(a.mileVal)}</td></tr>
          <tr class="st-total"><td>Profit</td><td class="y-num">${m(a.profit)}</td></tr><tr><td>Set aside at ${esc(ctx.state.side.setAside || 0)}%</td><td class="y-num">${m(a.setAside)}</td></tr><tr><td>Paid so far</td><td class="y-num">−${m(a.paid)}</td></tr>
          <tr class="st-total"><td>Still to set aside</td><td class="y-num">${m(Math.max(0, a.left))}</td></tr></tbody></table>`;
      },
      quarters(ctx) {
        const s = ctx.state, a = year(s), t = D.today(), q = QUARTERS(a.y), nx = q.find(x => x[2] >= t);
        const paidBy = d => s.paid.filter(p => p.date && p.date <= d && p.date >= `${a.y}-01-01`).reduce((x, p) => x + P.num(p.amount), 0);
        return `<ul class="sh-q">${q.map(([k, months, due]) => `<li class="${nx && nx[2] === due ? 'is-next' : due < t ? 'is-past' : ''}"><small>${k} · ${months}</small><b>${esc(D.short(due))}</b><small>${due < t ? `paid ${esc(ctx.money(paidBy(due)))} by then` : nx && nx[2] === due ? `${esc(D.rel(due))} · about ${esc(ctx.money(Math.max(0, a.left)))}` : esc(D.rel(due))}</small></li>`).join('')}</ul>`;
      }
    }
  };

  Object.assign(CALC.pages.ledger, { label: 'Money', badge: null });
  Object.assign(MI.pages.trips, { label: 'Mileage' });
  Object.assign(MI.pages.summary, { label: 'Miles by month' });
  Object.assign(TX.pages.checklist, { label: 'Tax docs' });
  Object.assign(TX.pages.prep, { label: 'Preparer' });

  P.create({
    slug: 'side-hustle-app',
    name: 'Side Hustle Tracker',
    world: 'work',
    currency: true,
    welcome: 'Log what comes in and goes out, and every drive for the hustle — the year adds itself up.',
    pages: [yearPage, CALC.pages.ledger, MI.pages.trips, MI.pages.summary, TX.pages.checklist, TX.pages.prep],
    blank, sample, normalize,
    rows: Object.assign({ paid: () => ({ id: P.uid(), date: D.today(), amount: '', note: '' }) }, CALC.rows, MI.rows, TX.rows),
    actions: Object.assign({}, CALC.actions),
    about: '<p><b>Side Hustle Tracker</b> keeps the money side of a side gig in one place: income and expenses by month, a mileage log with a rate per mile, what to set aside for tax with the quarterly estimated-payment dates, and the tax-season document checklist with a sheet for your preparer.</p>',
    disclaimer: 'Side Hustle Tracker is a record-keeping and planning tool, not tax, accounting or legal advice, and not a filing service. Set-aside amounts and due dates are estimates for US federal tax only — confirm what applies to you with the IRS, your state or a licensed tax professional.'
  });
})();
