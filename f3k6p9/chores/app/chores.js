/* Family Chore App — the chore board, chores, kids & rewards and weekly history, from Chore Board. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const COLORS = ['#FFB86B', '#9BE3C4', '#B7C4FF', '#FFB3C8', '#FFD65C', '#C9E7FF'];
  const txt = v => (v == null ? '' : String(v));
  const kid = (name, goal, reward, i) => ({ id: P.uid(), name: name || '', goal: txt(goal || 30), reward: reward || '', color: COLORS[(i || 0) % COLORS.length] });
  const chore = (title, points, status, by) => ({ id: P.uid(), title: title || '', points: txt(points || 5), status: status || 'open', by: by || '' });

  function blank() { return { board: '', week: D.monday(D.today()), kids: [], chores: [], history: [] }; }
  function sample() {
    const K = [kid('Maya', 30, 'Pick the Friday movie', 0), kid('Leo', 25, 'Extra 30 min of games', 1), kid('Sam', 20, 'Pancake breakfast of choice', 2)];
    const [m, l, s] = K.map(k => k.id);
    const w = D.monday(D.today());
    return {
      board: 'Rivera family chores', week: w, kids: K,
      chores: [chore('Unload the dishwasher', 5, 'open'), chore('Take out the trash', 4, 'claimed', l), chore('Vacuum the living room', 8, 'open'), chore('Fold laundry', 6, 'done', m), chore('Walk the dog', 7, 'done', s), chore('Wipe kitchen counters', 3, 'claimed', s), chore('Make your bed all week', 5, 'done', l), chore('Water the plants', 3, 'open'), chore('Tidy the shoe rack', 2, 'done', m), chore('Help cook dinner', 8, 'claimed', m)],
      history: [{ week: D.add(w, -7), scores: { [m]: 31, [l]: 18, [s]: 22 } }, { week: D.add(w, -14), scores: { [m]: 26, [l]: 27, [s]: 15 } }]
    };
  }
  function normalize(s) {
    s.board = txt(s.board); s.week = D.parse(s.week) ? s.week : D.monday(D.today());
    s.kids = (Array.isArray(s.kids) ? s.kids : []).filter(x => x && typeof x === 'object').map((x, i) => ({ id: txt(x.id) || P.uid(), name: txt(x.name), goal: txt(x.goal), reward: txt(x.reward), color: /^#[0-9a-f]{6}$/i.test(x.color) ? x.color : COLORS[i % COLORS.length] }));
    const ids = new Set(s.kids.map(k => k.id));
    s.chores = (Array.isArray(s.chores) ? s.chores : []).filter(x => x && typeof x === 'object').map(x => {
      const by = ids.has(x.by) ? x.by : '';
      const st = ['open', 'claimed', 'done'].includes(x.status) ? x.status : 'open';
      return { id: txt(x.id) || P.uid(), title: txt(x.title), points: txt(x.points), status: by || st === 'open' ? st : 'open', by: st === 'open' ? '' : by };
    });
    s.history = (Array.isArray(s.history) ? s.history : []).filter(x => x && D.parse(x.week)).map(x => ({ week: x.week, scores: x.scores && typeof x.scores === 'object' ? Object.fromEntries(Object.keys(x.scores).map(k => [k, Math.round(P.num(x.scores[k]))])) : {} }));
    return s;
  }
  const pts = c => Math.max(0, Math.round(P.num(c.points)));
  const score = (s, id) => s.chores.filter(c => c.status === 'done' && c.by === id).reduce((a, c) => a + pts(c), 0);
  const kidOf = (s, id) => s.kids.find(k => k.id === id);
  const active = s => (kidOf(s, s.ui.kid) ? s.ui.kid : (s.kids[0] || {}).id || '');

  const board = {
    id: 'board', label: 'Board', icon: 'star',
    render(ctx) {
      const s = ctx.state, me = active(s), cols = [['open', 'Up for grabs'], ['claimed', 'Doing it'], ['done', 'Done']];
      const card = c => {
        const k = kidOf(s, c.by);
        const btn = c.status === 'open' ? (me ? u.btn(`Claim for ${kidOf(s, me).name || 'kid'}`, { sm: true, kind: 'world', act: 'claim', data: { id: c.id } }) : '')
          : c.status === 'claimed' ? u.btn('Done!', { sm: true, kind: 'world', icon: 'check', act: 'done', data: { id: c.id } }) + u.btn('Give back', { sm: true, kind: 'ghost', act: 'release', data: { id: c.id } })
            : u.btn('Undo', { sm: true, kind: 'ghost', act: 'undoDone', data: { id: c.id } });
        return `<article class="cb-chore is-${c.status}"${k ? ` style="--kid:${k.color}"` : ''}><div class="cb-chore-top"><b>${esc(c.title || 'Untitled chore')}</b><span class="cb-pts y-num">${pts(c)}<small>pts</small></span></div>${k ? `<span class="cb-who">${esc(k.name)}</span>` : ''}<div class="cb-chore-btns">${btn}</div></article>`;
      };
      return `${u.head({ eyebrow: `Week of ${D.short(s.week)}`, title: s.board ? esc(s.board) : 'Chore <em>board</em>', lede: 'Pick who’s choosing, claim a chore, mark it done — points add up toward each kid’s reward.' })}
      ${s.kids.length ? `<div class="cb-kids" role="group" aria-label="Who’s picking?">${s.kids.map(k => { const sc = score(s, k.id), g = Math.max(1, Math.round(P.num(k.goal)) || 1); return `<button type="button" class="cb-kid${k.id === me ? ' is-on' : ''}" style="--kid:${k.color}" data-act="set" data-bind="ui.kid" data-value="${esc(k.id)}" aria-pressed="${k.id === me}">
          <span class="cb-kid-name">${esc(k.name || 'Kid')}</span><span class="cb-kid-pts y-num"><b>${sc}</b> / ${g} pts</span>${u.meter(sc / g * 100, `${k.name} progress`)}<span class="cb-kid-reward">${sc >= g ? `${I('gift')} ${esc(k.reward || 'Reward unlocked!')}` : esc(k.reward || 'Set a reward')}</span></button>`; }).join('')}</div>`
        : u.empty('user', 'Add the kids first', 'Name everyone who can claim chores, and give each a points goal and reward.', u.btn('Add kids', { kind: 'world', act: 'go', data: { page: 'kids' } }))}
      <div class="cb-cols">${cols.map(([st, label]) => { const list = s.chores.filter(c => c.status === st && P.has(c.title)); return `<section class="cb-col"><h2>${label} <span class="pl-chip-n">${list.length}</span></h2>${list.map(card).join('') || '<p class="pl-muted cb-none">Nothing here.</p>'}</section>`; }).join('')}</div>
      <div class="pl-row">${u.btn('Edit chores', { icon: 'edit', act: 'go', data: { page: 'chores' } })}${u.btn('Start a new week', { kind: 'ghost', icon: 'calendar', act: 'newWeek' })}</div>`;
    },
    actions: {
      claim(ctx, d) { const c = ctx.state.chores.find(x => x.id === d.id), me = active(ctx.state); if (!c || !me) return false; c.status = 'claimed'; c.by = me; },
      done(ctx, d) { const s = ctx.state, c = s.chores.find(x => x.id === d.id); if (!c) return false; c.status = 'done'; const k = kidOf(s, c.by); const g = Math.round(P.num(k && k.goal)); const sc = k ? score(s, k.id) : 0; ctx.toast(k && g && sc >= g && sc - pts(c) < g ? `${k.name} unlocked: ${k.reward || 'the reward'}!` : `+${pts(c)} points${k ? ' for ' + k.name : ''}`); },
      release(ctx, d) { const c = ctx.state.chores.find(x => x.id === d.id); if (c) { c.status = 'open'; c.by = ''; } },
      undoDone(ctx, d) { const c = ctx.state.chores.find(x => x.id === d.id); if (c) c.status = 'claimed'; },
      async newWeek(ctx) {
        if (!(await ctx.confirm({ title: 'Start a new week?', body: 'This week’s points move to History and every chore goes back to “up for grabs”.', ok: 'New week' }))) return false;
        const s = ctx.state;
        s.history.unshift({ week: s.week, scores: Object.fromEntries(s.kids.map(k => [k.id, score(s, k.id)])) });
        s.chores.forEach(c => { c.status = 'open'; c.by = ''; });
        s.week = D.monday(D.today()) > s.week ? D.monday(D.today()) : D.add(s.week, 7);
        ctx.toast('Fresh week — go team!');
      }
    },
    sheet(ctx) {
      const s = ctx.state, list = s.chores.filter(c => P.has(c.title)), days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return `<h1>${esc(s.board || 'Chore chart')}</h1><p class="pl-sheet-meta">Week of ${esc(D.full(s.week))} · tick a box each time it’s done</p>
        <table><thead><tr><th>Chore</th><th>Pts</th>${days.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>${list.map(c => `<tr><td><b>${esc(c.title)}</b></td><td>${pts(c)}</td>${days.map(() => '<td><span class="pl-box"></span></td>').join('')}</tr>`).join('')}</tbody></table>
        <h2>Points goals</h2><table><tbody>${s.kids.map(k => `<tr><td><b>${esc(k.name)}</b></td><td>${esc(k.goal)} pts</td><td>${esc(k.reward)}</td><td style="width:40%"></td></tr>`).join('')}</tbody></table>`;
    }
  };

  const chores = {
    id: 'chores', label: 'Chores', icon: 'list',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Set up', title: 'Chores & points', lede: 'Bigger or less-loved jobs are worth more points. That’s the “auction”.' })}
      ${u.panel('', `${u.field('Board name', 'board', s.board, { ph: 'The Rivera chore board' })}<div class="cb-gap"></div>
        ${u.table('chores', s.chores, [{ k: 'title', label: 'Chore', title: true, w: '1.6fr', ph: 'Chore' }, { k: 'points', label: 'Points', num: true, w: '100px', ph: '5' }, { label: 'Status', w: '160px', html: c => esc(c.status === 'open' ? 'Up for grabs' : `${c.status === 'done' ? 'Done' : 'Doing'} · ${(kidOf(s, c.by) || {}).name || ''}`) }], { what: 'chore', move: true, add: 'Add chore', empty: 'Add the jobs you want help with.' })}`)}`;
    }
  };

  const kids = {
    id: 'kids', label: 'Kids & rewards', icon: 'gift',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Set up', title: 'Kids & rewards', lede: 'A weekly points goal and a reward each kid actually wants.' })}
      ${u.records('kids', s.kids, { what: 'Kid', titlePh: 'Name', cardAttr: k => ` style="--kid:${k.color}"`, cls: 'cb-kidcards', fields: [{ k: 'goal', label: 'Weekly goal (points)', num: true, ph: '30' }, { k: 'reward', label: 'Reward', ph: 'Pick the Friday movie' }], add: 'Add kid', addKind: 'world', empty: u.empty('user', 'No kids yet', 'Add everyone who can claim chores.') })}`;
    }
  };

  const history = {
    id: 'history', label: 'History', icon: 'chart',
    render(ctx) {
      const s = ctx.state, weeks = [{ week: s.week, scores: Object.fromEntries(s.kids.map(k => [k.id, score(s, k.id)])), now: true }].concat(s.history);
      const max = Math.max(1, ...weeks.flatMap(w => Object.values(w.scores)));
      return `${u.head({ eyebrow: 'History', title: 'Points by week', lede: 'Celebrate streaks, not perfection.' })}
      ${u.panel('', weeks.map(w => `<div class="cb-week"><b>${esc(D.short(w.week))}${w.now ? ' ' + u.pill('this week', 'world') : ''}</b><div class="cb-week-bars">${s.kids.map(k => `<div class="cb-week-bar"><span>${esc(k.name)}</span><span class="cb-track"><i style="width:${(w.scores[k.id] || 0) / max * 100}%;background:${k.color}"></i></span><b class="y-num">${w.scores[k.id] || 0}</b></div>`).join('')}</div></div>`).join(''))}`;
    }
  };

  window.FCChores = { pages: { board, chores, kids, history }, blank, sample, normalize, kid, rows: { chores: () => chore(), kids: ctx => kid('', 30, '', ctx.state.kids.length) } };
})();
