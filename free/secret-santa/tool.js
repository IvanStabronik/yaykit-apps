/* Free Secret Santa generator. Same draw as the Christmas Gift Tracker App (products/christmas-gift-tracker-app/app/gifts.js):
   a random giver → receiver loop, nobody draws themselves or the person they should avoid, either way round.
   A match travels in the link's #hash, which never reaches a server. All names reach the page as text, never as HTML. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const KEY = 'yaykit-santa';
  let players = [], pairs = null, seq = 0;

  function encode(obj) {
    const b = new TextEncoder().encode(JSON.stringify(obj)), k = new TextEncoder().encode(KEY);
    let s = '';
    b.forEach((c, i) => { s += String.fromCharCode(c ^ k[i % k.length]); });
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decode(text) {
    const s = atob(text.replace(/-/g, '+').replace(/_/g, '/')), k = new TextEncoder().encode(KEY);
    const b = Uint8Array.from(s, (c, i) => c.charCodeAt(0) ^ k[i % k.length]);
    return JSON.parse(new TextDecoder().decode(b));
  }
  const pick = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
  const longDate = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''; };

  function draw(list) {
    const bad = (a, b) => a.id === b.id || a.avoid === b.id || b.avoid === a.id;
    for (let t = 0; t < 4000; t++) {
      const r = list.slice();
      for (let i = r.length - 1; i > 0; i--) { const j = pick(i + 1); [r[i], r[j]] = [r[j], r[i]]; }
      if (list.every((g, i) => !bad(g, r[i]))) return list.map((g, i) => [g, r[i]]);
    }
    return null;
  }

  const link = (g, r) => {
    const data = { g: g.name, r: r.name, n: $('group').value.trim(), b: $('budget').value.trim(), d: $('date').value };
    return `${location.origin}${location.pathname}#m=${encode(data)}`;
  };

  function renderPlayers() {
    const ul = $('players');
    ul.textContent = '';
    players.forEach(p => {
      const li = document.createElement('li'), b = document.createElement('b'), sel = document.createElement('select'), del = document.createElement('button');
      b.textContent = p.name;
      sel.className = 'y-select';
      sel.setAttribute('aria-label', `${p.name} should not draw`);
      sel.add(new Option('Can draw anyone', ''));
      players.filter(o => o.id !== p.id).forEach(o => sel.add(new Option(`Not ${o.name}`, String(o.id), false, p.avoid === o.id)));
      sel.addEventListener('change', () => { p.avoid = sel.value ? Number(sel.value) : 0; clearDraw(); });
      del.className = 'y-btn y-btn--ghost y-btn--sm'; del.type = 'button'; del.textContent = 'Remove';
      del.setAttribute('aria-label', `Remove ${p.name}`);
      del.addEventListener('click', () => {
        players = players.filter(o => o !== p);
        players.forEach(o => { if (o.avoid === p.id) o.avoid = 0; });
        renderPlayers(); clearDraw();
      });
      li.append(b, sel, del);
      ul.append(li);
    });
    const n = players.length;
    $('count').textContent = n >= 3 ? `${n} people ready` : 'Add three or more names';
    $('draw').disabled = n < 3;
  }

  function clearDraw() {
    pairs = null;
    $('matches').textContent = '';
    $('matchHint').hidden = true;
    $('error').hidden = true;
    $('draw').textContent = 'Draw names';
    $('countSub').textContent = 'Use the menu next to a name to keep couples or housemates apart.';
  }

  function say(btn, text, back) { btn.textContent = text; setTimeout(() => { btn.textContent = back; }, 1500); }

  function renderMatches() {
    const ul = $('matches');
    ul.textContent = '';
    pairs.forEach(([g, r]) => {
      const li = document.createElement('li'), b = document.createElement('b'), acts = document.createElement('div'), copy = document.createElement('button'), show = document.createElement('button'), res = document.createElement('p');
      b.textContent = g.name;
      acts.className = 'ft-acts';
      copy.className = 'y-btn y-btn--secondary y-btn--sm'; copy.type = 'button'; copy.textContent = 'Copy link';
      show.className = 'y-btn y-btn--ghost y-btn--sm'; show.type = 'button'; show.textContent = 'Show';
      res.className = 'ft-reveal'; res.hidden = true; res.style.margin = '0';
      copy.addEventListener('click', async () => {
        const url = link(g, r), text = `${g.name}, your Secret Santa match is ready. Open this link in private: ${url}`;
        try { await navigator.clipboard.writeText(text); say(copy, 'Copied', 'Copy link'); }
        catch (e) { prompt(`Copy this link for ${g.name}`, url); }
      });
      show.addEventListener('click', () => {
        res.hidden = !res.hidden;
        res.textContent = `${g.name}, you are Secret Santa for ${r.name}`;
        show.textContent = res.hidden ? 'Show' : 'Hide';
      });
      acts.append(copy, show);
      li.append(b, acts, res);
      ul.append(li);
    });
    $('matchHint').hidden = false;
    $('draw').textContent = 'Draw again';
    $('countSub').textContent = 'Everyone has a match. Send each person their own link.';
  }

  function fact(text) { const li = document.createElement('li'); li.textContent = text; $('revFacts').append(li); }

  function showMatch(text) {
    let m;
    try { m = decode(text); } catch (e) { m = null; }
    if (!m || typeof m.g !== 'string' || typeof m.r !== 'string') return false;
    $('reveal').hidden = false; $('make').hidden = true; $('tool').hidden = true; $('about').hidden = true;
    $('revGroup').textContent = m.n ? String(m.n) : 'Secret Santa';
    $('revHello').textContent = `${m.g}, you are Secret Santa for`;
    $('revTo').textContent = m.r;
    if (m.b) fact(`Limit ${m.b}`);
    if (longDate(m.d)) fact(`Gift swap ${longDate(m.d)}`);
    document.title = 'Your Secret Santa match';
    const robots = document.createElement('meta');
    robots.name = 'robots'; robots.content = 'noindex';
    document.head.append(robots);
    return true;
  }

  const hash = /^#m=([\w-]+)$/.exec(location.hash);
  if (!(hash && showMatch(hash[1]))) {
    $('addForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('name').value.trim();
      if (!name) return;
      if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        $('error').textContent = `${name} is already on the list. Add a last initial to tell them apart.`;
        $('error').hidden = false;
        return;
      }
      players.push({ id: ++seq, name, avoid: 0 });
      $('name').value = '';
      $('name').focus();
      renderPlayers(); clearDraw();
    });
    $('draw').addEventListener('click', () => {
      const res = draw(players);
      if (!res) {
        clearDraw();
        $('error').textContent = 'No fair draw with these rules. Loosen one and try again.';
        $('error').hidden = false;
        return;
      }
      $('error').hidden = true;
      pairs = res;
      renderMatches();
    });
    ['group', 'budget', 'date'].forEach(id => $(id).addEventListener('input', () => { if (pairs) renderMatches(); }));
    renderPlayers();
  }
  addEventListener('hashchange', () => location.reload());
})();
