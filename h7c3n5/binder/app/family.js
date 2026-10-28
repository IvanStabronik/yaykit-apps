/* Home Binder App — household plan, people, contacts and pets (fridge sheet), from Emergency Binder. app.js puts these pages into the app. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const GROUPS = [['family', 'Family & friends'], ['medical', 'Medical'], ['school', 'School & childcare'], ['neighbor', 'Neighbors'], ['services', 'Home & services'], ['other', 'Other']];
  const GROUP = Object.fromEntries(GROUPS);
  const txt = v => (v == null ? '' : String(v));
  const contact = (group, role, name, phone, note) => ({ id: P.uid(), group: group || 'family', role: role || '', name: name || '', phone: phone || '', note: note || '' });
  const person = o => Object.assign({ id: P.uid(), name: '', born: '', blood: '', allergies: '', conditions: '', meds: '', doctor: '', note: '' }, o || {});
  const pet = o => Object.assign({ id: P.uid(), name: '', kind: '', vet: '', vetPhone: '', chip: '', food: '', meds: '' }, o || {});

  function blank() {
    return {
      home: { name: '', address: '', meet: '', meetFar: '', outOfTown: '', shutoffs: '', docs: '', wifi: '', spareKey: '' },
      people: [], contacts: [contact('services', 'Emergency', 'Emergency services', '911', 'Call first in a real emergency'), contact('medical', 'Poison control (US)', 'Poison Help', '1-800-222-1222', '')], pets: [], notes: ''
    };
  }
  function sample() {
    return {
      home: { name: 'Rivera household', address: '14 Maple Lane', meet: 'Front of the Lees’ house across the street', meetFar: 'Maple Library parking lot', outOfTown: 'Aunt Avery (Denver) — everyone checks in with her', shutoffs: 'Water: basement, left of the stairs. Gas: side of the house by the meter. Breaker panel: garage.', docs: 'Fire box in the hall closet (passports, birth certificates, insurance)', wifi: 'Rivera-Home · password on the router', spareKey: 'Sam (next door)' },
      people: [
        person({ name: 'Alex Rivera', born: '1987-03-14', blood: 'O+', allergies: 'Penicillin', conditions: 'High blood pressure', meds: 'Lisinopril — morning', doctor: 'Dr. Patel' }),
        person({ name: 'Jordan Rivera', born: '1988-11-02', blood: 'A+', allergies: '', conditions: '', meds: '', doctor: 'Dr. Patel' }),
        person({ name: 'Maya Rivera', born: '2017-06-21', blood: '', allergies: 'Peanuts (EpiPen in the kitchen drawer + backpack)', conditions: 'Asthma', meds: 'Inhaler as needed', doctor: 'Dr. Nguyen (pediatrician)' })
      ],
      contacts: [
        contact('services', 'Emergency', 'Emergency services', '911', 'Call first in a real emergency'), contact('medical', 'Poison control (US)', 'Poison Help', '1-800-222-1222', ''),
        contact('family', 'Out-of-town contact', 'Avery Rivera', '(720) 555-0121', 'Call second'), contact('family', 'Grandma', 'Rosa Rivera', '(555) 010-0144', 'Can pick up Maya'),
        contact('medical', 'Family doctor', 'Dr. Patel', '(555) 010-0112', 'Weekday mornings'), contact('medical', 'Pediatrician', 'Dr. Nguyen', '(555) 010-0144', 'After-hours nurse line'), contact('medical', 'Pharmacy', 'Oak Street Pharmacy', '(555) 010-0190', ''),
        contact('school', 'School office', 'Maple Elementary', '(555) 010-0160', ''), contact('neighbor', 'Spare key', 'Sam Lee', '(555) 010-0133', 'Next door'),
        contact('services', 'Electric company', 'City Power', '(555) 010-0155', 'Outages'), contact('services', 'Landlord', 'Pat Morris', '(555) 010-0199', 'After-hours line')
      ],
      pets: [pet({ name: 'Mochi', kind: 'Dog · mixed breed', vet: 'Bright Paw Clinic', vetPhone: '(555) 010-0166', chip: '985 112 004 551 902', food: '1 cup twice a day, food in the pantry', meds: '' })],
      notes: 'Go-bag lives in the hall closet: water, snacks, flashlight, power bank, copies of IDs, cash.\nCheck the go-bag and smoke alarms every daylight-saving change.'
    };
  }
  function normalize(s) {
    const h = s.home || {}, b = blank();
    s.home = Object.assign({}, h, Object.fromEntries(Object.keys(b.home).map(k => [k, txt(h[k])])));
    const arr = (v, f) => (Array.isArray(v) ? v : []).filter(x => x && typeof x === 'object').map(f);
    s.people = arr(s.people, x => { const o = person(); Object.keys(o).forEach(k => { o[k] = txt(x[k]) || (k === 'id' ? P.uid() : ''); }); return o; });
    s.contacts = arr(s.contacts, x => Object.assign(contact(GROUP[x.group] ? x.group : 'other', txt(x.role), txt(x.name), txt(x.phone), txt(x.note)), { id: txt(x.id) || P.uid() }));
    s.pets = arr(s.pets, x => { const o = pet(); Object.keys(o).forEach(k => { o[k] = txt(x[k]) || (k === 'id' ? P.uid() : ''); }); return o; });
    s.notes = txt(s.notes);
    return s;
  }
  const age = born => { const d = D.parse(born); if (!d) return ''; const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a >= 0 ? String(a) : ''; };

  const plan = {
    id: 'plan', label: 'Our plan', icon: 'home',
    render(ctx) {
      const s = ctx.state, h = s.home, alerts = s.people.filter(p => P.has(p.allergies));
      return `${u.head({ eyebrow: h.name || 'Emergency binder', title: 'If something <em>happens</em>', lede: 'The few things everyone at home — and any babysitter — should be able to find in ten seconds. Print it for the fridge.' })}
      <div class="pl-row eb-cta">${u.btn('Print fridge sheet', { kind: 'world', icon: 'print', act: 'print' })}<span class="pl-hint">One page: people, allergies, contacts, meeting places.</span></div>
      ${alerts.length ? u.banner('bad', `<b>Allergies:</b> ${alerts.map(p => `${esc(p.name)} — ${esc(p.allergies)}`).join(' · ')}`, 'warn') : ''}
      ${u.panel('Home', `<div class="pl-fields">${u.field('Household name', 'home.name', h.name, { ph: 'The Rivera household' })}${u.field('Address', 'home.address', h.address, { ph: 'Street, city' })}${u.field('Spare key with', 'home.spareKey', h.spareKey, { ph: 'Neighbor or lockbox' })}${u.field('Wi-Fi', 'home.wifi', h.wifi, { ph: 'Network (password location)' })}</div>`, { icon: 'home' })}
      ${u.panel('Meeting places', `<div class="pl-fields">${u.field('Near home (fire, gas leak)', 'home.meet', h.meet, { ph: 'Mailbox at the corner' })}${u.field('Away from the neighborhood', 'home.meetFar', h.meetFar, { ph: 'Library, school, a friend’s house' })}${u.field('Out-of-town check-in person', 'home.outOfTown', h.outOfTown, { ph: 'Name — everyone calls them', cls: 'pl-wide' })}</div>`, { icon: 'user' })}
      ${u.panel('Where things are', `<div class="pl-fields">${u.field('Shut-offs (water, gas, breaker)', 'home.shutoffs', h.shutoffs, { type: 'textarea', rows: 3, cls: 'pl-wide' })}${u.field('Important documents', 'home.docs', h.docs, { type: 'textarea', rows: 2, cls: 'pl-wide', ph: 'Fire box, folder, safe…' })}</div>`, { icon: 'lock' })}`;
    },
    sheet: fridge
  };

  const people = {
    id: 'people', label: 'People', icon: 'heart',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Household', title: 'People & medical info', lede: 'Allergies, conditions and medications for everyone at home — what a paramedic or sitter would ask first.' })}
      ${u.records('people', s.people, {
        what: 'Person', titlePh: 'Name', cls: 'eb-people',
        cardClass: p => P.has(p.allergies) ? 'is-flag' : '',
        sub: p => `${age(p.born) ? `Age ${age(p.born)}` : ''}${P.has(p.allergies) ? ' ' + u.pill('allergy', 'bad') : ''}`,
        fields: [{ k: 'born', label: 'Date of birth', type: 'date', rerender: true }, { k: 'blood', label: 'Blood type', ph: 'If known' }, { k: 'allergies', label: 'Allergies', ph: 'None known', wide: true, rerender: true }, { k: 'conditions', label: 'Conditions', ph: 'Asthma, diabetes…', wide: true }, { k: 'meds', label: 'Medications', type: 'textarea', ph: 'Name — when', wide: true }, { k: 'doctor', label: 'Doctor', ph: 'Name' }, { k: 'note', label: 'Notes', ph: 'Anything else' }],
        add: 'Add person', addKind: 'world', empty: u.empty('heart', 'No one added yet', 'Add everyone who lives here — kids first.')
      })}`;
    },
    sheet: fridge
  };

  const contacts = {
    id: 'contacts', label: 'Contacts', icon: 'user',
    render(ctx) {
      const s = ctx.state;
      return `${u.head({ eyebrow: 'Who to call', title: 'Contacts & numbers', lede: 'Emergency services first, then family, doctors, school, neighbors and the home services you’d call in a crisis.' })}
      ${GROUPS.map(([k, label]) => { const list = s.contacts.map((c, i) => Object.assign({ __i: i }, c)).filter(c => c.group === k); return u.panel(label, `${u.table('contacts', list, [
        { k: 'role', label: 'Role', w: '170px', ph: 'e.g. Pediatrician' }, { k: 'name', label: 'Name', title: true, w: '1.2fr', ph: 'Name' },
        { k: 'phone', label: 'Phone', type: 'tel', w: '170px', ph: 'Phone' }, { k: 'group', label: 'Group', type: 'select', options: GROUPS, w: '160px', rerender: true }, { k: 'note', label: 'Notes', w: '1fr', ph: 'Optional' }
      ], { index: c => c.__i, total: s.contacts.length, what: 'contact', empty: 'None yet.' })}<div class="pl-list-foot">${u.btn('Add contact', { sm: true, icon: 'plus', act: 'addC', data: { group: k } })}</div>`, { cls: 'y-panel--flat' }); }).join('')}`;
    },
    actions: { addC(ctx, d) { const s = ctx.state; s.contacts.push(contact(d.group)); ctx.focus(`[data-bind="contacts.${s.contacts.length - 1}.role"]`); } },
    sheet: fridge
  };

  const pets = {
    id: 'pets', label: 'Pets', icon: 'heart',
    render(ctx) {
      return `${u.head({ eyebrow: 'Pets', title: 'Pets', lede: 'So a neighbor or sitter can care for them if you can’t get home.' })}
      ${u.records('pets', ctx.state.pets, { what: 'Pet', titlePh: 'Pet’s name', fields: [{ k: 'kind', label: 'Type / breed', ph: 'Dog · lab mix' }, { k: 'chip', label: 'Microchip #', ph: 'Optional' }, { k: 'vet', label: 'Vet', ph: 'Clinic' }, { k: 'vetPhone', label: 'Vet phone', type: 'tel', ph: 'Phone' }, { k: 'food', label: 'Food & routine', type: 'textarea', wide: true }, { k: 'meds', label: 'Medications', wide: true, ph: 'None' }], add: 'Add pet', addKind: 'world', empty: u.empty('heart', 'No pets added', 'Skip this page if you don’t have any.') })}`;
    }
  };

  const notes = {
    id: 'notes', label: 'Notes', icon: 'edit',
    render(ctx) { return `${u.head({ eyebrow: 'Parking lot', title: 'Notes', lede: 'Go-bag contents, when to check smoke alarms, anything else worth knowing.' })}${u.notes('notes', ctx.state.notes, { rows: 12 })}`; }
  };

  function fridge(ctx) {
    const s = ctx.state, h = s.home;
    const cs = s.contacts.filter(c => P.has(c.name) || P.has(c.phone));
    return `<h1>${esc(h.name || 'Emergency info')}</h1><p class="pl-sheet-meta">${[h.address, h.spareKey && `Spare key: ${h.spareKey}`, h.wifi && `Wi-Fi: ${h.wifi}`].filter(Boolean).map(esc).join(' · ')}</p>
      <div class="eb-sheet-cols"><div>
        <h2>Contacts</h2><table><tbody>${cs.map(c => `<tr><td>${esc(c.role || GROUP[c.group])}</td><td><b>${esc(c.name)}</b></td><td style="white-space:nowrap"><b>${esc(c.phone)}</b></td></tr>`).join('')}</tbody></table>
      </div><div>
        <h2>People</h2><table><tbody>${s.people.filter(p => P.has(p.name)).map(p => `<tr><td><b>${esc(p.name)}</b>${age(p.born) ? `<br>age ${age(p.born)}` : ''}${p.blood ? ` · ${esc(p.blood)}` : ''}</td><td>${p.allergies ? `<b>Allergy: ${esc(p.allergies)}</b><br>` : ''}${esc([p.conditions, p.meds].filter(Boolean).join(' · '))}</td></tr>`).join('')}</tbody></table>
        <h2>Meeting places</h2><p>${h.meet ? `<b>Near home:</b> ${esc(h.meet)}<br>` : ''}${h.meetFar ? `<b>Away:</b> ${esc(h.meetFar)}<br>` : ''}${h.outOfTown ? `<b>Check in with:</b> ${esc(h.outOfTown)}` : ''}</p>
        ${h.shutoffs ? `<h2>Shut-offs</h2><p>${esc(h.shutoffs)}</p>` : ''}
        ${s.pets.filter(p => P.has(p.name)).length ? `<h2>Pets</h2><p>${s.pets.filter(p => P.has(p.name)).map(p => `<b>${esc(p.name)}</b> ${esc(p.kind)}${p.vet ? ` · vet ${esc(p.vet)} ${esc(p.vetPhone)}` : ''}`).join('<br>')}</p>` : ''}
      </div></div>`;
  }

  window.HBFamily = {
    pages: { plan, people, contacts, pets }, blank, sample, normalize,
    rows: { people: () => person(), pets: () => pet(), contacts: () => contact('family') }
  };
})();
