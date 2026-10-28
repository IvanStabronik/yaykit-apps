/* Job Search App — interview practice flashcards with self-rating and an answer timer, plus upcoming interviews, from Interview Prep. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const CATS = ['Common', 'Behavioral', 'Role-specific', 'Technical', 'Questions to ask'];
  const LEVELS = [['0', 'New'], ['1', 'Needs work'], ['2', 'Getting there'], ['3', 'Nailed it']];
  const LV = Object.fromEntries(LEVELS);
  const txt = v => (v == null ? '' : String(v));
  const card = (cat, q, a, level) => ({ id: P.uid(), cat: cat || 'Common', q: q || '', a: a || '', level: txt(level || 0) });
  const interview = o => Object.assign({ id: P.uid(), company: '', role: '', when: '', time: '', format: 'Video', who: '', research: '', ask: '', after: '' }, o || {});
  const SAMPLE = [
    ['Common', 'Tell me about yourself.', 'Present → past → why this role now, in 60–90 seconds. End with why their team.', 3],
    ['Common', 'Why do you want this job?', 'Two or three specifics about them + how my skills fit. Mention the product I actually use.', 2],
    ['Common', 'What’s your greatest strength?', 'Turning messy processes into simple ones — the onboarding checklist story (cut ramp-up from 6 to 3 weeks).', 2],
    ['Common', 'What’s a weakness you’re working on?', 'Saying yes too fast. Now: “let me check my week and get back to you by 3”.', 1],
    ['Behavioral', 'Tell me about a conflict at work.', 'STAR: launch date disagreement with engineering → shared a risk list → agreed a smaller first release → shipped on time.', 1],
    ['Behavioral', 'Describe a time you failed.', 'Missed a survey bias; results were skewed. Owned it, re-ran with a better sample, added a review step.', 0],
    ['Behavioral', 'Tell me about leading without authority.', 'Rallied three teams around one shared dashboard; weekly 15-min check-in; adoption went from 0 to 40 people.', 2],
    ['Role-specific', 'Walk me through a research project end to end.', 'Question → method choice → recruiting → synthesis → decision it changed.', 1],
    ['Questions to ask', 'What does success look like in the first 90 days?', '', 0],
    ['Questions to ask', 'What’s the biggest challenge the team is facing right now?', '', 0]
  ];

  function blank() { return { deck: '', cards: [], interviews: [] }; }
  function sample() {
    return {
      deck: 'Product design interviews',
      cards: SAMPLE.map(c => card(...c)),
      interviews: [interview({ company: 'Harbor Softworks', role: 'Product Designer', when: D.add(D.today(), 2), time: '14:00', format: 'Panel · video', who: 'Design lead + PM', research: 'Launched a new onboarding flow in March. Team of 6 designers. Values: “ship small, learn fast”.', ask: 'How do designers and PMs split discovery?\nWhat would you want me to own in the first 3 months?' })]
    };
  }
  function normalize(s) {
    s.deck = txt(s.deck);
    s.cards = (Array.isArray(s.cards) ? s.cards : []).filter(x => x && typeof x === 'object').map(x => Object.assign(card(CATS.includes(x.cat) ? x.cat : 'Common', txt(x.q), txt(x.a), LV[x.level] ? x.level : '0'), { id: txt(x.id) || P.uid() }));
    s.interviews = (Array.isArray(s.interviews) ? s.interviews : []).filter(x => x && typeof x === 'object').map(x => { const o = interview(); Object.keys(o).forEach(k => { o[k] = txt(x[k]) || (k === 'id' ? P.uid() : o[k]); }); return o; });
    return s;
  }

  function pool(s) {
    const cat = CATS.includes(s.ui.cat) ? s.ui.cat : 'all';
    let list = s.cards.filter(c => P.has(c.q) && (cat === 'all' || c.cat === cat) && (!s.ui.weak || +c.level < 3));
    const order = Array.isArray(s.ui.order) ? s.ui.order : [];
    if (s.ui.shuffle && order.length) list = list.slice().sort((a, b) => (order.indexOf(a.id) + 1 || 1e9) - (order.indexOf(b.id) + 1 || 1e9));
    return list;
  }
  const cur = s => { const p = pool(s); const i = Math.max(0, Math.min(p.length - 1, Math.round(P.num(s.ui.idx)))); return { p, i, c: p[i] }; };

  const practice = {
    id: 'practice', label: 'Practice', icon: 'star',
    render(ctx) {
      const s = ctx.state, { p, i, c } = cur(s), cat = CATS.includes(s.ui.cat) ? s.ui.cat : 'all';
      const tm = ctx.timer.state; if (!tm.running && !tm.total) { tm.total = 120; tm.left = 120; tm.label = 'Answer timer · 2 min'; }
      const nailed = s.cards.filter(x => x.level === '3').length, total = s.cards.filter(x => P.has(x.q)).length;
      const next = s.interviews.filter(x => D.parse(x.when) && x.when >= D.today()).sort((a, b) => a.when.localeCompare(b.when))[0];
      return `${u.head({ eyebrow: s.deck || 'Interview prep', title: total ? `<em>${nailed}</em> of ${total} answers nailed` : 'Practice <em>out loud</em>', meta: next ? `<span class="y-sticker">${I('calendar')}${esc(next.company || 'Interview')} ${esc(D.rel(next.when))}</span>` : '' })}
      <div class="pl-row ip-tools">${u.chips('ui.cat', cat, [['all', 'All', total], ...CATS.map(k => [k, k, s.cards.filter(x => x.cat === k && P.has(x.q)).length]).filter(x => x[2])], 'Category')}<span class="pl-spacer"></span>${u.switch('ui.weak', s.ui.weak, 'Skip nailed ones')}${u.switch('ui.shuffle', s.ui.shuffle, 'Shuffle')}</div>
      ${c ? `<div class="ip-stage">
        <button type="button" class="ip-card${s.ui.flip ? ' is-flipped' : ''}" data-act="flip" aria-label="${s.ui.flip ? 'Show the question' : 'Show your answer notes'}">
          <span class="ip-card-meta">${esc(c.cat)} · ${i + 1} / ${p.length}</span>
          <span class="ip-q">${esc(c.q)}</span>
          ${s.ui.flip ? `<span class="ip-a">${c.a ? esc(c.a) : '<i>No notes yet — add them on the Deck page.</i>'}</span>` : '<span class="ip-hint">Answer out loud, then tap to see your notes</span>'}
        </button>
        <div class="ip-side">
          ${u.timer({ idle: 'Answer timer · 2 min', cls: 'ip-timer' })}
          <div class="ip-rate" role="group" aria-label="How did that go?"><span class="y-label">How did that go?</span>${LEVELS.slice(1).map(([v, l]) => `<button type="button" class="y-btn y-btn--${c.level === v ? 'world' : 'secondary'} ip-rate-btn" data-act="rate" data-v="${v}" aria-pressed="${c.level === v}">${esc(l)}</button>`).join('')}</div>
        </div>
      </div>
      <div class="pl-row ip-nav">${u.btn('Previous', { icon: 'prev', act: 'step', data: { n: -1 }, disabled: i === 0 })}<span class="pl-muted y-num">${i + 1} of ${p.length}</span>${u.btn('Next question', { kind: 'world', icon: 'next', act: 'step', data: { n: 1 } })}</div>`
        : total ? u.empty('check', 'Nothing left in this set', 'Everything here is nailed — turn off “Skip nailed ones” or pick another category.') : u.empty('star', 'No cards yet', 'Add the questions you expect — the Deck page has room for your answer notes.', u.btn('Add questions', { kind: 'world', act: 'go', data: { page: 'deck' } }))}`;
    },
    actions: {
      flip(ctx) { ctx.state.ui.flip = !ctx.state.ui.flip; },
      step(ctx, d) { const s = ctx.state, { p, i } = cur(s); s.ui.idx = p.length ? (i + +d.n + p.length) % p.length : 0; s.ui.flip = false; ctx.timer.clear(); },
      rate(ctx, d) { const s = ctx.state, { c } = cur(s); if (!c) return false; const w = s.ui.weak && d.v === '3'; c.level = d.v; if (!w) { const { p, i } = cur(s); s.ui.idx = p.length ? (i + 1) % p.length : 0; } s.ui.flip = false; ctx.timer.clear(); ctx.toast(d.v === '3' ? 'Nailed it!' : 'Saved — on to the next one'); }
    }
  };

  const deck = {
    id: 'deck', label: 'Deck', icon: 'list',
    render(ctx) {
      const s = ctx.state, cat = CATS.includes(s.ui.dcat) ? s.ui.dcat : 'all';
      const list = s.cards.map((c, i) => Object.assign({ __i: i }, c)).filter(c => cat === 'all' || c.cat === cat);
      return `${u.head({ eyebrow: 'Your deck', title: 'Questions & answer notes', lede: 'Write bullet notes, not scripts. For behavioral questions, use STAR: situation, task, action, result.' })}
      ${u.field('Deck name', 'deck', s.deck, { ph: 'e.g. Product design interviews' })}
      <div class="pl-row ip-tools">${u.chips('ui.dcat', cat, [['all', 'All', s.cards.length], ...CATS.map(k => [k, k, s.cards.filter(x => x.cat === k).length])], 'Category')}</div>
      <div class="ip-deck">${list.map(c => `<article class="ip-edit">
        <div class="ip-edit-head">${u.select(`cards.${c.__i}.cat`, c.cat, CATS, { label: 'Category', cls: 'ip-mini', rerender: true })}${u.select(`cards.${c.__i}.level`, c.level, LEVELS, { label: 'Confidence', cls: 'ip-mini' })}<span class="pl-spacer"></span>${u.rowTools('cards', c.__i, s.cards.length, { move: true, what: 'card', label: c.q })}</div>
        ${u.textarea(`cards.${c.__i}.q`, c.q, { label: 'Question', ph: 'Question', rows: 1, auto: true, cls: 'ip-q-in' })}
        ${u.textarea(`cards.${c.__i}.a`, c.a, { label: 'Answer notes', ph: 'Answer notes — bullets are fine', rows: 2, auto: true })}</article>`).join('') || u.empty('list', 'No cards here', 'Add your first question below.')}</div>
      <div class="pl-row">${u.btn('Add question', { kind: 'world', icon: 'plus', act: 'addCard', data: { cat: cat === 'all' ? 'Common' : cat } })}${s.cards.length ? '' : u.btn('Add 10 classic questions', { icon: 'sparkle', act: 'classics' })}</div>`;
    },
    actions: {
      addCard(ctx, d) { const s = ctx.state; s.cards.push(card(d.cat)); ctx.focus(`[data-bind="cards.${s.cards.length - 1}.q"]`); },
      classics(ctx) { SAMPLE.forEach(c => ctx.state.cards.push(card(c[0], c[1], '', 0))); ctx.toast('10 classic questions added — write your notes'); }
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>${esc(s.deck || 'Interview prep')}</h1><p class="pl-sheet-meta">${s.cards.length} questions</p>${CATS.map(k => { const l = s.cards.filter(c => c.cat === k && P.has(c.q)); return l.length ? `<h2>${esc(k)}</h2><ol class="ip-sheet">${l.map(c => `<li><b>${esc(c.q)}</b>${c.a ? `<p>${esc(c.a)}</p>` : ''}</li>`).join('')}</ol>` : ''; }).join('')}`;
    }
  };

  const interviews = {
    id: 'interviews', label: 'Interviews', icon: 'calendar',
    badge: ctx => ctx.state.interviews.filter(x => D.parse(x.when) && x.when >= D.today() && D.diff(D.today(), x.when) <= 7).length || '',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Coming up', title: 'Interviews', lede: 'Research, who you’re meeting, questions to ask — and a quick debrief afterwards while it’s fresh.' })}
      ${u.records('interviews', s.interviews, {
        what: 'Interview', titleKey: 'company', titlePh: 'Company',
        sub: x => D.parse(x.when) ? `${esc(D.long(x.when))}${x.time ? ' · ' + esc(D.time(x.time)) : ''} · ${esc(D.rel(x.when))}` : 'No date yet',
        fields: [{ k: 'role', label: 'Role', wide: true }, { k: 'when', label: 'Date', type: 'date', rerender: true }, { k: 'time', label: 'Time', type: 'time' }, { k: 'format', label: 'Format', ph: 'Video, phone, on-site' }, { k: 'who', label: 'Meeting with', ph: 'Names and roles' },
          { k: 'research', label: 'Research notes', type: 'textarea', wide: true, ph: 'What they do, recent news, values' }, { k: 'ask', label: 'Questions to ask', type: 'textarea', wide: true, ph: 'One per line' }, { k: 'after', label: 'Debrief', type: 'textarea', wide: true, ph: 'What went well, what to prep next time, thank-you note sent?' }],
        add: 'Add interview', addKind: 'world', empty: u.empty('calendar', 'No interviews yet', 'Add one as soon as it’s scheduled.')
      })}`;
    }
  };

  window.JBPrep = {
    pages: { practice, deck, interviews }, blank, sample, normalize,
    open(ctx) { const s = ctx.state; s.ui.flip = false; if (s.ui.shuffle && !(Array.isArray(s.ui.order) && s.ui.order.length)) s.ui.order = s.cards.map(c => c.id).sort(() => Math.random() - 0.5); },
    onEdit(ctx, path, value) { if (path === 'ui.shuffle') { ctx.state.ui.order = value ? ctx.state.cards.map(c => c.id).sort(() => Math.random() - 0.5) : []; ctx.state.ui.idx = 0; } },
    rows: { cards: () => card(), interviews: () => interview() }
  };
})();
