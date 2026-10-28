/* Moving Planner App — find the new place, then move: home comparison, an 8-week countdown, budget, box labels, address changes and contacts.
   Yaykit planner engine, home world. The moving pages come from Moving Planner (move.js), the home comparison from House Hunt (homes.js). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, M = window.MVMove, H = window.MVHomes;

  function blank() { return Object.assign(H.blank(), M.blank(), { notes: '' }); }
  function normalize(s) { M.normalize(s); H.normalize(s); return s; }
  function sample() {
    const h = H.sample(), m = M.sample();
    return Object.assign(h, m, { notes: [m.notes, h.notes].filter(Boolean).join('\n\n') });
  }

  /* one notes box, under the contacts */
  const people = M.pages.people, peopleRender = people.render;
  people.render = ctx => peopleRender(ctx) + u.notes('notes', ctx.state.notes, { rows: 6, title: 'Notes', ph: 'Building rules, parking, what goes in the essentials bag, questions for the agent…' });
  Object.assign(H.pages.compare, { label: 'Homes' });

  P.create({
    slug: 'moving-planner-app',
    name: 'Moving Planner',
    world: 'home',
    currency: true,
    welcome: 'Set your moving date — the checklist dates itself.',
    pages: [M.pages.countdown, M.pages.budget, M.pages.boxes, M.pages.docs, people, H.pages.compare, H.pages.criteria],
    blank, sample, normalize,
    rows: Object.assign({}, M.rows, H.rows),
    about: '<p><b>Moving Planner</b> takes a move from house hunting to the first night: compare homes on what matters to you with a rough monthly cost, then an 8-week checklist dated back from moving day, a budget with estimates vs actual costs, numbered boxes you can print as labels, address changes with due dates, and every contact for moving week.</p>',
    disclaimer: 'Moving Planner is a personal organization tool, not legal, financial, lending, insurance or real-estate advice. Monthly costs are estimates; confirm with your lender and agent.'
  });
})();
