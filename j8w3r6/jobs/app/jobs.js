/* Job Search App — pipeline board, applications, follow-ups and weekly goal, from Job Search Tracker. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const STAGES = [['wishlist', 'Wishlist'], ['applied', 'Applied'], ['interview', 'Interviewing'], ['offer', 'Offer'], ['closed', 'Closed']];
  const STAGE = Object.fromEntries(STAGES);
  const OUTCOMES = ['', 'Rejected', 'Withdrew', 'No response', 'Accepted', 'Declined'];
  const txt = v => (v == null ? '' : String(v));
  const job = o => Object.assign({ id: P.uid(), company: '', role: '', stage: 'wishlist', outcome: '', applied: '', next: '', nextStep: '', link: '', contact: '', salary: '', location: '', excitement: '0', notes: '' }, o || {});

  function blank() { return { goal: '5', jobs: [], notes: '' }; }
  function sample() {
    const t = D.today(), o = n => D.add(t, n);
    return {
      goal: '5',
      jobs: [
        job({ company: 'Harbor Softworks', role: 'Product Designer', stage: 'interview', applied: o(-10), next: o(2), nextStep: 'Panel interview — portfolio walkthrough', contact: 'Priya (recruiter)', salary: '$95–110k', location: 'Remote', excitement: '5', link: 'https://example.com/jobs/pd', notes: 'Ask about the design team size and how critique works.' }),
        job({ company: 'Northline Analytics', role: 'Operations Analyst', stage: 'applied', applied: o(-18), next: o(-3), nextStep: 'Follow up with the recruiter', contact: 'Sam Lee', salary: '$80k', location: 'Hybrid · Denver', excitement: '3', notes: 'Emailed once. Waiting on a screen.' }),
        job({ company: 'Cedar & Co.', role: 'Customer Success Lead', stage: 'wishlist', next: o(1), nextStep: 'Tailor CV, then apply', location: 'Remote', excitement: '4', notes: 'Warm intro via Maya.' }),
        job({ company: 'Summit Retail Group', role: 'Store Ops Manager', stage: 'applied', applied: o(-4), next: o(3), nextStep: 'Check portal status', location: 'On-site', excitement: '2' }),
        job({ company: 'Lumen Health', role: 'UX Researcher', stage: 'offer', applied: o(-35), next: o(4), nextStep: 'Reply to offer — ask about start date', salary: '$102k + bonus', location: 'Remote', excitement: '4', notes: 'Offer letter received. Compare with Harbor timeline.' }),
        job({ company: 'Brightfield Labs', role: 'Research Associate', stage: 'closed', outcome: 'Rejected', applied: o(-30), nextStep: 'Ask for feedback', excitement: '3', notes: 'Kind rejection.' }),
        job({ company: 'Orbit Media', role: 'Content Designer', stage: 'applied', applied: o(-2), next: o(5), nextStep: 'Follow up if no reply', location: 'Remote', excitement: '3' })
      ],
      notes: 'Stories to have ready:\n• A time I simplified a messy process\n• A project that failed and what I changed\n\nQuestions to ask every interview: timeline, team, what success looks like in 90 days.'
    };
  }
  function normalize(s) {
    s.goal = txt(s.goal); s.notes = txt(s.notes);
    s.jobs = (Array.isArray(s.jobs) ? s.jobs : []).filter(x => x && typeof x === 'object').map(x => { const j = job(); Object.keys(j).forEach(k => { j[k] = txt(x[k]) || (k === 'id' ? P.uid() : j[k]); }); j.stage = STAGE[x.stage] ? x.stage : 'wishlist'; j.outcome = OUTCOMES.includes(x.outcome) ? x.outcome : ''; return j; });
    return s;
  }
  const t = () => D.today();
  const live = j => j.stage !== 'closed' && P.has(j.company + j.role);
  const due = j => live(j) && D.parse(j.next) && j.next <= D.add(t(), 2);
  const overdue = j => live(j) && D.parse(j.next) && j.next < t();
  const thisWeek = s => { const from = D.add(t(), -6); return s.jobs.filter(j => D.parse(j.applied) && j.applied >= from && j.applied <= t()).length; }; // rolling 7 days: Monday never starts at zero
  const title = j => `${j.role || 'Role'}${j.company ? ' · ' + j.company : ''}`;
  const whenPill = j => !D.parse(j.next) ? '' : j.next < t() ? u.pill(`overdue · ${D.short(j.next)}`, 'bad') : j.next === t() ? u.pill('today', 'warn') : u.pill(D.rel(j.next), 'world');

  const board = {
    id: 'board', label: 'Pipeline', icon: 'briefcase',
    badge: ctx => ctx.state.jobs.filter(overdue).length || '',
    render(ctx) {
      const s = ctx.state, week = thisWeek(s), goal = Math.round(P.num(s.goal));
      return `${u.head({ eyebrow: 'Job search', title: `<em>${s.jobs.filter(live).length}</em> in play`, lede: 'Every role from “maybe” to offer. Keep a next step and a date on each one — that’s the whole system.' })}
      <div class="pl-grid">
        <section class="y-panel y-panel--world pl-5 js-goal"><h2 class="y-kicker">Applied in the last 7 days</h2><div class="js-goal-row"><b class="y-num">${week}</b><span>of</span>${u.input('goal', s.goal, { num: true, label: 'Weekly goal', cls: 'js-goal-in', rerender: true })}<span>goal</span></div>${goal ? u.meter(week / goal * 100, 'Weekly goal') : ''}<p class="y-hint">${goal && week >= goal ? 'Goal hit — rest counts too.' : 'Small and steady beats a burst and a burnout.'}</p></section>
        ${u.panel('Next steps', `${s.jobs.filter(due).sort((a, b) => a.next.localeCompare(b.next)).slice(0, 5).map(j => `<div class="js-next"><div><b>${esc(j.nextStep || 'Next step')}</b><span class="pl-muted">${esc(title(j))}</span></div>${whenPill(j)}</div>`).join('') || '<p class="pl-muted">Nothing due in the next two days.</p>'}`, { icon: 'calendar', cls: 'pl-7' })}
      </div>
      <div class="js-cols">${STAGES.map(([k, label]) => { const list = s.jobs.map((j, i) => Object.assign({ __i: i }, j)).filter(j => j.stage === k && P.has(j.company + j.role)); return `<section class="js-col js-col--${k}"><h2>${label} <span class="pl-chip-n">${list.length}</span></h2>${list.map(j => `<article class="js-card${overdue(j) ? ' is-late' : ''}">
          <b>${esc(j.role || 'Role')}</b><span class="js-co">${esc(j.company)}</span>${j.nextStep ? `<span class="js-step">${esc(j.nextStep)}</span>` : ''}<div class="js-card-foot">${whenPill(j)}${j.outcome ? u.pill(j.outcome, j.outcome === 'Accepted' ? 'good' : '') : ''}</div>
          <div class="js-move">${k !== 'wishlist' ? u.iconBtn('prev', `Move ${j.role} back`, 'move', { i: j.__i, d: -1 }) : ''}${u.btn('Details', { sm: true, kind: 'ghost', act: 'open', data: { id: j.id } })}${k !== 'closed' ? u.iconBtn('next', `Move ${j.role} forward`, 'move', { i: j.__i, d: 1 }) : ''}</div></article>`).join('') || '<p class="pl-muted js-none">—</p>'}</section>`; }).join('')}</div>
      ${u.panel('Add a role', u.quickAdd('jobs', { key: 'role', ph: 'Role title — add the company and details after', label: 'Add a role', kind: 'world', at: 'top' }))}`;
    },
    onQuickAdd(ctx, d, item) { ctx.state.ui.open = item.id; },
    actions: {
      move(ctx, d) { const j = ctx.state.jobs[+d.i]; if (!j) return false; const i = STAGES.findIndex(x => x[0] === j.stage), n = Math.max(0, Math.min(STAGES.length - 1, i + +d.d)); j.stage = STAGES[n][0]; if (j.stage === 'applied' && !j.applied) j.applied = t(); ctx.toast(`${j.role || 'Role'} → ${STAGES[n][1]}`); },
      open(ctx, d) { ctx.state.ui.open = d.id; ctx.state.ui.page = 'applications'; }
    }
  };

  const apps = {
    id: 'applications', label: 'Applications', icon: 'list',
    render(ctx) {
      const s = ctx.state, f = STAGE[s.ui.f] ? s.ui.f : 'all', q = txt(s.ui.q).toLowerCase().trim();
      const list = s.jobs.map((j, i) => Object.assign({ __i: i }, j)).filter(j => (f === 'all' || j.stage === f) && (!q || `${j.company} ${j.role} ${j.notes} ${j.contact}`.toLowerCase().includes(q)))
        .sort((a, b) => (a.id === s.ui.open ? -1 : b.id === s.ui.open ? 1 : 0));
      return `${u.head({ eyebrow: 'All roles', title: 'Applications', lede: 'Details for every role: dates, contact, salary, links and notes.' })}
      <div class="pl-row js-tools">${u.chips('ui.f', f, [['all', 'All', s.jobs.length], ...STAGES.map(([k, l]) => [k, l, s.jobs.filter(j => j.stage === k).length])], 'Stage')}<span class="pl-spacer"></span><div class="js-search">${I('eye')}${u.input('ui.q', s.ui.q, { label: 'Search applications', ph: 'Company, role, contact', live: true })}</div></div>
      ${u.records('jobs', list, {
        index: j => j.__i, what: 'Role', titleKey: 'role', titlePh: 'Role title', cls: 'js-recs',
        cardClass: j => `${j.id === s.ui.open ? 'is-top' : ''}${overdue(j) ? ' is-flag' : ''}`,
        sub: j => `${u.pill(STAGE[j.stage], j.stage === 'offer' ? 'good' : j.stage === 'interview' ? 'world' : '')} ${whenPill(j)}`,
        fields: [
          { k: 'company', label: 'Company', ph: 'Company', wide: true }, { k: 'stage', label: 'Stage', options: STAGES, rerender: true },
          { k: 'excitement', label: 'Excitement', type: 'stars', wide: true }, { k: 'applied', label: 'Applied', type: 'date' }, { k: 'next', label: 'Next step date', type: 'date', rerender: true },
          { k: 'nextStep', label: 'Next step', ph: 'Follow up, prep, reply…', wide: true }, { k: 'contact', label: 'Contact', ph: 'Name, email' }, { k: 'salary', label: 'Salary', ph: 'Range' },
          { k: 'location', label: 'Location', ph: 'Remote / city' }, { k: 'outcome', label: 'Outcome', options: OUTCOMES.map(x => [x, x || '—']), when: j => j.stage === 'closed' },
          { k: 'link', label: 'Job link', type: 'url', ph: 'https://…', wide: true }, { k: 'notes', label: 'Notes', type: 'textarea', wide: true }
        ],
        add: 'Add role', addKind: 'world', empty: s.jobs.length ? '<p class="pl-muted">No roles match.</p>' : u.empty('briefcase', 'No roles yet', 'Add roles you’re curious about to the wishlist — applying comes later.')
      })}`;
    }
  };

  const follow = {
    id: 'followups', label: 'Follow-ups', icon: 'calendar',
    badge: ctx => ctx.state.jobs.filter(due).length || '',
    render(ctx) {
      const s = ctx.state, list = s.jobs.map((j, i) => Object.assign({ __i: i }, j)).filter(j => live(j) && D.parse(j.next)).sort((a, b) => a.next.localeCompare(b.next));
      const none = s.jobs.filter(j => live(j) && !D.parse(j.next));
      return `${u.head({ eyebrow: 'Stay on it', title: 'Follow-ups', lede: 'Sorted by date. A polite follow-up a week after applying is normal — and often gets a reply.' })}
      ${u.panel('', list.length ? `<ol class="js-follow">${list.map(j => `<li class="${overdue(j) ? 'is-late' : ''}"><div class="js-follow-when y-num"><b>${esc(D.fmt(j.next, { month: 'short', day: 'numeric' }))}</b><span>${esc(D.rel(j.next))}</span></div><div class="js-follow-main"><b>${esc(j.nextStep || 'Next step')}</b><span class="pl-muted">${esc(title(j))}${j.contact ? ' · ' + esc(j.contact) : ''}</span></div>${u.btn('Done', { sm: true, icon: 'check', act: 'doneStep', data: { i: j.__i } })}${u.btn('+1 week', { sm: true, kind: 'ghost', act: 'snooze', data: { i: j.__i } })}</li>`).join('')}</ol>` : '<p class="pl-muted">No follow-up dates yet.</p>')}
      ${none.length ? u.banner('warn', `<b>${P.plural(none.length, 'role')} with no next date:</b> ${none.slice(0, 6).map(j => esc(title(j))).join(' · ')}`) : ''}`;
    },
    actions: {
      doneStep(ctx, d) { const j = ctx.state.jobs[+d.i]; if (!j) return false; j.notes = `${D.short(t())}: ${j.nextStep || 'follow-up'} ✓${j.notes ? '\n' + j.notes : ''}`; j.nextStep = ''; j.next = ''; ctx.toast('Logged in the notes — set the next step when you know it'); },
      snooze(ctx, d) { const j = ctx.state.jobs[+d.i]; if (!j) return false; j.next = D.add(D.parse(j.next) && j.next > t() ? j.next : t(), 7); }
    }
  };

  const notes = {
    id: 'notes', label: 'Notes', icon: 'edit',
    render(ctx) { return `${u.head({ eyebrow: 'Prep', title: 'Notes', lede: 'Your stories, questions to ask, salary research, people to thank.' })}${u.notes('notes', ctx.state.notes, { rows: 14 })}`; }
  };

  window.JBJobs = {
    pages: { board, apps, follow }, blank, sample, normalize,
    rows: { jobs: () => job({ next: D.add(D.today(), 2) }) }
  };
})();
