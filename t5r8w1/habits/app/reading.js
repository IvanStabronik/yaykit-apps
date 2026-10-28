/* Habit Tracker App — reading shelf, library and year in books, from Reading Log. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const STATUS = [['reading', 'Reading'], ['want', 'Want to read'], ['finished', 'Finished'], ['dnf', 'Did not finish']];
  const ST = Object.fromEntries(STATUS);
  const FORMATS = ['Print', 'E-book', 'Audiobook'];
  const txt = v => (v == null ? '' : String(v));
  const book = o => Object.assign({ id: P.uid(), title: '', author: '', status: 'want', rating: '0', started: '', finished: '', genre: '', format: 'Print', pages: '', progress: '', notes: '' }, o || {});
  const year = () => String(new Date().getFullYear());

  function blank() { return { reader: '', goals: { [year()]: '' }, books: [], notes: '' }; }
  function sample() {
    const t = D.today(), y = year();
    return {
      reader: 'Jordan', goals: { [y]: '24' },
      books: [
        book({ title: 'The Midnight Library', author: 'Matt Haig', status: 'reading', started: D.add(t, -6), genre: 'Fiction', pages: '304', progress: '188', notes: 'The chess scene!' }),
        book({ title: 'Four Thousand Weeks', author: 'Oliver Burkeman', status: 'reading', format: 'Audiobook', started: D.add(t, -12), genre: 'Non-fiction', pages: '288', progress: '60' }),
        book({ title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', status: 'finished', rating: '5', started: D.add(t, -40), finished: D.add(t, -20), genre: 'Fiction', pages: '416', notes: '“What is a game? It’s tomorrow, and tomorrow, and tomorrow.”' }),
        book({ title: 'Atomic Habits', author: 'James Clear', status: 'finished', rating: '4', finished: D.add(t, -55), genre: 'Self-help', format: 'E-book', pages: '320' }),
        book({ title: 'Project Hail Mary', author: 'Andy Weir', status: 'finished', rating: '5', finished: D.add(t, -80), genre: 'Sci-fi', pages: '496', notes: 'Rocky ♥' }),
        book({ title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer', status: 'finished', rating: '4', finished: D.add(t, -120), genre: 'Nature', pages: '408' }),
        book({ title: 'Lessons in Chemistry', author: 'Bonnie Garmus', status: 'dnf', rating: '2', genre: 'Fiction', notes: 'Stopped at 40% — not for me right now.' }),
        book({ title: 'Piranesi', author: 'Susanna Clarke', status: 'want', genre: 'Fantasy' }),
        book({ title: 'The Anxious Generation', author: 'Jonathan Haidt', status: 'want', genre: 'Non-fiction' }),
        book({ title: 'Demon Copperhead', author: 'Barbara Kingsolver', status: 'want', genre: 'Fiction' })
      ],
      notes: 'Book club picks: Piranesi (next month).\nTo look up: more by Susanna Clarke.'
    };
  }
  function normalize(s) {
    s.reader = txt(s.reader); s.notes = txt(s.notes);
    s.goals = s.goals && typeof s.goals === 'object' ? Object.fromEntries(Object.keys(s.goals).filter(k => /^\d{4}$/.test(k)).map(k => [k, txt(s.goals[k])])) : {};
    if (!(year() in s.goals)) s.goals[year()] = '';
    s.books = (Array.isArray(s.books) ? s.books : []).filter(x => x && typeof x === 'object').map(x => { const b = book(); Object.keys(b).forEach(k => { b[k] = txt(x[k]) || b[k]; }); b.status = ST[x.status] ? x.status : 'want'; b.format = FORMATS.includes(x.format) ? x.format : 'Print'; return b; });
    return s;
  }
  const finishedIn = (s, y) => s.books.filter(b => b.status === 'finished' && P.has(b.title) && (b.finished || '').startsWith(y));
  const pct = b => { const p = P.num(b.pages), r = P.num(b.progress); return p ? Math.min(100, r / p * 100) : 0; };

  const shelf = {
    id: 'shelf', label: 'Shelf', icon: 'star',
    render(ctx) {
      const s = ctx.state, y = year(), goal = Math.round(P.num(s.goals[y])), done = finishedIn(s, y).length;
      const reading = s.books.map((b, i) => Object.assign({ __i: i }, b)).filter(b => b.status === 'reading');
      const want = s.books.filter(b => b.status === 'want' && P.has(b.title));
      const recent = s.books.filter(b => b.status === 'finished' && P.has(b.title)).sort((a, b) => (b.finished || '').localeCompare(a.finished || '')).slice(0, 6);
      return `${u.head({ eyebrow: s.reader ? `${s.reader}’s reading` : 'Reading log', title: goal ? `<em>${done}</em> of ${goal} books in ${y}` : `<em>${done}</em> ${done === 1 ? 'book' : 'books'} finished in ${y}` })}
      <section class="y-panel y-panel--world rl-goal"><div class="rl-goal-top"><label for="rlGoal">Reading goal for ${y}</label><input id="rlGoal" class="y-input y-input--num rl-goal-input" data-bind="goals.${y}" data-rerender value="${esc(s.goals[y])}" inputmode="decimal" placeholder="e.g. 24" autocomplete="off"><span>books</span></div>
        ${goal ? `${u.meter(done / goal * 100, 'Yearly goal')}<p class="rl-goal-note">${done >= goal ? 'Goal reached — anything more is a bonus.' : `${goal - done} to go · about ${Math.max(1, Math.ceil((goal - done) / Math.max(1, 12 - new Date().getMonth())))} a month from here`}</p>` : '<p class="rl-goal-note">Set a number, or leave it empty and just enjoy reading.</p>'}</section>
      ${u.panel('Reading now', reading.length ? `<div class="rl-now">${reading.map(b => `<article class="rl-book is-now"><div class="rl-cover" style="--h:${(b.title.length * 37) % 360}">${esc((b.title || '?').slice(0, 1))}</div><div class="rl-book-main"><b>${esc(b.title)}</b><span class="pl-muted">${esc(b.author)}${b.format !== 'Print' ? ` · ${esc(b.format)}` : ''}</span>
          <div class="rl-prog">${u.input(`books.${b.__i}.progress`, b.progress, { num: true, label: `Pages read in ${b.title}`, cls: 'rl-page', rerender: true })}<span class="pl-muted">of ${esc(b.pages || '?')} pages</span></div>${u.meter(pct(b), `${b.title} progress`)}
          <div class="pl-row">${u.btn('Finished it', { sm: true, kind: 'world', icon: 'check', act: 'finish', data: { i: b.__i } })}</div></div></article>`).join('')}</div>`
        : `<p class="pl-muted">Nothing on the go. Pick something from “Want to read”.</p>`, { icon: 'star' })}
      <div class="pl-grid">
        ${u.panel('Up next', want.length ? `<ol class="rl-list">${want.slice(0, 8).map(b => `<li><span><b>${esc(b.title)}</b> <span class="pl-muted">${esc(b.author)}</span></span>${u.btn('Start', { sm: true, act: 'start', data: { i: s.books.indexOf(b) } })}</li>`).join('')}</ol>` : '<p class="pl-muted">Your to-read list is empty.</p>', { icon: 'list', cls: 'pl-6' })}
        ${u.panel('Recently finished', recent.length ? `<ol class="rl-list">${recent.map(b => `<li><span><b>${esc(b.title)}</b> <span class="pl-muted">${esc(b.author)}</span></span><span class="rl-stars" aria-label="${b.rating} stars">${'★'.repeat(Math.round(P.num(b.rating)))}<span class="rl-off">${'☆'.repeat(5 - Math.round(P.num(b.rating)))}</span></span></li>`).join('')}</ol>` : '<p class="pl-muted">Finished books show up here.</p>', { icon: 'check', cls: 'pl-6' })}
      </div>
      ${u.panel('Add a book', u.quickAdd('books', { key: 'title', ph: 'Book title — press Enter, add details in the Library', label: 'Add a book', kind: 'world' }))}`;
    },
    actions: {
      finish(ctx, d) { const b = ctx.state.books[+d.i]; if (!b) return false; b.status = 'finished'; b.finished = D.today(); if (P.num(b.pages)) b.progress = b.pages; ctx.toast(`Finished “${b.title}” — rate it in the Library`); },
      start(ctx, d) { const b = ctx.state.books[+d.i]; if (!b) return false; b.status = 'reading'; b.started = D.today(); }
    }
  };

  const library = {
    id: 'library', label: 'Library', icon: 'list',
    render(ctx) {
      const s = ctx.state, f = ST[s.ui.f] ? s.ui.f : 'all', q = txt(s.ui.q).toLowerCase().trim();
      const list = s.books.map((b, i) => Object.assign({ __i: i }, b)).filter(b => (f === 'all' || b.status === f) && (!q || `${b.title} ${b.author} ${b.genre}`.toLowerCase().includes(q)));
      return `${u.head({ eyebrow: 'Library', title: `<em>${s.books.filter(b => P.has(b.title)).length}</em> books`, lede: 'Everything you’ve read, are reading or want to read.' })}
      <div class="pl-row rl-tools">${u.chips('ui.f', f, [['all', 'All', s.books.length], ...STATUS.map(([k, l]) => [k, l, s.books.filter(b => b.status === k).length])], 'Filter')}<span class="pl-spacer"></span><div class="rl-search">${I('eye')}${u.input('ui.q', s.ui.q, { label: 'Search books', ph: 'Title, author, genre', live: true })}</div></div>
      ${u.records('books', list, {
        index: b => b.__i, what: 'Book', titleKey: 'title', titlePh: 'Title', cls: 'rl-books',
        sub: b => `${u.pill(ST[b.status], b.status === 'finished' ? 'good' : b.status === 'reading' ? 'world' : b.status === 'dnf' ? 'warn' : '')}`,
        fields: [
          { k: 'author', label: 'Author', ph: 'Author', wide: true }, { k: 'status', label: 'Status', options: STATUS, rerender: true }, { k: 'format', label: 'Format', options: FORMATS },
          { k: 'rating', label: 'Rating', type: 'stars', wide: true }, { k: 'genre', label: 'Genre', ph: 'Fiction' }, { k: 'pages', label: 'Pages', num: true, ph: '—' },
          { k: 'started', label: 'Started', type: 'date' }, { k: 'finished', label: 'Finished', type: 'date' },
          { k: 'notes', label: 'Notes & quotes', type: 'textarea', wide: true, ph: 'What stayed with you?' }
        ],
        add: 'Add book', addKind: 'world', empty: s.books.length ? '<p class="pl-muted">No books match.</p>' : u.empty('list', 'No books yet', 'Add what you’re reading now, then a few you want to read next.')
      })}`;
    }
  };

  const stats = {
    id: 'stats', label: 'Year in books', icon: 'chart',
    render(ctx) {
      const s = ctx.state, y = year(), fin = finishedIn(s, y), pages = fin.reduce((a, b) => a + P.num(b.pages), 0);
      const months = Array.from({ length: 12 }, (_, m) => fin.filter(b => +b.finished.slice(5, 7) === m + 1).length), max = Math.max(1, ...months);
      const genres = Object.entries(fin.reduce((m, b) => { const g = b.genre || 'Other'; m[g] = (m[g] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]);
      const rated = fin.filter(b => P.num(b.rating));
      const fav = rated.slice().sort((a, b) => P.num(b.rating) - P.num(a.rating))[0];
      return `${u.head({ eyebrow: y, title: 'Your year in <em>books</em>' })}
      ${u.kpis([['Finished', String(fin.length), 'y-kpi--world'], ['Pages', P.plural(Math.round(pages), 'page').replace(/^(\d+)/, n => Number(n).toLocaleString('en-US'))], ['Average rating', rated.length ? (rated.reduce((a, b) => a + P.num(b.rating), 0) / rated.length).toFixed(1) + ' ★' : '—', 'y-kpi--accent'], ['Favorite', fav ? esc(fav.title) : '—', 'rl-fav']])}
      <div class="pl-grid">
        ${u.panel('Books per month', `<div class="rl-months">${months.map((n, m) => `<div class="rl-month"><span class="rl-bar" style="height:${n / max * 100}%"></span><b class="y-num">${n || ''}</b><small>${new Date(2000, m, 1).toLocaleDateString('en-US', { month: 'short' })}</small></div>`).join('')}</div>`, { icon: 'chart', cls: 'pl-7' })}
        ${u.panel('Genres', genres.length ? genres.map(([g, n]) => `<div class="rl-genre"><span>${esc(g)}</span><span class="rl-track"><i style="width:${n / fin.length * 100}%"></i></span><b class="y-num">${n}</b></div>`).join('') : '<p class="pl-muted">Finish a book this year to see this.</p>', { icon: 'star', cls: 'pl-5' })}
      </div>`;
    }
  };

  const notes = {
    id: 'notes', label: 'Notes', icon: 'edit',
    render(ctx) { return `${u.head({ eyebrow: 'Parking lot', title: 'Notes', lede: 'Book club picks, recommendations from friends, authors to look up.' })}${u.field('Reader', 'reader', ctx.state.reader, { ph: 'Your name' })}<div style="height:12px"></div>${u.notes('notes', ctx.state.notes, { rows: 12 })}`; }
  };

  window.HTReading = { pages: { shelf, library, stats }, blank, sample, normalize, pct, rows: { books: () => book() } };
})();
