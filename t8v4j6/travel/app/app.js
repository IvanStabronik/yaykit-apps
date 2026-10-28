/* Travel Planner App — trip, bookings, budget + settle-up, packing, documents and ideas (pages in travel.js). Yaykit planner engine, voyage world. */
(function () {
  'use strict';
  const P = window.Planner, T = window.TPTravel;
  P.create({
    slug: 'travel-planner-app', name: 'Travel Planner', world: 'voyage', currency: true,
    welcome: 'Set the destination and dates, add who’s going — each day gets its own plan card.',
    pages: [T.pages.trip, T.pages.bookings, T.pages.budget, T.pages.packing, T.pages.docs, T.pages.ideas],
    blank: T.blank, sample: T.sample, normalize: T.normalize, rows: T.rows,
    accepts: d => d && typeof d === 'object' && ('trip' in d || 'bookings' in d),
    about: '<p><b>Travel Planner</b> keeps the whole trip in one place: a plan card for each day, every booking with its confirmation number and free-cancel date, a budget by category with a fair split and settle-up between travelers, packing by bag, passports and documents with a six-month validity check, emergency info, and a list of places to see and eat.</p>',
    disclaimer: 'Travel Planner is a personal planning tool. Check entry, visa, passport and health rules for your destination with official sources before you travel.'
  });
})();
