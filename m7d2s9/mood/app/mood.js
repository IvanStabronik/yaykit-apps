/* Mood Journal App — a daily mood check-in with emotions, what affected it and gratitude, a year in pixels, the journal,
   a thought record, a self-care menu with a coping list, and insights. Yaykit planner engine, sky world (mood.css). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const MOODS = [['1', 'Rough'], ['2', 'Low'], ['3', 'Okay'], ['4', 'Good'], ['5', 'Great']];
  const MOOD = Object.fromEntries(MOODS);
  const ENERGY = [['1', 'Empty'], ['2', 'Low'], ['3', 'Steady'], ['4', 'Good'], ['5', 'Buzzing']];
  const EMOS = ['Calm', 'Happy', 'Grateful', 'Hopeful', 'Proud', 'Loved', 'Tired', 'Anxious', 'Stressed', 'Sad', 'Lonely', 'Irritated', 'Overwhelmed', 'Bored'];
  const TAGS = ['Sleep', 'Work', 'Family', 'Friends', 'Partner', 'Exercise', 'Outdoors', 'Weather', 'Health', 'Food', 'Money', 'Screen time', 'Rest', 'Hobby'];
  const LENS = [['5', '5 minutes'], ['15', '15 minutes'], ['long', 'Longer']];
  const PROMPTS = ['What is one small thing that went right today?', 'What did your body need today?', 'Who made today a little easier?',
    'What are you carrying that you could put down?', 'What would you tell a friend who had your day?', 'What gave you energy today — and what took it?',
    'What are you looking forward to, even a little?', 'Where did you feel most like yourself today?', 'What is one thing you can let go of tonight?',
    'What helped, even for a minute?'];
  const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const txt = v => (v == null ? '' : String(v));
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
  const r1 = n => Math.round(n * 10) / 10;

  const dayRec = o => { o = o || {}; const g = Array.isArray(o.grat) ? o.grat : [];
    return { mood: MOOD[o.mood] ? String(o.mood) : '', energy: ENERGY.some(e => e[0] === String(o.energy)) ? String(o.energy) : '',
      emo: (Array.isArray(o.emo) ? o.emo : []).filter(x => EMOS.includes(x)), tags: (Array.isArray(o.tags) ? o.tags : []).filter(x => TAGS.includes(x)),
      note: txt(o.note), grat: [0, 1, 2].map(i => txt(g[i])) }; };
  const thought = o => Object.assign({ id: P.uid(), date: D.today(), situation: '', thought: '', before: '', forv: '', against: '', alt: '', after: '' }, o || {});
  const idea = (text, len) => ({ id: P.uid(), text: text || '', len: len || '5' });
  const cope = (when, can) => ({ id: P.uid(), when: when || '', can: can || '' });
  const STARTER = [['Drink a glass of water', '5'], ['Step outside for fresh air', '5'], ['Five slow breaths', '5'], ['Text someone you like', '5'], ['Stretch', '5'],
    ['Walk around the block', '15'], ['Shower and fresh clothes', '15'], ['Tidy one small spot', '15'], ['Make a warm drink and sit', '15'], ['Listen to one album', '15'],
    ['Cook something simple', 'long'], ['A long walk or bike ride', 'long'], ['A bath with no phone', 'long'], ['An early night', 'long']];

  function blank() { return { days: {}, thoughts: [], care: { menu: STARTER.map(([t, l]) => idea(t, l)), log: {} }, coping: [], notes: '' }; }
  function sample() {
    const s = blank(), t = D.today();
    /* a repeatable mood pattern: work weeks dip, weekends, exercise and friends lift — so insights have something to say */
    let seed = 7;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const notes = ['Long day but I got through the list.', 'Slept badly. Coffee did not help.', 'Lunch with Maya — laughed a lot.', 'Rain all day. Stayed in with a book.',
      'Big deadline done!', 'Felt low in the afternoon, a walk helped.', 'Quiet, ordinary, good.', 'Too much screen time tonight.', 'Called Mom.', 'Yoga before work.'];
    const grats = ['Warm coffee', 'A text from Sam', 'Sunshine at lunch', 'Clean sheets', 'My dog', 'A good song on the radio', 'Leftover soup', 'A quiet morning', 'Finishing early', 'Kind barista'];
    for (let i = 119; i >= 0; i--) {
      const d = D.add(t, -i), wd = D.parse(d).getDay();
      if (i > 0 && rnd() < 0.08) continue;   // a few missed days, like real life
      const tags = [];
      const work = wd >= 1 && wd <= 5, ex = rnd() < 0.4, fr = rnd() < 0.3, sleep = rnd() < 0.35, scr = rnd() < 0.25;
      if (work) tags.push('Work'); if (ex) tags.push('Exercise'); if (fr) tags.push('Friends'); if (sleep) tags.push('Sleep'); if (scr) tags.push('Screen time');
      if (rnd() < 0.2) tags.push('Weather'); if (rnd() < 0.15) tags.push('Family');
      let m = 3 + (work ? -0.4 : 0.5) + (ex ? 0.8 : 0) + (fr ? 0.7 : 0) + (sleep ? -1 : 0) + (scr ? -0.6 : 0) + (rnd() - 0.5);
      m = Math.max(1, Math.min(5, Math.round(m)));
      const emo = m >= 4 ? ['Happy', 'Calm', 'Grateful', 'Proud'].filter(() => rnd() < 0.45) : m <= 2 ? ['Tired', 'Anxious', 'Stressed', 'Sad'].filter(() => rnd() < 0.45) : ['Calm', 'Tired'].filter(() => rnd() < 0.5);
      s.days[d] = dayRec({ mood: String(m), energy: String(Math.max(1, Math.min(5, m + Math.round(rnd() * 2 - 1)))), emo, tags,
        note: rnd() < 0.55 ? notes[Math.floor(rnd() * notes.length)] : '', grat: rnd() < 0.6 ? [grats[Math.floor(rnd() * 10)], grats[Math.floor(rnd() * 10)], ''] : [] });
    }
    s.days[t] = dayRec({ mood: '4', energy: '3', emo: ['Calm', 'Grateful'], tags: ['Work', 'Exercise'], note: 'Morning run before work. The meeting went better than I feared.', grat: ['A run in the cold air', 'Maya’s voice note', ''] });
    s.thoughts = [thought({ date: D.add(t, -3), situation: 'My manager asked for “a quick chat” tomorrow.', thought: 'I must have messed something up.', before: '80',
        forv: 'The last project ran late.', against: 'She praised my report last week. Quick chats are often about planning.', alt: 'I don’t know what it’s about yet. If it is feedback, I can handle it.', after: '40' }),
      thought({ date: D.add(t, -16), situation: 'Friend didn’t reply for two days.', thought: 'She’s annoyed with me.', before: '65', forv: 'I cancelled plans last month.',
        against: 'She told me work is crazy right now. She hearted my photo.', alt: 'She is probably busy. I can check in without blaming.', after: '25' }),
      thought({ date: D.add(t, -40), situation: 'Skipped the gym three times this week.', thought: 'I never stick to anything.', before: '70', forv: 'I quit running last year.',
        against: 'I have journaled most days for months. I went twice last week.', alt: 'This week was busy. I can do a short session tomorrow.', after: '35' })];
    const menu = s.care.menu;
    s.care.log = { [t]: { [menu[0].id]: true, [menu[5].id]: true }, [D.add(t, -1)]: { [menu[2].id]: true }, [D.add(t, -2)]: { [menu[11].id]: true } };
    s.coping = [cope('Anxious before a meeting', 'Box breathing for one minute, write down the one thing I want to say.'), cope('Low and flat in the afternoon', 'Walk around the block, then a glass of water and a snack.'),
      cope('Overwhelmed by the to-do list', 'Pick three things. Move the rest to tomorrow on purpose.'), cope('Lonely in the evening', 'Text one person. Put on a podcast while I cook.')];
    s.notes = 'Things that help: morning light, moving my body, a real lunch break.';
    return s;
  }
  function normalize(s) {
    const days = s.days && typeof s.days === 'object' ? s.days : {};
    s.days = Object.fromEntries(Object.keys(days).filter(k => D.parse(k) && days[k] && typeof days[k] === 'object').map(k => [k, dayRec(days[k])]));
    s.thoughts = arr(s.thoughts, x => thought(Object.fromEntries(Object.keys(thought()).map(k => [k, k === 'id' ? txt(x.id) || P.uid() : k === 'date' ? (D.parse(x.date) ? x.date : D.today()) : txt(x[k])]))));
    const c = s.care && typeof s.care === 'object' ? s.care : {};
    const log = c.log && typeof c.log === 'object' ? c.log : {};
    s.care = { menu: arr(c.menu, x => Object.assign(idea(txt(x.text), LENS.some(l => l[0] === x.len) ? x.len : '5'), { id: txt(x.id) || P.uid() })),
      log: Object.fromEntries(Object.keys(log).filter(k => D.parse(k) && log[k] && typeof log[k] === 'object').map(k => [k, Object.fromEntries(Object.keys(log[k]).filter(i => log[k][i]).map(i => [i, true]))])) };
    s.coping = arr(s.coping, x => Object.assign(cope(txt(x.when), txt(x.can)), { id: txt(x.id) || P.uid() }));
    s.notes = txt(s.notes);
    if (!D.parse(s.ui.sel || '')) s.ui.sel = '';
    if (typeof s.ui.q !== 'string') s.ui.q = '';
    if (!/^\d{4}$/.test(s.ui.year || '')) s.ui.year = D.today().slice(0, 4);
    return s;
  }

  /* ---------- helpers ---------- */
  const day = (s, d) => s.days[d] || (s.days[d] = dayRec());
  const logged = (s, d) => !!(s.days[d] && s.days[d].mood);
  const moodOf = (s, d) => P.num((s.days[d] || {}).mood);
  const entries = s => Object.keys(s.days).filter(d => logged(s, d)).sort();
  const avg = l => (l.length ? l.reduce((a, x) => a + x, 0) / l.length : 0);
  const moodName = n => MOOD[String(Math.round(n))] || '—';
  function streak(s) { let d = D.today(), n = 0; if (!logged(s, d)) d = D.add(d, -1); while (logged(s, d) && n < 4000) { n++; d = D.add(d, -1); } return n; }
  const prompt = d => PROMPTS[Math.floor(D.parse(d).getTime() / 864e5) % PROMPTS.length];
  function tagStats(s, since) {
    const out = {};
    entries(s).filter(d => !since || d >= since).forEach(d => day(s, d).tags.forEach(t => { (out[t] = out[t] || []).push(moodOf(s, d)); }));
    return Object.entries(out).filter(([, l]) => l.length >= 3).map(([t, l]) => ({ tag: t, n: l.length, avg: r1(avg(l)) })).sort((a, b) => b.avg - a.avg || b.n - a.n);
  }
  const caredToday = s => Object.values(s.care.log[D.today()] || {}).some(Boolean);

  /* the check-in form for any day: Today uses today, Year and Journal open past days in it */
  function editor(ctx, d, o) {
    const s = ctx.state, x = day(s, d), b = `days.${d}`;
    const chip = (k, v) => { const on = x[k].includes(v); return `<button type="button" class="y-chip pl-chip mj-chip${on ? ' is-on' : ''}" aria-pressed="${on}" data-act="chip" data-k="${k}" data-v="${esc(v)}" data-d="${d}">${esc(v)}</button>`; };
    return `<div class="mj-ed">
      <div class="y-field"><span class="y-label">Mood</span><div class="mj-moods" role="group" aria-label="Mood">${MOODS.map(([v, l]) => `<button type="button" class="mj-mood mj-m${v}${x.mood === v ? ' is-on' : ''}" aria-pressed="${x.mood === v}" data-act="set" data-bind="${b}.mood" data-value="${x.mood === v ? '' : v}"><i></i>${l}</button>`).join('')}</div></div>
      <div class="y-field"><span class="y-label">Feelings</span><div class="pl-chips mj-chips">${EMOS.map(e => chip('emo', e)).join('')}</div></div>
      <div class="y-field"><span class="y-label">What affected it</span><div class="pl-chips mj-chips">${TAGS.map(e => chip('tags', e)).join('')}</div></div>
      <div class="y-field"><span class="y-label">Energy</span>${u.seg(`${b}.energy`, x.energy, ENERGY, 'Energy')}</div>
      ${o && o.prompt ? `<p class="mj-prompt">${I('sparkle')}${esc(prompt(d))}</p>` : ''}
      ${u.field('A few lines', `${b}.note`, x.note, { type: 'textarea', rows: 4, ph: 'What happened, how it felt…' })}
      <div class="y-field"><span class="y-label">Three good things</span><div class="mj-grat">${[0, 1, 2].map(i => u.input(`${b}.grat.${i}`, x.grat[i], { label: `Good thing ${i + 1}`, ph: ['Something small counts', 'Someone, something, anything', 'One more'][i] })).join('')}</div></div>
    </div>`;
  }
  const chipAct = {
    chip(ctx, d) { const x = day(ctx.state, d.d), l = x[d.k]; const i = l.indexOf(d.v); if (i >= 0) l.splice(i, 1); else l.push(d.v); }
  };

  /* ---------- today ---------- */
  const today = {
    id: 'today', label: 'Today', icon: 'heart',
    render(ctx) {
      const s = ctx.state, t = D.today();
      return `${u.head({ eyebrow: D.long(t), title: '<span data-slot="title"></span>', lede: 'A one-minute check-in. Tap how you feel and what affected it; write only if you want to.' })}
      <div data-slot="kpis"></div>
      ${u.panel('Check in', editor(ctx, t, { prompt: true }), { icon: 'heart' })}`;
    },
    slots: {
      title(ctx) { const x = ctx.state.days[D.today()]; return x && x.mood ? `Feeling <em>${esc(MOOD[x.mood].toLowerCase())}</em> today` : 'How are you, <em>really</em>?'; },
      kpis(ctx) {
        const s = ctx.state, t = D.today(), last = Array.from({ length: 7 }, (_, i) => moodOf(s, D.add(t, -i))).filter(Boolean);
        return u.kpis([['Check-in streak', `${streak(s)}<small> days</small>`, 'y-kpi--world'], ['Last 7 days', last.length ? moodName(avg(last)) : '—', '', last.length ? `average of ${last.length} check-ins` : ''],
          ['Self-care today', caredToday(s) ? 'Done' : 'Not yet', caredToday(s) ? 'is-good' : '', `<button type="button" class="mj-link" data-act="go" data-page="care">${caredToday(s) ? 'See the menu' : 'Pick something small'} →</button>`]]);
      }
    },
    actions: chipAct
  };

  /* ---------- year in pixels ---------- */
  const year = {
    id: 'year', label: 'Year', icon: 'calendar',
    render(ctx) {
      const s = ctx.state, y = s.ui.year, t = D.today(), sel = s.ui.sel;
      const months = Array.from({ length: 12 }, (_, m) => new Date(+y, m + 1, 0).getDate());
      const mAvg = months.map((n, m) => { const l = Array.from({ length: n }, (_, i) => moodOf(s, `${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)).filter(Boolean); return l.length ? avg(l) : 0; });
      const cell = (m, dd) => { if (dd > months[m]) return '<span class="mj-px is-void" aria-hidden="true"></span>'; const d = `${y}-${String(m + 1).padStart(2, '0')}-${String(dd).padStart(2, '0')}`, v = (s.days[d] || {}).mood || '';
        return `<span class="mj-px${v ? ` mj-m${v}` : ''}${d === t ? ' is-today' : ''}${d === sel ? ' is-sel' : ''}${d > t ? ' is-future' : ''}" data-d="${d}"${d <= t ? ` data-act="pick" title="${esc(D.short(d))}${v ? `: ${MOOD[v]}` : ''}"` : ''}></span>`; };
      return `${u.head({ eyebrow: 'Year in pixels', title: `<em>${y}</em>, one day at a time`, lede: 'Every check-in is one colored square. Tap a day to open it.', meta: `<div class="mj-ynav">${u.iconBtn('prev', 'Previous year', 'year', { n: -1 })}<b class="y-num">${y}</b>${u.iconBtn('next', 'Next year', 'year', { n: 1 })}</div>` })}
      ${u.panel('', `<div class="mj-grid" role="img" aria-label="Mood for every day of ${y}">
          <span class="mj-corner"></span>${'JFMAMJJASOND'.split('').map(c => `<span class="mj-mh">${c}</span>`).join('')}
          ${Array.from({ length: 31 }, (_, r) => `<span class="mj-dn">${r + 1}</span>${months.map((n, m) => cell(m, r + 1)).join('')}`).join('')}
          <span class="mj-dn mj-avgl">avg</span>${mAvg.map(a => `<span class="mj-px mj-avg${a ? ` mj-m${Math.round(a)}` : ''}" title="${a ? moodName(a) : 'no check-ins'}"></span>`).join('')}</div>
        <p class="mj-key">${MOODS.map(([v, l]) => `<span><i class="mj-m${v}"></i>${l}</span>`).join('')}</p>`, { icon: 'calendar', cls: 'mj-yearpanel' })}
      ${sel ? u.panel(D.long(sel), editor(ctx, sel), { icon: 'edit', actions: u.btn('Close', { sm: true, kind: 'ghost', act: 'set', data: { bind: 'ui.sel', value: '' } }) }) : ''}`;
    },
    actions: Object.assign({
      pick(ctx, d, el) { ctx.state.ui.sel = el.dataset.d; },
      year(ctx, d) { ctx.state.ui.year = String(+ctx.state.ui.year + +d.n); ctx.state.ui.sel = ''; }
    }, chipAct)
  };

  /* ---------- journal ---------- */
  const journal = {
    id: 'journal', label: 'Journal', icon: 'edit',
    render(ctx) {
      const s = ctx.state, q = s.ui.q.toLowerCase().trim();
      const list = entries(s).reverse().filter(d => { const x = s.days[d]; return !q || [x.note, ...x.emo, ...x.tags, ...x.grat, MOOD[x.mood]].join(' ').toLowerCase().includes(q); });
      const open = s.ui.sel && s.days[s.ui.sel] ? s.ui.sel : '';
      return `${u.head({ eyebrow: 'Journal', title: `<em>${entries(s).length}</em> check-ins`, lede: 'Every day you checked in, newest first. Search a feeling, a person or a word.' })}
      <div class="pl-row mj-tools"><div class="mj-search">${I('eye')}${u.input('ui.q', s.ui.q, { label: 'Search the journal', ph: 'Search — try “walk” or “anxious”', live: true })}</div><span class="pl-muted">${list.length} shown</span></div>
      ${open ? u.panel(D.long(open), editor(ctx, open), { icon: 'edit', actions: u.btn('Done', { sm: true, kind: 'world', icon: 'check', act: 'set', data: { bind: 'ui.sel', value: '' } }) }) : ''}
      ${list.length ? `<div class="mj-entries">${list.slice(0, 60).map(d => { const x = s.days[d]; return `<article class="mj-entry">
          <header><span class="mj-dot mj-m${x.mood}"></span><b>${esc(D.fmt(d, { weekday: 'short' }))} ${esc(D.short(d))}</b>${u.pill(MOOD[x.mood], +x.mood >= 4 ? 'good' : +x.mood <= 2 ? 'bad' : '')}<span class="pl-spacer"></span>${u.btn('Edit', { sm: true, kind: 'ghost', icon: 'edit', act: 'set', data: { bind: 'ui.sel', value: d } })}</header>
          ${x.emo.length || x.tags.length ? `<p class="mj-tags">${x.emo.map(e => `<span class="mj-tag is-emo">${esc(e)}</span>`).join('')}${x.tags.map(e => `<span class="mj-tag">${esc(e)}</span>`).join('')}</p>` : ''}
          ${x.note ? `<p class="mj-note">${esc(x.note)}</p>` : ''}${x.grat.some(Boolean) ? `<p class="mj-gl">${I('heart')}${x.grat.filter(Boolean).map(esc).join(' · ')}</p>` : ''}</article>`; }).join('')}</div>`
        : u.empty('edit', entries(s).length ? 'Nothing matches' : 'No check-ins yet', entries(s).length ? 'Try another word.' : 'Check in on Today — it takes a minute.')}`;
    },
    actions: chipAct,
    sheet(ctx) {
      const s = ctx.state, l = entries(s).reverse().slice(0, 31);
      return `<h1>Mood journal</h1><table><thead><tr><th>Date</th><th>Mood</th><th>Feelings</th><th>Notes</th></tr></thead><tbody>${l.map(d => { const x = s.days[d]; return `<tr><td>${esc(D.short(d))}</td><td>${esc(MOOD[x.mood])}</td><td>${esc(x.emo.join(', '))}</td><td>${esc(x.note)}</td></tr>`; }).join('')}</tbody></table>`;
    }
  };

  /* ---------- thought record ---------- */
  const thoughts = {
    id: 'thoughts', label: 'Thoughts', icon: 'star',
    render(ctx) {
      const s = ctx.state, rows = s.thoughts.map((x, i) => Object.assign({ __i: i }, x)).sort((a, b) => (a.date < b.date ? 1 : -1));
      return `${u.head({ eyebrow: 'Thought record', title: 'Look at a thought, <em>gently</em>', lede: 'When a thought hits hard, write it down and look at it from both sides. A reflection tool for you — not therapy.' })}
      ${u.records('thoughts', rows, {
        index: x => x.__i, what: 'Thought record', titleKey: 'situation', titlePh: 'What happened?', cls: 'mj-thoughts', add: 'New thought record', addKind: 'world',
        sub: x => `${esc(D.short(x.date))}${P.has(x.before) && P.has(x.after) ? ` · feeling ${esc(x.before)} → <b>${esc(x.after)}</b>` : ''}`,
        fields: [
          { k: 'thought', label: 'The thought', type: 'textarea', wide: true, ph: 'What went through your mind?' },
          { k: 'before', label: 'How strong was the feeling? (0–100)', num: true, ph: '70' }, { k: 'date', label: 'Date', type: 'date' },
          { k: 'forv', label: 'What supports it', type: 'textarea', rows: 4, ph: 'Facts only' }, { k: 'against', label: 'What doesn’t fit it', type: 'textarea', rows: 4, ph: 'Other facts, other times' },
          { k: 'alt', label: 'A kinder, more balanced thought', type: 'textarea', wide: true, ph: 'What would you tell a friend?' },
          { k: 'after', label: 'Feeling now (0–100)', num: true, ph: '40' }
        ],
        empty: u.empty('star', 'No thought records yet', 'Use one the next time a thought keeps looping.')
      })}`;
    }
  };

  /* ---------- self-care ---------- */
  const care = {
    id: 'care', label: 'Self-care', icon: 'sparkle',
    render(ctx) {
      const s = ctx.state, t = D.today(), log = s.care.log[t] || {};
      const week = Array.from({ length: 7 }, (_, i) => D.add(t, i - 6));
      return `${u.head({ eyebrow: 'Self-care', title: caredToday(s) ? 'You did <em>something kind</em> today' : 'Pick one <em>small</em> thing', lede: 'A menu to choose from when you have no ideas left. Tick what you did today.' })}
      <div class="mj-week">${week.map(d => `<span class="${Object.values(s.care.log[d] || {}).some(Boolean) ? 'is-on' : ''}${d === t ? ' is-today' : ''}" title="${esc(D.short(d))}"><b>${esc(D.fmt(d, { weekday: 'short' }).slice(0, 2))}</b></span>`).join('')}</div>
      <div class="mj-menu">${LENS.map(([k, l]) => { const items = s.care.menu.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.len === k);
        return u.panel(l, `<ul class="pl-checklist">${items.map(x => `<li class="pl-ci${log[x.id] ? ' is-done' : ''}">${u.tick(`care.log.${t}.${x.id}`, !!log[x.id], `Did it today: ${x.text}`, { rerender: true })}
            <div class="pl-ci-main">${u.input(`care.menu.${x.__i}.text`, x.text, { label: `Self-care idea ${x.__i + 1}`, ph: 'Idea', cls: 'mj-idea' })}</div>${u.rowTools('care.menu', x.__i, s.care.menu.length, { what: 'idea', label: x.text })}</li>`).join('')}</ul>
          <div class="pl-list-foot">${u.btn('Add idea', { sm: true, icon: 'plus', act: 'addIdea', data: { len: k } })}</div>`, { icon: k === 'long' ? 'heart' : 'timer', cls: 'y-panel--flat' }); }).join('')}</div>
      ${u.panel('When I feel…, I can…', u.table('coping', s.coping, [
        { k: 'when', label: 'When I feel', title: true, w: '1fr', ph: 'Anxious before a call' },
        { k: 'can', label: 'I can', w: '1.6fr', ph: 'Breathe out longer than in, for one minute' }
      ], { what: 'coping idea', add: 'Add a line', tpl: 'coping', cls: 'mj-cope', empty: 'Write what helps, while you feel okay — it is there for the hard days.' }), { icon: 'heart' })}`;
    },
    actions: { addIdea(ctx, d) { const s = ctx.state; s.care.menu.push(idea('', d.len)); ctx.focus(`[data-bind="care.menu.${s.care.menu.length - 1}.text"]`); } },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Self-care menu</h1>${LENS.map(([k, l]) => `<h2>${esc(l)}</h2><ul>${s.care.menu.filter(x => x.len === k && P.has(x.text)).map(x => `<li>${esc(x.text)}</li>`).join('')}</ul>`).join('')}
        <h2>When I feel…, I can…</h2><table><tbody>${s.coping.filter(x => P.has(x.when)).map(x => `<tr><td><b>${esc(x.when)}</b></td><td>${esc(x.can)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- insights ---------- */
  const insights = {
    id: 'insights', label: 'Insights', icon: 'chart',
    render(ctx) {
      const s = ctx.state, t = D.today(), since = D.add(t, -29), l30 = entries(s).filter(d => d >= since).map(d => moodOf(s, d));
      const wd = WEEK.map((n, i) => { const l = entries(s).filter(d => D.parse(d).getDay() === i).map(d => moodOf(s, d)); return { n, avg: l.length ? avg(l) : 0, c: l.length }; });
      const ranked = wd.filter(x => x.c >= 2).sort((a, b) => b.avg - a.avg), tags = tagStats(s);
      const all = avg(entries(s).map(d => moodOf(s, d)));
      return `${u.head({ eyebrow: 'Insights', title: l30.length ? `Last 30 days: <em>${moodName(avg(l30)).toLowerCase()}</em>` : 'Your <em>patterns</em>', lede: 'Patterns, not verdicts. They show up after a few weeks of check-ins.' })}
      ${u.kpis([['Average, 30 days', l30.length ? `${r1(avg(l30))}<small> / 5</small>` : '—', 'y-kpi--world', `${l30.length} check-ins`], ['Check-in streak', `${streak(s)}<small> days</small>`, ''],
        ['Best day', ranked.length ? ranked[0].n : '—', 'is-good', ranked.length ? `average ${r1(ranked[0].avg)}` : ''], ['Hardest day', ranked.length > 1 ? ranked[ranked.length - 1].n : '—', '', ranked.length > 1 ? `average ${r1(ranked[ranked.length - 1].avg)}` : '']])}
      <div class="pl-grid">
        ${u.panel('What goes with better days', tags.length ? `<ul class="mj-insight">${tags.map(x => `<li data-tag="${esc(x.tag)}"><span>${esc(x.tag)}</span><span class="mj-bar"><i class="mj-m${Math.round(x.avg)}" style="width:${x.avg / 5 * 100}%"></i></span><b class="y-num">${x.avg.toFixed(1)}</b><small class="pl-muted">${x.n} days</small></li>`).join('')}</ul>
          <p class="pl-hint">Average mood on days you tagged each thing (3+ days). Your overall average is ${all ? all.toFixed(1) : '—'}.</p>` : '<p class="pl-muted">Tag “what affected it” on a few check-ins to see this.</p>', { icon: 'chart', cls: 'pl-7' })}
        ${u.panel('By weekday', `<ul class="mj-insight">${wd.map(x => `<li><span>${x.n.slice(0, 3)}</span><span class="mj-bar"><i class="${x.avg ? `mj-m${Math.round(x.avg)}` : ''}" style="width:${x.avg / 5 * 100}%"></i></span><b class="y-num">${x.avg ? x.avg.toFixed(1) : '—'}</b></li>`).join('')}</ul>`, { icon: 'calendar', cls: 'pl-5' })}
      </div>
      ${u.notes('notes', s.notes, { rows: 4, title: 'What I’ve noticed', ph: 'Things that help, things to watch for…' })}`;
    }
  };

  P.create({
    slug: 'mood-journal-app', name: 'Mood Journal', world: 'sky',
    welcome: 'Check in on Today: tap your mood and what affected it. One minute a day is enough.',
    pages: [today, year, journal, thoughts, care, insights],
    blank, sample, normalize,
    rows: { thoughts: () => thought(), coping: () => cope(), menu: () => idea() },
    about: '<p><b>Mood Journal</b> is a private daily check-in: your mood, feelings, what affected it, energy, a few lines and three good things. It shows your year in pixels, keeps a searchable journal, a thought record for hard moments, a self-care menu with a coping list, and gentle insights about what goes with better days.</p>',
    disclaimer: 'Mood Journal is a personal reflection tool, not therapy, diagnosis or medical advice. If you are in crisis or think you may hurt yourself, contact your local emergency services or a crisis line in your country right away.'
  });
})();
