/* Student Planner App — today, class schedule, assignments, exams, grades + GPA, study timer and flashcards. Yaykit planner engine, study world.
   New product; the study timer follows the ADHD Planner focus page and the flashcards follow Interview Prep. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const txt = v => (v == null ? '' : String(v));
  const r1 = n => Math.round(n * 10) / 10;
  const list = v => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object');

  /* ---------- constants ---------- */
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const DAY_NAME = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
  const KINDS = ['Lecture', 'Seminar', 'Lab', 'Tutorial', 'Study group', 'Other'];
  const TYPES = ['Homework', 'Reading', 'Essay', 'Project', 'Lab report', 'Quiz', 'Presentation', 'Other'];
  const COLORS = [['0', 'Indigo'], ['1', 'Mint'], ['2', 'Coral'], ['3', 'Sun'], ['4', 'Sky'], ['5', 'Plum'], ['6', 'Leaf'], ['7', 'Rose']];
  const BLOCKS = [[25, 'Pomodoro', '25 minutes'], [50, 'Deep work', '50 minutes'], [5, 'Short break', '5 minutes'], [15, 'Long break', '15 minutes']];
  const LEVELS = [['0', 'New'], ['1', 'Again'], ['2', 'Almost'], ['3', 'Know it']];
  const LV = Object.fromEntries(LEVELS);
  /* a common US 4.0 scale; schools differ, the app says so */
  const SCALE = [[93, 'A', 4], [90, 'A-', 3.7], [87, 'B+', 3.3], [83, 'B', 3], [80, 'B-', 2.7], [77, 'C+', 2.3], [73, 'C', 2], [70, 'C-', 1.7], [67, 'D+', 1.3], [63, 'D', 1], [60, 'D-', 0.7], [0, 'F', 0]];
  const letter = pct => SCALE.find(x => pct >= x[0]) || SCALE[SCALE.length - 1];
  const dayOf = iso => DAYS[((D.parse(iso) || new Date()).getDay() + 6) % 7];

  /* ---------- records ---------- */
  const course = o => Object.assign({ id: P.uid(), name: '', code: '', teacher: '', room: '', credits: '3', color: '0', target: '90', items: [] }, o || {});
  const gradeItem = o => Object.assign({ name: '', weight: '', score: '' }, o || {});
  const klass = o => Object.assign({ id: P.uid(), course: '', day: 'Mon', start: '', end: '', room: '', kind: 'Lecture' }, o || {});
  const task = o => Object.assign({ id: P.uid(), title: '', course: '', due: '', type: 'Homework', done: false }, o || {});
  const exam = o => Object.assign({ id: P.uid(), course: '', title: 'Exam', date: '', time: '', room: '', topics: [] }, o || {});
  const topic = o => Object.assign({ text: '', done: false }, o || {});
  const card = o => Object.assign({ id: P.uid(), course: '', q: '', a: '', level: '0' }, o || {});

  function blank() { return { term: '', courses: [], classes: [], tasks: [], exams: [], log: [], cards: [], notes: '', ui: {} }; }
  function normalize(s) {
    s.term = txt(s.term); s.notes = txt(s.notes);
    s.courses = list(s.courses).map(c => { const x = course(c); x.items = list(x.items).map(gradeItem); if (!COLORS.some(k => k[0] === x.color)) x.color = '0'; return x; });
    s.classes = list(s.classes).map(c => { const x = klass(c); if (!DAYS.includes(x.day)) x.day = 'Mon'; return x; });
    s.tasks = list(s.tasks).map(t => { const x = task(t); x.done = !!x.done; return x; });
    s.exams = list(s.exams).map(e => { const x = exam(e); x.topics = list(x.topics).map(topic); return x; });
    s.log = list(s.log).filter(x => x.date && P.num(x.mins) > 0).map(x => ({ date: txt(x.date), time: txt(x.time), mins: Math.round(P.num(x.mins)), course: txt(x.course), label: txt(x.label) }));
    s.cards = list(s.cards).map(c => { const x = card(c); if (!LV[x.level]) x.level = '0'; return x; });
    s.ui = Object.assign({ af: 'open', cc: 'all', idx: 0, flip: false, study: '' }, s.ui && typeof s.ui === 'object' ? s.ui : {});
    return s;
  }
  function sample() {
    const s = blank(), t = D.today(), mon = D.monday(t);
    const C = [
      course({ name: 'Intro to Biology', code: 'BIO 101', teacher: 'Dr. Okafor', room: 'Science 210', credits: '4', color: '1', target: '90',
        items: [['Lab reports', 20, 91], ['Quizzes', 15, 86], ['Midterm', 25, 84], ['Final exam', 40, '']].map(([name, weight, score]) => gradeItem({ name, weight: String(weight), score: String(score) })) }),
      course({ name: 'Calculus I', code: 'MATH 151', teacher: 'Prof. Lindqvist', room: 'Hall B 104', credits: '4', color: '0', target: '85',
        items: [['Homework', 20, 95], ['Quizzes', 10, 78], ['Midterm 1', 20, 81], ['Midterm 2', 20, ''], ['Final exam', 30, '']].map(([name, weight, score]) => gradeItem({ name, weight: String(weight), score: String(score) })) }),
      course({ name: 'Intro to Psychology', code: 'PSY 100', teacher: 'Dr. Haddad', room: 'Arts 12', credits: '3', color: '5', target: '90',
        items: [['Participation', 10, 100], ['Essays', 30, 92], ['Midterm', 25, 88], ['Final exam', 35, '']].map(([name, weight, score]) => gradeItem({ name, weight: String(weight), score: String(score) })) }),
      course({ name: 'English Composition', code: 'ENG 110', teacher: 'Ms. Romero', room: 'Library 3', credits: '3', color: '2', target: '93',
        items: [['Drafts', 20, 96], ['Essay 1', 25, 90], ['Essay 2', 25, ''], ['Portfolio', 30, '']].map(([name, weight, score]) => gradeItem({ name, weight: String(weight), score: String(score) })) })];
    const [bio, calc, psy, eng] = C.map(c => c.id);
    s.term = 'Fall semester';
    s.courses = C;
    s.classes = [
      klass({ course: calc, day: 'Mon', start: '09:00', end: '09:50', kind: 'Lecture' }), klass({ course: bio, day: 'Mon', start: '11:00', end: '12:15', kind: 'Lecture' }),
      klass({ course: eng, day: 'Mon', start: '14:00', end: '15:15', kind: 'Seminar' }), klass({ course: psy, day: 'Tue', start: '10:00', end: '11:15', kind: 'Lecture' }),
      klass({ course: bio, day: 'Tue', start: '13:00', end: '15:50', room: 'Lab 2', kind: 'Lab' }), klass({ course: calc, day: 'Wed', start: '09:00', end: '09:50', kind: 'Lecture' }),
      klass({ course: bio, day: 'Wed', start: '11:00', end: '12:15', kind: 'Lecture' }), klass({ course: eng, day: 'Wed', start: '14:00', end: '15:15', kind: 'Seminar' }),
      klass({ course: psy, day: 'Thu', start: '10:00', end: '11:15', kind: 'Lecture' }), klass({ course: calc, day: 'Thu', start: '16:00', end: '16:50', room: 'Hall B 020', kind: 'Tutorial' }),
      klass({ course: calc, day: 'Fri', start: '09:00', end: '09:50', kind: 'Lecture' }), klass({ course: bio, day: 'Sun', start: '17:00', end: '18:30', room: 'Library study room 4', kind: 'Study group' })];
    s.tasks = [
      task({ title: 'Problem set 7', course: calc, due: D.add(t, -1), type: 'Homework' }),
      task({ title: 'Read chapter 9: Memory', course: psy, due: t, type: 'Reading' }),
      task({ title: 'Lab report: enzyme activity', course: bio, due: D.add(t, 2), type: 'Lab report' }),
      task({ title: 'Essay 2 outline', course: eng, due: D.add(t, 3), type: 'Essay' }),
      task({ title: 'Problem set 8', course: calc, due: D.add(t, 6), type: 'Homework' }),
      task({ title: 'Essay 2 final draft', course: eng, due: D.add(t, 10), type: 'Essay' }),
      task({ title: 'Group presentation slides', course: psy, due: D.add(t, 13), type: 'Presentation' }),
      task({ title: 'Problem set 6', course: calc, due: D.add(t, -6), type: 'Homework', done: true }),
      task({ title: 'Quiz 4 review', course: bio, due: D.add(t, -3), type: 'Quiz', done: true })];
    s.exams = [
      exam({ course: calc, title: 'Midterm 2', date: D.add(t, 5), time: '09:00', room: 'Hall B 104',
        topics: ['Chain rule', 'Implicit differentiation', 'Related rates', 'Linear approximation', 'Practice exam'].map((text, i) => topic({ text, done: i < 2 })) }),
      exam({ course: bio, title: 'Final exam', date: D.add(t, 19), time: '13:00', room: 'Gym',
        topics: ['Cell structure', 'Membranes', 'Enzymes', 'Cell respiration', 'Photosynthesis', 'Genetics'].map((text, i) => topic({ text, done: i < 1 })) })];
    const at = (back, time, mins, c) => ({ date: D.add(t, -back), time, mins, course: c, label: '' });
    s.log = [at(0, '08:10', 25, calc), at(1, '19:30', 50, bio), at(1, '20:30', 25, eng), at(2, '18:00', 50, calc), at(3, '16:20', 25, psy), at(4, '19:00', 50, bio)].filter(x => x.date >= mon || x.date === t);
    s.cards = [
      card({ course: bio, q: 'What does the mitochondrion do?', a: 'Makes ATP through cellular respiration — the cell’s power plant.', level: '3' }),
      card({ course: bio, q: 'Name the 4 stages of cellular respiration.', a: 'Glycolysis → pyruvate oxidation → Krebs cycle → electron transport chain.', level: '2' }),
      card({ course: bio, q: 'What is a competitive inhibitor?', a: 'A molecule that binds the enzyme’s active site and blocks the substrate.', level: '1' }),
      card({ course: bio, q: 'Where does photosynthesis happen?', a: 'In the chloroplasts — light reactions in the thylakoids, Calvin cycle in the stroma.', level: '0' }),
      card({ course: calc, q: 'Chain rule', a: '(f(g(x)))′ = f′(g(x)) · g′(x)', level: '2' }),
      card({ course: calc, q: 'Derivative of sin x', a: 'cos x', level: '3' }),
      card({ course: calc, q: 'Derivative of ln x', a: '1/x (for x > 0)', level: '1' }),
      card({ course: psy, q: 'Classical vs operant conditioning', a: 'Classical: learning by association (Pavlov). Operant: learning by consequences (Skinner).', level: '1' }),
      card({ course: psy, q: 'What is working memory?', a: 'A short-term system that holds and works with about 4 items at once.', level: '0' })];
    s.notes = 'Office hours: Prof. Lindqvist Thu 15:00, Hall B 210.\nAsk Dr. Okafor about the lab make-up.';
    return s;
  }

  /* ---------- helpers ---------- */
  const cById = (s, id) => s.courses.find(c => c.id === id);
  const cName = (s, id) => { const c = cById(s, id); return c ? (c.code || c.name || 'Course') : ''; };
  const cOpts = s => s.courses.map(c => [c.id, c.code ? `${c.code} · ${c.name}` : c.name || 'Untitled course']);
  const dot = (s, id) => { const c = cById(s, id); return `<i class="sp-dot sp-c${c ? esc(c.color) : 'x'}"></i>`; };
  const chip = (s, id) => (cById(s, id) ? `<span class="sp-chip sp-c${esc(cById(s, id).color)}">${esc(cName(s, id))}</span>` : '');
  const byTime = (a, b) => (a.start || '99').localeCompare(b.start || '99');
  const openTasks = s => s.tasks.filter(x => P.has(x.title) && !x.done);
  const late = x => !x.done && x.due && x.due < D.today();
  const upcomingExams = s => s.exams.filter(e => e.date && e.date >= D.today()).sort((a, b) => a.date.localeCompare(b.date));
  const weekMins = (s, c) => s.log.filter(x => x.date >= D.monday(D.today()) && (!c || x.course === c)).reduce((a, x) => a + x.mins, 0);
  const hm = m => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${m} min`);
  function grade(c) {
    const items = c.items.filter(x => P.num(x.weight) > 0), total = items.reduce((a, x) => a + P.num(x.weight), 0);
    const done = items.filter(x => P.has(x.score)), dw = done.reduce((a, x) => a + P.num(x.weight), 0), pts = done.reduce((a, x) => a + P.num(x.weight) * P.num(x.score), 0);
    const avg = dw ? pts / dw : null, left = total - dw, target = P.num(c.target);
    const need = left > 0 && target ? (target * total - pts) / left : null;
    return { avg, total, done: dw, left, need, target, letter: avg == null ? null : letter(avg) };
  }
  function gpa(s) {
    let pts = 0, cr = 0;
    s.courses.forEach(c => { const g = grade(c), k = P.num(c.credits); if (g.avg != null && k > 0) { pts += g.letter[2] * k; cr += k; } });
    return cr ? { gpa: pts / cr, credits: cr } : null;
  }

  /* ---------- today ---------- */
  const today = {
    id: 'today', label: 'Today', icon: 'star',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: s.term || 'This term', title: '<span data-slot="title"></span>', lede: esc(D.long(D.today())) })}
      <div data-slot="kpis"></div>
      <div class="pl-grid">
        ${u.panel('Classes today', '<div data-slot="classes"></div>', { icon: 'calendar', cls: 'pl-5', actions: u.btn('Schedule', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'schedule' } }) })}
        ${u.panel('Due soon', '<div data-slot="due"></div>', { icon: 'check', cls: 'pl-7', actions: u.btn('Assignments', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'tasks' } }) })}
      </div>
      <div data-slot="exam"></div>
      ${u.notes('notes', s.notes, { rows: 4, title: 'Notes', ph: 'Office hours, things to ask, ideas for essays…' })}`;
    },
    slots: {
      title(ctx) {
        const s = ctx.state, n = s.classes.filter(c => c.day === dayOf(D.today()) && cById(s, c.course)).length, due = openTasks(s).filter(x => x.due === D.today()).length;
        if (!s.courses.length) return 'Your whole <em>semester</em> in one place';
        return `<em>${n || 'No'}</em> ${n === 1 ? 'class' : 'classes'} today${due ? ` · ${due} due` : ''}`;
      },
      kpis(ctx) {
        const s = ctx.state, open = openTasks(s), wk = D.add(D.today(), 7), nx = upcomingExams(s)[0], g = gpa(s);
        return u.kpis([
          ['Due this week', String(open.filter(x => x.due && x.due >= D.today() && x.due <= wk).length), 'y-kpi--world', open.filter(late).length ? `${open.filter(late).length} overdue` : 'nothing overdue'],
          ['Next exam', nx ? `${D.diff(D.today(), nx.date)}<small class="sp-of"> days</small>` : '—', nx && D.diff(D.today(), nx.date) <= 7 ? 'is-bad' : '', nx ? `${cName(s, nx.course)} ${nx.title}` : 'none coming up'],
          ['Studied this week', esc(hm(weekMins(s))), '', `${s.log.filter(x => x.date === D.today()).length} sessions today`],
          ['GPA so far', g ? g.gpa.toFixed(2) : '—', 'y-kpi--accent', g ? `${g.credits} credits graded` : 'add grades to see it']]);
      },
      classes(ctx) {
        const s = ctx.state, l = s.classes.filter(c => c.day === dayOf(D.today()) && cById(s, c.course)).sort(byTime);
        if (!l.length) return `<p class="pl-muted">${s.classes.length ? 'No classes today. Good day to get ahead.' : 'Add your classes on the Schedule page.'}</p>`;
        const now = new Date().toTimeString().slice(0, 5);
        return `<ul class="sp-today">${l.map(c => `<li class="sp-c${esc(cById(s, c.course).color)}${c.end && c.end < now ? ' is-past' : ''}"><span class="y-num sp-time">${esc(D.time(c.start) || '—')}</span>
          <span><b>${esc(cById(s, c.course).name || cName(s, c.course))}</b><small>${esc(c.kind)}${c.room || cById(s, c.course).room ? ' · ' + esc(c.room || cById(s, c.course).room) : ''}</small></span></li>`).join('')}</ul>`;
      },
      due(ctx) {
        const s = ctx.state, t = D.today(), l = s.tasks.map((x, i) => Object.assign({ __i: i }, x)).filter(x => P.has(x.title) && !x.done).sort((a, b) => (a.due || 'z').localeCompare(b.due || 'z')).slice(0, 6);
        if (!l.length) return u.empty('check', 'Nothing due', 'Add assignments as soon as you get them.', u.btn('Add assignment', { sm: true, kind: 'world', icon: 'plus', act: 'go', data: { page: 'tasks' } }));
        return `<ul class="pl-checklist">${l.map(x => `<li class="pl-ci">${u.tick(`tasks.${x.__i}.done`, false, `Done: ${x.title}`, { rerender: true })}
          <div class="pl-ci-main"><span class="pl-ci-text">${chip(s, x.course)} ${esc(x.title)}</span><span class="pl-ci-meta${x.due && x.due < t ? ' is-over' : ''}">${x.due ? (x.due < t ? 'was due ' : x.due === t ? 'due today · ' : 'due ') + esc(x.due === t ? x.type.toLowerCase() : D.short(x.due)) : 'no date'}</span></div></li>`).join('')}</ul>`;
      },
      exam(ctx) {
        const s = ctx.state, e = upcomingExams(s)[0];
        if (!e) return '';
        const tp = e.topics.filter(x => P.has(x.text)), done = tp.filter(x => x.done).length;
        return u.panel(`${cName(s, e.course)} ${e.title} · ${D.rel(e.date)}`, `${u.meter(tp.length ? done / tp.length * 100 : 0, 'Topics reviewed')}<p class="pl-muted">${tp.length ? `${done} of ${tp.length} topics reviewed` : 'Add topics to review on the Exams page.'} · ${esc(D.full(e.date))}${e.time ? ' at ' + esc(D.time(e.time)) : ''}</p>`,
          { icon: 'award', cls: 'sp-exam-panel', actions: u.btn('Exams', { sm: true, kind: 'ghost', icon: 'next', act: 'go', data: { page: 'exams' } }) });
      }
    }
  };

  /* ---------- schedule ---------- */
  const schedule = {
    id: 'schedule', label: 'Schedule', icon: 'calendar',
    render(ctx) {
      const s = ctx.state, used = DAYS.filter((d, i) => i < 5 || s.classes.some(c => c.day === d)), td = dayOf(D.today());
      const grid = used.map(d => {
        const l = s.classes.filter(c => c.day === d && cById(s, c.course)).sort(byTime);
        return `<section class="sp-day${d === td ? ' is-today' : ''}"><h3>${esc(DAY_NAME[d])}${d === td ? ' <span class="pl-pill pl-pill--world">Today</span>' : ''}</h3>
          ${l.map(c => `<div class="sp-class sp-c${esc(cById(s, c.course).color)}"><span class="y-num">${esc(D.time(c.start) || '')}${c.end ? '–' + esc(D.time(c.end)) : ''}</span><b>${esc(cName(s, c.course))}</b><small>${esc(c.kind)}${c.room || cById(s, c.course).room ? ' · ' + esc(c.room || cById(s, c.course).room) : ''}</small></div>`).join('') || '<p class="sp-free">Free</p>'}</section>`;
      }).join('');
      return `${u.head({ eyebrow: 'Weekly schedule', title: `<em>${s.classes.length}</em> ${s.classes.length === 1 ? 'class' : 'classes'} a week`, lede: 'Add each class once — it repeats every week. Today’s classes show up on the Today page.' })}
      ${s.courses.length ? `<div class="sp-week">${grid}</div>` : u.empty('calendar', 'Add your courses first', 'Each class belongs to a course — add them on the Grades page.', u.btn('Add courses', { kind: 'world', icon: 'plus', act: 'go', data: { page: 'grades' } }))}
      ${s.courses.length ? u.panel('Classes', u.table('classes', s.classes, [
        { k: 'course', label: 'Course', type: 'select', options: () => cOpts(s), blank: 'Pick a course', rerender: true, w: 'minmax(0,1.6fr)' },
        { k: 'day', label: 'Day', type: 'select', options: DAYS.map(d => [d, DAY_NAME[d]]), rerender: true, w: '130px' },
        { k: 'start', label: 'Starts', type: 'time', w: '120px' }, { k: 'end', label: 'Ends', type: 'time', w: '120px' },
        { k: 'kind', label: 'Type', type: 'select', options: KINDS, w: '130px' }, { k: 'room', label: 'Room', ph: 'Room', w: 'minmax(0,1fr)' }
      ], { what: 'class', add: 'Add class', empty: 'No classes yet.' }), { icon: 'edit', hint: 'Leave the room empty to use the course’s room.', cls: 'pl-no-print' }) : ''}`;
    }
  };

  /* ---------- assignments ---------- */
  const GROUPS = [['late', 'Overdue'], ['today', 'Today'], ['week', 'Next 7 days'], ['later', 'Later'], ['none', 'No due date'], ['done', 'Done']];
  const groupOf = x => { const t = D.today(); if (x.done) return 'done'; if (!x.due) return 'none'; if (x.due < t) return 'late'; if (x.due === t) return 'today'; return x.due <= D.add(t, 7) ? 'week' : 'later'; };
  const tasks = {
    id: 'tasks', label: 'Assignments', icon: 'check',
    badge: ctx => ctx.state.tasks.filter(late).length || '',
    render(ctx) {
      const s = ctx.state, cc = s.ui.cc === 'all' || cById(s, s.ui.cc) ? s.ui.cc : 'all', showDone = !!s.ui.showDone;
      const rows = s.tasks.map((x, i) => Object.assign({ __i: i }, x)).filter(x => cc === 'all' || x.course === cc);
      const open = openTasks(s).length;
      const groups = GROUPS.filter(g => g[0] !== 'done' || showDone).map(([g, name]) => {
        const l = rows.filter(x => groupOf(x) === g).sort((a, b) => (a.due || 'z').localeCompare(b.due || 'z'));
        return l.length ? `<section class="y-panel sp-group${g === 'late' ? ' is-late' : ''}"><div class="y-panel-head"><h2 class="y-kicker">${esc(name)}</h2><span class="pl-muted y-num">${l.length}</span></div>
          <ul class="pl-checklist sp-tasks">${l.map(x => `<li class="pl-ci${x.done ? ' is-done' : ''}">${u.tick(`tasks.${x.__i}.done`, x.done, `Done: ${x.title}`, { rerender: true })}
            <div class="pl-ci-main sp-task">${u.input(`tasks.${x.__i}.title`, x.title, { label: 'Assignment', ph: 'Assignment', cls: 'pl-ci-input' })}
              <div class="sp-task-meta">${u.select(`tasks.${x.__i}.course`, x.course, cOpts(s), { label: 'Course', blank: 'Course', cls: 'sp-mini', rerender: true })}${u.select(`tasks.${x.__i}.type`, x.type, TYPES, { label: 'Type', cls: 'sp-mini' })}${u.input(`tasks.${x.__i}.due`, x.due, { type: 'date', label: 'Due date', cls: 'sp-mini', rerender: true })}</div></div>
            ${u.iconBtn('trash', `Remove ${x.title || 'assignment'}`, 'removeTask', { i: x.__i })}</li>`).join('')}</ul></section>` : '';
      }).join('');
      return `${u.head({ eyebrow: 'Assignments', title: open ? `<em>${open}</em> to do` : 'All <em>done</em>', lede: 'Type it, press Enter, then set the course and due date. Overdue ones float to the top.' })}
      ${u.quickAdd('tasks', { key: 'title', ph: 'Add an assignment — e.g. Problem set 9', label: 'Add an assignment', kind: 'world', at: 'top' })}
      <div class="pl-row sp-tools">${s.courses.length ? u.chips('ui.cc', cc, [['all', 'All courses'], ...s.courses.map(c => [c.id, c.code || c.name || 'Course'])], 'Course') : ''}<span class="pl-spacer"></span>${u.switch('ui.showDone', s.ui.showDone, 'Show done')}</div>
      ${groups || u.empty('check', rows.length ? 'Nothing open here' : 'No assignments yet', 'Add the first one above.')}`;
    },
    actions: { removeTask(ctx, d) { ctx.remember(); const x = ctx.state.tasks.splice(+d.i, 1)[0]; ctx.undoToast(`Removed ${x && x.title || 'assignment'}`); } },
    sheet(ctx) {
      const s = ctx.state, l = openTasks(s).slice().sort((a, b) => (a.due || 'z').localeCompare(b.due || 'z'));
      return `<h1>Assignments</h1><p class="pl-sheet-meta">${esc(s.term || '')}${s.term ? ' · ' : ''}${l.length} to do</p><table><thead><tr><th></th><th>Due</th><th>Course</th><th>Assignment</th><th>Type</th></tr></thead><tbody>${l.map(x => `<tr><td>☐</td><td>${esc(x.due ? D.short(x.due) : '—')}</td><td>${esc(cName(s, x.course))}</td><td>${esc(x.title)}</td><td>${esc(x.type)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- exams ---------- */
  const exams = {
    id: 'exams', label: 'Exams', icon: 'award',
    badge: ctx => ctx.state.exams.filter(e => e.date && e.date >= D.today() && D.diff(D.today(), e.date) <= 7).length || '',
    render(ctx) {
      const s = ctx.state, nx = upcomingExams(s)[0];
      return `${u.head({ eyebrow: 'Exams', title: nx ? `<em>${D.diff(D.today(), nx.date)}</em> days to ${esc(cName(s, nx.course))} ${esc(nx.title)}` : 'No exams <em>coming up</em>', lede: 'List the topics for each exam and tick them off as you review. Study sessions count toward it on the Study page.' })}
      ${u.records('exams', s.exams, {
        what: 'Exam', titleKey: 'title', titlePh: 'Midterm, final, quiz…', cls: 'sp-exams',
        lead: e => dot(s, e.course),
        sub: e => { const tp = e.topics.filter(x => P.has(x.text)), dn = tp.filter(x => x.done).length; return `${esc(cName(s, e.course) || 'No course yet')} · ${e.date ? `${esc(D.full(e.date))} · ${esc(D.rel(e.date))}` : 'no date'} · ${dn}/${tp.length} topics`; },
        cardClass: e => (e.date && e.date < D.today() ? 'is-done' : ''),
        fields: [{ k: 'course', label: 'Course', options: () => cOpts(s), blank: 'Pick a course', rerender: true }, { k: 'date', label: 'Date', type: 'date', rerender: true },
          { k: 'time', label: 'Time', type: 'time' }, { k: 'room', label: 'Room', ph: 'Where' }],
        foot: (e, i) => `<div class="sp-topics">${u.meter(e.topics.length ? e.topics.filter(x => x.done && P.has(x.text)).length / Math.max(1, e.topics.filter(x => P.has(x.text)).length) * 100 : 0, 'Topics reviewed')}
          ${u.table(`exams.${i}.topics`, e.topics, [{ k: 'done', label: 'Reviewed', type: 'check', rerender: true, w: '64px' }, { k: 'text', label: 'Topic', ph: 'Topic or chapter', title: true }], { add: 'Add topic', what: 'topic', tpl: 'topic', empty: 'No topics yet.' })}</div>`,
        add: 'Add exam', tpl: 'exam', addKind: 'world', empty: u.empty('award', 'No exams yet', 'Add each exam as soon as the date is out.')
      })}`;
    }
  };

  /* ---------- grades ---------- */
  const grades = {
    id: 'grades', label: 'Grades', icon: 'chart',
    render(ctx) {
      const s = ctx.state, g = gpa(s);
      return `${u.head({ eyebrow: 'Courses & grades', title: g ? `GPA so far: <em>${g.gpa.toFixed(2)}</em>` : 'Your <em>courses</em>', lede: 'Add each graded part with its weight. Your average, letter and what you need on the rest update as you go.' })}
      ${u.records('courses', s.courses, {
        what: 'Course', titlePh: 'Course name', move: true, cls: 'sp-courses',
        lead: c => `<i class="sp-dot sp-c${esc(c.color)}"></i>`,
        sub: (c, i) => `<span data-slot="gSub" data-arg="${i}"></span>`,
        fields: [{ k: 'code', label: 'Code', ph: 'BIO 101' }, { k: 'teacher', label: 'Teacher', ph: 'Name' }, { k: 'room', label: 'Room', ph: 'Building and room' },
          { k: 'credits', label: 'Credits', num: true, ph: '3' }, { k: 'target', label: 'Target %', num: true, ph: '90' }, { k: 'color', label: 'Color', options: COLORS, rerender: true }],
        foot: (c, i) => `${u.table(`courses.${i}.items`, c.items, [{ k: 'name', label: 'Graded part', ph: 'Midterm', title: true, w: 'minmax(0,1.5fr)' }, { k: 'weight', label: 'Weight %', num: true, ph: '25', w: '110px' }, { k: 'score', label: 'Score %', num: true, ph: 'not yet', w: '110px' }],
          { add: 'Add graded part', what: 'graded part', tpl: 'gradeItem', empty: 'Add the parts from your syllabus.' })}<div data-slot="gNeed" data-arg="${i}"></div>`,
        add: 'Add course', tpl: 'course', addKind: 'world', empty: u.empty('chart', 'No courses yet', 'Add every course you take this term.')
      })}
      <p class="pl-hint sp-scale">Letters use a common US scale (A = 93+, A− = 90+, B+ = 87+ …) and GPA a 4.0 scale. Your school’s scale may differ.</p>`;
    },
    slots: {
      gSub(ctx, i) {
        const c = ctx.state.courses[+i]; if (!c) return '';
        const g = grade(c);
        return g.avg == null ? `${esc(c.code || '')}${c.code ? ' · ' : ''}${esc(c.credits || 0)} credits · no grades yet` : `<b class="sp-grade">${esc(g.letter[1])}</b> <span class="y-num">${r1(g.avg)}%</span> so far · ${Math.round(g.done)}% of the grade in · ${esc(c.credits || 0)} credits`;
      },
      gNeed(ctx, i) {
        const c = ctx.state.courses[+i]; if (!c) return '';
        const g = grade(c);
        if (!g.total) return '';
        if (Math.abs(g.total - 100) > 0.5 && g.total) return `<p class="sp-need">${u.pill(`Weights add up to ${r1(g.total)}%, not 100%`, 'warn')}</p>`;
        if (g.need == null) return g.avg != null ? `<p class="sp-need">Final grade: <b>${r1(g.avg)}% · ${esc(g.letter[1])}</b></p>` : '';
        const msg = g.need > 100 ? u.pill(`${r1(g.need)}% needed — above 100%`, 'bad') : g.need <= 0 ? u.pill(`${g.target}% is safe`, 'good') : `<b class="y-num">${r1(g.need)}%</b> average on the remaining ${r1(g.left)}%`;
        return `<p class="sp-need">To finish at ${esc(c.target)}%: ${msg}</p>`;
      }
    }
  };

  /* ---------- study timer ---------- */
  const study = {
    id: 'study', label: 'Study', icon: 'timer',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Study timer', title: 'One block, <em>then a break</em>', lede: 'Pick a course and a block. Finished blocks log themselves, so you can see where your study time goes.' })}
      <div class="sp-focus">
        <section class="y-panel y-panel--world sp-on">
          <div class="y-field"><label class="y-label" for="spOn">Studying</label>${u.select('ui.study', s.ui.study, cOpts(s), { id: 'spOn', blank: 'Any course' })}</div>
          <div class="sp-blocks">${BLOCKS.map(([m, l, sub]) => `<button type="button" class="sp-block${m < 20 ? ' is-break' : ''}" data-act="startBlock" data-m="${m}"><b class="y-num">${m}</b><span>${esc(l)}<small>${esc(sub)}</small></span></button>`).join('')}</div>
        </section>
        ${u.timer({ idle: 'Pick a block to start', cls: 'sp-timer' })}
      </div>
      ${u.panel('This week', '<div data-slot="week"></div>', { icon: 'chart', hint: 'Breaks are not counted.' })}`;
    },
    slots: {
      week(ctx) {
        const s = ctx.state, total = weekMins(s), today = s.log.filter(x => x.date === D.today());
        const rows = s.courses.map(c => [c, weekMins(s, c.id)]).filter(x => x[1]).sort((a, b) => b[1] - a[1]), other = total - rows.reduce((a, x) => a + x[1], 0), max = Math.max(1, ...rows.map(x => x[1]), other);
        return `${u.kpis([['This week', esc(hm(total)), 'y-kpi--world'], ['Today', esc(hm(today.reduce((a, x) => a + x.mins, 0))), '', P.plural(today.length, 'session')]])}
          ${rows.length || other ? `<ul class="sp-bars">${rows.map(([c, m]) => `<li><span>${esc(c.code || c.name)}</span><span class="sp-bar"><i class="sp-c${esc(c.color)}" style="width:${m / max * 100}%"></i></span><b class="y-num">${esc(hm(m))}</b></li>`).join('')}${other ? `<li><span>Other</span><span class="sp-bar"><i class="sp-cx" style="width:${other / max * 100}%"></i></span><b class="y-num">${esc(hm(other))}</b></li>` : ''}</ul>`
            : u.empty('timer', 'Nothing logged this week', 'Start a 25-minute block — it logs itself when it rings.')}`;
      }
    },
    actions: {
      startBlock(ctx, d) { const s = ctx.state, m = +d.m, c = cById(s, s.ui.study); ctx.timer.start(m * 60, m < 20 ? 'Break' : (c ? (c.code || c.name) : 'Study block'), `study:${m < 20 ? '' : (s.ui.study || '-')}`); return false; }
    }
  };
  function finished(ctx) {
    const s = ctx.state, t = ctx.timer.state, ref = t.ref || '';
    if (t.running || t.left > 0 || !t.total || !/^study:/.test(ref)) return;
    t.ref = '';
    const c = ref.slice(6);
    if (c) { s.log.unshift({ date: D.today(), time: new Date().toTimeString().slice(0, 5), mins: Math.max(1, Math.round(t.total / 60)), course: c === '-' ? '' : c, label: t.label || '' }); }
    ctx.save(); ctx.render();
  }

  /* ---------- flashcards ---------- */
  function pool(s) {
    const cc = s.ui.fc === 'all' || cById(s, s.ui.fc) ? s.ui.fc || 'all' : 'all';
    return s.cards.filter(c => P.has(c.q) && (cc === 'all' || c.course === cc) && (!s.ui.weak || c.level !== '3'));
  }
  const cur = s => { const p = pool(s), i = Math.max(0, Math.min(p.length - 1, Math.round(P.num(s.ui.idx)))); return { p, i, c: p[i] }; };
  const cards = {
    id: 'cards', label: 'Flashcards', icon: 'grid',
    render(ctx) {
      const s = ctx.state, { p, i, c } = cur(s), fc = s.ui.fc === 'all' || cById(s, s.ui.fc) ? s.ui.fc || 'all' : 'all';
      const total = s.cards.filter(x => P.has(x.q)).length, know = s.cards.filter(x => x.level === '3' && P.has(x.q)).length;
      return `${u.head({ eyebrow: 'Flashcards', title: total ? `<em>${know}</em> of ${total} cards known` : 'Make <em>flashcards</em>', lede: 'Say the answer, flip the card, be honest. Cards you know can sit out while you drill the rest.' })}
      <div class="pl-row sp-tools">${u.chips('ui.fc', fc, [['all', 'All', total], ...s.courses.map(k => [k.id, k.code || k.name || 'Course', s.cards.filter(x => x.course === k.id && P.has(x.q)).length]).filter(x => x[2])], 'Course')}<span class="pl-spacer"></span>${u.switch('ui.weak', s.ui.weak, 'Skip known cards')}</div>
      ${c ? `<div class="sp-stage">
        <button type="button" class="sp-card${s.ui.flip ? ' is-flipped' : ''}" data-act="flip" aria-label="${s.ui.flip ? 'Show the question' : 'Show the answer'}">
          <span class="sp-card-meta">${esc(cName(s, c.course) || 'Card')} · ${i + 1} / ${p.length}</span>
          <span class="sp-q">${esc(c.q)}</span>
          ${s.ui.flip ? `<span class="sp-a">${c.a ? esc(c.a) : '<i>No answer yet — add it below.</i>'}</span>` : '<span class="sp-hint">Say it, then tap to flip</span>'}
        </button>
        <div class="sp-rate" role="group" aria-label="How did you do?"><span class="y-label">How did you do?</span>${LEVELS.slice(1).map(([v, l]) => `<button type="button" class="y-btn y-btn--${c.level === v ? 'world' : 'secondary'}" data-act="rate" data-v="${v}" aria-pressed="${c.level === v}">${esc(l)}</button>`).join('')}
          <div class="pl-row sp-nav">${u.btn('Back', { icon: 'prev', act: 'step', data: { n: -1 }, disabled: i === 0, sm: true })}${u.btn('Skip', { icon: 'next', act: 'step', data: { n: 1 }, sm: true, kind: 'ghost' })}</div></div>
      </div>` : total ? u.empty('check', 'You know all of these', 'Turn off “Skip known cards” or pick another course.') : u.empty('grid', 'No cards yet', 'Add a question and answer below.')}
      ${u.fold('Edit cards', `${u.table('cards', s.cards, [{ k: 'course', label: 'Course', type: 'select', options: () => cOpts(s), blank: '—', w: '160px', rerender: true }, { k: 'q', label: 'Question', ph: 'Question or term', title: true, w: 'minmax(0,1.2fr)' }, { k: 'a', label: 'Answer', ph: 'Answer', w: 'minmax(0,1.4fr)' }, { k: 'level', label: 'Status', type: 'select', options: LEVELS, w: '120px' }],
        { add: 'Add card', what: 'card', tpl: 'card', empty: 'No cards yet.' })}`, { icon: 'edit', key: 'cedit', open: !total })}`;
    },
    actions: {
      flip(ctx) { ctx.state.ui.flip = !ctx.state.ui.flip; },
      step(ctx, d) { const s = ctx.state, { p, i } = cur(s); s.ui.idx = p.length ? (i + +d.n + p.length) % p.length : 0; s.ui.flip = false; },
      rate(ctx, d) {
        const s = ctx.state, { c } = cur(s); if (!c) return false;
        c.level = d.v;
        const { p, i } = cur(s), stays = p.indexOf(c) >= 0;
        s.ui.idx = p.length ? (stays ? (i + 1) % p.length : Math.min(i, p.length - 1)) : 0; s.ui.flip = false;
        ctx.toast(d.v === '3' ? 'Nice — you know it' : 'Saved — next card');
      }
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>Flashcards</h1>${s.courses.concat([{ id: '', name: 'Other' }]).map(c => { const l = s.cards.filter(x => P.has(x.q) && (x.course || '') === c.id); return l.length ? `<h2>${esc(c.code ? c.code + ' · ' + c.name : c.name)}</h2><table class="sp-sheet"><tbody>${l.map(x => `<tr><td><b>${esc(x.q)}</b></td><td>${esc(x.a)}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}`;
    }
  };

  P.create({
    slug: 'student-planner-app',
    name: 'Student Planner',
    world: 'study',
    welcome: 'Add your courses first — the schedule, assignments and grades all use them.',
    pages: [today, schedule, tasks, exams, grades, study, cards],
    blank, sample, normalize,
    timer: { doneText: 'Time’s up — nice work', onTick(ctx) { finished(ctx); } },
    open(ctx) { ctx.state.ui.flip = false; },
    rows: {
      tasks: () => task({ due: D.add(D.today(), 7) }), classes: () => klass(), course: () => course({ color: String(Math.floor(Math.random() * 8)) }), gradeItem: () => gradeItem(),
      exam: () => exam({ course: '' }), topic: () => topic(), card: () => card()
    },
    about: '<p><b>Student Planner</b> keeps a semester in one place: today’s classes and what is due, a weekly class schedule, assignments sorted by due date, exams with topics to review, grades with your average, letter and what you need on the rest, a GPA so far, a study timer that logs time per course, and flashcards.</p>',
    disclaimer: 'Grades and GPA use a common US scale and are estimates. Your school’s grading scale and rules are what count.'
  });
})();
