/* Pet Care Planner App — daily care per pet, profiles, recurring health care with next due dates, vet visits, weight, meds,
   pet expenses and a printable pet-sitter sheet. Yaykit planner engine, paws world (defined in pets.css). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const SPECIES = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Other'];
  const SLOTS = [['AM', 'Morning'], ['PM', 'Evening'], ['Any', 'Any time']];
  const UNITS = [['weeks', 'weeks'], ['months', 'months']];
  const CATS = ['Food', 'Vet', 'Grooming', 'Toys & supplies', 'Insurance', 'Boarding & sitting', 'Other'];
  const txt = v => (v == null ? '' : String(v));
  const r2 = n => Math.round(n * 100) / 100;
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
  const iso = v => (D.parse(v) ? v : '');

  const routine = (text, slot) => ({ id: P.uid(), text: text || '', slot: SLOTS.some(s => s[0] === slot) ? slot : 'Any' });
  const pet = o => Object.assign({ id: P.uid(), name: '', species: 'Dog', breed: '', birthday: '', weight: '', chip: '', food: '', amount: '', allergies: '', vet: '', vetPhone: '', insurance: '', quirks: '', routine: [] }, o || {});
  const care = o => Object.assign({ id: P.uid(), pid: '', what: '', every: '1', unit: 'months', last: '' }, o || {});
  const visit = o => Object.assign({ id: P.uid(), pid: '', date: D.today(), reason: '', notes: '', cost: '' }, o || {});
  const weigh = o => Object.assign({ id: P.uid(), pid: '', date: D.today(), lbs: '' }, o || {});
  const med = o => Object.assign({ id: P.uid(), pid: '', name: '', dose: '', schedule: '', start: D.today(), end: '', given: [] }, o || {});
  const spend = o => Object.assign({ id: P.uid(), pid: '', date: D.today(), cat: 'Food', amount: '', note: '' }, o || {});

  /* ---------- dates ---------- */
  function addMonths(isoDate, n) {
    const d = D.parse(isoDate), day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    return D.iso(d);
  }
  const nextDue = c => (D.parse(c.last) ? (c.unit === 'weeks' ? D.add(c.last, 7 * (Math.round(P.num(c.every)) || 1)) : addMonths(c.last, Math.round(P.num(c.every)) || 1)) : '');
  function age(b) {
    const d = D.parse(b); if (!d) return '';
    const n = new Date(); let m = (n.getFullYear() - d.getFullYear()) * 12 + n.getMonth() - d.getMonth();
    if (n.getDate() < d.getDate()) m--;
    if (m < 0) return '';
    return m < 12 ? P.plural(m, 'month') : m % 12 && m < 36 ? `${Math.floor(m / 12)} y ${m % 12} m` : P.plural(Math.floor(m / 12), 'year');
  }
  const stamp = () => { const d = new Date(); return `${D.iso(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const when = st => { const [d, tm] = String(st).split('T'); const t = D.today(); return `${d === t ? 'today' : d === D.add(t, -1) ? 'yesterday' : D.short(d)}${tm ? ` ${D.time(tm)}` : ''}`; };

  function blank() { return { pets: [], done: {}, care: [], visits: [], weights: [], meds: [], spends: [], sitter: { owner: '', phone: '', backup: '', backupPhone: '', er: '', house: '' }, notes: '' }; }
  function sample() {
    const t = D.today(), ago = n => D.add(t, -n), mAgo = n => addMonths(t, -n);
    const b = pet({ name: 'Biscuit', species: 'Dog', breed: 'Golden Retriever', birthday: addMonths(ago(9), -50), weight: '68', chip: '985 112 004 567 321',
      food: 'Large-breed kibble, lamb & rice', amount: '2 cups morning + 2 cups evening', allergies: 'Chicken — itchy skin', vet: 'Dr. Alvarez · Maple Street Animal Clinic', vetPhone: '(555) 214-8830',
      insurance: 'Policy PI-4471920', quirks: 'Barks at the mail carrier. Scared of thunder — put on his anxiety vest and close the blinds.',
      routine: [routine('Breakfast', 'AM'), routine('Morning walk', 'AM'), routine('Evening walk', 'PM'), routine('Dinner', 'PM'), routine('Joint chew', 'PM')] });
    const c = pet({ name: 'Pepper', species: 'Cat', breed: 'Domestic shorthair', birthday: addMonths(ago(20), -26), weight: '9.5', chip: '985 112 009 884 102',
      food: 'Salmon kibble + half a can of wet food', amount: '¼ cup kibble twice a day; wet food at dinner', allergies: '', vet: 'Dr. Alvarez · Maple Street Animal Clinic', vetPhone: '(555) 214-8830',
      insurance: '', quirks: 'Hides under the bed with strangers — leave her be, she comes out at dinner. Indoor only: keep the door shut.',
      routine: [routine('Breakfast', 'AM'), routine('Fresh water', 'AM'), routine('Dinner', 'PM'), routine('Scoop the litter box', 'PM'), routine('Brush', 'Any')] });
    const done = { [t]: { [b.routine[0].id]: true, [b.routine[1].id]: true, [c.routine[0].id]: true } };
    for (let i = 1; i < 4; i++) done[ago(i)] = Object.fromEntries(b.routine.concat(c.routine).map(x => [x.id, true]));
    const sp = (pid, n, cat, amount, note) => spend({ pid, date: ago(n), cat, amount: String(amount), note });
    const day = +t.slice(8), inMonth = n => Math.min(n, day - 1);   // keep "this month" entries inside the current month
    return {
      pets: [b, c], done,
      care: [care({ pid: b.id, what: 'Flea & tick chew', every: '1', unit: 'months', last: D.add(mAgo(1), -4) }), care({ pid: b.id, what: 'Heartworm pill', every: '1', unit: 'months', last: ago(20) }),
        care({ pid: b.id, what: 'DHPP vaccine', every: '12', unit: 'months', last: D.add(mAgo(12), 10) }), care({ pid: b.id, what: 'Rabies vaccine', every: '36', unit: 'months', last: mAgo(14) }),
        care({ pid: b.id, what: 'Grooming', every: '8', unit: 'weeks', last: ago(44) }), care({ pid: b.id, what: 'Nail trim', every: '4', unit: 'weeks', last: ago(19) }),
        care({ pid: c.id, what: 'FVRCP vaccine', every: '12', unit: 'months', last: mAgo(5) }), care({ pid: c.id, what: 'Flea treatment', every: '1', unit: 'months', last: ago(12) }),
        care({ pid: c.id, what: 'Dental cleaning', every: '12', unit: 'months', last: D.add(mAgo(12), 25) })],
      visits: [visit({ pid: b.id, date: ago(140), reason: 'Annual checkup', notes: 'Healthy. Lose about 3 lb — fewer treats.', cost: '185' }),
        visit({ pid: c.id, date: ago(60), reason: 'Ear mites', notes: 'Ear drops for 10 days. Recheck if she keeps scratching.', cost: '96' }),
        visit({ pid: b.id, date: ago(33), reason: 'Limping after the park', notes: 'Mild sprain. Rest a week, joint chew every evening.', cost: '140' })],
      weights: [['b', 180, '71.5'], ['b', 120, '70.2'], ['b', 60, '69'], ['b', 10, '68'], ['c', 150, '8.6'], ['c', 90, '9.1'], ['c', 30, '9.4'], ['c', 5, '9.5']]
        .map(([k, n, lbs]) => weigh({ pid: k === 'b' ? b.id : c.id, date: ago(n), lbs })),
      meds: [med({ pid: b.id, name: 'Joint supplement', dose: '1 chew', schedule: 'Every evening with dinner', start: ago(33), given: [`${ago(2)}T19:05`, `${ago(1)}T19:10`] }),
        med({ pid: c.id, name: 'Ear drops', dose: '2 drops in each ear', schedule: 'Twice a day for 10 days', start: ago(3), end: D.add(t, 7), given: [`${ago(1)}T08:00`, `${ago(1)}T20:15`, `${t}T08:10`] })],
      spends: [sp(b.id, inMonth(2), 'Food', 64.99, 'Big bag of kibble'), sp(c.id, inMonth(4), 'Food', 38.5, 'Kibble + 12 cans'), sp(b.id, inMonth(6), 'Insurance', 42, 'Monthly premium'),
        sp(c.id, inMonth(8), 'Toys & supplies', 24.99, 'Litter, 2 boxes'), sp(b.id, inMonth(9), 'Toys & supplies', 18, 'Rope toy + chews'),
        sp(b.id, 33, 'Vet', 140, 'Limping visit'), sp(b.id, 36, 'Insurance', 42, 'Monthly premium'), sp(b.id, 38, 'Food', 64.99, 'Big bag of kibble'), sp(c.id, 40, 'Food', 36, 'Kibble + cans'),
        sp(b.id, 44, 'Grooming', 75, 'Bath + trim'), sp(c.id, 60, 'Vet', 96, 'Ear mites'), sp(b.id, 66, 'Insurance', 42, 'Monthly premium'), sp(b.id, 70, 'Boarding & sitting', 160, 'Weekend sitter'),
        sp(b.id, 140, 'Vet', 185, 'Annual checkup')],
      sitter: { owner: 'Sam Parker', phone: '(555) 301-7742', backup: 'Jordan Lee (neighbor, no. 14)', backupPhone: '(555) 301-9910', er: 'Riverside Animal ER, open 24/7 · (555) 640-1100 · 22 River Rd',
        house: 'Spare key in the lockbox by the side door (code on your text).\nLeashes, poop bags and treats hang by the back door.\nFood lives in the pantry, bottom shelf. Wet food in the fridge once opened.\nWi-Fi: ParkerHome' },
      notes: ''
    };
  }
  function normalize(s) {
    s.pets = arr(s.pets, x => pet({ id: txt(x.id) || P.uid(), name: txt(x.name), species: SPECIES.includes(x.species) ? x.species : 'Other', breed: txt(x.breed), birthday: iso(x.birthday), weight: txt(x.weight),
      chip: txt(x.chip), food: txt(x.food), amount: txt(x.amount), allergies: txt(x.allergies), vet: txt(x.vet), vetPhone: txt(x.vetPhone), insurance: txt(x.insurance), quirks: txt(x.quirks),
      routine: arr(x.routine, y => Object.assign(routine(txt(y.text), y.slot), { id: txt(y.id) || P.uid() })) }));
    const done = s.done && typeof s.done === 'object' ? s.done : {};
    s.done = Object.fromEntries(Object.keys(done).filter(k => D.parse(k) && done[k] && typeof done[k] === 'object').map(k => [k, Object.fromEntries(Object.keys(done[k]).filter(r => done[k][r]).map(r => [r, true]))]));
    s.care = arr(s.care, x => care({ id: txt(x.id) || P.uid(), pid: txt(x.pid), what: txt(x.what), every: txt(x.every) || '1', unit: x.unit === 'weeks' ? 'weeks' : 'months', last: iso(x.last) }));
    s.visits = arr(s.visits, x => visit({ id: txt(x.id) || P.uid(), pid: txt(x.pid), date: iso(x.date), reason: txt(x.reason), notes: txt(x.notes), cost: txt(x.cost) }));
    s.weights = arr(s.weights, x => weigh({ id: txt(x.id) || P.uid(), pid: txt(x.pid), date: iso(x.date) || D.today(), lbs: txt(x.lbs) }));
    s.meds = arr(s.meds, x => med({ id: txt(x.id) || P.uid(), pid: txt(x.pid), name: txt(x.name), dose: txt(x.dose), schedule: txt(x.schedule), start: iso(x.start), end: iso(x.end),
      given: (Array.isArray(x.given) ? x.given : []).map(txt).filter(g => D.parse(g.slice(0, 10))).sort() }));
    s.spends = arr(s.spends, x => spend({ id: txt(x.id) || P.uid(), pid: txt(x.pid), date: iso(x.date) || D.today(), cat: CATS.includes(x.cat) ? x.cat : 'Other', amount: txt(x.amount), note: txt(x.note) }));
    const st = s.sitter && typeof s.sitter === 'object' ? s.sitter : {};
    s.sitter = { owner: txt(st.owner), phone: txt(st.phone), backup: txt(st.backup), backupPhone: txt(st.backupPhone), er: txt(st.er), house: txt(st.house) };
    s.notes = txt(s.notes);
    s.ui = s.ui || {};
    if (s.ui.pet !== 'all' && !s.pets.some(p => p.id === s.ui.pet)) s.ui.pet = 'all';
    s.ui.draft = Object.assign({ amount: '', pid: '', cat: 'Food', note: '' }, s.ui.draft || {});
    return s;
  }

  /* ---------- helpers ---------- */
  const named = s => s.pets.filter(p => P.has(p.name));
  const shown = s => named(s).filter(p => s.ui.pet === 'all' || p.id === s.ui.pet);
  const mine = (s, list) => list.map((x, i) => Object.assign({ __i: i }, x)).filter(x => s.ui.pet === 'all' || x.pid === s.ui.pet);
  const petName = (s, id) => (s.pets.find(p => p.id === id) || {}).name || 'No pet';
  const petOpts = s => named(s).map(p => [p.id, p.name]);
  const chips = s => (named(s).length > 1 ? `<div class="pc-chips">${u.chips('ui.pet', s.ui.pet, [['all', 'All pets']].concat(named(s).map(p => [p.id, p.name])), 'Show pet')}</div>` : '');
  const dueList = (s, days) => { const t = D.today(), lim = D.add(t, days); return mine(s, s.care).filter(c => P.has(c.what) && nextDue(c) && nextDue(c) <= lim).sort((a, b) => (nextDue(a) < nextDue(b) ? -1 : 1)); };
  const overdue = s => dueList(s, 0).filter(c => nextDue(c) < D.today());
  const activeMeds = s => { const t = D.today(); return mine(s, s.meds).filter(m => P.has(m.name) && (!m.start || m.start <= t) && (!m.end || m.end >= t)); };
  const ym = d => d.slice(0, 7);
  const sum = list => r2(list.reduce((a, x) => a + P.num(x.amount), 0));
  const monthSpends = (s, m) => mine(s, s.spends).filter(x => ym(x.date) === m);
  const careRow = (s, c) => { const n = nextDue(c), t = D.today(), late = n && n < t;
    return `<li class="pc-due${late ? ' is-late' : ''}"><span class="pc-due-main"><b>${esc(c.what)}</b><span class="pl-muted">${esc(petName(s, c.pid))} · ${n ? (late ? `<span class="is-over">${esc(D.short(n))} · ${P.plural(D.diff(n, t), 'day')} late</span>` : n === t ? 'due today' : `due ${esc(D.short(n))}`) : 'no date yet'}</span></span>${u.btn('Done today', { sm: true, icon: 'check', act: 'careDone', data: { id: c.id } })}</li>`; };
  const careDone = { careDone(ctx, d) { const c = ctx.state.care.find(x => x.id === d.id); if (c) { c.last = D.today(); ctx.toast(`${c.what}: next due ${D.short(nextDue(c))}`); } } };
  const given = { given(ctx, d) { const m = ctx.state.meds.find(x => x.id === d.id); if (m) { m.given.push(stamp()); ctx.toast(`${m.name}: given`); } } };

  /* ---------- today ---------- */
  const today = {
    id: 'today', label: 'Today', icon: 'home',
    render(ctx) {
      const s = ctx.state, t = D.today(), pets = shown(s);
      return `${u.head({ eyebrow: D.long(t), title: '<span data-slot="title"></span>', lede: 'Tick the daily care as it happens. Vaccines, flea and tick and grooming that are due soon get their own list.' })}
      ${chips(s)}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        <div class="pl-7 pc-stack">${pets.length ? pets.map(p => { const done = s.done[t] || {}, list = p.routine.filter(r => P.has(r.text)), n = list.filter(r => done[r.id]).length;
          return u.panel(p.name, list.length ? SLOTS.map(([k, l]) => { const items = list.filter(r => r.slot === k); return items.length ? `<h3 class="pc-slot">${l}</h3><ul class="pc-care">${items.map(r => `<li>${u.check(`done.${t}.${r.id}`, !!done[r.id], esc(r.text), { rerender: true })}</li>`).join('')}</ul>` : ''; }).join('')
            : `<p class="pl-muted">No daily routine yet. Add feeding, walks or litter on Pets.</p>`, { icon: 'heart', cls: 'pc-pet', actions: list.length ? u.pill(`${n}/${list.length} done`, n === list.length ? 'good' : 'world') : '' }); }).join('')
          : u.panel('', u.empty('heart', 'No pets yet', 'Add your first pet — name, food and a daily routine.', u.btn('Add a pet', { kind: 'world', icon: 'plus', act: 'go', data: { page: 'pets' } })))}</div>
        <div class="pl-5 pc-stack">
          ${u.panel('Due soon', '<div data-slot="due"></div>', { icon: 'calendar', actions: u.btn('Health', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'health' } }) })}
          ${u.panel('Meds today', '<div data-slot="meds"></div>', { icon: 'timer' })}
        </div>
      </div>`;
    },
    slots: {
      title(ctx) {
        const s = ctx.state, t = D.today(), done = s.done[t] || {}, all = shown(s).flatMap(p => p.routine.filter(r => P.has(r.text))), n = all.filter(r => done[r.id]).length;
        if (!all.length) return 'Happy pets, <em>calm days</em>';
        return n === all.length ? 'All care <em>done</em> today' : `<em>${all.length - n}</em> care ${all.length - n === 1 ? 'task' : 'tasks'} left today`;
      },
      kpis(ctx) {
        const s = ctx.state, t = D.today(), done = s.done[t] || {}, all = shown(s).flatMap(p => p.routine.filter(r => P.has(r.text))), od = overdue(s).length, soon = dueList(s, 14).length;
        return u.kpis([['Daily care', `${all.filter(r => done[r.id]).length}<small>/${all.length}</small>`, 'y-kpi--world', 'done today'],
          ['Overdue', String(od), od ? 'y-kpi--accent' : 'is-good', od ? 'needs doing' : 'nothing late'],
          ['Due in 2 weeks', String(soon - od), '', 'vaccines, meds, grooming'],
          ['Spent this month', ctx.money(sum(monthSpends(s, ym(t))), { cents: false }), '', 'food, vet and the rest']]);
      },
      due(ctx) {
        const s = ctx.state, list = dueList(s, 30);
        return list.length ? `<ul class="pc-dues">${list.map(c => careRow(s, c)).join('')}</ul>` : '<p class="pl-muted">Nothing due in the next 30 days.</p>';
      },
      meds(ctx) {
        const s = ctx.state, list = activeMeds(s);
        return list.length ? `<ul class="pc-dues">${list.map(m => `<li class="pc-due"><span class="pc-due-main"><b>${esc(m.name)}</b><span class="pl-muted">${esc([petName(s, m.pid), m.dose, m.schedule].filter(Boolean).join(' · '))}</span><span class="pl-muted">${m.given.length ? `Last given ${esc(when(m.given[m.given.length - 1]))}` : 'Not given yet'}</span></span>${u.btn('Given', { sm: true, icon: 'check', act: 'given', data: { id: m.id } })}</li>`).join('')}</ul>`
          : '<p class="pl-muted">No medication right now.</p>';
      }
    },
    actions: Object.assign({}, careDone, given)
  };

  /* ---------- pets ---------- */
  const pets = {
    id: 'pets', label: 'Pets', icon: 'heart',
    render(ctx) {
      const s = ctx.state, list = s.pets.map((p, i) => Object.assign({ __i: i }, p)).filter(p => s.ui.pet === 'all' || p.id === s.ui.pet || !P.has(p.name));
      return `${u.head({ eyebrow: 'Pet profiles', title: named(s).length ? `<em>${named(s).length}</em> ${named(s).length === 1 ? 'pet' : 'pets'}` : 'Your <em>pets</em>', lede: 'Everything the vet, the groomer or a sitter might ask — and the daily routine that fills Today.' })}
      ${chips(s)}
      ${u.records('pets', list, {
        what: 'Pet', titlePh: 'Pet’s name', cls: 'pc-recs', index: p => p.__i, add: 'Add a pet', addKind: 'world',
        sub: p => esc([p.species, p.breed, age(p.birthday)].filter(Boolean).join(' · ')),
        fields: [
          { k: 'species', label: 'Species', options: SPECIES }, { k: 'breed', label: 'Breed', ph: 'Golden Retriever' },
          { k: 'birthday', label: 'Birthday', type: 'date', rerender: true }, { k: 'weight', label: 'Weight (lb)', num: true, ph: '0' },
          { k: 'food', label: 'Food', ph: 'Brand and flavor' }, { k: 'amount', label: 'How much', ph: '2 cups twice a day' },
          { k: 'allergies', label: 'Allergies', ph: 'None known' }, { k: 'chip', label: 'Microchip no.', ph: '15 digits' },
          { k: 'vet', label: 'Vet', ph: 'Name · clinic' }, { k: 'vetPhone', label: 'Vet phone', ph: '(555) 000-0000' },
          { k: 'insurance', label: 'Insurance policy', ph: 'Company + policy no.' },
          { k: 'quirks', label: 'Quirks + what a sitter should know', type: 'textarea', wide: true, rows: 3, ph: 'Fears, habits, hiding spots' }
        ],
        foot: (p, i) => `<h3 class="pc-sub">Daily routine</h3>${u.table(`pets.${i}.routine`, p.routine, [{ k: 'text', label: 'Care', title: true, w: '1fr', ph: 'Breakfast, walk, litter…' }, { k: 'slot', label: 'When', type: 'select', options: SLOTS, w: '140px' }], { what: 'routine item', add: 'Add routine item', tpl: 'routine', cls: 'pc-rtab' })}`,
        empty: u.empty('heart', 'No pets yet', 'Add your first pet below.')
      })}`;
    }
  };

  /* ---------- health ---------- */
  const health = {
    id: 'health', label: 'Health', icon: 'calendar',
    badge: ctx => overdue(ctx.state).length || '',
    render(ctx) {
      const s = ctx.state, rows = mine(s, s.care).sort((a, b) => (nextDue(a) || '9') < (nextDue(b) || '9') ? -1 : 1), visits = mine(s, s.visits).sort((a, b) => (a.date < b.date ? 1 : -1)), t = D.today();
      const pid = s.ui.pet === 'all' ? (named(s)[0] || {}).id || '' : s.ui.pet;
      return `${u.head({ eyebrow: 'Health', title: overdue(s).length ? `<em>${overdue(s).length}</em> overdue` : 'All care <em>on time</em>', lede: 'Vaccines, flea and tick, heartworm, grooming: how often, when it was last done — the next date works itself out. Tap “Done today” when you do it.' })}
      ${chips(s)}
      ${u.panel('Recurring care', `${u.table('care', rows, [
        { k: 'pid', label: 'Pet', type: 'select', options: petOpts(s), blank: 'Pet…', w: '120px', rerender: true },
        { k: 'what', label: 'Care', title: true, w: '1.3fr', ph: 'Rabies vaccine' },
        { k: 'every', label: 'Every', num: true, w: '64px', ph: '1' },
        { k: 'unit', label: 'Unit', type: 'select', options: UNITS, w: '110px', rerender: true },
        { k: 'last', label: 'Last done', type: 'date', w: '150px', rerender: true },
        { label: 'Next due', w: '1fr', html: c => { const n = nextDue(c); return n ? `<span class="pc-next${n < t ? ' is-over' : ''}" data-next="${esc(n)}">${esc(D.short(n))}${n < t ? ' · late' : ''}</span>` : '<span class="pl-muted">—</span>'; } },
        { label: '', w: '150px', html: c => u.btn('Done today', { sm: true, icon: 'check', act: 'careDone', data: { id: c.id } }) }
      ], { index: c => c.__i, total: s.care.length, what: 'care item', cls: 'pc-ctab', rowClass: c => (nextDue(c) && nextDue(c) < t ? 'is-late' : '') })}
        <div class="pl-list-foot">${u.btn('Add care item', { sm: true, icon: 'plus', act: 'addCare', data: { pid } })}</div>`, { icon: 'calendar' })}
      ${u.panel('Vet visits', `${u.table('visits', visits, [
        { k: 'date', label: 'Date', type: 'date', w: '150px' },
        { k: 'pid', label: 'Pet', type: 'select', options: petOpts(s), blank: 'Pet…', w: '120px' },
        { k: 'reason', label: 'Reason', title: true, w: '1fr', ph: 'Checkup' },
        { k: 'notes', label: 'What the vet said', w: '1.4fr', ph: 'Notes' },
        { k: 'cost', label: 'Cost', num: true, w: '90px', ph: '0' }
      ], { index: v => v.__i, total: s.visits.length, what: 'visit', empty: 'No visits logged yet.', cls: 'pc-vtab' })}
        <div class="pl-list-foot">${u.btn('Add vet visit', { sm: true, icon: 'plus', act: 'addVisit', data: { pid } })}</div>`, { icon: 'doc' })}`;
    },
    actions: Object.assign({
      addCare(ctx, d) { const s = ctx.state; s.care.push(care({ pid: d.pid, last: D.today() })); ctx.focus(`[data-bind="care.${s.care.length - 1}.what"]`); },
      addVisit(ctx, d) { const s = ctx.state; s.visits.push(visit({ pid: d.pid })); ctx.focus(`[data-bind="visits.${s.visits.length - 1}.reason"]`); }
    }, careDone),
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Pet health</h1>${named(s).map(p => `<h2>${esc(p.name)}</h2><table><thead><tr><th>Care</th><th>Every</th><th>Last done</th><th>Next due</th></tr></thead><tbody>${s.care.filter(c => c.pid === p.id && P.has(c.what)).map(c => `<tr><td><b>${esc(c.what)}</b></td><td>${esc(c.every)} ${esc(c.unit)}</td><td>${c.last ? esc(D.short(c.last)) : ''}</td><td>${nextDue(c) ? esc(D.short(nextDue(c))) : ''}</td></tr>`).join('')}</tbody></table>
        ${s.visits.some(v => v.pid === p.id) ? `<table><thead><tr><th>Visit</th><th>Reason</th><th>Notes</th></tr></thead><tbody>${s.visits.filter(v => v.pid === p.id).sort((a, b) => (a.date < b.date ? 1 : -1)).map(v => `<tr><td>${esc(D.short(v.date))}</td><td>${esc(v.reason)}</td><td>${esc(v.notes)}</td></tr>`).join('')}</tbody></table>` : ''}`).join('')}`;
    }
  };

  /* ---------- weight ---------- */
  function wmath(s, pid) {
    const all = s.weights.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.pid === pid).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.__i - b.__i));
    const list = all.filter(x => P.num(x.lbs) > 0);
    const last = list[list.length - 1], prev = list[list.length - 2], first = list[0];
    return { all, list, last, change: last && prev ? r2(P.num(last.lbs) - P.num(prev.lbs)) : null, since: last && first && first !== last ? r2(P.num(last.lbs) - P.num(first.lbs)) : null };
  }
  const signed = n => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '±0');
  const weight = {
    id: 'weight', label: 'Weight', icon: 'chart',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Weight', title: 'Weigh in, <em>see the trend</em>', lede: 'Log a weight every few weeks. The bars show the trend; the vet will ask for it.' })}
      ${chips(s)}
      <div class="xm-people pc-weights">${shown(s).map(p => { const w = wmath(s, p.id), nums = w.list.map(x => P.num(x.lbs)), lo = Math.min(...nums), hi = Math.max(...nums);
        return u.panel(p.name, `<div class="pc-wtop"><p class="pc-big y-num">${w.last ? `${esc(w.last.lbs)} <small>lb</small>` : '—'}</p><span class="pc-wchange" data-change="${w.change == null ? '' : w.change}">${w.change == null ? '' : `${esc(signed(w.change))} lb since last time`}${w.since != null ? `<br><span class="pl-muted">${esc(signed(w.since))} lb since ${esc(D.short(w.list[0].date))}</span>` : ''}</span></div>
          ${w.list.length > 1 ? `<div class="pc-strip" role="img" aria-label="${esc(p.name)} weight trend">${w.list.slice(-12).map(x => `<span title="${esc(D.short(x.date))}: ${esc(x.lbs)} lb"><i style="height:${hi > lo ? Math.round(25 + (P.num(x.lbs) - lo) / (hi - lo) * 75) : 60}%"></i><small>${esc(D.short(x.date))}</small></span>`).join('')}</div>` : ''}
          ${u.table('weights', w.all.slice().reverse(), [{ k: 'date', label: 'Date', type: 'date', w: '1fr', rerender: true }, { k: 'lbs', label: 'Weight (lb)', num: true, w: '120px', ph: '0' }], { index: x => x.__i, total: s.weights.length, what: 'weigh-in', cls: 'pc-wtab' })}
          <div class="pl-list-foot">${u.btn('Add weigh-in', { sm: true, icon: 'plus', act: 'addWeight', data: { pid: p.id } })}</div>`, { icon: 'chart', cls: 'y-panel--flat xm-person' }); }).join('') || u.empty('chart', 'No pets yet', 'Add a pet first.')}</div>`;
    },
    actions: { addWeight(ctx, d) { const s = ctx.state; s.weights.push(weigh({ pid: d.pid })); ctx.focus(`[data-bind="weights.${s.weights.length - 1}.lbs"]`); } }
  };

  /* ---------- meds ---------- */
  const meds = {
    id: 'meds', label: 'Meds', icon: 'timer',
    render(ctx) {
      const s = ctx.state, list = mine(s, s.meds), pid = s.ui.pet === 'all' ? (named(s)[0] || {}).id || '' : s.ui.pet, t = D.today();
      return `${u.head({ eyebrow: 'Medication', title: activeMeds(s).length ? `<em>${activeMeds(s).length}</em> on the go` : 'Medication', lede: 'Dose, schedule and dates for each one. Tap “Given” every time — no more “did someone already give the drops?”' })}
      ${chips(s)}
      ${u.records('meds', list, {
        what: 'Medication', titlePh: 'Medication', cls: 'pc-recs', index: m => m.__i,
        cardClass: m => (m.end && m.end < t ? 'is-done' : ''),
        sub: m => `${esc(petName(s, m.pid))}${m.end && m.end < t ? ' · finished' : ''}`,
        fields: [{ k: 'pid', label: 'Pet', options: petOpts(s), blank: 'Pet…', rerender: true }, { k: 'dose', label: 'Dose', ph: '1 tablet' },
          { k: 'schedule', label: 'When', ph: 'Twice a day with food', wide: true }, { k: 'start', label: 'Start', type: 'date' }, { k: 'end', label: 'Last day', type: 'date', rerender: true }],
        foot: m => `<div class="pc-given">${u.btn('Given now', { kind: 'world', sm: true, icon: 'check', act: 'given', data: { id: m.id } })}<span class="pl-muted">${m.given.length ? `Last given ${esc(when(m.given[m.given.length - 1]))}` : 'Not given yet'}</span></div>
          ${m.given.length > 1 ? `<p class="pc-log">Before: ${m.given.slice(-6).reverse().slice(1).map(g => esc(when(g))).join(' · ')}</p>` : ''}`,
        empty: u.empty('timer', 'No medication', 'Add one when the vet prescribes it.')
      })}
      <div class="pl-list-foot">${u.btn('Add medication', { kind: 'world', sm: true, icon: 'plus', act: 'addMed', data: { pid } })}</div>`;
    },
    actions: Object.assign({ addMed(ctx, d) { const s = ctx.state; s.meds.push(med({ pid: d.pid })); ctx.focus(`[data-bind="meds.${s.meds.length - 1}.name"]`); } }, given)
  };

  /* ---------- money ---------- */
  const money = {
    id: 'money', label: 'Money', icon: 'money',
    render(ctx) {
      const s = ctx.state, d = s.ui.draft, m = ym(D.today()), rows = monthSpends(s, m).sort((a, b) => (a.date < b.date ? 1 : -1));
      return `${u.head({ eyebrow: 'Pet expenses', title: '<span data-slot="title"></span>', lede: 'Food, vet, grooming, insurance, sitters: log it in five seconds and see what each pet really costs.' })}
      ${chips(s)}
      <div data-slot="kpis"></div>
      ${u.panel('Log an expense', `<div class="pc-add">${u.input('ui.draft.amount', d.amount, { label: 'Amount', ph: '0.00', num: true })}
        ${u.select('ui.draft.pid', d.pid || (s.ui.pet !== 'all' ? s.ui.pet : ''), petOpts(s), { label: 'Pet', blank: 'Pet…' })}${u.select('ui.draft.cat', d.cat, CATS, { label: 'Category' })}
        ${u.input('ui.draft.note', d.note, { label: 'Note', ph: 'What for (optional)' })}${u.btn('Add', { kind: 'world', icon: 'plus', act: 'addSpend' })}</div>`, { icon: 'plus' })}
      <div class="pl-grid">
        ${u.panel('This month by category', '<div data-slot="cats"></div>', { icon: 'chart', cls: 'pl-6' })}
        ${u.panel('This year by pet', '<div data-slot="bypet"></div>', { icon: 'heart', cls: 'pl-6' })}
      </div>
      ${u.panel(`Expenses in ${D.fmt(`${m}-01`, { month: 'long' })}`, u.table('spends', rows, [
        { k: 'date', label: 'Date', type: 'date', w: '150px', rerender: true }, { k: 'pid', label: 'Pet', type: 'select', options: petOpts(s), blank: 'Pet…', w: '120px', rerender: true },
        { k: 'cat', label: 'Category', type: 'select', options: CATS, w: '170px', rerender: true }, { k: 'note', label: 'Note', title: true, w: '1fr', ph: 'What for' },
        { k: 'amount', label: 'Amount', num: true, w: '100px', ph: '0' }
      ], { index: x => x.__i, total: s.spends.length, what: 'expense', empty: 'Nothing logged this month.', cls: 'pc-stab' }), { icon: 'list' })}`;
    },
    slots: {
      title(ctx) { return `<em>${esc(ctx.money(sum(monthSpends(ctx.state, ym(D.today()))), { cents: false }))}</em> this month`; },
      kpis(ctx) {
        const s = ctx.state, t = D.today(), y = t.slice(0, 4), year = mine(s, s.spends).filter(x => x.date.slice(0, 4) === y), month = monthSpends(s, ym(t));
        const avg = (() => { const months = new Set(year.map(x => ym(x.date))).size; return months ? r2(sum(year) / months) : 0; })();
        return u.kpis([['This month', ctx.money(sum(month)), 'y-kpi--world', P.plural(month.length, 'expense')], ['This year', ctx.money(sum(year), { cents: false }), '', y], ['A month on average', ctx.money(avg, { cents: false }), '', 'this year']]);
      },
      cats(ctx) {
        const s = ctx.state, month = monthSpends(s, ym(D.today())), tot = sum(month);
        const rows = CATS.map(c => [c, sum(month.filter(x => x.cat === c))]).filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]);
        return rows.length ? `<ul class="pc-bars">${rows.map(([c, v]) => `<li><span>${esc(c)}</span>${u.meter(tot ? v / tot * 100 : 0, c)}<b class="y-num">${esc(ctx.money(v))}</b></li>`).join('')}</ul>` : '<p class="pl-muted">Nothing this month yet.</p>';
      },
      bypet(ctx) {
        const s = ctx.state, y = D.today().slice(0, 4), year = s.spends.filter(x => x.date.slice(0, 4) === y), tot = sum(year);
        const rows = named(s).map(p => [p.name, sum(year.filter(x => x.pid === p.id))]);
        return rows.length ? `<ul class="pc-bars">${rows.map(([n, v]) => `<li><span>${esc(n)}</span>${u.meter(tot ? v / tot * 100 : 0, n)}<b class="y-num">${esc(ctx.money(v, { cents: false }))}</b></li>`).join('')}</ul>` : '<p class="pl-muted">Add a pet first.</p>';
      }
    },
    actions: {
      addSpend(ctx) {
        const s = ctx.state, d = s.ui.draft, amt = P.num(d.amount);
        if (!(amt > 0)) { ctx.toast('Type an amount first'); ctx.focus('[data-bind="ui.draft.amount"]'); return false; }
        const pid = d.pid || (s.ui.pet !== 'all' ? s.ui.pet : (named(s)[0] || {}).id || '');
        s.spends.push(spend({ pid, cat: CATS.includes(d.cat) ? d.cat : 'Other', amount: String(r2(amt)), note: txt(d.note) }));
        s.ui.draft = { amount: '', pid: d.pid, cat: d.cat, note: '' };
        ctx.toast(`${ctx.money(amt)} · ${d.cat}`); ctx.focus('[data-bind="ui.draft.amount"]');
      }
    }
  };

  /* ---------- sitter ---------- */
  function petSheet(s, p) {
    const t = D.today(), ms = s.meds.filter(m => m.pid === p.id && P.has(m.name) && (!m.end || m.end >= t));
    const row = (l, v) => (P.has(v) ? `<div><dt>${l}</dt><dd>${esc(v)}</dd></div>` : '');
    return `<dl class="pc-dl">${row('Food', [p.food, p.amount].filter(Boolean).join(' — '))}${row('Allergies', p.allergies)}
      ${p.routine.some(r => P.has(r.text)) ? `<div><dt>Routine</dt><dd>${SLOTS.map(([k, l]) => { const x = p.routine.filter(r => r.slot === k && P.has(r.text)); return x.length ? `<b>${l}:</b> ${x.map(r => esc(r.text)).join(', ')}` : ''; }).filter(Boolean).join('<br>')}</dd></div>` : ''}
      ${ms.length ? `<div><dt>Medication</dt><dd>${ms.map(m => `<b>${esc(m.name)}</b> ${esc([m.dose, m.schedule].filter(Boolean).join(', '))}`).join('<br>')}</dd></div>` : ''}
      ${row('Good to know', p.quirks)}${row('Vet', [p.vet, p.vetPhone].filter(Boolean).join(' · '))}${row('Microchip', p.chip)}${row('Insurance', p.insurance)}</dl>`;
  }
  const sitter = {
    id: 'sitter', label: 'Sitter', icon: 'doc',
    render(ctx) {
      const s = ctx.state, st = s.sitter;
      return `${u.head({ eyebrow: 'Pet-sitter sheet', title: 'Going away? <em>Print this</em>', lede: 'Contacts and house notes here; each pet’s food, routine, meds and quirks come from their profile. Print it and leave it on the counter.' })}
      <div class="pl-row">${u.btn('Print the sitter sheet', { kind: 'world', icon: 'print', act: 'print' })}</div><div class="xm-gap"></div>
      ${u.panel('Contacts', `<div class="pl-fields">${u.field('You', 'sitter.owner', st.owner, { ph: 'Your name' })}${u.field('Your phone', 'sitter.phone', st.phone, { type: 'tel', ph: '(555) 000-0000' })}
        ${u.field('Backup contact', 'sitter.backup', st.backup, { ph: 'Neighbor, friend' })}${u.field('Backup phone', 'sitter.backupPhone', st.backupPhone, { type: 'tel', ph: '(555) 000-0000' })}
        ${u.field('Emergency vet (24/7)', 'sitter.er', st.er, { ph: 'Clinic, phone, address', cls: 'pl-wide' })}</div>`, { icon: 'user' })}
      ${u.panel('House notes', u.textarea('sitter.house', st.house, { rows: 5, label: 'House notes', ph: 'Keys, where the food and leashes are, Wi-Fi…' }), { icon: 'home' })}
      <div class="xm-people">${named(s).map(p => u.panel(p.name, petSheet(s, p), { icon: 'heart', cls: 'y-panel--flat xm-person' })).join('')}</div>`;
    },
    sheet(ctx) {
      const s = ctx.state, st = s.sitter, c = (l, v) => (P.has(v) ? `<tr><td style="width:40mm"><b>${l}</b></td><td>${esc(v)}</td></tr>` : '');
      return `<h1>Pet-sitter sheet</h1><p class="pl-sheet-meta">${named(s).map(p => esc(p.name)).join(' · ')}</p>
        <table><tbody>${c('Owner', [st.owner, st.phone].filter(Boolean).join(' · '))}${c('Backup', [st.backup, st.backupPhone].filter(Boolean).join(' · '))}${c('Emergency vet', st.er)}</tbody></table>
        ${named(s).map(p => `<h2>${esc(p.name)}${p.species ? ` · ${esc(p.species)}` : ''}</h2>${petSheet(s, p)}`).join('')}
        ${P.has(st.house) ? `<h2>House notes</h2><p style="white-space:pre-wrap">${esc(st.house)}</p>` : ''}`;
    }
  };
  today.sheet = sitter.sheet; pets.sheet = sitter.sheet;

  P.create({
    slug: 'pet-care-app', name: 'Pet Care Planner', world: 'paws', currency: true,
    welcome: 'Add your pet with food and a daily routine — Today fills in by itself.',
    pages: [today, pets, health, weight, meds, money, sitter],
    blank, sample, normalize,
    rows: { pets: () => pet({ routine: [routine('Breakfast', 'AM'), routine('Dinner', 'PM')] }), routine: () => routine('', 'AM'), care: () => care({ last: D.today() }), visits: () => visit(), weights: () => weigh(), meds: () => med(), spends: () => spend() },
    accepts: d => d && typeof d === 'object' && ('pets' in d || 'care' in d),
    about: '<p><b>Pet Care Planner</b> keeps every pet’s care in one place: a daily checklist (feeding, walks, litter, meds), profiles with food, allergies, microchip and vet, recurring care like vaccines and flea and tick with next due dates, vet visits, weight, medication with a “given” log, pet expenses and a printable pet-sitter sheet.</p>',
    disclaimer: 'Pet Care Planner is a personal record-keeping tool, not veterinary advice. Ask your vet about vaccine schedules, doses and anything that worries you.'
  });
})();
