/* Job Search App — pipeline, applications, follow-ups, interviews, practice flashcards and an offer comparison. Yaykit planner engine, work world.
   The pipeline pages come from Job Search Tracker (jobs.js), interviews and practice from Interview Prep (prep.js); the offer comparison is new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, J = window.JBJobs, X = window.JBPrep;
  const r0 = n => Math.round(n);
  const WEEKS = 48; // working weeks a year after holidays and time off

  /* ---------- offers ---------- */
  const offer = o => Object.assign({ id: P.uid(), name: '', role: '', base: '', bonus: '', equity: '', benefits: '', pto: '', hours: '40', office: '0', commute: '', reply: '', notes: '' }, o || {});
  function value(o) {
    const n = k => Math.max(0, P.num(o[k])), total = n('base') + n('bonus') + n('equity') + n('benefits');
    const commuteH = n('commute') * Math.min(7, n('office')) * WEEKS / 60, workH = (n('hours') || 40) * WEEKS;
    return { total, cash: n('base') + n('bonus'), commuteH, hourly: total ? total / (workH + commuteH) : 0, pto: n('pto') };
  }

  function blank() { return Object.assign(J.blank(), X.blank(), { offers: [], ui: {} }); }
  function normalize(s) {
    J.normalize(s); X.normalize(s);
    s.offers = (Array.isArray(s.offers) ? s.offers : []).filter(x => x && typeof x === 'object').map(x => { const o = offer(); Object.keys(o).forEach(k => { o[k] = x[k] == null ? o[k] : String(x[k]); }); return o; });
    return s;
  }
  function sample() {
    const s = Object.assign(blank(), J.sample(), X.sample()), t = D.today();
    s.offers = [
      offer({ name: 'Lumen Health', role: 'UX Researcher', base: '102000', bonus: '8000', equity: '0', benefits: '9000', pto: '20', hours: '40', office: '0', commute: '0', reply: D.add(t, 4), notes: 'Fully remote. 401(k) match 4%.' }),
      offer({ name: 'Harbor Softworks', role: 'Product Designer', base: '108000', bonus: '0', equity: '6000', benefits: '7000', pto: '25', hours: '42', office: '3', commute: '80', reply: '', notes: 'Expected range after the panel. Hybrid, 3 days in the office.' })];
    return s;
  }

  const offers = {
    id: 'offers', label: 'Offers', icon: 'award',
    badge: ctx => ctx.state.offers.filter(o => o.reply && o.reply >= D.today() && D.diff(D.today(), o.reply) <= 3).length || '',
    render(ctx) {
      const s = ctx.state, fromPipe = s.jobs.filter(j => j.stage === 'offer' && !s.offers.some(o => o.name && o.name === j.company));
      return `${u.head({ eyebrow: 'Compare offers', title: '<span data-slot="title"></span>', lede: 'Put every offer side by side: the full yearly value, time off, and what it pays per hour once the commute is counted.' })}
      <div data-slot="compare"></div>
      ${fromPipe.length ? `<div class="pl-row">${u.btn(`Add ${P.plural(fromPipe.length, 'offer')} from your pipeline`, { kind: 'world', icon: 'plus', act: 'fromPipe' })}</div>` : ''}
      ${u.records('offers', s.offers, {
        what: 'Offer', titlePh: 'Company', cls: 'jb-offers',
        sub: (o, i) => `<span data-slot="oSub" data-arg="${i}"></span>`,
        fields: [{ k: 'role', label: 'Role', ph: 'Job title', wide: true }, { k: 'base', label: 'Base salary / year', num: true, ph: '0' }, { k: 'bonus', label: 'Bonus / year', num: true, ph: '0' },
          { k: 'equity', label: 'Equity / year', num: true, ph: '0', hint: 'Vesting value per year.' }, { k: 'benefits', label: 'Benefits / year', num: true, ph: '0', hint: 'Retirement match, stipends, health you don’t pay.' },
          { k: 'pto', label: 'Paid days off', num: true, ph: '20' }, { k: 'hours', label: 'Hours / week', num: true, ph: '40' },
          { k: 'office', label: 'Office days / week', num: true, ph: '0' }, { k: 'commute', label: 'Commute, round trip (min)', num: true, ph: '0' },
          { k: 'reply', label: 'Reply by', type: 'date', rerender: true }, { k: 'notes', label: 'Notes', type: 'textarea', wide: true, ph: 'Start date, team, growth, anything that matters to you.' }],
        add: 'Add offer', addKind: s.offers.length ? '' : 'world', empty: u.empty('award', 'No offers yet', 'When an offer comes in, add it here — even a verbal one — and compare.')
      })}`;
    },
    slots: {
      title(ctx) {
        const l = ctx.state.offers.filter(o => P.has(o.name) && value(o).total);
        if (!l.length) return 'Weigh offers <em>side by side</em>';
        if (l.length === 1) return `<em>${esc(ctx.money(value(l[0]).total))}</em> a year from ${esc(l[0].name)}`;
        const top = l.slice().sort((a, b) => value(b).hourly - value(a).hourly)[0];
        return `<em>${esc(top.name)}</em> pays the most per hour`;
      },
      compare(ctx) {
        const l = ctx.state.offers.filter(o => P.has(o.name) && value(o).total);
        if (!l.length) return '';
        const max = Math.max(...l.map(o => value(o).total)), bestH = Math.max(...l.map(o => value(o).hourly)), bestT = max;
        return `<div class="jb-compare">${l.map(o => {
          const v = value(o), n = k => Math.max(0, P.num(o[k]));
          const seg = (k, cls) => (n(k) ? `<i class="jb-seg jb-seg--${cls}" style="width:${n(k) / max * 100}%"></i>` : '');
          return `<section class="y-panel jb-offer${v.hourly === bestH && l.length > 1 ? ' is-best' : ''}"><div class="jb-offer-head"><h3>${esc(o.name)}</h3>${v.hourly === bestH && l.length > 1 ? u.pill('Best per hour', 'good') : ''}${v.total === bestT && l.length > 1 ? u.pill('Highest total', 'world') : ''}</div>
            <p class="jb-total y-num">${esc(ctx.money(v.total))}<small> / year</small></p>
            <div class="jb-bar">${seg('base', 'base')}${seg('bonus', 'bonus')}${seg('equity', 'equity')}${seg('benefits', 'benefits')}</div>
            <dl class="jb-facts"><div><dt>Per hour, commute counted</dt><dd class="y-num">${esc(ctx.money(v.hourly, { cents: true }))}</dd></div><div><dt>Paid days off</dt><dd class="y-num">${v.pto || '—'}</dd></div>
              <div><dt>Commute a year</dt><dd class="y-num">${v.commuteH ? r0(v.commuteH) + ' h' : 'none'}</dd></div><div><dt>Reply by</dt><dd>${o.reply ? esc(D.short(o.reply)) + ' · ' + esc(D.rel(o.reply)) : '—'}</dd></div></dl></section>`;
        }).join('')}</div>
        <p class="jb-key"><span><i class="jb-seg--base"></i>Base</span><span><i class="jb-seg--bonus"></i>Bonus</span><span><i class="jb-seg--equity"></i>Equity</span><span><i class="jb-seg--benefits"></i>Benefits</span><span>Per hour = yearly value ÷ (work hours + commute hours), ${WEEKS} working weeks.</span></p>`;
      },
      oSub(ctx, i) {
        const o = ctx.state.offers[+i]; if (!o) return '';
        const v = value(o);
        return v.total ? `<span class="y-num">${esc(ctx.money(v.total))} a year · ${esc(ctx.money(v.hourly, { cents: true }))} per hour</span>${o.reply ? ' · ' + (o.reply < D.today() ? u.pill('reply date passed', 'bad') : `reply ${esc(D.rel(o.reply))}`) : ''}` : 'Add the numbers to compare';
      }
    },
    actions: {
      fromPipe(ctx) {
        const s = ctx.state, add = s.jobs.filter(j => j.stage === 'offer' && !s.offers.some(o => o.name && o.name === j.company));
        add.forEach(j => s.offers.push(offer({ name: j.company, role: j.role, base: String(P.num(j.salary) >= 1000 ? P.num(j.salary) : ''), notes: j.notes })));
        ctx.toast(`Added ${P.plural(add.length, 'offer')} — fill in the numbers`);
      }
    }
  };

  /* the pipeline keeps the notes that used to live on their own page */
  const board = J.pages.board, boardRender = board.render;
  board.render = ctx => boardRender(ctx) + u.notes('notes', ctx.state.notes, { rows: 6, title: 'Notes', ph: 'Your stories, questions to ask, salary research, people to thank…' });
  Object.assign(X.pages.deck, { label: 'Questions' });

  P.create({
    slug: 'job-search-app',
    name: 'Job Search Planner',
    world: 'work',
    currency: true,
    welcome: 'Add a few roles to the wishlist — then give each one a next step and a date.',
    pages: [board, J.pages.apps, J.pages.follow, X.pages.interviews, X.pages.practice, X.pages.deck, offers],
    blank, sample, normalize,
    open: X.open, onEdit: X.onEdit,
    timer: { overtime: true, defaultSecs: 120, defaultLabel: 'Answer timer · 2 min' },
    rows: Object.assign({ offers: () => offer() }, J.rows, X.rows),
    about: '<p><b>Job Search Planner</b> keeps a search moving: a pipeline from wishlist to offer, every role’s dates, contact, salary and notes, follow-ups sorted by date, a weekly applications goal, interview notes, flashcards to practise answers out loud with a two-minute timer, and an offer comparison that counts bonus, equity, benefits, time off and the commute.</p>',
    disclaimer: 'Job Search Planner is a personal organization tool. It does not guarantee interviews or offers, and the offer comparison is an estimate, not financial or tax advice.'
  });
})();
