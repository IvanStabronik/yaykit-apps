/* Renovation Planner App — phases dated back from the target finish, budget vs actual, contractors and payments, selections to choose
   and order, and change orders. Yaykit planner engine, home world. Built on the Party / Wedding Planner code (budget module, dated
   checklist, overview); selections and change orders are new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const txt = v => (v == null ? '' : String(v));
  const r2 = n => Math.round(n * 100) / 100;
  const list = (v, map) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(map);

  /* ---------- checklist ---------- */
  const WHEN = [['plan', 'Plan & budget', 120], ['design', 'Design & quotes', 100], ['permits', 'Permits & ordering', 85], ['demo', 'Demo', 70],
    ['rough', 'Rough-in', 55], ['inspect', 'Inspections', 45], ['close', 'Walls & floors', 35], ['finish', 'Finishes & fixtures', 20], ['punch', 'Punch list', 5], ['after', 'After it’s done', -14]];
  const WHEN_NAME = Object.fromEntries(WHEN.map(w => [w[0], w[1]])), WHEN_DAYS = Object.fromEntries(WHEN.map(w => [w[0], w[2]]));
  const STARTER = {
    plan: ['Write the must-haves and nice-to-haves', 'Set the total budget + 10–15% contingency', 'Decide where you’ll live and cook during the work'],
    design: ['Get three quotes for the big jobs', 'Check licenses, insurance and reviews', 'Sign contracts with start dates and payment schedules'],
    permits: ['Apply for permits', 'Order long-lead items (cabinets, windows)', 'Book the dumpster'],
    demo: ['Clear the rooms + protect floors', 'Demo and haul-away', 'Photograph the open walls'],
    rough: ['Plumbing rough-in', 'Electrical rough-in', 'HVAC changes'],
    inspect: ['Rough-in inspections passed', 'Insulation + inspection'],
    close: ['Drywall', 'Tile + flooring', 'Prime and paint'],
    finish: ['Cabinets + countertops', 'Fixtures, lights and hardware', 'Appliances in'],
    punch: ['Walk through with the contractor', 'Write the punch list', 'Final inspection'],
    after: ['Pay the final balances', 'File warranties + manuals', 'Update the home insurance']
  };
  const task = (text, when, done) => ({ id: P.uid(), text: text || '', when: WHEN_NAME[when] ? when : 'plan', done: !!done });
  const starterTasks = () => WHEN.flatMap(([k]) => STARTER[k].map(t => task(t, k)));

  /* ---------- budget (from the budget module) ---------- */
  const STATUSES = ['Getting quotes', 'Quote accepted', 'Deposit paid', 'In progress', 'Paid in full'];
  const CATS = ['Kitchen', 'Bath', 'Flooring', 'Electrical', 'Plumbing', 'Paint & finishes', 'Windows & doors', 'Demo & haul-away', 'Labor / general contractor', 'Permits & fees', 'Fixtures & appliances', 'Contingency (10–15%)'];
  const cat = (name, budget, actual) => ({ id: P.uid(), name: name || '', budget: txt(budget), actual: txt(actual) });
  const vendor = () => ({ id: P.uid(), name: '', category: '', status: STATUSES[0], total: '', deposit: '', depositDue: '', paid: '', balanceDue: '', contact: '', notes: '' });

  /* ---------- selections + change orders (new) ---------- */
  const SEL = ['To choose', 'Chosen', 'Ordered', 'Delivered', 'Installed'];
  const selection = o => Object.assign({ id: P.uid(), item: '', room: '', choice: '', price: '', status: 'To choose', needBy: '', source: '', notes: '' }, o || {});
  const CO = ['Proposed', 'Approved', 'Declined'];
  const change = o => Object.assign({ id: P.uid(), date: D.today(), who: '', what: '', cost: '', status: 'Proposed' }, o || {});

  function blank() {
    return { profile: { couple: '', date: '', venue: '', a: '', b: '', lead: '', leadPhone: '' }, tasks: starterTasks(), totalBudget: '', categories: CATS.map(n => cat(n)), vendors: [],
      selections: [], changes: [], notes: '' };
  }
  function sample() {
    const t = D.today(), fin = D.add(t, 75);
    const tasks = starterTasks();
    tasks.forEach(x => { if (['plan', 'design', 'permits', 'demo'].includes(x.when)) x.done = true; if (x.text === 'Plumbing rough-in') x.done = true; });
    const v = (name, category, status, total, deposit, depositDue, paid, balanceDue, contactInfo, notes) =>
      Object.assign(vendor(), { name, category, status, total: String(total), deposit: String(deposit), depositDue, paid: String(paid), balanceDue, contact: contactInfo, notes });
    return {
      profile: { couple: 'Maple Street kitchen + bath', date: fin, venue: 'Main floor kitchen, upstairs bath', a: 'Warm modern', b: '', lead: '', leadPhone: '' },
      tasks,
      totalBudget: '40000',
      categories: [cat('Kitchen', 12000, 4000), cat('Bath', 8000, 2500), cat('Flooring', 4500, 1000), cat('Electrical', 3000, 3350),
        cat('Plumbing', 2500, 800), cat('Paint & finishes', 1500, 300), cat('Windows & doors', 2000, 0), cat('Demo & haul-away', 1200, 1200),
        cat('Permits & fees', 800, 400), cat('Labor / general contractor', 3500, 1000), cat('Contingency (10–15%)', 1000, 0)],
      vendors: [
        v('Northline Cabinets', 'Kitchen', 'Deposit paid', 9800, 3200, D.add(t, -30), 3200, D.add(t, 40), 'northline.example', 'Soft-close boxes. Lead time 8 weeks.'),
        v('River Tile Co.', 'Bath', 'Deposit paid', 4200, 1500, D.add(t, -20), 1500, D.add(t, 30), '(555) 010-2233', 'Shower niche + floor tile only.'),
        v('Oak & Plank Floors', 'Flooring', 'Quote accepted', 4100, 1000, D.add(t, 9), 0, D.add(t, 60), '', 'LVP install after drywall.'),
        v('Volt Path Electric', 'Electrical', 'In progress', 3350, 1000, D.add(t, -25), 2350, D.add(t, -3), '', 'Panel upgrade added as a change order (+$350).'),
        v('Clearflow Plumbing', 'Plumbing', 'Deposit paid', 2400, 800, D.add(t, -15), 800, D.add(t, 21), '(555) 010-4477', 'Rough-in done. Fixtures go in last.')],
      selections: [
        selection({ item: 'Cabinets', room: 'Kitchen', choice: 'Shaker, sage green, brass pulls', price: '9800', status: 'Ordered', needBy: D.add(t, 40), source: 'Northline Cabinets' }),
        selection({ item: 'Countertop', room: 'Kitchen', choice: 'Quartz, warm white, eased edge', price: '3400', status: 'Chosen', needBy: D.add(t, 45), source: 'Stone Yard', notes: 'Template after cabinets are in.' }),
        selection({ item: 'Backsplash tile', room: 'Kitchen', choice: '', price: '', status: 'To choose', needBy: D.add(t, 12), notes: 'Zellige vs handmade-look ceramic — get samples.' }),
        selection({ item: 'Kitchen faucet', room: 'Kitchen', choice: 'Pull-down, brushed brass', price: '289', status: 'Delivered', needBy: D.add(t, 50), source: 'Online' }),
        selection({ item: 'Vanity, 36"', room: 'Bath', choice: 'Oak, quartz top', price: '1150', status: 'Ordered', needBy: D.add(t, 30), source: 'Bath Depot' }),
        selection({ item: 'Shower tile', room: 'Bath', choice: '3×12 white gloss, stacked', price: '780', status: 'Delivered', needBy: D.add(t, 15), source: 'River Tile Co.' }),
        selection({ item: 'Flooring', room: 'Kitchen + hall', choice: 'LVP, natural oak look', price: '2600', status: 'Ordered', needBy: D.add(t, 25), source: 'Oak & Plank Floors' }),
        selection({ item: 'Paint colors', room: 'Kitchen + bath', choice: '', price: '', status: 'To choose', needBy: D.add(t, 20), notes: 'Test 3 swatches on the north wall.' }),
        selection({ item: 'Pendant lights', room: 'Kitchen', choice: '', price: '', status: 'To choose', needBy: D.add(t, 5), notes: 'Electrician needs the box positions this week.' })],
      changes: [change({ date: D.add(t, -18), who: 'Volt Path Electric', what: 'Panel upgrade to 200A', cost: '350', status: 'Approved' }),
        change({ date: D.add(t, -6), who: 'Clearflow Plumbing', what: 'Move the shower valve 12" left', cost: '180', status: 'Approved' }),
        change({ date: D.add(t, -1), who: 'River Tile Co.', what: 'Add a second shower niche', cost: '260', status: 'Proposed' })],
      notes: 'Decide by Friday: pendant lights (electrician needs box positions), backsplash samples.\nLiving with no kitchen: microwave + kettle in the dining room until the countertops are in.'
    };
  }
  function normalize(s) {
    const p = s.profile && typeof s.profile === 'object' ? s.profile : {};
    s.profile = Object.fromEntries(['couple', 'date', 'venue', 'a', 'b', 'lead', 'leadPhone'].map(k => [k, txt(p[k])]));
    s.tasks = list(s.tasks, x => Object.assign(task(txt(x.text), x.when, x.done), { id: txt(x.id) || P.uid() }));
    s.totalBudget = txt(s.totalBudget);
    s.categories = list(s.categories, x => ({ id: txt(x.id) || P.uid(), name: txt(x.name), budget: txt(x.budget), actual: txt(x.actual) }));
    s.vendors = list(s.vendors, x => Object.assign(vendor(), Object.fromEntries(Object.keys(vendor()).map(k => [k, txt(x[k])])), { id: txt(x.id) || P.uid(), status: STATUSES.includes(x.status) ? x.status : STATUSES[0] }));
    s.selections = list(s.selections, x => { const o = selection(); Object.keys(o).forEach(k => { o[k] = txt(x[k]) || (k === 'id' ? P.uid() : o[k]); }); if (!SEL.includes(o.status)) o.status = 'To choose'; return o; });
    s.changes = list(s.changes, x => { const o = change(); Object.keys(o).forEach(k => { o[k] = txt(x[k]) || (k === 'id' ? P.uid() : o[k]); }); if (!CO.includes(o.status)) o.status = 'Proposed'; return o; });
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
  const openTasks = s => s.tasks.filter(x => P.has(x.text) && !x.done);
  function countdown(s) {
    const d = wdate(s); if (!d) return '';
    const n = D.diff(D.today(), d);
    return `<span class="y-sticker">${I('home')}${n > 0 ? `${n} ${n === 1 ? 'day' : 'days'} to the finish` : n === 0 ? 'Finish day!' : 'Done — enjoy it!'}</span><span>${esc(D.full(d))}${s.profile.venue ? ' · ' + esc(s.profile.venue) : ''}</span>`;
  }

  /* ---------- overview ---------- */
  const overview = {
    id: 'overview', label: 'Overview', icon: 'home',
    render(ctx) {
      const s = ctx.state, p = s.profile;
      return `${u.head({ eyebrow: p.couple || 'Our renovation', title: '<span data-slot="title"></span>', meta: '<span data-slot="countdown"></span>' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Next up', '<div data-slot="next"></div>', { icon: 'check', cls: 'pl-7', actions: u.btn('Phases', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'checklist' } }) })}
        ${u.panel('Payments coming up', '<div data-slot="pay"></div>', { icon: 'calendar', cls: 'pl-5' })}
      </div>
      ${u.fold('The project', `<div class="pl-fields">
        ${u.field('Project', 'profile.couple', p.couple, { ph: 'Kitchen + bath remodel' })}
        ${u.field('Target finish', 'profile.date', p.date, { type: 'date', rerender: true, hint: 'Phase dates count back from it.' })}
        ${u.field('Rooms', 'profile.venue', p.venue, { ph: 'Kitchen, upstairs bath' })}
        ${u.field('Style', 'profile.a', p.a, { ph: 'e.g. Warm modern' })}</div>`, { icon: 'edit', key: 'project', open: !p.couple && !p.date })}
      ${u.notes('notes', s.notes, { rows: 6, title: 'Notes', ph: 'Decisions to make, questions for contractors, how you’re living through it…' })}`;
    },
    slots: {
      title(ctx) { const s = ctx.state, d = wdate(s); if (!d) return 'Plan the <em>whole renovation</em>'; const n = D.diff(D.today(), d); return n > 0 ? `<em>${n}</em> ${n === 1 ? 'day' : 'days'} to the finish` : n === 0 ? 'Finish <em>day</em>' : 'Done — <em>enjoy it!</em>'; },
      countdown(ctx) { return countdown(ctx.state); },
      kpis(ctx) {
        const s = ctx.state, b = budgetTotals(s), tasks = s.tasks.filter(x => P.has(x.text)), done = tasks.filter(x => x.done).length;
        return u.kpis([['Budget left', ctx.money(b.left, { cents: false }), b.left < 0 ? 'is-bad' : 'y-kpi--world', b.base ? `${ctx.money(b.spent, { cents: false })} spent of ${ctx.money(b.base, { cents: false })}` : 'set a budget'],
          ['Selections', `${s.selections.filter(x => P.has(x.item) && x.status !== 'To choose').length}<small class="gs-of">/${s.selections.filter(x => P.has(x.item)).length}</small>`, s.selections.some(x => x.status === 'To choose' && x.needBy && x.needBy < D.add(D.today(), 7)) ? 'is-bad' : '', `${s.selections.filter(x => P.has(x.item) && x.status === 'To choose').length} still to choose`],
          ['Change orders', ctx.money(s.changes.filter(x => x.status === 'Approved').reduce((a, x) => a + P.num(x.cost), 0), { cents: false }), '', `${s.changes.filter(x => x.status === 'Proposed').length} waiting for a yes`],
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
    id: 'checklist', label: 'Phases', icon: 'check',
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
      return `${u.head({ eyebrow: 'Phases', title: 'One phase at a <em>time</em>', lede: wdate(s) ? 'Every phase has a target date, counted back from your finish date. Late ones turn red so you can talk to the contractor early.' : 'Set a target finish on the Overview and every phase gets a date.', meta: countdown(s) })}
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
    id: 'vendors', label: 'Contractors', icon: 'briefcase',
    badge: ctx => { const n = payments(ctx.state).filter(p => p.due < D.today()).length; return n || ''; },
    render(ctx) {
      const s = ctx.state, f = STATUSES.includes(s.ui.vf) ? s.ui.vf : 'all';
      const rows = s.vendors.map((v, i) => Object.assign({ __i: i }, v)).filter(v => f === 'all' || v.status === f);
      const catOpts = Array.from(new Set(s.categories.map(c => c.name).filter(Boolean)));
      return `${u.head({ eyebrow: 'Quotes, contracts & payments', title: 'Contractors', lede: 'Every quote and contract: what each costs, what you have paid and when the next payment is due.' })}
      ${s.vendors.length ? u.chips('ui.vf', f, [['all', 'All', s.vendors.length], ...STATUSES.map(x => [x, x, s.vendors.filter(v => v.status === x).length])], 'Filter by status') : ''}
      ${u.records('vendors', rows, {
        index: v => v.__i, what: 'Contractor', titlePh: 'Contractor or supplier', cls: 'bu-vendors',
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
        add: 'Add contractor', empty: s.vendors.length ? '<p class="pl-muted">Nothing with this status.</p>' : u.empty('briefcase', 'No contractors yet', 'Add each contractor as soon as you get a quote — payments show up on the overview.')
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

  /* ---------- selections ---------- */
  const selections = {
    id: 'selections', label: 'Selections', icon: 'star',
    badge: ctx => ctx.state.selections.filter(x => P.has(x.item) && x.status === 'To choose' && x.needBy && x.needBy <= D.add(D.today(), 7)).length || '',
    render(ctx) {
      const s = ctx.state, f = SEL.includes(s.ui.sf) ? s.ui.sf : 'all';
      const rows = s.selections.map((x, i) => Object.assign({ __i: i }, x)).filter(x => f === 'all' || x.status === f).sort((a, b) => (a.needBy || 'z').localeCompare(b.needBy || 'z'));
      const tc = s.selections.filter(x => P.has(x.item) && x.status === 'To choose').length;
      return `${u.head({ eyebrow: 'Selections', title: tc ? `<em>${tc}</em> still to choose` : 'Everything <em>chosen</em>', lede: 'Every finish, fixture and appliance: what you picked, where from, what it costs and the date the crew needs it. Choose late and the job waits.' })}
      ${s.selections.length ? u.chips('ui.sf', f, [['all', 'All', s.selections.length], ...SEL.map(x => [x, x, s.selections.filter(y => y.status === x).length])], 'Filter by status') : ''}
      ${u.records('selections', rows, {
        index: x => x.__i, what: 'Selection', titleKey: 'item', titlePh: 'Item — e.g. Backsplash tile', cls: 'rn-sel',
        sub: x => `${u.pill(x.status, x.status === 'Installed' ? 'good' : x.status === 'To choose' ? (x.needBy && x.needBy < D.add(D.today(), 7) ? 'bad' : 'warn') : 'world')}${x.needBy ? ` needed by ${esc(D.short(x.needBy))}` : ''}${P.num(x.price) ? ` · <span class="y-num">${esc(ctx.money(P.num(x.price)))}</span>` : ''}`,
        cardClass: x => (x.status === 'To choose' && x.needBy && x.needBy < D.add(D.today(), 7) ? 'is-flag' : x.status === 'Installed' ? 'is-done' : ''),
        fields: [{ k: 'room', label: 'Room', ph: 'Kitchen' }, { k: 'status', label: 'Status', options: SEL, rerender: true },
          { k: 'choice', label: 'What you chose', ph: 'Model, color, size', wide: true }, { k: 'price', label: 'Price', num: true, ph: '0' }, { k: 'needBy', label: 'Needed by', type: 'date', rerender: true },
          { k: 'source', label: 'From', ph: 'Store, supplier or link' }, { k: 'notes', label: 'Notes', type: 'textarea', wide: true, ph: 'Samples, lead time, order number…' }],
        add: 'Add selection', addKind: s.selections.length ? '' : 'world', empty: s.selections.length ? '<p class="pl-muted">Nothing with this status.</p>' : u.empty('star', 'No selections yet', 'Tile, fixtures, paint, lights, appliances — add each one with the date it’s needed.')
      })}`;
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Selections</h1><p class="pl-sheet-meta">${esc(s.profile.couple || '')}</p><table><thead><tr><th>Item</th><th>Room</th><th>Choice</th><th>Status</th><th>Needed by</th><th>Price</th></tr></thead><tbody>${s.selections.filter(x => P.has(x.item)).map(x => `<tr><td><b>${esc(x.item)}</b></td><td>${esc(x.room)}</td><td>${esc(x.choice)}</td><td>${esc(x.status)}</td><td>${esc(x.needBy ? D.short(x.needBy) : '')}</td><td>${P.num(x.price) ? esc(ctx.money(P.num(x.price))) : ''}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- change orders ---------- */
  const changes = {
    id: 'changes', label: 'Change orders', icon: 'edit',
    badge: ctx => ctx.state.changes.filter(x => x.status === 'Proposed').length || '',
    render(ctx) {
      const s = ctx.state, ok = s.changes.filter(x => x.status === 'Approved'), sum = l => l.reduce((a, x) => a + P.num(x.cost), 0), b = budgetTotals(s);
      return `${u.head({ eyebrow: 'Change orders', title: ok.length ? `<em>${esc(ctx.money(sum(ok)))}</em> in approved changes` : 'No changes <em>yet</em>', lede: 'Every change to the contract — what, who, how much — so the extra cost is agreed in writing before the work, not discovered on the final invoice.' })}
      ${s.changes.length ? u.kpis([['Approved', esc(ctx.money(sum(ok))), 'y-kpi--world', P.plural(ok.length, 'change')], ['Waiting for a yes', esc(ctx.money(sum(s.changes.filter(x => x.status === 'Proposed')))), '', P.plural(s.changes.filter(x => x.status === 'Proposed').length, 'change')],
        ['Contingency left', esc(ctx.money(Math.max(0, P.num((s.categories.find(c => /contingency/i.test(c.name)) || {}).budget) - sum(ok)))), 'y-kpi--accent', 'after approved changes'], ['Budget left', esc(ctx.money(b.left)), b.left < 0 ? 'is-bad' : '']]) : ''}
      ${u.panel('Changes', u.table('changes', s.changes, [
        { k: 'date', label: 'Date', type: 'date', w: '150px' }, { k: 'who', label: 'Contractor', w: 'minmax(0,1fr)', ph: 'Who asked' },
        { k: 'what', label: 'What changes', title: true, w: 'minmax(0,1.8fr)', ph: 'Move the outlet, add a niche…' }, { k: 'cost', label: 'Cost', num: true, w: '110px', ph: '0' },
        { k: 'status', label: 'Status', type: 'select', options: CO, w: '130px', rerender: true }
      ], { what: 'change', add: 'Add change order', empty: 'No change orders yet.', rowClass: x => (x.status === 'Declined' ? 'is-done' : '') }), { icon: 'edit', hint: 'Add the approved cost to the budget category it belongs to when you pay it.' })}`;
    }
  };

  P.create({
    slug: 'renovation-planner-app', name: 'Renovation Planner', world: 'home', currency: true,
    welcome: 'Set a target finish date on the Overview — the phase dates count back from it.',
    pages: [overview, checklist, budget, vendors, selections, changes],
    blank, sample, normalize,
    rows: { categories: () => cat(''), vendors: vendor, selections: () => selection(), changes: () => change() },
    about: '<p><b>Renovation Planner</b> keeps a remodel in one place: phases with target dates counted back from your finish date, the budget vs what you have actually spent, every contractor’s quote, deposit and payments, the selections you still have to choose and order with the date the crew needs them, and every change order.</p>',
    disclaimer: 'Renovation Planner is a personal planning tool, not financial, lending, contractor, legal or insurance advice. Quotes and prices change; treat totals as estimates until invoices clear. Follow your local permit rules.'
  });
})();
