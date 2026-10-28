/* Side Hustle Tracker App — the tax-season document checklist and preparer page, from Tax Docs. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const CATS = [['income', 'Income'], ['deductions', 'Deductions & credits'], ['home', 'Home & property'], ['invest', 'Investments & retirement'], ['health', 'Health coverage'], ['identity', 'Identity & last year'], ['business', 'Business / self-employed'], ['other', 'Other']];
  const CAT = Object.fromEntries(CATS);
  const STATUS = [['need', 'Still need'], ['have', 'Have it'], ['na', 'Not needed']];
  const STARTER = {
    income: ['W-2 (wages)', '1099-NEC (freelance / contract pay)', '1099-MISC', '1099-INT (interest)', '1099-DIV (dividends)', '1099-B / brokerage year-end summary', '1099-K (payment apps / marketplaces)', '1099-G (unemployment / state refund)', 'SSA-1099 (Social Security)'],
    deductions: ['Charitable donation receipts', 'Medical and dental expenses', '1098-T (tuition)', '1098-E (student loan interest)', 'Childcare provider statements'],
    home: ['1098 (mortgage interest)', 'Property tax statements', 'Energy-efficient improvement receipts', 'Closing statement / 1099-S (if you sold a home)'],
    invest: ['IRA / 401(k) contribution records', '5498 (retirement account)', '1099-R (retirement distributions)', 'Crypto / digital asset records'],
    health: ['1095-A / B / C (health coverage)', 'HSA / FSA statements'],
    identity: ['Photo ID for each filer', 'SSNs / ITINs for everyone on the return', 'Last year’s federal return', 'Last year’s state return', 'Bank routing + account number for the refund'],
    business: ['Income and expense records', 'Estimated tax payments made', 'Mileage log', 'Home office measurements'],
    other: ['Letters or notices from the IRS / state']
  };
  const txt = v => (v == null ? '' : String(v));
  const doc = (cat, label, status, from, note) => ({ id: P.uid(), cat: cat || 'other', label: label || '', status: status || 'need', from: from || '', note: note || '' });
  const starter = () => CATS.flatMap(([c]) => STARTER[c].map(l => doc(c, l)));

  function blank() { return { year: String(new Date().getFullYear() - (new Date().getMonth() < 9 ? 1 : 0)), household: '', docs: starter(), prep: { name: '', contact: '', appt: '', deadline: '', folder: '', ask: '' }, notes: '' }; }
  function sample() {
    const s = blank();
    s.household = 'Alex & Jordan';
    const set = (label, status, from, note) => { const d = s.docs.find(x => x.label === label); if (d) Object.assign(d, { status, from: from || '', note: note || '' }); };
    set('W-2 (wages)', 'have', 'Both employers', 'In the blue folder');
    set('1099-INT (interest)', 'have', 'Credit union', 'Emailed PDF');
    set('1099-DIV (dividends)', 'need', 'Brokerage', 'Usually mid-February');
    set('1099-B / brokerage year-end summary', 'need', 'Brokerage');
    set('1099-NEC (freelance / contract pay)', 'have', 'Studio North', 'Jordan’s side gig');
    ['1099-MISC', '1099-G (unemployment / state refund)', 'SSA-1099 (Social Security)', '1098-T (tuition)', 'Closing statement / 1099-S (if you sold a home)', '1099-R (retirement distributions)', 'Crypto / digital asset records', 'Childcare provider statements'].forEach(l => set(l, 'na'));
    set('Charitable donation receipts', 'have', '', 'Food bank + library');
    set('1098 (mortgage interest)', 'have', 'Lender portal');
    set('Property tax statements', 'have', 'County site');
    set('1095-A / B / C (health coverage)', 'need', 'Employer', 'Arrives by end of January');
    set('Last year’s federal return', 'have', '', 'PDF on the laptop');
    set('Mileage log', 'need', '', 'Export from the phone app');
    s.prep = { name: 'Lee & Park Tax', contact: '(555) 010-4400', appt: D.add(D.today(), 20), deadline: '', folder: 'Drive → Taxes → this year', ask: 'Can Jordan’s side-gig home office count?\nShould we adjust withholding?' };
    s.notes = 'Keep this year’s papers in the blue folder on the shelf.\nScan everything into the Drive folder when it arrives.';
    return s;
  }
  function normalize(s) {
    s.year = txt(s.year); s.household = txt(s.household); s.notes = txt(s.notes);
    s.docs = (Array.isArray(s.docs) ? s.docs : []).filter(x => x && typeof x === 'object').map(x => Object.assign(doc(CAT[x.cat] ? x.cat : 'other', txt(x.label), STATUS.some(t => t[0] === x.status) ? x.status : 'need', txt(x.from), txt(x.note)), { id: txt(x.id) || P.uid() }));
    const p = s.prep || {};
    s.prep = { name: txt(p.name), contact: txt(p.contact), appt: txt(p.appt), deadline: txt(p.deadline), folder: txt(p.folder), ask: txt(p.ask) };
    if (s.ui.hideNa == null) s.ui.hideNa = true;
    return s;
  }
  const counts = s => { const c = { need: 0, have: 0, na: 0 }; s.docs.filter(d => P.has(d.label)).forEach(d => c[d.status]++); return c; };

  const checklist = {
    id: 'checklist', label: 'Checklist', icon: 'check',
    badge: ctx => counts(ctx.state).need || '',
    render(ctx) {
      const s = ctx.state, f = ['need', 'have'].includes(s.ui.f) ? s.ui.f : 'all', c = counts(s);
      const show = d => (f === 'all' || d.status === f) && !(s.ui.hideNa && d.status === 'na' && f === 'all');
      return `${u.head({ eyebrow: `Tax year ${s.year || '—'}${s.household ? ' · ' + s.household : ''}`, title: '<span data-slot="title"></span>', lede: 'Gather papers as they arrive in January and February. Mark what doesn’t apply to you as “not needed” so the list gets shorter.' })}
      <div data-slot="kpis"></div>
      <div class="pl-row tx-tools">${u.chips('ui.f', f, [['all', 'All', c.need + c.have], ['need', 'Still need', c.need], ['have', 'Have it', c.have]], 'Show')}<span class="pl-spacer"></span>${u.switch('ui.hideNa', s.ui.hideNa, `Hide not needed (${c.na})`)}</div>
      ${CATS.map(([k, label]) => {
        const list = s.docs.map((d, i) => Object.assign({ __i: i }, d)).filter(d => d.cat === k && show(d));
        const all = s.docs.filter(d => d.cat === k && d.status !== 'na'), got = all.filter(d => d.status === 'have').length;
        return u.panel(label, `${list.length ? `<ul class="tx-docs">${list.map(d => `<li class="tx-doc is-${d.status}">
            ${u.seg(`docs.${d.__i}.status`, d.status, STATUS, `Status of ${d.label}`)}
            <div class="tx-doc-main">${u.textarea(`docs.${d.__i}.label`, d.label, { label: 'Document', ph: 'Document', cls: 'pl-ci-input tx-label', auto: true, rows: 1 })}
              <div class="tx-doc-sub">${u.input(`docs.${d.__i}.from`, d.from, { label: `From (${d.label})`, ph: 'From whom', cls: 'tx-small' })}${u.input(`docs.${d.__i}.note`, d.note, { label: `Note (${d.label})`, ph: 'Note', cls: 'tx-small tx-note' })}</div></div>
            ${u.iconBtn('close', `Remove ${d.label}`, 'remove', { list: 'docs', i: d.__i, what: d.label })}</li>`).join('')}</ul>` : '<p class="pl-muted">Nothing to show here.</p>'}
          <div class="pl-list-foot">${u.btn('Add document', { sm: true, icon: 'plus', act: 'addDoc', data: { cat: k } })}</div>`, { cls: 'y-panel--flat tx-cat', actions: all.length ? `<span class="pl-pill${got === all.length ? ' pl-pill--good' : ''}">${got}/${all.length}</span>` : '' });
      }).join('')}`;
    },
    slots: {
      title(ctx) { const c = counts(ctx.state); return c.need ? `<em>${c.need}</em> still to gather` : c.have ? 'Everything’s <em>gathered</em>' : 'Tax <em>documents</em>'; },
      kpis(ctx) { const c = counts(ctx.state), n = c.need + c.have; return `<div class="tx-prog"><div class="tx-prog-top"><b class="y-num">${n ? Math.round(c.have / n * 100) : 0}%</b><span>${c.have} of ${n} documents gathered · ${c.na} marked not needed</span></div>${u.meter(n ? c.have / n * 100 : 0, 'Documents gathered')}</div>`; }
    },
    actions: { addDoc(ctx, d) { const s = ctx.state; s.docs.push(doc(d.cat, '', 'need')); ctx.focus(`[data-bind="docs.${s.docs.length - 1}.label"]`); } },
    sheet(ctx) {
      const s = ctx.state, p = s.prep;
      return `<h1>Tax documents · ${esc(s.year)}</h1><p class="pl-sheet-meta">${[s.household, p.name && `Preparer: ${p.name}`, p.appt && `Appointment ${D.full(p.appt)}`].filter(Boolean).map(esc).join(' · ')}</p>
        ${CATS.map(([k, l]) => { const list = s.docs.filter(d => d.cat === k && d.status !== 'na' && P.has(d.label)); return list.length ? `<h2>${esc(l)}</h2><table><tbody>${list.map(d => `<tr><td style="width:6mm"><span class="pl-box${d.status === 'have' ? ' is-on' : ''}"></span></td><td>${esc(d.label)}</td><td>${esc(d.from)}</td><td>${esc(d.note)}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}
        ${p.ask ? `<h2>Questions for the preparer</h2><p style="white-space:pre-line">${esc(p.ask)}</p>` : ''}`;
    }
  };

  const prep = {
    id: 'preparer', label: 'Preparer & dates', icon: 'calendar',
    render(ctx) {
      const s = ctx.state, p = s.prep, n = D.parse(p.appt) ? D.diff(D.today(), p.appt) : null;
      return `${u.head({ eyebrow: 'Filing', title: 'Preparer & dates', meta: n != null && n >= 0 ? `<span class="y-sticker">${I('calendar')}Appointment in ${n} days</span>` : '' })}
      ${u.panel('', `<div class="pl-fields">
        ${u.field('Tax year', 'year', s.year, { num: true })}${u.field('Household', 'household', s.household, { ph: 'Names on the return' })}
        ${u.field('Preparer / software', 'prep.name', p.name, { ph: 'CPA, EA or software' })}${u.field('Contact', 'prep.contact', p.contact, { ph: 'Phone or email' })}
        ${u.field('Appointment', 'prep.appt', p.appt, { type: 'date', rerender: true })}${u.field('Your filing deadline', 'prep.deadline', p.deadline, { type: 'date', hint: 'Check the official date for your situation.' })}
        ${u.field('Where the papers are', 'prep.folder', p.folder, { ph: 'Folder, drawer or drive', cls: 'pl-wide' })}
        ${u.field('Questions to ask', 'prep.ask', p.ask, { type: 'textarea', rows: 4, ph: 'One per line', cls: 'pl-wide' })}</div>`)}`;
    }
  };

  const notes = {
    id: 'notes', label: 'Notes', icon: 'edit',
    render(ctx) { return `${u.head({ eyebrow: 'Parking lot', title: 'Notes', lede: 'Life changes this year, where scans are saved, reminders for next year.' })}${u.notes('notes', ctx.state.notes, { rows: 12 })}`; }
  };

  window.SHTax = { pages: { checklist, prep }, blank, sample, normalize, rows: { docs: () => doc('other') } };
})();
