/* Family Chore App — the chore board kids claim jobs from for points and rewards, plus each kid's daily routines.
   Yaykit planner engine, home world. Board, chores, kids & rewards and history come from Chore Board (chores.js); routines are new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon, C = window.FCChores;
  const WHEN = ['Morning', 'After school', 'Bedtime', 'Weekend'];
  const txt = v => (v == null ? '' : String(v));
  const step = text => ({ id: P.uid(), text: text || '' });
  const routine = o => Object.assign({ id: P.uid(), name: '', kid: '', when: 'Morning', steps: [] }, o || {});

  function blank() { return Object.assign(C.blank(), { routines: [], rdone: {} }); }
  function normalize(s) {
    C.normalize(s);
    const ids = new Set(s.kids.map(k => k.id));
    s.routines = (Array.isArray(s.routines) ? s.routines : []).filter(x => x && typeof x === 'object').map(x => routine({
      id: txt(x.id) || P.uid(), name: txt(x.name), kid: ids.has(x.kid) ? x.kid : '', when: WHEN.includes(x.when) ? x.when : 'Morning',
      steps: (Array.isArray(x.steps) ? x.steps : []).filter(t => t && typeof t === 'object').map(t => ({ id: txt(t.id) || P.uid(), text: txt(t.text) }))
    }));
    const rd = s.rdone && typeof s.rdone === 'object' ? s.rdone : {}, keep = D.add(D.today(), -60);
    s.rdone = Object.fromEntries(Object.keys(rd).filter(d => D.parse(d) && d >= keep && rd[d] && typeof rd[d] === 'object').map(d => [d, Object.fromEntries(Object.keys(rd[d]).filter(k => rd[d][k]).map(k => [k, true]))]));
    return s;
  }
  function sample() {
    const s = Object.assign(blank(), C.sample()), [m, l, k] = s.kids.map(x => x.id), t = D.today();
    const R = [
      routine({ name: 'Morning', kid: m, when: 'Morning', steps: ['Get dressed', 'Brush teeth', 'Make your bed', 'Pack your backpack'].map(step) }),
      routine({ name: 'After school', kid: k, when: 'After school', steps: ['Snack', 'Homework first', 'Feed Biscuit', 'Shoes on the rack'].map(step) }),
      routine({ name: 'Bedtime', kid: l, when: 'Bedtime', steps: ['Bath or shower', 'Pajamas on', 'Brush teeth', 'Read for 10 minutes', 'Lights out at 8:30'].map(step) }),
      routine({ name: 'Saturday reset', kid: '', when: 'Weekend', steps: ['Clear your desk', 'Laundry in the basket', 'Return library books'].map(step) })];
    s.routines = R;
    const done = (d, r, n) => r.steps.slice(0, n).forEach(x => { s.rdone[d] = s.rdone[d] || {}; s.rdone[d][x.id] = true; });
    done(t, R[0], 4); done(t, R[1], 1);
    for (let i = 1; i < 7; i++) { done(D.add(t, -i), R[0], i % 3 ? 4 : 3); done(D.add(t, -i), R[2], i % 2 ? 5 : 4); done(D.add(t, -i), R[1], i % 4 ? 4 : 2); }
    return s;
  }

  const kidOf = (s, id) => s.kids.find(k => k.id === id);
  const named = r => r.steps.filter(x => P.has(x.text));
  const complete = (s, r, d) => { const l = named(r); return l.length && l.every(x => (s.rdone[d] || {})[x.id]); };
  const weekStars = (s, r) => Array.from({ length: 7 }, (_, i) => D.add(D.monday(D.today()), i)).filter(d => d <= D.today() && complete(s, r, d)).length;

  const routines = {
    id: 'routines', label: 'Routines', icon: 'check',
    badge: ctx => { const s = ctx.state, t = D.today(); return s.routines.filter(r => r.when !== 'Weekend' && named(r).length && !complete(s, r, t)).length || ''; },
    render(ctx) {
      const s = ctx.state, t = D.today(), f = s.ui.rk === '' || kidOf(s, s.ui.rk) || s.ui.rk === 'all' ? (s.ui.rk || 'all') : 'all';
      const list = s.routines.map((r, i) => Object.assign({ __i: i }, r)).filter(r => f === 'all' || r.kid === f || !r.kid);
      const left = s.routines.filter(r => r.when !== 'Weekend' && named(r).length && !complete(s, r, t)).length;
      return `${u.head({ eyebrow: D.long(t), title: s.routines.length ? (left ? `<em>${left}</em> ${left === 1 ? 'routine' : 'routines'} to finish today` : 'Every routine <em>done</em>') : 'Same steps, <em>less nagging</em>', lede: 'Each kid ticks their own steps. Ticks are for today only — tomorrow starts fresh. A star for every day a routine is finished.' })}
      ${s.kids.length ? `<div class="pl-row fc-tools">${u.chips('ui.rk', f, [['all', 'Everyone'], ...s.kids.map(k => [k.id, k.name || 'Kid'])], 'Whose routines')}</div>` : ''}
      ${list.length ? `<div class="fc-routines">${list.map(r => {
        const k = kidOf(s, r.kid), l = named(r), dn = s.rdone[t] || {}, n = l.filter(x => dn[x.id]).length, stars = weekStars(s, r);
        return `<section class="y-panel fc-routine${l.length && n === l.length ? ' is-done' : ''}" style="${k ? `--k:${esc(k.color)}` : ''}">
          <h3><span class="fc-who">${esc(k ? k.name : 'All')}</span>${esc(r.name || r.when)}</h3>
          ${u.meter(l.length ? n / l.length * 100 : 0, `${r.name} progress`)}
          ${l.length ? `<ul class="fc-steps">${l.map(x => `<li>${u.check(`rdone.${t}.${x.id}`, !!dn[x.id], esc(x.text), { rerender: true })}</li>`).join('')}</ul>` : '<p class="pl-muted">No steps yet — add them below.</p>'}
          <span class="fc-stars">${stars ? '★'.repeat(stars) + ` ${stars} ${stars === 1 ? 'day' : 'days'} this week` : 'Finish it today for a star'}</span></section>`;
      }).join('')}</div>` : u.empty('check', 'No routines yet', 'Add a morning or bedtime routine below — four or five short steps is plenty.')}
      ${u.fold('Edit routines', u.records('routines', s.routines, {
        what: 'Routine', titlePh: 'Routine name', move: true,
        sub: r => `${esc(kidOf(s, r.kid) ? kidOf(s, r.kid).name : 'Everyone')} · ${esc(r.when)} · ${P.plural(named(r).length, 'step')}`,
        fields: [{ k: 'kid', label: 'For', options: () => s.kids.map(k => [k.id, k.name || 'Kid']), blank: 'Everyone', rerender: true }, { k: 'when', label: 'When', options: WHEN, rerender: true }],
        foot: (r, i) => u.table(`routines.${i}.steps`, r.steps, [{ k: 'text', label: 'Step', title: true, ph: 'Short step' }], { add: 'Add step', what: 'step', tpl: 'step', move: true, empty: 'No steps yet.' }),
        add: 'Add routine', tpl: 'routine'
      }), { icon: 'edit', key: 'redit', open: !s.routines.length })}`;
    },
    sheet(ctx) {
      const s = ctx.state, days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return `<h1>Routines</h1><p class="pl-sheet-meta">Tick a box each day</p>${s.routines.filter(r => named(r).length).map(r => `<h2>${esc((kidOf(s, r.kid) || { name: 'Everyone' }).name)} · ${esc(r.name || r.when)}</h2>
        <table><thead><tr><th>Step</th>${days.map(d => `<th style="width:12mm">${d}</th>`).join('')}</tr></thead><tbody>${named(r).map(x => `<tr><td>${esc(x.text)}</td>${days.map(() => '<td><span class="pl-box"></span></td>').join('')}</tr>`).join('')}</tbody></table>`).join('')}`;
    }
  };

  P.create({
    slug: 'family-chore-app',
    name: 'Family Chore Planner',
    world: 'home',
    welcome: 'Add the kids and a few chores — then let them claim jobs for points.',
    pages: [C.pages.board, C.pages.chores, routines, C.pages.kids, C.pages.history],
    blank, sample, normalize,
    rows: Object.assign({ routine: () => routine({ steps: [step('')] }), step: () => step('') }, C.rows),
    about: '<p><b>Family Chore Planner</b> turns chores into a little family game: kids claim jobs from the board, mark them done for points and work toward a reward they picked. Each kid also gets daily routines — morning, after school, bedtime — to tick off, with a star for every finished day. Start a new week with one tap; past weeks stay in History. Print a chore chart or a routine chart for the fridge.</p>',
    disclaimer: 'Family Chore Planner is a family organization tool. Points and rewards are yours to set.'
  });
})();
