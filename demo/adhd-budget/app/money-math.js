/* Money Toolkit — pure math. No DOM. Loaded in the browser (window.MoneyMath)
   and in Node for tests (module.exports). All money is rounded to cents per step. */
(function (root) {
  'use strict';

  const EPS = 0.005;
  const MAX_MONTHS = 600; // 50 years — anything longer is reported as "not paid off"

  const round2 = n => Math.round((Number(n) || 0) * 100 + 1e-9) / 100;
  function num(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  const pos = v => Math.max(0, num(v));

  function labels(list, fallback) {
    const seen = {};
    return list.map((raw, i) => {
      const base = String(raw || '').trim() || `${fallback} ${i + 1}`;
      seen[base] = (seen[base] || 0) + 1;
      return seen[base] > 1 ? `${base} (${seen[base]})` : base;
    });
  }

  /* ---------- Debt payoff: snowball / avalanche ----------
     Each month: interest accrues on every balance, every minimum is paid, then the
     attack pool (extra + minimums freed by paid-off debts + leftovers from debts paid
     off this month) goes to debts in strategy order until it is used up.        */
  function debtPayoff(debts, extra, strategy) {
    const names = labels((debts || []).map(d => d.name), 'Debt');
    const ds = (debts || []).map((d, i) => ({ i, name: names[i], balance: pos(d.balance), apr: pos(d.apr), min: pos(d.min), paidOff: null }))
      .filter(d => d.balance > EPS);
    extra = pos(extra);
    const empty = { months: 0, feasible: true, totalInterest: 0, totalPaid: 0, totalDebt: 0, order: [], series: [0], schedule: [], monthlyBudget: extra, message: 'No balances to pay.' };
    if (!ds.length) return empty;
    const order = ds.slice().sort(strategy === 'avalanche'
      ? (a, b) => b.apr - a.apr || a.balance - b.balance || a.i - b.i
      : (a, b) => a.balance - b.balance || b.apr - a.apr || a.i - b.i);
    const totalDebt = round2(ds.reduce((s, d) => s + d.balance, 0));
    const budget = round2(ds.reduce((s, d) => s + d.min, 0) + extra);
    const series = [totalDebt], schedule = [];
    let totalInterest = 0, totalPaid = 0;

    for (let m = 1; m <= MAX_MONTHS; m++) {
      const active = ds.filter(d => d.balance > EPS);
      if (!active.length) break;
      let interest = 0;
      active.forEach(d => { const it = round2(d.balance * d.apr / 1200); d.balance = round2(d.balance + it); interest = round2(interest + it); });
      let pool = budget; // the whole monthly budget stays committed until everything is paid
      const pay = {};
      active.forEach(d => { const p = Math.min(d.min, d.balance); d.balance = round2(d.balance - p); pool = round2(pool - p); pay[d.name] = p; });
      for (const d of order) {
        if (pool <= EPS) break;
        if (d.balance <= EPS) continue;
        const p = Math.min(pool, d.balance);
        d.balance = round2(d.balance - p); pool = round2(pool - p); pay[d.name] = round2((pay[d.name] || 0) + p);
      }
      const paidThisMonth = round2(budget - Math.max(0, pool));
      totalInterest = round2(totalInterest + interest);
      totalPaid = round2(totalPaid + paidThisMonth);
      ds.forEach(d => { if (d.balance <= EPS && d.paidOff === null) { d.balance = 0; d.paidOff = m; } });
      const bal = round2(ds.reduce((s, d) => s + d.balance, 0));
      series.push(bal);
      schedule.push({ month: m, interest, paid: paidThisMonth, balance: bal, payments: pay });
      if (paidThisMonth <= interest + EPS && bal >= series[series.length - 2] - EPS) {
        return { months: null, feasible: false, totalInterest, totalPaid, totalDebt, order: order.map(o => ({ name: o.name, balance: o.balance, apr: o.apr, paidOff: o.paidOff })), series, schedule, monthlyBudget: budget,
          message: 'Your payments do not cover the interest. Raise the minimums or the extra payment.' };
      }
    }
    const left = ds.some(d => d.balance > EPS);
    return {
      months: left ? null : schedule.length, feasible: !left, totalInterest, totalPaid, totalDebt,
      order: order.map(o => ({ name: o.name, balance: pos((debts[o.i] || {}).balance), apr: o.apr, paidOff: o.paidOff })),
      series, schedule, monthlyBudget: budget,
      message: left ? `Not paid off within ${MAX_MONTHS / 12} years.` : 'Paid off.'
    };
  }

  /* ---------- Student loans: minimums only vs extra (extra goes to highest APR) ---------- */
  function studentLoans(loans, extra, compareExtra) {
    const base = debtPayoff(loans, 0, 'avalanche');
    const plan = debtPayoff(loans, extra, 'avalanche');
    const cmp = pos(compareExtra) > EPS && Math.abs(pos(compareExtra) - pos(extra)) > EPS ? debtPayoff(loans, compareExtra, 'avalanche') : null;
    const saved = r => (base.feasible && r && r.feasible) ? { months: base.months - r.months, interest: round2(base.totalInterest - r.totalInterest) } : null;
    return { base, plan, compare: cmp, planSaved: saved(plan), compareSaved: saved(cmp) };
  }

  /* ---------- Loan amortization (fixed payment) ---------- */
  function loan(principal, aprPct, termMonths) {
    const p = pos(principal), apr = pos(aprPct), n = Math.floor(pos(termMonths));
    if (p <= EPS || n <= 0) return { payment: 0, totalPaid: 0, totalInterest: 0, schedule: [], feasible: false };
    const r = apr / 1200;
    const payment = r <= 1e-12 ? round2(p / n) : round2(p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1));
    let bal = p, totalInterest = 0, totalPaid = 0;
    const schedule = [];
    for (let m = 1; m <= n; m++) {
      const interest = round2(bal * r);
      let principalPay = round2(payment - interest), paid = payment;
      if (m === n || principalPay > bal) { principalPay = round2(bal); paid = round2(principalPay + interest); }
      bal = round2(bal - principalPay); if (bal < EPS) bal = 0;
      totalInterest = round2(totalInterest + interest); totalPaid = round2(totalPaid + paid);
      schedule.push({ month: m, payment: paid, interest, principal: principalPay, balance: bal });
    }
    return { payment, totalPaid, totalInterest, schedule, feasible: true };
  }

  /* ---------- Paycheck budget (envelopes) ---------- */
  const PAY_FREQ = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
  function paycheck(net, envelopes, freq) {
    net = pos(net);
    const rows = (envelopes || []).map((e, i) => ({ name: String(e.name || '').trim() || `Envelope ${i + 1}`, amount: pos(e.amount) }));
    const allocated = round2(rows.reduce((s, e) => s + e.amount, 0));
    const left = round2(net - allocated);
    const perYear = PAY_FREQ[freq] || 26;
    return { net, allocated, left, over: left < -EPS, pct: net > EPS ? round2(allocated / net * 100) : 0, monthly: round2(net * perYear / 12), yearly: round2(net * perYear), rows, perYear };
  }

  /* ---------- Couples budget ---------- */
  const sum = (rows, k) => round2((rows || []).reduce((s, r) => s + pos(r[k]), 0));
  function couples(s) {
    const income = sum(s.incomes, 'amount'), bills = sum(s.bills, 'amount');
    const afterBills = round2(income - bills);
    const budgetA = pos(s.discA), budgetB = pos(s.discB);
    const spentA = sum(s.spendA, 'amount'), spentB = sum(s.spendB, 'amount');
    const planned = round2(afterBills - budgetA - budgetB), actual = round2(afterBills - spentA - spentB);
    return { income, bills, afterBills, budgetA, budgetB, spentA, spentB, leftPlanned: planned, leftActual: actual,
      billsPct: income > EPS ? round2(bills / income * 100) : 0,
      overBills: afterBills < -EPS, overA: budgetA > EPS && spentA - budgetA > EPS, overB: budgetB > EPS && spentB - budgetB > EPS };
  }

  /* ---------- Savings goal (monthly compounding) ---------- */
  function savings(goal, current, monthly, returnPct) {
    goal = pos(goal); current = pos(current); monthly = pos(monthly);
    const r = pos(returnPct) / 1200;
    if (goal <= EPS) return { state: 'nogoal', months: null, series: [current] };
    if (current + EPS >= goal) return { state: 'funded', months: 0, series: [current], contributed: 0, growth: 0, ending: current };
    if (monthly <= EPS && r <= 1e-12) return { state: 'stuck', months: null, series: [current] };
    let bal = current, contributed = 0;
    const series = [current];
    for (let m = 1; m <= MAX_MONTHS; m++) {
      bal = round2(bal + round2(bal * r) + monthly); contributed = round2(contributed + monthly); series.push(bal);
      if (bal + EPS >= goal) return { state: 'ok', months: m, series, contributed, growth: Math.max(0, round2(bal - current - contributed)), ending: bal };
    }
    return { state: 'toolong', months: null, series };
  }

  /* ---------- Emergency fund runway ---------- */
  function emergency(expenses, saved, targetMonths, monthly) {
    expenses = pos(expenses); saved = pos(saved); targetMonths = pos(targetMonths); monthly = pos(monthly);
    if (expenses <= EPS) return { state: 'noexp' };
    const target = round2(expenses * targetMonths), gap = round2(Math.max(0, target - saved));
    return { state: gap <= EPS ? 'funded' : 'building', runway: round2(saved / expenses), target, gap,
      monthsToGoal: gap <= EPS ? 0 : (monthly > EPS ? Math.ceil(gap / monthly - 1e-9) : null),
      pct: target > EPS ? Math.min(100, round2(saved / target * 100)) : 100 };
  }

  /* ---------- Subscriptions ---------- */
  const PER_MONTH = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };
  function subscriptions(items) {
    const rows = (items || []).map((x, i) => {
      const cadence = PER_MONTH[x.cadence] ? x.cadence : 'monthly';
      const monthly = round2(pos(x.amount) * PER_MONTH[cadence]);
      return { name: String(x.name || '').trim() || `Subscription ${i + 1}`, amount: pos(x.amount), cadence, keep: x.keep !== false, monthly, yearly: round2(monthly * 12) };
    });
    const tot = f => round2(rows.filter(f).reduce((s, r) => s + r.monthly, 0));
    const all = tot(() => true), keep = tot(r => r.keep), cancel = tot(r => !r.keep);
    return { rows, monthly: all, yearly: round2(all * 12), keepMonthly: keep, keepYearly: round2(keep * 12), cancelMonthly: cancel, cancelYearly: round2(cancel * 12) };
  }

  const api = { EPS, MAX_MONTHS, round2, num, debtPayoff, studentLoans, loan, paycheck, PAY_FREQ, couples, savings, emergency, subscriptions, PER_MONTH };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MoneyMath = api;
})(typeof window !== 'undefined' ? window : globalThis);
