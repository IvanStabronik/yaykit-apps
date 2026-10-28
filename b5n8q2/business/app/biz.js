/* Small Business Planner App — overview, orders, invoices & quotes, profit tracker and the pricing calculators. Yaykit planner engine, work world.
   Invoices come from Client Docs Studio (invoices.js), the calculators and the profit tracker from Seller Toolkit (calc.js);
   the overview and the order tracker are new. A paid invoice or a shipped order goes into the profit tracker in one tap. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, M = window.SellerMath, C = window.ClientDocs, INV = window.SBInvoices, CALC = window.SBSeller;
  const r2 = n => Math.round(n * 100) / 100;

  /* ---------- orders ---------- */
  const STATUSES = ['New', 'Making', 'Ready', 'Shipped'];
  const CHANNELS = ['Etsy', 'Website', 'Instagram', 'Market', 'Wholesale', 'Email', 'Other'];
  const order = o => Object.assign({ id: P.uid(), customer: '', item: '', qty: '1', amount: '', channel: 'Etsy', date: D.today(), shipBy: '', status: 'New', tracking: '', notes: '', logged: false }, o || {});
  const openOrders = s => s.orders.filter(o => o.status !== 'Shipped' && (P.has(o.customer) || P.has(o.item)));
  const isLate = o => o.status !== 'Shipped' && o.shipBy && o.shipBy < D.today();
  const bySoon = (a, b) => (a.shipBy || 'z').localeCompare(b.shipBy || 'z');

  /* ---------- money owed and this month ---------- */
  const unpaid = s => s.invoices.filter(x => x.type === 'invoice' && x.status === 'sent');
  const overdue = x => x.due && x.due < D.today();
  const quotes = s => s.invoices.filter(x => x.type === 'quote' && C.totals(x).total);
  const sum = (l, f) => r2(l.reduce((a, x) => a + f(x), 0));
  const month = () => D.today().slice(0, 7);
  const monthName = m => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'long' }); };

  /* ---------- state ---------- */
  function blank() {
    return Object.assign(CALC.blank(), INV.blank(), { orders: [], notes: '', ui: { of: 'open' } });
  }
  function normalize(s) {
    CALC.normalize(s); INV.normalize(s);
    s.orders = (Array.isArray(s.orders) ? s.orders : []).filter(o => o && typeof o === 'object').map(o => { const x = order(o); if (!STATUSES.includes(x.status)) x.status = 'New'; return x; });
    s.notes = typeof s.notes === 'string' ? s.notes : '';
    s.ui = Object.assign({ of: 'open' }, s.ui && typeof s.ui === 'object' ? s.ui : {});
    return s;
  }
  function sample() {
    const s = blank(), t = D.today(), c = CALC.sample();
    ['fees', 'price', 'sale', 'margin'].forEach(k => { s[k] = c[k]; });
    s.rate = Object.assign(c.rate, { goal: '42000', hours: '20', weeks: '46', expenses: '4800', tax: '25', projHours: '6', contingency: '15', projMargin: '10' });
    s.biz = { name: 'Fern & Wick Candle Co.', tagline: 'Hand-poured soy candles', email: 'hello@fernandwick.example', phone: '+1 555 014 3300', website: 'fernandwick.example', address: '18 Mill Street, Unit 4\nAsheville, NC 28801', logo: '' };
    const inv = (type, number, o) => Object.assign(INV.newInvoice(type, number), { accent: 'emerald', tax: '0' }, o);
    const terms = 'Payment due within 14 days.', pay = 'Bank transfer (ACH) or card — payment link on request.';
    s.invoices = [
      inv('invoice', 'INV-0107', { date: D.add(t, -4), due: D.add(t, 10), po: 'JH-2210', status: 'sent', pay, terms, client: { name: 'Dana Whitlock', company: 'Juniper Home Goods', email: 'dana@juniperhome.example', address: '230 Haywood Rd\nAsheville, NC 28806' },
        intro: 'Thank you for the autumn wholesale order — it shipped today.', items: [{ desc: 'Cedar & Sage soy candle, 8 oz (wholesale)', qty: '24', rate: '12' }, { desc: 'Fig & Amber soy candle, 8 oz (wholesale)', qty: '24', rate: '12' }, { desc: 'Wax melts, 4-pack', qty: '24', rate: '4.5' }] }),
      inv('invoice', 'INV-0106', { date: D.add(t, -19), due: D.add(t, -5), status: 'sent', pay, terms, client: { name: 'Marcus Bell', company: 'Blue Door Gift Shop', email: 'marcus@bluedoor.example', address: '' },
        items: [{ desc: 'Mixed soy candles, 8 oz (wholesale)', qty: '36', rate: '12' }, { desc: 'Display crate', qty: '1', rate: '18' }] }),
      inv('invoice', 'INV-0105', { date: D.add(t, -33), due: D.add(t, -19), status: 'paid', logged: true, pay, terms, client: { name: 'Lena Ortiz', company: 'Hillside Market Co-op', email: 'lena@hillside.example', address: '' },
        items: [{ desc: 'Soy candles, 8 oz (wholesale)', qty: '30', rate: '12' }] }),
      inv('quote', 'Q-0012', { date: D.add(t, -1), due: D.add(t, 29), client: { name: 'Maya Chen', company: 'Maya & Theo’s wedding', email: 'maya@example.com', address: '' },
        intro: 'Here is the quote for the wedding favors we talked about.', items: [{ desc: 'Mini soy candle favors, 2 oz, custom label', qty: '120', rate: '4.25' }, { desc: 'Label design, one round of changes', qty: '1', rate: '60' }],
        pay: 'Reply to this quote to book. A 30% deposit holds your date.', terms: 'Quote valid for 30 days.' })];
    s.cur = 0;
    s.orders = [
      order({ customer: 'Hannah K.', item: 'Cedar & Sage, 8 oz', qty: '2', amount: '48', channel: 'Etsy', date: D.add(t, -4), shipBy: D.add(t, -1), status: 'Making' }),
      order({ customer: 'Luis M.', item: 'Gift set of 3', qty: '1', amount: '58', channel: 'Website', date: D.add(t, -2), shipBy: D.add(t, 1), status: 'Ready' }),
      order({ customer: 'Priya S.', item: 'Fig & Amber, 8 oz', qty: '1', amount: '24', channel: 'Etsy', date: D.add(t, -1), shipBy: D.add(t, 2), status: 'New', notes: 'Gift note: “Happy housewarming!”' }),
      order({ customer: 'Owen R.', item: 'Custom label candles', qty: '12', amount: '216', channel: 'Email', date: D.add(t, -6), shipBy: D.add(t, 6), status: 'Making', notes: 'Labels approved. Company logo on the lid.' }),
      order({ customer: 'Ben T.', item: 'Cedar & Sage, 8 oz', qty: '1', amount: '24', channel: 'Etsy', date: D.add(t, -5), shipBy: D.add(t, -3), status: 'Shipped', tracking: '9400 1112 0254 7731' }),
      order({ customer: 'Grace L.', item: 'Wax melts, 4-pack', qty: '2', amount: '18', channel: 'Market', date: D.add(t, -8), shipBy: D.add(t, -8), status: 'Shipped', logged: true })];
    // the profit tracker: the last three months, this month only up to today
    const now = new Date(t + 'T12:00:00'), day = now.getDate();
    const md = (back, d) => { const x = new Date(now.getFullYear(), now.getMonth() - back, 1); return D.iso(new Date(x.getFullYear(), x.getMonth(), back ? d : Math.min(d, day))); };
    s.ledger = { name: 'Fern & Wick', view: 'all', notes: '', lines: [
      ['income', md(2, 6), 'Online orders', 'Sales', 612.4], ['income', md(2, 21), 'Summer market', 'Sales', 380], ['expense', md(2, 3), 'Wax and wicks', 'Materials', 148.2],
      ['expense', md(2, 20), 'Market booth', 'Fees', 45], ['income', md(1, 9), 'Online orders', 'Sales', 744.1], ['expense', md(1, 2), 'Jars, 4 cases', 'Materials', 196],
      ['expense', md(1, 15), 'Marketplace fees', 'Fees', 71.3], ['expense', md(1, 18), 'Shipping labels', 'Shipping', 88.6], ['income', md(1, 24), 'Invoice INV-0105 · Hillside Market Co-op', 'Sales', 360],
      ['income', md(0, 1), 'Online orders', 'Sales', 405.75], ['expense', md(0, 1), 'Fragrance oils', 'Materials', 132.5], ['income', md(0, 1), 'Market · Grace L.', 'Sales', 18],
      ['expense', md(0, 2), 'Marketplace fees', 'Fees', 46.9], ['expense', md(0, 3), 'Shipping labels', 'Shipping', 54.2]
    ].map(([kind, date, label, cat, amount]) => ({ kind, date, label, cat, amount: String(amount) })) };
    s.notes = 'Holiday markets: book the Dec 7 craft fair booth.\nReorder 8 oz jars before November.';
    return s;
  }

  /* ---------- overview ---------- */
  const overview = {
    id: 'overview', label: 'Overview', icon: 'chart',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: s.biz.name || 'Your business', title: '<span data-slot="title"></span>', lede: '<span data-slot="lede"></span>' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Ship next', '<div data-slot="ship"></div>', { icon: 'gift', cls: 'pl-6', actions: u.btn('Orders', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'orders' } }) })}
        ${u.panel('Waiting on payment', '<div data-slot="owed"></div>', { icon: 'doc', cls: 'pl-6', actions: u.btn('Invoices', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'invoice' } }) })}
      </div>
      <div data-slot="months"></div>
      ${INV.bizPanel(ctx)}
      ${u.notes('notes', s.notes, { rows: 5, title: 'Notes', ph: 'Ideas, reorders, markets to book, things not to forget…' })}`;
    },
    slots: {
      title(ctx) {
        const r = M.ledger(ctx.state.ledger.lines, month());
        if (!r.count) return 'Run the <em>whole business</em> here';
        return r.loss ? `Down <em>${esc(ctx.money(-r.profit))}</em> in ${esc(monthName(month()))}` : `<em>${esc(ctx.money(r.profit))}</em> profit in ${esc(monthName(month()))}`;
      },
      lede(ctx) {
        const r = M.ledger(ctx.state.ledger.lines, month());
        return r.count ? `${esc(ctx.money(r.income))} in, ${esc(ctx.money(r.expense))} out so far this month.` : 'Orders, invoices, profit and prices in one place. Log a sale or an expense in the profit tracker to see this month here.';
      },
      kpis(ctx) {
        const s = ctx.state, owed = unpaid(s), late = owed.filter(overdue), open = openOrders(s), lateO = open.filter(isLate), q = quotes(s), r = M.ledger(s.ledger.lines, month());
        return u.kpis([
          ['Profit this month', esc(ctx.money(r.profit)), r.loss ? 'is-bad' : 'y-kpi--world', r.count ? `${Math.round(r.margin)}% of income` : 'nothing logged yet'],
          ['Waiting on payment', esc(ctx.money(sum(owed, x => C.totals(x).total))), late.length ? 'is-bad' : '', owed.length ? (late.length ? `${P.plural(late.length, 'invoice')} overdue` : `${P.plural(owed.length, 'invoice')} sent`) : 'no invoices out'],
          ['To ship', String(open.length), lateO.length ? 'is-bad' : '', lateO.length ? `${lateO.length} late` : open.length ? 'all on time' : 'all caught up'],
          ['Open quotes', esc(ctx.money(sum(q, x => C.totals(x).total))), 'y-kpi--accent', q.length ? P.plural(q.length, 'quote') : 'none out']]);
      },
      ship(ctx) {
        const s = ctx.state, l = openOrders(s).slice().sort(bySoon).slice(0, 5), t = D.today();
        if (!l.length) return u.empty('gift', 'Nothing to ship', 'New orders show up here, soonest first.', u.btn('Add an order', { sm: true, kind: 'world', icon: 'plus', act: 'go', data: { page: 'orders' } }));
        return `<ol class="y-timeline sb-list">${l.map(o => `<li><span class="y-timeline-dot"></span><b>${esc(o.customer || 'Customer')} · ${esc(o.item || 'order')}</b>
          <span class="y-timeline-when${o.shipBy && o.shipBy < t ? ' is-over' : ''}">${o.shipBy ? (o.shipBy < t ? 'late · ' : 'ship by ') + esc(D.short(o.shipBy)) : 'no date'}</span><span class="y-timeline-meta">${esc(o.status)}${P.num(o.amount) ? ' · ' + esc(ctx.money(P.num(o.amount))) : ''}</span></li>`).join('')}</ol>`;
      },
      owed(ctx) {
        const l = unpaid(ctx.state).slice().sort((a, b) => (a.due || 'z').localeCompare(b.due || 'z'));
        if (!l.length) return '<p class="pl-muted">No invoices waiting. Mark an invoice as Sent and it shows up here until it is paid.</p>';
        return `<ol class="y-timeline sb-list">${l.map(x => `<li><span class="y-timeline-dot"></span><b>${esc(x.number)} · ${esc(x.client.company || x.client.name || 'client')}</b>
          <span class="y-timeline-when${overdue(x) ? ' is-over' : ''}">${x.due ? (overdue(x) ? 'overdue · ' : 'due ') + esc(D.short(x.due)) : 'no due date'}</span><span class="y-timeline-meta y-num">${esc(ctx.money(C.totals(x).total, { cents: true }))}</span></li>`).join('')}</ol>`;
      },
      months(ctx) {
        const r = M.ledger(ctx.state.ledger.lines, 'all');
        if (r.byMonth.length < 2) return '';
        const l = r.byMonth.slice(-4), max = Math.max(1, ...l.map(m => Math.max(m.income, m.expense)));
        return u.panel('Month by month', `<ul class="st-months">${l.map(m => `<li><span class="st-month">${esc(monthName(m.month))}</span>
          <span class="st-pair"><i class="st-seg--keep" style="width:${m.income / max * 100}%"></i><i class="st-seg--fee" style="width:${m.expense / max * 100}%"></i></span>
          <b class="y-num${m.profit < 0 ? ' st-neg' : ''}">${esc(ctx.money(m.profit))}</b></li>`).join('')}</ul>
          <p class="st-keyline"><span><i class="st-dot st-seg--keep"></i>Income</span><span><i class="st-dot st-seg--fee"></i>Expenses</span><span>Number = profit</span></p>`,
        { icon: 'chart', actions: u.btn('Profit tracker', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'ledger' } }) });
      }
    }
  };

  /* ---------- orders ---------- */
  const orders = {
    id: 'orders', label: 'Orders', icon: 'gift',
    badge: ctx => openOrders(ctx.state).filter(isLate).length || '',
    render(ctx) {
      const s = ctx.state, f = s.ui.of === 'all' || STATUSES.includes(s.ui.of) ? s.ui.of : 'open';
      const rows = s.orders.map((o, i) => Object.assign({ __i: i }, o)).filter(o => f === 'all' || (f === 'open' ? o.status !== 'Shipped' : o.status === f));
      if (f !== 'Shipped' && f !== 'all') rows.sort(bySoon);
      const open = openOrders(s), late = open.filter(isLate).length;
      return `${u.head({ eyebrow: 'Order tracker', title: open.length ? `<em>${open.length}</em> to ship${late ? ` · ${late} late` : ''}` : 'All <em>caught up</em>', lede: 'One card per order. Move it from New to Shipped; late ones turn red.' })}
      ${s.orders.length ? u.chips('ui.of', f, [['open', 'To ship', open.length], ...STATUSES.map(x => [x, x, s.orders.filter(o => o.status === x).length]), ['all', 'All', s.orders.length]], 'Filter orders') : ''}
      ${u.records('orders', rows, {
        index: o => o.__i, what: 'Order', titleKey: 'customer', titlePh: 'Customer name', cls: 'sb-orders',
        sub: o => `<span data-slot="oSub" data-arg="${o.__i}"></span>`,
        cardClass: o => (isLate(o) ? 'is-flag' : o.status === 'Shipped' ? 'is-done' : ''),
        fields: [
          { k: 'item', label: 'What they ordered', ph: 'Cedar & Sage, 8 oz' }, { k: 'qty', label: 'Qty', num: true, ph: '1' },
          { k: 'amount', label: 'Order total', num: true, ph: '0' }, { k: 'channel', label: 'Sold on', options: CHANNELS },
          { k: 'date', label: 'Ordered', type: 'date' }, { k: 'shipBy', label: 'Ship by', type: 'date', rerender: true },
          { k: 'status', label: 'Status', options: STATUSES, rerender: true }, { k: 'tracking', label: 'Tracking', ph: 'Tracking number' },
          { k: 'notes', label: 'Notes', type: 'textarea', wide: true, ph: 'Gift note, personalisation, address changes…' }
        ],
        add: 'Add order', tpl: 'orders',
        empty: s.orders.length ? '<p class="pl-muted">No orders with this status.</p>' : u.empty('gift', 'No orders yet', 'Add each order as it comes in — from Etsy, your website, a market or a message.')
      })}`;
    },
    slots: {
      oSub(ctx, i) {
        const o = ctx.state.orders[+i]; if (!o) return '';
        const amt = P.num(o.amount), what = `${P.num(o.qty) > 1 ? esc(o.qty) + ' × ' : ''}${esc(o.item || 'item')}${amt ? ' · <span class="y-num">' + esc(ctx.money(amt, { cents: true })) + '</span>' : ''}`;
        if (o.status === 'Shipped') return `${what} · ${o.logged ? u.pill('In the profit tracker', 'good') : amt ? u.btn('Add to profit tracker', { sm: true, kind: 'ghost', icon: 'plus', act: 'logOrder', data: { i } }) : u.pill('Shipped', 'good')}`;
        return `${what} · ${isLate(o) ? u.pill(`Late — was due ${D.short(o.shipBy)}`, 'bad') : o.shipBy ? `ship by ${esc(D.short(o.shipBy))}` : 'no ship date'}`;
      }
    },
    actions: {
      logOrder(ctx, d) {
        const s = ctx.state, o = s.orders[+d.i], amt = o && P.num(o.amount);
        if (!o || o.logged || !amt) return false;
        s.ledger.lines.push({ kind: 'income', date: D.today(), label: `${o.channel || 'Order'} · ${o.customer || o.item || 'order'}`, cat: 'Sales', amount: String(amt) });
        o.logged = true;
        ctx.toast(`Added ${ctx.money(amt, { cents: true })} to the profit tracker`);
      }
    }
  };

  // short tab names so all eight fit on one row on a laptop
  Object.assign(INV.page, { label: 'Invoices' });
  Object.assign(CALC.pages.ledger, { label: 'Profit', badge: null });
  Object.assign(CALC.pages.price, { label: 'Pricing' });
  Object.assign(CALC.pages.margin, { label: 'Margin' });
  Object.assign(CALC.pages.rate, { label: 'Your rate' });

  P.create({
    slug: 'small-business-app',
    name: 'Small Business Planner',
    world: 'work',
    currency: true,
    welcome: 'Orders, invoices, profit and prices — it saves as you go.',
    pages: [overview, orders, INV.page, CALC.pages.ledger, CALC.pages.price, CALC.pages.sale, CALC.pages.rate, CALC.pages.margin],
    blank, sample, normalize,
    accepts: d => d && typeof d === 'object' && ('orders' in d || 'invoices' in d || 'ledger' in d),
    rows: Object.assign({ orders: () => order() }, INV.rows, CALC.rows),
    actions: Object.assign({}, INV.actions, CALC.actions),
    refresh: INV.fit,
    about: '<p><b>Small Business Planner</b> keeps a small shop or service business in one place: an order tracker, invoices and quotes that print as clean PDFs, a profit tracker by month, and calculators to price a product after fees, check what a sale leaves you, find your hourly rate and convert margin and markup. A paid invoice or a shipped order goes into the profit tracker in one tap.</p>',
    disclaimer: 'Fee presets are typical published rates and may be out of date or differ by country — check your own and edit the numbers. These are planning tools and document templates, not accounting, tax, payment or legal services.'
  });
})();
