/* Couples Budget App — two incomes, one fair split: shared bills, shared spending, settle up, joint savings goals.
   Yaykit planner engine, together world (defined in couples.css). Month navigation, bills with a due day and goal math
   follow Budget Planner (budget.js); the split rules, who-owes-whom balance and settle-up history are new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const MODES = [['equal', '50 / 50'], ['income', 'By income'], ['custom', 'Custom']];
  const txt = v => (v == null ? '' : String(v));
  const r2 = n => Math.round(n * 100) / 100;
  const list = (v, map) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(map);
  const sum = (l, f) => r2(l.reduce((a, x) => a + f(x), 0));

  /* ---------- model ---------- */
  const bill = (name, amount, due, payer, split) => ({ id: P.uid(), name: name || '', amount: txt(amount), due: txt(due), payer: payer || 'a', split: split || 'default' });
  const cat = (name, plan) => ({ id: P.uid(), name: name || '', plan: txt(plan) });
  const goal = (name, target, saved, by) => ({ id: P.uid(), name: name || '', target: txt(target), saved: txt(saved), by: by || D.add(D.today(), 180) });
  function blank() {
    return {
      people: { a: { name: '', income: '' }, b: { name: '', income: '' } }, split: { mode: 'equal', a: '' },
      bills: [], paid: {}, cats: [cat('Groceries'), cat('Eating out'), cat('Household'), cat('Date night')], spends: [], settles: [], goals: [], notes: ''
    };
  }
  function sample() {
    const t = D.today(), ym = t.slice(0, 7);
    const bills = [bill('Rent', 1850, 1, 'joint'), bill('Car insurance', 168, 5, 'a'), bill('Internet', 65, 12, 'a'), bill('Electricity & gas', 145, 18, 'b'),
      bill('Streaming', 34, 22, 'b', 'equal'), bill('Phone plan', 110, 25, 'b', 'equal')];
    const paid = { [ym]: Object.fromEntries(bills.slice(0, 4).map(b => [b.id, true])) };
    const cats = [cat('Groceries', 650), cat('Eating out', 220), cat('Household', 90), cat('Date night', 120), cat('Pets', 80)];
    const c = n => cats.find(x => x.name === n).id;
    const back = n => (D.add(t, -n).slice(0, 7) === ym ? D.add(t, -n) : t);
    const sp = (n, text, amount, payer, name, split) => ({ id: P.uid(), date: back(n), text, amount: String(amount), payer, cat: c(name), split: split || 'default' });
    return {
      people: { a: { name: 'Alex', income: '4200' }, b: { name: 'Jordan', income: '3100' } }, split: { mode: 'income', a: '60' },
      bills, paid, cats,
      spends: [sp(0, 'Weekly shop', 142.3, 'a', 'Groceries'), sp(1, 'Thai takeout', 46, 'b', 'Eating out', 'equal'), sp(2, 'Dog food + treats', 46, 'b', 'Pets'),
        sp(3, 'Farmers market', 38.5, 'joint', 'Groceries'), sp(5, 'Concert tickets', 58, 'a', 'Date night', 'equal'), sp(6, 'Weekly shop', 96.8, 'b', 'Groceries'),
        sp(8, 'Light bulbs + cleaning', 38.5, 'a', 'Household'), sp(9, 'Brunch', 52, 'a', 'Eating out', 'equal')],
      settles: [{ id: P.uid(), date: D.add(`${ym}-01`, -2), amount: '212.40', from: 'b', note: 'Venmo', items: [] }],
      goals: [goal('Emergency fund', 10000, 4200, D.add(t, 300)), goal('Japan trip', 5000, 1350, D.add(t, 240)), goal('New couch', 1500, 600, D.add(t, 120))],
      notes: 'Money date: first Sunday of the month, with coffee.\n\nEach of us keeps our fun money — no questions asked.\n\nBig buys over $200: talk first.'
    };
  }
  const who = v => (v === 'b' || v === 'joint' ? v : 'a');
  const rule = v => (['default', 'equal', 'income', 'a', 'b'].includes(v) ? v : 'default');
  function normalize(s) {
    const pp = s.people && typeof s.people === 'object' ? s.people : {}, one = x => ({ name: txt(x && x.name), income: txt(x && x.income) });
    s.people = { a: one(pp.a), b: one(pp.b) };
    const sp = s.split && typeof s.split === 'object' ? s.split : {};
    s.split = { mode: MODES.some(m => m[0] === sp.mode) ? sp.mode : 'equal', a: txt(sp.a) };
    s.bills = list(s.bills, b => ({ id: txt(b.id) || P.uid(), name: txt(b.name), amount: txt(b.amount), due: txt(b.due), payer: who(b.payer), split: rule(b.split) }));
    s.paid = Object.fromEntries(Object.keys(s.paid || {}).filter(k => /^\d{4}-\d\d$/.test(k) && s.paid[k] && typeof s.paid[k] === 'object')
      .map(k => [k, Object.fromEntries(Object.keys(s.paid[k]).filter(x => s.paid[k][x]).map(x => [x, true]))]));
    s.cats = list(s.cats, c => ({ id: txt(c.id) || P.uid(), name: txt(c.name), plan: txt(c.plan) }));
    s.spends = list(s.spends, x => ({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), text: txt(x.text), amount: txt(x.amount), payer: who(x.payer), cat: txt(x.cat), split: rule(x.split) }));
    s.settles = list(s.settles, x => ({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), amount: txt(x.amount), from: x.from === 'a' ? 'a' : 'b', note: txt(x.note), items: (Array.isArray(x.items) ? x.items : []).map(txt) }));
    s.goals = list(s.goals, g => ({ id: txt(g.id) || P.uid(), name: txt(g.name), target: txt(g.target), saved: txt(g.saved), by: D.parse(g.by) ? g.by : '' }));
    s.notes = txt(s.notes);
    s.ui.draft = Object.assign({ amount: '', text: '', payer: 'a', cat: '', split: 'default' }, s.ui.draft || {});
    return s;
  }

  /* ---------- split math ---------- */
  const nm = (s, k) => (k === 'joint' ? 'Joint account' : s.people[k].name || (k === 'a' ? 'Partner 1' : 'Partner 2'));
  const inc = (s, k) => P.num(s.people[k].income);
  /* the share partner A carries under a rule; partner B carries the rest */
  function ratio(s, r) {
    const m = !r || r === 'default' ? s.split.mode : r;
    if (m === 'a') return 1;
    if (m === 'b') return 0;
    if (m === 'income') { const a = inc(s, 'a'), b = inc(s, 'b'); return a + b > 0 ? a / (a + b) : 0.5; }
    if (m === 'custom') return P.has(s.split.a) ? Math.max(0, Math.min(100, P.num(s.split.a))) / 100 : 0.5;
    return 0.5;
  }
  const pct = r => `${Math.round(r * 100)} / ${100 - Math.round(r * 100)}`;
  const shares = (s, amount, r) => { const a = r2(amount * ratio(s, r)); return { a, b: r2(amount - a) }; };
  const ruleLabel = (s, r) => ({ default: `Usual (${pct(ratio(s))})`, equal: '50 / 50', income: 'By income', a: `All ${nm(s, 'a')}`, b: `All ${nm(s, 'b')}` })[r];
  const ruleOpts = s => ['default', 'equal', 'income', 'a', 'b'].map(r => [r, ruleLabel(s, r)]);
  const payerOpts = s => [['a', nm(s, 'a')], ['b', nm(s, 'b')], ['joint', 'Joint account']];
  function goalMonthly(g) {
    const need = P.num(g.target) - P.num(g.saved);
    if (need <= 0 || !D.parse(g.by)) return 0;
    return Math.ceil(need / Math.max(1, Math.round(D.diff(D.today(), g.by) / 30.44)));
  }
  /* what each of you puts toward shared life every month, and what is left as your own fun money */
  function plan(s) {
    const r = ratio(s), out = { a: { bills: 0 }, b: { bills: 0 } };
    s.bills.filter(b => P.num(b.amount) > 0).forEach(b => { const x = shares(s, P.num(b.amount), b.split); out.a.bills = r2(out.a.bills + x.a); out.b.bills = r2(out.b.bills + x.b); });
    const spend = sum(s.cats, c => P.num(c.plan)), goals = sum(s.goals, goalMonthly), sa = r2(spend * r), ga = r2(goals * r);
    Object.assign(out.a, { spend: sa, goals: ga }); Object.assign(out.b, { spend: r2(spend - sa), goals: r2(goals - ga) });
    ['a', 'b'].forEach(k => { const p = out[k]; p.inc = inc(s, k); p.total = r2(p.bills + p.spend + p.goals); p.fun = r2(p.inc - p.total); });
    return Object.assign(out, { r, bills: sum(s.bills, b => P.num(b.amount)), spend, goals });
  }

  /* ---------- months ---------- */
  const ymOf = iso => iso.slice(0, 7);
  const monthDays = m => new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
  const dueDate = (b, m) => `${m}-${String(Math.min(Math.max(1, Math.round(P.num(b.due)) || 1), monthDays(m))).padStart(2, '0')}`;
  const isPaid = (s, b, m) => !!(s.paid[m] && s.paid[m][b.id]);
  const monthLabel = m => D.fmt(`${m}-01`, { month: 'long', year: 'numeric' });
  const ym = s => (/^\d{4}-\d\d$/.test(s.ui.month || '') ? s.ui.month : (s.ui.month = ymOf(D.today())));
  function monthNav(s) {
    const m = ym(s), now = ymOf(D.today());
    return `<div class="cb-nav" role="group" aria-label="Choose a month">${u.iconBtn('prev', 'Previous month', 'month', { n: -1 })}<span class="cb-month y-num">${esc(monthLabel(m))}</span>${u.iconBtn('next', 'Next month', 'month', { n: 1 })}${m === now ? '' : u.btn('This month', { sm: true, act: 'month', data: { n: 0 } })}</div>`;
  }
  const monthAction = { month(ctx, d) { const s = ctx.state; if (+d.n === 0) { s.ui.month = ymOf(D.today()); return; } const x = D.parse(`${ym(s)}-15`); x.setMonth(x.getMonth() + +d.n); s.ui.month = D.iso(x).slice(0, 7); } };
  const monthSpends = (s, m) => s.spends.filter(x => ymOf(x.date) === m);
  const catName = (s, id) => { const c = s.cats.find(x => x.id === id); return c ? c.name || 'Unnamed' : 'No category'; };

  /* ---------- settle up ---------- */
  /* every shared payment since the last settle-up: ticked bills and logged spending */
  function open(s) {
    const done = new Set(s.settles.flatMap(x => x.items)), out = [];
    Object.keys(s.paid).forEach(m => Object.keys(s.paid[m]).forEach(id => {
      const b = s.bills.find(x => x.id === id);
      if (b && P.num(b.amount) > 0) out.push({ key: `bill:${m}:${id}`, date: dueDate(b, m), text: b.name || 'Bill', amount: P.num(b.amount), payer: b.payer, split: b.split, kind: 'bill' });
    }));
    s.spends.forEach(x => { if (P.num(x.amount) > 0) out.push({ key: `sp:${x.id}`, date: x.date, text: x.text || catName(s, x.cat), amount: P.num(x.amount), payer: x.payer, split: x.split, kind: 'spend' }); });
    return out.filter(x => !done.has(x.key)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }
  /* net > 0: partner B owes partner A */
  function balance(s) {
    const items = open(s);
    let paidA = 0, paidB = 0, fairA = 0, fairB = 0, net = 0;
    items.forEach(x => {
      Object.assign(x, shares(s, x.amount, x.split));
      if (x.payer === 'joint') return;   // paid from the joint account: nobody owes anybody
      if (x.payer === 'a') { paidA += x.amount; net += x.b; } else { paidB += x.amount; net -= x.a; }
      fairA += x.a; fairB += x.b;
    });
    return { items, paidA: r2(paidA), paidB: r2(paidB), fairA: r2(fairA), fairB: r2(fairB), net: r2(net) };
  }
  function transfer(ctx, x, html) {
    const s = ctx.state, m = ctx.money(Math.abs(x.net)), e = html ? v => `<b>${esc(v)}</b>` : v => v;
    if (Math.abs(x.net) < 0.005) return 'You’re even';
    return x.net > 0 ? `${e(nm(s, 'b'))} pays ${e(nm(s, 'a'))} ${e(m)}` : `${e(nm(s, 'a'))} pays ${e(nm(s, 'b'))} ${e(m)}`;
  }
  const whoChip = (s, k) => `<span class="cb-who cb-${k}">${esc(nm(s, k))}</span>`;
  const val = (k, v) => `<span class="y-num" data-k="${k}">${esc(v)}</span>`;

  /* ---------- overview ---------- */
  const overview = {
    id: 'overview', label: 'Overview', icon: 'heart',
    render(ctx) {
      const s = ctx.state, a = s.people.a, b = s.people.b;
      return `${u.head({ eyebrow: 'Couples budget', title: '<span data-slot="title"></span>', lede: 'Two incomes, one fair split. Shared bills and spending go in once; the app works out who owes whom and what each of you keeps.' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('You two', `<div class="pl-fields cb-fields">
          ${u.field('Partner 1', 'people.a.name', a.name, { ph: 'Alex' })}${u.field('Take-home a month', 'people.a.income', a.income, { num: true, ph: '4200' })}
          ${u.field('Partner 2', 'people.b.name', b.name, { ph: 'Jordan' })}${u.field('Take-home a month', 'people.b.income', b.income, { num: true, ph: '3100' })}</div>
          <p class="pl-hint">After tax. Only you two see this — it stays on this device.</p>`, { icon: 'user', cls: 'pl-5' })}
        <section class="y-panel y-panel--world cb-settle pl-7" data-slot="settle"></section>
        ${u.panel('This month', '<div data-slot="month"></div>', { icon: 'calendar', cls: 'pl-6', actions: u.btn('Bills', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'bills' } }) })}
        ${u.panel('Goals', '<div data-slot="goals"></div>', { icon: 'star', cls: 'pl-6', actions: u.btn('Goals', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'goals' } }) })}
      </div>
      ${u.notes('notes', s.notes, { rows: 5, title: 'Money notes', ph: 'Your rules: money dates, fun money, when to talk before a big buy…' })}`;
    },
    slots: {
      title(ctx) { const s = ctx.state, a = s.people.a.name, b = s.people.b.name; return a || b ? `<em>${esc(nm(s, 'a'))}</em> + <em>${esc(nm(s, 'b'))}</em>` : 'Money, <em>together</em>'; },
      kpis(ctx) {
        const s = ctx.state, x = balance(s), p = plan(s), m = ymOf(D.today()), named = s.bills.filter(b => P.num(b.amount) > 0);
        const target = sum(s.goals, g => P.num(g.target)), saved = sum(s.goals, g => P.num(g.saved));
        return u.kpis([
          ['Household income', ctx.money(inc(s, 'a') + inc(s, 'b'), { cents: false }), 'y-kpi--world', `${esc(nm(s, 'a'))} ${esc(ctx.money(inc(s, 'a'), { cents: false }))} · ${esc(nm(s, 'b'))} ${esc(ctx.money(inc(s, 'b'), { cents: false }))}`],
          ['Shared bills', ctx.money(p.bills, { cents: false }), '', named.length ? `${named.filter(b => isPaid(s, b, m)).length} of ${named.length} paid this month` : 'add them on Bills'],
          ['Settle up', ctx.money(Math.abs(x.net)), Math.abs(x.net) >= 0.005 ? 'y-kpi--accent' : 'is-good', esc(transfer(ctx, x))],
          ['Saved for goals', target ? `${Math.min(100, Math.round(saved / target * 100))}%` : '—', '', target ? `${esc(ctx.money(saved, { cents: false }))} of ${esc(ctx.money(target, { cents: false }))}` : 'set one on Goals']
        ]);
      },
      settle(ctx) {
        const s = ctx.state, x = balance(s);
        return `<h2 class="y-kicker">Settle up</h2><p class="cb-big">${transfer(ctx, x, true)}</p>
          <p class="cb-sub">${x.items.length ? `${P.plural(x.items.length, 'shared payment')} since you last settled — ${esc(nm(s, 'a'))} paid ${esc(ctx.money(x.paidA))}, ${esc(nm(s, 'b'))} paid ${esc(ctx.money(x.paidB))}.` : 'Nothing shared since you last settled.'}</p>
          <div class="y-row">${u.btn('See the details', { kind: 'secondary', icon: 'next', act: 'go', data: { page: 'settle' } })}</div>`;
      },
      month(ctx) {
        const s = ctx.state, m = ymOf(D.today()), named = s.bills.filter(b => P.num(b.amount) > 0), paid = named.filter(b => isPaid(s, b, m));
        const spent = sum(monthSpends(s, m), x => P.num(x.amount)), pl = sum(s.cats, c => P.num(c.plan));
        return `<div class="cb-bars"><div><p class="cb-bar-head"><b>Bills paid</b><span class="y-num">${paid.length} of ${named.length}</span></p>${u.meter(named.length ? paid.length / named.length * 100 : 0, 'Bills paid this month')}</div>
          <div><p class="cb-bar-head"><b>Shared spending</b><span class="y-num">${esc(ctx.money(spent, { cents: false }))}${pl ? ` of ${esc(ctx.money(pl, { cents: false }))}` : ''}</span></p>${u.meter(pl ? spent / pl * 100 : 0, 'Shared spending plan used', { over: pl && spent > pl })}</div></div>`;
      },
      goals(ctx) {
        const s = ctx.state, gs = s.goals.filter(g => P.has(g.name) || P.num(g.target));
        if (!gs.length) return u.empty('star', 'No goals yet', 'A trip, a couch, an emergency fund — save for it together.', u.btn('Add a goal', { kind: 'world', icon: 'plus', act: 'go', data: { page: 'goals' } }));
        return `<ul class="cb-glist">${gs.map(g => { const t = P.num(g.target), sv = P.num(g.saved); return `<li><span class="cb-gname">${esc(g.name || 'Goal')}</span>${u.meter(t ? sv / t * 100 : 0, `${g.name} progress`)}<span class="y-num">${t ? Math.min(100, Math.round(sv / t * 100)) : 0}%</span></li>`; }).join('')}</ul>`;
      }
    }
  };

  /* ---------- split ---------- */
  const split = {
    id: 'split', label: 'Split', icon: 'chart',
    render(ctx) {
      const s = ctx.state, m = s.split.mode;
      const why = { equal: 'Each of you pays half of every shared cost.', income: 'Each of you pays in proportion to take-home pay — the bigger earner pays more, and you both keep the same share of your income.', custom: 'Pick the share that feels fair to you both.' }[m];
      return `${u.head({ eyebrow: 'How you split', title: '<span data-slot="title"></span>', lede: 'One usual rule for every shared bill, purchase and goal. Any single bill or purchase can use a different one.' })}
      <div class="pl-grid">
        ${u.panel('Your usual split', `${u.seg('split.mode', m, MODES, 'Usual split')}<p class="pl-hint cb-why">${esc(why)}</p>
          ${m === 'custom' ? u.field(`${nm(s, 'a')}’s share, %`, 'split.a', s.split.a, { num: true, ph: '60', hint: `${nm(s, 'b')} pays the rest.` }) : ''}
          ${m === 'income' && !(inc(s, 'a') + inc(s, 'b')) ? u.banner('info', 'Add both take-home pays on the Overview to split by income.') : ''}`, { icon: 'chart', cls: 'pl-5' })}
        <div class="pl-7 cb-pair" data-slot="people"></div>
      </div>
      ${u.panel('Bill by bill', '<div data-slot="bills"></div>', { icon: 'list' })}`;
    },
    slots: {
      title(ctx) { const r = ratio(ctx.state); return `<em>${pct(r)}</em> ${{ equal: 'down the middle', income: 'by income', custom: 'your way' }[ctx.state.split.mode]}`; },
      people(ctx) {
        const s = ctx.state, p = plan(s);
        return ['a', 'b'].map(k => { const x = p[k], r = k === 'a' ? p.r : 1 - p.r;
          return `<section class="y-panel cb-person cb-${k}"><h2 class="cb-pname">${esc(nm(s, k))} <span class="pl-pill">${Math.round(r * 100)}%</span></h2>
            <dl class="cb-flow"><div><dt>Take-home</dt><dd>${val(`${k}-inc`, ctx.money(x.inc))}</dd></div>
              <div><dt>Shared bills</dt><dd>${val(`${k}-bills`, ctx.money(-x.bills))}</dd></div>
              <div><dt>Shared spending plan</dt><dd>${val(`${k}-spend`, ctx.money(-x.spend))}</dd></div>
              <div><dt>Joint goals</dt><dd>${val(`${k}-goals`, ctx.money(-x.goals))}</dd></div>
              <div class="cb-fun${x.fun < 0 ? ' is-over' : ''}"><dt>${x.fun < 0 ? 'Short by' : 'Fun money left'}</dt><dd>${val(`${k}-fun`, ctx.money(x.fun))}</dd></div></dl></section>`; }).join('');
      },
      bills(ctx) {
        const s = ctx.state, bs = s.bills.filter(b => P.num(b.amount) > 0);
        if (!bs.length) return u.empty('calendar', 'No shared bills yet', 'Add rent, utilities and subscriptions on the Bills page.', u.btn('Add bills', { kind: 'world', icon: 'plus', act: 'go', data: { page: 'bills' } }));
        return `<table class="cb-split-table"><thead><tr><th>Bill</th><th>Split</th><th class="y-num">Amount</th><th class="y-num">${esc(nm(s, 'a'))}</th><th class="y-num">${esc(nm(s, 'b'))}</th></tr></thead><tbody>
          ${bs.map(b => { const x = shares(s, P.num(b.amount), b.split); return `<tr><td>${esc(b.name || 'Bill')}</td><td>${esc(ruleLabel(s, b.split))}</td><td class="y-num">${esc(ctx.money(P.num(b.amount)))}</td><td class="y-num">${esc(ctx.money(x.a))}</td><td class="y-num">${esc(ctx.money(x.b))}</td></tr>`; }).join('')}</tbody></table>`;
      }
    }
  };

  /* ---------- bills ---------- */
  const bills = {
    id: 'bills', label: 'Bills', icon: 'calendar',
    badge: ctx => { const s = ctx.state, m = ymOf(D.today()), t = D.today(); return s.bills.filter(b => P.num(b.amount) > 0 && !isPaid(s, b, m) && P.has(b.due) && dueDate(b, m) < t).length || ''; },
    render(ctx) {
      const s = ctx.state, m = ym(s), t = D.today();
      const rows = s.bills.map((b, i) => Object.assign({ __i: i }, b)).sort((a, b) => (Math.round(P.num(a.due)) || 99) - (Math.round(P.num(b.due)) || 99));
      return `${u.head({ eyebrow: 'Shared bills', title: 'Every bill, <em>split fairly</em>', lede: 'Each bill once: who pays it and how it is split. Tick it when it is paid — it counts toward settle-up, and each month starts fresh.', meta: monthNav(s) })}
      <div data-slot="kpis"></div>
      ${u.panel(`Bills in ${monthLabel(m)}`, `${s.bills.length ? u.table('bills', rows, [
        { label: 'Paid', w: '60px', html: b => u.tick(`paid.${m}.${b.id}`, isPaid(s, b, m), `Paid: ${b.name}`, { rerender: true }) },
        { k: 'name', label: 'Bill', title: true, ph: 'Rent, internet…', w: '1.3fr' },
        { k: 'amount', label: 'Amount', num: true, w: '100px', ph: '0' },
        { k: 'due', label: 'Due day', num: true, w: '84px', ph: '1–31', rerender: true },
        { k: 'payer', label: 'Paid by', type: 'select', options: payerOpts(s), w: '1fr', rerender: true },
        { k: 'split', label: 'Split', type: 'select', options: ruleOpts(s), w: '1fr' },
        { label: 'Shares', w: '1.1fr', html: b => `<span class="cb-shares" data-slot="shares" data-arg="${esc(b.id)}"></span>` },
        { label: 'Due', w: '96px', html: b => { const d = dueDate(b, m), late = !isPaid(s, b, m) && d < t; return P.has(b.due) ? `<span class="${late ? 'is-over' : 'pl-muted'}">${esc(D.short(d))}${late ? ' · late' : ''}</span>` : ''; } }
      ], { index: r => r.__i, what: 'bill', cls: 'cb-bills', rowClass: b => (isPaid(s, b, m) ? 'is-done' : '') }) : u.empty('calendar', 'No shared bills yet', 'Add rent, utilities, insurance and subscriptions — anything you share that repeats every month.')}
        <div class="pl-list-foot">${u.add('Add bill', 'bills', { tpl: 'bill' })}</div>`, { icon: 'calendar' })}`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, m = ym(s), named = s.bills.filter(b => P.num(b.amount) > 0), p = plan(s), paid = sum(named.filter(b => isPaid(s, b, m)), b => P.num(b.amount));
        return u.kpis([['Shared bills a month', ctx.money(p.bills, { cents: false }), 'y-kpi--world', P.plural(named.length, 'bill')],
          [`${nm(s, 'a')}’s share`, ctx.money(p.a.bills), '', `${nm(s, 'b')}: ${esc(ctx.money(p.b.bills))}`],
          ['Still to pay', ctx.money(r2(p.bills - paid), { cents: false }), p.bills - paid > 0 ? 'y-kpi--accent' : 'is-good', `${esc(ctx.money(paid, { cents: false }))} paid`]]);
      },
      shares(ctx, id) { const s = ctx.state, b = s.bills.find(x => x.id === id); if (!b || !(P.num(b.amount) > 0)) return ''; const x = shares(s, P.num(b.amount), b.split); return `<span>${esc(nm(s, 'a'))} <b class="y-num">${esc(ctx.money(x.a))}</b></span><span>${esc(nm(s, 'b'))} <b class="y-num">${esc(ctx.money(x.b))}</b></span>`; }
    },
    actions: monthAction
  };

  /* ---------- spending ---------- */
  function spendForm(s) {
    const d = s.ui.draft;
    return `<div class="cb-add">${u.input('ui.draft.amount', d.amount, { label: 'Amount', ph: '0.00', num: true })}
      ${u.input('ui.draft.text', d.text, { label: 'What for', ph: 'What for' })}
      ${u.select('ui.draft.payer', d.payer, payerOpts(s), { label: 'Paid by' })}
      ${u.select('ui.draft.cat', d.cat, s.cats.map(c => [c.id, c.name || 'Unnamed']), { label: 'Category', blank: 'Category…' })}
      ${u.select('ui.draft.split', d.split, ruleOpts(s), { label: 'Split' })}
      ${u.btn('Add', { kind: 'world', icon: 'plus', act: 'addSpend' })}</div>`;
  }
  const spending = {
    id: 'spending', label: 'Spending', icon: 'money',
    render(ctx) {
      const s = ctx.state, m = ym(s), rows = s.spends.map((x, i) => Object.assign({ __i: i }, x)).filter(x => ymOf(x.date) === m);
      return `${u.head({ eyebrow: 'Shared spending', title: 'Log it, <em>split it</em>', lede: 'Groceries, dinners out, the dog — whoever pays, log it here in five seconds. It lands in the right category and in settle-up.', meta: monthNav(s) })}
      <div data-slot="kpis"></div>
      ${u.panel('Add a shared purchase', spendForm(s), { icon: 'plus', cls: 'y-panel--soft' })}
      <div class="pl-grid">
        ${u.panel(`Spending in ${monthLabel(m)}`, rows.length ? u.table('spends', rows, [
          { k: 'date', label: 'Date', type: 'date', w: '140px', rerender: true },
          { k: 'text', label: 'What', title: true, ph: 'What for', w: '1.3fr' },
          { k: 'amount', label: 'Amount', num: true, w: '96px' },
          { k: 'payer', label: 'Paid by', type: 'select', options: payerOpts(s), w: '1fr' },
          { k: 'cat', label: 'Category', type: 'select', options: s.cats.map(c => [c.id, c.name || 'Unnamed']), blank: 'None', w: '1fr' },
          { k: 'split', label: 'Split', type: 'select', options: ruleOpts(s), w: '1fr' }
        ], { index: r => r.__i, what: 'purchase', cls: 'cb-spends' }) : u.empty('money', 'Nothing logged this month', 'Add a shared purchase above.'), { icon: 'list', cls: 'pl-8' })}
        ${u.panel('Monthly plan', u.table('cats', s.cats, [
          { k: 'name', label: 'Category', title: true, ph: 'Category', w: '1.2fr' },
          { k: 'plan', label: 'Plan', num: true, w: '84px', ph: '0' },
          { label: 'Left', w: '90px', html: c => `<span class="y-num" data-slot="cleft" data-arg="${esc(c.id)}"></span>` }
        ], { what: 'category', add: 'Add category', tpl: 'cat', cls: 'cb-cats' }), { icon: 'chart', cls: 'pl-4' })}
      </div>`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, m = ym(s), list = monthSpends(s, m), spent = sum(list, x => P.num(x.amount)), pl = sum(s.cats, c => P.num(c.plan));
        const by = k => sum(list.filter(x => x.payer === k), x => P.num(x.amount));
        return `${u.kpis([['Spent together', ctx.money(spent), 'y-kpi--world', pl ? `of ${esc(ctx.money(pl, { cents: false }))} planned` : ''],
          [`${nm(s, 'a')} paid`, ctx.money(by('a')), '', ''], [`${nm(s, 'b')} paid`, ctx.money(by('b')), '', by('joint') ? `joint account ${esc(ctx.money(by('joint')))}` : ''],
          ['Left in the plan', ctx.money(r2(pl - spent)), pl - spent < 0 ? 'y-kpi--accent' : 'is-good', pl - spent < 0 ? 'over the plan' : '']])}${u.meter(pl ? spent / pl * 100 : 0, 'Plan used', { over: pl && spent > pl, cls: 'cb-meter' })}`;
      },
      cleft(ctx, id) {
        const s = ctx.state, c = s.cats.find(x => x.id === id); if (!c) return '';
        const left = r2(P.num(c.plan) - sum(monthSpends(s, ym(s)).filter(x => x.cat === id), x => P.num(x.amount)));
        return `<span class="${left < 0 ? 'is-over' : ''}">${esc(ctx.money(left))}</span>`;
      }
    },
    actions: Object.assign({
      addSpend(ctx) {
        const s = ctx.state, d = s.ui.draft, amt = P.num(d.amount);
        if (!(amt > 0)) { ctx.toast('Type an amount first'); ctx.focus('[data-bind="ui.draft.amount"]'); return false; }
        const c = s.cats.find(x => x.id === d.cat), date = ym(s) === ymOf(D.today()) ? D.today() : `${ym(s)}-01`;
        s.spends.unshift({ id: P.uid(), date, text: txt(d.text), amount: String(r2(amt)), payer: who(d.payer), cat: c ? c.id : '', split: rule(d.split) });
        s.ui.draft = { amount: '', text: '', payer: who(d.payer), cat: c ? c.id : '', split: 'default' };
        ctx.toast(`${ctx.money(amt)} · paid by ${nm(s, who(d.payer))}`); ctx.focus('[data-bind="ui.draft.amount"]');
      }
    }, monthAction)
  };

  /* ---------- settle up ---------- */
  const settle = {
    id: 'settle', label: 'Settle up', icon: 'check',
    badge: ctx => (Math.abs(balance(ctx.state).net) >= 0.005 ? '1' : ''),
    render(ctx) {
      const s = ctx.state, hist = s.settles.map((x, i) => Object.assign({ __i: i }, x));
      return `${u.head({ eyebrow: 'Settle up', title: '<span data-slot="title"></span>', lede: 'Everything either of you paid for the two of you since you last settled — and the one transfer that makes it fair.' })}
      <div class="pl-grid">
        <section class="y-panel y-panel--world cb-settle pl-5" data-slot="big"></section>
        ${u.panel('Who paid, who should have', '<div data-slot="fair"></div>', { icon: 'chart', cls: 'pl-7' })}
      </div>
      ${u.panel('Since you last settled', '<div data-slot="items"></div>', { icon: 'list' })}
      ${u.panel('Settle-up history', hist.length ? u.table('settles', hist, [
        { k: 'date', label: 'Date', type: 'date', w: '150px' },
        { label: 'Transfer', w: '1.4fr', title: true, html: x => `${esc(nm(s, x.from))} → ${esc(nm(s, x.from === 'a' ? 'b' : 'a'))} <b class="y-num">${esc(ctx.money(P.num(x.amount)))}</b>` },
        { k: 'note', label: 'Note', ph: 'Venmo, cash…', w: '1fr' }
      ], { index: r => r.__i, what: 'settle-up', cls: 'cb-hist' }) : '<p class="pl-muted">No settle-ups yet.</p>', { icon: 'calendar', hint: 'Removing a settle-up puts its payments back into the balance.' })}`;
    },
    slots: {
      title(ctx) { const x = balance(ctx.state); return Math.abs(x.net) < 0.005 ? 'You’re <em>even</em>' : `<em>${esc(ctx.money(Math.abs(x.net)))}</em> to even out`; },
      big(ctx) {
        const s = ctx.state, x = balance(s);
        return `<h2 class="y-kicker">The one transfer</h2><p class="cb-big cb-transfer" data-net="${x.net}">${transfer(ctx, x, true)}</p>
          <p class="cb-sub">${x.items.length ? `Send it however you like, then mark it settled — the balance starts again from zero.` : 'Nothing new to settle.'}</p>
          <div class="y-row">${u.btn('Mark settled', { kind: 'secondary', icon: 'check', act: 'settle', disabled: !x.items.length })}</div>`;
      },
      fair(ctx) {
        const s = ctx.state, x = balance(s);
        return `<dl class="cb-fair"><div><dt>${whoChip(s, 'a')} paid</dt><dd>${val('paid-a', ctx.money(x.paidA))}</dd><dt>fair share</dt><dd>${val('fair-a', ctx.money(x.fairA))}</dd></div>
          <div><dt>${whoChip(s, 'b')} paid</dt><dd>${val('paid-b', ctx.money(x.paidB))}</dd><dt>fair share</dt><dd>${val('fair-b', ctx.money(x.fairB))}</dd></div></dl>
          <p class="pl-hint">Payments from the joint account are already shared, so they don’t move the balance.</p>`;
      },
      items(ctx) {
        const s = ctx.state, x = balance(s);
        if (!x.items.length) return u.empty('check', 'All settled', 'Tick a bill as paid or log a shared purchase and it shows up here.');
        return `<ul class="cb-items">${x.items.map(i => `<li><span class="pl-muted">${esc(D.short(i.date))}</span><b>${esc(i.text)}</b><span>${whoChip(s, i.payer)}</span><span class="pl-muted cb-item-split">${esc(ruleLabel(s, i.split))}</span><span class="y-num">${esc(ctx.money(i.amount))}</span></li>`).join('')}</ul>`;
      }
    },
    actions: {
      settle(ctx) {
        const s = ctx.state, x = balance(s);
        if (!x.items.length) { ctx.toast('Nothing new to settle'); return false; }
        ctx.remember();
        s.settles.unshift({ id: P.uid(), date: D.today(), amount: r2(Math.abs(x.net)).toFixed(2), from: x.net >= 0 ? 'b' : 'a', note: '', items: x.items.map(i => i.key) });
        ctx.undoToast(Math.abs(x.net) < 0.005 ? 'Marked settled — you were even' : `Settled: ${transfer(ctx, x)}`);
      }
    }
  };

  /* ---------- goals ---------- */
  const goals = {
    id: 'goals', label: 'Goals', icon: 'star',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Joint goals', title: 'Save for it <em>together</em>', lede: `Set a target and a date. The app works out the monthly amount and each of your parts with your usual split (${esc(pct(ratio(s)))}).` })}
      <div class="cb-goals">${s.goals.map((g, i) => `<article class="y-panel cb-goal">
        <div class="cb-goal-head">${u.input(`goals.${i}.name`, g.name, { label: `Goal ${i + 1} name`, ph: 'Goal', cls: 'pl-title-input' })}${u.rowTools('goals', i, s.goals.length, { what: 'goal', label: g.name })}</div>
        <div class="pl-fields cb-goal-fields">${u.field('Target', `goals.${i}.target`, g.target, { num: true, ph: '1000' })}${u.field('Saved so far', `goals.${i}.saved`, g.saved, { num: true, ph: '0' })}${u.field('By', `goals.${i}.by`, g.by, { type: 'date' })}</div>
        <div data-slot="goal" data-arg="${esc(g.id)}" data-i="${i}"></div></article>`).join('') || u.empty('star', 'No goals yet', 'An emergency fund, a trip, a home — pick one to start.')}</div>
      <div class="pl-list-foot">${u.add('Add goal', 'goals', { tpl: 'goal', kind: 'world' })}</div>`;
    },
    slots: {
      goal(ctx, id) {
        const s = ctx.state, i = s.goals.findIndex(x => x.id === id), g = s.goals[i]; if (!g) return '';
        const target = P.num(g.target), saved = P.num(g.saved), p = target ? saved / target * 100 : 0, monthly = goalMonthly(g), x = shares(s, monthly);
        return `${u.meter(p, `${g.name || 'Goal'} progress`)}<p class="cb-goal-sum"><b class="y-num">${Math.min(100, Math.round(p))}%</b> · ${saved >= target && target ? 'done — well done, you two!' : `${esc(ctx.money(Math.max(0, target - saved), { cents: false }))} to go`}</p>
          ${monthly ? `<dl class="cb-goal-split"><div><dt>A month</dt><dd>${val(`g${i}-monthly`, ctx.money(monthly))}</dd></div><div><dt>${esc(nm(s, 'a'))}</dt><dd>${val(`g${i}-a`, ctx.money(x.a))}</dd></div><div><dt>${esc(nm(s, 'b'))}</dt><dd>${val(`g${i}-b`, ctx.money(x.b))}</dd></div></dl>` : ''}`;
      }
    }
  };

  /* ---------- print: one monthly summary from any page ---------- */
  function sheet(ctx) {
    const s = ctx.state, m = ym(s), p = plan(s), x = balance(s), A = nm(s, 'a'), B = nm(s, 'b'), mo = v => esc(ctx.money(v));
    const bs = s.bills.filter(b => P.num(b.amount) > 0), list = monthSpends(s, m);
    return `<h1>${esc(A)} + ${esc(B)} · ${esc(monthLabel(m))}</h1><p class="pl-sheet-meta">Usual split ${esc(pct(p.r))} (${esc(MODES.find(z => z[0] === s.split.mode)[1])}) · settle up: ${esc(transfer(ctx, x))}</p>
      <h2>Shared bills</h2><table><thead><tr><th></th><th>Bill</th><th>Paid by</th><th>Amount</th><th>${esc(A)}</th><th>${esc(B)}</th></tr></thead><tbody>${bs.map(b => { const z = shares(s, P.num(b.amount), b.split); return `<tr><td style="width:6mm"><span class="pl-box${isPaid(s, b, m) ? ' is-on' : ''}"></span></td><td><b>${esc(b.name)}</b></td><td>${esc(nm(s, b.payer))}</td><td>${mo(P.num(b.amount))}</td><td>${mo(z.a)}</td><td>${mo(z.b)}</td></tr>`; }).join('')}
        <tr><td></td><td><b>Total</b></td><td></td><td><b>${mo(p.bills)}</b></td><td><b>${mo(p.a.bills)}</b></td><td><b>${mo(p.b.bills)}</b></td></tr></tbody></table>
      <h2>Each of you, a month</h2><table><thead><tr><th></th><th>${esc(A)}</th><th>${esc(B)}</th></tr></thead><tbody>${[['Take-home', 'inc'], ['Shared bills', 'bills'], ['Shared spending plan', 'spend'], ['Joint goals', 'goals'], ['Fun money left', 'fun']].map(([l, k]) => `<tr><td><b>${l}</b></td><td>${mo(p.a[k])}</td><td>${mo(p.b[k])}</td></tr>`).join('')}</tbody></table>
      <h2>Shared spending</h2><table><tbody>${list.length ? list.map(z => `<tr><td style="width:22mm">${esc(D.short(z.date))}</td><td>${esc(z.text || catName(s, z.cat))}</td><td>${esc(catName(s, z.cat))}</td><td>${esc(nm(s, z.payer))}</td><td>${mo(P.num(z.amount))}</td></tr>`).join('') : '<tr><td>Nothing logged this month.</td></tr>'}</tbody></table>
      <h2>Settle up</h2><p><b>${esc(transfer(ctx, x))}</b> · ${esc(A)} paid ${mo(x.paidA)} (fair share ${mo(x.fairA)}), ${esc(B)} paid ${mo(x.paidB)} (fair share ${mo(x.fairB)}).</p>`;
  }
  [overview, split, bills, spending, settle, goals].forEach(pg => { pg.sheet = sheet; });

  P.create({
    slug: 'couples-budget-app', name: 'Couples Budget', world: 'together', currency: true,
    welcome: 'Type your two names and take-home pays, then pick how you split.',
    pages: [overview, split, bills, spending, settle, goals],
    blank, sample, normalize,
    open(ctx) { ctx.state.ui.month = ymOf(D.today()); },
    rows: { bill: () => bill(), cat: () => cat(), goal: () => goal(), bills: () => bill(), cats: () => cat(), goals: () => goal() },
    accepts: d => d && typeof d === 'object' && ('people' in d || 'bills' in d || 'settles' in d),
    about: '<p><b>Couples Budget</b> is a shared budget for two: both take-home pays, one fair split (50/50, by income or your own percentage), shared bills with who pays each one, a quick log of shared purchases, a settle-up that tells you the one transfer that evens things out, and joint savings goals with each partner’s part. Whatever is left is each partner’s own fun money.</p>',
    disclaimer: 'Couples Budget is a personal budgeting tool, not financial or legal advice. Goal amounts are estimates that assume the same savings every month.'
  });
})();
