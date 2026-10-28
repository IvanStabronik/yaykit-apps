/* Client Docs Studio — document builders (pure: data in, printable HTML out) and invoice math.
   One .cd-doc per document. It flows over as many pages as it needs: the preview shows the sheet at real
   width, and printing uses the browser's own page breaks with the margins set in studio.js. */
window.ClientDocs = (function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const has = v => String(v == null ? '' : v).trim() !== '';
  const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  const round2 = n => Math.round((Number(n) || 0) * 100 + 1e-9) / 100;
  const nl = s => esc(s).replace(/\r?\n/g, '<br>');
  const lines = s => String(s || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const ph = (v, placeholder) => has(v) ? esc(v) : `<span class="cd-ph">${esc(placeholder)}</span>`;

  const PAPER = { letter: { w: 215.9, h: 279.4, label: 'US Letter' }, a4: { w: 210, h: 297, label: 'A4' } };
  const MARGIN = 14; // mm, the same in the preview and in print
  /* ink = text-safe on white (AA), deco = lines and shapes only, tint = soft fills */
  const ACCENTS = {
    navy: { label: 'Navy', ink: '#1F3A6B', deco: '#4A6FB5', tint: '#E3EAF7' },
    ink: { label: 'Black', ink: '#1B1B1B', deco: '#8A8A8A', tint: '#EFEFEF' },
    emerald: { label: 'Emerald', ink: '#0F6B4E', deco: '#2FA37A', tint: '#DDF3EA' },
    teal: { label: 'Teal', ink: '#0B5F66', deco: '#2A9AA3', tint: '#DDF1F2' },
    plum: { label: 'Plum', ink: '#5B2F8C', deco: '#9366C9', tint: '#EEE6F8' },
    raspberry: { label: 'Raspberry', ink: '#A3124A', deco: '#E0457B', tint: '#FCE4EE' },
    tangerine: { label: 'Tangerine', ink: '#A34A00', deco: '#F08A2E', tint: '#FFE9D6' },
    gold: { label: 'Gold', ink: '#7A5A00', deco: '#C9A227', tint: '#F8F0D6' }
  };
  const DESIGNS = [['clean', 'Clean'], ['band', 'Bold'], ['classic', 'Classic']];
  const acc = id => ACCENTS[id] || ACCENTS.navy;

  function wrap(inner, o, cls) {
    const p = PAPER[o.paper] || PAPER.letter, a = acc(o.accent);
    return `<article class="cd-doc cd-d-${esc(DESIGNS.some(d => d[0] === o.design) ? o.design : 'clean')} ${cls}" style="--cd-w:${p.w}mm;--cd-h:${p.h}mm;--cd-m:${MARGIN}mm;--cd-ink:${a.ink};--cd-deco:${a.deco};--cd-tint:${a.tint}">${inner}</article>`;
  }

  /* ---------- invoice math ---------- */
  function totals(inv) {
    const rows = (inv.items || []).map(it => {
      const rate = num(it.rate), qty = has(it.qty) ? num(it.qty) : (rate ? 1 : 0);
      return { desc: String(it.desc || ''), qty, rate, amount: round2(qty * rate) };
    }).filter(r => has(r.desc) || r.amount);
    const sub = round2(rows.reduce((a, r) => a + r.amount, 0));
    const d = Math.max(0, num(inv.discount));
    const discount = round2(Math.min(sub, inv.discountKind === 'percent' ? sub * Math.min(d, 100) / 100 : d));
    const taxRate = Math.max(0, num(inv.tax));
    const tax = round2((sub - discount) * taxRate / 100);
    return { rows, sub, discount, taxRate, tax, total: round2(sub - discount + tax) };
  }
  /* next number: keep the prefix and zero padding of the highest existing number of that type */
  function nextNumber(list, type) {
    const prefix = type === 'quote' ? 'Q-' : 'INV-';
    let best = null;
    (list || []).filter(x => x.type === type).forEach(x => {
      const m = /^(.*?)(\d+)\s*$/.exec(String(x.number || ''));
      if (m && (!best || parseInt(m[2], 10) > best.n)) best = { pre: m[1], n: parseInt(m[2], 10), width: m[2].length };
    });
    return best ? best.pre + String(best.n + 1).padStart(best.width, '0') : prefix + '0001';
  }

  /* ---------- shared blocks ---------- */
  function bizBlock(biz) {
    return `<div class="cd-biz">${has(biz.logo) ? `<img class="cd-logo" src="${esc(biz.logo)}" alt="">` : ''}<div><b class="cd-bizname">${ph(biz.name, 'Your business name')}</b>${has(biz.tagline) ? `<span>${esc(biz.tagline)}</span>` : ''}</div></div>`;
  }
  const contactLines = biz => [biz.email, biz.phone, biz.website].filter(has).map(esc).concat(has(biz.address) ? [nl(biz.address)] : []);
  const dl = rows => rows.filter(r => has(r[1])).map(r => `<div><dt>${esc(r[0])}</dt><dd>${r[2] ? r[1] : esc(r[1])}</dd></div>`).join('');
  const block = (title, html, cls) => html ? `<section class="cd-block${cls ? ' ' + cls : ''}"><h3>${esc(title)}</h3>${html}</section>` : '';

  /* ---------- invoice / quote ---------- */
  function invoice(inv, biz, o) {
    const t = totals(inv), quote = inv.type === 'quote', money = o.money, c = inv.client || {};
    const kind = quote ? 'Quote' : 'Invoice';
    const client = [c.name, c.company].filter(has).map(x => `<b>${esc(x)}</b>`).concat([c.email].filter(has).map(esc), has(c.address) ? [nl(c.address)] : []);
    const items = t.rows.length ? t.rows.map(r => `<tr><td>${nl(r.desc)}</td><td class="cd-n">${r.qty}</td><td class="cd-n">${money(r.rate)}</td><td class="cd-n">${money(r.amount)}</td></tr>`).join('')
      : `<tr><td><span class="cd-ph">Add a line item</span></td><td class="cd-n"></td><td class="cd-n"></td><td class="cd-n">${money(0)}</td></tr>`;
    return wrap(`
      <header class="cd-top">${bizBlock(biz)}<div class="cd-title"><span class="cd-kind">${kind}</span><span class="cd-no">${ph(inv.number, quote ? 'Q-0001' : 'INV-0001')}</span></div></header>
      <section class="cd-meta">
        <div class="cd-party"><h3>${quote ? 'Prepared for' : 'Bill to'}</h3><p>${client.join('<br>') || '<span class="cd-ph">Client name</span>'}</p></div>
        <div class="cd-party"><h3>From</h3><p>${contactLines(biz).join('<br>') || '<span class="cd-ph">Your contact details</span>'}</p></div>
        <dl class="cd-facts">${dl([['Date', o.date(inv.date)], [quote ? 'Valid until' : 'Due', o.date(inv.due)], ['PO / reference', inv.po]])}</dl>
      </section>
      ${has(inv.intro) ? `<p class="cd-intro">${nl(inv.intro)}</p>` : ''}
      <table class="cd-items"><thead><tr><th>Description</th><th class="cd-n">Qty</th><th class="cd-n">Rate</th><th class="cd-n">Amount</th></tr></thead><tbody>${items}</tbody></table>
      <div class="cd-sumrow"><dl class="cd-sum">
        ${t.discount || t.tax ? `<div><dt>Subtotal</dt><dd>${money(t.sub)}</dd></div>` : ''}
        ${t.discount ? `<div><dt>Discount${inv.discountKind === 'percent' ? ` (${num(inv.discount)}%)` : ''}</dt><dd>−${money(t.discount)}</dd></div>` : ''}
        ${t.tax ? `<div><dt>${esc(has(inv.taxLabel) ? inv.taxLabel : 'Tax')} (${t.taxRate}%)</dt><dd>${money(t.tax)}</dd></div>` : ''}
        <div class="cd-total"><dt>${quote ? 'Quote total' : inv.status === 'paid' ? 'Total paid' : 'Total due'}</dt><dd>${money(t.total)}</dd></div></dl></div>
      <div class="cd-foot">
        ${block(quote ? 'Next steps' : 'How to pay', has(inv.pay) ? `<p>${nl(inv.pay)}</p>` : '')}
        ${block('Terms', has(inv.terms) ? `<p>${nl(inv.terms)}</p>` : '')}
        ${block('Notes', has(inv.notes) ? `<p>${nl(inv.notes)}</p>` : '')}
      </div>
      ${!quote && inv.status === 'paid' ? '<div class="cd-stamp">Paid</div>' : ''}`, { paper: o.paper, design: inv.design, accent: inv.accent }, 'cd-invoice');
  }

  /* ---------- media kit ---------- */
  function kit(k, o) {
    const stats = (k.stats || []).filter(s => has(s.label) || has(s.value));
    const rates = (k.rates || []).filter(r => has(r.deliverable) || has(r.rate));
    const niches = lines(k.niches), brands = lines(k.brands);
    const initials = String(k.name || '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
    const contact = [k.email, k.website, k.phone, k.location].filter(has).map(esc).join(' &nbsp;·&nbsp; ');
    return wrap(`
      <header class="cd-khead">${has(k.photo) ? `<img class="cd-kphoto" src="${esc(k.photo)}" alt="">` : `<div class="cd-kphoto cd-kinit">${esc(initials)}</div>`}
        <div><span class="cd-kind">Media kit</span><h1 class="cd-kname">${ph(k.name, 'Your name')}</h1>
        ${has(k.handle) || has(k.platforms) ? `<p class="cd-khandle">${[k.handle, k.platforms].filter(has).map(esc).join(' &nbsp;·&nbsp; ')}</p>` : ''}
        ${has(k.tagline) ? `<p class="cd-ktag">${esc(k.tagline)}</p>` : ''}</div></header>
      ${stats.length ? `<div class="cd-stats">${stats.map(s => `<div><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>` : ''}
      <div class="cd-kcols">
        <div>${block('About', has(k.bio) ? `<p>${nl(k.bio)}</p>` : '<p><span class="cd-ph">A short bio: who you are, who follows you, and why brands work with you.</span></p>')}
          ${block('Audience', has(k.audience) ? `<p>${nl(k.audience)}</p>` : '')}</div>
        <div>${block('Topics', niches.length ? `<ul class="cd-tags">${niches.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '')}
          ${block('Worked with', brands.length ? `<ul class="cd-list">${brands.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : '')}</div>
      </div>
      ${rates.length ? block('Rates', `<table class="cd-items"><thead><tr><th>Deliverable</th><th>Includes</th><th class="cd-n">Rate</th></tr></thead><tbody>${rates.map(r => `<tr><td><b>${esc(r.deliverable)}</b></td><td>${esc(r.notes)}</td><td class="cd-n">${has(r.rate) ? (/^[\d.,\s]+$/.test(r.rate) ? o.money(num(r.rate), true) : esc(r.rate)) : ''}</td></tr>`).join('')}</tbody></table>
        ${has(k.rateNote) ? `<p class="cd-small">${nl(k.rateNote)}</p>` : ''}`, 'cd-rates') : ''}
      <footer class="cd-kfoot"><b>Let’s work together</b><span>${contact || '<span class="cd-ph">Your email and website</span>'}</span></footer>`, { paper: o.paper, design: k.design, accent: k.accent }, 'cd-kit');
  }

  /* ---------- shoot brief ---------- */
  function brief(b, biz, o) {
    const shots = (b.shots || []).filter(s => has(s.shot)), del = (b.deliverables || []).filter(d => has(d.item));
    const c = b.client || {}, l = b.location || {};
    const when = [o.date(b.date), has(b.callTime) ? 'Call time ' + o.time(b.callTime) : ''].filter(has).join(' · ');
    const pr = p => `<span class="cd-pri cd-pri--${p === 'Must' ? 'must' : p === 'Nice' ? 'nice' : 'opt'}">${esc(p || 'Must')}</span>`;
    return wrap(`
      <header class="cd-top">${bizBlock(biz)}<div class="cd-title"><span class="cd-kind">Shoot brief</span>${has(b.type) ? `<span class="cd-no">${esc(b.type)}</span>` : ''}</div></header>
      <h1 class="cd-btitle">${ph(b.title, 'Shoot title')}</h1>${when ? `<p class="cd-bwhen">${esc(when)}</p>` : ''}
      <section class="cd-meta cd-meta--2">
        <div class="cd-party"><h3>Client</h3><p>${[c.name, c.company].filter(has).map(x => `<b>${esc(x)}</b>`).concat([c.email, c.phone].filter(has).map(esc)).join('<br>') || '<span class="cd-ph">Client name and contact</span>'}</p>
          ${has(c.notes) ? `<p class="cd-small">${nl(c.notes)}</p>` : ''}</div>
        <div class="cd-party"><h3>Location</h3><p>${[has(l.name) ? `<b>${esc(l.name)}</b>` : '', has(l.address) ? nl(l.address) : ''].filter(Boolean).join('<br>') || '<span class="cd-ph">Where the shoot happens</span>'}</p>
          <dl class="cd-facts cd-facts--stack">${dl([['Access', l.access], ['Parking', l.parking], ['On-site contact', l.contact], ['If the weather turns', l.weather]])}</dl></div>
      </section>
      ${block('Shot list', `<table class="cd-items cd-shots"><thead><tr><th class="cd-box"></th><th>Shot</th><th>Priority</th><th>Notes</th></tr></thead><tbody>${shots.length ? shots.map(s => `<tr><td class="cd-box"><i></i></td><td><b>${esc(s.shot)}</b></td><td>${pr(s.priority)}</td><td>${esc(s.notes)}</td></tr>`).join('')
        : '<tr><td class="cd-box"><i></i></td><td><span class="cd-ph">Add the shots you must not miss</span></td><td></td><td></td></tr>'}</tbody></table>`)}
      ${del.length ? block('Deliverables', `<table class="cd-items"><thead><tr><th>Item</th><th>Qty</th><th>Format</th><th>Due</th></tr></thead><tbody>${del.map(d => `<tr><td><b>${esc(d.item)}</b></td><td>${esc(d.qty)}</td><td>${esc(d.format)}</td><td>${esc(d.due)}</td></tr>`).join('')}</tbody></table>`) : ''}
      <div class="cd-foot">${block('Usage', has(b.usage) ? `<p>${nl(b.usage)}</p>` : '')}${block('Notes', has(b.notes) ? `<p>${nl(b.notes)}</p>` : '')}</div>`, { paper: o.paper, design: b.design, accent: b.accent }, 'cd-brief');
  }

  return { esc, has, num, round2, lines, PAPER, MARGIN, ACCENTS, DESIGNS, totals, nextNumber, invoice, kit, brief };
})();
