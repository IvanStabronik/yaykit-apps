/* Seller Toolkit — pure math. No DOM. Loaded in the browser (window.SellerMath)
   and in Node for tests (module.exports). Money is rounded to cents. */
(function (root) {
  'use strict';
  const EPS = 0.005;
  const round2 = n => Math.round((Number(n) || 0) * 100 + 1e-9) / 100;
  function num(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  const pos = v => Math.max(0, num(v));

  /* Typical fee sets. Marketplaces change fees — the app says so and every number is editable. */
  const FEE_PRESETS = {
    etsy: { label: 'Etsy (US)', listing: 0.2, txn: 6.5, payPct: 3, payFixed: 0.25, ads: 0 },
    etsyAds: { label: 'Etsy + Offsite Ads', listing: 0.2, txn: 6.5, payPct: 3, payFixed: 0.25, ads: 15 },
    own: { label: 'Own website (card fees)', listing: 0, txn: 0, payPct: 2.9, payFixed: 0.3, ads: 0 },
    none: { label: 'No fees (cash, markets)', listing: 0, txn: 0, payPct: 0, payFixed: 0, ads: 0 }
  };
  function fees(f) {
    f = f || {};
    const rate = Math.min((pos(f.txn) + pos(f.payPct) + pos(f.ads)) / 100, 0.95);
    return { listing: pos(f.listing), txn: pos(f.txn) / 100, payPct: pos(f.payPct) / 100, payFixed: pos(f.payFixed), ads: pos(f.ads) / 100, rate, fixed: pos(f.listing) + pos(f.payFixed) };
  }

  /* What one sale at a known price leaves you with. Percent fees apply to item price + shipping charged. */
  function sale(s, f) {
    const F = fees(f);
    const price = pos(s.price), shipIn = pos(s.shipIn), shipOut = pos(s.shipOut), cost = pos(s.cost);
    const base = round2(price + shipIn);
    const txn = round2(base * F.txn), pay = round2(base * F.payPct + (base > EPS ? F.payFixed : 0)), ads = round2(base * F.ads);
    const listing = base > EPS ? round2(F.listing) : 0;
    const totalFees = round2(listing + txn + pay + ads);
    const profit = round2(base - totalFees - cost - shipOut);
    // lowest item price that does not lose money, same shipping and costs
    const breakeven = round2(Math.max(0, (cost + shipOut + F.fixed) / Math.max(1 - F.rate, 0.05) - shipIn));
    return { price, shipIn, shipOut, cost, base, listing, txn, pay, ads, totalFees, profit, breakeven,
      margin: base > EPS ? round2(profit / base * 100) : 0, feePct: base > EPS ? round2(totalFees / base * 100) : 0,
      empty: price <= EPS, loss: price > EPS && profit < -EPS };
  }

  /* Price to charge so that, after fees, you keep a target margin (% of price) or a target profit. */
  function price(p, f) {
    const F = fees(f);
    const labor = round2(pos(p.hours) * pos(p.rate));
    const cost = round2(pos(p.materials) + labor + pos(p.packaging) + pos(p.other));
    const mode = p.mode === 'profit' ? 'profit' : 'margin';
    const wantMargin = Math.min(pos(p.margin) / 100, 0.95), wantProfit = pos(p.profit);
    const denom = mode === 'profit' ? 1 - F.rate : 1 - F.rate - wantMargin;
    const empty = cost <= EPS && !(mode === 'profit' && wantProfit > EPS);
    const feasible = !empty && denom > 0.01;
    const raw = feasible ? (cost + F.fixed + (mode === 'profit' ? wantProfit : 0)) / denom : 0;
    const charge = round2(Math.ceil(raw * 100 - 1e-6) / 100); // round up a cent so the target is met, not missed
    const at = sale({ price: charge, cost }, f);
    const charm = feasible ? round2(Math.floor(charge) + 0.99 >= charge ? Math.floor(charge) + 0.99 : Math.floor(charge) + 1.99) : 0;
    const atCharm = sale({ price: charm, cost }, f);
    const hours = pos(p.hours);
    return { cost, labor, materials: pos(p.materials), packaging: pos(p.packaging), other: pos(p.other), mode, empty, feasible, tooHigh: !empty && !feasible,
      price: charge, fees: at.totalFees, feeParts: { listing: at.listing, txn: at.txn, pay: at.pay, ads: at.ads }, profit: at.profit, margin: at.margin,
      breakeven: sale({ price: 0, cost }, f).breakeven, charm, charmProfit: atCharm.profit, charmMargin: atCharm.margin,
      perHour: hours > EPS ? round2((at.profit + labor) / hours) : null, feeRatePct: round2(F.rate * 100) };
  }

  /* Margin and markup from any two of cost / price / margin % / markup %. */
  function margin(s) {
    const mode = ['cost_price', 'cost_margin', 'cost_markup', 'price_margin'].includes(s.mode) ? s.mode : 'cost_price';
    let c = pos(s.cost), p = pos(s.price);
    const m = Math.min(pos(s.margin), 99) / 100, k = pos(s.markup) / 100;
    if (mode === 'cost_margin') p = c > EPS ? c / (1 - m) : 0;
    else if (mode === 'cost_markup') p = c * (1 + k);
    else if (mode === 'price_margin') c = p * (1 - m);
    const profit = round2(p - c);
    return { mode, cost: round2(c), price: round2(p), profit, margin: p > EPS ? round2(profit / p * 100) : 0, markup: c > EPS ? round2(profit / c * 100) : 0,
      empty: !(c > EPS || p > EPS) || (mode === 'cost_price' && !(c > EPS && p > EPS)), loss: profit < -EPS };
  }

  /* Freelance rate: what to bill per hour to take home a yearly goal after expenses and tax. */
  function freelance(s) {
    const goal = pos(s.goal), hoursW = pos(s.hours), weeks = Math.min(pos(s.weeks), 52), expenses = pos(s.expenses);
    const tax = Math.min(pos(s.tax) / 100, 0.95);
    const gross = (goal + expenses) / (1 - tax);
    const billable = hoursW * weeks;
    const feasible = billable > EPS && goal > EPS;
    const hourly = feasible ? gross / billable : 0;
    const ph = pos(s.projHours), base = hourly * ph, withC = base * (1 + pos(s.contingency) / 100), quote = withC * (1 + pos(s.projMargin) / 100);
    return { feasible, gross: round2(gross), billable: round2(billable), hourly: round2(hourly), day: round2(hourly * 8), week: round2(hourly * hoursW), month: round2(gross / 12),
      taxSet: round2(gross * tax), project: ph > EPS && feasible ? { base: round2(base), withContingency: round2(withC), quote: round2(quote), hours: ph } : null };
  }

  /* Income and expense lines -> totals, by month (YYYY-MM from each line's date), by category. */
  function ledger(lines, month) {
    const rows = (lines || []).map(r => ({ kind: r.kind === 'expense' ? 'expense' : 'income', month: /^\d{4}-\d{2}/.test(String(r.date || '')) ? String(r.date).slice(0, 7) : '',
      label: String(r.label || '').trim(), cat: String(r.cat || '').trim(), amount: round2(pos(r.amount)) })).filter(r => r.amount > EPS);
    const scoped = rows.filter(r => !month || month === 'all' || r.month === month);
    const sum = (list, kind) => round2(list.filter(r => r.kind === kind).reduce((a, r) => a + r.amount, 0));
    const income = sum(scoped, 'income'), expense = sum(scoped, 'expense'), profit = round2(income - expense);
    const months = [...new Set(rows.map(r => r.month).filter(Boolean))].sort();
    const byMonth = months.map(m => { const l = rows.filter(r => r.month === m), i = sum(l, 'income'), e = sum(l, 'expense'); return { month: m, income: i, expense: e, profit: round2(i - e) }; });
    const cats = {};
    scoped.filter(r => r.kind === 'expense').forEach(r => { const k = r.cat || 'Other'; cats[k] = round2((cats[k] || 0) + r.amount); });
    const byCat = Object.keys(cats).map(k => ({ cat: k, amount: cats[k] })).sort((a, b) => b.amount - a.amount);
    return { income, expense, profit, margin: income > EPS ? round2(profit / income * 100) : 0, count: scoped.length, months, byMonth, byCat,
      undated: rows.filter(r => !r.month).length, empty: !rows.length, loss: profit < -EPS };
  }

  const api = { EPS, round2, num, FEE_PRESETS, fees, sale, price, margin, freelance, ledger };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SellerMath = api;
})(typeof window !== 'undefined' ? window : globalThis);
