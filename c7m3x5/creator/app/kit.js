/* Content Creator Planner App — the one-page media kit (editor + printable preview), from Client Docs Studio. app.js puts this page into the app. */
(function () {
  'use strict';
  const P = window.Planner, C = window.ClientDocs, ui = P.ui, esc = ui.esc, I = ui.icon, has = P.has;

  /* ---------- defaults ---------- */
  const newInvoice = (type, number) => ({ type: type || 'invoice', number: number || (type === 'quote' ? 'Q-0001' : 'INV-0001'), date: P.D.today(), due: '', po: '', status: 'draft',
    client: { name: '', company: '', email: '', address: '' }, items: [{ desc: '', qty: '1', rate: '' }], taxLabel: 'Tax', tax: '', discount: '', discountKind: 'amount',
    intro: '', pay: '', terms: '', notes: '', design: 'clean', accent: 'navy' });
  const blankKit = () => ({ name: '', handle: '', platforms: '', tagline: '', bio: '', audience: '', niches: '', brands: '', location: '', email: '', website: '', phone: '', photo: '',
    stats: [{ label: 'Followers', value: '' }, { label: 'Avg. engagement', value: '' }, { label: 'Monthly reach', value: '' }], rates: [{ deliverable: '', rate: '', notes: '' }], rateNote: '', design: 'band', accent: 'plum' });
  const blankBrief = () => ({ title: '', type: '', date: '', callTime: '', client: { name: '', company: '', email: '', phone: '', notes: '' },
    location: { name: '', address: '', access: '', parking: '', contact: '', weather: '' }, shots: [{ shot: '', priority: 'Must', notes: '' }], deliverables: [{ item: '', qty: '', format: '', due: '' }],
    usage: '', notes: '', design: 'clean', accent: 'teal' });
  const blankBiz = () => ({ name: '', tagline: '', email: '', phone: '', website: '', address: '', logo: '' });
  function blank() { return { paper: 'letter', biz: blankBiz(), invoices: [newInvoice('invoice')], cur: 0, kit: blankKit(), brief: blankBrief() }; }
  function sample() {
    const s = blank(), t = P.D.today();
    s.biz = { name: 'Ortiz Studio', tagline: 'Photography & content', email: 'hello@ortizstudio.example', phone: '+1 555 014 2200', website: 'ortizstudio.example', address: '412 Pier Ave, Suite 3\nPortland, OR 97214', logo: '' };
    const client = { name: 'Jordan Hale', company: 'Northwind Home', email: 'jordan@northwind.example', address: '500 Commerce St\nPortland, OR 97209' };
    s.invoices = [
      Object.assign(newInvoice('invoice', 'INV-1042'), { date: t, due: P.D.add(t, 14), po: 'PO-7781', status: 'sent', client, tax: '0', discount: '10', discountKind: 'percent',
        intro: 'Thank you for a great shoot day. Here is the invoice for the spring lookbook.',
        items: [{ desc: 'Spring lookbook shoot — full day on location', qty: '1', rate: '1800' }, { desc: 'Retouching, edited selects', qty: '40', rate: '18' }, { desc: 'Studio and rooftop hire', qty: '1', rate: '350' }, { desc: 'Social vertical crops', qty: '12', rate: '12' }],
        pay: 'Bank transfer (ACH) preferred — details on request.\nOr pay by card: ortizstudio.example/pay', terms: 'Payment due within 14 days. Late payments may incur a 1.5% monthly fee.', notes: 'Returning client discount applied. Thank you!' }),
      Object.assign(newInvoice('invoice', 'INV-1041'), { date: P.D.add(t, -32), due: P.D.add(t, -18), status: 'paid', client: { name: 'Priya Shah', company: 'Cedar & Salt Co.', email: 'priya@cedarsalt.example', address: '' },
        items: [{ desc: 'Product photography — 24 items on white', qty: '24', rate: '35' }, { desc: 'Rush delivery', qty: '1', rate: '120' }], pay: 'Bank transfer (ACH) preferred.', terms: 'Payment due within 14 days.' }),
      Object.assign(newInvoice('quote', 'Q-0018'), { date: t, due: P.D.add(t, 30), client: { name: 'Sam Rivera', company: 'Trailbrew Coffee', email: 'sam@trailbrew.example', address: '' }, tax: '0',
        intro: 'Here is the estimate for the autumn menu shoot we talked about.', items: [{ desc: 'Half-day studio shoot — menu and lifestyle', qty: '1', rate: '950' }, { desc: 'Edited selects', qty: '25', rate: '18' }, { desc: 'Food stylist (half day)', qty: '1', rate: '300' }],
        pay: 'Reply to this quote to book. A 30% deposit holds the date.', terms: 'Quote valid for 30 days.' })];
    s.cur = 0;
    s.kit = Object.assign(blankKit(), { name: 'Elena Ortiz', handle: '@elenaortizphoto', platforms: 'Instagram · TikTok · YouTube', tagline: 'Coastal living, slow travel and small-space design',
      bio: 'I help home and travel brands reach people who care about calm spaces, practical style and places worth lingering in.\n\nBased between Portland and the Oregon coast. I shoot, write and edit everything myself.',
      audience: '72% women · 25–44 · 61% US, 14% Canada, 9% UK', niches: 'Home & living\nSlow travel\nSmall-space design\nSustainable lifestyle', brands: 'Northwind Home\nCedar & Salt Co.\nTrailbrew Coffee\nLumen Linens',
      location: 'Portland, OR', email: 'collabs@ortizstudio.example', website: 'ortizstudio.example',
      stats: [{ label: 'Instagram', value: '86K' }, { label: 'TikTok', value: '124K' }, { label: 'Avg. engagement', value: '4.8%' }, { label: 'Monthly reach', value: '410K' }],
      rates: [{ deliverable: 'Instagram Reel (15–30 s)', rate: '850', notes: '1 revision · 90 days usage' }, { deliverable: 'Carousel post (5–8 slides)', rate: '650', notes: 'Caption and cover included' },
        { deliverable: 'Story set (3–5 frames)', rate: '350', notes: 'Link sticker available' }, { deliverable: 'TikTok + Reel package', rate: '1400', notes: 'Same concept, native edits' }],
      rateNote: 'Rates are a starting point — happy to build a package for longer partnerships.' });
    s.brief = Object.assign(blankBrief(), { title: 'Northwind spring lookbook', type: 'Brand · product + lifestyle', date: P.D.add(t, 12), callTime: '08:30',
      client: { name: 'Jordan Hale', company: 'Northwind Home', email: 'jordan@northwind.example', phone: '+1 555 014 2201', notes: 'Art director on set. Warm morning light; avoid harsh midday.' },
      location: { name: 'Harbor Loft Studio + rooftop', address: '412 Pier Ave, Suite 3\nPortland, OR 97214', access: 'Freight elevator code 4412. Rooftop unlocks after 10:00.', parking: '2 reserved spots in lot B (14–15).', contact: 'Building desk +1 555 014 0090', weather: 'Rain: stay indoors — product table and window portraits.' },
      shots: [{ shot: 'Hero flat lay, linen set', priority: 'Must', notes: 'Natural light, soft shadow' }, { shot: 'Model seated by window, product in hand', priority: 'Must', notes: '3 wardrobe swaps' },
        { shot: 'Detail: fabric texture and label', priority: 'Nice', notes: 'Macro + 50 mm' }, { shot: 'Rooftop walking sequence', priority: 'Must', notes: 'Golden hour backup 17:45' }, { shot: 'Behind the scenes for social', priority: 'If time', notes: 'Phone is fine' }],
      deliverables: [{ item: 'Edited selects (web + print)', qty: '40', format: 'JPEG + TIFF', due: '10 business days' }, { item: 'Hero crops for homepage', qty: '3', format: 'JPEG 3000 px', due: '5 business days' }, { item: 'Social vertical crops', qty: '12', format: 'JPEG 1080×1350', due: 'With gallery' }],
      usage: 'Web, social and print catalog for 24 months. No exclusive buyout unless agreed in writing.', notes: 'Bring bounce and 2 softboxes. Client delivers products the day before. Lunch ordered for 12:30.' });
    return s;
  }
  function normalize(s) {
    if (!C.PAPER[s.paper]) s.paper = 'letter';
    s.biz = Object.assign(blankBiz(), s.biz && typeof s.biz === 'object' ? s.biz : {});
    if (!Array.isArray(s.invoices) || !s.invoices.length) s.invoices = [newInvoice('invoice')];
    s.invoices = s.invoices.map(x => { const b = Object.assign(newInvoice(x && x.type), x || {}); b.client = Object.assign({ name: '', company: '', email: '', address: '' }, b.client || {}); if (!Array.isArray(b.items)) b.items = []; return b; });
    s.cur = Math.max(0, Math.min(s.invoices.length - 1, parseInt(s.cur, 10) || 0));
    s.kit = Object.assign(blankKit(), s.kit && typeof s.kit === 'object' ? s.kit : {});
    s.brief = Object.assign(blankBrief(), s.brief && typeof s.brief === 'object' ? s.brief : {});
    s.brief.client = Object.assign(blankBrief().client, s.brief.client || {});
    s.brief.location = Object.assign(blankBrief().location, s.brief.location || {});
    ['stats', 'rates'].forEach(k => { if (!Array.isArray(s.kit[k])) s.kit[k] = []; });
    ['shots', 'deliverables'].forEach(k => { if (!Array.isArray(s.brief[k])) s.brief[k] = []; });
    return s;
  }

  /* ---------- shared pieces ---------- */
  const opts = ctx => ({ paper: ctx.state.paper, money: (n, whole) => ctx.money(n, { cents: !whole }), date: iso => P.D.full(iso), time: t => P.D.time(t) });
  const inv = st => st.invoices[st.cur];
  const BUILD = { invoice: ctx => C.invoice(inv(ctx.state), ctx.state.biz, opts(ctx)), kit: ctx => C.kit(ctx.state.kit, opts(ctx)), brief: ctx => C.brief(ctx.state.brief, ctx.state.biz, opts(ctx)) };

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
  const head = (ctx, title, lede) => ui.head({ eyebrow: 'Media kit', title, lede, meta: `${ui.seg('paper', ctx.state.paper, [['letter', 'US Letter'], ['a4', 'A4']], 'Paper size')}<span class="pl-pill pl-pill--world" id="cdPages"></span>` });
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
          ${quote ? '' : `<div class="y-field"><span class="y-label">Status</span>${ui.seg(`${base}.status`, x.status, STATUS, 'Status')}</div>`}</div>`, { icon: 'doc' }),
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
        Object.assign(copy, { number: C.nextNumber(st.invoices, copy.type), date: P.D.today(), status: 'draft' });
        st.invoices.unshift(copy); st.cur = 0;
        ctx.toast(`Copied as ${copy.number}`);
      },
      toInvoice(ctx) {
        const st = ctx.state, copy = P.clone(inv(st));
        Object.assign(copy, { type: 'invoice', number: C.nextNumber(st.invoices, 'invoice'), date: P.D.today(), due: P.D.add(P.D.today(), 14), status: 'draft', pay: '', intro: '' });
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

  /* =====================================================================
     MEDIA KIT
     ===================================================================== */
  const kitPage = {
    id: 'kit', label: 'Media kit', icon: 'star',
    render(ctx) {
      const k = ctx.state.kit;
      const editor = [
        ui.panel('About you', `<div class="pl-stack"><div class="pl-fields">
          ${ui.field('Name', 'kit.name', k.name, { ph: 'Elena Ortiz' })}
          ${ui.field('Handle', 'kit.handle', k.handle, { ph: '@yourhandle' })}
          ${ui.field('Platforms', 'kit.platforms', k.platforms, { ph: 'Instagram · TikTok · YouTube', wide: true })}
          ${ui.field('One-line pitch', 'kit.tagline', k.tagline, { ph: 'Coastal living, slow travel and small-space design', wide: true })}
          ${ui.field('Bio', 'kit.bio', k.bio, { type: 'textarea', rows: 4, ph: 'Who you are, who follows you, why brands work with you.', wide: true })}
          ${ui.field('Audience', 'kit.audience', k.audience, { type: 'textarea', rows: 2, ph: '72% women · 25–44 · 61% US', optional: true, wide: true })}</div>
          <div class="y-field"><span class="y-label">Photo <span class="pl-opt">optional</span></span>${upload('kit.photo', k.photo, 'Upload a photo', 'photo')}</div></div>`, { icon: 'user' }),
        ui.panel('Your numbers', ui.table('kit.stats', k.stats, [{ k: 'value', label: 'Number', ph: '86K', w: '110px' }, { k: 'label', label: 'What it is', ph: 'Instagram followers' }], { what: 'number', add: 'Add number', move: true, empty: 'Add follower counts, reach or engagement.' }),
          { icon: 'chart', hint: 'Four or fewer fit on one row.' }),
        ui.panel('Rates', `${ui.table('kit.rates', k.rates, [{ k: 'deliverable', label: 'Deliverable', ph: 'Instagram Reel', w: 'minmax(0,1.4fr)' }, { k: 'notes', label: 'Includes', ph: '1 revision', w: 'minmax(0,1.2fr)' }, { k: 'rate', label: 'Rate', ph: '850', w: '88px' }], { what: 'rate', add: 'Add rate', empty: 'Leave empty to send a kit without prices.' })}
          ${ui.field('Line under the rates', 'kit.rateNote', k.rateNote, { ph: 'Happy to build a package for longer partnerships.', optional: true })}`, { icon: 'money', hint: 'Type a number, or words like “from 500” or “on request”.' }),
        ui.panel('Topics and brands', `<div class="pl-fields">
          ${ui.field('Topics — one per line', 'kit.niches', k.niches, { type: 'textarea', rows: 4, ph: 'Home & living\nSlow travel' })}
          ${ui.field('Brands you’ve worked with — one per line', 'kit.brands', k.brands, { type: 'textarea', rows: 4, ph: 'Northwind Home', optional: true })}</div>`, { icon: 'list' }),
        ui.panel('Contact', `<div class="pl-fields">
          ${ui.field('Email', 'kit.email', k.email, { ph: 'collabs@example.com' })}${ui.field('Website', 'kit.website', k.website, { ph: 'example.com', optional: true })}
          ${ui.field('Phone', 'kit.phone', k.phone, { ph: '+1 555 000 0000', optional: true })}${ui.field('Based in', 'kit.location', k.location, { ph: 'Portland, OR', optional: true })}</div>`, { icon: 'mail' }),
        look('kit', k)].join('');
      return head(ctx, 'Your <em>media kit</em>', 'One page brands can skim in a minute: who you are, your numbers and what working with you costs.') +
        work(editor, 'Update your numbers, print to PDF, attach it to your pitch email.');
    },
    slots: { preview }, sheet
  };

  /* =====================================================================
     SHOOT BRIEF
     ===================================================================== */
  const PRIORITY = ['Must', 'Nice', 'If time'];
  const briefPage = {
    id: 'brief', label: 'Shoot brief', icon: 'eye',
    render(ctx) {
      const b = ctx.state.brief;
      const editor = [
        ui.panel('The shoot', `<div class="pl-fields">
          ${ui.field('Shoot title', 'brief.title', b.title, { ph: 'Northwind spring lookbook', wide: true })}
          ${ui.field('Type', 'brief.type', b.type, { ph: 'Brand · product + lifestyle', wide: true, optional: true })}
          ${ui.field('Date', 'brief.date', b.date, { type: 'date' })}${ui.field('Call time', 'brief.callTime', b.callTime, { type: 'time' })}</div>`, { icon: 'calendar' }),
        ui.panel('Client', `<div class="pl-fields">
          ${ui.field('Contact name', 'brief.client.name', b.client.name, { ph: 'Jordan Hale' })}${ui.field('Company', 'brief.client.company', b.client.company, { ph: 'Northwind Home', optional: true })}
          ${ui.field('Email', 'brief.client.email', b.client.email, { ph: 'client@example.com', optional: true })}${ui.field('Phone', 'brief.client.phone', b.client.phone, { ph: '+1 555 000 0000', optional: true })}
          ${ui.field('What the client wants', 'brief.client.notes', b.client.notes, { type: 'textarea', rows: 2, ph: 'Mood, must-haves, who is on set.', wide: true, optional: true })}</div>`, { icon: 'user' }),
        ui.panel('Location', `<div class="pl-fields">
          ${ui.field('Place', 'brief.location.name', b.location.name, { ph: 'Harbor Loft Studio', wide: true })}
          ${ui.field('Address', 'brief.location.address', b.location.address, { type: 'textarea', rows: 2, ph: 'Street\nCity', wide: true })}
          ${ui.field('Access', 'brief.location.access', b.location.access, { ph: 'Door code, elevator, keys', optional: true })}${ui.field('Parking', 'brief.location.parking', b.location.parking, { ph: 'Where to park and load in', optional: true })}
          ${ui.field('On-site contact', 'brief.location.contact', b.location.contact, { ph: 'Name and phone', optional: true })}${ui.field('If the weather turns', 'brief.location.weather', b.location.weather, { ph: 'Plan B', optional: true })}</div>`, { icon: 'home' }),
        ui.panel('Shot list', ui.table('brief.shots', b.shots, [{ k: 'shot', label: 'Shot', ph: 'Hero flat lay', w: 'minmax(0,1.5fr)' }, { k: 'priority', label: 'Priority', type: 'select', options: PRIORITY, w: '112px' }, { k: 'notes', label: 'Notes', ph: 'Light, lens, wardrobe' }],
          { what: 'shot', add: 'Add shot', move: true, empty: 'Add the shots you must not miss.' }), { icon: 'list', hint: 'Prints with a tick box per shot.' }),
        ui.panel('Deliverables', ui.table('brief.deliverables', b.deliverables, [{ k: 'item', label: 'Item', ph: 'Edited selects', w: 'minmax(0,1.5fr)' }, { k: 'qty', label: 'Qty', ph: '40', w: '64px' }, { k: 'format', label: 'Format', ph: 'JPEG' }, { k: 'due', label: 'Due', ph: '10 days' }],
          { what: 'deliverable', add: 'Add deliverable', empty: 'What the client gets, and when.' }), { icon: 'gift' }),
        ui.panel('Usage and notes', `<div class="pl-stack">${ui.field('Usage', 'brief.usage', b.usage, { type: 'textarea', rows: 2, ph: 'Where and how long the images may be used.', optional: true })}
          ${ui.field('Notes', 'brief.notes', b.notes, { type: 'textarea', rows: 3, ph: 'Gear, crew, lunch, anything else.', optional: true })}</div>`, { icon: 'edit' }),
        bizPanel(ctx), look('brief', b)].join('');
      return head(ctx, 'A <em>shoot brief</em> everyone can follow', 'Client, location, shot list and deliverables on one sheet — print it for the day or send it ahead.') +
        work(editor, 'Send the PDF to the client to confirm, then print a copy for the shoot.');
    },
    slots: { preview }, sheet
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
  window.CCKit = {
    page: kitPage, blankKit, sample, fit,
    rows: { stats: () => ({ label: '', value: '' }), rates: () => ({ deliverable: '', rate: '', notes: '' }) },
    actions: { clearImage(c, d) { P.set(c.state, d.path, ''); } },
    normalize(s) { if (!C.PAPER[s.paper]) s.paper = 'letter'; s.kit = Object.assign(blankKit(), s.kit && typeof s.kit === 'object' ? s.kit : {}); ['stats', 'rates'].forEach(k => { if (!Array.isArray(s.kit[k])) s.kit[k] = []; }); return s; }
  };
  window.addEventListener('resize', () => { if (window.__planner) fit(window.__planner); }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (window.__planner) fit(window.__planner); });

  // logo / photo: downscale before saving so browser storage stays small
  document.addEventListener('change', e => {
    const input = e.target.closest && e.target.closest('input[type=file][data-upload]');
    if (!input || !input.files || !input.files[0]) return;
    const ctx = window.__planner;
    const file = input.files[0], path = input.dataset.upload, max = path === 'biz.logo' ? 360 : 520;
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
