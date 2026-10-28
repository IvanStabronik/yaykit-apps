/* Small Business Planner — the calculators and the profit tracker, from Seller Toolkit.
   Math lives in seller-math.js (tested in tests/math.test.js); biz.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, M = window.SellerMath, ui = P.ui, esc = ui.esc, I = ui.icon;
  const has = P.has;

  /* ---------- state ---------- */
  const feeSet = id => { const f = M.FEE_PRESETS[id] || M.FEE_PRESETS.etsy; return { preset: id in M.FEE_PRESETS ? id : 'etsy', listing: String(f.listing), txn: String(f.txn), payPct: String(f.payPct), payFixed: String(f.payFixed), ads: String(f.ads) }; };
  const blankTools = {
    price: () => ({ name: '', materials: '', hours: '', rate: '', packaging: '', other: '', mode: 'margin', margin: '40', profit: '', notes: '' }),
    sale: () => ({ name: '', price: '', shipIn: '', shipOut: '', cost: '', notes: '' }),
    margin: () => ({ mode: 'cost_price', cost: '', price: '', margin: '', markup: '' }),
    rate: () => ({ goal: '', hours: '', weeks: '', expenses: '', tax: '', projHours: '', contingency: '', projMargin: '', notes: '' }),
    ledger: () => ({ name: '', view: 'all', lines: [], notes: '' })
  };
  function blank() { const s = { fees: feeSet('etsy') }; Object.keys(blankTools).forEach(k => { s[k] = blankTools[k](); }); return s; }
  function sample() {
    const s = blank();
    s.price = { name: 'Soy candle, 8 oz', materials: '4.20', hours: '0.4', rate: '22', packaging: '1.10', other: '0.30', mode: 'margin', margin: '40', profit: '10', notes: '' };
    s.sale = { name: 'Soy candle, 8 oz', price: '24', shipIn: '5.50', shipOut: '6.20', cost: '14.40', notes: '' };
    s.margin = { mode: 'cost_price', cost: '12', price: '29', margin: '60', markup: '150' };
    s.rate = { goal: '60000', hours: '25', weeks: '46', expenses: '6000', tax: '28', projHours: '30', contingency: '15', projMargin: '10', notes: '' };
    const y = new Date().getFullYear(), d = (m, day) => `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    s.ledger = { name: 'Candle shop', view: 'all', notes: '', lines: [
      ['income', d(6, 6), 'Online orders', 'Sales', 612.4], ['income', d(6, 21), 'Summer market', 'Sales', 380], ['expense', d(6, 3), 'Wax and wicks', 'Materials', 148.2],
      ['expense', d(6, 20), 'Market booth', 'Fees', 45], ['income', d(7, 9), 'Online orders', 'Sales', 744.1], ['expense', d(7, 2), 'Jars, 4 cases', 'Materials', 196],
      ['expense', d(7, 15), 'Marketplace fees', 'Fees', 71.3], ['expense', d(7, 18), 'Shipping labels', 'Shipping', 88.6], ['income', d(8, 12), 'Online orders', 'Sales', 905.75],
      ['income', d(8, 24), 'Wholesale order', 'Sales', 420], ['expense', d(8, 5), 'Fragrance oils', 'Materials', 132.5], ['expense', d(8, 14), 'Marketplace fees', 'Fees', 86.9],
      ['expense', d(8, 27), 'Shipping labels', 'Shipping', 104.2]].map(([kind, date, label, cat, amount]) => ({ kind, date, label, cat, amount: String(amount) })) };
    return s;
  }
  function normalize(s) {
    s.fees = Object.assign(feeSet('etsy'), s.fees && typeof s.fees === 'object' ? s.fees : {});
    Object.keys(blankTools).forEach(k => { s[k] = Object.assign(blankTools[k](), s[k] && typeof s[k] === 'object' ? s[k] : {}); });
    if (!Array.isArray(s.ledger.lines)) s.ledger.lines = [];
    return s;
  }

  /* ---------- shared pieces ---------- */
  const pct = n => `${Math.round(n * 10) / 10}%`;
  const headHtml = (eyebrow, title, lede) => `<p class="y-eyebrow">${esc(eyebrow)}</p><h1 class="y-title y-title--md">${title}</h1>${lede ? `<p class="y-lede">${lede}</p>` : ''}`;
  const kick = (n, text) => `<h2 class="y-kicker"><span class="y-kicker-num">${n}</span>${esc(text)}</h2>`;
  const shell = (inputs, o) => `<header class="y-page-head pl-head" data-slot="head"></header><div data-slot="alert"></div><div data-slot="kpis"></div>
    <div class="pl-grid"><section class="y-panel ${o && o.wide ? 'pl-7' : 'pl-6'} st-visual" data-slot="visual"></section><div class="${o && o.wide ? 'pl-5' : 'pl-6'} pl-stack">${inputs}</div></div>${o && o.after ? o.after : ''}`;
  const emptyBox = (icon, title, text) => ui.empty(icon, title, text, ui.btn('Load example numbers', { kind: 'world', icon: 'sparkle', act: 'sample' }));
  function feesPanel(f) {
    const custom = Object.keys(M.FEE_PRESETS).every(id => { const p = M.FEE_PRESETS[id]; return !['listing', 'txn', 'payPct', 'payFixed', 'ads'].every(k => M.num(f[k]) === p[k]); });
    const options = Object.keys(M.FEE_PRESETS).map(id => [id, M.FEE_PRESETS[id].label]).concat(custom ? [['custom', 'Custom']] : []);
    const cur = custom ? 'custom' : Object.keys(M.FEE_PRESETS).find(id => ['listing', 'txn', 'payPct', 'payFixed', 'ads'].every(k => M.num(f[k]) === M.FEE_PRESETS[id][k]));
    return ui.fold('Where you sell — fees', `<div class="pl-stack">
      <div class="y-field"><label class="y-label" for="feePreset">Fee set</label><select class="y-select" id="feePreset" data-onchange="feePreset">${options.map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>
        <span class="pl-hint">Typical published fees. Marketplaces change them — check yours and edit any number.</span></div>
      <div class="pl-fields">
        ${ui.field('Listing fee', 'fees.listing', f.listing, { num: true, ph: '0.20' })}
        ${ui.field('Transaction %', 'fees.txn', f.txn, { num: true, ph: '6.5' })}
        ${ui.field('Payment %', 'fees.payPct', f.payPct, { num: true, ph: '3' })}
        ${ui.field('Payment fixed', 'fees.payFixed', f.payFixed, { num: true, ph: '0.25' })}
        ${ui.field('Ads %', 'fees.ads', f.ads, { num: true, ph: '0', hint: 'Only if the sale came from an ad.' })}</div></div>`,
    { key: 'fees', icon: 'money', meta: `<span class="pl-pill">${esc(cur === 'custom' ? 'Custom' : M.FEE_PRESETS[cur].label)}</span>` });
  }
  /* one horizontal bar split into labelled parts + a legend list */
  function split(parts, total, money) {
    const t = Math.max(total, parts.reduce((a, x) => a + Math.max(0, x[1]), 0), 0.01);
    const shown = parts.filter(x => x[1] > 0.004);
    return `<div class="st-bar" role="img" aria-label="${esc(shown.map(x => `${x[0]} ${money(x[1])}`).join(', '))}">${shown.map(x => `<span class="st-seg st-seg--${x[2]}" style="width:${(x[1] / t * 100).toFixed(2)}%"></span>`).join('')}</div>
      <ul class="st-legend">${shown.map(x => `<li><i class="st-dot st-seg--${x[2]}"></i><span>${esc(x[0])}</span><b class="y-num">${money(x[1])}</b><span class="pl-muted y-num">${Math.round(x[1] / t * 100)}%</span></li>`).join('')}</ul>`;
  }
  const cents = (ctx, n) => ctx.money(n, { cents: true });

  /* =====================================================================
     1. PRICE A PRODUCT
     ===================================================================== */
  const pricePage = {
    id: 'price', label: 'Price a product', icon: 'money',
    render(ctx) {
      const p = ctx.state.price;
      return shell(`
        <section class="y-panel pl-stack">${kick('02', 'What it costs you')}
          ${ui.field('Product', 'price.name', p.name, { ph: 'Soy candle, 8 oz', optional: true })}
          <div class="pl-fields">
            ${ui.field('Materials', 'price.materials', p.materials, { num: true, ph: '0' })}
            ${ui.field('Packaging', 'price.packaging', p.packaging, { num: true, ph: '0' })}
            ${ui.field('Your time (hours)', 'price.hours', p.hours, { num: true, ph: '0' })}
            ${ui.field('Hourly pay', 'price.rate', p.rate, { num: true, ph: '0' })}
            ${ui.field('Other costs', 'price.other', p.other, { num: true, ph: '0', hint: 'Labels, inserts, a share of tools.' })}</div></section>
        <section class="y-panel pl-stack">${kick('03', 'What you want to keep')}
          ${ui.seg('price.mode', p.mode, [['margin', 'A margin %'], ['profit', 'A profit amount']], 'Target type')}
          ${p.mode === 'profit' ? ui.field('Profit per sale', 'price.profit', p.profit, { num: true, ph: '10' }) : ui.field('Margin after fees (%)', 'price.margin', p.margin, { num: true, ph: '40', hint: 'Share of the price left after fees and costs. Handmade sellers often aim for 30–50%.' })}</section>
        ${feesPanel(ctx.state.fees)}`, { after: ui.notes('price.notes', p.notes, { rows: 3 }) });
    },
    slots: {
      head(ctx) {
        const r = M.price(ctx.state.price, ctx.state.fees), p = ctx.state.price;
        if (r.empty) return headHtml('Price a product', 'What should you <em>charge</em>?', 'Add what it costs you to make one, pick the margin you want, and see a price that still works after fees.');
        if (r.tooHigh) return headHtml('Price a product', 'That target <em>can’t be reached</em>', `Fees take ${pct(r.feeRatePct)} of every sale, so a ${esc(p.margin)}% margin leaves nothing to cover costs. Lower the margin or the ads fee.`);
        return headHtml('Price a product', `Charge <em>${cents(ctx, r.price)}</em>${has(p.name) ? ` for ${esc(p.name)}` : ''}`,
          `You keep <b>${cents(ctx, r.profit)}</b> (${pct(r.margin)}) after ${cents(ctx, r.fees)} in fees and ${cents(ctx, r.cost)} in costs.`);
      },
      alert(ctx) { const r = M.price(ctx.state.price, ctx.state.fees); return r.tooHigh ? ui.banner('warn', 'With these fees, no price gives that margin. Try a lower target.') : ''; },
      kpis(ctx) {
        const r = M.price(ctx.state.price, ctx.state.fees);
        if (!r.feasible) return '';
        return ui.kpis([['Your price', cents(ctx, r.price), 'y-kpi--world'], ['Costs', cents(ctx, r.cost)], ['Fees', cents(ctx, r.fees)], ['You keep', cents(ctx, r.profit), 'y-kpi--accent', `${pct(r.margin)} margin`]]);
      },
      visual(ctx) {
        const r = M.price(ctx.state.price, ctx.state.fees);
        if (!r.feasible) return emptyBox('money', r.tooHigh ? 'Adjust the target' : 'Start with your costs', r.tooHigh ? 'Lower the margin, or check the fee numbers.' : 'Fill in materials and your time on the right, or load an example.');
        const m = n => cents(ctx, n);
        return `${kick('01', 'Where the price goes')}
          ${split([['Materials', r.materials, 'a'], ['Your time', r.labor, 'b'], ['Packaging + other', r.packaging + r.other, 'c'], ['Fees', r.fees, 'fee'], ['Profit', Math.max(0, r.profit), 'keep']], r.price, m)}
          <div class="st-facts">
            <div><span>Round it to</span><b class="y-num">${m(r.charm)}</b><small>keeps ${m(r.charmProfit)} · ${pct(r.charmMargin)}</small></div>
            <div><span>Break-even price</span><b class="y-num">${m(r.breakeven)}</b><small>below this you lose money</small></div>
            ${r.perHour != null ? `<div><span>You earn per hour</span><b class="y-num">${m(r.perHour)}</b><small>pay for your time + profit</small></div>` : ''}</div>
          <p class="st-note">Fees: listing ${m(r.feeParts.listing)} · transaction ${m(r.feeParts.txn)} · payment ${m(r.feeParts.pay)}${r.feeParts.ads ? ` · ads ${m(r.feeParts.ads)}` : ''}</p>`;
      }
    }
  };

  /* =====================================================================
     2. CHECK A SALE
     ===================================================================== */
  const salePage = {
    id: 'sale', label: 'Check a sale', icon: 'chart',
    render(ctx) {
      const s = ctx.state.sale;
      return shell(`
        <section class="y-panel pl-stack">${kick('02', 'The sale')}
          ${ui.field('Product', 'sale.name', s.name, { ph: 'Soy candle, 8 oz', optional: true })}
          <div class="pl-fields">
            ${ui.field('Item price', 'sale.price', s.price, { num: true, ph: '0' })}
            ${ui.field('Your cost to make it', 'sale.cost', s.cost, { num: true, ph: '0' })}
            ${ui.field('Shipping the buyer pays', 'sale.shipIn', s.shipIn, { num: true, ph: '0' })}
            ${ui.field('Shipping you pay', 'sale.shipOut', s.shipOut, { num: true, ph: '0' })}</div></section>
        ${feesPanel(ctx.state.fees)}`, { after: ui.notes('sale.notes', s.notes, { rows: 3 }) });
    },
    slots: {
      head(ctx) {
        const r = M.sale(ctx.state.sale, ctx.state.fees);
        if (r.empty) return headHtml('Check a sale', 'What do you <em>actually keep</em>?', 'Enter a price you already charge and see every fee, your real profit and the lowest price that still breaks even.');
        return r.loss ? headHtml('Check a sale', `You lose <em>${cents(ctx, -r.profit)}</em> on this sale`, `Costs and fees add up to more than the ${cents(ctx, r.base)} you collect. Break-even is ${cents(ctx, r.breakeven)}.`)
          : headHtml('Check a sale', `You keep <em>${cents(ctx, r.profit)}</em>`, `from ${cents(ctx, r.base)} collected — fees take ${cents(ctx, r.totalFees)} (${pct(r.feePct)}).`);
      },
      alert(ctx) { const r = M.sale(ctx.state.sale, ctx.state.fees); return r.loss ? ui.banner('warn', `Raise the price to at least <b>${cents(ctx, r.breakeven)}</b> to stop losing money on each sale.`) : ''; },
      kpis(ctx) {
        const r = M.sale(ctx.state.sale, ctx.state.fees);
        if (r.empty) return '';
        return ui.kpis([['You collect', cents(ctx, r.base)], ['Fees', cents(ctx, r.totalFees), '', pct(r.feePct)], ['You keep', cents(ctx, r.profit), r.loss ? 'is-bad' : 'y-kpi--world', `${pct(r.margin)} margin`], ['Break-even price', cents(ctx, r.breakeven), 'y-kpi--accent']]);
      },
      visual(ctx) {
        const r = M.sale(ctx.state.sale, ctx.state.fees);
        if (r.empty) return emptyBox('chart', 'Enter a price', 'Type the price on the right, or load an example sale.');
        const m = n => cents(ctx, n);
        return `${kick('01', 'Where the money goes')}
          ${split([['Cost to make', r.cost, 'a'], ['Shipping you pay', r.shipOut, 'c'], ['Fees', r.totalFees, 'fee'], ['Profit', Math.max(0, r.profit), 'keep']], r.base, m)}
          <table class="st-table"><tbody>
            <tr><td>Listing fee</td><td class="y-num">${m(r.listing)}</td></tr><tr><td>Transaction fee</td><td class="y-num">${m(r.txn)}</td></tr>
            <tr><td>Payment processing</td><td class="y-num">${m(r.pay)}</td></tr>${r.ads ? `<tr><td>Ads fee</td><td class="y-num">${m(r.ads)}</td></tr>` : ''}
            <tr class="st-total"><td>All fees</td><td class="y-num">${m(r.totalFees)}</td></tr></tbody></table>`;
      }
    }
  };

  /* =====================================================================
     3. MARGIN & MARKUP
     ===================================================================== */
  const MODES = [['cost_price', 'Cost + price'], ['cost_margin', 'Cost + margin'], ['cost_markup', 'Cost + markup'], ['price_margin', 'Price + margin']];
  const marginPage = {
    id: 'margin', label: 'Margin & markup', icon: 'focus',
    render(ctx) {
      const s = ctx.state.margin, m = s.mode;
      return shell(`<section class="y-panel pl-stack">${kick('02', 'What you know')}
        ${ui.seg('margin.mode', m, MODES, 'What you know')}
        <div class="pl-fields">
          ${m !== 'price_margin' ? ui.field('Cost', 'margin.cost', s.cost, { num: true, ph: '0' }) : ''}
          ${m === 'cost_price' || m === 'price_margin' ? ui.field('Price', 'margin.price', s.price, { num: true, ph: '0' }) : ''}
          ${m === 'cost_margin' || m === 'price_margin' ? ui.field('Margin %', 'margin.margin', s.margin, { num: true, ph: '50' }) : ''}
          ${m === 'cost_markup' ? ui.field('Markup %', 'margin.markup', s.markup, { num: true, ph: '100' }) : ''}</div>
        <p class="pl-hint">Margin is profit as a share of the <b>price</b>. Markup is profit as a share of the <b>cost</b>. A 100% markup is a 50% margin.</p></section>`);
    },
    slots: {
      head(ctx) {
        const r = M.margin(ctx.state.margin);
        if (r.empty) return headHtml('Margin & markup', 'Margin or markup — <em>which is which</em>?', 'Enter any two numbers and get the rest: price, profit, margin and markup.');
        if (r.mode === 'price_margin') return headHtml('Margin & markup', `Spend at most <em>${cents(ctx, r.cost)}</em>`, `to keep a ${pct(r.margin)} margin at a price of ${cents(ctx, r.price)}.`);
        return r.mode === 'cost_price' ? headHtml('Margin & markup', `<em>${pct(r.margin)}</em> margin`, `That’s a ${pct(r.markup)} markup — ${cents(ctx, r.profit)} profit on a ${cents(ctx, r.price)} price.`)
          : headHtml('Margin & markup', `Price it at <em>${cents(ctx, r.price)}</em>`, `${cents(ctx, r.profit)} profit — ${pct(r.margin)} margin, ${pct(r.markup)} markup.`);
      },
      alert(ctx) { const r = M.margin(ctx.state.margin); return !r.empty && r.loss ? ui.banner('warn', 'The price is below the cost — every sale loses money.') : ''; },
      kpis(ctx) {
        const r = M.margin(ctx.state.margin);
        if (r.empty) return '';
        return ui.kpis([['Cost', cents(ctx, r.cost)], ['Price', cents(ctx, r.price), 'y-kpi--world'], ['Profit', cents(ctx, r.profit), r.loss ? 'is-bad' : ''], ['Margin', pct(r.margin), 'y-kpi--accent', `${pct(r.markup)} markup`]]);
      },
      visual(ctx) {
        const r = M.margin(ctx.state.margin);
        if (r.empty) return emptyBox('focus', 'Two numbers is all it takes', 'Pick what you know on the right, or load an example.');
        return `${kick('01', 'Price, split')}${split([['Cost', r.cost, 'a'], ['Profit', Math.max(0, r.profit), 'keep']], r.price, n => cents(ctx, n))}
          <div class="st-facts"><div><span>Margin</span><b class="y-num">${pct(r.margin)}</b><small>profit ÷ price</small></div><div><span>Markup</span><b class="y-num">${pct(r.markup)}</b><small>profit ÷ cost</small></div></div>`;
      }
    }
  };

  /* =====================================================================
     4. FREELANCE RATE
     ===================================================================== */
  const ratePage = {
    id: 'rate', label: 'Freelance rate', icon: 'briefcase',
    render(ctx) {
      const s = ctx.state.rate;
      return shell(`
        <section class="y-panel pl-stack">${kick('02', 'Your year')}
          <div class="pl-fields">
            ${ui.field('Take-home goal per year', 'rate.goal', s.goal, { num: true, ph: '60000', wide: true, hint: 'What you want to pay yourself after tax and business costs.' })}
            ${ui.field('Billable hours per week', 'rate.hours', s.hours, { num: true, ph: '25', hint: 'Client work only — not admin or sales.' })}
            ${ui.field('Working weeks per year', 'rate.weeks', s.weeks, { num: true, ph: '46' })}
            ${ui.field('Business costs per year', 'rate.expenses', s.expenses, { num: true, ph: '6000' })}
            ${ui.field('Tax set-aside %', 'rate.tax', s.tax, { num: true, ph: '28' })}</div></section>
        <section class="y-panel pl-stack">${kick('03', 'Quote a project')}
          <div class="pl-fields">
            ${ui.field('Estimated hours', 'rate.projHours', s.projHours, { num: true, ph: '30' })}
            ${ui.field('Buffer for surprises %', 'rate.contingency', s.contingency, { num: true, ph: '15' })}
            ${ui.field('Extra margin %', 'rate.projMargin', s.projMargin, { num: true, ph: '10' })}</div>
          <div data-slot="quote"></div></section>`, { after: ui.notes('rate.notes', s.notes, { rows: 3 }) });
    },
    slots: {
      head(ctx) {
        const r = M.freelance(ctx.state.rate);
        if (!r.feasible) return headHtml('Freelance rate', 'What should you <em>charge per hour</em>?', 'Work back from the income you want: your goal, your real billable hours, your costs and tax.');
        return headHtml('Freelance rate', `Charge <em>${cents(ctx, r.hourly)}</em> an hour`, `That bills ${ctx.money(r.gross)} a year over ${Math.round(r.billable).toLocaleString('en-US')} billable hours — enough for your goal, your costs and ${ctx.money(r.taxSet)} set aside for tax.`);
      },
      kpis(ctx) {
        const r = M.freelance(ctx.state.rate);
        if (!r.feasible) return '';
        return ui.kpis([['Hourly', cents(ctx, r.hourly), 'y-kpi--world'], ['Day rate (8 h)', ctx.money(r.day)], ['Per week', ctx.money(r.week)], ['To bill per month', ctx.money(r.month), 'y-kpi--accent']]);
      },
      visual(ctx) {
        const r = M.freelance(ctx.state.rate), s = ctx.state.rate;
        if (!r.feasible) return emptyBox('briefcase', 'Start with your goal', 'Enter a yearly take-home goal and your billable hours, or load an example.');
        return `${kick('01', 'Where a year of billing goes')}
          ${split([['Your take-home', M.num(s.goal), 'keep'], ['Business costs', M.num(s.expenses), 'a'], ['Tax set-aside', r.taxSet, 'fee']], r.gross, n => ctx.money(n))}
          <p class="st-note">Only ${Math.round(r.billable).toLocaleString('en-US')} of roughly 2,000 working hours are billable, which is why the rate is higher than a salary divided by hours.</p>`;
      },
      quote(ctx) {
        const r = M.freelance(ctx.state.rate);
        if (!r.project) return `<p class="pl-muted">${r.feasible ? 'Add estimated hours to get a project quote.' : 'Fill in your year first.'}</p>`;
        const q = r.project;
        return `<table class="st-table"><tbody><tr><td>${q.hours} hours at your rate</td><td class="y-num">${ctx.money(q.base)}</td></tr><tr><td>With buffer</td><td class="y-num">${ctx.money(q.withContingency)}</td></tr>
          <tr class="st-total"><td>Quote</td><td class="y-num">${ctx.money(q.quote)}</td></tr></tbody></table>`;
      }
    }
  };

  /* =====================================================================
     5. PROFIT TRACKER
     ===================================================================== */
  const monthName = m => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); };
  const ledgerPage = {
    id: 'ledger', label: 'Profit tracker', icon: 'list',
    badge: ctx => ctx.state.ledger.lines.length || '',
    render(ctx) {
      const s = ctx.state.ledger, r = M.ledger(s.lines, 'all');
      const chips = [['all', 'All time']].concat(r.months.map(m => [m, monthName(m)]));
      if (!chips.some(c => c[0] === s.view)) s.view = 'all';
      return `<header class="y-page-head pl-head" data-slot="head"></header>
        ${r.months.length > 1 ? ui.chips('ledger.view', s.view, chips, 'Period') : ''}
        <div data-slot="kpis"></div>
        <div class="pl-grid"><section class="y-panel pl-7 st-visual" data-slot="visual"></section><section class="y-panel pl-5 st-visual" data-slot="cats"></section></div>
        ${ui.panel('Income and expenses', `${ui.field('Business name', 'ledger.name', s.name, { ph: 'Candle shop', optional: true })}
          ${ui.table('ledger.lines', s.lines, [
            { k: 'date', label: 'Date', type: 'date', w: '150px' },
            { k: 'kind', label: 'Type', type: 'select', options: [['income', 'Income'], ['expense', 'Expense']], w: '128px' },
            { k: 'label', label: 'What', ph: 'Online orders', w: 'minmax(0,1.4fr)' },
            { k: 'cat', label: 'Category', ph: 'Materials', w: 'minmax(0,1fr)' },
            { k: 'amount', label: 'Amount', num: true, ph: '0', w: '120px' }
          ], { what: 'line', add: 'Add line', empty: 'No lines yet. Add your first sale or expense.' })}`, { icon: 'list', hint: 'One line per sale, payout or expense. The date decides the month.' })}
        ${ui.notes('ledger.notes', s.notes, { rows: 3 })}`;
    },
    slots: {
      head(ctx) {
        const s = ctx.state.ledger, r = M.ledger(s.lines, s.view), when = s.view === 'all' ? 'so far' : 'in ' + monthName(s.view);
        if (M.ledger(s.lines, 'all').empty) return headHtml('Profit tracker', 'Is it <em>making money</em>?', 'Log what comes in and what goes out. See profit by month and where the money goes.');
        return r.loss ? headHtml('Profit tracker', `Down <em>${ctx.money(-r.profit)}</em> ${when}`, `${ctx.money(r.expense)} out against ${ctx.money(r.income)} in.`)
          : headHtml('Profit tracker', `<em>${ctx.money(r.profit)}</em> profit ${when}`, `${has(s.name) ? esc(s.name) + ': ' : ''}${ctx.money(r.income)} in, ${ctx.money(r.expense)} out — you keep ${pct(r.margin)} of what you earn.`);
      },
      kpis(ctx) {
        const s = ctx.state.ledger, r = M.ledger(s.lines, s.view);
        if (M.ledger(s.lines, 'all').empty) return '';
        return ui.kpis([['Income', ctx.money(r.income)], ['Expenses', ctx.money(r.expense)], ['Profit', ctx.money(r.profit), r.loss ? 'is-bad' : 'y-kpi--world'], ['Margin', pct(r.margin), 'y-kpi--accent']]);
      },
      visual(ctx) {
        const r = M.ledger(ctx.state.ledger.lines, 'all');
        if (r.empty) return emptyBox('list', 'Nothing logged yet', 'Add a line below, or load an example shop.');
        const max = Math.max(1, ...r.byMonth.map(m => Math.max(m.income, m.expense)));
        return `${kick('01', 'Month by month')}${r.byMonth.length ? `<ul class="st-months">${r.byMonth.map(m => `<li><span class="st-month">${monthName(m.month)}</span>
          <span class="st-pair"><i class="st-seg--keep" style="width:${m.income / max * 100}%"></i><i class="st-seg--fee" style="width:${m.expense / max * 100}%"></i></span>
          <b class="y-num${m.profit < 0 ? ' st-neg' : ''}">${ctx.money(m.profit)}</b></li>`).join('')}</ul>
          <p class="st-keyline"><span><i class="st-dot st-seg--keep"></i>Income</span><span><i class="st-dot st-seg--fee"></i>Expenses</span><span>Number = profit</span></p>` : '<p class="pl-muted">Add dates to your lines to see months.</p>'}
          ${r.undated ? `<p class="st-note">${P.plural(r.undated, 'line')} without a date — counted in totals, not in a month.</p>` : ''}`;
      },
      cats(ctx) {
        const s = ctx.state.ledger, r = M.ledger(s.lines, s.view);
        if (M.ledger(s.lines, 'all').empty) return '';
        if (!r.byCat.length) return `${kick('02', 'Where it goes')}<p class="pl-muted">No expenses in this period.</p>`;
        const max = r.byCat[0].amount;
        return `${kick('02', 'Where it goes')}<ul class="st-cats">${r.byCat.slice(0, 8).map(c => `<li><span>${esc(c.cat)}</span><span class="st-catbar"><i style="width:${c.amount / max * 100}%"></i></span><b class="y-num">${ctx.money(c.amount)}</b></li>`).join('')}</ul>`;
      }
    },
    sheet(ctx) {
      const s = ctx.state.ledger, r = M.ledger(s.lines, 'all');
      const rows = s.lines.filter(l => M.num(l.amount) > 0).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
      return `<h1>${esc(has(s.name) ? s.name : 'Profit and loss')}</h1><p class="pl-sheet-meta">Income ${ctx.money(r.income)} · Expenses ${ctx.money(r.expense)} · Profit ${ctx.money(r.profit)}</p>
        ${r.byMonth.length ? `<h2>By month</h2><table><thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Profit</th></tr></thead><tbody>${r.byMonth.map(m => `<tr><td>${monthName(m.month)}</td><td>${ctx.money(m.income, { cents: true })}</td><td>${ctx.money(m.expense, { cents: true })}</td><td><b>${ctx.money(m.profit, { cents: true })}</b></td></tr>`).join('')}</tbody></table>` : ''}
        <h2>All lines</h2><table><thead><tr><th>Date</th><th>Type</th><th>What</th><th>Category</th><th>Amount</th></tr></thead><tbody>${rows.map(l => `<tr><td>${esc(P.D.full(l.date) || '—')}</td><td>${l.kind === 'expense' ? 'Expense' : 'Income'}</td><td>${esc(l.label)}</td><td>${esc(l.cat)}</td><td>${ctx.money(M.num(l.amount), { cents: true })}</td></tr>`).join('') || '<tr><td colspan="5">No lines yet.</td></tr>'}</tbody></table>`;
    }
  };

  window.SBSeller = {
    pages: { price: pricePage, sale: salePage, margin: marginPage, rate: ratePage, ledger: ledgerPage },
    blank, sample, normalize,
    rows: { lines: () => ({ kind: 'income', date: P.D.today(), label: '', cat: '', amount: '' }) },
    actions: { feePreset(ctx, d) { if (d.value in M.FEE_PRESETS) ctx.state.fees = feeSet(d.value); } }
  };
})();
