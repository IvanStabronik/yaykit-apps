/* Friendsgiving Feud — a host-led survey game for the TV, with a final round. Yaykit planner engine, harvest world.
   Same game as Christmas Feud; this edition adds the Fall & Football pack and starts on the Thanksgiving packs.
   Boards: app/boards.js (window.FEUD_PACKS). Answers and points are Yaykit's estimates, not a real poll. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, esc = u.esc, I = u.icon;
  const PACKS = (window.FEUD_PACKS || []).concat([{ id: 'mine', name: 'My boards', boards: [] }]);
  const PACK = Object.fromEntries(PACKS.map(p => [p.id, p]));
  const FINAL_N = 5, FINAL_GOAL = 200;
  const txt = v => (v == null ? '' : String(v));
  const pts = x => Math.max(0, Math.round(P.num(x && x.points)));

  /* ---------- model ---------- */
  function library() {
    return PACKS.flatMap(p => p.boards.map(b => ({ id: P.uid(), pack: p.id, prompt: b.prompt, answers: b.answers.map(a => ({ text: a.text, points: a.points })) })));
  }
  function freshPlay() { return { r: 0, shown: {}, strikes: 0, awarded: false, rest: false }; }
  function freshFinal() { return { players: ['', ''], picks: [Array(FINAL_N).fill(''), Array(FINAL_N).fill('')], shown: [Array(FINAL_N).fill(false), Array(FINAL_N).fill(false)], secs: ['20', '25'] }; }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const playable = b => b && P.has(b.prompt) && b.answers.filter(a => P.has(a.text)).length >= 3;
  function deal(s) {
    s.deck = shuffle(s.boards.filter(b => s.packs[b.pack] && playable(b)).map(b => b.id));
    s.pos = 0; s.play = freshPlay(); s.final = Object.assign(freshFinal(), { players: s.final ? s.final.players : ['', ''] });
  }
  function blank() {
    const s = { host: '', event: '', rounds: '5', sound: true, packs: { christmas: false, friendsgiving: true, fall: true, winter: false, family: true, mine: true },
      boards: library(), teams: [{ id: P.uid(), name: 'Team Pumpkin', score: 0 }, { id: P.uid(), name: 'Team Pecan', score: 0 }], deck: [], pos: 0, play: freshPlay(), final: freshFinal() };
    deal(s);
    return s;
  }
  function sample() {
    const s = blank();
    s.host = 'Jess'; s.event = 'Friendsgiving at Jess + Sam’s';
    s.teams[0].name = 'Team Stuffing'; s.teams[1].name = 'Team Gravy';
    deal(s);
    s.teams[0].score = 112; s.teams[1].score = 87;
    s.play.r = 2; s.play.shown = { 0: true, 2: true }; s.play.strikes = 1;
    s.final.players = ['Maya', 'Leo'];
    return s;
  }
  function normalize(s) {
    s.rounds = String(Math.max(3, Math.min(7, Math.round(P.num(s.rounds)) || 5)));
    s.packs = Object.assign({ christmas: false, friendsgiving: true, fall: true, winter: false, family: true, mine: true }, s.packs || {});
    s.boards = (Array.isArray(s.boards) ? s.boards : library()).filter(b => b && typeof b === 'object').map(b => ({
      id: txt(b.id) || P.uid(), pack: PACK[b.pack] ? b.pack : 'mine', prompt: txt(b.prompt),
      answers: (Array.isArray(b.answers) ? b.answers : []).filter(a => a && typeof a === 'object').slice(0, 8).map(a => ({ text: txt(a.text), points: a.points == null ? '' : a.points }))
    }));
    s.teams = (Array.isArray(s.teams) ? s.teams : []).filter(t => t && typeof t === 'object').slice(0, 2).map((t, k) => ({ id: txt(t.id) || P.uid(), name: txt(t.name), score: Math.round(P.num(t.score)) }));
    while (s.teams.length < 2) s.teams.push({ id: P.uid(), name: `Team ${s.teams.length + 1}`, score: 0 });
    const ids = new Set(s.boards.map(b => b.id));
    s.deck = (Array.isArray(s.deck) ? s.deck : []).filter(id => ids.has(id));
    s.pos = Math.max(0, Math.round(P.num(s.pos)));
    s.play = Object.assign(freshPlay(), s.play || {});
    const f = Object.assign(freshFinal(), s.final || {});
    f.players = [0, 1].map(p => txt((f.players || [])[p]));
    f.picks = [0, 1].map(p => Array.from({ length: FINAL_N }, (_, q) => txt(((f.picks || [])[p] || [])[q])));
    f.shown = [0, 1].map(p => Array.from({ length: FINAL_N }, (_, q) => !!((f.shown || [])[p] || [])[q]));
    s.final = f;
    if (!s.deck.length) deal(s);
    return s;
  }

  /* ---------- helpers ---------- */
  const R = s => Math.max(3, Math.min(7, Math.round(P.num(s.rounds)) || 5));
  const byId = (s, id) => s.boards.find(b => b.id === id);
  const at = (s, k) => s.deck.length ? byId(s, s.deck[(s.pos + k) % s.deck.length]) : null;
  const roundBoard = s => at(s, s.play.r);
  const finalBoards = s => Array.from({ length: FINAL_N }, (_, q) => at(s, R(s) + q));
  const mult = (s, r) => (r === R(s) - 1 ? 3 : r === R(s) - 2 && R(s) >= 4 ? 2 : 1);
  const answers = b => (b ? b.answers.filter(a => P.has(a.text)) : []);
  const bank = s => { const b = roundBoard(s); return answers(b).reduce((a, x, k) => a + (s.play.shown[k] ? pts(x) : 0), 0); };
  const teamName = (t, k) => t.name || `Team ${k + 1}`;
  const finalPts = (s, p, q) => { const pick = s.final.picks[p][q], b = finalBoards(s)[q]; if (pick === '' || pick === 'x' || !b) return 0; return pts(answers(b)[+pick]); };
  const finalTotal = s => [0, 1].reduce((a, p) => a + Array.from({ length: FINAL_N }, (_, q) => (s.final.shown[p][q] ? finalPts(s, p, q) : 0)).reduce((x, y) => x + y, 0), 0);

  /* sound: short tones made in the browser, nothing to download */
  let audio;
  function tone(s, notes) {
    if (!s.sound) return;
    try {
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      audio = audio || new A();
      if (audio.state === 'suspended') audio.resume();
      let t = audio.currentTime;
      notes.forEach(([f, d, type, vol]) => {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = type || 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + d + 0.05); t += d * 0.8;
      });
    } catch (e) { /* sound is optional */ }
  }
  const DING = [[880, 0.18], [1320, 0.45]], BUZZ = [[110, 0.7, 'square', 0.16]], WIN = [[523, 0.16], [659, 0.16], [784, 0.16], [1047, 0.5]];
  function bigX() {
    const el = document.createElement('div'); el.className = 'fd-bigx'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = I('close');
    document.body.appendChild(el); setTimeout(() => el.remove(), 900);
  }

  /* ---------- play ---------- */
  function roundChips(s, here) {
    const n = R(s);
    return `<div class="fd-rounds" role="group" aria-label="Round">${Array.from({ length: n }, (_, r) => `<button type="button" class="y-chip pl-chip${here === 'play' && s.play.r === r ? ' is-on' : ''}" data-act="toRound" data-r="${r}" aria-pressed="${here === 'play' && s.play.r === r}">Round ${r + 1}${mult(s, r) > 1 ? ` · ×${mult(s, r)}` : ''}</button>`).join('')}<button type="button" class="y-chip pl-chip${here === 'final' ? ' is-on' : ''}" data-act="go" data-page="final" aria-pressed="${here === 'final'}">Final round</button></div>`;
  }
  function playbar(s, here) {
    return `<div class="fd-playbar">${roundChips(s, here)}<span class="pl-spacer"></span>${u.switch('sound', s.sound, 'Sound')}${u.btn('Stage mode', { kind: 'world', icon: 'eye', act: 'stageMode', title: 'Full screen for the TV (F)' })}</div>`;
  }
  const play = {
    id: 'play', label: 'Play', icon: 'party',
    render(ctx) {
      const s = ctx.state, b = roundBoard(s), r = s.play.r, n = R(s), m = mult(s, r);
      if (!b) return `${playbar(s, 'play')}${u.empty('list', 'No boards to play', 'Turn on a board pack on Setup, then deal a new game.')}`;
      const list = answers(b), shown = s.play.shown, sum = bank(s), last = r === n - 1;
      const slot = (x, k) => {
        const on = shown[k], rest = !on && s.play.rest;
        return `<button type="button" class="fd-slot${on ? ' is-shown' : ''}${rest ? ' is-rest' : ''}" data-act="showAns" data-k="${k}" aria-label="${on || rest ? esc(x.text) : `Reveal answer ${k + 1}`}"><span class="fd-slot-n">${k + 1}</span>${on || rest ? `<span class="fd-slot-t">${esc(x.text)}</span><span class="fd-slot-p y-num">${pts(x)}</span>` : '<span class="fd-slot-t"></span>'}</button>`;
      };
      return `${playbar(s, 'play')}
      <section class="y-stage fd-stage" aria-label="Game board">
        <div class="y-stage-head"><div><span class="y-eyebrow">${esc(s.event || 'Friendsgiving Feud')}</span><p class="y-stage-round">Round ${r + 1} of ${n}</p></div>
          ${m > 1 ? `<span class="y-sticker fd-mult">${m === 2 ? 'Double' : 'Triple'} points</span>` : '<span></span>'}
          <span class="fd-pack">${esc((PACK[b.pack] || {}).name || '')}</span></div>
        <div class="y-q"><p class="y-q-text fd-q">${esc(b.prompt)}</p>
          <div class="fd-board fd-board--${list.length > 4 ? 'two' : 'one'}" style="--rows:${Math.ceil(list.length / 2)}">${list.map(slot).join('')}</div>
          <div class="fd-strikes" aria-label="${s.play.strikes} strikes">${[0, 1, 2].map(k => `<span class="${k < s.play.strikes ? 'is-on' : ''}">${I('close', { size: 'lg' })}</span>`).join('')}<span class="fd-bank">Board <b class="y-num">${sum * m}</b>${m > 1 ? `<small>${sum} × ${m}</small>` : ''}</span></div>
          ${s.play.strikes >= 3 && !s.play.awarded ? '<p class="fd-steal">Three strikes! The other team huddles and gets one guess to steal the board.</p>' : ''}</div>
        <div class="y-stage-foot"><div class="y-scoreboard fd-teams">${s.teams.map((t, k) => `<div class="y-team"><span class="y-team-name">${esc(teamName(t, k))}</span><span class="y-team-score y-num">${t.score}</span><button type="button" class="y-btn" data-act="award" data-k="${k}" ${s.play.awarded || !sum ? 'disabled' : ''} aria-label="Give the board to ${esc(teamName(t, k))}">${I('check')}<span>Give board</span></button></div>`).join('')}</div>
          <div class="fd-controls"><button type="button" class="y-btn y-btn--secondary y-btn--icon" data-act="step" data-n="-1" aria-label="Previous round" title="Previous round (←)" ${r ? '' : 'disabled'}>${I('prev')}</button>
            ${u.btn(s.play.strikes >= 3 ? 'Clear strikes' : 'Strike', { kind: 'danger', icon: 'close', act: 'strike', title: 'X' })}
            ${u.btn(s.play.rest ? 'Hide the rest' : 'Show the rest', { icon: 'eye', act: 'rest', title: 'R' })}
            ${last ? u.btn('Final round', { kind: 'accent', icon: 'next', act: 'go', data: { page: 'final' } }) : u.btn('Next round', { kind: 'accent', icon: 'next', act: 'step', data: { n: 1 }, title: '→' })}</div></div>
      </section>
      <p class="pl-hint fd-keys">Keys: 1–8 reveal answers · X strike · R show the rest · ← → rounds · F stage mode · Esc exit</p>`;
    },
    actions: {
      step(ctx, d) { const s = ctx.state, r = Math.max(0, Math.min(R(s) - 1, s.play.r + +d.n)); if (r === s.play.r) return false; s.play = Object.assign(freshPlay(), { r }); },
      showAns(ctx, d) { const s = ctx.state, on = !s.play.shown[d.k]; s.play.shown = Object.assign({}, s.play.shown, { [d.k]: on }); if (on) tone(s, DING); },
      strike(ctx) { const s = ctx.state; if (s.play.strikes >= 3) { s.play.strikes = 0; return; } s.play.strikes += 1; tone(s, BUZZ); bigX(); },
      rest(ctx) { ctx.state.play.rest = !ctx.state.play.rest; },
      award(ctx, d) {
        const s = ctx.state, t = s.teams[+d.k], got = bank(s) * mult(s, s.play.r); if (!t || s.play.awarded || !got) return false;
        t.score += got; s.play.awarded = true; tone(s, WIN); ctx.toast(`${got} points to ${teamName(t, +d.k)}`);
      }
    }
  };

  /* ---------- final round ---------- */
  const final = {
    id: 'final', label: 'Final round', icon: 'star',
    render(ctx) {
      const s = ctx.state, f = s.final, qs = finalBoards(s), total = finalTotal(s);
      const cell = (p, q) => {
        const b = qs[q], pick = f.picks[p][q], on = f.shown[p][q], has = pick !== '';
        const label = pick === 'x' ? 'No match' : has && b ? txt((answers(b)[+pick] || {}).text) : '';
        const opts = b ? [['x', 'No match / repeat · 0']].concat(answers(b).map((a, k) => [String(k), `${a.text} · ${pts(a)}`])) : [];
        return `<div class="fd-fcell">
          <div class="fd-pick">${u.select(`final.picks.${p}.${q}`, pick, opts, { label: `${f.players[p] || `Player ${p + 1}`}, question ${q + 1}`, blank: 'Their answer…', rerender: true })}</div>
          <button type="button" class="fd-ftile${on ? ' is-shown' : ''}" data-act="showFinal" data-p="${p}" data-q="${q}" ${has ? '' : 'disabled'} aria-label="${on ? esc(label) : 'Reveal'}">${on ? `<span>${esc(label)}</span><b class="y-num">${finalPts(s, p, q)}</b>` : `<span>${has ? 'Tap to reveal' : '—'}</span>`}</button></div>`;
      };
      return `${playbar(s, 'final')}
      <section class="y-stage fd-stage fd-final" aria-label="Final round">
        <div class="y-stage-head"><div><span class="y-eyebrow">Final round</span><p class="y-stage-round">Two players · ${FINAL_N} questions · ${FINAL_GOAL} points to win</p></div>
          <button type="button" class="y-timer" data-act="timer-toggle" data-timer-ui aria-label="Start or pause the timer">${I('timer', { size: 'lg' })}<span data-timer-clock class="y-num">0:00</span></button>
          <span class="fd-ftotal${total >= FINAL_GOAL ? ' is-win' : ''}">Total <b class="y-num">${total}</b></span></div>
        <div class="fd-fgrid">
          <div class="fd-fhead"><span></span>${[0, 1].map(p => `<div class="fd-fplayer">${u.input(`final.players.${p}`, f.players[p], { label: `Player ${p + 1} name`, ph: `Player ${p + 1}` })}
            ${u.btn(`Start ${f.secs[p]} s`, { sm: true, icon: 'timer', act: 'timer-start', data: { secs: f.secs[p], label: f.players[p] || `Player ${p + 1}` } })}</div>`).join('')}</div>
          ${qs.map((b, q) => `<div class="fd-frow"><p class="fd-fq"><span class="y-num">${q + 1}</span>${esc(b ? b.prompt : '—')}</p>${cell(0, q)}${cell(1, q)}</div>`).join('')}
        </div>
        ${total >= FINAL_GOAL ? `<p class="fd-fwin">${I('gift', { size: 'lg' })} ${FINAL_GOAL}! They won the final round.</p>` : ''}
        <div class="y-stage-foot"><p class="fd-fhow">Player 2 waits out of earshot. Pick each answer from the list while they play, then reveal one by one. A repeat of player 1’s answer counts as “No match”.</p>
          <div class="fd-controls">${u.btn('Clear the final round', { icon: 'prev', act: 'clearFinal' })}${u.btn('Deal a new game', { kind: 'accent', icon: 'sparkle', act: 'newGame' })}</div></div>
      </section>
      <p class="pl-hint fd-keys">In stage mode the answer lists are hidden — pick answers before you press F, then reveal on the TV.</p>`;
    },
    actions: {
      showFinal(ctx, d) { const s = ctx.state, on = !s.final.shown[+d.p][+d.q]; s.final.shown[+d.p][+d.q] = on; if (on) tone(s, finalPts(s, +d.p, +d.q) ? DING : BUZZ); if (on && finalTotal(s) >= FINAL_GOAL) tone(s, WIN); },
      async clearFinal(ctx) { if (!(await ctx.confirm({ title: 'Clear the final round?', body: 'Picked answers and reveals are removed. Player names stay.', ok: 'Clear' }))) return false; ctx.state.final = Object.assign(freshFinal(), { players: ctx.state.final.players }); }
    }
  };
  async function newGame(ctx) {
    const s = ctx.state;
    if (!(await ctx.confirm({ title: 'Deal a new game?', body: 'Scores go back to 0 and the next boards come up. You will not see the same boards again until the deck runs out.', ok: 'New game' }))) return false;
    const used = R(s) + FINAL_N;
    if (s.pos + used * 2 > s.deck.length) deal(s); else { s.pos += used; s.play = freshPlay(); s.final = Object.assign(freshFinal(), { players: s.final.players }); }
    s.teams.forEach(t => { t.score = 0; });
    ctx.go('play'); return false;
  }

  /* ---------- setup ---------- */
  const setup = {
    id: 'setup', label: 'Setup', icon: 'edit',
    render(ctx) {
      const s = ctx.state, count = id => s.boards.filter(b => b.pack === id && playable(b)).length;
      const on = PACKS.filter(p => s.packs[p.id]).reduce((a, p) => a + count(p.id), 0), need = R(s) + FINAL_N;
      return `${u.head({ eyebrow: 'Friendsgiving Feud', title: 'Set up the <em>game</em>', lede: 'Two teams, a few rounds and a final round for two players. Hook a laptop up to the TV, or mirror your phone or tablet, and press Stage mode.' })}
      <div class="pl-grid">
        ${u.panel('Teams', `<div class="pl-fields">${s.teams.map((t, k) => u.field(`Team ${k + 1}`, `teams.${k}.name`, t.name, { ph: k ? 'The Lopez Crew' : 'The Parkers' })).join('')}</div>
          <div class="fd-scores">${s.teams.map((t, k) => `<span>${esc(teamName(t, k))} <b class="y-num">${t.score}</b></span>`).join('')}${u.btn('Reset scores', { sm: true, kind: 'ghost', act: 'resetScores' })}</div>`, { icon: 'user', cls: 'pl-6' })}
        ${u.panel('The night', `<div class="pl-fields">${u.field('Host', 'host', s.host, { ph: 'Grandpa Joe', optional: true })}${u.field('Shown on the board', 'event', s.event, { ph: 'Christmas Eve at the Parkers', optional: true })}</div>
          <div class="y-field fd-gap"><span class="y-label">Rounds per game</span>${u.seg('rounds', s.rounds, ['3', '4', '5', '6', '7'], 'Rounds per game')}<span class="pl-hint">The second-to-last round is worth double, the last one triple.</span></div>
          <div class="fd-gap">${u.switch('sound', s.sound, 'Sound: ding for answers, buzzer for strikes')}</div>`, { icon: 'star', cls: 'pl-6' })}
      </div>
      ${u.panel('Board packs', `<div class="fd-packs">${PACKS.map(p => u.check(`packs.${p.id}`, s.packs[p.id], esc(p.name), { rerender: true, meta: P.plural(count(p.id), 'board') })).join('')}</div>
        <p class="pl-muted">${P.plural(on, 'board')} in play. One game uses ${need} (${R(s)} rounds + ${FINAL_N} for the final round).${on < need ? ' Turn on another pack or add your own boards.' : ''}</p>
        <div class="pl-row">${u.btn('Deal a new game', { kind: 'world', icon: 'sparkle', act: 'newGame' })}${u.btn('Edit boards', { icon: 'edit', act: 'go', data: { page: 'boards' } })}</div>`, { icon: 'list' })}`;
    },
    actions: {
      resetScores(ctx) { ctx.state.teams.forEach(t => { t.score = 0; }); ctx.toast('Scores reset'); }
    }
  };

  /* ---------- boards editor ---------- */
  const boards = {
    id: 'boards', label: 'Boards', icon: 'list',
    render(ctx) {
      const s = ctx.state, f = PACK[s.ui.pack] ? s.ui.pack : 'friendsgiving';
      const list = s.boards.map((b, i) => Object.assign({ __i: i }, b)).filter(b => b.pack === f);
      return `${u.head({ eyebrow: 'Friendsgiving Feud', title: 'Survey <em>boards</em>', lede: 'Each board is a prompt and up to 8 answers with points. The answers are our best guess at what most people say — change anything to suit your family. Edits are saved on this device.' })}
      ${u.chips('ui.pack', f, PACKS.map(p => [p.id, p.name, s.boards.filter(b => b.pack === p.id).length]), 'Pack')}
      <div class="fd-edits">${list.length ? list.map((b, n) => `<article class="fd-edit"><div class="fd-edit-top"><span class="fd-num y-num">${n + 1}</span>${u.textarea(`boards.${b.__i}.prompt`, b.prompt, { label: `Board ${n + 1} prompt`, rows: 1, auto: true, cls: 'fd-edit-q', ph: 'Name something…' })}${u.iconBtn('trash', 'Remove board', 'removeBoard', { i: b.__i })}</div>
        ${u.table(`boards.${b.__i}.answers`, b.answers, [{ k: 'text', label: 'Answer', title: true, ph: 'Answer' }, { k: 'points', label: 'Points', num: true, w: '90px' }], { what: 'answer', add: b.answers.length < 8 ? 'Add answer' : '', tpl: 'answers' })}</article>`).join('') : u.empty('list', 'No boards here yet', f === 'mine' ? 'Add your own family inside jokes and traditions.' : 'Restore the original boards below.')}</div>
      <div class="pl-row">${u.btn('Add a board', { kind: 'world', icon: 'plus', act: 'addBoard' })}<span class="pl-spacer"></span>${u.btn('Restore the original boards', { sm: true, kind: 'ghost', icon: 'prev', act: 'restore' })}</div>`;
    },
    actions: {
      addBoard(ctx) { const s = ctx.state; s.boards.push({ id: P.uid(), pack: 'mine', prompt: '', answers: [30, 25, 15, 10, 5].map(p => ({ text: '', points: String(p) })) }); s.packs.mine = true; s.ui.pack = 'mine'; ctx.focus(`[data-bind="boards.${s.boards.length - 1}.prompt"]`); },
      async removeBoard(ctx, d) { const b = ctx.state.boards[+d.i]; if (!b || !(await ctx.confirm({ title: 'Remove this board?', body: b.prompt || 'This board', ok: 'Remove', danger: true }))) return false; ctx.state.boards.splice(+d.i, 1); ctx.state.deck = ctx.state.deck.filter(id => id !== b.id); },
      async restore(ctx) {
        if (!(await ctx.confirm({ title: 'Restore the original boards?', body: 'Your edits to the built-in boards are replaced and a new game is dealt. Boards under “My boards” stay.', ok: 'Restore', danger: true }))) return false;
        const s = ctx.state; s.boards = library().concat(s.boards.filter(b => b.pack === 'mine')); deal(s); ctx.toast('Original boards restored');
      }
    }
  };

  /* ---------- print ---------- */
  const SHEETS = [['host', 'Host cards', 'This game’s boards and the final round with every answer and its points. Keep it out of sight.'], ['score', 'Scorecard', 'Rounds with their multipliers, the final round, and both teams.'], ['all', 'All boards', 'Every board in the packs you have turned on — a full answer key.']];
  const print = {
    id: 'print', label: 'Print', icon: 'print',
    render(ctx) {
      const s = ctx.state, pk = SHEETS.some(k => k[0] === s.ui.pk) ? s.ui.pk : 'host';
      return `${u.head({ eyebrow: 'Friendsgiving Feud', title: 'Print', lede: 'Paper for the host. Pick one, check the preview, then press Print.' })}
      <div class="pl-row fd-printpick">${u.seg('ui.pk', pk, SHEETS.map(k => [k[0], k[1]]), 'What to print')}<span class="pl-spacer"></span>${u.btn('Print this', { kind: 'world', icon: 'print', act: 'print' })}</div>
      <p class="pl-hint">${esc(SHEETS.find(k => k[0] === pk)[2])}</p>
      <div class="y-paper-shell fd-preview"><div class="y-paper pl-paper">${sheet(ctx)}</div></div>`;
    },
    sheet: ctx => sheet(ctx)
  };
  function sheet(ctx) {
    const s = ctx.state, pk = SHEETS.some(k => k[0] === s.ui.pk) ? s.ui.pk : 'host', n = R(s);
    const meta = [s.event, s.host && `Host: ${s.host}`].filter(P.has).map(esc).join(' · ');
    const card = (b, title) => b ? `<section class="fd-sheet-board"><h2>${esc(title)}: ${esc(b.prompt)}</h2><table><tbody>${answers(b).map((a, k) => `<tr><td style="width:8mm">${k + 1}</td><td>${esc(a.text)}</td><td style="width:16mm;text-align:right"><b>${pts(a)}</b></td></tr>`).join('')}</tbody></table></section>` : '';
    if (pk === 'host') return `<h1>Friendsgiving Feud · host cards</h1><p class="pl-sheet-meta">${meta || 'Keep this out of sight'}</p>
      ${Array.from({ length: n }, (_, r) => card(at(s, r), `Round ${r + 1}${mult(s, r) > 1 ? ` (×${mult(s, r)})` : ''}`)).join('')}
      <h2 class="fd-sheet-final">Final round</h2>${finalBoards(s).map((b, q) => card(b, `Final ${q + 1}`)).join('')}`;
    if (pk === 'score') return `<h1>Friendsgiving Feud · scorecard</h1><p class="pl-sheet-meta">${meta}</p><table class="fd-sheet-score"><thead><tr><th>Round</th>${s.teams.map((t, k) => `<th>${esc(teamName(t, k))}</th>`).join('')}</tr></thead><tbody>
      ${Array.from({ length: n }, (_, r) => `<tr><td>Round ${r + 1}${mult(s, r) > 1 ? ` · ×${mult(s, r)}` : ''}</td>${s.teams.map(() => '<td></td>').join('')}</tr>`).join('')}
      <tr><td>Final round (goal ${FINAL_GOAL})</td>${s.teams.map(() => '<td></td>').join('')}</tr></tbody><tfoot><tr><th>Total</th>${s.teams.map(t => `<td><b>${t.score || ''}</b></td>`).join('')}</tr></tfoot></table>`;
    return `<h1>Friendsgiving Feud · all boards</h1><p class="pl-sheet-meta">${PACKS.filter(p => s.packs[p.id]).map(p => esc(p.name)).join(' · ')}</p>
      ${s.boards.filter(b => s.packs[b.pack] && playable(b)).map((b, i) => card(b, String(i + 1))).join('')}`;
  }

  /* ---------- stage mode + keyboard ---------- */
  function toggleStage(force) {
    const root = document.documentElement, on = force != null ? force : root.dataset.stage !== 'on';
    if (on) { root.dataset.stage = 'on'; if (root.requestFullscreen) root.requestFullscreen().catch(() => {}); }
    else { delete root.dataset.stage; if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); }
  }
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && document.documentElement.dataset.stage === 'on') delete document.documentElement.dataset.stage; });
  document.addEventListener('keydown', e => {
    const ctx = window.__planner; if (!ctx || !['play', 'final'].includes(ctx.page.id) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input,textarea,select,dialog')) return;
    const click = sel => { const b = document.querySelector(sel); if (b && !b.disabled) { b.click(); return true; } return false; };
    let done = false;
    if (e.key === 'Escape' && document.documentElement.dataset.stage === 'on') { toggleStage(false); done = true; }
    else if (e.key === 'f' || e.key === 'F') { toggleStage(); done = true; }
    else if (ctx.page.id === 'play') {
      if (e.key === 'ArrowRight') done = click('[data-act="step"][data-n="1"]');
      else if (e.key === 'ArrowLeft') done = click('[data-act="step"][data-n="-1"]');
      else if (e.key === 'x' || e.key === 'X') done = click('[data-act="strike"]');
      else if (e.key === 'r' || e.key === 'R') done = click('[data-act="rest"]');
      else if (/^[1-8]$/.test(e.key)) done = click(`[data-act="showAns"][data-k="${+e.key - 1}"]`);
    }
    if (done) e.preventDefault();
  });

  P.create({
    slug: 'friendsgiving-feud-game', name: 'Friendsgiving Feud', world: 'harvest',
    welcome: 'Name the two teams on Setup, then press Play. Stage mode puts the board full screen on the TV.',
    pages: [play, final, setup, boards, print],
    blank, sample, normalize,
    timer: { doneText: 'Time’s up!', onTick(ctx, left) { document.querySelectorAll('.y-timer').forEach(el => el.classList.toggle('is-low', ctx.timer.state.running && left <= 5)); } },
    rows: { answers: () => ({ text: '', points: '5' }) },
    actions: {
      newGame,
      toRound(ctx, d) { ctx.state.play = Object.assign(freshPlay(), { r: +d.r }); if (ctx.page.id !== 'play') { ctx.go('play'); return false; } },
      stageMode() { toggleStage(); return false; }
    },
    about: '<p><b>Friendsgiving Feud</b> is a host-led survey game for Thanksgiving and Friendsgiving: 135 boards for Thanksgiving and Friendsgiving, fall and football, family game night, winter and New Year, and Christmas, plus a final round for two players. Put it on the TV, press Stage mode, and run the game — teams shout answers, you reveal them and give the board.</p><p>Keyboard: 1–8 reveal answers, X strike, R show the rest, ← → rounds, F stage mode.</p>',
    disclaimer: 'Friendsgiving Feud is for entertainment. Survey answers and points are Yaykit’s estimates, not results of a real poll. Not affiliated with any TV game show.'
  });
})();
