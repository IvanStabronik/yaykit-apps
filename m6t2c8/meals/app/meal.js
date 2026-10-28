/* Meal Planner App — a weekly meal plan, recipe cards and one grocery list. Yaykit planner engine, home world.
   The week grid comes from Meal + Grocery, the recipe box from Recipe Box. New: a meal named after a recipe brings its
   ingredients (scaled) into the grocery list, merged with free-text "to buy" items and extras, grouped by aisle. */
(function () {
  'use strict';
  const P = window.Planner, u = P.ui, D = P.D, esc = u.esc, I = u.icon;
  const txt = v => (v == null ? '' : String(v));

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const SLOTS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snack', 'Snack']];
  const MULTS = [['0.5', '½×'], ['1', '1×'], ['1.5', '1½×'], ['2', '2×'], ['3', '3×']];
  const AISLES = ['Produce', 'Meat & fish', 'Dairy & eggs', 'Bakery', 'Pantry', 'Spices', 'Frozen', 'Snacks & drinks', 'Household', 'Other'];
  const GUESS = [
    ['Frozen', /frozen|ice cream|pizza/],
    ['Produce', /apple|banana|berr|broccoli|lettuce|salad|greens|cucumber|carrot|potato|onion|garlic|tomato(?!es, canned)|pepper|spinach|lemon|lime|avocado|fruit|herb|basil|mushroom|zucchini|grape|orange/],
    ['Meat & fish', /chicken|beef|pork|turkey|salmon|fish|tuna|shrimp|sausage|bacon|ham|mince/],
    ['Dairy & eggs', /milk|yogurt|yoghurt|cheese|cheddar|parmesan|butter|cream|egg/],
    ['Bakery', /bread|tortilla|wrap|bagel|bun|pita|croissant/],
    ['Spices', /cumin|paprika|chili powder|oregano|cinnamon|spice/],
    ['Snacks & drinks', /chips|crackers|cookie|juice|soda|coffee|tea|chocolate|hummus|nuts|popcorn|bar\b/],
    ['Household', /paper|soap|detergent|foil|trash bag|sponge/],
    ['Pantry', /rice|pasta|spaghetti|oat|cereal|bean|lentil|flour|sugar|oil|sauce|salsa|soup|peanut|jam|honey|stock|broth|can|dressing|syrup/]
  ];
  const guessAisle = t => { const s = t.toLowerCase(); const g = GUESS.find(([, re]) => re.test(s)); return g ? g[0] : 'Other'; };
  /* "cans" and "can" add up: units are keyed singular and shown plural when there is more than one */
  const ABBR = /^(oz|lb|lbs|tbsp|tsp|ml|kg|g|l|qt|pt|fl oz)$/i;
  const single = un => { const w = String(un || '').trim().toLowerCase(); if (!w || ABBR.test(w)) return w === 'lbs' ? 'lb' : w; return /(ch|sh|x)es$/.test(w) ? w.slice(0, -2) : /[^s]s$/.test(w) ? w.slice(0, -1) : w; };
  const unitFor = (un, qty) => { const w = single(un); if (!w || ABBR.test(w) || !(qty > 1)) return w; return /(ch|sh|x)$/.test(w) ? w + 'es' : w + 's'; };
  const key = (item, unit) => `${item} ${single(unit)}`.replace(/\s+/g, ' ').trim().toLowerCase().replace(/\./g, '·'); // no dots: keys are used in data paths
  const split = t => String(t || '').split(/[\n,;]+/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const fmtQty = n => (n ? String(Math.round(n * 100) / 100) : '');

  /* ---------- records ---------- */
  const ing = (item, qty, unit, aisle) => ({ id: P.uid(), item: item || '', qty: txt(qty), unit: unit || '', aisle: AISLES.includes(aisle) ? aisle : (item ? guessAisle(item) : 'Produce') });
  const recipe = o => Object.assign({ id: P.uid(), name: '', tags: '', serves: '4', time: '', ings: [], steps: '', notes: '', fav: false }, o || {});
  const meal = (dish, items, mult) => ({ dish: dish || '', items: items || '', mult: mult || '1' });
  const newDay = () => Object.fromEntries(SLOTS.map(([k]) => [k, meal()]));
  const newWeek = () => ({ days: DAYS.map(newDay), got: {}, extras: [] });

  function blank() { return { weeks: {}, recipes: [], aisles: {}, notes: '', ui: {} }; }
  function sample() {
    const s = blank();
    const pasta = recipe({ name: 'Weeknight tomato pasta', tags: 'Vegetarian, Quick', serves: '4', time: '25 min', fav: true, ings: [ing('Spaghetti', 1, 'lb', 'Pantry'), ing('Canned tomatoes', 28, 'oz', 'Pantry'), ing('Garlic', 3, 'cloves', 'Produce'), ing('Olive oil', 2, 'tbsp', 'Pantry'), ing('Parmesan', 0.5, 'cup', 'Dairy & eggs'), ing('Basil', 1, 'bunch', 'Produce')], steps: 'Boil pasta in salted water.\nWarm oil, add sliced garlic for 1 minute.\nAdd tomatoes, simmer 15 minutes, crush with a spoon.\nToss with pasta, a splash of pasta water, parmesan and basil.' });
    const chili = recipe({ name: 'One-pot bean chili', tags: 'Vegetarian, Batch cook', serves: '6', time: '40 min', ings: [ing('Black beans', 2, 'cans', 'Pantry'), ing('Kidney beans', 1, 'can', 'Pantry'), ing('Onion', 1, '', 'Produce'), ing('Canned tomatoes', 14, 'oz', 'Pantry'), ing('Ground cumin', 1, 'tsp', 'Spices'), ing('Chili powder', 2, 'tsp', 'Spices'), ing('Cheddar', 1, 'cup', 'Dairy & eggs')], steps: 'Soften onion in oil.\nAdd spices for 30 seconds.\nAdd beans and tomatoes, simmer 25 minutes.\nTop with cheddar.' });
    const tray = recipe({ name: 'Sheet-pan chicken + potatoes', tags: 'Family favorite', serves: '4', time: '45 min', fav: true, ings: [ing('Chicken thighs', 2, 'lb', 'Meat & fish'), ing('Baby potatoes', 1.5, 'lb', 'Produce'), ing('Lemon', 1, '', 'Produce'), ing('Garlic', 4, 'cloves', 'Produce'), ing('Olive oil', 3, 'tbsp', 'Pantry')], steps: 'Oven to 425°F / 220°C.\nToss everything with oil, salt and lemon slices.\nRoast 40 minutes, turning once.' });
    const tacos = recipe({ name: 'Bean taco night', tags: 'Quick, Kids like it', serves: '4', time: '20 min', ings: [ing('Tortillas', 8, '', 'Bakery'), ing('Black beans', 1, 'can', 'Pantry'), ing('Salsa', 1, 'jar', 'Pantry'), ing('Shredded cheese', 1, 'cup', 'Dairy & eggs'), ing('Lettuce', 1, 'head', 'Produce')], steps: 'Warm beans with a pinch of cumin.\nWarm tortillas in a dry pan.\nEveryone builds their own.' });
    const oats = recipe({ name: 'Overnight oats', tags: 'Breakfast, Make ahead', serves: '1', time: '5 min', ings: [ing('Rolled oats', 0.5, 'cup', 'Pantry'), ing('Milk', 0.5, 'cup', 'Dairy & eggs'), ing('Greek yogurt', 0.25, 'cup', 'Dairy & eggs'), ing('Blueberries', 0.5, 'cup', 'Produce')], steps: 'Stir oats, milk and yogurt in a jar.\nFridge overnight.\nTop with berries.' });
    const salad = recipe({ name: 'Lemony green salad', tags: 'Side, Quick', serves: '4', time: '10 min', ings: [ing('Mixed greens', 5, 'oz', 'Produce'), ing('Cucumber', 1, '', 'Produce'), ing('Lemon', 1, '', 'Produce'), ing('Olive oil', 2, 'tbsp', 'Pantry')], steps: 'Whisk lemon juice, oil and salt.\nToss with greens and sliced cucumber right before serving.' });
    s.recipes = [pasta, chili, tray, tacos, oats, salad];
    const w = newWeek();
    const plan = [
      [['Overnight oats', '', '2'], ['Leftover pasta', ''], ['Sheet-pan chicken + potatoes'], ['Apple', 'apples']],
      [['Toast + eggs', 'bread, eggs'], ['Grain bowl leftovers', ''], ['Bean taco night'], ['Cheese stick', 'string cheese']],
      [['Overnight oats', '', '2'], ['Soup + crackers', 'canned soup, crackers'], ['Rotisserie chicken + bag salad', 'rotisserie chicken, bagged salad, dressing'], ['Banana', 'bananas']],
      [['Smoothie', 'frozen berries, Greek yogurt, milk'], ['Chicken wrap', 'wraps'], ['Frozen pizza + cucumber', 'frozen pizza, cucumber'], ['Hummus + carrots', 'hummus, baby carrots']],
      [['Cereal + milk', 'cereal, milk'], ['Leftover pizza', ''], ['Weeknight tomato pasta'], ['', '']],
      [['Pancakes', 'pancake mix, eggs, maple syrup'], ['Takeout (planned!)', ''], ['One-pot bean chili', '', '1'], ['Popcorn', 'popcorn']],
      [['Eggs + toast', 'eggs, bread'], ['Chili leftovers', ''], ['Lemony green salad', 'rotisserie chicken'], ['', '']]
    ];
    w.days = plan.map(d => Object.fromEntries(SLOTS.map(([k], i) => [k, meal(...(d[i] || []))])));
    w.got = { [key('eggs')]: true, [key('bread')]: true };
    w.extras = [{ text: 'Coffee', done: false, aisle: 'Snacks & drinks' }, { text: 'Dish soap', done: false, aisle: 'Household' }];
    s.weeks = { [D.monday(D.today())]: w };
    s.notes = 'Always-buy staples: coffee, eggs, bread, bananas.\nLow-energy dinners that still count: frozen pizza + cucumber, eggs on toast.\nAllergies when friends come over: Sam — peanuts.';
    return s;
  }
  function normalize(s) {
    s.recipes = (Array.isArray(s.recipes) ? s.recipes : []).filter(x => x && typeof x === 'object').map(x => recipe({
      id: txt(x.id) || P.uid(), name: txt(x.name), tags: txt(x.tags), serves: txt(x.serves), time: txt(x.time), steps: txt(x.steps), notes: txt(x.notes), fav: !!x.fav,
      ings: (Array.isArray(x.ings) ? x.ings : []).filter(g => g && typeof g === 'object').map(g => Object.assign(ing(txt(g.item), txt(g.qty), txt(g.unit), g.aisle === 'Drinks' ? 'Snacks & drinks' : g.aisle), { id: txt(g.id) || P.uid() }))
    }));
    const weeks = {};
    Object.keys(s.weeks || {}).forEach(k => {
      if (!D.parse(k)) return;
      const r = s.weeks[k] || {}, w = newWeek();
      w.days = DAYS.map((_, i) => { const d = (r.days || [])[i] || {}; return Object.fromEntries(SLOTS.map(([sk]) => { const m = d[sk] || {}; return [sk, meal(txt(m.dish), txt(m.items), MULTS.some(x => x[0] === m.mult) ? m.mult : '1')]; })); });
      w.got = r.got && typeof r.got === 'object' ? Object.fromEntries(Object.keys(r.got).filter(x => r.got[x]).map(x => [x, true])) : {};
      w.extras = (Array.isArray(r.extras) ? r.extras : []).filter(x => x && typeof x === 'object').map(x => ({ text: txt(x.text), done: !!x.done, aisle: AISLES.includes(x.aisle) ? x.aisle : '' }));
      weeks[D.monday(k)] = w;
    });
    s.weeks = weeks;
    s.aisles = s.aisles && typeof s.aisles === 'object' ? Object.fromEntries(Object.keys(s.aisles).filter(k => AISLES.includes(s.aisles[k])).map(k => [k, s.aisles[k]])) : {};
    s.notes = txt(s.notes);
    s.ui = Object.assign({}, s.ui && typeof s.ui === 'object' ? s.ui : {});
    return s;
  }

  /* ---------- helpers ---------- */
  const wk = s => (D.parse(s.ui.week) ? s.ui.week : (s.ui.week = D.monday(D.today())));
  function week(s, mon) { if (!s.weeks[mon]) s.weeks[mon] = newWeek(); return s.weeks[mon]; }
  const findRecipe = (s, name) => (P.has(name) ? s.recipes.find(r => P.has(r.name) && key(r.name) === key(name)) : null);
  /* one merged list: recipe ingredients (scaled) + free-text "to buy" + extras */
  function grocery(s, mon) {
    const w = week(s, mon), map = new Map();
    const add = (item, qty, unit, aisle, from) => {
      const k = key(item, unit);
      if (!map.has(k)) map.set(k, { key: k, text: item.trim(), unit: unit || '', qty: 0, aisle: s.aisles[k] || aisle || guessAisle(item), meals: [] });
      const l = map.get(k); l.qty += qty; if (from && !l.meals.includes(from)) l.meals.push(from);
    };
    w.days.forEach(d => SLOTS.forEach(([sk, sl]) => {
      const m = d[sk], r = findRecipe(s, m.dish), from = m.dish || sl;
      if (r) r.ings.filter(g => P.has(g.item)).forEach(g => add(g.item, P.num(g.qty) * (P.num(m.mult) || 1), g.unit, g.aisle, r.name));
      split(m.items).forEach(t => add(t, 0, '', '', from));
    }));
    const lines = [...map.values()].map(x => Object.assign(x, { done: !!w.got[x.key] }));
    const extras = w.extras.map((x, i) => ({ key: key(x.text), text: x.text, unit: '', qty: 0, extra: i, done: x.done, aisle: x.aisle || guessAisle(x.text), meals: [] })).filter(x => P.has(x.text));
    return lines.concat(extras).sort((a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' }));
  }
  function weekNav(s) {
    const mon = wk(s), isThis = mon === D.monday(D.today());
    return `<div class="mg-nav" role="group" aria-label="Choose a week">
      ${u.iconBtn('prev', 'Previous week', 'week', { n: -7 }, { cls: 'mg-nav-btn' })}
      <span class="mg-weeklabel y-num">${esc(D.short(mon))} – ${esc(D.short(D.add(mon, 6)))}</span>
      ${u.iconBtn('next', 'Next week', 'week', { n: 7 }, { cls: 'mg-nav-btn' })}
      ${isThis ? '' : u.btn('This week', { sm: true, act: 'week', data: { n: 0 } })}</div>`;
  }
  const weekAct = {
    week(ctx, d) { const s = ctx.state; s.ui.week = +d.n === 0 ? D.monday(D.today()) : D.add(wk(s), +d.n); },
    copyLast(ctx) {
      const s = ctx.state, mon = wk(s), prev = s.weeks[D.add(mon, -7)];
      if (!prev) return false;
      week(s, mon).days = P.clone(prev.days);
      ctx.toast('Copied last week’s meals — swap what you like');
    }
  };

  /* ---------- meal plan ---------- */
  const plan = {
    id: 'week', label: 'Meal plan', icon: 'calendar',
    render(ctx) {
      const s = ctx.state, mon = wk(s), w = week(s, mon), b = `weeks.${mon}`, t = D.today(), todayIdx = D.diff(mon, t);
      const slots = SLOTS.filter(([k]) => !(s.ui.hideSnacks && k === 'snack'));
      const empty = w.days.every(d => SLOTS.every(([k]) => !P.has(d[k].dish)));
      return `${u.head({ eyebrow: 'This week', title: '<span data-slot="title"></span>', lede: 'Type a meal. If it’s one of your recipes, its ingredients go on the grocery list by themselves — otherwise jot what to buy.', meta: weekNav(s) })}
      <div data-slot="kpis"></div>
      <div class="pl-row mg-tools">${u.switch('ui.hideSnacks', s.ui.hideSnacks, 'Hide snacks')}<span class="pl-spacer"></span>${empty && s.weeks[D.add(mon, -7)] ? u.btn('Copy last week', { sm: true, icon: 'doc', act: 'copyLast' }) : ''}</div>
      <datalist id="mgRecipes">${s.recipes.filter(r => P.has(r.name)).map(r => `<option value="${esc(r.name)}"></option>`).join('')}</datalist>
      <div class="mg-days">${DAYS.map((day, i) => `
        <article class="mg-day${i === todayIdx ? ' is-today' : ''}">
          <h3>${day} <span class="y-num">${esc(D.short(D.add(mon, i)))}</span>${i === todayIdx ? u.pill('today', 'world') : ''}</h3>
          ${slots.map(([k, label]) => {
            const m = w.days[i][k], p = `${b}.days.${i}.${k}`, r = findRecipe(s, m.dish);
            return `<div class="mg-slot${P.has(m.dish) ? ' is-set' : ''}${r ? ' is-recipe' : ''}">
              <div class="mg-slot-top"><span class="mg-slot-label">${label}</span>${r ? `<span class="mg-rec">${I('star')}recipe</span>${u.select(`${p}.mult`, m.mult, MULTS, { label: `${day} ${label} servings`, cls: 'mg-mult' })}` : ''}</div>
              ${u.input(`${p}.dish`, m.dish, { label: `${day} ${label}`, ph: k === 'dinner' ? 'Dinner — type or pick a recipe' : label, list: 'mgRecipes', rerender: true, cls: 'mg-dish' })}
              ${u.input(`${p}.items`, m.items, { label: `${day} ${label} — to buy`, ph: r ? 'Anything extra to buy' : 'To buy, comma-separated', cls: 'mg-items' })}
            </div>`;
          }).join('')}
        </article>`).join('')}</div>
      ${u.notes('notes', s.notes, { rows: 4, title: 'Notes', ph: 'Staples, low-energy dinners, allergies to remember…' })}`;
    },
    slots: {
      title(ctx) {
        const s = ctx.state, w = week(s, wk(s)), n = w.days.filter(d => P.has(d.dinner.dish)).length;
        return n === 7 ? 'Every dinner <em>sorted</em>' : `<em>${n}</em> of 7 dinners sorted`;
      },
      kpis(ctx) {
        const s = ctx.state, mon = wk(s), w = week(s, mon), g = grocery(s, mon);
        const named = w.days.reduce((n, d) => n + SLOTS.filter(([k]) => P.has(d[k].dish)).length, 0);
        const rec = w.days.reduce((n, d) => n + SLOTS.filter(([k]) => findRecipe(s, d[k].dish)).length, 0);
        return u.kpis([['Meals planned', `${named}<small class="mg-of">/28</small>`], ['From your recipes', String(rec), 'y-kpi--world'],
          ['To buy', String(g.filter(x => !x.done).length), 'y-kpi--accent', `<button type="button" class="mg-link" data-act="go" data-page="grocery">Open grocery list →</button>`]]);
      }
    },
    actions: weekAct,
    sheet(ctx) {
      const s = ctx.state, mon = wk(s), w = week(s, mon);
      return `<h1>Meal plan</h1><p class="pl-sheet-meta">Week of ${esc(D.full(mon))}</p><table><thead><tr><th></th>${SLOTS.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody>${DAYS.map((d, i) => `<tr><td><b>${d}</b></td>${SLOTS.map(([k]) => `<td>${esc(w.days[i][k].dish)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
  };

  /* ---------- grocery list ---------- */
  const shop = {
    id: 'grocery', label: 'Grocery list', icon: 'check',
    badge: ctx => grocery(ctx.state, wk(ctx.state)).filter(x => !x.done).length || '',
    render(ctx) {
      const s = ctx.state, mon = wk(s), g = grocery(s, mon), b = `weeks.${mon}`, hide = !!s.ui.hideGot;
      const groups = AISLES.map(a => [a, g.filter(x => x.aisle === a && !(hide && x.done))]).filter(x => x[1].length);
      const done = g.filter(x => x.done).length;
      const row = x => {
        const bind = x.extra != null ? `${b}.extras.${x.extra}.done` : `${b}.got.${x.key}`, amt = [fmtQty(x.qty), unitFor(x.unit, x.qty)].filter(Boolean).join(' ');
        return `<li class="pl-ci mg-g${x.done ? ' is-done' : ''}">${u.tick(bind, x.done, `Got ${x.text}`, { rerender: true })}
          <div class="pl-ci-main"><span class="pl-ci-text">${amt ? `<b class="y-num">${esc(amt)}</b> ` : ''}${esc(x.text)}</span><span class="pl-ci-meta">${x.meals.length ? `for ${esc(x.meals.slice(0, 3).join(', '))}${x.meals.length > 3 ? ` +${x.meals.length - 3}` : ''}` : 'extra'}</span></div>
          ${u.select(x.extra != null ? `${b}.extras.${x.extra}.aisle` : `aisles.${x.key}`, x.aisle, AISLES, { label: `Aisle for ${x.text}`, cls: 'mg-aisle', rerender: true })}
          ${x.extra != null ? u.iconBtn('close', `Remove ${x.text}`, 'remove', { list: `${b}.extras`, i: x.extra, what: x.text }) : ''}</li>`;
      };
      return `${u.head({ eyebrow: `Week of ${D.short(mon)}`, title: g.length ? `<em>${g.length - done}</em> to buy` : 'Grocery list', lede: 'Built from this week’s meals: recipe ingredients added up and scaled, plus anything you jotted, grouped by aisle.', meta: weekNav(s) })}
      ${u.panel('Shopping list', `<div class="pl-row mg-gtools">${u.switch('ui.hideGot', hide, 'Hide ticked')}<span class="pl-spacer"></span>${done ? u.btn('Untick all', { sm: true, kind: 'ghost', act: 'untick' }) : ''}</div>
        ${g.length ? (groups.length ? groups.map(([a, items]) => `<section class="mg-aisle-group"><h3>${esc(a)} <span class="pl-muted">${items.length}</span></h3><ul class="pl-checklist">${items.map(row).join('')}</ul></section>`).join('') : '<p class="pl-muted">Everything is ticked. Nice.</p>')
          : u.empty('check', 'Nothing to buy yet', 'Plan a meal from your recipes, jot “to buy” items, or add extras below.')}
        <div class="mg-extra">${u.quickAdd(`${b}.extras`, { ph: 'Add an extra (coffee, dish soap…)', label: 'Add an extra item' })}</div>`, { icon: 'check' })}`;
    },
    actions: Object.assign({ untick(ctx) { const s = ctx.state, w = week(s, wk(s)); w.got = {}; w.extras.forEach(x => { x.done = false; }); } }, weekAct),
    sheet(ctx) {
      const s = ctx.state, mon = wk(s), g = grocery(s, mon).filter(x => !x.done);
      return `<h1>Grocery list</h1><p class="pl-sheet-meta">Week of ${esc(D.full(mon))}</p>${AISLES.map(a => { const l = g.filter(x => x.aisle === a); return l.length ? `<h2>${esc(a)}</h2><table><tbody>${l.map(x => `<tr><td style="width:6mm"><span class="pl-box"></span></td><td style="width:26mm"><b>${esc([fmtQty(x.qty), unitFor(x.unit, x.qty)].filter(Boolean).join(' '))}</b></td><td>${esc(x.text)}</td></tr>`).join('')}</tbody></table>` : ''; }).join('')}`;
    }
  };

  /* ---------- recipes ---------- */
  const box = {
    id: 'recipes', label: 'Recipes', icon: 'star',
    render(ctx) {
      const s = ctx.state, q = txt(s.ui.q).toLowerCase().trim(), fav = !!s.ui.fav, mon = wk(s);
      const list = s.recipes.map((r, i) => Object.assign({ __i: i }, r)).filter(r => (!fav || r.fav) && (!q || `${r.name} ${r.tags} ${r.ings.map(g => g.item).join(' ')}`.toLowerCase().includes(q)));
      const open = s.recipes.findIndex(r => r.id === s.ui.open);
      const used = new Set(week(s, mon).days.flatMap(d => SLOTS.map(([k]) => findRecipe(s, d[k].dish))).filter(Boolean).map(r => r.id));
      return `${u.head({ eyebrow: 'Recipe box', title: `<em>${s.recipes.filter(r => P.has(r.name)).length}</em> recipes`, lede: 'Save a recipe once. Type its name in the meal plan and the ingredients land on the grocery list.' })}
      <div class="pl-row rb-tools"><div class="rb-search">${I('search')}${u.input('ui.q', s.ui.q, { label: 'Search recipes', ph: 'Search — try “lemon”', live: true })}</div>${u.switch('ui.fav', fav, 'Favorites only')}<span class="pl-spacer"></span>${u.btn('New recipe', { kind: 'world', icon: 'plus', act: 'newRecipe' })}</div>
      ${open >= 0 ? editor(ctx, open) : ''}
      ${list.length ? `<div class="rb-cards">${list.map(r => `<article class="rb-card${r.id === s.ui.open ? ' is-open' : ''}">
          <button type="button" class="rb-fav${r.fav ? ' is-on' : ''}" data-act="toggle" data-bind="recipes.${r.__i}.fav" aria-pressed="${r.fav}" aria-label="Favorite ${esc(r.name)}">${I('heart')}</button>
          <h3>${esc(r.name || 'Untitled recipe')}</h3><p class="rb-meta">${[r.time, r.serves && `serves ${r.serves}`, P.plural(r.ings.filter(g => P.has(g.item)).length, 'ingredient')].filter(Boolean).map(esc).join(' · ')}</p>
          ${r.tags ? `<div class="rb-tags">${r.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => `<span class="pl-pill pl-pill--world">${esc(t)}</span>`).join('')}</div>` : ''}
          <div class="rb-card-btns">${u.btn(r.id === s.ui.open ? 'Close' : 'Open', { sm: true, act: 'set', data: { bind: 'ui.open', value: r.id === s.ui.open ? '' : r.id } })}${used.has(r.id) ? u.pill('In this week’s plan', 'good') : ''}</div></article>`).join('')}</div>`
        : u.empty('star', s.recipes.length ? 'No recipes match' : 'No recipes yet', s.recipes.length ? 'Try another word.' : 'Add the recipes you actually cook — even the “no recipe” ones.')}`;
    },
    actions: {
      newRecipe(ctx) { const s = ctx.state, r = recipe({ ings: [ing('', '', '', 'Produce')] }); s.recipes.unshift(r); s.ui.open = r.id; ctx.focus('[data-bind="recipes.0.name"]'); },
      closeRecipe(ctx) { ctx.state.ui.open = ''; }
    },
    sheet(ctx) {
      const s = ctx.state, r = s.recipes.find(x => x.id === s.ui.open) || s.recipes[0];
      if (!r) return '<p>No recipes yet.</p>';
      return `<div class="rb-print"><h1>${esc(r.name)}</h1><p class="pl-sheet-meta">${[r.time, r.serves && `Serves ${r.serves}`, r.tags].filter(Boolean).map(esc).join(' · ')}</p>
        <div class="rb-print-cols"><div><h2>Ingredients</h2><ul>${r.ings.filter(g => P.has(g.item)).map(g => `<li>${esc([g.qty, g.unit].filter(Boolean).join(' '))} <b>${esc(g.item)}</b></li>`).join('')}</ul></div>
        <div><h2>Method</h2><ol>${r.steps.split('\n').filter(x => x.trim()).map(x => `<li>${esc(x)}</li>`).join('')}</ol>${r.notes ? `<h2>Notes</h2><p>${esc(r.notes)}</p>` : ''}</div></div></div>`;
    }
  };
  function editor(ctx, i) {
    const r = ctx.state.recipes[i];
    return u.panel('Edit recipe', `
      <div class="pl-fields">${u.field('Name', `recipes.${i}.name`, r.name, { ph: 'Recipe name', cls: 'pl-wide' })}${u.field('Tags', `recipes.${i}.tags`, r.tags, { ph: 'Vegetarian, Quick' })}${u.field('Serves', `recipes.${i}.serves`, r.serves, { num: true })}${u.field('Time', `recipes.${i}.time`, r.time, { ph: '30 min' })}</div>
      <h3 class="rb-sub">Ingredients</h3>
      ${u.table(`recipes.${i}.ings`, r.ings, [{ k: 'qty', label: 'Qty', num: true, w: '80px', ph: '1' }, { k: 'unit', label: 'Unit', w: '100px', ph: 'cup' }, { k: 'item', label: 'Ingredient', title: true, w: '1.5fr', ph: 'Ingredient' }, { k: 'aisle', label: 'Aisle', type: 'select', options: AISLES, w: '160px' }], { what: 'ingredient', move: true, add: 'Add ingredient', tpl: 'ings' })}
      <div class="pl-fields rb-steps">${u.field('Method — one step per line', `recipes.${i}.steps`, r.steps, { type: 'textarea', rows: 6, cls: 'pl-wide' })}${u.field('Notes', `recipes.${i}.notes`, r.notes, { type: 'textarea', rows: 2, ph: 'Swaps, where it came from, who loves it', cls: 'pl-wide' })}</div>
      <div class="pl-row">${u.btn('Done', { kind: 'world', icon: 'check', act: 'closeRecipe' })}${u.btn('Print this card', { icon: 'print', act: 'print' })}<span class="pl-spacer"></span>${u.btn('Delete recipe', { kind: 'danger', sm: true, icon: 'trash', act: 'remove', data: { list: 'recipes', i, what: r.name } })}</div>`, { icon: 'edit', cls: 'rb-editor', id: 'rbEditor' });
  }

  P.create({
    slug: 'meal-planner-app',
    name: 'Meal Planner',
    world: 'home',
    welcome: 'Name this week’s dinners first — the grocery list builds itself.',
    pages: [plan, shop, box],
    blank, sample, normalize,
    open(ctx) { ctx.state.ui.week = D.monday(D.today()); },
    rows: { ings: () => ing('', '', '', 'Produce'), recipes: () => recipe(), extras: () => ({ text: '', done: false, aisle: '' }) },
    about: '<p><b>Meal Planner</b> plans the week’s meals, keeps your recipes as cards and builds one grocery list. Name a meal after one of your recipes and its ingredients — scaled to the servings you pick — land on the list, merged with anything else you jotted and grouped by aisle.</p>',
    disclaimer: 'Meal Planner is a personal planning tool, not nutrition, dietary or medical advice.'
  });
})();
