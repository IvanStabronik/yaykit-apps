/* Small Business Planner — invoices and quotes, from Client Docs Studio.
   Editing lives here; document layout and invoice math live in docs.js; biz.js puts this page into the app. */
(function () {
  'use strict';
  const P = window.Planner, C = window.ClientDocs, ui = P.ui, esc = ui.esc, I = ui.icon, has = P.has;

  /* ---------- defaults ---------- */
  const newInvoice = (type, number) => ({ type: type || 'invoice', number: number || (type === 'quote' ? 'Q-0001' : 'INV-0001'), date: P.D.today(), due: '', po: '', status: 'draft',
    client: { name: '', company: '', email: '', address: '' }, items: [{ desc: '', qty: '1', rate: '' }], taxLabel: 'Tax', tax: '', discount: '', discountKind: 'amount',
    intro: '', pay: '', terms: '', notes: '', design: 'clean', accent: 'navy' });
  const blankBiz = () => ({ name: '', tagline: '', email: '', phone: '', website: '', address: '', logo: '' });
  function blank() { return { paper: 'letter', biz: blankBiz(), invoices: [newInvoice('invoice')], cur: 0 }; }
  function normalize(s) {
    if (!C.PAPER[s.paper]) s.paper = 'letter';
    s.biz = Object.assign(blankBiz(), s.biz && typeof s.biz === 'object' ? s.biz : {});
    if (!Array.isArray(s.invoices) || !s.invoices.length) s.invoices = [newInvoice('invoice')];
    s.invoices = s.invoices.map(x => { const b = Object.assign(newInvoice(x && x.type), x || {}); b.client = Object.assign({ name: '', company: '', email: '', address: '' }, b.client || {}); if (!Array.isArray(b.items)) b.items = []; return b; });
    s.cur = Math.max(0, Math.min(s.invoices.length - 1, parseInt(s.cur, 10) || 0));
    return s;
  }

  /* ---------- shared pieces ---------- */
  const opts = ctx => ({ paper: ctx.state.paper, money: (n, whole) => ctx.money(n, { cents: !whole }), date: iso => P.D.full(iso), time: t => P.D.time(t) });
  const inv = st => st.invoices[st.cur];
  const BUILD = { invoice: ctx => C.invoice(inv(ctx.state), ctx.state.biz, opts(ctx)) };

  function swatches(bind, value) {
    return `<div class="cd-swatches" role="group" aria-label="Color">${Object.keys(C.ACCENTS).map(id => {
      const a = C.ACCENTS[id], on = id === value;
      return `<button type="button" class="cd-swatch${on ? ' is-on' : ''}" data-act="set" data-bind="${bind}" data-value="${id}" aria-pressed="${on}" aria-label="${esc(a.label)}" title="${esc(a.label)}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="${a.tint}"/><path d="M12 2a10 10 0 0 1 0 20z" fill="${a.ink}"/></svg></button>`;
    }).join('')}</div>`;
  }
  const look = (key, d) => ui.panel('Look', `<div class="pl-stack"><div class="y-field"><span class="y-label">Design</span>${ui.seg(key + '.design', d.design, C.DESIGNS, 'Design')}</div>
    <div class="y-field"><span class="y-label">Color</span>${swatches(key + '.accent', d.accent)}</div></div>`, { icon: 'sparkle' });
  function upload(path, value, label, what) {
    return `<div class="cd-upload">${has(value) ? `<img src="${esc(value)}" alt="${esc(what)} preview">` : ''}
      <label class="y-btn y-btn--secondary y-btn--sm cd-filebtn">${I('upload')}<span>${has(value) ? 'Replace ' + esc(what) : esc(label)}</span><input class="y-sr" type="file" accept="image/*" data-upload="${path}"></label>
      ${has(value) ? ui.btn('Remove', { kind: 'ghost', sm: true, icon: 'trash', act: 'clearImage', data: { path } }) : ''}</div>`;
  }
  function bizPanel(ctx) {
    const b = ctx.state.biz;
    return ui.fold('Your business', `<div class="pl-stack"><div class="pl-fields">
      ${ui.field('Business or your name', 'biz.name', b.name, { ph: 'Ortiz Studio' })}
      ${ui.field('Tagline', 'biz.tagline', b.tagline, { ph: 'Photography & content', optional: true })}
      ${ui.field('Email', 'biz.email', b.email, { ph: 'hello@example.com' })}
      ${ui.field('Phone', 'biz.phone', b.phone, { ph: '+1 555 000 0000', optional: true })}
      ${ui.field('Website', 'biz.website', b.website, { ph: 'example.com', optional: true })}
      ${ui.field('Address', 'biz.address', b.address, { type: 'textarea', rows: 2, ph: 'Street\nCity, State ZIP', optional: true })}</div>
      <div class="y-field"><span class="y-label">Logo <span class="pl-opt">optional</span></span>${upload('biz.logo', b.logo, 'Upload a logo', 'logo')}</div></div>`,
    { key: 'biz', icon: 'briefcase', open: !has(b.name), meta: has(b.name) ? `<span class="pl-pill">${esc(b.name)}</span>` : '<span class="pl-pill pl-pill--warn">Add your details</span>' });
  }
  const head = (ctx, title, lede) => ui.head({ eyebrow: 'Invoices & quotes', title, lede, meta: `${ui.seg('paper', ctx.state.paper, [['letter', 'US Letter'], ['a4', 'A4']], 'Paper size')}<span class="pl-pill pl-pill--world" id="cdPages"></span>` });
  const work = (editor, tip) => `<div class="cd-work"><div class="cd-edit">${editor}</div><aside class="cd-side" aria-label="Document preview">
    <div class="cd-view" data-slot="preview"></div><div class="cd-printbar">${ui.btn('Print / save PDF', { kind: 'world', icon: 'print', act: 'print' })}<span class="pl-hint">${tip}</span></div></aside></div>`;
  const preview = ctx => `<div class="cd-scale">${BUILD[ctx.page.id](ctx)}</div>`;
  const sheet = ctx => BUILD[ctx.page.id](ctx);

  /* =====================================================================
     INVOICES & QUOTES
     ===================================================================== */
  const STATUS = [['draft', 'Draft'], ['sent', 'Sent'], ['paid', 'Paid']];
  const docLabel = (ctx, x) => { const t = C.totals(x); return `${x.number || (x.type === 'quote' ? 'Quote' : 'Invoice')} · ${x.client.company || x.client.name || 'no client yet'} · ${ctx.money(t.total, { cents: true })}${x.type === 'invoice' ? ' · ' + x.status : ''}`; };
  const invoicePage = {
    id: 'invoice', label: 'Invoices & quotes', icon: 'doc',
    badge: ctx => ctx.state.invoices.filter(x => x.type === 'invoice' && x.status === 'sent').length || '',
    render(ctx) {
      const st = ctx.state, x = inv(st), base = `invoices.${st.cur}`, quote = x.type === 'quote';
      const editor = [
        ui.panel('Document', `<div class="pl-stack">
          <div class="y-field cd-docpick"><label class="y-label" for="cdDoc">Saved documents</label><select class="y-select" id="cdDoc" data-onchange="openDoc">${st.invoices.map((d, i) => `<option value="${i}"${i === st.cur ? ' selected' : ''}>${esc(docLabel(ctx, d))}</option>`).join('')}</select></div>
          <div class="pl-row">${ui.btn('New invoice', { icon: 'plus', sm: true, act: 'newDoc', data: { type: 'invoice' } })}${ui.btn('New quote', { icon: 'plus', sm: true, act: 'newDoc', data: { type: 'quote' } })}
            ${ui.btn('Duplicate', { icon: 'doc', sm: true, kind: 'ghost', act: 'dupDoc' })}${quote ? ui.btn('Turn into invoice', { icon: 'next', sm: true, kind: 'ghost', act: 'toInvoice' }) : ''}
            ${ui.btn('Delete', { icon: 'trash', sm: true, kind: 'ghost', act: 'delDoc', disabled: st.invoices.length < 2 })}</div>
          <div class="pl-fields">
            ${ui.field(quote ? 'Quote number' : 'Invoice number', `${base}.number`, x.number, { ph: quote ? 'Q-0001' : 'INV-0001' })}
            ${ui.field('Date', `${base}.date`, x.date, { type: 'date' })}
            ${ui.field(quote ? 'Valid until' : 'Due date', `${base}.due`, x.due, { type: 'date' })}
            ${ui.field('PO / reference', `${base}.po`, x.po, { ph: 'PO-7781', optional: true })}</div>
          ${quote ? '' : `<div class="y-field"><span class="y-label">Status</span>${ui.seg(`${base}.status`, x.status, STATUS, 'Status')}</div>`}
          ${!quote && x.status === 'paid' ? (x.logged ? `<p class="sb-logged">${ui.pill('In the profit tracker', 'good')}</p>` : `<div class="pl-row">${ui.btn('Add to profit tracker', { icon: 'plus', sm: true, kind: 'world', act: 'logInvoice' })}<span class="pl-hint">Logs the total as income, dated today.</span></div>`) : ''}</div>`, { icon: 'doc' }),
        ui.panel(quote ? 'Prepared for' : 'Bill to', `<div class="pl-fields">
          ${ui.field('Contact name', `${base}.client.name`, x.client.name, { ph: 'Jordan Hale' })}
          ${ui.field('Company', `${base}.client.company`, x.client.company, { ph: 'Northwind Home', optional: true })}
          ${ui.field('Email', `${base}.client.email`, x.client.email, { ph: 'client@example.com', optional: true })}
          ${ui.field('Address', `${base}.client.address`, x.client.address, { type: 'textarea', rows: 2, ph: 'Street\nCity, State ZIP', optional: true })}</div>`, { icon: 'user' }),
        ui.panel('Line items', `${ui.table(`${base}.items`, x.items, [
          { k: 'desc', label: 'Description', ph: 'What you did or sold', w: 'minmax(0,2.2fr)' }, { k: 'qty', label: 'Qty', num: true, ph: '1', w: '64px' }, { k: 'rate', label: 'Rate', num: true, ph: '0', w: '92px' }
        ], { what: 'line', add: 'Add line', empty: 'No lines yet.' })}
          <div class="pl-fields cd-money">
            ${ui.field('Discount', `${base}.discount`, x.discount, { num: true, ph: '0' })}
            <div class="y-field"><span class="y-label">Discount is</span>${ui.seg(`${base}.discountKind`, x.discountKind, [['amount', 'Amount'], ['percent', '%']], 'Discount type')}</div>
            ${ui.field('Tax %', `${base}.tax`, x.tax, { num: true, ph: '0' })}
            ${ui.field('Tax name', `${base}.taxLabel`, x.taxLabel, { ph: 'Sales tax' })}</div>
          <div data-slot="sum"></div>`, { icon: 'list' }),
        ui.panel('Wording', `<div class="pl-stack">
          ${ui.field('Opening line', `${base}.intro`, x.intro, { type: 'textarea', rows: 2, ph: 'Thank you for…', optional: true })}
          ${ui.field(quote ? 'Next steps' : 'How to pay', `${base}.pay`, x.pay, { type: 'textarea', rows: 2, ph: quote ? 'Reply to book. A deposit holds the date.' : 'Bank transfer, card link, check…', optional: true })}
          ${ui.field('Terms', `${base}.terms`, x.terms, { type: 'textarea', rows: 2, ph: 'Payment due within 14 days.', optional: true })}
          ${ui.field('Notes', `${base}.notes`, x.notes, { type: 'textarea', rows: 2, ph: 'Anything else for the client', optional: true })}</div>`, { icon: 'edit' }),
        bizPanel(ctx), look(base, x)].join('');
      return head(ctx, quote ? 'Send a <em>quote</em>' : 'Send an <em>invoice</em>', 'Fill it in once, keep every invoice and quote in one place, and print a clean PDF to send.') +
        work(editor, 'Choose “Save as PDF” in the print dialog to get a file you can email.');
    },
    slots: {
      preview,
      sum(ctx) { const t = C.totals(inv(ctx.state)); return `<p class="cd-sumline">Subtotal <b class="y-num">${ctx.money(t.sub, { cents: true })}</b>${t.discount ? ` · discount <b class="y-num">−${ctx.money(t.discount, { cents: true })}</b>` : ''}${t.tax ? ` · tax <b class="y-num">${ctx.money(t.tax, { cents: true })}</b>` : ''} · total <b class="y-num cd-sumtotal">${ctx.money(t.total, { cents: true })}</b></p>`; }
    },
    actions: {
      logInvoice(ctx) {
        const st = ctx.state, x = inv(st), t = C.totals(x);
        if (x.logged || !t.total) return false;
        st.ledger.lines.push({ kind: 'income', date: P.D.today(), label: `Invoice ${x.number}${x.client.company || x.client.name ? ' · ' + (x.client.company || x.client.name) : ''}`, cat: 'Sales', amount: String(t.total) });
        x.logged = true;
        ctx.toast(`Added ${ctx.money(t.total, { cents: true })} to the profit tracker`);
      },
      openDoc(ctx, d) { ctx.state.cur = Math.max(0, Math.min(ctx.state.invoices.length - 1, +d.value || 0)); },
      newDoc(ctx, d) {
        const st = ctx.state, prev = inv(st), type = d.type === 'quote' ? 'quote' : 'invoice';
        const n = Object.assign(newInvoice(type, C.nextNumber(st.invoices, type)), { design: prev.design, accent: prev.accent, taxLabel: prev.taxLabel, tax: prev.tax, pay: type === prev.type ? prev.pay : '', terms: type === prev.type ? prev.terms : '' });
        st.invoices.unshift(n); st.cur = 0;
        ctx.focus(`[data-bind="invoices.0.client.name"]`);
        ctx.toast(`New ${type} ${n.number}`);
      },
      dupDoc(ctx) {
        const st = ctx.state, copy = P.clone(inv(st));
        Object.assign(copy, { number: C.nextNumber(st.invoices, copy.type), date: P.D.today(), status: 'draft', logged: false });
        st.invoices.unshift(copy); st.cur = 0;
        ctx.toast(`Copied as ${copy.number}`);
      },
      toInvoice(ctx) {
        const st = ctx.state, copy = P.clone(inv(st));
        Object.assign(copy, { type: 'invoice', number: C.nextNumber(st.invoices, 'invoice'), date: P.D.today(), due: P.D.add(P.D.today(), 14), status: 'draft', pay: '', intro: '', logged: false });
        st.invoices.unshift(copy); st.cur = 0;
        ctx.toast(`Invoice ${copy.number} created from the quote`);
      },
      async delDoc(ctx) {
        const st = ctx.state, x = inv(st);
        if (st.invoices.length < 2) return false;
        if (!(await ctx.confirm({ title: `Delete ${x.number || 'this document'}?`, body: 'It will be removed from this device.', ok: 'Delete', danger: true }))) return false;
        ctx.remember(); st.invoices.splice(st.cur, 1); st.cur = Math.min(st.cur, st.invoices.length - 1);
        ctx.undoToast(`Deleted ${x.number || 'document'}`);
      }
    },
    sheet
  };

  /* ---------- preview scale, page size, image upload ---------- */
  const pageTag = document.createElement('style');
  document.head.appendChild(pageTag);
  const MM = 96 / 25.4;
  function fit(ctx) {
    const p = C.PAPER[ctx.state.paper] || C.PAPER.letter;
    pageTag.textContent = `@media print{@page{size:${p.w}mm ${p.h}mm;margin:${C.MARGIN}mm}}`;
    document.querySelectorAll('.cd-view').forEach(view => {
      const inner = view.querySelector('.cd-scale'), doc = inner && inner.querySelector('.cd-doc');
      if (!doc) return;
      const cs = getComputedStyle(view), avail = view.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const w = doc.offsetWidth, s = Math.min(1, avail / w);
      inner.style.transform = `scale(${s})`;
      inner.style.marginLeft = Math.max(0, (avail - w * s) / 2) + 'px';
      view.style.height = (inner.offsetHeight * s + parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)) + 'px';
      // pages it will take when printed: content height over the printable height of one page
      const pad = C.MARGIN * MM * 2, pages = Math.max(1, Math.ceil((doc.scrollHeight - pad - 2) / (p.h * MM - pad)));
      const chip = document.getElementById('cdPages');
      if (chip) chip.textContent = `${P.plural(pages, 'page')} · ${p.label}`;
    });
  }
  window.SBInvoices = {
    page: invoicePage, bizPanel, blank, normalize, newInvoice, fit,
    rows: { items: () => ({ desc: '', qty: '1', rate: '' }) },
    actions: { clearImage(c, d) { P.set(c.state, d.path, ''); } }
  };
  window.addEventListener('resize', () => { if (window.__planner) fit(window.__planner); }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (window.__planner) fit(window.__planner); });

  // logo / photo: downscale before saving so browser storage stays small
  document.addEventListener('change', e => {
    const input = e.target.closest && e.target.closest('input[type=file][data-upload]');
    if (!input || !input.files || !input.files[0]) return;
    const ctx = window.__planner;
    const file = input.files[0], path = input.dataset.upload, max = 360;
    if (!/^image\//.test(file.type)) { ctx.toast('Please choose an image file'); return; }
    const reader = new FileReader();
    reader.onerror = () => ctx.toast('Could not read that image');
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => ctx.toast('Could not read that image');
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas');
        cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k));
        const g = cv.getContext('2d');
        const png = path === 'biz.logo' && /png|svg|webp|gif/.test(file.type); // keep transparency for logos
        if (!png) { g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); }
        g.drawImage(img, 0, 0, cv.width, cv.height);
        P.set(ctx.state, path, png ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', 0.86));
        ctx.save(); ctx.render(); ctx.toast('Image added');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
})();
