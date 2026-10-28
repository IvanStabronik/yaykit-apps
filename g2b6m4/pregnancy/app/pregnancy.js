/* Pregnancy Planner App — week by week from the due date, appointments with questions, a daily symptom log, a kick counter and
   contraction timer, the hospital bag and baby prep (to-dos, names, gear budget). Yaykit planner engine, bloom world (pregnancy.css). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const TYPES = ['OB checkup', 'Ultrasound', 'Labs', 'Glucose test', 'Specialist', 'Class', 'Other'];
  const SYMPTOMS = ['Nausea', 'Tired', 'Heartburn', 'Back pain', 'Headache', 'Swelling', 'Cramps', 'Cravings', 'Trouble sleeping', 'Moody'];
  const MOODS = [['1', 'Rough'], ['2', 'Low'], ['3', 'OK'], ['4', 'Good'], ['5', 'Great']];
  const MOOD = Object.fromEntries(MOODS);
  const WHO = ['Mom', 'Baby', 'Partner'];
  const KINDS = ['Girl', 'Boy', 'Either'];
  const TRI = [['1', 'First trimester'], ['2', 'Second trimester'], ['3', 'Third trimester']];
  /* about the size of… — common comparisons, weeks 4–40 */
  const SIZE = { 4: 'a poppy seed', 5: 'a sesame seed', 6: 'a lentil', 7: 'a blueberry', 8: 'a raspberry', 9: 'a cherry', 10: 'a strawberry', 11: 'a lime', 12: 'a plum',
    13: 'a lemon', 14: 'a peach', 15: 'an apple', 16: 'an avocado', 17: 'a pear', 18: 'a bell pepper', 19: 'a mango', 20: 'a banana', 21: 'a carrot', 22: 'a papaya',
    23: 'a grapefruit', 24: 'an ear of corn', 25: 'a cauliflower', 26: 'a head of lettuce', 27: 'a head of cabbage', 28: 'an eggplant', 29: 'a butternut squash',
    30: 'a large cucumber', 31: 'a coconut', 32: 'a jicama', 33: 'a pineapple', 34: 'a cantaloupe', 35: 'a honeydew melon', 36: 'a head of romaine', 37: 'a bunch of Swiss chard',
    38: 'a leek', 39: 'a small watermelon', 40: 'a small pumpkin' };
  const TIPS = [
    [0, 3, ['Set your due date or the first day of your last period above.']],
    [4, 8, ['Book your first prenatal appointment.', 'Start a running list of questions for your provider.', 'Rest when you can — the first weeks can be tiring.']],
    [9, 13, ['Ask your provider which screening tests are offered and when.', 'Think about when and how you want to share the news.', 'Keep a water bottle where you can see it.']],
    [14, 18, ['Many people have more energy now — a good time for bigger to-dos.', 'Look into childbirth classes.', 'Start a baby names list together.']],
    [19, 23, ['The anatomy scan often happens around now — write down your questions.', 'Begin a baby gear list and a rough budget.', 'First flutters? Note them — fun to look back on.']],
    [24, 27, ['Ask about the glucose test and when to schedule it.', 'Check your parental leave paperwork at work.', 'Notice when your baby is most active.']],
    [28, 31, ['Ask your provider about counting kicks.', 'Tour the hospital or birth center if they offer it.', 'Choose a pediatrician.']],
    [32, 35, ['Start packing your hospital bag.', 'Install the car seat and have it checked.', 'Write down your birth preferences to talk over with your provider.']],
    [36, 40, ['Keep the bag by the door and your phone charged.', 'Know the route and who to call when labor starts.', 'Rest, freeze a few meals, and say yes to help.']],
    [41, 45, ['Talk with your provider about the plan after your due date.']]
  ];
  const BAG = {
    Mom: ['Photo ID + insurance card', 'Birth preferences copy', 'Phone charger, long cable', 'Comfy robe', 'Nursing bra', 'Loose going-home outfit', 'Socks with grip', 'Toiletries + lip balm', 'Hair ties', 'Snacks', 'Maternity pads', 'Glasses or contacts'],
    Baby: ['Car seat, installed', 'Going-home outfit', 'Swaddle blanket', 'Hat + socks', 'Newborn diapers + wipes', 'Burp cloths'],
    Partner: ['Change of clothes', 'Snacks + water bottle', 'Phone charger', 'Pillow + blanket', 'Cash or card for parking', 'Toiletries']
  };
  const PREP = [
    ['1', 'Choose a provider and book the first visit'], ['1', 'Check what your insurance covers for prenatal care and birth'], ['1', 'Start a pregnancy budget'],
    ['2', 'Sign up for childbirth classes'], ['2', 'Tell your employer and check the leave policy'], ['2', 'Start the baby gear list'], ['2', 'Plan the nursery'], ['2', 'Shortlist baby names'],
    ['3', 'Install the car seat and have it checked'], ['3', 'Choose a pediatrician'], ['3', 'Pack the hospital bag'], ['3', 'Pre-register at the hospital or birth center'],
    ['3', 'Wash baby clothes and bedding'], ['3', 'Freeze a few meals'], ['3', 'Plan who watches pets or older kids']
  ];
  const txt = v => (v == null ? '' : String(v));
  const pad = n => String(n).padStart(2, '0');
  const r2 = n => Math.round(n * 100) / 100;
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
  const ms = v => { const n = Math.round(Number(v)); return isFinite(n) && n > 0 ? n : 0; };

  const visit = o => Object.assign({ id: P.uid(), what: '', date: '', time: '', type: 'OB checkup', where: '', questions: '', notes: '' }, o || {});
  const kick = o => Object.assign({ id: P.uid(), start: 0, end: 0, count: 0 }, o || {});
  const ctr = o => Object.assign({ id: P.uid(), start: 0, end: 0 }, o || {});
  const item = (who, text, done) => ({ id: P.uid(), who: WHO.includes(who) ? who : 'Mom', text: text || '', done: !!done });
  const todo = (tri, text, done) => ({ id: P.uid(), tri: ['1', '2', '3'].includes(String(tri)) ? String(tri) : '2', text: text || '', done: !!done });
  const name = o => Object.assign({ id: P.uid(), name: '', kind: 'Either', stars: '0', note: '' }, o || {});
  const gear = o => Object.assign({ id: P.uid(), item: '', planned: '', spent: '', got: false }, o || {});
  const dayRec = o => { o = o || {}; return { symptoms: (Array.isArray(o.symptoms) ? o.symptoms : []).filter(x => SYMPTOMS.includes(x)), mood: MOOD[o.mood] ? String(o.mood) : '',
    sleep: txt(o.sleep), water: String(Math.max(0, Math.min(20, Math.round(P.num(o.water)) || 0))), weight: txt(o.weight), bp: txt(o.bp), notes: txt(o.notes) }; };
  const empty = d => !d.symptoms.length && !d.mood && !P.has(d.sleep) && !+d.water && !P.has(d.weight) && !P.has(d.bp) && !P.has(d.notes);

  function blank() {
    return { preg: { mode: 'due', due: '', lmp: '', cycle: '28', baby: '', unit: 'lb' }, visits: [], days: {}, kicks: [], kickRun: null, ctrs: [],
      bag: [], prep: PREP.map(([t, x]) => todo(t, x)), names: [], gear: [], notes: '' };
  }
  function sample() {
    const t = D.today(), due = D.add(t, 112);   // 16 weeks out → week 24
    const at = (iso, h, m) => { const d = D.parse(iso); d.setHours(h, m, 0, 0); return d.getTime(); };
    const days = {};
    const sy = [['Tired', 'Back pain'], ['Heartburn'], [], ['Back pain', 'Trouble sleeping'], ['Cravings'], ['Tired'], ['Heartburn', 'Swelling'], [], ['Headache'], ['Tired', 'Cravings']];
    const notes = ['Felt lots of kicks after dinner.', '', 'Long walk, felt great.', 'Slept badly — pillow between the knees helped.', 'Craving mango every day.', '', 'Ankles a bit puffy after work.', '', 'Drank more water, headache gone by lunch.', ''];
    for (let i = 0; i < 10; i++) days[D.add(t, -i)] = dayRec({ symptoms: sy[i], mood: String([4, 3, 5, 3, 4, 4, 3, 5, 3, 4][i]), sleep: String([7, 6.5, 8, 5.5, 7, 7.5, 6, 8, 6.5, 7][i]),
      water: String([6, 5, 8, 4, 7, 6, 5, 8, 6, 5][i]), weight: i % 3 ? '' : String(r2(153.4 - i * 0.2)), bp: i === 4 ? '112/70' : '', notes: notes[i] });
    const k = (n, h, m, mins) => kick({ start: at(D.add(t, -n), h, m), end: at(D.add(t, -n), h, m) + mins * 60000, count: 10 });
    const c0 = at(D.add(t, -2), 19, 10), offs = [0, 14, 31, 45, 63], durs = [35, 40, 30, 45, 38];
    return {
      preg: { mode: 'due', due, lmp: '', cycle: '28', baby: 'Baby Bean', unit: 'lb' },
      visits: [
        visit({ what: 'First prenatal visit', date: D.add(t, -112), time: '09:30', type: 'OB checkup', where: 'Dr. Ellis, Maple Women’s Health', questions: 'Which vitamins?\nWhat can I take for headaches?', notes: 'Heartbeat heard! Next visit in 4 weeks.' }),
        visit({ what: '12-week scan + labs', date: D.add(t, -84), time: '10:15', type: 'Ultrasound', where: 'Imaging center, 2nd floor', notes: 'All looked good. Photos on the fridge.' }),
        visit({ what: 'Anatomy scan', date: D.add(t, -28), time: '13:00', type: 'Ultrasound', where: 'Imaging center', questions: 'Can we find out the sex?\nIs the placenta position OK?', notes: 'Everything measuring on track.' }),
        visit({ what: 'Glucose test', date: D.add(t, 4), time: '08:00', type: 'Glucose test', where: 'Lab at Maple Women’s Health', questions: 'Do I need to fast?\nHow long does it take?' }),
        visit({ what: 'Monthly checkup', date: D.add(t, 25), time: '11:30', type: 'OB checkup', where: 'Dr. Ellis', questions: 'When should we tour the hospital?\nWhen should I start counting kicks?' })
      ],
      days,
      kicks: [k(1, 20, 30, 18), k(2, 21, 0, 25), k(4, 20, 45, 14), k(6, 19, 50, 31)],
      kickRun: null,
      ctrs: offs.map((o, i) => ctr({ start: c0 + o * 60000, end: c0 + o * 60000 + durs[i] * 1000 })),
      bag: WHO.flatMap(w => BAG[w].slice(0, Math.ceil(BAG[w].length * 0.6)).map((x, i) => item(w, x, i % 2 === 0))),
      prep: PREP.map(([tr, x], i) => todo(tr, x, tr === '1' || (tr === '2' && i < 6))),
      names: [name({ name: 'Nora', kind: 'Girl', stars: '5', note: 'Grandma’s middle name' }), name({ name: 'Olivia', kind: 'Girl', stars: '3' }), name({ name: 'Theo', kind: 'Boy', stars: '4' }),
        name({ name: 'Jonah', kind: 'Boy', stars: '3', note: 'Sam’s pick' }), name({ name: 'Rowan', kind: 'Either', stars: '5' })],
      gear: [gear({ item: 'Car seat', planned: '220', spent: '' }), gear({ item: 'Crib + mattress', planned: '300', spent: '289', got: true }), gear({ item: 'Stroller', planned: '350' }),
        gear({ item: 'Baby monitor', planned: '90' }), gear({ item: 'Diapers + wipes stock-up', planned: '60', spent: '42', got: true }), gear({ item: 'Changing pad + covers', planned: '45', spent: '38', got: true })],
      notes: 'Hospital: St. Mary’s, enter through Labor & Delivery after 8 pm.\n\nDr. Ellis office: (555) 210-4400 · after hours line in the welcome packet.'
    };
  }
  function normalize(s) {
    const p = s.preg && typeof s.preg === 'object' ? s.preg : {};
    s.preg = { mode: p.mode === 'lmp' ? 'lmp' : 'due', due: D.parse(p.due) ? p.due : '', lmp: D.parse(p.lmp) ? p.lmp : '', cycle: txt(p.cycle) || '28', baby: txt(p.baby), unit: p.unit === 'kg' ? 'kg' : 'lb' };
    s.visits = arr(s.visits, x => visit({ id: txt(x.id) || P.uid(), what: txt(x.what), date: D.parse(x.date) ? x.date : '', time: txt(x.time), type: TYPES.includes(x.type) ? x.type : 'Other', where: txt(x.where), questions: txt(x.questions), notes: txt(x.notes) }));
    const days = s.days && typeof s.days === 'object' ? s.days : {};
    s.days = Object.fromEntries(Object.keys(days).filter(k => D.parse(k) && days[k] && typeof days[k] === 'object').map(k => [k, dayRec(days[k])]));
    s.kicks = arr(s.kicks, x => kick({ id: txt(x.id) || P.uid(), start: ms(x.start), end: ms(x.end), count: Math.max(0, Math.round(P.num(x.count))) })).filter(x => x.start);
    const kr = s.kickRun && typeof s.kickRun === 'object' ? s.kickRun : null;
    s.kickRun = kr && ms(kr.start) ? { start: ms(kr.start), count: Math.max(0, Math.min(10, Math.round(P.num(kr.count)))) } : null;
    s.ctrs = arr(s.ctrs, x => ctr({ id: txt(x.id) || P.uid(), start: ms(x.start), end: ms(x.end) })).filter(x => x.start).sort((a, b) => a.start - b.start);
    s.bag = arr(s.bag, x => Object.assign(item(x.who, txt(x.text), x.done), { id: txt(x.id) || P.uid() }));
    s.prep = arr(s.prep, x => Object.assign(todo(x.tri, txt(x.text), x.done), { id: txt(x.id) || P.uid() }));
    s.names = arr(s.names, x => name({ id: txt(x.id) || P.uid(), name: txt(x.name), kind: KINDS.includes(x.kind) ? x.kind : 'Either', stars: String(Math.max(0, Math.min(5, Math.round(P.num(x.stars))))), note: txt(x.note) }));
    s.gear = arr(s.gear, x => gear({ id: txt(x.id) || P.uid(), item: txt(x.item), planned: txt(x.planned), spent: txt(x.spent), got: !!x.got }));
    s.notes = txt(s.notes);
    s.ui = s.ui || {};
    if (!D.parse(s.ui.logDay)) s.ui.logDay = D.today();
    return s;
  }

  /* ---------- math ---------- */
  function dueDate(s) {
    const p = s.preg;
    if (p.mode === 'lmp') return D.parse(p.lmp) ? D.add(p.lmp, 280 + (Math.round(P.num(p.cycle)) || 28) - 28) : '';
    return D.parse(p.due) ? p.due : '';
  }
  /* gestational age in days on a date (default today) */
  function age(s, on) { const due = dueDate(s); if (!due) return null; return 280 - D.diff(on || D.today(), due); }
  function where(s) {
    const g = age(s);
    if (g == null) return null;
    const wk = Math.floor(g / 7), dy = ((g % 7) + 7) % 7, tri = wk < 14 ? 1 : wk < 28 ? 2 : 3;
    return { g, wk, dy, tri, left: 280 - g, pct: Math.max(0, Math.min(100, g / 280 * 100)), due: dueDate(s) };
  }
  const tipsFor = wk => (TIPS.find(([a, b]) => wk >= a && wk <= b) || TIPS[TIPS.length - 1])[2];
  const upcoming = s => s.visits.filter(v => v.date && v.date >= D.today()).sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1));
  const clockOf = sec => { sec = Math.max(0, Math.floor(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60; return `${h ? h + ':' + pad(m) : m}:${pad(sec % 60)}`; };
  const hm = t => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const isoOf = t => D.iso(new Date(t));
  const minsTxt = m => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`);
  /* the 5-1-1 pattern: about 5 minutes apart, about a minute long, for about an hour */
  function ctrStats(s) {
    const list = s.ctrs.filter(c => c.end), now = Date.now();
    const last = list.length ? list[list.length - 1].start : now, hour = list.filter(c => c.start >= last - 3600e3);   // the last hour you timed
    const ints = hour.map(c => { const i = list.indexOf(c); return i > 0 ? (c.start - list[i - 1].start) / 1000 : null; }).filter(x => x != null);
    const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
    let run = 0;
    for (let i = list.length - 1; i > 0; i--) {
      const c = list[i], prev = list[i - 1];
      if ((c.start - prev.start) / 1000 <= 330 && (c.end - c.start) / 1000 >= 55) run = c.start - prev.start + run; else break;
    }
    const recent = list.length && now - list[list.length - 1].end < 15 * 60e3;
    return { n: hour.length, dur: avg(hour.map(c => (c.end - c.start) / 1000)), int: avg(ints), five11: recent && run >= 55 * 60e3 };
  }

  /* ---------- week ---------- */
  const week = {
    id: 'week', label: 'Week', icon: 'heart',
    render(ctx) {
      const s = ctx.state, p = s.preg, w = where(s);
      return `${u.head({ eyebrow: p.baby || 'Pregnancy planner', title: '<span data-slot="title"></span>', meta: '<span data-slot="meta"></span>' })}
      <div data-slot="kpis"></div>
      <div class="pg-progress" data-slot="bar"></div>
      <div class="pl-grid">
        ${u.panel('This week', '<div data-slot="this"></div>', { icon: 'sparkle', cls: 'pl-7' })}
        ${u.panel('Next appointment', '<div data-slot="next"></div>', { icon: 'calendar', cls: 'pl-5', actions: u.btn('Visits', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'visits' } }) })}
        ${u.panel('Your dates', `<div class="y-field"><span class="y-label">Count from</span>${u.seg('preg.mode', p.mode, [['due', 'Due date'], ['lmp', 'Last period']], 'Count from')}</div>
          <div class="pl-fields pg-dates">${p.mode === 'due' ? u.field('Due date', 'preg.due', p.due, { type: 'date', rerender: true })
            : `${u.field('First day of last period', 'preg.lmp', p.lmp, { type: 'date', rerender: true })}${u.field('Cycle length (days)', 'preg.cycle', p.cycle, { num: true, ph: '28', rerender: true })}`}
          ${u.field('Baby’s nickname', 'preg.baby', p.baby, { ph: 'Little Bean', optional: true })}</div>
          ${p.mode === 'lmp' && w ? `<p class="pl-hint">Estimated due date: <b>${esc(D.full(w.due))}</b> (280 days from your last period, adjusted for cycle length). Your provider may change it after a scan.</p>` : ''}`, { icon: 'edit', cls: 'pl-7' })}
        ${u.notes('notes', s.notes, { rows: 5, title: 'Notes', ph: 'Phone numbers, hospital entrance, things to remember…', cls: 'pl-5' })}
      </div>`;
    },
    slots: {
      title(ctx) { const w = where(ctx.state); return w ? (w.g < 0 ? 'Getting <em>ready</em>' : `Week <em>${w.wk}</em>${w.dy ? ` + ${P.plural(w.dy, 'day')}` : ''}`) : 'Set your <em>due date</em>'; },
      meta(ctx) { const w = where(ctx.state); return w ? `<span class="y-sticker">${I('heart')}${w.left > 0 ? `${P.plural(w.left, 'day')} to go` : w.left === 0 ? 'Due today!' : `${P.plural(-w.left, 'day')} past the due date`}</span><span>Due ${esc(D.long(w.due))}</span>` : ''; },
      kpis(ctx) {
        const s = ctx.state, w = where(s), n = upcoming(s)[0];
        return u.kpis([
          ['Week', w ? `${Math.max(0, w.wk)}<small>+${w.dy}</small>` : '—', 'y-kpi--world', w ? `of 40` : 'set a due date'],
          ['Trimester', w ? ['First', 'Second', 'Third'][w.tri - 1] : '—', '', w ? `${Math.round(w.pct)}% of the way` : ''],
          ['Days to go', w ? String(Math.max(0, w.left)) : '—', '', w ? esc(D.full(w.due)) : ''],
          ['Next visit', n ? esc(D.short(n.date)) : '—', '', n ? esc(`${n.what || n.type} · ${D.rel(n.date)}`) : 'add one on Visits']
        ]);
      },
      bar(ctx) {
        const w = where(ctx.state);
        if (!w) return '';
        return `${u.meter(w.pct, 'Pregnancy progress', { cls: 'pg-meter' })}<div class="pg-tris"><span>First</span><span>Second</span><span>Third</span></div>`;
      },
      this(ctx) {
        const w = where(ctx.state);
        if (!w) return '<p class="pl-muted">Set your due date or the first day of your last period below.</p>';
        const sz = SIZE[Math.min(40, Math.max(4, w.wk))];
        return `${w.wk >= 4 ? `<p class="pg-size">${I('heart')}<span>Your baby is about the size of <b>${esc(sz)}</b>.</span></p>` : ''}
          <ul class="pg-tips">${tipsFor(w.wk).map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
      },
      next(ctx) {
        const n = upcoming(ctx.state)[0];
        if (!n) return u.empty('calendar', 'No appointment yet', 'Add the next one on Visits.', u.btn('Add a visit', { kind: 'world', icon: 'plus', act: 'go', data: { page: 'visits' } }));
        const q = n.questions.split('\n').map(x => x.trim()).filter(Boolean);
        return `<p class="pg-next"><b>${esc(n.what || n.type)}</b><span>${esc([D.long(n.date), n.time && D.time(n.time), n.where].filter(Boolean).join(' · '))}</span></p>
          ${q.length ? `<p class="pl-muted">Questions to ask</p><ul class="pg-tips">${q.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`;
      }
    }
  };

  /* ---------- visits ---------- */
  function visitSheet(ctx) {
    const list = upcoming(ctx.state);
    return `<h1>Appointments + questions</h1><p class="pl-sheet-meta">${list.length} upcoming</p>${list.map(v => `<h2>${esc(v.what || v.type)} · ${esc(D.full(v.date))}${v.time ? ` · ${esc(D.time(v.time))}` : ''}</h2>
      <p>${esc([v.type, v.where].filter(Boolean).join(' · '))}</p>${v.questions ? `<table><tbody>${v.questions.split('\n').filter(x => x.trim()).map(x => `<tr><td style="width:6mm"><span class="pl-box"></span></td><td>${esc(x)}</td></tr>`).join('')}</tbody></table>` : ''}<p>Notes: ____________________________________________</p>`).join('')}`;
  }
  const visits = {
    id: 'visits', label: 'Visits', icon: 'calendar',
    render(ctx) {
      const s = ctx.state, t = D.today(), all = s.visits.map((v, i) => Object.assign({ __i: i }, v)).sort((a, b) => ((a.date || '9') + a.time < (b.date || '9') + b.time ? -1 : 1));
      const up = all.filter(v => !v.date || v.date >= t), past = all.filter(v => v.date && v.date < t).reverse();
      const rec = (list, cls) => u.records('visits', list, {
        index: v => v.__i, what: 'Visit', titleKey: 'what', titlePh: 'What is it — e.g. “Anatomy scan”', cls,
        sub: v => esc([v.date && D.full(v.date), v.date && D.rel(v.date)].filter(Boolean).join(' · ')),
        fields: [{ k: 'date', label: 'Date', type: 'date', rerender: true }, { k: 'time', label: 'Time', type: 'time' }, { k: 'type', label: 'Type', options: TYPES },
          { k: 'where', label: 'With / where', ph: 'Doctor, clinic' }, { k: 'questions', label: 'Questions to ask — one per line', type: 'textarea', wide: true, rows: 3 },
          { k: 'notes', label: 'Notes + results', type: 'textarea', wide: true, rows: 2 }]
      });
      return `${u.head({ eyebrow: 'Appointments', title: up.length ? `<em>${up.length}</em> coming up` : 'Your <em>visits</em>', lede: 'Write questions down as you think of them, and what you heard afterwards. Print the questions before a visit.' })}
      <div class="pl-row pg-gap">${u.btn('Add a visit', { kind: 'world', icon: 'plus', act: 'addVisit' })}</div>
      ${up.length ? rec(up, 'pg-visits') : u.empty('calendar', 'Nothing coming up', 'Add your next appointment.')}
      ${past.length ? `<h2 class="pg-h2">Past visits</h2>${rec(past, 'pg-visits pg-past')}` : ''}`;
    },
    actions: { addVisit(ctx) { const s = ctx.state; s.visits.push(visit({ date: D.add(D.today(), 7) })); ctx.focus(`[data-bind="visits.${s.visits.length - 1}.what"]`); } },
    sheet: visitSheet
  };
  week.sheet = visitSheet;

  /* ---------- symptoms ---------- */
  const log = {
    id: 'log', label: 'Symptoms', icon: 'list',
    render(ctx) {
      const s = ctx.state, d = s.ui.logDay, rec = s.days[d] || (s.days[d] = dayRec()), b = `days.${d}`, unit = s.preg.unit;
      const keys = Object.keys(s.days).filter(k => !empty(s.days[k])).sort().reverse().slice(0, 14);
      return `${u.head({ eyebrow: 'Daily log', title: d === D.today() ? 'How are you <em>today</em>?' : `<em>${esc(D.long(d))}</em>`, lede: 'Ten seconds a day. Handy when your provider asks “since when?”.' })}
      <div class="pl-grid">
        ${u.panel('Log a day', `<div class="pl-fields">${u.field('Day', 'ui.logDay', d, { type: 'date', rerender: true })}</div>
          <div class="y-field"><span class="y-label">Symptoms</span><div class="pg-chips">${SYMPTOMS.map(x => `<button type="button" class="y-chip pl-chip${rec.symptoms.includes(x) ? ' is-on' : ''}" aria-pressed="${rec.symptoms.includes(x)}" data-act="sym" data-sym="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>
          <div class="y-field"><span class="y-label">Mood</span>${u.seg(`${b}.mood`, rec.mood, MOODS, 'Mood')}</div>
          <div class="pl-fields">${u.field('Sleep (hours)', `${b}.sleep`, rec.sleep, { num: true, ph: '7.5' })}
            <div class="y-field"><span class="y-label">Water (glasses)</span><div class="pg-water">${u.iconBtn('minus', 'One glass less', 'water', { n: -1 })}<b class="y-num">${+rec.water}</b>${u.iconBtn('plus', 'One more glass', 'water', { n: 1 })}</div></div>
            ${u.field(`Weight (${unit})`, `${b}.weight`, rec.weight, { num: true, ph: unit === 'kg' ? '68.5' : '151', optional: true })}
            ${u.field('Blood pressure', `${b}.bp`, rec.bp, { ph: '112/70', optional: true })}</div>
          ${u.field('Notes', `${b}.notes`, rec.notes, { type: 'textarea', rows: 2, ph: 'Anything you want to remember' })}`, { icon: 'edit', cls: 'pl-7' })}
        ${u.panel('Trends', '<div data-slot="trend"></div>', { icon: 'chart', cls: 'pl-5' })}
      </div>
      ${u.panel('Last 14 days', keys.length ? `<ul class="pg-days">${keys.map(k => { const x = s.days[k]; return `<li>
        <span class="pg-day-date"><b>${esc(D.day(k))}</b> ${esc(D.short(k))}</span>
        <span class="pg-day-main">${x.mood ? u.pill(MOOD[x.mood], +x.mood >= 4 ? 'good' : +x.mood <= 2 ? 'bad' : '') : ''}${x.symptoms.map(y => u.pill(y, 'world')).join('')}
          <span class="pl-muted">${esc([P.has(x.sleep) && `${x.sleep} h sleep`, +x.water && `${x.water} glasses`, P.has(x.weight) && `${x.weight} ${unit}`, P.has(x.bp) && `BP ${x.bp}`].filter(Boolean).join(' · '))}</span>
          ${x.notes ? `<span class="pg-day-note">${esc(x.notes)}</span>` : ''}</span>
        <span class="pg-day-tools">${u.btn('Edit', { sm: true, kind: 'ghost', act: 'set', data: { bind: 'ui.logDay', value: k } })}${u.iconBtn('close', `Clear ${D.short(k)}`, 'clearDay', { day: k })}</span></li>`; }).join('')}</ul>`
        : '<p class="pl-muted">Your logged days show up here.</p>', { icon: 'calendar' })}`;
    },
    slots: {
      trend(ctx) {
        const s = ctx.state, keys = Object.keys(s.days).filter(k => !empty(s.days[k])).sort(), unit = s.preg.unit;
        const ws = keys.filter(k => P.has(s.days[k].weight)), last7 = keys.filter(k => k > D.add(D.today(), -7));
        const count = {}; last7.forEach(k => s.days[k].symptoms.forEach(x => { count[x] = (count[x] || 0) + 1; }));
        const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const sl = last7.map(k => P.num(s.days[k].sleep)).filter(Boolean);
        const ch = ws.length > 1 ? r2(P.num(s.days[ws[ws.length - 1]].weight) - P.num(s.days[ws[0]].weight)) : null;
        return `${u.kpis([['Weight', ws.length ? `${esc(s.days[ws[ws.length - 1]].weight)}<small> ${unit}</small>` : '—', 'y-kpi--world', ch != null ? `${ch >= 0 ? '+' : ''}${ch} ${unit} since ${esc(D.short(ws[0]))}` : ''],
          ['Sleep, 7 days', sl.length ? `${r2(sl.reduce((a, b) => a + b, 0) / sl.length)} h` : '—', '', 'average a night']])}
          ${top.length ? `<p class="pl-muted">Most this week: ${top.map(([k, n]) => `<b>${esc(k)}</b> ${n}×`).join(' · ')}</p>` : ''}
          <div class="y-field"><span class="y-label">Weight in</span>${u.seg('preg.unit', unit, [['lb', 'lb'], ['kg', 'kg']], 'Weight unit')}</div>`;
      }
    },
    actions: {
      sym(ctx, d) { const s = ctx.state, r = s.days[s.ui.logDay] || (s.days[s.ui.logDay] = dayRec()), i = r.symptoms.indexOf(d.sym); if (i >= 0) r.symptoms.splice(i, 1); else r.symptoms.push(d.sym); },
      water(ctx, d) { const s = ctx.state, r = s.days[s.ui.logDay] || (s.days[s.ui.logDay] = dayRec()); r.water = String(Math.max(0, Math.min(20, +r.water + +d.n))); },
      clearDay(ctx, d) { const s = ctx.state; ctx.remember(); s.days[d.day] = dayRec(); ctx.undoToast(`Cleared ${D.short(d.day)}`); }
    }
  };

  /* ---------- kicks + contractions ---------- */
  const timers = {
    id: 'timers', label: 'Kicks & contractions', icon: 'timer',
    render(ctx) {
      const s = ctx.state, kr = s.kickRun, open = s.ctrs.find(c => !c.end), st = ctrStats(s);
      const kicks = s.kicks.map((k, i) => Object.assign({ __i: i }, k)).sort((a, b) => b.start - a.start).slice(0, 10);
      const ctrs = s.ctrs.map((c, i) => Object.assign({ __i: i }, c)).reverse().slice(0, 12);
      return `${u.head({ eyebrow: 'Kicks & contractions', title: 'Count and <em>time</em>', lede: 'Tap once per movement until you reach 10. Time contractions start to stop. Your provider tells you when and how to use these.' })}
      <div class="pl-grid">
        ${u.panel('Kick counter', `${kr ? `<div class="pg-kick"><p class="pg-run">Counting since ${esc(D.time(hm(kr.start)))} · <b class="y-num" data-since="${kr.start}">${clockOf((Date.now() - kr.start) / 1000)}</b></p>
            <button type="button" class="y-btn y-btn--world pg-big" data-act="kick">${I('heart')}<span>Kick! <b class="y-num">${kr.count}</b>/10</span></button>
            <div class="pl-row">${u.btn('Stop and save', { sm: true, act: 'kickStop', icon: 'check' })}${u.btn('Cancel', { sm: true, kind: 'ghost', act: 'kickCancel' })}</div></div>`
          : `<div class="pg-kick">${u.btn('Start counting kicks', { kind: 'world', icon: 'timer', act: 'kickStart', cls: 'pg-big' })}${kicks[0] ? `<p class="pl-muted">Last time: 10 movements in ${minsTxt(Math.round((kicks[0].end - kicks[0].start) / 60000))}, ${esc(D.rel(isoOf(kicks[0].start)))}.</p>` : ''}</div>`}
          ${kicks.length ? `<h3 class="pg-h3">Recent sessions</h3>${u.table('kicks', kicks, [
            { label: 'Day', w: '1fr', html: k => esc(`${D.day(isoOf(k.start))} ${D.short(isoOf(k.start))}`) },
            { label: 'Started', w: '90px', html: k => esc(D.time(hm(k.start))) },
            { label: 'Kicks', w: '64px', html: k => `<b class="y-num">${k.count}</b>` },
            { label: 'Took', w: '90px', html: k => `<b class="y-num">${minsTxt(Math.max(1, Math.round((k.end - k.start) / 60000)))}</b>` }
          ], { index: k => k.__i, total: s.kicks.length, what: 'session', cls: 'pg-ktab' })}` : ''}`, { icon: 'heart', cls: 'pl-6' })}
        ${u.panel('Contraction timer', `${st.five11 ? u.banner('warn', '<b>About 5 minutes apart, about 1 minute long, for about an hour.</b> That is the 5-1-1 pattern — time to talk to your provider. If anything feels wrong, call them or emergency services.') : ''}
          <div class="pg-kick">${open ? `<p class="pg-run">Contraction · <b class="y-num" data-since="${open.start}">${clockOf((Date.now() - open.start) / 1000)}</b></p>${u.btn('It stopped', { kind: 'world', icon: 'check', act: 'ctrStop', cls: 'pg-big' })}`
            : u.btn('Contraction started', { kind: 'world', icon: 'timer', act: 'ctrStart', cls: 'pg-big' })}</div>
          <div class="pg-ck">${u.kpis([['Last hour timed', String(st.n), 'y-kpi--world', 'contractions'], ['Lasting', st.dur ? clockOf(st.dur) : '—', '', 'average'], ['Apart', st.int ? clockOf(st.int) : '—', '', 'start to start']])}</div>
          ${ctrs.length ? `<h3 class="pg-h3">Timed</h3>${u.table('ctrs', ctrs, [
            { label: 'Started', w: '1fr', html: c => esc(`${D.short(isoOf(c.start))} · ${D.time(hm(c.start))}`) },
            { label: 'Lasted', w: '84px', html: c => `<b class="y-num">${c.end ? clockOf((c.end - c.start) / 1000) : '…'}</b>` },
            { label: 'Apart', w: '84px', html: c => { const prev = s.ctrs[c.__i - 1]; return prev ? `<span class="y-num">${clockOf((c.start - prev.start) / 1000)}</span>` : '<span class="pl-muted">—</span>'; } }
          ], { index: c => c.__i, total: s.ctrs.length, what: 'contraction', cls: 'pg-ctab' })}<div class="pl-list-foot">${u.btn('Clear the list', { sm: true, kind: 'ghost', icon: 'trash', act: 'ctrClear' })}</div>` : ''}`, { icon: 'timer', cls: 'pl-6' })}
      </div>`;
    },
    actions: {
      kickStart(ctx) { ctx.state.kickRun = { start: Date.now(), count: 0 }; },
      kick(ctx) {
        const s = ctx.state, r = s.kickRun; if (!r) return;
        r.count += 1;
        if (r.count >= 10) { const k = kick({ start: r.start, end: Date.now(), count: 10 }); s.kicks.push(k); s.kickRun = null; ctx.toast(`10 movements in ${minsTxt(Math.max(1, Math.round((k.end - k.start) / 60000)))}`); }
      },
      kickStop(ctx) { const s = ctx.state, r = s.kickRun; if (r && r.count) s.kicks.push(kick({ start: r.start, end: Date.now(), count: r.count })); s.kickRun = null; },
      kickCancel(ctx) { ctx.state.kickRun = null; },
      ctrStart(ctx) { const s = ctx.state; if (!s.ctrs.some(c => !c.end)) s.ctrs.push(ctr({ start: Date.now() })); },
      ctrStop(ctx) { const c = ctx.state.ctrs.find(x => !x.end); if (c) c.end = Math.max(c.start + 1000, Date.now()); },
      ctrClear(ctx) { const s = ctx.state; ctx.remember(); s.ctrs = []; ctx.undoToast('Cleared the contraction list'); }
    }
  };

  /* ---------- hospital bag ---------- */
  const bag = {
    id: 'bag', label: 'Hospital bag', icon: 'check',
    render(ctx) {
      const s = ctx.state, named = s.bag.filter(x => P.has(x.text)), done = named.filter(x => x.done).length;
      return `${u.head({ eyebrow: 'Hospital bag', title: named.length ? `<em>${done}</em> of ${named.length} packed` : 'Pack the <em>bag</em>', lede: 'One list for you, the baby and your partner. Many people pack around week 35 — tick things as they go in.' })}
      ${named.length ? u.meter(named.length ? done / named.length * 100 : 0, 'Bag packed', { cls: 'pg-meter' }) : ''}
      <div class="pl-row pg-gap">${u.btn('Add the starter list', { kind: named.length ? 'secondary' : 'world', icon: 'sparkle', act: 'bagStarter' })}<span class="pl-muted">Adds only what is missing.</span></div>
      <div class="pg-bags">${WHO.map(w => { const list = s.bag.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.who === w);
        return u.panel(w === 'Mom' ? 'For you' : w === 'Baby' ? 'For the baby' : 'For your partner', `${u.checklist('bag', list, { index: x => x.__i, total: s.bag.length, ph: 'Item', what: 'item', rerender: true, empty: 'Nothing yet.' })}
          <div class="pl-list-foot">${u.btn('Add item', { sm: true, icon: 'plus', act: 'addBag', data: { who: w } })}</div>`, { icon: w === 'Baby' ? 'heart' : 'user', cls: 'y-panel--flat', actions: list.length ? u.pill(`${list.filter(x => x.done).length}/${list.length}`, list.every(x => x.done) ? 'good' : 'world') : '' });
      }).join('')}</div>`;
    },
    actions: {
      bagStarter(ctx) { const s = ctx.state, have = new Set(s.bag.map(x => `${x.who}|${x.text.toLowerCase()}`)); let n = 0; WHO.forEach(w => BAG[w].forEach(t => { if (!have.has(`${w}|${t.toLowerCase()}`)) { s.bag.push(item(w, t)); n++; } })); ctx.toast(n ? `Added ${P.plural(n, 'item')}` : 'Everything is already on the list'); },
      addBag(ctx, d) { const s = ctx.state; s.bag.push(item(d.who)); ctx.focus(`[data-bind="bag.${s.bag.length - 1}.text"]`); }
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Hospital bag</h1><p class="pl-sheet-meta">${s.bag.filter(x => x.done).length} of ${s.bag.filter(x => P.has(x.text)).length} packed</p>${WHO.map(w => { const l = s.bag.filter(x => x.who === w && P.has(x.text)); return l.length ? `<h2>${w === 'Mom' ? 'For you' : w === 'Baby' ? 'For the baby' : 'For your partner'}</h2><table><tbody>${l.map(x => `<tr><td style="width:6mm"><span class="pl-box${x.done ? ' is-on' : ''}"></span></td><td>${esc(x.text)}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}`;
    }
  };

  /* ---------- baby prep ---------- */
  const prep = {
    id: 'prep', label: 'Baby prep', icon: 'star',
    render(ctx) {
      const s = ctx.state, w = where(s);
      return `${u.head({ eyebrow: 'Baby prep', title: 'Getting <em>ready</em>', lede: 'To-dos by trimester, the names you love, and what the baby gear will cost.' })}
      <div data-slot="kpis"></div>
      <div class="pg-tri">${TRI.map(([t, l]) => { const list = s.prep.map((x, i) => Object.assign({ __i: i }, x)).filter(x => x.tri === t);
        return u.panel(l, `${u.checklist('prep', list, { index: x => x.__i, total: s.prep.length, ph: 'To-do', what: 'to-do', rerender: true, empty: 'Nothing here.' })}
          <div class="pl-list-foot">${u.btn('Add to-do', { sm: true, icon: 'plus', act: 'addPrep', data: { tri: t } })}</div>`, { icon: 'check', cls: `y-panel--flat${w && w.tri === +t ? ' pg-now' : ''}`, actions: w && w.tri === +t ? u.pill('now', 'world') : '' }); }).join('')}</div>
      <div class="pl-grid">
        ${u.panel('Baby names', `${u.quickAdd('names', { key: 'name', ph: 'Add a name and press Enter', label: 'Add a baby name', kind: 'world' })}<div class="pg-gap"></div>
          ${u.table('names', s.names.map((x, i) => Object.assign({ __i: i }, x)).sort((a, b) => +b.stars - +a.stars), [
            { k: 'name', label: 'Name', title: true, w: '1fr', ph: 'Name' }, { k: 'kind', label: 'For', type: 'select', options: KINDS, w: '104px' },
            { k: 'stars', label: 'Love it', type: 'stars', w: '190px' }, { k: 'note', label: 'Note', w: '1fr', ph: 'Meaning, who picked it' }
          ], { index: x => x.__i, total: s.names.length, what: 'name', empty: 'Type a name above and press Enter.', cls: 'pg-names' })}`, { icon: 'heart', cls: 'pl-7' })}
        ${u.panel('Baby gear budget', `${u.table('gear', s.gear, [
            { k: 'item', label: 'Item', title: true, w: '1fr', ph: 'Stroller' }, { k: 'planned', label: 'Planned', num: true, w: '90px', ph: '0' },
            { k: 'spent', label: 'Spent', num: true, w: '90px', ph: '0' }, { k: 'got', label: 'Got it', type: 'check', w: '64px', rerender: true }
          ], { what: 'item', add: 'Add item', tpl: 'gear', cls: 'pg-gear' })}`, { icon: 'money', cls: 'pl-5' })}
      </div>`;
    },
    slots: {
      kpis(ctx) {
        const s = ctx.state, todos = s.prep.filter(x => P.has(x.text)), plan = r2(s.gear.reduce((a, g) => a + P.num(g.planned), 0)), spent = r2(s.gear.reduce((a, g) => a + P.num(g.spent), 0));
        const fav = s.names.filter(x => +x.stars >= 5 && P.has(x.name));
        return u.kpis([['To-dos done', `${todos.filter(x => x.done).length}<small>/${todos.length}</small>`, 'y-kpi--world', ''],
          ['Gear spent', ctx.money(spent, { cents: false }), plan && spent > plan ? 'y-kpi--accent' : '', plan ? `of ${ctx.money(plan, { cents: false })} planned` : ''],
          ['Favorite names', String(fav.length), '', fav.map(x => esc(x.name)).slice(0, 3).join(', ')]]);
      }
    },
    actions: { addPrep(ctx, d) { const s = ctx.state; s.prep.push(todo(d.tri)); ctx.focus(`[data-bind="prep.${s.prep.length - 1}.text"]`); } }
  };

  let tick = null;
  P.create({
    slug: 'pregnancy-planner-app', name: 'Pregnancy Planner', world: 'bloom', currency: true,
    welcome: 'Set your due date (or the first day of your last period) on Week — everything else counts from it.',
    pages: [week, visits, log, timers, bag, prep],
    blank, sample, normalize,
    open() {
      clearInterval(tick);
      tick = setInterval(() => document.querySelectorAll('[data-since]').forEach(el => { el.textContent = clockOf((Date.now() - +el.dataset.since) / 1000); }), 1000);
    },
    rows: { visits: () => visit({ date: D.add(D.today(), 7) }), kicks: () => kick(), ctrs: () => ctr(), bag: () => item('Mom'), prep: () => todo('2'), names: () => name(), gear: () => gear() },
    about: '<p><b>Pregnancy Planner</b> counts the weeks from your due date (or your last period), with the baby’s size and a few plain to-dos each week. It keeps your appointments with the questions to ask, a quick daily symptom log, a kick counter, a contraction timer, the hospital bag for you, the baby and your partner, and baby prep: to-dos by trimester, a names list and a gear budget.</p>',
    disclaimer: 'Pregnancy Planner is a personal planner, not medical advice. Follow your provider’s guidance; if something feels wrong, call your provider or emergency services right away.'
  });
})();
