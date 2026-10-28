/* Bachelorette Weekend App — the weekend plan, the crew, bookings, a fair cost split, a bride quiz and packing. Yaykit planner engine, wedding world.
   Day plans, bookings, money and packing come from Bachelorette Weekend (weekend.js); the crew list (arrivals, rooms, who has paid their share)
   and the "How well do you know the bride?" quiz are new. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, B = window.BWWeekend;
  const txt = v => (v == null ? '' : String(v));
  const mate = o => Object.assign({ id: P.uid(), name: '', phone: '', arrives: '', room: '', diet: '', paid: false, bride: false, notes: '' }, o || {});
  const question = (q, a) => ({ id: P.uid(), q: q || '', a: a || '' });
  const CLASSICS = ['Where did the couple meet?', 'What was their first date?', 'Who said “I love you” first?', 'What is the bride’s go-to coffee order?', 'What is her favorite movie?',
    'Who is the better cook?', 'Where is the honeymoon?', 'What is her most-used emoji?', 'What did she want to be when she grew up?', 'What is her karaoke song?'];

  function blank() { return Object.assign(B.blank(), { crew: [], quiz: [] }); }
  function normalize(s) {
    B.normalize(s);
    s.crew = (Array.isArray(s.crew) ? s.crew : []).filter(x => x && typeof x === 'object').map(x => { const c = mate(); Object.keys(c).forEach(k => { if (typeof c[k] === 'boolean') c[k] = !!x[k]; else c[k] = txt(x[k]) || (k === 'id' ? P.uid() : c[k]); }); return c; });
    s.quiz = (Array.isArray(s.quiz) ? s.quiz : []).filter(x => x && typeof x === 'object').map(x => Object.assign(question(txt(x.q), txt(x.a)), { id: txt(x.id) || P.uid() }));
    return s;
  }
  function sample() {
    const s = Object.assign(blank(), B.sample()), d1 = s.trip.start, day = (d, t) => `${D.fmt(d, { weekday: 'short' })} ${t}`;
    s.crew = [mate({ name: 'Maya', bride: true, arrives: day(d1, '2:00 pm'), room: 'Main suite', phone: '(615) 555-0101', notes: 'The bride!' }),
      mate({ name: 'Jordan', phone: '(615) 555-0102', arrives: day(d1, '12:30 pm'), room: 'Main suite (sofa bed)', paid: true, notes: 'Maid of honor · has the keys' }),
      mate({ name: 'Priya', phone: '(615) 555-0103', arrives: day(d1, '3:30 pm'), room: 'Room 2', diet: 'Shellfish allergy', paid: true }),
      mate({ name: 'Sam', phone: '(615) 555-0104', arrives: day(d1, '3:30 pm'), room: 'Room 2', paid: true }),
      mate({ name: 'Ava', phone: '(615) 555-0105', arrives: day(d1, '5:45 pm'), room: 'Room 3', diet: 'Vegetarian' }),
      mate({ name: 'Lena', phone: '(615) 555-0106', arrives: day(d1, '5:45 pm'), room: 'Room 3', paid: true }),
      mate({ name: 'Rosa', phone: '(615) 555-0107', arrives: day(D.add(d1, 1), '9:00 am'), room: 'Bunk room', notes: 'Driving in Saturday morning' }),
      mate({ name: 'Kim', phone: '(615) 555-0108', arrives: day(d1, '6:30 pm'), room: 'Bunk room' })];
    s.trip.people = '8';
    s.quiz = [question('Where did Maya and Theo meet?', 'Friend’s rooftop party, 2021'), question('What was their first date?', 'Tacos + a terrible movie'), question('Who said “I love you” first?', 'Theo'),
      question('What is Maya’s go-to coffee order?', 'Iced oat latte'), question('What is her karaoke song?', 'Before He Cheats'), question('Where is the honeymoon?', 'Lisbon + the Algarve'),
      question('What did she want to be when she grew up?', 'A marine biologist'), question('What is her most-used emoji?', '🥹')];
    return s;
  }

  /* ---------- crew ---------- */
  const crewPage = {
    id: 'crew', label: 'Crew', icon: 'user',
    badge: ctx => { const s = ctx.state, m = B.money(s); return s.crew.filter(c => P.has(c.name) && !c.bride && !c.paid).length && m.each ? s.crew.filter(c => P.has(c.name) && !(c.bride && s.trip.brideFree) && !c.paid).length : ''; },
    render(ctx) {
      const s = ctx.state, m = B.money(s);
      const payers = s.crew.filter(c => P.has(c.name) && !(c.bride && s.trip.brideFree)), paid = payers.filter(c => c.paid).length;
      return `${u.head({ eyebrow: 'The crew', title: s.crew.length ? `<em>${s.crew.filter(c => P.has(c.name)).length}</em> going` : 'Who’s <em>coming?</em>', lede: 'Arrivals, rooms, allergies and who has paid their share. The cost split counts the people on this list.' })}
      ${payers.length && m.each ? u.kpis([['Share each', esc(ctx.money(m.each)), 'y-kpi--world', `${m.payers} people paying`], ['Shares paid', `${paid}<small class="gs-of">/${payers.length}</small>`, paid === payers.length ? 'is-good' : '', `${esc(ctx.money(m.each * paid))} collected`], ['Still to collect', esc(ctx.money(m.each * (payers.length - paid))), 'y-kpi--accent']]) : ''}
      ${s.crew.some(c => P.has(c.diet)) ? u.banner('warn', `<b>Food notes:</b> ${s.crew.filter(c => P.has(c.diet)).map(c => `${esc(c.name)} — ${esc(c.diet)}`).join(' · ')}`) : ''}
      ${u.records('crew', s.crew, {
        what: 'Person', titlePh: 'Name', cls: 'bw-crew',
        sub: c => `${c.bride ? u.pill('Bride', 'world') : ''}${c.bride && s.trip.brideFree ? '' : (m.each ? ` ${c.paid ? u.pill('Share paid', 'good') : u.pill(`Owes ${ctx.money(m.each)}`, 'warn')}` : '')}${c.arrives ? ` · arrives ${esc(c.arrives)}` : ''}`,
        fields: [{ k: 'phone', label: 'Phone', type: 'tel', ph: 'Phone' }, { k: 'arrives', label: 'Arrives', ph: 'Fri 3:30 pm, flight UA 512' },
          { k: 'room', label: 'Room / bed', ph: 'Room 2' }, { k: 'diet', label: 'Allergies / diet', ph: 'Optional', rerender: true },
          { k: 'paid', label: 'Share paid', type: 'check', rerender: true }, { k: 'bride', label: 'This is the bride', type: 'check', rerender: true },
          { k: 'notes', label: 'Notes', type: 'textarea', wide: true, ph: 'Driving, plus-ones, surprises…' }],
        add: 'Add person', addKind: s.crew.length ? '' : 'world', empty: u.empty('user', 'No one yet', 'Add everyone on the trip — the split and the rooms come from this list.')
      })}`;
    },
    sheet(ctx) {
      const s = ctx.state;
      return `<h1>The crew</h1><p class="pl-sheet-meta">${esc(s.trip.place || '')}</p><table><thead><tr><th>Name</th><th>Phone</th><th>Arrives</th><th>Room</th><th>Allergies / diet</th></tr></thead><tbody>${s.crew.filter(c => P.has(c.name)).map(c => `<tr><td><b>${esc(c.name)}</b>${c.bride ? ' (bride)' : ''}</td><td>${esc(c.phone)}</td><td>${esc(c.arrives)}</td><td>${esc(c.room)}</td><td>${esc(c.diet)}</td></tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- bride quiz ---------- */
  const quiz = {
    id: 'quiz', label: 'Bride quiz', icon: 'star',
    render(ctx) {
      const s = ctx.state, n = s.quiz.filter(x => P.has(x.q)).length;
      return `${u.head({ eyebrow: 'Game night', title: `How well do you know <em>${esc(s.trip.bride || 'the bride')}</em>?`, lede: 'Write the questions and the bride’s real answers ahead of time. Print answer sheets for everyone — the host key prints on its own page.' })}
      ${u.panel('Questions', `${u.table('quiz', s.quiz, [{ k: 'q', label: 'Question', title: true, w: 'minmax(0,1.4fr)', ph: 'Question' }, { k: 'a', label: 'Bride’s answer', w: 'minmax(0,1fr)', ph: 'Ask her secretly' }],
        { what: 'question', move: true, add: 'Add question', empty: 'No questions yet.' })}
        <div class="pl-row">${n ? '' : u.btn('Add 10 classic questions', { icon: 'sparkle', act: 'classics' })}${n ? u.btn('Print answer sheets + key', { kind: 'world', icon: 'print', act: 'print' }) : ''}</div>`, { icon: 'star', hint: `${P.plural(n, 'question')} · one point for each answer that matches.` })}`;
    },
    actions: { classics(ctx) { CLASSICS.forEach(q => ctx.state.quiz.push(question(q, ''))); ctx.toast('10 classic questions added — get the bride’s answers'); } },
    sheet(ctx) {
      const s = ctx.state, l = s.quiz.filter(x => P.has(x.q)), who = esc(s.trip.bride || 'the bride');
      return `<div class="bw-quiz-sheet"><h1>How well do you know ${who}?</h1><p class="pl-sheet-meta">Name: ____________________ &nbsp; Score: ____ / ${l.length}</p><ol>${l.map(x => `<li>${esc(x.q)}<span class="bw-line"></span></li>`).join('')}</ol></div>
        <div class="bw-quiz-sheet" style="break-before:page"><h1>Host key</h1><ol>${l.map(x => `<li><b>${esc(x.q)}</b><br>${esc(x.a || '—')}</li>`).join('')}</ol></div>`;
    }
  };

  const weekend = B.pages.weekend, weekendRender = weekend.render;
  weekend.render = ctx => weekendRender(ctx) + u.notes('notes', ctx.state.notes, { rows: 4, title: 'Host notes', ph: 'Surprises, the budget cap everyone agreed to, what not to tell the bride…' });

  P.create({
    slug: 'bachelorette-weekend-app',
    name: 'Bachelorette Weekend Planner',
    world: 'wedding',
    currency: true,
    welcome: 'Set the destination and dates — each day gets its own plan card.',
    pages: [weekend, crewPage, B.pages.bookings, B.pages.moneyPage, quiz, B.pages.packing],
    blank, sample, normalize,
    rows: Object.assign({ crew: () => mate(), quiz: () => question() }, B.rows),
    about: '<p><b>Bachelorette Weekend Planner</b> is the host’s command center for a multi-day trip: a plan card for each day, the crew with arrivals, rooms and allergies, every booking with its confirmation number, a fair cost split with who has paid their share, a “How well do you know the bride?” quiz with printable answer sheets, and a packing list by bag.</p>',
    disclaimer: 'Bachelorette Weekend Planner is a personal planning tool, not travel, legal or financial advice. Confirm reservations, ages, dress codes and cancellation policies with each venue.'
  });
})();
