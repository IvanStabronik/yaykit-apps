/* Free Turkey Calculator. Same numbers as the Thanksgiving Planner App (products/thanksgiving-planner-app/app/thanksgiving.js):
   1.25 / 1.5 lb a person, USDA chart at 325°F, a day of thawing per 4 lb, 30 minutes of rest. No storage: see free.css. */
(function () {
  'use strict';
  const REST = 30, SMALL = 8;
  const CHART = { plain: [[12, 2.75, 3], [14, 3, 3.75], [18, 3.75, 4.25], [20, 4.25, 4.5], [24, 4.5, 5]], stuffed: [[12, 3, 3.5], [14, 3.5, 4], [18, 4, 4.25], [20, 4.25, 4.75], [24, 4.75, 5.25]] };
  const $ = id => document.getElementById(id);
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addMin = (d, m) => new Date(d.getTime() + m * 60000);
  const day = d => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const shortDay = d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const clock = d => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const hours = m => { const h = Math.floor(m / 60), r = Math.round(m % 60); return h ? `${h} h${r ? ` ${r} min` : ''}` : `${r} min`; };

  /* the fourth Thursday of November, this year's or next year's once it has passed */
  function nextThanksgiving(now) {
    for (let y = now.getFullYear(); ; y++) {
      const first = new Date(y, 10, 1), d = new Date(y, 10, 1 + (4 - first.getDay() + 7) % 7 + 21);
      if (iso(d) >= iso(now)) return d;
    }
  }

  function bird(i) {
    const per = i.leftovers ? 1.5 : 1.25, rec = Math.ceil(i.people * per);
    const own = i.lbs > 0, lbs = own ? i.lbs : Math.max(rec, SMALL);
    const rows = CHART[i.stuffed ? 'stuffed' : 'plain'], row = rows.find(r => lbs <= r[0]) || rows[rows.length - 1];
    const extra = lbs > 24 ? (lbs - 24) * 13 / 60 : 0;   // past the chart: about 13 more minutes a pound
    const small = lbs < SMALL;
    return { own, lbs, rec, small, low: small ? 90 : Math.round((row[1] + extra) * 60), high: small ? 195 : Math.round((row[2] + extra) * 60), thaw: i.fresh ? 0 : Math.ceil(lbs / 4) };
  }

  function row(what, when, hint) {
    const li = document.createElement('li'), b = document.createElement('b'), w = document.createElement('span');
    b.textContent = what; w.className = 'ft-when'; w.textContent = when;
    li.append(b, w);
    if (hint) { const s = document.createElement('small'); s.textContent = hint; li.append(s); }
    return li;
  }

  function render() {
    const people = Math.min(Math.max(Math.round(Number($('people').value)) || 0, 0), 60);
    const lbs = Math.min(Number($('lbs').value) || 0, 40);
    const input = { people, lbs, leftovers: $('leftovers').checked, stuffed: $('stuffed').checked, fresh: $('fresh').checked };
    const steps = $('steps'), note = $('note');
    steps.textContent = ''; note.hidden = true;
    if (!people && !lbs) { $('size').textContent = 'How many people?'; $('sizeSub').textContent = 'Enter who is eating to see the size and times.'; return; }
    const b = bird(input), kg = Math.round(b.lbs * 0.4536 * 10) / 10;
    $('size').innerHTML = '';
    const em = document.createElement('em'); em.textContent = `${b.lbs} lb`;
    $('size').append(em, ' turkey');
    $('sizeSub').textContent = `${kg} kg, ${b.own ? 'the bird you bought' : `for ${people} ${people === 1 ? 'person' : 'people'}`}. Oven time ${hours(b.low)} to ${hours(b.high)} at 325°F.`;

    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec($('date').value), t = /^(\d{2}):(\d{2})$/.exec($('time').value);
    if (!parts || !t) { note.textContent = 'Set the dinner day and time to see when to thaw and when it goes in the oven.'; note.hidden = false; return; }
    const serve = new Date(+parts[1], +parts[2] - 1, +parts[3], +t[1], +t[2]);
    const out = addMin(serve, -REST), inAt = addMin(out, -b.high), check = addMin(inAt, b.low), carve = addMin(serve, -10);
    const start = new Date(+parts[1], +parts[2] - 1, +parts[3] - b.thaw);
    if (b.thaw) steps.append(row('Move it to the fridge to thaw', day(start), `${b.thaw} ${b.thaw === 1 ? 'day' : 'days'}, one for every 4 lb`));
    const sameDay = d => (iso(d) === iso(serve) ? clock(d) : `${shortDay(d)}, ${clock(d)}`);
    steps.append(row('Turkey in the oven', sameDay(inAt), 'Heat the oven to 325°F / 165°C first'), row('Start checking', sameDay(check), '165°F / 74°C in the thigh, breast and stuffing'), row('Out, rest under foil', sameDay(out)), row('Carve', sameDay(carve)), row('Dinner', clock(serve)));
    const today = iso(new Date());
    const notes = [];
    if (b.thaw && iso(start) < today) notes.push(`The fridge thaw should have started already. Use cold water instead: about ${hours(b.lbs * 30)}, changing the water every 30 minutes, and cook it right away.`);
    if (b.small) notes.push('Whole turkeys start at around 8 lb, so this is closer to a turkey breast. Start checking early and go by the thermometer.');
    else if (!b.own && b.rec < SMALL) notes.push('Whole turkeys start at around 8 lb, so that is the size shown. A turkey breast may suit a small table better.');
    if (notes.length) { note.textContent = notes.join(' '); note.hidden = false; }
  }

  $('date').value = iso(nextThanksgiving(new Date()));
  $('form').addEventListener('input', render);
  $('form').addEventListener('change', render);
  render();
})();
