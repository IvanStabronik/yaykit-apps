/* Reading Journal App — shelf, library and year in books (books.js), plus a reading journal with a streak, quotes,
   a 24-prompt reading challenge and a book club. Yaykit planner engine, bookish world (reading.css; window.READING_SKIN
   can swap name, slug and world). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon, R = window.RJBooks;
  const txt = v => (v == null ? '' : String(v));
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
  const PROMPTS = ['A book you own but never read', 'A book under 200 pages', 'A book over 500 pages', 'A book by a debut author', 'A translated book',
    'A book set somewhere you want to visit', 'A classic you skipped in school', 'A book a friend recommended', 'A memoir', 'A book with a one-word title',
    'A book from the year you were born', 'A book with a blue cover', 'A mystery or thriller', 'A fantasy or sci-fi book', 'A book of poems or short stories',
    'A book about food', 'A book that became a movie or show', 'A book by an author from another continent', 'A book you can finish in a weekend', 'A reread of an old favorite',
    'A book picked by a book club', 'A nonfiction book about science or nature', 'A book published this year', 'A book with a number in the title'];

  const session = o => Object.assign({ id: P.uid(), date: D.today(), book: '', pages: '', minutes: '', note: '' }, o || {});
  const quote = o => Object.assign({ id: P.uid(), text: '', book: '', page: '', fav: false }, o || {});
  const prompt = (text, book, done) => ({ id: P.uid(), text: text || '', book: book || '', done: !!done });
  const meeting = o => Object.assign({ id: P.uid(), date: '', book: '', host: '', where: '', questions: '', notes: '' }, o || {});

  function blank() { return Object.assign(R.blank(), { sessions: [], quotes: [], challenge: { name: '', items: [] }, meetings: [] }); }
  function sample() {
    const s = R.sample(), t = D.today(), id = title => (s.books.find(b => b.title === title) || {}).id || '';
    s.books.push({ id: P.uid(), title: 'The House in the Cerulean Sea', author: 'TJ Klune', status: 'finished', rating: '5', started: D.add(t, -150), finished: D.add(t, -140), genre: 'Fantasy', format: 'Print', pages: '400', progress: '400', notes: '' },
      { id: P.uid(), title: 'Educated', author: 'Tara Westover', status: 'finished', rating: '4', started: D.add(t, -200), finished: D.add(t, -185), genre: 'Memoir', format: 'Audiobook', pages: '352', progress: '352', notes: '' });
    const mid = id('The Midnight Library'), weeks = id('Four Thousand Weeks');
    const pages = [22, 30, 9, 18, 41, 25, 12, 6, 35, 28, 20, 16, 44, 10, 26, 31, 19];
    s.sessions = pages.map((p, i) => p ? session({ date: D.add(t, -i - 1), book: i % 4 === 3 ? weeks : mid, pages: String(p), minutes: String(Math.round(p * 1.6)) }) : null).filter(Boolean);
    s.sessions.unshift(session({ date: t, book: mid, pages: '14', minutes: '20', note: 'Before bed' }));
    s.books.push({ id: P.uid(), title: 'Little Women', author: 'Louisa May Alcott', status: 'finished', rating: '5', started: D.add(t, -100), finished: D.add(t, -92), genre: 'Classic', format: 'E-book', pages: '449', progress: '449', notes: 'Jo forever.' },
      { id: P.uid(), title: 'Walden', author: 'Henry David Thoreau', status: 'finished', rating: '3', started: D.add(t, -70), finished: D.add(t, -61), genre: 'Classic', format: 'Print', pages: '352', progress: '352', notes: 'Slow, but some lines stay with you.' },
      { id: P.uid(), title: 'Pride and Prejudice', author: 'Jane Austen', status: 'finished', rating: '5', started: D.add(t, -35), finished: D.add(t, -28), genre: 'Classic', format: 'Print', pages: '432', progress: '432', notes: 'Reread for book club.' });
    s.quotes = [quote({ text: 'I declare after all there is no enjoyment like reading!', book: id('Pride and Prejudice'), page: '58', fav: true }),
      quote({ text: 'I am not afraid of storms, for I am learning how to sail my ship.', book: id('Little Women'), page: '381', fav: true }),
      quote({ text: 'I went to the woods because I wished to live deliberately.', book: id('Walden'), page: '90' }),
      quote({ text: 'Do not be too timid and squeamish about your actions. All life is an experiment.', book: id('Walden'), page: '' }),
      quote({ text: 'I want to do something splendid before I go into my castle.', book: id('Little Women'), page: '' })];
    const done = { 'A book under 200 pages': '', 'A book over 500 pages': '', 'A memoir': id('Educated'), 'A fantasy or sci-fi book': id('Project Hail Mary'),
      'A book that became a movie or show': id('Lessons in Chemistry'), 'A book about food': '', 'A nonfiction book about science or nature': id('Braiding Sweetgrass'),
      'A book a friend recommended': id('The House in the Cerulean Sea'), 'A classic you skipped in school': id('Walden'), 'A book with a number in the title': '' };
    s.challenge = { name: `${new Date().getFullYear()} reading challenge`, items: PROMPTS.map(p => prompt(p, done[p] || '', !!done[p])) };
    s.meetings = [meeting({ date: D.add(t, 9), book: 'Piranesi', host: 'Priya', where: 'Priya’s place · 7 pm', questions: 'What is the House?\nWhy does Piranesi feel so content?\nHow did the ending land for you?' }),
      meeting({ date: D.add(t, -21), book: 'Tomorrow, and Tomorrow, and Tomorrow', host: 'Jordan', where: 'The Corner Café', notes: 'Everyone loved Marx. Split on the ending. Next: Piranesi.' }),
      meeting({ date: D.add(t, -52), book: 'Lessons in Chemistry', host: 'Sam', where: 'Online', notes: 'Half of us DNF’d. Good discussion anyway.' })];
    return s;
  }
  function normalize(s) {
    R.normalize(s);
    s.sessions = arr(s.sessions, x => session({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), book: txt(x.book), pages: txt(x.pages), minutes: txt(x.minutes), note: txt(x.note) }));
    s.quotes = arr(s.quotes, x => quote({ id: txt(x.id) || P.uid(), text: txt(x.text), book: txt(x.book), page: txt(x.page), fav: !!x.fav }));
    const c = s.challenge && typeof s.challenge === 'object' ? s.challenge : {};
    s.challenge = { name: txt(c.name), items: arr(c.items, x => Object.assign(prompt(txt(x.text), txt(x.book), x.done), { id: txt(x.id) || P.uid() })) };
    s.meetings = arr(s.meetings, x => meeting({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : '', book: txt(x.book), host: txt(x.host), where: txt(x.where), questions: txt(x.questions), notes: txt(x.notes) }));
    s.ui.draft = Object.assign({ book: '', pages: '', minutes: '' }, s.ui.draft || {});
    if (typeof s.ui.qf !== 'string') s.ui.qf = '';
    return s;
  }

  /* ---------- helpers ---------- */
  const titleOf = (s, id) => (s.books.find(b => b.id === id) || {}).title || '';
  const bookOpts = (s, only) => s.books.filter(b => P.has(b.title) && (!only || only.includes(b.status))).map(b => [b.id, b.title]);
  const dayPages = (s, d) => s.sessions.filter(x => x.date === d).reduce((a, x) => a + P.num(x.pages), 0);
  const readOn = (s, d) => s.sessions.some(x => x.date === d && (P.num(x.pages) || P.num(x.minutes)));
  function streak(s) {
    let d = D.today(), n = 0;
    if (!readOn(s, d)) d = D.add(d, -1);   // today still counts until bedtime
    while (readOn(s, d) && n < 3660) { n++; d = D.add(d, -1); }
    return n;
  }
  const monthOf = (s, ym) => s.sessions.filter(x => x.date.startsWith(ym));

  /* ---------- journal ---------- */
  const journal = {
    id: 'journal', label: 'Journal', icon: 'edit',
    render(ctx) {
      const s = ctx.state, t = D.today(), d = s.ui.draft, reading = bookOpts(s, ['reading']), all = bookOpts(s);
      const last = Array.from({ length: 30 }, (_, i) => D.add(t, i - 29)), max = Math.max(1, ...last.map(x => dayPages(s, x)));
      const rows = s.sessions.map((x, i) => Object.assign({ __i: i }, x)).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 40);
      return `${u.head({ eyebrow: 'Reading journal', title: '<span data-slot="title"></span>', lede: 'Log a few pages or minutes when you read. The streak forgives today until bedtime.' })}
      <div data-slot="kpis"></div>
      ${u.panel('Log reading', `<div class="rj-log">
        ${u.select('ui.draft.book', d.book || (reading[0] || [])[0] || '', (reading.length ? reading : all), { label: 'Book', blank: 'Book…' })}
        ${u.input('ui.draft.pages', d.pages, { num: true, ph: 'Pages', label: 'Pages read' })}
        ${u.input('ui.draft.minutes', d.minutes, { num: true, ph: 'Minutes', label: 'Minutes read' })}
        ${u.btn('Log it', { kind: 'world', icon: 'plus', act: 'logRead' })}</div>
        <p class="pl-hint">Pages also move the book’s progress on the Shelf.</p>`, { icon: 'plus' })}
      ${u.panel('Last 30 days', `<div class="rj-strip" role="img" aria-label="Pages read each day for the last 30 days">${last.map(x => { const p = dayPages(s, x); return `<span class="rj-day${x === t ? ' is-today' : ''}${readOn(s, x) ? ' is-on' : ''}" title="${esc(D.short(x))}: ${p} pages"><i style="height:${Math.max(4, p / max * 100)}%"></i></span>`; }).join('')}</div>`, { icon: 'chart' })}
      ${u.panel('Sessions', rows.length ? u.table('sessions', rows, [
        { k: 'date', label: 'Date', type: 'date', w: '150px', rerender: true },
        { k: 'book', label: 'Book', type: 'select', options: all, blank: '—', w: '1.4fr', rerender: true },
        { k: 'pages', label: 'Pages', num: true, w: '90px', ph: '0' },
        { k: 'minutes', label: 'Minutes', num: true, w: '90px', ph: '0' },
        { k: 'note', label: 'Note', title: true, w: '1fr', ph: 'Where, how it felt' }
      ], { index: x => x.__i, total: s.sessions.length, what: 'session', cls: 'rj-stab' }) : u.empty('edit', 'No reading logged yet', 'Log today’s pages above — even five count.'), { icon: 'list' })}`;
    },
    slots: {
      title(ctx) { const n = streak(ctx.state); return n ? `<em>${n}</em>-day reading streak` : 'Start a reading <em>streak</em>'; },
      kpis(ctx) {
        const s = ctx.state, ym = D.today().slice(0, 7), m = monthOf(s, ym), pages = m.reduce((a, x) => a + P.num(x.pages), 0), mins = m.reduce((a, x) => a + P.num(x.minutes), 0);
        const days = new Set(m.filter(x => P.num(x.pages) || P.num(x.minutes)).map(x => x.date)).size;
        return u.kpis([['Streak', `${streak(s)}<small> days</small>`, 'y-kpi--world'], ['Pages this month', pages.toLocaleString('en-US'), ''],
          ['Time this month', mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`, ''], ['Reading days', String(days), '', 'this month']]);
      }
    },
    actions: {
      logRead(ctx) {
        const s = ctx.state, d = s.ui.draft, pg = Math.round(P.num(d.pages)), mn = Math.round(P.num(d.minutes));
        if (!(pg > 0 || mn > 0)) { ctx.toast('Type pages or minutes first'); ctx.focus('[data-bind="ui.draft.pages"]'); return false; }
        const book = d.book || (bookOpts(s, ['reading'])[0] || [])[0] || '';
        s.sessions.push(session({ book, pages: pg ? String(pg) : '', minutes: mn ? String(mn) : '' }));
        const b = s.books.find(x => x.id === book);
        if (b && pg) { const total = P.num(b.pages); b.progress = String(total ? Math.min(total, P.num(b.progress) + pg) : P.num(b.progress) + pg); }
        s.ui.draft = { book, pages: '', minutes: '' };
        ctx.toast(`Logged${pg ? ` ${pg} pages` : ''}${mn ? ` · ${mn} min` : ''}`);
      }
    },
    sheet(ctx) {
      const s = ctx.state, rows = s.sessions.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 60);
      return `<h1>Reading journal</h1><p class="pl-sheet-meta">${streak(s)}-day streak</p><table><thead><tr><th>Date</th><th>Book</th><th>Pages</th><th>Minutes</th><th>Note</th></tr></thead><tbody>${rows.map(x => `<tr><td>${esc(D.short(x.date))}</td><td>${esc(titleOf(s, x.book))}</td><td>${esc(x.pages)}</td><td>${esc(x.minutes)}</td><td>${esc(x.note)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- quotes ---------- */
  const quotes = {
    id: 'quotes', label: 'Quotes', icon: 'heart',
    render(ctx) {
      const s = ctx.state, f = s.ui.qf, opts = bookOpts(s);
      const list = s.quotes.map((q, i) => Object.assign({ __i: i }, q)).filter(q => !f || (f === 'fav' ? q.fav : q.book === f));
      const used = [...new Set(s.quotes.map(q => q.book).filter(Boolean))];
      return `${u.head({ eyebrow: 'Quotes', title: `<em>${s.quotes.filter(q => P.has(q.text)).length}</em> lines worth keeping`, lede: 'Copy the sentence, pick the book, add the page. Heart the ones you love most.' })}
      <div class="pl-row rj-qtools">${u.chips('ui.qf', f, [['', 'All', s.quotes.length], ['fav', 'Favorites', s.quotes.filter(q => q.fav).length], ...used.map(id => [id, titleOf(s, id) || 'Unknown'])], 'Filter quotes')}<span class="pl-spacer"></span>${u.add('Add quote', 'quotes', { kind: 'world', at: 'top' })}</div>
      ${list.length ? `<div class="rj-quotes">${list.map(q => `<article class="rj-quote${q.fav ? ' is-fav' : ''}">
          ${u.textarea(`quotes.${q.__i}.text`, q.text, { rows: 3, label: `Quote ${q.__i + 1}`, ph: 'Type or paste the line', cls: 'rj-qtext', auto: true })}
          <div class="rj-qmeta">${u.select(`quotes.${q.__i}.book`, q.book, opts, { label: `Book for quote ${q.__i + 1}`, blank: 'Book…', rerender: true })}${u.input(`quotes.${q.__i}.page`, q.page, { num: true, ph: 'p.', label: `Page for quote ${q.__i + 1}`, cls: 'rj-qpage' })}
            <button type="button" class="y-btn y-btn--ghost y-btn--icon pl-mini rj-heart${q.fav ? ' is-on' : ''}" data-act="toggle" data-bind="quotes.${q.__i}.fav" aria-pressed="${q.fav}" aria-label="Favorite quote ${q.__i + 1}">${I('heart')}</button>
            ${u.rowTools('quotes', q.__i, s.quotes.length, { what: 'quote', label: q.text })}</div></article>`).join('')}</div>`
        : u.empty('heart', s.quotes.length ? 'No quotes here' : 'No quotes yet', s.quotes.length ? 'Try another filter.' : 'Save the first line that made you stop reading for a second.')}`;
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Quotes</h1>${s.quotes.filter(q => P.has(q.text)).map(q => `<blockquote style="margin:0 0 5mm;padding-left:4mm;border-left:2px solid #999"><p style="margin:0">${esc(q.text)}</p><p style="margin:1mm 0 0;color:#555">— ${esc(titleOf(s, q.book))}${q.page ? `, p. ${esc(q.page)}` : ''}</p></blockquote>`).join('')}`;
    }
  };

  /* ---------- challenge ---------- */
  const challenge = {
    id: 'challenge', label: 'Challenge', icon: 'star',
    render(ctx) {
      const s = ctx.state, c = s.challenge, named = c.items.filter(x => P.has(x.text)), done = named.filter(x => x.done).length;
      return `${u.head({ eyebrow: c.name || 'Reading challenge', title: named.length ? `<em>${done}</em> of ${named.length} prompts` : 'Reading <em>challenge</em>', lede: 'One book per prompt. Pick the book you read for it and tick it off — or write your own prompts.' })}
      ${named.length ? `<section class="y-panel y-panel--world rj-cbar">${u.meter(done / named.length * 100, 'Challenge progress')}<p>${done === named.length ? 'Challenge complete. Well read!' : `${named.length - done} to go`}</p></section>` : ''}
      ${u.panel('', `<div class="pl-fields">${u.field('Challenge name', 'challenge.name', c.name, { ph: '2027 reading challenge' })}</div>
        <div class="xm-gap"></div>
        ${c.items.length ? u.table('challenge.items', c.items, [
          { k: 'done', label: 'Done', type: 'check', w: '60px', rerender: true },
          { k: 'text', label: 'Prompt', title: true, w: '1.5fr', ph: 'Prompt' },
          { k: 'book', label: 'Book', type: 'select', options: bookOpts(s), blank: 'Pick a book…', w: '1fr' }
        ], { what: 'prompt', add: 'Add prompt', tpl: 'items', rowClass: x => (x.done ? 'is-done' : '') })
          : u.empty('star', 'No prompts yet', 'Start from 24 prompts and make them yours.', u.btn('Add 24 starter prompts', { kind: 'world', icon: 'sparkle', act: 'starterPrompts' }))}`, { icon: 'star' })}`;
    },
    actions: { starterPrompts(ctx) { const c = ctx.state.challenge; PROMPTS.forEach(p => c.items.push(prompt(p))); if (!c.name) c.name = `${new Date().getFullYear()} reading challenge`; ctx.toast('24 prompts added'); } },
    sheet(ctx) {
      const s = ctx.state, c = s.challenge;
      return `<h1>${esc(c.name || 'Reading challenge')}</h1><table><tbody>${c.items.filter(x => P.has(x.text)).map(x => `<tr><td style="width:6mm"><span class="pl-box${x.done ? ' is-on' : ''}"></span></td><td>${esc(x.text)}</td><td>${esc(titleOf(s, x.book))}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- book club ---------- */
  const club = {
    id: 'club', label: 'Book club', icon: 'user',
    render(ctx) {
      const s = ctx.state, t = D.today(), rows = s.meetings.map((m, i) => Object.assign({ __i: i }, m)).sort((a, b) => ((a.date || '9') < (b.date || '9') ? 1 : -1));
      const next = s.meetings.filter(m => m.date && m.date >= t).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
      return `${u.head({ eyebrow: 'Book club', title: next ? `Next: <em>${esc(next.book || 'a book')}</em>` : 'Book <em>club</em>', lede: 'Dates, books, hosts and the questions you want to bring — and what everyone thought.', meta: next ? `<span class="y-sticker">${I('calendar')}${esc(D.rel ? D.rel(next.date) : D.short(next.date))}</span><span>${esc([D.long(next.date), next.where].filter(Boolean).join(' · '))}</span>` : '' })}
      ${u.records('meetings', rows, {
        index: m => m.__i, what: 'Meeting', titleKey: 'book', titlePh: 'Book', cls: 'rj-club', add: 'Add meeting', addKind: 'world',
        sub: m => (m.date ? `${esc(D.full(m.date))}${m.date >= t ? ` ${u.pill('upcoming', 'world')}` : ''}` : 'No date yet'),
        fields: [{ k: 'date', label: 'Date', type: 'date', rerender: true }, { k: 'host', label: 'Host', ph: 'Who hosts' }, { k: 'where', label: 'Where', ph: 'Place, time or link', wide: true },
          { k: 'questions', label: 'Questions to bring', type: 'textarea', wide: true, ph: 'One per line' }, { k: 'notes', label: 'What we thought', type: 'textarea', wide: true, ph: 'Ratings, quotes, next pick' }],
        empty: u.empty('user', 'No meetings yet', 'Add the next meeting and the book.')
      })}`;
    },
    sheet(ctx) {
      const s = ctx.state, t = D.today(), m = s.meetings.filter(x => x.date && x.date >= t).sort((a, b) => (a.date < b.date ? -1 : 1))[0] || s.meetings[0];
      if (!m) return '<p>No meetings yet.</p>';
      return `<h1>${esc(m.book || 'Book club')}</h1><p class="pl-sheet-meta">${esc([m.date && D.long(m.date), m.where, m.host && `Host: ${m.host}`].filter(Boolean).join(' · '))}</p><h2>Questions</h2><ol>${m.questions.split('\n').filter(x => x.trim()).map(x => `<li style="margin-bottom:6mm">${esc(x)}</li>`).join('')}</ol>`;
    }
  };

  /* the shelf shows the streak too */
  const shelf = R.pages.shelf, shelfRender = shelf.render;
  shelf.render = ctx => shelfRender(ctx).replace(/(<section class="y-panel y-panel--world rl-goal">)/, `<p class="rj-streak">${I('flame')}<b>${streak(ctx.state)}-day</b> reading streak · ${u.btn('Log reading', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'journal' } })}</p>$1`);

  const SKIN = Object.assign({ slug: 'reading-journal-app', name: 'Reading Journal', world: 'bookish' }, window.READING_SKIN);
  P.create({
    slug: SKIN.slug, name: SKIN.name, world: SKIN.world,
    welcome: 'Add the book you’re reading now, then log a few pages on the Journal.',
    pages: [shelf, journal, R.pages.library, quotes, challenge, club, R.pages.stats],
    blank, sample, normalize,
    rows: Object.assign({}, R.rows, { sessions: () => session(), quotes: () => quote(), items: () => prompt(), meetings: () => meeting({ date: D.add(D.today(), 14) }) }),
    about: `<p><b>${esc(SKIN.name)}</b> keeps your reading life in one place: what you’re reading now with page progress and a yearly goal, a reading journal with a streak, a library of every book with ratings and notes, saved quotes, a 24-prompt reading challenge, book club meetings, and your year in books.</p>`,
    disclaimer: `${esc(SKIN.name)} is a personal reading log. Book titles in the example are only there to show how it works.`
  });
})();
