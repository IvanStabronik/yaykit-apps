/* Cleaning Schedule App — today's quick reset with a timer and the zones, from Clean Loop. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const EFFORT = [['easy', 'Easy'], ['ok', 'OK energy'], ['high', 'High effort']];
  const EFF = Object.fromEntries(EFFORT);
  const txt = v => (v == null ? '' : String(v));
  const task = (text, effort, mins) => ({ id: P.uid(), text: text || '', effort: effort || 'easy', mins: String(mins == null ? 5 : mins) });
  const zone = (name, tasks) => ({ id: P.uid(), name: name || '', tasks: tasks || [] });

  function blank() { return { focus: '', zones: [zone('Kitchen'), zone('Bathroom')], done: {}, notes: '' }; }
  function sample() {
    const Z = [
      ['Kitchen', [['Clear the sink', 'easy', 5], ['Wipe counters', 'easy', 5], ['Quick floor sweep', 'ok', 8], ['Take out recycling', 'easy', 3]]],
      ['Bathroom', [['Wipe sink + mirror', 'easy', 5], ['Toilet wipe-down', 'ok', 5], ['Hang towels, clear the floor', 'easy', 3]]],
      ['Bedroom', [['Make the bed', 'easy', 3], ['Clothes into the basket', 'ok', 10], ['Clear the nightstand', 'easy', 5]]],
      ['Living room', [['Trash + dishes out', 'easy', 5], ['Fluff cushions, fold throws', 'easy', 5], ['Clear a walking path', 'ok', 8]]],
      ['Entry', [['Shoes to the rack', 'easy', 3], ['Sort mail + keys', 'ok', 5]]]
    ];
    const zones = Z.map(([n, ts]) => zone(n, ts.map(t => task(...t))));
    const t = D.today(), done = {};
    done[t] = { [zones[0].tasks[0].id]: true, [zones[0].tasks[1].id]: true };
    done[D.add(t, -1)] = { [zones[2].tasks[0].id]: true, [zones[3].tasks[0].id]: true, [zones[3].tasks[1].id]: true };
    done[D.add(t, -2)] = { [zones[1].tasks[0].id]: true };
    return {
      focus: 'Kitchen only — the rest can wait', zones, done,
      notes: 'Cloths live under the sink. Never mix bleach with anything.\n\nLow-energy minimum: dishes in the sink, trash out, one surface clear.\n\nStopping halfway is still a win.'
    };
  }
  function normalize(s) {
    s.focus = txt(s.focus); s.notes = txt(s.notes);
    s.zones = (Array.isArray(s.zones) ? s.zones : []).filter(z => z && typeof z === 'object').map(z => ({
      id: txt(z.id) || P.uid(), name: txt(z.name),
      tasks: (Array.isArray(z.tasks) ? z.tasks : []).filter(x => x && typeof x === 'object').map(x => ({ id: txt(x.id) || P.uid(), text: txt(x.text), effort: EFF[x.effort] ? x.effort : 'easy', mins: txt(x.mins) }))
    }));
    const done = {};
    Object.keys(s.done || {}).forEach(d => { if (!D.parse(d) || !s.done[d]) return; const m = {}; Object.keys(s.done[d]).forEach(k => { if (s.done[d][k]) m[k] = true; }); if (Object.keys(m).length) done[d] = m; });
    s.done = done;
    if (s.ui.cap == null) s.ui.cap = true;
    return s;
  }

  const mins = x => Math.max(1, Math.min(120, Math.round(P.num(x.mins) || 5)));
  const todayDone = s => s.done[D.today()] || {};
  const all = s => s.zones.flatMap(z => z.tasks.filter(t => P.has(t.text)).map(t => ({ z, t })));
  function daysThisWeek(s) { const mon = D.monday(D.today()); return Object.keys(s.done).filter(d => d >= mon && d <= D.today()).length; }

  const today = {
    id: 'today', label: 'Today', icon: 'timer',
    render(ctx) {
      const s = ctx.state, t = D.today(), dn = todayDone(s), zf = s.zones.some(z => z.id === s.ui.zone) ? s.ui.zone : 'all';
      let items = all(s).filter(x => zf === 'all' || x.z.id === zf).filter(x => !s.ui.easyOnly || x.t.effort === 'easy');
      const hiddenDone = s.ui.hideDone ? items.filter(x => dn[x.t.id]).length : 0;
      if (s.ui.hideDone) items = items.filter(x => !dn[x.t.id]);
      let capped = 0;
      if (s.ui.cap) {
        const per = {};
        items = items.filter(x => { per[x.z.id] = (per[x.z.id] || 0) + 1; if (per[x.z.id] > 3) { capped++; return false; } return true; });
      }
      const zoneCounts = s.zones.map(z => [z.id, z.name || 'Zone', z.tasks.filter(x => P.has(x.text) && !dn[x.id]).length]);
      return `
      ${u.head({ eyebrow: 'Quick reset', title: 'One room. A few tasks. <em>A timer.</em>', lede: 'Skip the whole-house spiral: pick a zone, start with something easy, and let the timer tell you when to stop.' })}
      <div class="cl-top">
        <section class="y-panel y-panel--world cl-focus">
          <h2 class="y-kicker"><label for="clFocus">Today’s clean focus</label></h2>
          ${u.input('focus', s.focus, { id: 'clFocus', ph: 'e.g. Kitchen only', cls: 'y-input--big' })}
          <div data-slot="kpis"></div>
        </section>
        ${u.timer({ idle: 'Pick a task and press its timer', cls: 'cl-timer' })}
      </div>
      ${u.panel('Today’s list', `
        ${u.chips('ui.zone', zf, [['all', 'All zones', all(s).filter(x => !dn[x.t.id]).length], ...zoneCounts], 'Zone')}
        <div class="pl-row cl-switches">${u.switch('ui.easyOnly', s.ui.easyOnly, 'Low energy: easy only')}${u.switch('ui.hideDone', s.ui.hideDone, 'Hide done')}${u.switch('ui.cap', s.ui.cap, 'Max 3 per zone')}</div>
        ${items.length ? `<ul class="pl-checklist cl-list">${items.map(({ z, t: k }) => `
          <li class="pl-ci cl-task${dn[k.id] ? ' is-done' : ''}">
            ${u.tick(`done.${t}.${k.id}`, !!dn[k.id], `Done: ${k.text}`, { rerender: true })}
            <div class="pl-ci-main"><span class="pl-ci-text">${esc(k.text)}</span><span class="pl-ci-meta">${esc(z.name || 'Zone')} · ${u.pill(EFF[k.effort], k.effort === 'easy' ? 'good' : k.effort === 'high' ? 'warn' : '')} · ${mins(k)} min</span></div>
            ${dn[k.id] ? '' : u.btn(`${mins(k)} min`, { sm: true, icon: 'timer', act: 'timer-start', data: { secs: mins(k) * 60, label: k.text, ref: k.id }, cls: 'cl-go' })}
          </li>`).join('')}</ul>`
          : all(s).length ? u.empty('check', 'All clear here', 'Nothing left with these filters. That counts.') : u.empty('home', 'No tasks yet', 'Add a few short tasks per zone on the Zones page.', u.btn('Set up zones', { kind: 'world', act: 'go', data: { page: 'zones' } }))}
        ${capped || hiddenDone ? `<p class="pl-hint cl-more">${[capped ? `${capped} more hidden by “Max 3 per zone”` : '', hiddenDone ? `${hiddenDone} done hidden` : ''].filter(Boolean).join(' · ')}.</p>` : ''}`, { icon: 'check', hint: 'Ticks are for today only — tomorrow starts fresh, your zones and tasks stay.' })}`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, dn = todayDone(s), list = all(s);
        const doneN = list.filter(x => dn[x.t.id]).length, minsDone = list.filter(x => dn[x.t.id]).reduce((a, x) => a + mins(x.t), 0);
        return `<div class="cl-stats"><span><b class="y-num">${doneN}</b> done</span><span><b class="y-num">${list.length - doneN}</b> open</span><span><b class="y-num">${minsDone}</b> min today</span><span><b class="y-num">${daysThisWeek(s)}</b> ${daysThisWeek(s) === 1 ? 'day' : 'days'} this week</span></div>`;
      }
    }
  };

  const zones = {
    id: 'zones', label: 'Zones', icon: 'home',
    render(ctx) {
      const s = ctx.state;
      return `
      ${u.head({ eyebrow: 'Set up once', title: 'Zones & tasks', lede: 'Keep each zone short — three or four tasks you could finish in a few minutes each.' })}
      ${u.records('zones', s.zones, {
        what: 'Zone', titlePh: 'Zone name', move: true, cls: 'cl-zones',
        sub: z => `${P.plural(z.tasks.filter(x => P.has(x.text)).length, 'task')} · ${z.tasks.reduce((a, x) => a + (P.has(x.text) ? mins(x) : 0), 0)} min in total`,
        foot: (z, i) => u.table(`zones.${i}.tasks`, z.tasks, [
          { k: 'text', label: 'Task', title: true, ph: 'Short task' },
          { k: 'effort', label: 'Effort', type: 'select', options: EFFORT, w: '128px' },
          { k: 'mins', label: 'Min', num: true, w: '64px', ph: '5' }
        ], { add: 'Add task', what: 'task', empty: 'No tasks yet.' }),
        add: 'Add zone', empty: u.empty('home', 'No zones yet', 'Add the rooms or areas you actually reset — even “desk” counts.')
      })}`;
    }
  };

  const notes = {
    id: 'notes', label: 'Notes', icon: 'edit',
    render(ctx) {
      return `${u.head({ eyebrow: 'Parking lot', title: 'Notes', lede: 'Where the supplies live, what to skip, your low-energy minimum.' })}
      ${u.notes('notes', ctx.state.notes, { rows: 12 })}`;
    }
  };

  window.CSClean = { pages: { today, zones }, blank, sample, normalize, rows: { zones: () => zone(''), tasks: () => task('', 'easy', 5) } };
})();
