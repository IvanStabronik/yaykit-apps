/* Budget Planner App — safe to spend until payday, monthly spending, bills, debt payoff, savings goals.
   Yaykit planner engine, money world. Debt and savings math: app/money-math.js (from Money Toolkit, tested there). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon, M = window.MoneyMath;
  const FREQ = [['weekly', 'Weekly'], ['biweekly', 'Every 2 weeks'], ['semimonthly', 'Twice a month'], ['monthly', 'Monthly']];
  const PER_MONTH = { weekly: 52 / 12, biweekly: 26 / 12, semimonthly: 2, monthly: 1 };
  const txt = v => (v == null ? '' : String(v));
  const r2 = n => Math.round(n * 100) / 100;
  const list = (v, map) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(map);

  /* ---------- model ---------- */
  const bill = (name, amount, due, auto) => ({ id: P.uid(), name: name || '', amount: amount == null ? '' : String(amount), due: due == null ? '' : String(due), auto: !!auto });
  const cat = (name, plan) => ({ id: P.uid(), name: name || '', plan: plan == null ? '' : String(plan) });
  function blank() {
    return {
      pay: { take: '', freq: 'biweekly', next: D.add(D.today(), 7), balance: '', buffer: '' },
      bills: [], paid: {}, cats: [cat('Groceries'), cat('Gas & transport'), cat('Eating out'), cat('Fun'), cat('Household')], spends: [],
      goals: [], debts: [], extra: '', strategy: 'snowball', notes: ''
    };
  }
  function sample() {
    const t = D.today(), ym = t.slice(0, 7), day = +t.slice(8);
    const bills = [bill('Rent', 1350, 1, true), bill('Car payment', 289, 5, true), bill('Phone', 65, 12), bill('Internet', 55, 15, true),
      bill('Electricity', 90, 20), bill('Car insurance', 118, 22, true), bill('Streaming', 23, 26, true), bill('Gym', 35, 28)];
    const paid = { [ym]: Object.fromEntries(bills.filter(b => +b.due < day).map(b => [b.id, true])) };
    const cats = [cat('Groceries', 520), cat('Gas & transport', 180), cat('Eating out', 120), cat('Fun', 100), cat('Household', 80), cat('Gifts', 60)];
    const c = n => cats.find(x => x.name === n).id;
    const back = n => (D.add(t, -n).slice(0, 7) === ym ? D.add(t, -n) : t);
    const sp = (n, name, amount, note) => ({ id: P.uid(), date: back(n), cat: c(name), amount: String(amount), note });
    const out = {
      pay: { take: '2150', freq: 'biweekly', next: D.add(t, 6), balance: '', buffer: '100' },
      bills, paid, cats,
      spends: [sp(0, 'Groceries', 64.2, 'Weekly shop'), sp(1, 'Gas & transport', 48, 'Gas'), sp(2, 'Eating out', 31.5, 'Tacos with Sam'),
        sp(4, 'Groceries', 112.75, 'Big shop + paper towels'), sp(5, 'Fun', 24, 'Movie'), sp(7, 'Household', 18.4, 'Light bulbs'),
        sp(9, 'Groceries', 58.1, 'Weekly shop'), sp(10, 'Eating out', 42, 'Pizza night'), sp(12, 'Gas & transport', 45, 'Gas')],
      goals: [{ id: P.uid(), name: 'Emergency fund', target: '3000', saved: '1150', by: D.add(t, 300) },
        { id: P.uid(), name: 'Summer trip', target: '1200', saved: '380', by: D.add(t, 220) }],
      debts: [{ id: P.uid(), name: 'Store card', balance: '800', apr: '18.9', min: '40' }, { id: P.uid(), name: 'Personal loan', balance: '3200', apr: '11.5', min: '95' },
        { id: P.uid(), name: 'Credit card', balance: '5400', apr: '22.9', min: '160' }],
      extra: '300', strategy: 'snowball',
      notes: 'Payday is every other Friday.\n\nNo delivery apps on weekdays. Fun money is for fun — no guilt.\n\nWhen the store card is gone, its $40 rolls into the personal loan.'
    };
    // the example always has $412.60 safe to spend, whatever bills fall before payday on the day you open it
    out.pay.balance = r2(safe(out).dueSum + 100 + 412.6).toFixed(2);
    return out;
  }
  function normalize(s) {
    const p = s.pay && typeof s.pay === 'object' ? s.pay : {};
    s.pay = { take: txt(p.take), freq: PER_MONTH[p.freq] ? p.freq : 'biweekly', next: D.parse(p.next) ? p.next : D.add(D.today(), 7), balance: txt(p.balance), buffer: txt(p.buffer) };
    s.bills = list(s.bills, b => ({ id: txt(b.id) || P.uid(), name: txt(b.name), amount: txt(b.amount), due: txt(b.due), auto: !!b.auto }));
    s.paid = Object.fromEntries(Object.keys(s.paid || {}).filter(k => /^\d{4}-\d\d$/.test(k) && s.paid[k] && typeof s.paid[k] === 'object')
      .map(k => [k, Object.fromEntries(Object.keys(s.paid[k]).filter(x => s.paid[k][x]).map(x => [x, true]))]));
    s.cats = list(s.cats, c => ({ id: txt(c.id) || P.uid(), name: txt(c.name), plan: txt(c.plan) }));
    s.spends = list(s.spends, x => ({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), cat: txt(x.cat), amount: txt(x.amount), note: txt(x.note) }));
    s.goals = list(s.goals, g => ({ id: txt(g.id) || P.uid(), name: txt(g.name), target: txt(g.target), saved: txt(g.saved), by: D.parse(g.by) ? g.by : '' }));
    s.debts = list(s.debts, d => ({ id: txt(d.id) || P.uid(), name: txt(d.name), balance: txt(d.balance), apr: txt(d.apr), min: txt(d.min) }));
    s.extra = txt(s.extra); s.strategy = s.strategy === 'avalanche' ? 'avalanche' : 'snowball'; s.notes = txt(s.notes);
    s.ui.draft = Object.assign({ amount: '', cat: '', note: '' }, s.ui.draft || {});
    return s;
  }

  /* ---------- math ---------- */
  const ymOf = iso => iso.slice(0, 7);
  const monthDays = ym => new Date(+ym.slice(0, 4), +ym.slice(5, 7), 0).getDate();
  const dueDate = (b, ym) => `${ym}-${String(Math.min(Math.max(1, Math.round(P.num(b.due)) || 1), monthDays(ym))).padStart(2, '0')}`;
  const nextYm = ym => D.add(`${ym}-01`, 32).slice(0, 7);
  const isPaid = (s, b, ym) => !!(s.paid[ym] && s.paid[ym][b.id]);
  function stepPay(iso, freq, dir) {
    if (freq === 'weekly') return D.add(iso, 7 * dir);
    if (freq === 'biweekly') return D.add(iso, 14 * dir);
    const d = D.parse(iso);
    if (freq === 'monthly') { d.setMonth(d.getMonth() + dir); return D.iso(d); }
    const day = d.getDate();   // twice a month: the 1st and the 15th (or what the user set as the first)
    if (dir > 0) { if (day < 15) { d.setDate(15); } else { d.setDate(1); d.setMonth(d.getMonth() + 1); } } else if (day > 1 && day <= 15) d.setDate(1); else { d.setDate(15); d.setMonth(d.getMonth() - 1); }
    return D.iso(d);
  }
  function nextPayday(s) {
    let n = s.pay.next, t = D.today(), k = 0;
    while (n <= t && k++ < 400) n = stepPay(n, s.pay.freq, 1);
    return n;
  }
  /* unpaid bills due from today up to the day before payday */
  function billsBefore(s, until) {
    const t = D.today(), out = [];
    for (let ym = ymOf(t); ym <= ymOf(until); ym = nextYm(ym)) {
      s.bills.filter(b => P.has(b.name) && P.num(b.amount) > 0).forEach(b => { const d = dueDate(b, ym); if (d >= t && d < until && !isPaid(s, b, ym)) out.push({ b, date: d, ym }); });
    }
    return out.sort((a, b) => (a.date < b.date ? -1 : 1));
  }
  function safe(s) {
    const pay = nextPayday(s), days = Math.max(1, D.diff(D.today(), pay)), due = billsBefore(s, pay);
    const dueSum = r2(due.reduce((a, x) => a + P.num(x.b.amount), 0));
    const left = r2(P.num(s.pay.balance) - dueSum - P.num(s.pay.buffer));
    return { pay, days, due, dueSum, left, perDay: r2(left / days), hasBalance: P.has(s.pay.balance) };
  }
  const income = s => r2(P.num(s.pay.take) * PER_MONTH[s.pay.freq]);
  const billsTotal = s => r2(s.bills.reduce((a, b) => a + P.num(b.amount), 0));
  const monthSpends = (s, ym) => s.spends.filter(x => ymOf(x.date) === ym);
  function catStats(s, c, ym) {
    const spent = r2(monthSpends(s, ym).filter(x => x.cat === c.id).reduce((a, x) => a + P.num(x.amount), 0)), plan = P.num(c.plan);
    return { plan, spent, left: r2(plan - spent), pct: plan > 0 ? spent / plan * 100 : spent > 0 ? 100 : 0 };
  }
  function monthMath(s, ym) {
    const plan = r2(s.cats.reduce((a, c) => a + P.num(c.plan), 0)), spent = r2(monthSpends(s, ym).reduce((a, x) => a + P.num(x.amount), 0));
    const inc = income(s), bills = billsTotal(s), goals = r2(s.goals.reduce((a, g) => a + goalMonthly(g), 0));
    return { plan, spent, left: r2(plan - spent), inc, bills, goals, free: r2(inc - bills - plan - goals) };
  }
  function goalMonthly(g) {
    const need = P.num(g.target) - P.num(g.saved);
    if (need <= 0 || !D.parse(g.by)) return 0;
    const months = Math.max(1, Math.round(D.diff(D.today(), g.by) / 30.44));
    return Math.ceil(need / months);
  }
  const monthLabel = ym => D.fmt(`${ym}-01`, { month: 'long', year: 'numeric' });
  const catName = (s, id) => { const c = s.cats.find(x => x.id === id); return c ? c.name || 'Unnamed' : 'No category'; };
  const ym = s => (/^\d{4}-\d\d$/.test(s.ui.month || '') ? s.ui.month : (s.ui.month = ymOf(D.today())));
  function monthNav(s) {
    const m = ym(s), now = ymOf(D.today());
    return `<div class="bp-nav" role="group" aria-label="Choose a month">${u.iconBtn('prev', 'Previous month', 'month', { n: -1 })}<span class="bp-month y-num">${esc(monthLabel(m))}</span>${u.iconBtn('next', 'Next month', 'month', { n: 1 })}${m === now ? '' : u.btn('This month', { sm: true, act: 'month', data: { n: 0 } })}</div>`;
  }
  const monthAction = { month(ctx, d) { const s = ctx.state; if (+d.n === 0) { s.ui.month = ymOf(D.today()); return; } const x = D.parse(`${ym(s)}-15`); x.setMonth(x.getMonth() + +d.n); s.ui.month = D.iso(x).slice(0, 7); } };

  /* ---------- pages ---------- */
  function spendForm(s) {
    const d = s.ui.draft;
    return `<div class="bp-add">${u.input('ui.draft.amount', d.amount, { label: 'Amount', ph: '0.00', num: true, cls: 'bp-add-amt' })}
      ${u.select('ui.draft.cat', d.cat, s.cats.map(c => [c.id, c.name || 'Unnamed']), { label: 'Category', blank: 'Category…' })}
      ${u.input('ui.draft.note', d.note, { label: 'Note', ph: 'What for (optional)' })}
      ${u.btn('Add spending', { kind: 'world', icon: 'plus', act: 'addSpend' })}</div>`;
  }
  const spendActions = {
    addSpend(ctx) {
      const s = ctx.state, d = s.ui.draft, amt = P.num(d.amount);
      if (!(amt > 0)) { ctx.toast('Type an amount first'); ctx.focus('[data-bind="ui.draft.amount"]'); return false; }
      const c = s.cats.find(x => x.id === d.cat) || s.cats[0];
      s.spends.unshift({ id: P.uid(), date: D.today(), cat: c ? c.id : '', amount: String(r2(amt)), note: txt(d.note) });
      s.ui.draft = { amount: '', cat: c ? c.id : '', note: '' };
      ctx.toast(`${ctx.money(amt)} · ${catName(s, c && c.id)}`); ctx.focus('[data-bind="ui.draft.amount"]');
    }
  };

  const overview = {
    id: 'overview', label: 'Safe to spend', icon: 'money',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Until payday', title: '<span data-slot="headline"></span>', lede: 'Your balance minus the bills due before payday and a small buffer. What is left is yours to spend — no math in your head.' })}
      <div class="bp-top">
        <section class="y-panel y-panel--world bp-safe" data-slot="safe"></section>
        ${u.panel('Your numbers', `<div class="pl-fields bp-fields">
          ${u.field('Money in the account now', 'pay.balance', s.pay.balance, { num: true, ph: '1240.55', hint: 'Update it when you check your bank app.' })}
          ${u.field('Next payday', 'pay.next', s.pay.next, { type: 'date' })}
          ${u.field('How often you are paid', 'pay.freq', s.pay.freq, { options: FREQ, rerender: true })}
          ${u.field('Take-home pay', 'pay.take', s.pay.take, { num: true, ph: '2150', hint: 'After tax, per paycheck.' })}
          ${u.field('Keep as a buffer', 'pay.buffer', s.pay.buffer, { num: true, ph: '100', optional: true })}</div>`, { icon: 'edit' })}
      </div>
      ${u.panel('Bills before payday', '<div data-slot="due"></div>', { icon: 'calendar', hint: 'Tick a bill when it is paid — it leaves this list and stops counting against you.' })}
      ${u.panel('Log spending', `${spendForm(s)}<div data-slot="month"></div>`, { icon: 'plus' })}
      ${u.notes('notes', s.notes, { rows: 5, title: 'Money notes', ph: 'Payday rules, what you are saving for, reminders…' })}`;
    },
    slots: {
      headline(ctx) { const x = safe(ctx.state); return x.hasBalance ? `<em>${esc(ctx.money(x.left, { cents: false }))}</em> ${x.left < 0 ? 'short' : 'safe to spend'}` : 'How much can I <em>spend</em>?'; },
      safe(ctx) {
        const s = ctx.state, x = safe(s);
        if (!x.hasBalance) return `<h2 class="y-kicker">Safe to spend</h2><p class="bp-big">—</p><p>Type the money in your account now, and your next payday.</p>`;
        return `<h2 class="y-kicker">Safe to spend until payday</h2><p class="bp-big y-num">${esc(ctx.money(x.left))}</p>
          <dl class="bp-mini"><div><dt>A day</dt><dd class="y-num">${esc(ctx.money(Math.max(0, x.perDay)))}</dd></div><div><dt>Payday</dt><dd>${esc(D.short(x.pay))} · ${x.days} ${x.days === 1 ? 'day' : 'days'}</dd></div><div><dt>Bills before it</dt><dd class="y-num">${esc(ctx.money(x.dueSum))}</dd></div></dl>
          ${x.left < 0 ? `<p class="bp-warn">${I('warn')} Bills due before payday are more than you have. Move a due date, or pause something this week.</p>` : ''}`;
      },
      due(ctx) {
        const s = ctx.state, x = safe(s);
        return x.due.length ? `<ul class="pl-checklist bp-due">${x.due.map(({ b, date, ym: m }) => `<li class="pl-ci">${u.tick(`paid.${m}.${b.id}`, false, `Paid: ${b.name}`, { rerender: true })}
            <div class="pl-ci-main"><span class="pl-ci-text">${esc(b.name)}</span><span class="pl-ci-meta">${esc(D.fmt(date))}${b.auto ? ' · autopay' : ''}</span></div><b class="y-num">${esc(ctx.money(P.num(b.amount)))}</b></li>`).join('')}</ul>`
          : u.empty('check', 'Nothing due before payday', s.bills.length ? 'Every bill before payday is paid. Nice.' : 'Add your bills on the Bills page.');
      },
      month(ctx) {
        const s = ctx.state, m = ymOf(D.today()), mm = monthMath(s, m), recent = monthSpends(s, m).slice(0, 5);
        return `${u.kpis([['Spent this month', ctx.money(mm.spent, { cents: false }), 'y-kpi--world', mm.plan ? `of ${ctx.money(mm.plan, { cents: false })} planned` : ''], ['Left in categories', ctx.money(mm.left, { cents: false }), mm.left < 0 ? 'y-kpi--accent' : 'is-good']])}
          ${recent.length ? `<ul class="bp-recent">${recent.map(x => `<li><span>${esc(D.short(x.date))}</span><b>${esc(x.note || catName(s, x.cat))}</b><span class="pl-muted">${esc(catName(s, x.cat))}</span><span class="y-num">${esc(ctx.money(P.num(x.amount)))}</span></li>`).join('')}</ul>` : ''}`;
      }
    },
    actions: spendActions
  };

  const spending = {
    id: 'spending', label: 'Spending', icon: 'chart',
    render(ctx) {
      const s = ctx.state, m = ym(s), rows = s.spends.map((x, i) => Object.assign({ __i: i }, x)).filter(x => ymOf(x.date) === m);
      return `${u.head({ eyebrow: 'Monthly budget', title: 'Give every dollar <em>a job</em>', lede: 'Plan each category once a month, log spending as it happens, and see what is left before it is gone.', meta: monthNav(s) })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Categories', u.table('cats', s.cats, [
          { k: 'name', label: 'Category', title: true, ph: 'Category', w: '1.3fr' },
          { k: 'plan', label: 'Plan', num: true, w: '100px', ph: '0' },
          { label: 'Spent', w: '100px', html: c => `<span class="y-num" data-slot="cspent" data-arg="${esc(c.id)}"></span>` },
          { label: 'Left', w: '100px', html: c => `<span class="y-num" data-slot="cleft" data-arg="${esc(c.id)}"></span>` }
        ], { what: 'category', add: 'Add category', tpl: 'cat', move: true, cls: 'bp-cats' }), { icon: 'list', cls: 'pl-7' })}
        ${u.panel('Where the money goes', '<div data-slot="plan"></div>', { icon: 'chart', cls: 'pl-5' })}
      </div>
      ${u.panel(`Spending in ${monthLabel(m)}`, `${spendForm(s)}
        ${rows.length ? u.table('spends', rows, [
          { k: 'date', label: 'Date', type: 'date', w: '150px' },
          { k: 'amount', label: 'Amount', num: true, w: '110px' },
          { k: 'cat', label: 'Category', type: 'select', options: s.cats.map(c => [c.id, c.name || 'Unnamed']), w: '1fr', rerender: true },
          { k: 'note', label: 'Note', title: true, ph: 'What for', w: '1.3fr' }
        ], { index: r => r.__i, what: 'entry', cls: 'bp-spends' }) : u.empty('chart', 'Nothing logged this month', 'Add what you spend above — it takes five seconds.')}`, { icon: 'plus' })}`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, mm = monthMath(s, ym(s));
        return `${u.kpis([['Planned', ctx.money(mm.plan, { cents: false }), 'y-kpi--world'], ['Spent', ctx.money(mm.spent), '', mm.plan ? `${Math.round(mm.spent / mm.plan * 100)}% of the plan` : ''], ['Left', ctx.money(mm.left), mm.left < 0 ? 'y-kpi--accent' : 'is-good', mm.left < 0 ? 'over the plan' : '']])}${u.meter(mm.plan ? mm.spent / mm.plan * 100 : 0, 'Plan used', { over: mm.left < 0, cls: 'bp-meter' })}`;
      },
      cspent(ctx, id) { const c = ctx.state.cats.find(x => x.id === id); return c ? esc(ctx.money(catStats(ctx.state, c, ym(ctx.state)).spent)) : ''; },
      cleft(ctx, id) { const c = ctx.state.cats.find(x => x.id === id); if (!c) return ''; const st = catStats(ctx.state, c, ym(ctx.state)); return `<span class="${st.left < 0 ? 'is-over' : ''}">${esc(ctx.money(st.left))}</span>`; },
      plan(ctx) {
        const s = ctx.state, mm = monthMath(s, ym(s));
        if (!mm.inc) return `<p class="pl-muted">Add your take-home pay on “Safe to spend” to see if the plan fits your income.</p>`;
        const row = (l, v, cls) => `<div class="${cls || ''}"><dt>${esc(l)}</dt><dd class="y-num">${esc(ctx.money(v, { cents: false }))}</dd></div>`;
        return `<dl class="bp-flow">${row('Income this month (about)', mm.inc)}${row('Bills', -mm.bills)}${row('Spending plan', -mm.plan)}${row('Savings goals', -mm.goals)}${row(mm.free < 0 ? 'Over your income' : 'Not given a job yet', mm.free, mm.free < 0 ? 'is-over' : 'is-free')}</dl>
          ${mm.free < 0 ? u.banner('warn', 'The plan is bigger than your income. Trim a category or a goal.') : Math.abs(mm.free) < 1 ? u.banner('good', 'Every dollar has a job.') : ''}`;
      }
    },
    actions: Object.assign({}, monthAction, spendActions)
  };

  const bills = {
    id: 'bills', label: 'Bills', icon: 'calendar',
    badge: ctx => { const x = safe(ctx.state); return x.due.length || ''; },
    render(ctx) {
      const s = ctx.state, m = ym(s), t = D.today();
      const rows = s.bills.map((b, i) => Object.assign({ __i: i }, b)).sort((a, b) => (Math.round(P.num(a.due)) || 99) - (Math.round(P.num(b.due)) || 99));
      return `${u.head({ eyebrow: 'Bills', title: 'Never pay a <em>late fee</em> again', lede: 'Every bill once, with the day it is due. Tick it when it is paid — each month starts fresh.', meta: monthNav(s) })}
      <div data-slot="kpis"></div>
      ${u.panel(`Bills in ${monthLabel(m)}`, `${s.bills.length ? u.table('bills', rows, [
        { label: 'Paid', w: '60px', html: b => u.tick(`paid.${m}.${b.id}`, isPaid(s, b, m), `Paid: ${b.name}`, { rerender: true }) },
        { k: 'name', label: 'Bill', title: true, ph: 'Rent, phone…', w: '1.4fr' },
        { k: 'amount', label: 'Amount', num: true, w: '110px', ph: '0' },
        { k: 'due', label: 'Due day', num: true, w: '90px', ph: '1–31', rerender: true },
        { label: 'Due', w: '120px', html: b => { const d = dueDate(b, m), late = !isPaid(s, b, m) && d < t; return P.has(b.due) ? `<span class="${late ? 'is-over' : 'pl-muted'}">${esc(D.short(d))}${late ? ' · late' : ''}</span>` : ''; } },
        { k: 'auto', label: 'Autopay', type: 'check', w: '80px' }
      ], { index: r => r.__i, what: 'bill', cls: 'bp-bills', rowClass: b => (isPaid(s, b, m) ? 'is-done' : '') }) : u.empty('calendar', 'No bills yet', 'Add rent, phone, insurance, subscriptions — anything that repeats every month.')}
        <div class="pl-list-foot">${u.add('Add bill', 'bills', { tpl: 'bill' })}</div>`, { icon: 'calendar' })}`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, m = ym(s), named = s.bills.filter(b => P.num(b.amount) > 0), paidSum = r2(named.filter(b => isPaid(s, b, m)).reduce((a, b) => a + P.num(b.amount), 0)), tot = billsTotal(s);
        return u.kpis([['Bills a month', ctx.money(tot, { cents: false }), 'y-kpi--world', P.plural(named.length, 'bill')], ['Paid', ctx.money(paidSum, { cents: false }), 'is-good'], ['Still to pay', ctx.money(r2(tot - paidSum), { cents: false }), tot - paidSum > 0 ? 'y-kpi--accent' : '']]);
      }
    },
    actions: monthAction
  };

  const debts = {
    id: 'debts', label: 'Debts', icon: 'chart',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Debt payoff', title: 'See your <em>debt-free date</em>', lede: 'List what you owe, add what you can pay on top of the minimums, and pick a method. Snowball pays the smallest first for quick wins; avalanche pays the highest interest first and costs less.' })}
      <div data-slot="result"></div>
      <div class="pl-grid">
        ${u.panel('What you owe', u.table('debts', s.debts, [
          { k: 'name', label: 'Debt', title: true, ph: 'Credit card', w: '1.3fr' },
          { k: 'balance', label: 'Balance', num: true, w: '110px', ph: '0' },
          { k: 'apr', label: 'APR %', num: true, w: '84px', ph: '0' },
          { k: 'min', label: 'Minimum', num: true, w: '100px', ph: '0' }
        ], { what: 'debt', add: 'Add debt', tpl: 'debt', cls: 'bp-debts' }), { icon: 'list', cls: 'pl-7' })}
        ${u.panel('Your plan', `${u.field('Extra each month, on top of the minimums', 'extra', s.extra, { num: true, ph: '300' })}
          <div class="y-field bp-gap"><span class="y-label">Method</span>${u.seg('strategy', s.strategy, [['snowball', 'Snowball'], ['avalanche', 'Avalanche']], 'Method')}</div>
          <div data-slot="order"></div>`, { icon: 'star', cls: 'pl-5' })}
      </div>`;
    },
    slots: {
      result(ctx) {
        const s = ctx.state, ds = s.debts.filter(d => P.num(d.balance) > 0);
        if (!ds.length) return u.empty('chart', 'No debts listed', 'Add a debt below to see when it is gone. No debts? Skip this page — that is great.');
        const r = M.debtPayoff(ds, s.extra, s.strategy), o = M.debtPayoff(ds, s.extra, s.strategy === 'snowball' ? 'avalanche' : 'snowball');
        if (!r.feasible) return u.banner('warn', esc(r.message));
        const free = D.parse(D.today()); free.setMonth(free.getMonth() + r.months);
        const diff = r2(o.totalInterest - r.totalInterest);
        return `${u.kpis([['Debt-free', esc(D.fmt(D.iso(free), { month: 'short', year: 'numeric' })), 'y-kpi--world', `${r.months} months`], ['Interest you pay', ctx.money(r.totalInterest, { cents: false }), ''], ['Every month', ctx.money(r.monthlyBudget, { cents: false }), 'is-good', 'minimums + extra']])}
          <p class="pl-hint bp-compare">${diff > 0 ? `The ${s.strategy} method saves ${esc(ctx.money(diff, { cents: false }))} in interest compared with ${s.strategy === 'snowball' ? 'avalanche' : 'snowball'}.` : diff < 0 ? `${s.strategy === 'snowball' ? 'Avalanche' : 'Snowball'} would save ${esc(ctx.money(-diff, { cents: false }))} in interest — snowball buys quicker wins.` : 'Both methods cost the same here.'}</p>`;
      },
      order(ctx) {
        const s = ctx.state, ds = s.debts.filter(d => P.num(d.balance) > 0);
        if (!ds.length) return '';
        const r = M.debtPayoff(ds, s.extra, s.strategy);
        if (!r.feasible) return '';
        return `<ol class="bp-order">${r.order.map(d => { const x = D.parse(D.today()); x.setMonth(x.getMonth() + (d.paidOff || 0)); return `<li><b>${esc(d.name)}</b><span class="pl-muted">gone ${esc(D.fmt(D.iso(x), { month: 'short', year: 'numeric' }))}</span></li>`; }).join('')}</ol>`;
      }
    }
  };

  const savings = {
    id: 'savings', label: 'Savings', icon: 'star',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Savings goals', title: 'Watch a goal <em>get closer</em>', lede: 'Set a target and a date. The app tells you how much to put aside each month; update “Saved” when you move money.' })}
      <div class="bp-goals">${s.goals.map((g, i) => `<article class="y-panel bp-goal">
        <div class="bp-goal-head">${u.input(`goals.${i}.name`, g.name, { label: `Goal ${i + 1} name`, ph: 'Goal', cls: 'pl-title-input' })}${u.rowTools('goals', i, s.goals.length, { what: 'goal', label: g.name })}</div>
        <div class="pl-fields bp-goal-fields">${u.field('Target', `goals.${i}.target`, g.target, { num: true, ph: '1000' })}${u.field('Saved so far', `goals.${i}.saved`, g.saved, { num: true, ph: '0' })}${u.field('By', `goals.${i}.by`, g.by, { type: 'date' })}</div>
        <div data-slot="goal" data-arg="${esc(g.id)}"></div></article>`).join('') || u.empty('star', 'No goals yet', 'An emergency fund is a great first one.')}</div>
      <div class="pl-list-foot">${u.add('Add goal', 'goals', { tpl: 'goal', kind: 'world' })}</div>`;
    },
    slots: {
      goal(ctx, id) {
        const g = ctx.state.goals.find(x => x.id === id); if (!g) return '';
        const target = P.num(g.target), saved = P.num(g.saved), pct = target ? saved / target * 100 : 0, monthly = goalMonthly(g);
        return `${u.meter(pct, `${g.name || 'Goal'} progress`)}<p class="bp-goal-sum"><b class="y-num">${Math.min(100, Math.round(pct))}%</b> · ${saved >= target && target ? 'done — well done!' : `${esc(ctx.money(Math.max(0, target - saved), { cents: false }))} to go`}${monthly ? ` · <b class="y-num">${esc(ctx.money(monthly, { cents: false }))}</b> a month` : ''}</p>`;
      }
    }
  };

  const SKIN = Object.assign({ slug: 'budget-planner-app', name: 'Budget Planner', world: 'money' }, window.BUDGET_SKIN);   // the Gothic edition sets its own
  P.create({
    slug: SKIN.slug, name: SKIN.name, world: SKIN.world, currency: true,
    welcome: 'Start with two numbers: the money in your account now and your next payday.',
    pages: [overview, spending, bills, debts, savings],
    blank, sample, normalize,
    open(ctx) { ctx.state.ui.month = ymOf(D.today()); },
    rows: {
      cat: () => cat(), bill: () => bill('', '', ''), debt: () => ({ id: P.uid(), name: '', balance: '', apr: '', min: '' }),
      goal: () => ({ id: P.uid(), name: '', target: '', saved: '', by: D.add(D.today(), 180) })
    },
    about: '<p><b>Budget Planner</b> answers the question you actually ask: how much can I spend until payday? It takes your balance, subtracts the bills due before payday and a small buffer, and shows what is left — per day, too. Add a monthly spending plan, a bill list you tick off, a debt payoff plan (snowball or avalanche) and savings goals.</p>',
    disclaimer: 'Budget Planner is a personal budgeting tool, not financial advice. Debt-free dates are estimates that assume the same payments and interest every month.'
  });
})();
