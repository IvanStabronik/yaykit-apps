/* Moving Planner App — compare homes on weighted criteria with a rough monthly cost, from House Hunt. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const STATUS = ['Considering', 'Toured', 'Offer made', 'Under contract', 'Passed'];
  const txt = v => (v == null ? '' : String(v));
  const crit = (name, weight) => ({ id: P.uid(), name: name || '', weight: String(weight || 3) });
  const home = o => Object.assign({ id: P.uid(), name: '', address: '', link: '', status: 'Considering', price: '', beds: '', baths: '', sqft: '', hoa: '', tax: '', commute: '', pros: '', cons: '', offer: '', offerDate: '', ratings: {} }, o || {});
  const DEFAULT_CRIT = [['Location', 5], ['Commute', 4], ['Layout', 4], ['Condition', 3], ['Natural light', 3], ['Outdoor space', 2], ['Storage', 2]];

  function blank() { return { hunt: '', criteria: DEFAULT_CRIT.map(c => crit(...c)), homes: [], money: { down: '20', rate: '6.5', years: '30', insurance: '1500' }, notes: '' }; }
  function sample() {
    const s = blank();
    s.hunt = 'Our shortlist';
    const r = vals => Object.fromEntries(s.criteria.map((c, i) => [c.id, String(vals[i])]));
    s.homes = [
      home({ name: 'Maple Ave townhome', address: '18 Maple Ave', status: 'Toured', price: '485000', beds: '3', baths: '2.5', sqft: '1650', hoa: '95', tax: '6200', commute: '22 min drive', pros: 'Quiet street, yard for the dog, updated kitchen', cons: 'Small closets, HOA rules on exterior', ratings: r([5, 4, 4, 4, 3, 4, 2]) }),
      home({ name: 'Riverside condo 4B', address: '400 River Rd #4B', status: 'Toured', price: '419000', beds: '2', baths: '2', sqft: '1180', hoa: '310', tax: '5100', commute: '35 min transit', pros: 'Lower price, balcony view, walk to cafés', cons: 'High HOA, elevator outages mentioned', ratings: r([4, 2, 3, 4, 5, 2, 3]) }),
      home({ name: 'Cedar St bungalow', address: '9 Cedar St', status: 'Under contract', price: '512000', beds: '3', baths: '2', sqft: '1820', hoa: '0', tax: '6900', commute: '18 min drive', pros: 'No HOA, finished basement, lots of light', cons: 'Roof within ~5 years, older furnace', offer: '498000', offerDate: D.add(D.today(), -2), ratings: r([4, 5, 5, 3, 5, 4, 4]) }),
      home({ name: 'Birch Ct split-level', address: '3 Birch Ct', status: 'Passed', price: '468000', beds: '4', baths: '2', sqft: '1900', hoa: '0', tax: '6400', commute: '40 min drive', pros: 'Big yard', cons: 'Busy road noise, dark kitchen', ratings: r([2, 2, 3, 3, 2, 5, 4]) })
    ];
    s.notes = 'Pre-approval good until end of next month.\nAsk the Cedar St sellers about the furnace age and last roof inspection.';
    return s;
  }
  function normalize(s) {
    s.hunt = txt(s.hunt); s.notes = txt(s.notes);
    s.criteria = (Array.isArray(s.criteria) ? s.criteria : []).filter(x => x && typeof x === 'object').map(x => ({ id: txt(x.id) || P.uid(), name: txt(x.name), weight: txt(x.weight) || '3' }));
    s.homes = (Array.isArray(s.homes) ? s.homes : []).filter(x => x && typeof x === 'object').map(x => {
      const h = home(), out = Object.fromEntries(Object.keys(h).filter(k => k !== 'ratings').map(k => [k, txt(x[k])]));
      out.id = out.id || P.uid(); out.status = STATUS.includes(x.status) ? x.status : 'Considering';
      out.ratings = x.ratings && typeof x.ratings === 'object' ? Object.fromEntries(Object.keys(x.ratings).map(k => [k, txt(x.ratings[k])])) : {};
      return out;
    });
    const m = s.money || {};
    s.money = { down: txt(m.down || '20'), rate: txt(m.rate || '6.5'), years: txt(m.years || '30'), insurance: txt(m.insurance || '1500') };
    return s;
  }

  function score(s, h) {
    let got = 0, max = 0, rated = 0;
    s.criteria.forEach(c => { const w = Math.max(0, P.num(c.weight)), r = Math.round(P.num(h.ratings[c.id])); if (!w) return; max += 5 * w; if (r) { got += r * w; rated++; } });
    return rated && max ? Math.round(got / max * 100) : null;
  }
  function monthly(s, h) {
    const price = P.num(h.price); if (!price) return null;
    const loan = price * (1 - Math.min(100, P.num(s.money.down)) / 100), r = P.num(s.money.rate) / 1200, n = Math.round(P.num(s.money.years) * 12) || 360;
    const pi = r ? loan * r / (1 - Math.pow(1 + r, -n)) : loan / n;
    return { pi, total: pi + P.num(h.hoa) + P.num(h.tax) / 12 + P.num(s.money.insurance) / 12 };
  }
  const active = s => s.homes.filter(h => h.status !== 'Passed' && P.has(h.name));
  function ranked(s) { return active(s).map(h => ({ h, sc: score(s, h) })).filter(x => x.sc != null).sort((a, b) => b.sc - a.sc); }

  const compare = {
    id: 'compare', label: 'Compare', icon: 'home',
    render(ctx) {
      const s = ctx.state, rank = ranked(s), top = rank[0], pos = Object.fromEntries(rank.map((x, i) => [x.h.id, i + 1]));
      const hideP = !!s.ui.hidePassed;
      const list = s.homes.map((h, i) => Object.assign({ __i: i }, h)).filter(h => !(hideP && h.status === 'Passed'));
      return `
      ${u.head({ eyebrow: s.hunt || 'House hunt', title: top ? `<em>${esc(top.h.name)}</em> leads` : 'Compare <em>homes</em>', lede: 'Rate each home on what matters to you. Scores are weighted by your criteria; monthly costs are rough estimates.' })}
      <div data-slot="kpis"></div>
      <div class="pl-row hh-tools">${u.input('hunt', s.hunt, { label: 'Name this search', ph: 'Name this search', cls: 'hh-hunt' })}<span class="pl-spacer"></span>${u.switch('ui.hidePassed', hideP, 'Hide passed')}${u.btn('Add home', { kind: 'world', icon: 'plus', act: 'add', data: { list: 'homes' } })}</div>
      ${s.homes.length ? '' : u.empty('home', 'No homes yet', 'Add each place you’re considering — even ones you’ve only seen online.')}
      <div class="hh-homes">${list.map(h => {
        const i = h.__i, sc = score(s, h), m = monthly(s, h), rk = pos[h.id];
        return `<article class="hh-home${h.status === 'Passed' ? ' is-passed' : ''}${rk === 1 ? ' is-top' : ''}">
          <header class="hh-home-head">${rk ? `<span class="hh-rank y-num">#${rk}</span>` : ''}
            <div class="pl-rec-title">${u.input(`homes.${i}.name`, h.name, { label: `Home ${i + 1} name`, ph: 'Home nickname', cls: 'pl-title-input' })}${u.input(`homes.${i}.address`, h.address, { label: 'Address', ph: 'Address', cls: 'hh-addr' })}</div>
            ${u.rowTools('homes', i, s.homes.length, { what: 'home', label: h.name })}</header>
          <div class="hh-score">${sc == null ? '<span class="pl-muted">Rate it below to get a score</span>' : `<b class="y-num">${sc}</b><span>/100</span>${u.meter(sc, 'Score')}`}</div>
          <div class="pl-rec-grid">
            ${u.field('Status', `homes.${i}.status`, h.status, { options: STATUS, rerender: true })}
            ${u.field('Price', `homes.${i}.price`, h.price, { num: true, ph: '0' })}
            ${u.field('Beds', `homes.${i}.beds`, h.beds, { num: true, ph: '—' })}${u.field('Baths', `homes.${i}.baths`, h.baths, { num: true, ph: '—' })}
            ${u.field('Sq ft', `homes.${i}.sqft`, h.sqft, { num: true, ph: '—' })}${u.field('HOA / month', `homes.${i}.hoa`, h.hoa, { num: true, ph: '0' })}
            ${u.field('Property tax / year', `homes.${i}.tax`, h.tax, { num: true, ph: '0' })}${u.field('Commute', `homes.${i}.commute`, h.commute, { ph: '25 min' })}
          </div>
          <div class="hh-money" data-slot="money" data-arg="${i}"></div>
          <div class="hh-ratings">${s.criteria.filter(c => P.has(c.name)).map(c => `<div class="hh-rate"><span>${esc(c.name)}</span>${u.stars(`homes.${i}.ratings.${c.id}`, h.ratings[c.id], `${c.name} for ${h.name || 'this home'}`)}</div>`).join('')}</div>
          <div class="pl-rec-grid">${u.field('Pros', `homes.${i}.pros`, h.pros, { type: 'textarea', rows: 2, ph: 'What you loved', cls: 'pl-wide' })}${u.field('Cons', `homes.${i}.cons`, h.cons, { type: 'textarea', rows: 2, ph: 'Deal-breakers, repairs', cls: 'pl-wide' })}
            ${u.field('Listing link', `homes.${i}.link`, h.link, { type: 'url', ph: 'https://…', cls: 'pl-wide' })}
            ${['Offer made', 'Under contract'].includes(h.status) ? u.field('Offer', `homes.${i}.offer`, h.offer, { num: true, ph: '0' }) + u.field('Offer date', `homes.${i}.offerDate`, h.offerDate, { type: 'date' }) : ''}</div>
        </article>`;
      }).join('')}</div>`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, act = active(s), rank = ranked(s), prices = act.map(h => P.num(h.price)).filter(Boolean);
        return u.kpis([['Homes in the running', String(act.length)], ['Top score', rank.length ? `${rank[0].sc}<small class="hh-of">/100</small>` : '—', 'y-kpi--world', rank.length ? esc(rank[0].h.name) : ''], ['Price range', prices.length ? `${esc(ctx.money(Math.min(...prices)))}` : '—', '', prices.length > 1 ? `to ${esc(ctx.money(Math.max(...prices)))}` : ''], ['Offers out', String(s.homes.filter(h => h.status === 'Offer made').length), 'y-kpi--accent']]);
      },
      money(ctx, i) {
        const s = ctx.state, h = s.homes[+i]; if (!h) return '';
        const m = monthly(s, h), ppsf = P.num(h.price) && P.num(h.sqft) ? P.num(h.price) / P.num(h.sqft) : 0;
        return m ? `<span><b class="y-num">≈ ${esc(ctx.money(Math.round(m.total)))}</b>/month</span><span class="pl-muted y-num">${esc(ctx.money(Math.round(m.pi)))} mortgage${P.num(h.hoa) ? ` + ${esc(ctx.money(P.num(h.hoa)))} HOA` : ''} + tax & insurance${ppsf ? ` · ${esc(ctx.money(Math.round(ppsf)))}/sq ft` : ''}</span>` : '<span class="pl-muted">Add a price to estimate the monthly cost.</span>';
      }
    },
    sheet(ctx) {
      const s = ctx.state, list = s.homes.filter(h => P.has(h.name) && h.status !== 'Passed');
      const row = (label, f) => `<tr><th>${esc(label)}</th>${list.map(h => `<td>${f(h)}</td>`).join('')}</tr>`;
      return `<h1>${esc(s.hunt || 'House hunt')} · side by side</h1><p class="pl-sheet-meta">Scores weighted by your criteria. Monthly estimate: ${esc(s.money.down)}% down, ${esc(s.money.rate)}% for ${esc(s.money.years)} years, plus HOA, tax and insurance.</p>
        <table class="hh-sheet"><tbody>${row('', h => `<b>${esc(h.name)}</b><br>${esc(h.address)}`)}${row('Status', h => esc(h.status))}${row('Score', h => score(s, h) == null ? '—' : score(s, h) + '/100')}${row('Price', h => h.price ? esc(ctx.money(P.num(h.price))) : '')}${row('≈ Monthly', h => { const m = monthly(s, h); return m ? esc(ctx.money(Math.round(m.total))) : ''; })}${row('Beds / baths', h => `${esc(h.beds)} / ${esc(h.baths)}`)}${row('Sq ft', h => esc(h.sqft))}${row('HOA', h => h.hoa ? esc(ctx.money(P.num(h.hoa))) : '')}${row('Commute', h => esc(h.commute))}
        ${s.criteria.filter(c => P.has(c.name)).map(c => row(c.name, h => '★'.repeat(Math.round(P.num(h.ratings[c.id]))) || '—')).join('')}${row('Pros', h => esc(h.pros))}${row('Cons', h => esc(h.cons))}</tbody></table>`;
    }
  };

  const criteria = {
    id: 'criteria', label: 'What matters', icon: 'star',
    render(ctx) {
      const s = ctx.state, m = s.money;
      return `${u.head({ eyebrow: 'Your priorities', title: 'What matters most', lede: 'Weights from 1 (nice to have) to 5 (must have). Change them and every score updates.' })}
      ${u.panel('Criteria', u.table('criteria', s.criteria, [
        { k: 'name', label: 'Criterion', title: true, w: '1.5fr', ph: 'e.g. Quiet street' },
        { k: 'weight', label: 'Weight', type: 'select', options: [['1', '1 · nice to have'], ['2', '2'], ['3', '3 · important'], ['4', '4'], ['5', '5 · must have']], w: '190px' }
      ], { what: 'criterion', move: true, add: 'Add criterion' }), { icon: 'star' })}
      ${u.panel('Monthly cost assumptions', `<div class="pl-fields">${u.field('Down payment %', 'money.down', m.down, { num: true })}${u.field('Interest rate %', 'money.rate', m.rate, { num: true })}${u.field('Loan term (years)', 'money.years', m.years, { num: true })}${u.field('Home insurance / year', 'money.insurance', m.insurance, { num: true })}</div>`, { icon: 'money', hint: 'Rough planning numbers only — your lender’s quote is what counts.' })}`;
    }
  };

  const notes = {
    id: 'notes', label: 'Notes', icon: 'edit',
    render(ctx) { return `${u.head({ eyebrow: 'Parking lot', title: 'Notes', lede: 'Questions for agents, inspection findings, pre-approval details.' })}${u.notes('notes', ctx.state.notes, { rows: 12 })}`; }
  };

  window.MVHomes = {
    pages: { compare, criteria }, blank, sample, normalize,
    rows: { homes: ctx => home({ name: `Home ${String.fromCharCode(65 + ctx.state.homes.length % 26)}` }), criteria: () => crit('', 3) }
  };
})();
