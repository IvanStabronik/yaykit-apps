/* Content Creator Planner App — content plan, pillars, brand deals, a printable media kit, the launch checklist and gear. Yaykit planner engine, work world.
   Content plan, pillars, launch and gear come from Creator Launch Planner (creator.js), the media kit from Client Docs Studio (kit.js); brand deals are new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, R = window.CCCreator, K = window.CCKit;
  const STAGES = ['Pitched', 'Negotiating', 'Booked', 'Content due', 'Posted', 'Paid'];
  const txt = v => (v == null ? '' : String(v));
  const deal = o => Object.assign({ id: P.uid(), brand: '', deliverables: '', platform: 'Instagram', fee: '', stage: 'Pitched', due: '', live: '', invoiced: false, contact: '', usage: '', notes: '' }, o || {});

  function blank() { return Object.assign(R.blank(), { paper: 'letter', kit: K.blankKit(), deals: [] }); }
  function normalize(s) {
    R.normalize(s); K.normalize(s);
    s.deals = (Array.isArray(s.deals) ? s.deals : []).filter(x => x && typeof x === 'object').map(x => {
      const d = deal(); Object.keys(d).forEach(k => { if (k !== 'invoiced') d[k] = txt(x[k]) || (k === 'id' ? P.uid() : d[k]); });
      d.invoiced = !!x.invoiced; if (!STAGES.includes(d.stage)) d.stage = 'Pitched'; if (!R.PLATFORMS.includes(d.platform)) d.platform = 'Other'; return d;
    });
    delete s.invoices; delete s.cur; delete s.brief; delete s.biz;
    return s;
  }
  function sample() {
    const s = Object.assign(blank(), R.sample()), t = D.today();
    s.kit = Object.assign(K.blankKit(), {
      name: 'Maya Chen', handle: '@mayamakeshome', platforms: 'Instagram · TikTok', tagline: 'Small-space organizing for renters who want their deposit back',
      bio: ['I show renters how to make 400 square feet feel calm — no drilling, no damage, no expensive systems.', '', 'Every tip is tested in my own tiny apartment first.'].join('\n'),
      audience: '81% women · 22–38 · 68% US, 12% Canada · mostly renters in cities',
      niches: ['Small-space organizing', 'Renter-friendly fixes', 'Weekend resets', 'Honest product tests'].join('\n'),
      brands: ['Tidy Nest Bins', 'Peelstick Hooks', 'Linen & Loom'].join('\n'), location: 'Chicago, IL', email: 'collabs@mayamakeshome.example', website: 'mayamakeshome.example',
      stats: [{ label: 'Instagram', value: '18.4K' }, { label: 'TikTok', value: '26K' }, { label: 'Avg. engagement', value: '6.1%' }, { label: 'Avg. saves / post', value: '940' }],
      rates: [{ deliverable: 'Instagram Reel (15–45 s)', rate: '450', notes: '1 revision · 60 days usage' }, { deliverable: 'Carousel (6–8 slides)', rate: '350', notes: 'Caption + cover included' },
        { deliverable: 'TikTok video', rate: '400', notes: 'Native edit' }, { deliverable: 'Story set (3 frames)', rate: '150', notes: 'Link sticker' }],
      rateNote: 'Happy to build a bundle for a month-long partnership.', design: 'band', accent: 'teal' });
    s.deals = [
      deal({ brand: 'Tidy Nest Bins', deliverables: '1 Reel + 3 stories', platform: 'Instagram', fee: '600', stage: 'Content due', due: D.add(t, 4), live: D.add(t, 7), contact: 'Priya · partnerships@tidynest.example', usage: '60 days organic, no paid ads', notes: 'Show the under-sink set. Code MAYA15.' }),
      deal({ brand: 'Peelstick Hooks', deliverables: 'TikTok video', platform: 'TikTok', fee: '400', stage: 'Posted', due: D.add(t, -9), live: D.add(t, -6), invoiced: true, contact: 'Leo · leo@peelstick.example', notes: 'Invoice sent — net 30.' }),
      deal({ brand: 'Linen & Loom', deliverables: 'Carousel', platform: 'Instagram', fee: '350', stage: 'Paid', due: D.add(t, -40), live: D.add(t, -36), invoiced: true }),
      deal({ brand: 'Corner Shelf Co.', deliverables: '2 Reels', platform: 'Instagram', fee: '900', stage: 'Negotiating', contact: 'hello@cornershelf.example', notes: 'They offered $700 — countered at $900 with 30-day usage.' }),
      deal({ brand: 'Fold Studio', deliverables: 'Reel + TikTok', platform: 'Instagram', fee: '', stage: 'Pitched', notes: 'Pitched the closet series. Follow up next week.' })];
    return s;
  }

  /* ---------- brand deals (new) ---------- */
  const fee = d => P.num(d.fee);
  const open = s => s.deals.filter(d => P.has(d.brand));
  const booked = s => open(s).filter(d => ['Booked', 'Content due', 'Posted', 'Paid'].includes(d.stage));
  const unpaid = s => open(s).filter(d => d.stage === 'Posted');
  const dueSoon = s => open(s).filter(d => ['Booked', 'Content due'].includes(d.stage) && d.due).sort((a, b) => a.due.localeCompare(b.due));
  const deals = {
    id: 'deals', label: 'Brand deals', icon: 'briefcase',
    badge: ctx => dueSoon(ctx.state).filter(d => d.due <= D.add(D.today(), 7)).length || '',
    render(ctx) {
      const s = ctx.state, f = STAGES.includes(s.ui.df) ? s.ui.df : 'all';
      const rows = s.deals.map((d, i) => Object.assign({ __i: i }, d)).filter(d => f === 'all' || d.stage === f);
      return `${u.head({ eyebrow: 'Brand deals', title: '<span data-slot="title"></span>', lede: 'Every pitch from first email to paid: what you owe them, when it goes live, and what they owe you.' })}
      <div data-slot="kpis"></div>
      ${s.deals.length ? u.chips('ui.df', f, [['all', 'All', s.deals.length], ...STAGES.map(x => [x, x, s.deals.filter(d => d.stage === x).length])], 'Filter by stage') : ''}
      ${u.records('deals', rows, {
        index: d => d.__i, what: 'Deal', titleKey: 'brand', titlePh: 'Brand', cls: 'cc-deals',
        sub: d => `<span data-slot="dSub" data-arg="${d.__i}"></span>`,
        cardClass: d => (['Booked', 'Content due'].includes(d.stage) && d.due && d.due < D.today() ? 'is-flag' : d.stage === 'Paid' ? 'is-done' : ''),
        fields: [{ k: 'deliverables', label: 'Deliverables', ph: '1 Reel + 3 stories', wide: true }, { k: 'platform', label: 'Platform', options: R.PLATFORMS },
          { k: 'fee', label: 'Fee', num: true, ph: '0' }, { k: 'stage', label: 'Stage', options: STAGES, rerender: true }, { k: 'invoiced', label: 'Invoice sent', type: 'check', rerender: true },
          { k: 'due', label: 'Content due', type: 'date', rerender: true }, { k: 'live', label: 'Goes live', type: 'date' },
          { k: 'contact', label: 'Contact', ph: 'Name, email' }, { k: 'usage', label: 'Usage rights', ph: 'e.g. 60 days organic' },
          { k: 'notes', label: 'Notes', type: 'textarea', wide: true, ph: 'Brief, talking points, codes, payment terms…' }],
        add: 'Add deal', addKind: s.deals.length ? '' : 'world', empty: s.deals.length ? '<p class="pl-muted">No deals at this stage.</p>' : u.empty('briefcase', 'No deals yet', 'Add every pitch — even the ones that go nowhere. Rates from your media kit help you quote.')
      })}`;
    },
    slots: {
      title(ctx) {
        const s = ctx.state, b = booked(s).reduce((a, d) => a + fee(d), 0);
        return open(s).length ? `<em>${esc(ctx.money(b))}</em> booked` : 'Track every <em>brand deal</em>';
      },
      kpis(ctx) {
        const s = ctx.state, nx = dueSoon(s)[0], paid = open(s).filter(d => d.stage === 'Paid').reduce((a, d) => a + fee(d), 0), owed = unpaid(s).reduce((a, d) => a + fee(d), 0);
        if (!open(s).length) return '';
        return u.kpis([['Booked', esc(ctx.money(booked(s).reduce((a, d) => a + fee(d), 0))), 'y-kpi--world', P.plural(booked(s).length, 'deal')],
          ['Waiting to be paid', esc(ctx.money(owed)), owed ? '' : 'is-good', unpaid(s).filter(d => !d.invoiced).length ? `${unpaid(s).filter(d => !d.invoiced).length} not invoiced yet` : P.plural(unpaid(s).length, 'deal')],
          ['Paid so far', esc(ctx.money(paid))], ['Next content due', nx ? esc(D.short(nx.due)) : '—', nx && nx.due < D.today() ? 'is-bad' : 'y-kpi--accent', nx ? esc(nx.brand) : 'nothing due']]);
      },
      dSub(ctx, i) {
        const d = ctx.state.deals[+i]; if (!d) return '';
        const late = ['Booked', 'Content due'].includes(d.stage) && d.due && d.due < D.today();
        return `<span class="cc-money">${u.pill(d.stage, d.stage === 'Paid' ? 'good' : late ? 'bad' : ['Booked', 'Content due'].includes(d.stage) ? 'world' : '')}${fee(d) ? `<b class="y-num">${esc(ctx.money(fee(d)))}</b>` : ''}${d.due && ['Booked', 'Content due'].includes(d.stage) ? ` · due ${esc(D.short(d.due))}` : ''}${d.stage === 'Posted' && !d.invoiced ? ' · ' + u.pill('send the invoice', 'warn') : ''}</span>`;
      }
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Brand deals</h1><table><thead><tr><th>Brand</th><th>Deliverables</th><th>Stage</th><th>Fee</th><th>Due</th><th>Live</th></tr></thead><tbody>${open(s).map(d => `<tr><td><b>${esc(d.brand)}</b></td><td>${esc(d.deliverables)}</td><td>${esc(d.stage)}</td><td>${fee(d) ? esc(ctx.money(fee(d))) : ''}</td><td>${esc(d.due ? D.short(d.due) : '')}</td><td>${esc(d.live ? D.short(d.live) : '')}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* the content plan keeps the notes */
  const posts = R.pages.posts, postsRender = posts.render;
  posts.render = ctx => postsRender(ctx) + u.notes('notes', ctx.state.notes, { rows: 4, title: 'Notes', ph: 'What’s working, ideas from comments, hooks to try…' });
  Object.assign(K.page, { label: 'Media kit' });

  P.create({
    slug: 'content-creator-app',
    name: 'Content Creator Planner',
    world: 'work',
    currency: true,
    welcome: 'Write your niche in one sentence — then brain-dump ten post ideas.',
    pages: [posts, R.pages.pillars, deals, K.page, R.pages.launch, R.pages.gearPage],
    blank, sample, normalize,
    rows: Object.assign({ deals: () => deal() }, R.rows, K.rows),
    actions: Object.assign({}, K.actions),
    refresh: K.fit,
    about: '<p><b>Content Creator Planner</b> runs a creator account in one place: a content plan from idea to posted with what worked, three or four content pillars, every brand deal from pitch to paid, a one-page media kit you can print or save as a PDF, a launch checklist and a minimal gear list.</p>',
    disclaimer: 'Content Creator Planner is a planning tool. It does not guarantee followers, reach or income, and it is not tax, legal or contract advice.'
  });
})();
