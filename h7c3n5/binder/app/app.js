/* Home Binder App — the household plan, people, contacts and pets (with a fridge sheet), plus a home inventory and the insurance policy.
   Yaykit planner engine, home world. The family pages come from Emergency Binder (family.js), the inventory from Home Inventory (inventory.js). */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, F = window.HBFamily, H = window.HBInventory;

  function blank() { const a = H.blank(), b = F.blank(); return Object.assign(a, b, { home: Object.assign(a.home, b.home), notes: '' }); }
  function normalize(s) { H.normalize(s); F.normalize(s); return s; }
  function sample() {
    const a = H.sample(), b = F.sample();
    return Object.assign(a, b, { home: Object.assign(a.home, b.home, { address: a.home.address }), notes: [b.notes, a.notes].filter(Boolean).join('\n\n') });
  }

  /* one notes box, under the household plan */
  const plan = F.pages.plan, planRender = plan.render;
  plan.render = ctx => planRender(ctx) + u.notes('notes', ctx.state.notes, { rows: 6, title: 'Notes', ph: 'Go-bag contents, when to test smoke alarms, where the receipts are…' });
  Object.assign(H.pages.overview, { label: 'Inventory' });
  Object.assign(H.pages.policy, { label: 'Insurance' });

  P.create({
    slug: 'home-binder-app',
    name: 'Home Binder',
    world: 'home',
    currency: true,
    welcome: 'Fill in the plan and people first — then walk through the rooms for the inventory.',
    pages: [plan, F.pages.people, F.pages.contacts, F.pages.pets, H.pages.overview, H.pages.items, H.pages.rooms, H.pages.policy],
    blank, sample, normalize,
    rows: Object.assign({}, F.rows, H.rows),
    about: '<p><b>Home Binder</b> keeps what your household needs in a hurry in one place: allergies and medications for each person, every important number, meeting places, shut-offs, where the documents are and pet care — printed as a fridge sheet — plus a room-by-room inventory of what you own with values and serial numbers, and your insurance policy details.</p>',
    disclaimer: 'Home Binder is a personal organization tool, not medical, emergency-response or insurance advice. In an emergency, call your local emergency number first. Confirm documentation requirements with your insurer.'
  });
})();
