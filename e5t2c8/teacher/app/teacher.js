/* Teacher Planner App — today's classes, weekly lesson plans, rosters and the bell schedule, one-tap attendance,
   a weighted gradebook, seating charts and a parent contact log. Yaykit planner engine, chalk world (teacher.css). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const CODES = ['', 'A', 'L', 'E'];
  const CODE = { '': ['Present', 'P'], A: ['Absent', 'A'], L: ['Late', 'L'], E: ['Excused', 'E'] };
  const METHODS = ['Email', 'Phone', 'Note home', 'Meeting', 'App message'];
  const FIELDS = [['obj', 'Objective', 'Students will…'], ['mat', 'Materials', 'Slides, worksheet, manipulatives'], ['act', 'Activities', 'Warm-up, mini-lesson, practice, exit ticket'],
    ['hw', 'Homework', 'None'], ['std', 'Standards', 'e.g. 5.NF.1']];
  const txt = v => (v == null ? '' : String(v));
  const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
  const obj = v => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const r1 = n => Math.round(n * 10) / 10;
  const id = k => k + P.uid();

  /* ---------- records ---------- */
  const period = o => Object.assign({ id: id('p'), label: '', start: '', end: '' }, o || {});
  const student = o => Object.assign({ id: id('s'), name: '', bday: '', parent: '', phone: '', notes: '' }, o || {});
  const cat = (name, weight) => ({ id: id('c'), name: name || '', weight: txt(weight) });
  const assign = o => Object.assign({ id: id('a'), name: '', cat: '', points: '10', date: '' }, o || {});
  const klass = o => Object.assign({ id: id('k'), name: '', room: '', students: [], cats: [cat('Homework', 20), cat('Quizzes', 30), cat('Tests', 50)], assign: [], scores: {}, rows: '4', cols: '4', seats: {} }, o || {});
  const todo = (text, done) => ({ id: id('t'), text: text || '', done: !!done });
  const duty = o => Object.assign({ id: id('d'), day: '', text: '', time: '' }, o || {});
  const contact = o => Object.assign({ id: id('m'), date: D.today(), sid: '', method: 'Email', note: '', follow: false }, o || {});
  const SCALE = [['A', 90], ['B', 80], ['C', 70], ['D', 60], ['F', 0]];

  function blank() {
    return { teacher: { name: '', school: '', grade: '', year: '' }, periods: [], timetable: DAYS.map(() => ({})), classes: [], lessons: {}, att: {}, taken: {},
      todos: [], duties: [], contacts: [], scale: SCALE.map(([letter, min]) => ({ letter, min: String(min) })), notes: '', ui: {} };
  }
  function sample() {
    const s = blank(), t = D.today(), mon = weekOf(t).mon;
    s.teacher = { name: 'Ms. Rivera', school: 'Maple Grove Elementary', grade: '5th grade', year: '2026–27' };
    s.periods = [['Period 1', '08:15', '09:05'], ['Period 2', '09:10', '10:00'], ['Period 3', '10:05', '10:55'], ['Lunch', '11:00', '11:40'], ['Period 4', '11:45', '12:35'], ['Period 5', '12:40', '13:30'], ['Period 6', '13:35', '14:25']]
      .map(([label, start, end]) => period({ label, start, end }));
    const pid = i => s.periods[i].id;
    const names = (list, born) => list.map((n, i) => student({ name: n, bday: `2015-${String((i * 5 + born) % 12 + 1).padStart(2, '0')}-${String((i * 7 + 3) % 27 + 1).padStart(2, '0')}`,
      parent: ['Mom', 'Dad', 'Grandma', 'Mom', 'Dad'][i % 5] + ' ' + n.split(' ')[1].replace('.', ''), phone: `(555) 01${String(20 + i).padStart(2, '0')}`, notes: ['', 'Sits near the front', '', 'Extra time on tests', '', 'Loves to help', ''][i % 7] }));
    const math = klass({ name: 'Math 5A', room: '112', students: names(['Ava M.', 'Ben T.', 'Chloe R.', 'Diego S.', 'Ella K.', 'Finn W.', 'Grace L.', 'Hugo P.', 'Isla N.', 'Jonah B.', 'Kai D.', 'Lila F.'], 2) });
    const sci = klass({ name: 'Science 5B', room: 'Lab 2', students: names(['Mason G.', 'Nora H.', 'Owen J.', 'Piper Q.', 'Quinn V.', 'Ruby A.', 'Sam C.', 'Tessa Y.', 'Uma Z.', 'Vince O.', 'Willa E.', 'Zane I.'], 7) });
    // a birthday this week, so Today has one to show
    math.students[4].bday = '2015' + D.add(t, 2).slice(4);
    s.classes = [math, sci];
    s.timetable = DAYS.map((_, d) => { const r = { [pid(0)]: math.id, [pid(2)]: sci.id }; if (d % 2 === 0) r[pid(5)] = math.id; else r[pid(4)] = sci.id; return r; });
    // grades
    const grade = (c, list, seed) => {
      c.assign = list.map(([name, ci, points, back]) => assign({ name, cat: c.cats[ci].id, points: String(points), date: D.add(t, -back) }));
      c.students.forEach((st, si) => c.assign.forEach((a, ai) => {
        if ((si * 3 + ai + seed) % 17 === 0) return; // a few missing
        const p = +a.points, f = 0.62 + ((si * 7 + ai * 5 + seed) % 9) * 0.045;
        (c.scores[a.id] = c.scores[a.id] || {})[st.id] = String(Math.min(p, Math.round(p * f)));
      }));
    };
    grade(math, [['Fractions homework', 0, 10, 18], ['Equivalent fractions quiz', 1, 20, 15], ['Adding fractions homework', 0, 10, 11], ['Mixed numbers quiz', 1, 20, 8], ['Word problems homework', 0, 10, 4], ['Unit 2 test', 2, 50, 2]], 1);
    sci.cats = [cat('Labs', 40), cat('Quizzes', 30), cat('Projects', 30)];
    grade(sci, [['Lab: states of matter', 0, 20, 17], ['Matter quiz', 1, 20, 13], ['Lab: mixtures', 0, 20, 10], ['Notebook check', 1, 10, 7], ['Ecosystem poster', 2, 40, 5], ['Food web quiz', 1, 20, 1]], 4);
    // seating
    math.students.forEach((st, i) => { math.seats[i < 8 ? i : i + 1] = st.id; });
    sci.rows = '3'; sci.students.forEach((st, i) => { sci.seats[i] = st.id; });
    // attendance: the last ten school days
    let d = t, n = 0;
    while (n < 10) {
      d = D.add(d, -1);
      if (weekday(d) > 4) continue;
      n++;
      [math, sci].forEach((c, ci) => {
        (s.taken[c.id] = s.taken[c.id] || []).push(d);
        c.students.forEach((st, si) => { const k = (si * 11 + n * 7 + ci * 3) % 41; if (k < 4) ((s.att[c.id] = s.att[c.id] || {})[d] = s.att[c.id][d] || {})[st.id] = k === 0 ? 'E' : k === 1 ? 'L' : 'A'; });
      });
    }
    if (weekday(t) < 5) {
      [math, sci].forEach(c => { s.taken[c.id].push(t); });
      ((s.att[math.id] = s.att[math.id] || {})[t] = {})[math.students[6].id] = 'A';
      (s.att[sci.id][t] = {})[sci.students[2].id] = 'L';
    }
    // lessons for this week
    const plan = {
      [math.id]: [['Add fractions with unlike denominators', 'Fraction strips, slides', 'Warm-up review · model with strips · partner practice · exit ticket', 'Workbook p. 42', '5.NF.1'],
        ['Subtract fractions with unlike denominators', 'Fraction strips, whiteboards', 'Number talk · guided examples · stations', 'Workbook p. 44', '5.NF.1'],
        ['Mixed numbers: add and subtract', 'Slides, worksheet', 'Warm-up · mini-lesson · practice in pairs', 'Worksheet 2.6', '5.NF.1'],
        ['Fraction word problems', 'Problem cards', 'Read, draw, solve · gallery walk', 'Two word problems', '5.NF.2'],
        ['Review + quiz', 'Quiz copies', 'Review game · quiz', 'None', '5.NF.1–2']],
      [sci.id]: [['Producers, consumers, decomposers', 'Slides, picture cards', 'Sort the cards · class discussion', 'Read pp. 30–33', '5-LS2-1'],
        ['Build a food chain', 'Yarn, organism cards', 'Model a food chain with yarn · reflect', 'None', '5-LS2-1'],
        ['From food chains to food webs', 'Chart paper, markers', 'Groups build a food web poster', 'Finish poster draft', '5-LS2-1'],
        ['Energy in an ecosystem', 'Video, notebook', 'Video · notebook notes · turn and talk', 'Notebook check', '5-PS3-1'],
        ['Ecosystem poster presentations', 'Posters, rubric', 'Presentations · peer feedback', 'None', '5-LS2-1']]
    };
    s.lessons[mon] = DAYS.map((_, dd) => Object.fromEntries(Object.entries(s.timetable[dd]).map(([p, cid]) => { const x = p === pid(5) ? ['Small-group fraction practice', 'Fraction tiles, mini whiteboards', 'Re-teach in small groups · fluency games · check-in', 'None', '5.NF.1'] : plan[cid][dd]; return [p, { obj: x[0], mat: x[1], act: x[2], hw: x[3], std: x[4] }]; })));
    s.todos = [todo('Copy the fractions quiz', true), todo('Email Hugo’s dad about missing homework'), todo('Grade the ecosystem posters'), todo('Order more glue sticks')];
    s.duties = [duty({ day: '1', text: 'Lunch duty — cafeteria', time: '11:00' }), duty({ day: '3', text: 'Bus duty — front loop', time: '14:30' }), duty({ day: '0', text: 'Grade-level meeting', time: '14:40' }), duty({ day: '4', text: 'Morning arrival duty', time: '07:50' })];
    s.contacts = [contact({ date: D.add(t, -6), sid: math.students[7].id, method: 'Email', note: 'Two missing homework assignments — asked for a check-in at home.', follow: true }),
      contact({ date: D.add(t, -3), sid: sci.students[5].id, method: 'Phone', note: 'Great poster work, shared with Mom.' }),
      contact({ date: D.add(t, -1), sid: math.students[3].id, method: 'Note home', note: 'Extra time on tests is working well.' })];
    s.notes = 'Fire drill next Thursday after lunch.\nAsk the office for more chart paper.';
    s.ui = { cls: math.id };
    return s;
  }
  function normalize(s) {
    const tch = obj(s.teacher);
    s.teacher = { name: txt(tch.name), school: txt(tch.school), grade: txt(tch.grade), year: txt(tch.year) };
    s.periods = arr(s.periods, x => period({ id: txt(x.id) || id('p'), label: txt(x.label), start: txt(x.start), end: txt(x.end) }));
    const pids = new Set(s.periods.map(p => p.id));
    s.classes = arr(s.classes, c => {
      const k = klass({ id: txt(c.id) || id('k'), name: txt(c.name), room: txt(c.room), rows: String(Math.max(1, Math.min(10, Math.round(P.num(c.rows)) || 4))), cols: String(Math.max(1, Math.min(10, Math.round(P.num(c.cols)) || 4))) });
      k.students = arr(c.students, x => student({ id: txt(x.id) || id('s'), name: txt(x.name), bday: D.parse(x.bday) ? x.bday : '', parent: txt(x.parent), phone: txt(x.phone), notes: txt(x.notes) }));
      k.cats = Array.isArray(c.cats) ? arr(c.cats, x => ({ id: txt(x.id) || id('c'), name: txt(x.name), weight: txt(x.weight) })) : k.cats;
      k.assign = arr(c.assign, x => assign({ id: txt(x.id) || id('a'), name: txt(x.name), cat: txt(x.cat), points: txt(x.points), date: D.parse(x.date) ? x.date : '' }));
      const sc = obj(c.scores);
      k.scores = Object.fromEntries(Object.keys(sc).map(a => [a, Object.fromEntries(Object.entries(obj(sc[a])).map(([sid, v]) => [sid, txt(v)]))]));
      const seats = obj(c.seats), sids = new Set(k.students.map(x => x.id)), seen = new Set();
      k.seats = Object.fromEntries(Object.keys(seats).filter(i => /^\d+$/.test(i) && sids.has(seats[i]) && !seen.has(seats[i]) && seen.add(seats[i])).map(i => [i, seats[i]]));
      return k;
    });
    const cids = new Set(s.classes.map(c => c.id));
    const tt = Array.isArray(s.timetable) ? s.timetable : [];
    s.timetable = DAYS.map((_, d) => Object.fromEntries(Object.entries(obj(tt[d])).filter(([p, c]) => pids.has(p) && cids.has(c))));
    const L = obj(s.lessons);
    s.lessons = Object.fromEntries(Object.keys(L).filter(k => D.parse(k)).map(k => [k, DAYS.map((_, d) => Object.fromEntries(Object.entries(obj((L[k] || [])[d])).filter(([p]) => pids.has(p))
      .map(([p, x]) => [p, Object.fromEntries(FIELDS.map(([f]) => [f, txt(obj(x)[f])]))])))]));
    const A = obj(s.att);
    s.att = Object.fromEntries(Object.keys(A).filter(c => cids.has(c)).map(c => [c, Object.fromEntries(Object.keys(obj(A[c])).filter(d => D.parse(d))
      .map(d => [d, Object.fromEntries(Object.entries(obj(A[c][d])).filter(([, v]) => CODES.includes(v) && v))]))]));
    const T = obj(s.taken);
    s.taken = Object.fromEntries(Object.keys(T).filter(c => cids.has(c)).map(c => [c, [...new Set((Array.isArray(T[c]) ? T[c] : []).filter(d => D.parse(d)))].sort()]));
    s.todos = arr(s.todos, x => Object.assign(todo(txt(x.text), x.done), { id: txt(x.id) || id('t') }));
    s.duties = arr(s.duties, x => duty({ id: txt(x.id) || id('d'), day: ['0', '1', '2', '3', '4'].includes(String(x.day)) ? String(x.day) : '', text: txt(x.text), time: txt(x.time) }));
    s.contacts = arr(s.contacts, x => contact({ id: txt(x.id) || id('m'), date: D.parse(x.date) ? x.date : D.today(), sid: txt(x.sid), method: METHODS.includes(x.method) ? x.method : 'Email', note: txt(x.note), follow: !!x.follow }));
    s.scale = arr(s.scale, x => ({ letter: txt(x.letter), min: txt(x.min) }));
    if (!s.scale.length) s.scale = SCALE.map(([letter, min]) => ({ letter, min: String(min) }));
    s.notes = txt(s.notes);
    s.ui = obj(s.ui);
    if (!cids.has(s.ui.cls)) s.ui.cls = s.classes.length ? s.classes[0].id : '';
    if (!D.parse(s.ui.adate)) s.ui.adate = D.today();
    if (!/^\d+$/.test(String(s.ui.seat))) s.ui.seat = '';
    return s;
  }

  /* ---------- helpers ---------- */
  function weekday(iso) { return (D.parse(iso).getDay() + 6) % 7; }
  /* the school day Today shows: today on weekdays, next Monday on weekends */
  function weekOf(iso) { const w = weekday(iso); return w < 5 ? { mon: D.monday(iso), d: w, date: iso, ahead: false } : { mon: D.add(D.monday(iso), 7), d: 0, date: D.add(D.monday(iso), 7), ahead: true }; }
  const cur = s => s.classes.find(c => c.id === s.ui.cls) || s.classes[0];
  const clsOf = (s, cid) => s.classes.find(c => c.id === cid);
  const lesson = (s, mon, d, pid) => ((s.lessons[mon] || [])[d] || {})[pid] || {};
  const wk = s => (D.parse(s.ui.week) ? s.ui.week : (s.ui.week = D.monday(D.today())));
  const periodsOn = (s, d) => s.periods.filter(p => s.timetable[d][p.id]);
  const allStudents = s => s.classes.flatMap(c => c.students.filter(x => P.has(x.name)).map(x => Object.assign({ cls: c.name }, x)));
  const timeOf = p => [p.start, p.end].filter(Boolean).map(D.time).join(' – ');
  const code = (s, cid, date, sid) => ((s.att[cid] || {})[date] || {})[sid] || '';
  function rate(s, c) {
    const days = s.taken[c.id] || [], n = c.students.length;
    if (!days.length || !n) return null;
    let out = 0;
    days.forEach(d => c.students.forEach(st => { const k = code(s, c.id, d, st.id); if (k === 'A' || k === 'E') out++; }));
    return r1((1 - out / (days.length * n)) * 100);
  }
  const counts = (s, c, sid) => { const r = { A: 0, L: 0, E: 0 }; (s.taken[c.id] || []).forEach(d => { const k = code(s, c.id, d, sid); if (k) r[k]++; }); return r; };
  /* weighted average: each category's points earned / possible, weighted by the category weights that have grades */
  function average(c, sid) {
    let wsum = 0, acc = 0;
    c.cats.forEach(k => {
      let e = 0, p = 0;
      c.assign.filter(a => a.cat === k.id && P.num(a.points) > 0).forEach(a => { const v = txt((c.scores[a.id] || {})[sid]).trim(); if (!v) return; e += /^m$/i.test(v) ? 0 : P.num(v); p += P.num(a.points); });
      const w = P.num(k.weight);
      if (p > 0 && w > 0) { wsum += w; acc += w * e / p; }
    });
    return wsum ? r1(acc / wsum * 100) : null;
  }
  const letter = (s, pct) => { if (pct == null) return '—'; const l = s.scale.filter(x => P.has(x.letter)).sort((a, b) => P.num(b.min) - P.num(a.min)).find(x => pct >= P.num(x.min)); return l ? l.letter : '—'; };
  function missing(c) {
    const t = D.today(), out = [];
    c.assign.filter(a => P.has(a.name) && a.date && a.date < t).forEach(a => c.students.filter(st => P.has(st.name)).forEach(st => {
      const v = txt((c.scores[a.id] || {})[st.id]).trim(); if (!v || /^m$/i.test(v)) out.push({ a, st });
    }));
    return out;
  }
  const classChips = (s, label) => (s.classes.length > 1 ? `<div class="te-bar">${u.chips('ui.cls', cur(s).id, s.classes.map(c => [c.id, c.name || 'Unnamed']), label || 'Class')}</div>` : '');
  const noClass = () => u.empty('user', 'No classes yet', 'Add a class and its students on Classes.', u.btn('Open Classes', { kind: 'world', icon: 'user', act: 'go', data: { page: 'classes' } }));
  function birthdays(s, from, n) {
    const out = [];
    for (let i = 0; i < n; i++) { const d = D.add(from, i), md = d.slice(5); allStudents(s).filter(x => x.bday && x.bday.slice(5) === md).forEach(x => out.push({ d, x })); }
    return out;
  }

  /* ---------- today ---------- */
  const today = {
    id: 'today', label: 'Today', icon: 'star',
    render(ctx) {
      const s = ctx.state, w = weekOf(D.today()), list = periodsOn(s, w.d);
      return `${u.head({ eyebrow: w.ahead ? `Next school day · ${D.long(w.date)}` : D.long(w.date), title: '<span data-slot="title"></span>', lede: 'Your classes with today’s plan, who’s out, duties and the to-do list.' })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel(w.ahead ? `${DAYS[0]}’s classes` : 'Today’s classes', list.length ? `<ol class="te-day">${list.map(p => { const c = clsOf(s, s.timetable[w.d][p.id]), l = lesson(s, w.mon, w.d, p.id);
          return `<li><span class="te-time"><b>${esc(p.label || 'Period')}</b>${esc(timeOf(p))}</span><div class="te-day-main"><span class="te-cls">${esc(c.name || 'Class')}${c.room ? ` · ${esc(c.room)}` : ''}</span>
            <p class="te-obj">${l.obj ? esc(l.obj) : '<span class="pl-muted">No plan yet</span>'}</p>${l.hw ? `<p class="pl-muted te-hw">Homework: ${esc(l.hw)}</p>` : ''}</div></li>`; }).join('')}</ol>`
          : u.empty('calendar', 'No classes on the schedule', 'Set the bell schedule and timetable on Classes.', u.btn('Open Classes', { kind: 'world', icon: 'calendar', act: 'go', data: { page: 'classes' } })), { icon: 'calendar', cls: 'pl-7', actions: u.btn('Lessons', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'lessons' } }) })}
        ${u.panel('To-do', `${u.quickAdd('todos', { ph: 'Add a to-do and press Enter', label: 'Add a to-do', kind: 'world' })}<div class="xm-gap"></div>${u.checklist('todos', s.todos, { ph: 'To-do', what: 'to-do', rerender: true, empty: 'Nothing on the list.' })}`, { icon: 'check', cls: 'pl-5' })}
        ${u.panel('Out today', '<div data-slot="out"></div>', { icon: 'user', cls: 'pl-4', actions: u.btn('Attendance', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'attendance' } }) })}
        ${u.panel('Duties', (() => { const l = s.duties.filter(x => P.has(x.text) && (x.day === '' || +x.day === w.d)); return l.length ? `<ul class="te-list">${l.map(x => `<li><b>${esc(x.text)}</b>${x.time ? `<span class="pl-muted">${esc(D.time(x.time))}</span>` : ''}</li>`).join('')}</ul>` : '<p class="pl-muted">No duties today.</p>'; })(), { icon: 'timer', cls: 'pl-4' })}
        ${u.panel('Birthdays this week', (() => { const l = birthdays(s, D.today(), 7); return l.length ? `<ul class="te-list">${l.map(({ d, x }) => `<li><b>${esc(x.name)}</b><span class="pl-muted">${esc(D.day(d))} ${esc(D.short(d))} · ${esc(x.cls)}</span></li>`).join('')}</ul>` : '<p class="pl-muted">No birthdays in the next 7 days.</p>'; })(), { icon: 'gift', cls: 'pl-4' })}
      </div>
      ${u.notes('notes', s.notes, { rows: 3, title: 'Notes', ph: 'Reminders, sub notes, ideas…' })}`;
    },
    slots: {
      title(ctx) {
        const s = ctx.state, w = weekOf(D.today()), n = periodsOn(s, w.d).length, who = s.teacher.name;
        return n ? `<em>${n}</em> ${n === 1 ? 'class' : 'classes'} ${w.ahead ? 'on Monday' : 'today'}${who ? `, ${esc(who)}` : ''}` : 'Your <em>day</em>';
      },
      kpis(ctx) {
        const s = ctx.state, t = D.today(), out = s.classes.reduce((a, c) => a + c.students.filter(st => ['A', 'E'].includes(code(s, c.id, t, st.id))).length, 0);
        const miss = s.classes.reduce((a, c) => a + missing(c).length, 0), open = s.todos.filter(x => P.has(x.text) && !x.done).length, w = weekOf(t);
        return u.kpis([['Classes', String(periodsOn(s, w.d).length), 'y-kpi--world', w.ahead ? 'on Monday' : 'today'], ['Out today', String(out), out ? 'y-kpi--accent' : '', 'absent or excused'],
          ['Missing work', String(miss), miss ? '' : 'is-good', 'across your classes'], ['To-dos', String(open), open ? '' : 'is-good', 'still open']]);
      },
      out(ctx) {
        const s = ctx.state, t = D.today(), l = s.classes.flatMap(c => c.students.filter(st => code(s, c.id, t, st.id)).map(st => ({ c, st, k: code(s, c.id, t, st.id) })));
        return l.length ? `<ul class="te-list">${l.map(({ c, st, k }) => `<li><b>${esc(st.name)}</b><span class="te-code te-${k}">${CODE[k][0]}</span><span class="pl-muted">${esc(c.name)}</span></li>`).join('')}</ul>` : '<p class="pl-muted">Everyone’s here so far.</p>';
      }
    },
    sheet(ctx) {
      const s = ctx.state, w = weekOf(D.today());
      return `<h1>${esc(D.long(w.date))}</h1><p class="pl-sheet-meta">${esc([s.teacher.name, s.teacher.school].filter(Boolean).join(' · '))}</p>
        <table><thead><tr><th>Time</th><th>Class</th><th>Objective</th><th>Activities</th><th>Homework</th></tr></thead><tbody>${periodsOn(s, w.d).map(p => { const c = clsOf(s, s.timetable[w.d][p.id]), l = lesson(s, w.mon, w.d, p.id);
          return `<tr><td>${esc(p.label)}<br>${esc(timeOf(p))}</td><td><b>${esc(c.name)}</b></td><td>${esc(l.obj || '')}</td><td>${esc(l.act || '')}</td><td>${esc(l.hw || '')}</td></tr>`; }).join('')}</tbody></table>
        <h2>To-do</h2><table><tbody>${s.todos.filter(x => P.has(x.text) && !x.done).map(x => `<tr><td style="width:6mm"><span class="pl-box"></span></td><td>${esc(x.text)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- lessons ---------- */
  const lessons = {
    id: 'lessons', label: 'Lessons', icon: 'doc',
    render(ctx) {
      const s = ctx.state, c = cur(s);
      if (!c) return `${u.head({ eyebrow: 'Lesson plans', title: 'Plan the <em>week</em>' })}${noClass()}`;
      const mon = wk(s), isThis = mon === D.monday(D.today()), hasPrev = !!s.lessons[D.add(mon, -7)];
      return `${u.head({ eyebrow: `${c.name || 'Class'} · lesson plans`, title: `Week of <em>${esc(D.short(mon))}</em>`, lede: 'One card per day for this class. Copy last week and change what’s new.',
        meta: `<div class="te-nav" role="group" aria-label="Choose a week">${u.iconBtn('prev', 'Previous week', 'week', { n: -7 })}<span class="y-num">${esc(D.short(mon))} – ${esc(D.short(D.add(mon, 4)))}</span>${u.iconBtn('next', 'Next week', 'week', { n: 7 })}${isThis ? '' : u.btn('This week', { sm: true, act: 'week', data: { n: 0 } })}</div>` })}
      ${classChips(s)}
      <div class="pl-row te-tools">${hasPrev ? u.btn('Copy last week', { sm: true, icon: 'doc', act: 'copyWeek' }) : ''}</div>
      <div class="te-week">${DAYS.map((day, d) => { const ps = s.periods.filter(p => s.timetable[d][p.id] === c.id);
        return `<article class="te-lday"><h3>${day} <span class="pl-muted y-num">${esc(D.short(D.add(mon, d)))}</span></h3>${ps.length ? ps.map(p => { const l = lesson(s, mon, d, p.id), b = `lessons.${mon}.${d}.${p.id}`;
          return `<div class="te-lp"><span class="te-lp-time">${esc(p.label)} · ${esc(timeOf(p))}</span>${FIELDS.map(([f, label, ph]) => u.field(label, `${b}.${f}`, l[f] || '', { type: f === 'act' ? 'textarea' : 'text', rows: 2, ph })).join('')}</div>`; }).join('')
          : '<p class="pl-muted">Not on the timetable this day.</p>'}</article>`; }).join('')}</div>`;
    },
    actions: {
      week(ctx, d) { const s = ctx.state; s.ui.week = +d.n === 0 ? D.monday(D.today()) : D.add(wk(s), +d.n); },
      copyWeek(ctx) {
        const s = ctx.state, mon = wk(s), prev = s.lessons[D.add(mon, -7)], c = cur(s);
        if (!prev || !c) return false;
        const next = s.lessons[mon] = s.lessons[mon] || DAYS.map(() => ({}));
        DAYS.forEach((_, d) => s.periods.filter(p => s.timetable[d][p.id] === c.id).forEach(p => { if (prev[d] && prev[d][p.id]) next[d][p.id] = P.clone(prev[d][p.id]); }));
        ctx.toast(`Copied last week for ${c.name || 'this class'}`);
      }
    },
    sheet(ctx) {
      const s = ctx.state, c = cur(s), mon = wk(s);
      if (!c) return '<p>No classes yet.</p>';
      return `<h1>${esc(c.name)} · week of ${esc(D.full(mon))}</h1><p class="pl-sheet-meta">${esc([s.teacher.name, c.room && `Room ${c.room}`].filter(Boolean).join(' · '))}</p>
        <table><thead><tr><th>Day</th>${FIELDS.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody>${DAYS.map((day, d) => s.periods.filter(p => s.timetable[d][p.id] === c.id).map(p => { const l = lesson(s, mon, d, p.id);
          return `<tr><td><b>${day}</b><br>${esc(p.label)}</td>${FIELDS.map(([f]) => `<td>${esc(l[f] || '')}</td>`).join('')}</tr>`; }).join('')).join('')}</tbody></table>`;
    }
  };

  /* ---------- classes ---------- */
  const classes = {
    id: 'classes', label: 'Classes', icon: 'user',
    render(ctx) {
      const s = ctx.state, c = cur(s), ci = c ? s.classes.indexOf(c) : -1;
      const opts = s.classes.map(x => [x.id, x.name || 'Unnamed']);
      return `${u.head({ eyebrow: 'Classes', title: c ? `<em>${esc(c.name || 'Class')}</em> · ${P.plural(c.students.filter(x => P.has(x.name)).length, 'student')}` : 'Your <em>classes</em>', lede: 'Rosters, the bell schedule and who teaches what when. Keep notes short and kind — this stays on your device.' })}
      <div class="pl-row te-tools">${s.classes.length > 1 ? u.chips('ui.cls', c.id, opts, 'Class') : ''}<span class="pl-spacer"></span>${u.btn('New class', { sm: true, kind: 'world', icon: 'plus', act: 'newClass' })}</div>
      ${c ? `<div class="pl-grid">
        ${u.panel('Class', `<div class="pl-fields">${u.field('Name', `classes.${ci}.name`, c.name, { ph: 'Math 5A' })}${u.field('Room', `classes.${ci}.room`, c.room, { ph: '112' })}</div>
          <div class="pl-list-foot">${u.btn('Delete this class', { sm: true, kind: 'ghost', icon: 'trash', act: 'remove', data: { list: 'classes', i: ci, what: c.name } })}</div>`, { icon: 'edit', cls: 'pl-4' })}
        ${u.panel('Roster', `${u.quickAdd(`classes.${ci}.students`, { key: 'name', ph: 'Add a student and press Enter', label: 'Add a student', kind: 'world' })}<div class="xm-gap"></div>
          ${u.table(`classes.${ci}.students`, c.students, [
            { k: 'name', label: 'Student', title: true, w: '1.1fr', ph: 'Name' }, { k: 'bday', label: 'Birthday', type: 'date', w: '150px' },
            { k: 'parent', label: 'Parent / guardian', w: '1fr', ph: 'Name' }, { k: 'phone', label: 'Phone or email', w: '1fr', ph: 'Contact' },
            { k: 'notes', label: 'Notes', w: '1.2fr', ph: 'Seating, supports, reminders' }
          ], { what: 'student', empty: 'Type a name above and press Enter.', cls: 'te-roster' })}`, { icon: 'user', cls: 'pl-8' })}
      </div>` : noClass()}
      ${u.panel('Bell schedule + timetable', `<div class="te-scroll"><table class="te-tt"><thead><tr><th>Period</th><th>Start</th><th>End</th>${DAYS.map(d => `<th>${d.slice(0, 3)}</th>`).join('')}<th><span class="y-sr">Remove</span></th></tr></thead><tbody>
        ${s.periods.map((p, i) => `<tr><td>${u.input(`periods.${i}.label`, p.label, { label: `Period ${i + 1} name`, ph: 'Period' })}</td><td>${u.input(`periods.${i}.start`, p.start, { type: 'time', label: `Period ${i + 1} start` })}</td><td>${u.input(`periods.${i}.end`, p.end, { type: 'time', label: `Period ${i + 1} end` })}</td>
          ${DAYS.map((d, k) => `<td>${u.select(`timetable.${k}.${p.id}`, s.timetable[k][p.id] || '', opts, { label: `${d} ${p.label}`, blank: '—', rerender: true })}</td>`).join('')}<td>${u.iconBtn('close', `Remove ${p.label || 'period'}`, 'remove', { list: 'periods', i, what: p.label })}</td></tr>`).join('')}
      </tbody></table></div><div class="pl-list-foot">${u.add('Add period', 'periods')}</div>`, { icon: 'calendar' })}
      <div class="pl-grid">
        ${u.panel('Parent contact log', `${s.contacts.length ? u.table('contacts', s.contacts, [
            { k: 'date', label: 'Date', type: 'date', w: '150px' }, { k: 'sid', label: 'Student', type: 'select', options: allStudents(s).map(x => [x.id, `${x.name} · ${x.cls}`]), blank: 'Choose…', w: '1fr' },
            { k: 'method', label: 'How', type: 'select', options: METHODS, w: '130px' }, { k: 'note', label: 'Notes', title: true, w: '1.6fr', ph: 'What you talked about' },
            { k: 'follow', label: 'Follow up', type: 'check', w: '84px' }], { what: 'contact', cls: 'te-contacts' }) : '<p class="pl-muted">No contacts logged yet.</p>'}
          <div class="pl-list-foot">${u.add('Log a contact', 'contacts', { kind: 'world', at: 'top' })}</div>`, { icon: 'mail' })}
        ${u.panel('Duties + meetings', u.table('duties', s.duties, [
            { k: 'day', label: 'Day', type: 'select', options: [['', 'Every day']].concat(DAYS.map((d, i) => [String(i), d])), w: '130px' },
            { k: 'text', label: 'Duty', title: true, w: '1fr', ph: 'Lunch duty' }, { k: 'time', label: 'Time', type: 'time', w: '140px' }], { what: 'duty', add: 'Add duty' }), { icon: 'timer' })}
      </div>
      ${u.panel('About you', `<div class="pl-fields">${u.field('Your name', 'teacher.name', s.teacher.name, { ph: 'Ms. Rivera' })}${u.field('School', 'teacher.school', s.teacher.school, { ph: 'School name' })}${u.field('Grade / subject', 'teacher.grade', s.teacher.grade, { ph: '5th grade' })}${u.field('School year', 'teacher.year', s.teacher.year, { ph: '2026–27' })}</div>`, { icon: 'edit' })}`;
    },
    actions: {
      newClass(ctx) { const s = ctx.state, c = klass({ name: '' }); s.classes.push(c); s.ui.cls = c.id; ctx.focus(`[data-bind="classes.${s.classes.length - 1}.name"]`); }
    },
    sheet(ctx) {
      const s = ctx.state, c = cur(s);
      if (!c) return '<p>No classes yet.</p>';
      return `<h1>${esc(c.name)} · class list</h1><p class="pl-sheet-meta">${esc([s.teacher.name, c.room && `Room ${c.room}`, P.plural(c.students.length, 'student')].filter(Boolean).join(' · '))}</p>
        <table><thead><tr><th>Student</th><th>Parent / guardian</th><th>Contact</th><th>Notes</th></tr></thead><tbody>${c.students.filter(x => P.has(x.name)).map(x => `<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.parent)}</td><td>${esc(x.phone)}</td><td>${esc(x.notes)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- attendance ---------- */
  const attendance = {
    id: 'attendance', label: 'Attendance', icon: 'check',
    render(ctx) {
      const s = ctx.state, c = cur(s);
      if (!c) return `${u.head({ eyebrow: 'Attendance', title: 'Take <em>attendance</em>' })}${noClass()}`;
      const date = s.ui.adate, taken = (s.taken[c.id] || []).includes(date), list = c.students.filter(x => P.has(x.name));
      return `${u.head({ eyebrow: `${c.name || 'Class'} · attendance`, title: '<span data-slot="title"></span>', lede: 'Everyone starts present. Tap a student to cycle absent → late → excused → present.' })}
      ${classChips(s)}
      <div class="pl-row te-tools"><div class="te-date">${u.field('Date', 'ui.adate', date, { type: 'date', rerender: true })}</div>${taken ? u.pill('taken', 'good') : u.btn('Everyone’s here', { sm: true, kind: 'world', icon: 'check', act: 'allHere' })}</div>
      <div data-slot="kpis"></div>
      ${list.length ? `<ul class="te-att">${list.map(st => { const k = code(s, c.id, date, st.id), n = counts(s, c, st.id);
        return `<li><button type="button" class="te-mark te-${k || 'P'}" data-act="mark" data-sid="${esc(st.id)}" aria-label="${esc(st.name)}: ${CODE[k][0]}. Tap to change"><span class="te-mark-code">${CODE[k][1]}</span><span class="te-mark-name">${esc(st.name)}</span><span class="te-mark-sum">${n.A ? `${n.A} absent` : ''}${n.L ? `${n.A ? ' · ' : ''}${n.L} late` : ''}</span></button></li>`; }).join('')}</ul>`
        : u.empty('user', 'No students yet', 'Add the roster on Classes.')}`;
    },
    slots: {
      title(ctx) { const s = ctx.state, c = cur(s), d = s.ui.adate, out = c.students.filter(st => code(s, c.id, d, st.id)).length; return out ? `${esc(D.fmt(d))} · <em>${out}</em> not here` : `${esc(D.fmt(d))} · <em>all here</em>`; },
      kpis(ctx) {
        const s = ctx.state, c = cur(s), r = rate(s, c), days = (s.taken[c.id] || []).length;
        const most = c.students.map(st => [st, counts(s, c, st.id).A]).filter(x => x[1]).sort((a, b) => b[1] - a[1])[0];
        return u.kpis([['Attendance rate', r == null ? '—' : `${r}%`, 'y-kpi--world', `${P.plural(days, 'day')} taken`], ['Absent on this day', String(c.students.filter(st => ['A', 'E'].includes(code(s, c.id, s.ui.adate, st.id))).length), ''],
          ['Most absences', most ? esc(most[0].name) : '—', '', most ? P.plural(most[1], 'day') : 'none so far']]);
      }
    },
    actions: {
      mark(ctx, d) {
        const s = ctx.state, c = cur(s), date = s.ui.adate, a = s.att[c.id] = s.att[c.id] || {}, day = a[date] = a[date] || {};
        const next = CODES[(CODES.indexOf(day[d.sid] || '') + 1) % CODES.length];
        if (next) day[d.sid] = next; else delete day[d.sid];
        const t = s.taken[c.id] = s.taken[c.id] || []; if (!t.includes(date)) { t.push(date); t.sort(); }
      },
      allHere(ctx) { const s = ctx.state, c = cur(s), t = s.taken[c.id] = s.taken[c.id] || []; if (!t.includes(s.ui.adate)) { t.push(s.ui.adate); t.sort(); } ctx.toast('Marked: everyone’s here'); }
    },
    sheet(ctx) {
      const s = ctx.state, c = cur(s);
      if (!c) return '<p>No classes yet.</p>';
      const days = (s.taken[c.id] || []).slice(-10);
      return `<h1>${esc(c.name)} · attendance</h1><p class="pl-sheet-meta">Last ${days.length} days taken · rate ${rate(s, c) == null ? '—' : rate(s, c) + '%'}</p>
        <table><thead><tr><th>Student</th>${days.map(d => `<th>${esc(D.short(d))}</th>`).join('')}</tr></thead><tbody>${c.students.filter(x => P.has(x.name)).map(st => `<tr><td><b>${esc(st.name)}</b></td>${days.map(d => `<td>${CODE[code(s, c.id, d, st.id)][1]}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- grades ---------- */
  const grades = {
    id: 'grades', label: 'Grades', icon: 'chart',
    render(ctx) {
      const s = ctx.state, c = cur(s);
      if (!c) return `${u.head({ eyebrow: 'Gradebook', title: 'Your <em>gradebook</em>' })}${noClass()}`;
      const ci = s.classes.indexOf(c), list = c.students.filter(x => P.has(x.name)), as = c.assign.filter(a => P.has(a.name));
      const wsum = c.cats.reduce((a, k) => a + P.num(k.weight), 0);
      return `${u.head({ eyebrow: `${c.name || 'Class'} · gradebook`, title: '<span data-slot="title"></span>', lede: 'Type points earned. Leave it empty if it isn’t graded yet; type M for missing (counts as zero).' })}
      ${classChips(s)}
      <div data-slot="kpis"></div>
      ${u.panel('Scores', as.length && list.length ? `<div class="te-scroll"><table class="te-grid"><thead><tr><th class="te-sticky">Student</th>${as.map(a => `<th title="${esc(a.name)}"><span class="te-an">${esc(a.name)}</span><span class="pl-muted y-num">/${esc(a.points)}</span></th>`).join('')}<th>Average</th><th>Grade</th></tr></thead><tbody>
          ${list.map(st => `<tr><th class="te-sticky" scope="row">${esc(st.name)}</th>${as.map(a => `<td>${u.input(`classes.${ci}.scores.${a.id}.${st.id}`, (c.scores[a.id] || {})[st.id] || '', { label: `${st.name}: ${a.name}`, ph: '–', cls: 'te-score' })}</td>`).join('')}
            <td class="y-num te-avg" data-slot="avg" data-arg="${esc(st.id)}"></td><td class="te-letter" data-slot="letter" data-arg="${esc(st.id)}"></td></tr>`).join('')}</tbody></table></div>`
        : '<p class="pl-muted">Add students on Classes and an assignment below to start the gradebook.</p>', { icon: 'chart' })}
      <div class="pl-grid">
        ${u.panel('Assignments', `${u.quickAdd(`classes.${ci}.assign`, { key: 'name', ph: 'Add an assignment and press Enter', label: 'Add an assignment', kind: 'world' })}<div class="xm-gap"></div>
          ${u.table(`classes.${ci}.assign`, c.assign, [
            { k: 'name', label: 'Assignment', title: true, w: '1.4fr', ph: 'Name' }, { k: 'cat', label: 'Category', type: 'select', options: c.cats.map(k => [k.id, k.name || 'Unnamed']), blank: 'Choose…', w: '140px' },
            { k: 'points', label: 'Points', num: true, w: '90px', ph: '10' }, { k: 'date', label: 'Due', type: 'date', w: '150px' }], { what: 'assignment', cls: 'te-assign' })}`, { icon: 'list', cls: 'pl-8' })}
        ${u.panel('Categories', `${u.table(`classes.${ci}.cats`, c.cats, [{ k: 'name', label: 'Category', title: true, w: '1fr', ph: 'Homework' }, { k: 'weight', label: 'Weight %', num: true, w: '96px', ph: '20' }], { what: 'category', add: 'Add category', tpl: 'cats' })}
          ${Math.abs(wsum - 100) > 0.5 ? `<p class="pl-hint">Weights add up to ${r1(wsum)}% — the average still works, scaled to the weights in use.</p>` : ''}`, { icon: 'chart', cls: 'pl-4' })}
        ${u.panel('Missing work', '<div data-slot="missing"></div>', { icon: 'warn', cls: 'pl-8' })}
        ${u.panel('Grading scale', u.table('scale', s.scale, [{ k: 'letter', label: 'Grade', title: true, w: '1fr', ph: 'A' }, { k: 'min', label: 'From %', num: true, w: '96px', ph: '90' }], { what: 'grade', add: 'Add grade', tpl: 'scale' }), { icon: 'award', cls: 'pl-4' })}
      </div>`;
    },
    slots: {
      title(ctx) { const s = ctx.state, c = cur(s), av = c.students.map(st => average(c, st.id)).filter(x => x != null); return av.length ? `Class average <em>${r1(av.reduce((a, x) => a + x, 0) / av.length)}%</em>` : 'Your <em>gradebook</em>'; },
      kpis(ctx) {
        const s = ctx.state, c = cur(s), av = c.students.map(st => average(c, st.id)).filter(x => x != null), bottom = (s.scale.filter(y => P.has(y.letter)).sort((x, y) => P.num(x.min) - P.num(y.min))[0] || {}).letter, low = av.filter(x => letter(s, x) === bottom).length;
        return u.kpis([['Assignments', String(c.assign.filter(a => P.has(a.name)).length), 'y-kpi--world'], ['Missing', String(missing(c).length), missing(c).length ? 'y-kpi--accent' : 'is-good', 'past due, no score'],
          ['Below passing', String(low), low ? '' : 'is-good', 'students']]);
      },
      avg(ctx, sid) { const v = average(cur(ctx.state), sid); return v == null ? '—' : `${v}%`; },
      letter(ctx, sid) { const s = ctx.state, l = letter(s, average(cur(s), sid)); return `<span class="te-lg te-lg-${esc(l.charAt(0))}">${esc(l)}</span>`; },
      missing(ctx) {
        const l = missing(cur(ctx.state));
        if (!l.length) return '<p class="pl-muted">Nothing missing.</p>';
        const by = {}; l.forEach(({ a, st }) => { (by[st.name] = by[st.name] || []).push(a.name); });
        return `<ul class="te-list">${Object.entries(by).map(([n, as]) => `<li><b>${esc(n)}</b><span class="pl-muted">${esc(as.join(' · '))}</span></li>`).join('')}</ul>`;
      }
    },
    sheet(ctx) {
      const s = ctx.state, c = cur(s);
      if (!c) return '<p>No classes yet.</p>';
      const as = c.assign.filter(a => P.has(a.name));
      return `<h1>${esc(c.name)} · gradebook</h1><p class="pl-sheet-meta">${esc(D.full(D.today()))}</p>
        <table><thead><tr><th>Student</th>${as.map(a => `<th>${esc(a.name)} /${esc(a.points)}</th>`).join('')}<th>Avg</th><th>Grade</th></tr></thead><tbody>${c.students.filter(x => P.has(x.name)).map(st => { const v = average(c, st.id);
          return `<tr><td><b>${esc(st.name)}</b></td>${as.map(a => `<td>${esc((c.scores[a.id] || {})[st.id] || '')}</td>`).join('')}<td>${v == null ? '—' : v + '%'}</td><td>${esc(letter(s, v))}</td></tr>`; }).join('')}</tbody></table>`;
    }
  };

  /* ---------- seating ---------- */
  const seating = {
    id: 'seating', label: 'Seating', icon: 'grid',
    render(ctx) {
      const s = ctx.state, c = cur(s);
      if (!c) return `${u.head({ eyebrow: 'Seating chart', title: 'Who sits <em>where</em>' })}${noClass()}`;
      const ci = s.classes.indexOf(c), rows = +c.rows, cols = +c.cols, n = rows * cols, sel = s.ui.seat === '' ? -1 : +s.ui.seat;
      const byId = Object.fromEntries(c.students.map(x => [x.id, x])), placed = new Set(Object.values(c.seats)), free = c.students.filter(x => P.has(x.name) && !placed.has(x.id));
      return `${u.head({ eyebrow: `${c.name || 'Class'} · seating chart`, title: 'Who sits <em>where</em>', lede: 'Tap a seat, then tap a student to put them there. Front of the room is at the top.' })}
      ${classChips(s)}
      <div class="pl-row te-tools"><div class="te-rc">${u.field('Rows', `classes.${ci}.rows`, c.rows, { num: true, rerender: true })}${u.field('Seats per row', `classes.${ci}.cols`, c.cols, { num: true, rerender: true })}</div>
        <span class="pl-spacer"></span>${u.btn('Shuffle', { sm: true, icon: 'shuffle', act: 'shuffle' })}${u.btn('Clear all', { sm: true, kind: 'ghost', icon: 'close', act: 'clearSeats' })}</div>
      ${u.panel('', `<p class="te-front">Front of the room</p><div class="te-seats" style="--cols:${cols}">${Array.from({ length: n }, (_, i) => { const st = byId[c.seats[i]];
        return `<button type="button" class="te-seat${st ? ' is-full' : ''}${i === sel ? ' is-sel' : ''}" data-act="seat" data-i="${i}" aria-pressed="${i === sel}" aria-label="Seat ${i + 1}${st ? `: ${esc(st.name)}` : ', empty'}">${st ? esc(st.name) : `<span class="pl-muted">${i + 1}</span>`}</button>`; }).join('')}</div>
        ${sel >= 0 ? `<div class="te-pick"><p><b>Seat ${sel + 1}</b> — tap a student:</p><div class="te-pick-list">${c.students.filter(x => P.has(x.name)).map(x => `<button type="button" class="y-chip pl-chip${c.seats[sel] === x.id ? ' is-on' : ''}" data-act="place" data-sid="${esc(x.id)}">${esc(x.name)}</button>`).join('')}
          ${c.seats[sel] ? u.btn('Empty this seat', { sm: true, kind: 'ghost', icon: 'close', act: 'place', data: { sid: '' } }) : ''}</div></div>` : ''}
        ${free.length ? `<p class="pl-hint">Not seated yet: ${free.map(x => esc(x.name)).join(', ')}${free.length > n - placed.size ? ' — add a row for more seats.' : ''}</p>` : ''}`, { cls: 'te-room' })}`;
    },
    actions: {
      seat(ctx, d) { const s = ctx.state; s.ui.seat = String(s.ui.seat) === d.i ? '' : d.i; },
      place(ctx, d) {
        const s = ctx.state, c = cur(s), i = s.ui.seat;
        if (i === '') return false;
        Object.keys(c.seats).forEach(k => { if (c.seats[k] === d.sid) delete c.seats[k]; });
        if (d.sid) c.seats[i] = d.sid; else delete c.seats[i];
        s.ui.seat = '';
      },
      shuffle(ctx) {
        const s = ctx.state, c = cur(s), n = +c.rows * +c.cols, l = c.students.filter(x => P.has(x.name)).map(x => x.id);
        for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
        const seats = Array.from({ length: n }, (_, i) => i);
        for (let i = seats.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [seats[i], seats[j]] = [seats[j], seats[i]]; }
        c.seats = {}; l.slice(0, n).forEach((sid, k) => { c.seats[seats[k]] = sid; }); s.ui.seat = '';
        ctx.toast(l.length > n ? `Shuffled — ${l.length - n} need a seat` : 'Shuffled');
      },
      clearSeats(ctx) { const s = ctx.state; cur(s).seats = {}; s.ui.seat = ''; }
    },
    sheet(ctx) {
      const s = ctx.state, c = cur(s);
      if (!c) return '<p>No classes yet.</p>';
      const byId = Object.fromEntries(c.students.map(x => [x.id, x])), cols = +c.cols;
      return `<h1>${esc(c.name)} · seating chart</h1><p class="pl-sheet-meta">Front of the room</p><table class="te-print-seats"><tbody>${Array.from({ length: +c.rows }, (_, r) => `<tr>${Array.from({ length: cols }, (_, k) => { const st = byId[c.seats[r * cols + k]]; return `<td style="height:16mm;text-align:center">${st ? `<b>${esc(st.name)}</b>` : ''}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
    }
  };

  P.create({
    slug: 'teacher-planner-app', name: 'Teacher Planner', world: 'chalk',
    welcome: 'Add your classes and the bell schedule on Classes — Today and Lessons fill in from the timetable.',
    pages: [today, lessons, classes, attendance, grades, seating],
    blank, sample, normalize,
    rows: { todos: () => todo(), students: () => student(), periods: () => period({ label: 'Period' }), contacts: () => contact(), duties: () => duty(), assign: () => assign({ date: D.today() }),
      cats: () => cat('', ''), scale: () => ({ letter: '', min: '' }), classes: () => klass() },
    about: '<p><b>Teacher Planner</b> keeps a teacher’s week in one place: today’s classes with the plan for each, weekly lesson plans per class, rosters and the bell schedule, one-tap attendance, a weighted gradebook with missing work, seating charts and a parent contact log.</p>',
    disclaimer: 'Teacher Planner keeps student information only on your own device. Follow your school’s privacy rules for what you store and print.'
  });
})();
