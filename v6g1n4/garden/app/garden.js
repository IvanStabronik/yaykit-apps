/* Garden Planner App — planting calendar from your frost dates, a crop table, square-foot beds with crop rotation,
   a seed box and a garden journal with harvest totals. Yaykit planner engine, garden world (garden.css). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const FAMILIES = ['Nightshade', 'Brassica', 'Legume', 'Cucurbit', 'Allium', 'Umbellifer', 'Amaranth', 'Aster', 'Mint', 'Grass', 'Mallow', 'Other'];
  const FAM = Object.fromEntries(FAMILIES.map((f, i) => [f, i]));
  const SUN = ['Full sun', 'Part sun', 'Shade'];
  const KINDS = ['Sowed', 'Transplanted', 'Watered', 'Fed', 'Pest', 'Harvest', 'Note'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const txt = v => (v == null ? '' : String(v));
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
  const has = v => P.has(v) && isFinite(parseFloat(v));
  const r1 = n => Math.round(n * 10) / 10;

  /* general guidance: weeks before last frost to start indoors, weeks after last frost to plant out or sow (negative = before) */
  const TABLE = [
    ['Tomato', 'Nightshade', 6, 1, '', 70, 24, 'Full sun'], ['Pepper', 'Nightshade', 8, 2, '', 75, 18, 'Full sun'], ['Eggplant', 'Nightshade', 8, 2, '', 75, 24, 'Full sun'],
    ['Potato', 'Nightshade', '', '', -2, 90, 12, 'Full sun'], ['Broccoli', 'Brassica', 6, -2, '', 65, 18, 'Full sun'], ['Cabbage', 'Brassica', 6, -2, '', 70, 18, 'Full sun'],
    ['Cauliflower', 'Brassica', 6, -2, '', 70, 18, 'Full sun'], ['Kale', 'Brassica', 6, -3, -4, 55, 12, 'Part sun'], ['Brussels sprouts', 'Brassica', 6, 0, '', 100, 24, 'Full sun'],
    ['Radish', 'Brassica', '', '', -4, 25, 3, 'Full sun'], ['Turnip', 'Brassica', '', '', -3, 50, 4, 'Full sun'], ['Arugula', 'Brassica', '', '', -4, 40, 4, 'Part sun'],
    ['Lettuce', 'Aster', 5, -2, -3, 45, 6, 'Part sun'], ['Spinach', 'Amaranth', '', '', -5, 40, 4, 'Part sun'], ['Swiss chard', 'Amaranth', 4, 0, -2, 55, 9, 'Part sun'],
    ['Beet', 'Amaranth', '', '', -3, 55, 4, 'Full sun'], ['Carrot', 'Umbellifer', '', '', -3, 70, 3, 'Full sun'], ['Parsnip', 'Umbellifer', '', '', -2, 120, 4, 'Full sun'],
    ['Celery', 'Umbellifer', 10, 2, '', 120, 9, 'Full sun'], ['Parsley', 'Umbellifer', 8, 0, -2, 75, 9, 'Part sun'], ['Cilantro', 'Umbellifer', '', '', -1, 50, 6, 'Part sun'],
    ['Dill', 'Umbellifer', '', '', 1, 60, 9, 'Full sun'], ['Peas', 'Legume', '', '', -6, 60, 3, 'Full sun'], ['Green beans', 'Legume', '', '', 1, 55, 6, 'Full sun'],
    ['Pole beans', 'Legume', '', '', 1, 65, 6, 'Full sun'], ['Cucumber', 'Cucurbit', 3, 2, 2, 55, 12, 'Full sun'], ['Zucchini', 'Cucurbit', 3, 2, 2, 50, 24, 'Full sun'],
    ['Winter squash', 'Cucurbit', 3, 2, 2, 100, 36, 'Full sun'], ['Pumpkin', 'Cucurbit', 3, 2, 2, 110, 36, 'Full sun'], ['Watermelon', 'Cucurbit', 4, 2, '', 85, 36, 'Full sun'],
    ['Cantaloupe', 'Cucurbit', 4, 2, '', 85, 24, 'Full sun'], ['Sweet corn', 'Grass', '', '', 2, 80, 12, 'Full sun'], ['Onion', 'Allium', 10, -2, '', 100, 4, 'Full sun'],
    ['Leek', 'Allium', 10, -2, '', 120, 6, 'Full sun'], ['Scallions', 'Allium', '', '', -4, 60, 3, 'Full sun'], ['Chives', 'Allium', 8, 0, '', 80, 6, 'Part sun'],
    ['Basil', 'Mint', 6, 2, '', 60, 12, 'Full sun'], ['Thyme', 'Mint', 8, 1, '', 90, 12, 'Full sun'], ['Oregano', 'Mint', 8, 1, '', 90, 12, 'Full sun'],
    ['Sage', 'Mint', 8, 1, '', 90, 18, 'Full sun'], ['Mint', 'Mint', 8, 1, '', 90, 18, 'Part sun'], ['Okra', 'Mallow', 4, 3, 3, 60, 18, 'Full sun']
  ];
  const crop = o => Object.assign({ id: P.uid(), name: '', family: 'Other', indoors: '', transplant: '', sow: '', days: '', spacing: '12', sun: 'Full sun', plan: false }, o || {});
  const fromTable = (t, plan) => crop({ name: t[0], family: t[1], indoors: txt(t[2]), transplant: txt(t[3]), sow: txt(t[4]), days: txt(t[5]), spacing: txt(t[6]), sun: t[7], plan: !!plan });
  const bed = o => Object.assign({ id: P.uid(), name: '', w: '4', l: '8', sun: 'Full sun', cells: {}, history: {} }, o || {});
  const seed = o => Object.assign({ id: P.uid(), crop: '', variety: '', source: '', year: String(new Date().getFullYear()), qty: '', notes: '' }, o || {});
  const entry = o => Object.assign({ id: P.uid(), date: D.today(), crop: '', kind: 'Harvest', amount: '', note: '' }, o || {});

  function frosts() {
    const y = new Date().getFullYear(), t = D.today(), last = t > `${y}-05-10` ? `${y + 1}-05-10` : `${y}-05-10`;
    return { last, first: `${last.slice(0, 4)}-10-10` };
  }
  function blank() { const f = frosts(); return { garden: { name: '', zone: '', lastFrost: f.last, firstFrost: f.first }, crops: TABLE.map(t => fromTable(t)), beds: [], seeds: [], log: [], notes: '' }; }
  function sample() {
    const f = frosts(), Y = +f.last.slice(0, 4), L = Y - 1, cy = new Date().getFullYear();
    const plan = ['Tomato', 'Pepper', 'Basil', 'Lettuce', 'Kale', 'Peas', 'Green beans', 'Carrot', 'Cucumber', 'Zucchini', 'Onion', 'Spinach', 'Radish', 'Parsley', 'Swiss chard'];
    const crops = TABLE.map(t => fromTable(t, plan.includes(t[0])));
    const id = n => crops.find(c => c.name === n).id;
    const fill = (cells, list) => { list.forEach(([n, keys]) => keys.forEach(k => { cells[k] = id(n); })); return cells; };
    const rows = (r0, r1_, c0, c1) => { const out = []; for (let r = r0; r <= r1_; r++) for (let c = c0; c <= c1; c++) out.push(`${r}-${c}`); return out; };
    const beds = [
      bed({ name: 'Bed 1 · by the fence', w: '4', l: '8', sun: 'Full sun', cells: fill({}, [['Tomato', rows(0, 3, 0, 1)], ['Pepper', rows(4, 5, 0, 1)], ['Basil', rows(0, 3, 2, 2)], ['Onion', rows(4, 7, 2, 3)]]), history: { [L]: ['Nightshade'] } }),
      bed({ name: 'Bed 2 · middle', w: '4', l: '8', sun: 'Full sun', cells: fill({}, [['Peas', rows(0, 0, 0, 3)], ['Carrot', rows(1, 2, 0, 1)], ['Lettuce', rows(1, 2, 2, 3)], ['Spinach', rows(3, 3, 0, 3)], ['Radish', rows(4, 4, 0, 1)]]), history: { [L]: ['Nightshade', 'Mint'] } }),
      bed({ name: 'Bed 3 · back corner', w: '3', l: '6', sun: 'Full sun', cells: fill({}, [['Cucumber', rows(0, 0, 0, 2)], ['Zucchini', rows(1, 2, 0, 1)], ['Green beans', rows(3, 4, 0, 2)]]), history: { [L]: ['Brassica'] } }),
      bed({ name: 'Patio pot', w: '2', l: '2', sun: 'Part sun', cells: fill({}, [['Parsley', ['0-0', '0-1']], ['Swiss chard', ['1-0', '1-1']]]), history: {} }),
      bed({ name: 'Blue planter', w: '1', l: '1', sun: 'Part sun', cells: fill({}, [['Kale', ['0-0']]]), history: {} })
    ];
    const seeds = [seed({ crop: 'Tomato', variety: 'Sungold cherry', source: 'Seed catalog', year: String(cy), qty: '25 seeds' }),
      seed({ crop: 'Tomato', variety: 'Brandywine', source: 'Seed swap', year: String(cy - 1), qty: 'Half a packet' }),
      seed({ crop: 'Pepper', variety: 'California Wonder', source: 'Garden center', year: String(cy - 2), qty: '1 packet' }),
      seed({ crop: 'Lettuce', variety: 'Buttercrunch', source: 'Seed catalog', year: String(cy), qty: '1 packet', notes: 'Bolts in July heat' }),
      seed({ crop: 'Peas', variety: 'Sugar Snap', source: 'Garden center', year: String(cy - 1), qty: '1/2 lb' }),
      seed({ crop: 'Carrot', variety: 'Danvers', source: 'Seed catalog', year: String(cy - 2), qty: '1 packet', notes: 'Slow to sprout — keep moist' }),
      seed({ crop: 'Basil', variety: 'Genovese', source: 'Seed swap', year: String(cy - 4), qty: 'A pinch', notes: 'Test germination first' }),
      seed({ crop: 'Parsnip', variety: 'Hollow Crown', source: 'Seed swap', year: String(cy - 5), qty: '1 packet' }),
      seed({ crop: 'Zucchini', variety: 'Black Beauty', source: 'Garden center', year: String(cy - 1), qty: '10 seeds' })];
    const d = (m, day) => `${L}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const log = [
      entry({ date: d(3, 22), crop: 'Tomato', kind: 'Sowed', note: 'Indoors under lights, 12 cells' }), entry({ date: d(3, 22), crop: 'Pepper', kind: 'Sowed', note: 'Heat mat' }),
      entry({ date: d(4, 2), crop: 'Peas', kind: 'Sowed', note: 'Along the fence trellis' }), entry({ date: d(5, 18), crop: 'Tomato', kind: 'Transplanted', note: 'Bed 2, cages' }),
      entry({ date: d(6, 9), crop: 'Zucchini', kind: 'Pest', note: 'Squash bugs — picked off eggs' }), entry({ date: d(6, 20), crop: 'Lettuce', kind: 'Harvest', amount: '0.6' }),
      entry({ date: d(6, 28), crop: 'Peas', kind: 'Harvest', amount: '1.4' }), entry({ date: d(7, 6), crop: 'Zucchini', kind: 'Harvest', amount: '2.1' }),
      entry({ date: d(7, 14), crop: 'Green beans', kind: 'Harvest', amount: '1.2' }), entry({ date: d(7, 22), crop: 'Cucumber', kind: 'Harvest', amount: '2' }),
      entry({ date: d(7, 30), crop: 'Tomato', kind: 'Harvest', amount: '3.5' }), entry({ date: d(8, 4), crop: 'Zucchini', kind: 'Harvest', amount: '3.4' }),
      entry({ date: d(8, 10), crop: 'Tomato', kind: 'Fed', note: 'Compost tea' }), entry({ date: d(8, 12), crop: 'Tomato', kind: 'Harvest', amount: '4.2' }),
      entry({ date: d(8, 19), crop: 'Green beans', kind: 'Harvest', amount: '1.5' }), entry({ date: d(8, 26), crop: 'Pepper', kind: 'Harvest', amount: '1.1' }),
      entry({ date: d(9, 7), crop: 'Tomato', kind: 'Harvest', amount: '2.8' }), entry({ date: d(10, 2), crop: 'Kale', kind: 'Harvest', amount: '0.8' })];
    return { garden: { name: 'Backyard garden', zone: '6b', lastFrost: f.last, firstFrost: f.first }, crops, beds, seeds, log,
      notes: 'Tomatoes go in Bed 2 next year — rotate!\nOrder seeds by February; Sungold sells out.\nNet the brassicas before the cabbage moths arrive.' };
  }
  function normalize(s) {
    const g = s.garden && typeof s.garden === 'object' ? s.garden : {}, f = frosts();
    s.garden = { name: txt(g.name), zone: txt(g.zone), lastFrost: D.parse(g.lastFrost) ? g.lastFrost : f.last, firstFrost: D.parse(g.firstFrost) ? g.firstFrost : f.first };
    s.crops = arr(s.crops, x => crop({ id: txt(x.id) || P.uid(), name: txt(x.name), family: FAM[x.family] != null ? x.family : 'Other', indoors: txt(x.indoors), transplant: txt(x.transplant),
      sow: txt(x.sow), days: txt(x.days), spacing: txt(x.spacing), sun: SUN.includes(x.sun) ? x.sun : 'Full sun', plan: !!x.plan }));
    s.beds = arr(s.beds, x => bed({ id: txt(x.id) || P.uid(), name: txt(x.name), w: txt(x.w), l: txt(x.l), sun: SUN.includes(x.sun) ? x.sun : 'Full sun',
      cells: x.cells && typeof x.cells === 'object' ? Object.fromEntries(Object.keys(x.cells).filter(k => /^\d+-\d+$/.test(k) && x.cells[k]).map(k => [k, txt(x.cells[k])])) : {},
      history: x.history && typeof x.history === 'object' ? Object.fromEntries(Object.keys(x.history).filter(k => /^\d{4}$/.test(k)).map(k => [k, (Array.isArray(x.history[k]) ? x.history[k] : []).filter(v => FAM[v] != null)])) : {} }));
    s.seeds = arr(s.seeds, x => seed({ id: txt(x.id) || P.uid(), crop: txt(x.crop), variety: txt(x.variety), source: txt(x.source), year: txt(x.year), qty: txt(x.qty), notes: txt(x.notes) }));
    s.log = arr(s.log, x => entry({ id: txt(x.id) || P.uid(), date: D.parse(x.date) ? x.date : D.today(), crop: txt(x.crop), kind: KINDS.includes(x.kind) ? x.kind : 'Note', amount: txt(x.amount), note: txt(x.note) }));
    s.notes = txt(s.notes);
    s.ui.entry = Object.assign({ date: D.today(), crop: '', kind: 'Harvest', amount: '', note: '' }, s.ui.entry || {});
    if (typeof s.ui.pick !== 'string') s.ui.pick = '';
    return s;
  }

  /* ---------- dates ---------- */
  const wk = (iso, n) => D.add(iso, Math.round(P.num(n) * 7));
  function plan(s, c) {
    const L = s.garden.lastFrost, F = s.garden.firstFrost, out = { c };
    if (has(c.indoors)) out.indoors = wk(L, -P.num(c.indoors));
    if (has(c.indoors) || (has(c.transplant) && !has(c.sow))) out.out = wk(L, has(c.transplant) ? c.transplant : 0);
    if (has(c.sow)) out.sow = wk(L, c.sow);
    const starts = [out.out, out.sow].filter(Boolean).sort();
    if (starts.length && has(c.days)) {
      out.harvest = D.add(starts[0], Math.round(P.num(c.days)));
      out.until = [D.add(out.harvest, 35), F].sort()[0];
      out.late = out.harvest > F;
    }
    return out;
  }
  const planned = s => s.crops.filter(c => c.plan && P.has(c.name));
  function events(s) {
    const ev = [];
    planned(s).forEach(c => { const p = plan(s, c);
      if (p.indoors) ev.push([p.indoors, c, 'Start indoors']); if (p.out) ev.push([p.out, c, 'Plant out']);
      if (p.sow) ev.push([p.sow, c, 'Sow outside']); if (p.harvest && !p.late) ev.push([p.harvest, c, 'First harvest']); });
    return ev.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  }
  const famCls = f => `gp-f${FAM[f] != null ? FAM[f] : 11}`;

  /* ---------- calendar ---------- */
  const calendar = {
    id: 'calendar', label: 'Calendar', icon: 'calendar',
    render(ctx) {
      const s = ctx.state, g = s.garden, list = planned(s), Y = +g.lastFrost.slice(0, 4);
      const pct = iso => { const d = D.diff(`${Y}-01-01`, iso); return Math.max(0, Math.min(100, d / 365 * 100)); };
      const bar = (a, b, cls, label) => (a && b && b > a ? `<i class="gp-bar ${cls}" style="left:${pct(a)}%;width:${Math.max(1, pct(b) - pct(a))}%" title="${esc(label)}"></i>` : '');
      return `${u.head({ eyebrow: g.name || 'Garden planner', title: '<span data-slot="title"></span>', lede: 'Dates count from your frost dates. Change them, and every planting date moves with them.' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Your frost dates', `<div class="pl-fields">${u.field('Last spring frost', 'garden.lastFrost', g.lastFrost, { type: 'date', rerender: true })}${u.field('First fall frost', 'garden.firstFrost', g.firstFrost, { type: 'date', rerender: true })}
          ${u.field('Garden name', 'garden.name', g.name, { ph: 'Backyard garden' })}${u.field('Zone', 'garden.zone', g.zone, { ph: '6b', optional: true })}</div>
          <p class="pl-hint">Use the average dates for your town; local extension offices and seed catalogs list them.</p>`, { icon: 'edit', cls: 'pl-5' })}
        ${u.panel('Next up', '<div data-slot="next"></div>', { icon: 'check', cls: 'pl-7' })}
      </div>
      ${u.panel(`Season at a glance · ${Y}`, list.length ? `<div class="gp-time">
          <div class="gp-months">${MONTHS.map(m => `<span>${m}</span>`).join('')}</div>
          ${list.map(c => { const p = plan(s, c); return `<div class="gp-trow"><span class="gp-tname">${esc(c.name)}</span><span class="gp-track">${bar(p.indoors, p.out, 'gp-b-in', 'Indoors')}${bar(p.out || p.sow, p.harvest, 'gp-b-grow', 'Growing')}${bar(p.harvest, p.until, 'gp-b-har', 'Harvest')}<i class="gp-frost" style="left:${pct(g.lastFrost)}%"></i><i class="gp-frost" style="left:${pct(g.firstFrost)}%"></i></span></div>`; }).join('')}
          <p class="gp-key"><span><i class="gp-b-in"></i>Indoors</span><span><i class="gp-b-grow"></i>Growing</span><span><i class="gp-b-har"></i>Harvest</span><span><i class="gp-frostkey"></i>Frost dates</span></p></div>`
        : u.empty('calendar', 'Nothing planned yet', 'Add crops to your plan on the Crops page.', u.btn('Open crops', { kind: 'world', icon: 'next', act: 'go', data: { page: 'crops' } })), { icon: 'chart' })}
      ${list.length ? u.panel('Planting dates', `<div class="gp-dates" role="table">
          <div class="gp-drow gp-dhead" role="row"><span>Crop</span><span>Start indoors</span><span>Plant out</span><span>Sow outside</span><span>First harvest</span></div>
          ${list.map(c => { const p = plan(s, c), cell = (k, lab, v) => `<span role="cell" data-label="${lab}">${v ? `<span class="gp-d" data-k="${k}" data-iso="${v}">${esc(D.short(v))}</span>` : '<span class="pl-muted">—</span>'}</span>`;
            return `<div class="gp-drow" role="row" data-crop="${esc(c.id)}"><span role="cell" class="gp-dname"><i class="gp-dot ${famCls(c.family)}"></i>${esc(c.name)}</span>${cell('in', 'Start indoors', p.indoors)}${cell('out', 'Plant out', p.out)}${cell('sow', 'Sow outside', p.sow)}
              <span role="cell" data-label="First harvest">${p.harvest ? `<span class="gp-d" data-k="har" data-iso="${p.harvest}">${esc(D.short(p.harvest))}</span>${p.late ? ` ${u.pill('after frost', 'bad')}` : ''}` : '<span class="pl-muted">—</span>'}</span></div>`; }).join('')}</div>`, { icon: 'list' }) : ''}
      ${u.notes('notes', s.notes, { rows: 4, title: 'Notes', ph: 'What to change next year, seed orders, pests to watch…' })}`;
    },
    slots: {
      title(ctx) {
        const s = ctx.state, n = D.diff(D.today(), s.garden.lastFrost);
        return n > 0 ? `<em>${Math.ceil(n / 7)}</em> weeks to last frost` : D.today() < s.garden.firstFrost ? 'Growing <em>season</em>' : 'Season <em>done</em>';
      },
      kpis(ctx) {
        const s = ctx.state, list = planned(s), ev = events(s).filter(e => e[0] >= D.today()), first = ev[0];
        const sq = s.beds.reduce((a, b) => a + Object.keys(b.cells).length, 0), all = s.beds.reduce((a, b) => a + Math.max(1, Math.round(P.num(b.w))) * Math.max(1, Math.round(P.num(b.l))), 0);
        return u.kpis([['Crops planned', String(list.length), 'y-kpi--world'], ['Next job', first ? esc(D.short(first[0])) : '—', '', first ? `${esc(first[2])} · ${esc(first[1].name)}` : ''],
          ['Last frost', esc(D.short(s.garden.lastFrost)), '', `first fall frost ${esc(D.short(s.garden.firstFrost))}`], ['Squares planted', `${sq}<small>/${all}</small>`, '', P.plural(s.beds.length, 'bed')]]);
      },
      next(ctx) {
        const s = ctx.state, t = D.today(), wkEnd = D.add(t, 7), ev = events(s).filter(e => e[0] >= t).slice(0, 7);
        if (!ev.length) return '<p class="pl-muted">Nothing coming up. Add crops to your plan, or check your frost dates.</p>';
        return `<ul class="gp-next">${ev.map(([d, c, w]) => `<li><span class="gp-ndate y-num">${esc(D.short(d))}</span><span><b>${esc(w)}</b> · ${esc(c.name)}</span>${d <= wkEnd ? u.pill('this week', 'world') : `<span class="pl-muted">${esc(D.rel ? D.rel(d) : '')}</span>`}</li>`).join('')}</ul>`;
      }
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>${esc(s.garden.name || 'Garden')} · planting dates</h1><p class="pl-sheet-meta">Last frost ${esc(D.long(s.garden.lastFrost))} · first fall frost ${esc(D.long(s.garden.firstFrost))}</p>
        <table><thead><tr><th>Crop</th><th>Start indoors</th><th>Plant out</th><th>Sow outside</th><th>First harvest</th></tr></thead><tbody>${planned(s).map(c => { const p = plan(s, c); return `<tr><td><b>${esc(c.name)}</b></td><td>${p.indoors ? esc(D.short(p.indoors)) : ''}</td><td>${p.out ? esc(D.short(p.out)) : ''}</td><td>${p.sow ? esc(D.short(p.sow)) : ''}</td><td>${p.harvest ? esc(D.short(p.harvest)) : ''}</td></tr>`; }).join('')}</tbody></table>`;
    }
  };

  /* ---------- crops ---------- */
  const crops = {
    id: 'crops', label: 'Crops', icon: 'list',
    render(ctx) {
      const s = ctx.state, f = s.ui.cf === 'plan' ? 'plan' : 'all', rows = s.crops.map((c, i) => Object.assign({ __i: i }, c)).filter(c => f === 'all' || c.plan);
      return `${u.head({ eyebrow: 'Crop table', title: `<em>${planned(s).length}</em> crops in your plan`, lede: 'Weeks are counted from your last spring frost: start indoors that many weeks before, plant out or sow that many weeks after (a minus means before). The numbers are general guidance — change them to match your seed packets.' })}
      ${u.panel('', `<div class="pl-row gp-ctools">${u.chips('ui.cf', f, [['all', 'All crops', s.crops.length], ['plan', 'My plan', planned(s).length]], 'Show crops')}</div>
        ${u.table('crops', rows, [
          { k: 'plan', label: 'Plan', type: 'check', w: '58px', rerender: true },
          { k: 'name', label: 'Crop', title: true, w: '1.3fr', ph: 'Crop' },
          { k: 'family', label: 'Family', type: 'select', options: FAMILIES, w: '128px', rerender: true },
          { k: 'indoors', label: 'Indoors (wk before)', num: true, w: '96px', ph: '—', rerender: true },
          { k: 'transplant', label: 'Plant out (wk)', num: true, w: '90px', ph: '—', rerender: true },
          { k: 'sow', label: 'Sow (wk)', num: true, w: '80px', ph: '—', rerender: true },
          { k: 'days', label: 'Days', num: true, w: '72px', ph: '60' },
          { k: 'spacing', label: 'Spacing (in)', num: true, w: '88px', ph: '12' },
          { k: 'sun', label: 'Sun', type: 'select', options: SUN, w: '116px' }
        ], { index: c => c.__i, total: s.crops.length, what: 'crop', add: 'Add crop', tpl: 'crops', cls: 'gp-ctab', rowClass: c => (c.plan ? 'is-plan' : '') })}`, { icon: 'list' })}`;
    }
  };

  /* ---------- beds ---------- */
  const perSq = sp => { const x = Math.max(1, P.num(sp) || 12); return x <= 12 ? Math.pow(Math.floor(12 / x), 2) : 1 / Math.pow(Math.ceil(x / 12), 2); };
  function bedStats(s, b) {
    const by = {};
    Object.values(b.cells).forEach(id => { by[id] = (by[id] || 0) + 1; });
    return Object.keys(by).map(id => { const c = s.crops.find(x => x.id === id); if (!c) return null; const k = perSq(c.spacing); return { c, n: by[id], plants: k >= 1 ? by[id] * k : Math.max(1, Math.floor(by[id] * k)), k }; }).filter(Boolean);
  }
  const famsIn = (s, b) => [...new Set(bedStats(s, b).map(x => x.c.family))];
  const beds = {
    id: 'beds', label: 'Beds', icon: 'grid',
    render(ctx) {
      const s = ctx.state, pick = s.ui.pick, Y = +s.garden.lastFrost.slice(0, 4), L = Y - 1, list = planned(s);
      return `${u.head({ eyebrow: 'Square-foot beds', title: 'Plan the <em>beds</em>', lede: `Pick a crop, then tap the squares it goes in. Each square is one foot. Tick what grew in each bed in ${L} and the app warns you about repeats.` })}
      <div class="gp-pick" role="group" aria-label="Crop to plant">${list.map(c => `<button type="button" class="y-chip pl-chip gp-pchip ${famCls(c.family)}${pick === c.id ? ' is-on' : ''}" aria-pressed="${pick === c.id}" data-act="set" data-bind="ui.pick" data-value="${esc(c.id)}">${esc(c.name)}</button>`).join('')}
        <button type="button" class="y-chip pl-chip${pick === '' ? ' is-on' : ''}" aria-pressed="${pick === ''}" data-act="set" data-bind="ui.pick" data-value="">${I('close')} Clear a square</button></div>
      ${list.length ? '' : u.banner('info', 'Add crops to your plan on the Crops page — they show up here to place.')}
      <div class="gp-beds">${s.beds.map((b, i) => {
        const W = Math.min(12, Math.max(1, Math.round(P.num(b.w)) || 1)), H = Math.min(16, Math.max(1, Math.round(P.num(b.l)) || 1)), st = bedStats(s, b), now = famsIn(s, b), prev = b.history[L] || [];
        const clash = now.filter(f => prev.includes(f));
        return u.panel(b.name || 'Bed', `<div class="pl-fields gp-bfields">${u.field('Name', `beds.${i}.name`, b.name, { ph: 'Bed 1' })}${u.field('Width (ft)', `beds.${i}.w`, b.w, { num: true, rerender: true })}${u.field('Length (ft)', `beds.${i}.l`, b.l, { num: true, rerender: true })}${u.field('Sun', `beds.${i}.sun`, b.sun, { options: SUN })}</div>
          ${clash.length ? u.banner('warn', `<b>Rotation:</b> ${esc(clash.join(', '))} grew here in ${L} too. Move ${clash.length > 1 ? 'them' : 'it'} to another bed to cut down on pests and disease.`) : ''}
          <div class="gp-gridwrap"><div class="gp-grid" style="--cols:${W}">${Array.from({ length: W * H }, (_, n) => { const k = `${Math.floor(n / W)}-${n % W}`, c = s.crops.find(x => x.id === b.cells[k]);
            return `<button type="button" class="gp-cell${c ? ` is-set ${famCls(c.family)}` : ''}" data-act="cell" data-b="${i}" data-k="${k}" aria-label="${esc(`Square ${n + 1}${c ? `: ${c.name}` : ': empty'}`)}" title="${esc(c ? c.name : 'Empty')}">${c ? esc(c.name.slice(0, 3)) : '<span class="gp-plus" aria-hidden="true">+</span>'}</button>`; }).join('')}</div></div>
          ${st.length ? `<ul class="gp-bsum">${st.map(x => `<li><i class="gp-dot ${famCls(x.c.family)}"></i><b>${esc(x.c.name)}</b><span class="pl-muted">${P.plural(x.n, 'square')} · ${x.k >= 1 ? P.plural(x.plants, 'plant') : `about ${x.plants} ${x.plants === 1 ? 'plant' : 'plants'} (1 per ${Math.round(1 / x.k)} squares)`}</span></li>`).join('')}</ul>` : '<p class="pl-muted">Empty. Pick a crop above and tap squares.</p>'}
          <div class="gp-hist"><span class="y-label">Grew here in ${L}</span><div class="gp-hchips">${FAMILIES.slice(0, 11).map(f => `<button type="button" class="y-chip pl-chip gp-hchip${prev.includes(f) ? ' is-on' : ''}" aria-pressed="${prev.includes(f)}" data-act="hist" data-b="${i}" data-f="${f}">${esc(f)}</button>`).join('')}</div></div>`,
          { icon: 'grid', cls: 'y-panel--flat gp-bed', actions: `${u.pill(`${W} × ${H} ft`, 'world')}${u.rowTools('beds', i, s.beds.length, { what: 'bed', label: b.name })}` });
      }).join('')}</div>
      <div class="pl-list-foot">${u.add('Add bed or container', 'beds', { kind: 'world' })}</div>`;
    },
    actions: {
      cell(ctx, d) { const s = ctx.state, b = s.beds[+d.b]; if (!b) return false; if (s.ui.pick && b.cells[d.k] !== s.ui.pick) b.cells[d.k] = s.ui.pick; else delete b.cells[d.k]; },
      hist(ctx, d) { const s = ctx.state, b = s.beds[+d.b], L = +s.garden.lastFrost.slice(0, 4) - 1; if (!b) return false; const h = b.history[L] = b.history[L] || []; const i = h.indexOf(d.f); if (i >= 0) h.splice(i, 1); else h.push(d.f); }
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Garden beds</h1>${s.beds.map(b => { const W = Math.min(12, Math.max(1, Math.round(P.num(b.w)) || 1)), H = Math.min(16, Math.max(1, Math.round(P.num(b.l)) || 1));
        return `<h2>${esc(b.name || 'Bed')} · ${W} × ${H} ft</h2><table style="width:auto"><tbody>${Array.from({ length: H }, (_, r) => `<tr>${Array.from({ length: W }, (_, c) => { const cr = s.crops.find(x => x.id === b.cells[`${r}-${c}`]); return `<td style="width:18mm;height:12mm;text-align:center;border:1px solid #999">${cr ? esc(cr.name) : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`; }).join('')}`;
    }
  };

  /* ---------- seeds ---------- */
  const seedAge = x => new Date().getFullYear() - Math.round(P.num(x.year));
  const seeds = {
    id: 'seeds', label: 'Seeds', icon: 'star',
    badge: ctx => ctx.state.seeds.filter(x => P.has(x.crop) && has(x.year) && seedAge(x) > 3).length || '',
    render(ctx) {
      const s = ctx.state, old = s.seeds.filter(x => P.has(x.crop) && has(x.year) && seedAge(x) > 3).length;
      return `${u.head({ eyebrow: 'Seed box', title: `<em>${s.seeds.filter(x => P.has(x.crop)).length}</em> seed packets`, lede: 'What you have, from where and how old. Packets older than three years are flagged — sow a few on a damp paper towel first to check they still sprout.' })}
      ${old ? u.banner('warn', `${P.plural(old, 'packet')} older than three years.`) : ''}
      ${u.panel('', `${u.quickAdd('seeds', { key: 'crop', ph: 'Add a seed packet — type the crop and press Enter', label: 'Add a seed packet', kind: 'world' })}<div class="xm-gap"></div>
        ${u.table('seeds', s.seeds, [
          { k: 'crop', label: 'Crop', title: true, w: '1fr', ph: 'Crop' }, { k: 'variety', label: 'Variety', w: '1.2fr', ph: 'Variety' },
          { k: 'source', label: 'From', w: '1fr', ph: 'Where you got it' }, { k: 'year', label: 'Packed for', num: true, w: '96px', ph: 'Year', rerender: true },
          { label: 'Age', w: '120px', html: x => `<span data-slot="age" data-arg="${esc(x.id)}"></span>` },
          { k: 'qty', label: 'Left', w: '110px', ph: '1 packet' }, { k: 'notes', label: 'Notes', w: '1.2fr', ph: 'Germination, flavor…' }
        ], { what: 'seed packet', empty: 'Type a crop above and press Enter.', cls: 'gp-stab' })}`, { icon: 'star' })}`;
    },
    slots: {
      age(ctx, id) { const x = ctx.state.seeds.find(y => y.id === id); if (!x || !has(x.year)) return ''; const a = seedAge(x);
        return a > 3 ? `<span class="pl-pill pl-pill--bad gp-old">${a} yrs · test first</span>` : `<span class="pl-muted">${a <= 0 ? 'this year' : P.plural(a, 'yr')}</span>`; }
    },
    sheet(ctx) {
      return `<h1>Seed box</h1><table><thead><tr><th>Crop</th><th>Variety</th><th>From</th><th>Year</th><th>Left</th><th>Notes</th></tr></thead><tbody>${ctx.state.seeds.filter(x => P.has(x.crop)).map(x => `<tr><td><b>${esc(x.crop)}</b></td><td>${esc(x.variety)}</td><td>${esc(x.source)}</td><td>${esc(x.year)}</td><td>${esc(x.qty)}</td><td>${esc(x.notes)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- journal ---------- */
  const years = s => [...new Set(s.log.map(x => x.date.slice(0, 4)))].sort().reverse();
  const jy = s => (years(s).includes(s.ui.jy) ? s.ui.jy : years(s)[0] || String(new Date().getFullYear()));
  const key = n => txt(n).trim().toLowerCase();
  function totals(s, y) {
    const m = {};
    s.log.filter(x => x.kind === 'Harvest' && x.date.startsWith(y) && P.has(x.crop)).forEach(x => { const k = key(x.crop); m[k] = m[k] || { name: x.crop.trim(), lb: 0, n: 0 }; m[k].lb += P.num(x.amount); m[k].n++; });
    return Object.values(m).sort((a, b) => b.lb - a.lb);
  }
  const journal = {
    id: 'journal', label: 'Journal', icon: 'edit',
    render(ctx) {
      const s = ctx.state, y = jy(s), e = s.ui.entry, tot = totals(s, y), max = Math.max(1, ...tot.map(x => x.lb));
      const rows = s.log.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.date.startsWith(y)).sort((a, b) => (a.date < b.date ? 1 : -1));
      return `${u.head({ eyebrow: 'Garden journal', title: `<em>${r1(tot.reduce((a, x) => a + x.lb, 0))} lb</em> harvested in ${y}`, lede: 'Note what you sowed, planted, fed and fought — and weigh the harvest. Next spring you’ll know what worked.' })}
      ${years(s).length > 1 ? `<div class="gp-years">${u.chips('ui.jy', y, years(s).map(v => [v, v]), 'Season')}</div>` : ''}
      ${u.panel('Add to the journal', `<div class="gp-jform">${u.input('ui.entry.date', e.date, { type: 'date', label: 'Date' })}
        ${u.input('ui.entry.crop', e.crop, { ph: 'Crop', label: 'Crop', list: 'gpCrops' })}<datalist id="gpCrops">${s.crops.filter(c => P.has(c.name)).map(c => `<option value="${esc(c.name)}"></option>`).join('')}</datalist>
        ${u.select('ui.entry.kind', e.kind, KINDS, { label: 'What happened', rerender: true })}
        ${e.kind === 'Harvest' ? u.input('ui.entry.amount', e.amount, { num: true, ph: 'lb', label: 'Pounds harvested' }) : ''}
        ${u.input('ui.entry.note', e.note, { ph: 'Note (optional)', label: 'Note' })}
        ${u.btn('Add', { kind: 'world', icon: 'plus', act: 'addEntry' })}</div>`, { icon: 'plus' })}
      <div class="pl-grid">
        ${u.panel(`Harvest by crop · ${y}`, tot.length ? `<ul class="gp-tot">${tot.map(x => `<li data-crop="${esc(key(x.name))}"><span class="gp-tname">${esc(x.name)}</span><span class="gp-ttrack"><i style="width:${x.lb / max * 100}%"></i></span><b class="y-num gp-tlb">${r1(x.lb)} lb</b></li>`).join('')}</ul>` : '<p class="pl-muted">Weigh a harvest and add it above.</p>', { icon: 'chart' })}
        ${u.panel(`Entries · ${y}`, rows.length ? u.table('log', rows, [
          { k: 'date', label: 'Date', type: 'date', w: '150px', rerender: true }, { k: 'crop', label: 'Crop', title: true, w: '1fr', ph: 'Crop' },
          { k: 'kind', label: 'What', type: 'select', options: KINDS, w: '130px', rerender: true }, { k: 'amount', label: 'lb', num: true, w: '70px', ph: '—' },
          { k: 'note', label: 'Note', w: '1.2fr', ph: 'Note' }
        ], { index: x => x.__i, total: s.log.length, what: 'entry', cls: 'gp-ltab' }) : '<p class="pl-muted">No entries this season.</p>', { icon: 'list' })}
      </div>`;
    },
    actions: {
      addEntry(ctx) {
        const s = ctx.state, e = s.ui.entry;
        if (!P.has(e.crop) && !P.has(e.note)) { ctx.toast('Type a crop or a note first'); ctx.focus('[data-bind="ui.entry.crop"]'); return false; }
        s.log.push(entry({ date: D.parse(e.date) ? e.date : D.today(), crop: txt(e.crop).trim(), kind: e.kind, amount: e.kind === 'Harvest' ? txt(e.amount) : '', note: txt(e.note) }));
        s.ui.jy = (D.parse(e.date) ? e.date : D.today()).slice(0, 4);
        s.ui.entry = { date: e.date, crop: '', kind: e.kind, amount: '', note: '' };
        ctx.toast(e.kind === 'Harvest' && P.num(e.amount) ? `${r1(P.num(e.amount))} lb of ${e.crop} — nice` : 'Added');
      }
    },
    sheet(ctx) {
      const s = ctx.state, y = jy(s);
      return `<h1>Garden journal ${esc(y)}</h1><h2>Harvest by crop</h2><table><tbody>${totals(s, y).map(x => `<tr><td><b>${esc(x.name)}</b></td><td>${r1(x.lb)} lb</td><td>${P.plural(x.n, 'picking')}</td></tr>`).join('')}</tbody></table>
        <h2>Entries</h2><table><tbody>${s.log.filter(x => x.date.startsWith(y)).sort((a, b) => (a.date < b.date ? -1 : 1)).map(x => `<tr><td>${esc(D.short(x.date))}</td><td>${esc(x.kind)}</td><td>${esc(x.crop)}</td><td>${x.amount ? `${esc(x.amount)} lb` : ''}</td><td>${esc(x.note)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  P.create({
    slug: 'garden-planner-app', name: 'Garden Planner', world: 'garden',
    welcome: 'Type your frost dates, tick the crops you want to grow, then place them in your beds.',
    pages: [calendar, crops, beds, seeds, journal],
    blank, sample, normalize,
    rows: { crops: () => crop({ plan: true }), beds: () => bed({ name: 'New bed' }), seeds: () => seed(), log: () => entry() },
    about: '<p><b>Garden Planner</b> plans a vegetable garden from your frost dates: when to start seeds indoors, plant out, sow and expect the first harvest for each crop; a crop table you can edit; square-foot beds with a crop rotation warning; a seed box that flags old packets; and a garden journal with harvest totals.</p>',
    disclaimer: 'Garden Planner gives general estimates. Planting dates depend on your local climate, the variety and the year — check your seed packets and local guidance.'
  });
})();
