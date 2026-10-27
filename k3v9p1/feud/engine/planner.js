/* Yaykit Planner engine v1.0 — shared shell for every planner product.
   Needs kit/yaykit.js (window.Yay). Exposes window.Planner.

   A product is one call:
     Planner.create({
       slug, name, world, pages: [{ id, label, icon, render(ctx), slots?, actions?, sheet?, badge? }],
       blank(), sample(), normalize?(s), open?(ctx), rows?: { listKey: () => ({…}) },
       actions?, about?, disclaimer?, currency?, timer?: { overtime }
     });

   Binding:  <input data-bind="path.to.value">      → state updated, saved, live slots refreshed
             data-rerender on an input               → page re-renders on change (filters, toggles)
             data-live on an input                   → page re-renders while typing (search), caret kept
             <select data-onchange="act">             → runs an action with d.value
             <div data-slot="name">                  → filled by page.slots[name](ctx) after every edit
             <button data-act="name" data-…>         → page.actions / app.actions / built-ins below
             <form data-quickadd data-list data-key> → push one item from a single text field
   Built-in actions: go set toggle add remove up down sample blank welcome-hide sample-keep print
                     timer-start timer-toggle timer-reset timer-add timer-clear
*/
(function () {
  'use strict';
  const Y = window.Yay, esc = Y.esc, I = Y.icon;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- paths ---------- */
  function get(obj, path) { return String(path).split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
  function set(obj, path, val) {
    const ks = String(path).split('.'), last = ks.pop();
    let o = obj;
    ks.forEach((k, i) => { if (o[k] == null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(ks[i + 1] || last) ? [] : {}; o = o[k]; });
    o[last] = val;
  }
  const clone = v => JSON.parse(JSON.stringify(v));
  let seq = 0;
  const uid = () => Date.now().toString(36).slice(-5) + (++seq).toString(36) + Math.random().toString(36).slice(2, 5);

  /* ---------- numbers & dates ---------- */
  function num(v) { const n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
  const has = v => String(v == null ? '' : v).trim() !== '';
  const pad = n => String(n).padStart(2, '0');
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
  const D = {
    iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); },
    today() { return D.iso(new Date()); },
    parse(iso) { const p = String(iso || '').split('-').map(Number); return p.length === 3 && p[0] ? new Date(p[0], p[1] - 1, p[2], 12) : null; },
    add(iso, n) { const d = D.parse(iso) || new Date(); d.setDate(d.getDate() + n); return D.iso(d); },
    monday(iso) { const d = D.parse(iso || D.today()) || new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return D.iso(d); },
    diff(a, b) { const x = D.parse(a), y = D.parse(b); return x && y ? Math.round((y - x) / 864e5) : null; },
    fmt(iso, o) { const d = D.parse(iso); return d ? d.toLocaleDateString('en-US', o || { weekday: 'short', month: 'short', day: 'numeric' }) : ''; },
    long(iso) { return D.fmt(iso, { weekday: 'long', month: 'long', day: 'numeric' }); },
    short(iso) { return D.fmt(iso, { month: 'short', day: 'numeric' }); },
    full(iso) { return D.fmt(iso, { month: 'short', day: 'numeric', year: 'numeric' }); },
    day(iso) { return D.fmt(iso, { weekday: 'short' }); },
    rel(iso) {
      const n = D.diff(D.today(), iso);
      if (n == null) return '';
      if (n === 0) return 'today'; if (n === 1) return 'tomorrow'; if (n === -1) return 'yesterday';
      return n > 0 ? `in ${n} days` : `${-n} days ago`;
    },
    time(t) {
      const m = /^(\d{1,2}):(\d{2})/.exec(String(t || ''));
      if (!m) return String(t || '');
      const h = +m[1];
      return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
    },
    mins(t) { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : null; }
  };
  function clock(sec) {
    const neg = sec < 0, s = Math.abs(Math.round(sec));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return (neg ? '+' : '') + (h ? h + ':' + pad(m) : m) + ':' + pad(r);
  }

  /* ---------- UI builders ---------- */
  let fid = 0;
  const nid = () => 'pl' + (++fid);
  const attrs = o => Object.keys(o || {}).filter(k => o[k] !== false && o[k] != null)
    .map(k => o[k] === true ? ` ${k}` : ` ${k}="${esc(o[k])}"`).join('');
  const optList = (options, value) => options.map(o => {
    const [v, l] = Array.isArray(o) ? o : [o, o];
    return `<option value="${esc(v)}"${String(v) === String(value == null ? '' : value) ? ' selected' : ''}>${esc(l)}</option>`;
  }).join('');

  const ui = {
    icon: I,
    esc,
    /* bare controls */
    input(bind, value, o) {
      o = o || {};
      const isNum = o.num || o.type === 'money' || o.type === 'number';
      const type = ['date', 'time', 'email', 'tel', 'url', 'month'].includes(o.type) ? o.type : 'text';
      return `<input class="y-input${isNum ? ' y-input--num' : ''}${o.cls ? ' ' + o.cls : ''}" type="${type}" data-bind="${esc(bind)}" value="${esc(value == null ? '' : value)}"${attrs({
        id: o.id, placeholder: o.ph, 'aria-label': o.label, inputmode: isNum ? 'decimal' : o.inputmode, autocomplete: 'off',
        'data-rerender': o.rerender, 'data-live': o.live, maxlength: o.max, list: o.list
      })}${o.attrs || ''}>`;
    },
    textarea(bind, value, o) {
      o = o || {};
      return `<textarea class="y-textarea${o.auto ? ' y-textarea--auto' : ''}${o.cls ? ' ' + o.cls : ''}" data-bind="${esc(bind)}"${attrs({ id: o.id, rows: o.rows || 3, placeholder: o.ph, 'aria-label': o.label })}>${esc(value == null ? '' : value)}</textarea>`;
    },
    select(bind, value, options, o) {
      o = o || {};
      return `<select class="y-select${o.cls ? ' ' + o.cls : ''}" data-bind="${esc(bind)}"${attrs({ id: o.id, 'aria-label': o.label, 'data-rerender': o.rerender })}>${o.blank != null ? `<option value="">${esc(o.blank)}</option>` : ''}${optList(options, value)}</select>`;
    },
    /* labelled field */
    field(label, bind, value, o) {
      o = o || {};
      const id = nid();
      const c = Object.assign({}, o, { id });
      const ctl = o.options ? ui.select(bind, value, o.options, c)
        : o.type === 'textarea' ? ui.textarea(bind, value, c)
          : ui.input(bind, value, c);
      return `<div class="y-field${o.cls ? ' ' + o.cls : ''}"${o.wide ? ' data-wide' : ''}><label class="y-label" for="${id}">${esc(label)}${o.optional ? ' <span class="pl-opt">optional</span>' : ''}</label>${ctl}${o.hint ? `<span class="pl-hint">${esc(o.hint)}</span>` : ''}</div>`;
    },
    /* checkbox row (whole row is the label) */
    check(bind, checked, html, o) {
      o = o || {};
      return `<label class="y-check${o.cls ? ' ' + o.cls : ''}"><input type="checkbox" data-bind="${esc(bind)}"${checked ? ' checked' : ''}${o.rerender ? ' data-rerender' : ''}><span class="y-box">${I('check')}</span><span class="pl-check-body"><span class="y-check-text">${html}</span>${o.meta ? `<span class="pl-check-meta">${o.meta}</span>` : ''}</span>${o.after || ''}</label>`;
    },
    /* small checkbox with no text (tables) */
    tick(bind, checked, label, o) {
      o = o || {};
      return `<label class="pl-tick${o.cls ? ' ' + o.cls : ''}"><input type="checkbox" data-bind="${esc(bind)}"${checked ? ' checked' : ''}${o.rerender ? ' data-rerender' : ''}><span class="y-box">${I('check')}</span><span class="y-sr">${esc(label)}</span></label>`;
    },
    switch(bind, checked, label, o) {
      o = o || {};
      return `<label class="y-switch pl-switch"><input type="checkbox" data-bind="${esc(bind)}"${checked ? ' checked' : ''}${o.rerender !== false ? ' data-rerender' : ''}><span class="y-switch-track"></span><span>${esc(label)}</span></label>`;
    },
    btn(label, o) {
      o = o || {};
      const kind = o.kind || 'secondary';
      const data = Object.keys(o.data || {}).map(k => ` data-${k}="${esc(o.data[k])}"`).join('');
      return `<button type="${o.submit ? 'submit' : 'button'}" class="y-btn y-btn--${kind}${o.sm ? ' y-btn--sm' : ''}${o.cls ? ' ' + o.cls : ''}"${o.act ? ` data-act="${esc(o.act)}"` : ''}${data}${o.disabled ? ' disabled' : ''}${o.title ? ` title="${esc(o.title)}"` : ''}>${o.icon ? I(o.icon) : ''}<span>${esc(label)}</span></button>`;
    },
    iconBtn(icon, label, act, data, o) {
      o = o || {};
      const d = Object.keys(data || {}).map(k => ` data-${k}="${esc(data[k])}"`).join('');
      return `<button type="button" class="y-btn y-btn--ghost y-btn--icon pl-mini${o.cls ? ' ' + o.cls : ''}" data-act="${esc(act)}"${d} aria-label="${esc(label)}" title="${esc(label)}"${o.disabled ? ' disabled' : ''}>${I(icon)}</button>`;
    },
    /* segmented control that writes one value */
    seg(bind, value, options, label) {
      return `<div class="y-seg pl-seg" role="group" aria-label="${esc(label || '')}">${options.map(o => {
        const [v, l] = Array.isArray(o) ? o : [o, o];
        const on = String(v) === String(value);
        return `<button type="button" aria-pressed="${on}" class="${on ? 'is-active' : ''}" data-act="set" data-bind="${esc(bind)}" data-value="${esc(v)}">${esc(l)}</button>`;
      }).join('')}</div>`;
    },
    /* chips that filter */
    chips(bind, value, options, label) {
      return `<div class="pl-chips" role="group" aria-label="${esc(label || 'Filter')}">${options.map(o => {
        const [v, l, n] = Array.isArray(o) ? o : [o, o];
        const on = String(v) === String(value);
        return `<button type="button" class="y-chip pl-chip${on ? ' is-on' : ''}" aria-pressed="${on}" data-act="set" data-bind="${esc(bind)}" data-value="${esc(v)}">${esc(l)}${n != null ? ` <span class="pl-chip-n">${n}</span>` : ''}</button>`;
      }).join('')}</div>`;
    },
    stars(bind, value, label) {
      const v = Math.round(num(value));
      return `<div class="pl-stars" role="group" aria-label="${esc(label || 'Rating')}">${[1, 2, 3, 4, 5].map(n =>
        `<button type="button" class="pl-star${n <= v ? ' is-on' : ''}" data-act="set" data-bind="${esc(bind)}" data-value="${n === v ? 0 : n}" aria-label="${n} star${n > 1 ? 's' : ''}" aria-pressed="${n <= v}">${I('star')}</button>`).join('')}</div>`;
    },
    /* surfaces */
    head(o) {
      return `<header class="y-page-head pl-head">${o.eyebrow ? `<p class="y-eyebrow">${esc(o.eyebrow)}</p>` : ''}<h1 class="y-title${o.big ? '' : ' y-title--md'}">${o.title}</h1>${o.lede ? `<p class="y-lede">${o.lede}</p>` : ''}${o.meta ? `<div class="y-head-meta">${o.meta}</div>` : ''}</header>`;
    },
    panel(title, body, o) {
      o = o || {};
      const kick = title ? `<h2 class="y-kicker">${o.num != null ? `<span class="y-kicker-num">${esc(o.num)}</span>` : o.icon ? `<span class="pl-kicker-icon">${I(o.icon)}</span>` : ''}${esc(title)}</h2>` : '';
      const headRow = kick || o.actions ? `<div class="y-panel-head">${kick}${o.actions ? `<div class="pl-panel-actions">${o.actions}</div>` : ''}</div>` : '';
      return `<section class="y-panel${o.cls ? ' ' + o.cls : ''}"${o.id ? ` id="${o.id}"` : ''}${o.slot ? ` data-slot="${o.slot}"` : ''}>${headRow}${o.hint ? `<p class="pl-lead">${esc(o.hint)}</p>` : ''}${body}</section>`;
    },
    fold(title, body, o) {
      o = o || {};
      return `<details class="y-panel y-panel--flat pl-fold${o.cls ? ' ' + o.cls : ''}"${o.open ? ' open' : ''}${o.key ? ` data-fold="${esc(o.key)}"` : ''}><summary class="y-kicker">${o.icon ? I(o.icon) : ''}<span>${esc(title)}</span>${o.meta ? `<span class="pl-fold-meta">${o.meta}</span>` : ''}${I('down', { cls: 'pl-fold-caret' })}</summary><div class="pl-fold-body">${body}</div></details>`;
    },
    kpis(list) {
      return `<dl class="y-kpis pl-kpis">${list.filter(Boolean).map(([label, value, cls, sub]) =>
        `<div class="y-kpi${cls ? ' ' + cls : ''}"><dt>${esc(label)}</dt><dd>${value}</dd>${sub ? `<p class="pl-kpi-sub">${sub}</p>` : ''}</div>`).join('')}</dl>`;
    },
    meter(pct, label, o) {
      o = o || {};
      const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
      return `<span class="y-meter pl-meter${o.over ? ' is-over' : ''}${o.cls ? ' ' + o.cls : ''}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}" aria-label="${esc(label || 'Progress')}"><i style="width:${p}%"></i></span>`;
    },
    reward(o) {
      const done = o.total > 0 && o.done >= o.total;
      return `<div class="y-reward${done ? ' is-unlocked' : ''}"><span class="y-reward-icon">${I('gift')}</span>
        <span><span class="y-reward-label">${done ? esc(o.unlocked || 'Reward unlocked') : esc(o.label || 'Reward')}</span><span class="y-reward-text">${o.text ? esc(o.text) : `<span class="pl-muted">${esc(o.ph || 'Pick a small reward')}</span>`}</span></span>
        <span class="pl-reward-count y-num">${o.done} of ${o.total}</span>${ui.meter(o.total ? o.done / o.total * 100 : 0, 'Reward progress')}</div>`;
    },
    empty(icon, title, text, actions) {
      return `<div class="y-empty pl-empty"><span class="y-empty-art">${I(icon)}</span><h3>${esc(title)}</h3>${text ? `<p>${text}</p>` : ''}${actions ? `<div class="y-row pl-empty-actions">${actions}</div>` : ''}</div>`;
    },
    banner(kind, html, icon) { return `<div class="y-banner y-banner--${kind}">${I(icon || (kind === 'good' ? 'check' : kind === 'bad' || kind === 'warn' ? 'warn' : 'info'))}<span>${html}</span></div>`; },
    pill(text, tone) { return `<span class="pl-pill${tone ? ' pl-pill--' + tone : ''}">${esc(text)}</span>`; },
    /* add row button */
    add(label, list, o) {
      o = o || {};
      return ui.btn(label, { icon: 'plus', sm: true, kind: o.kind || 'secondary', act: 'add', cls: 'pl-add' + (o.cls ? ' ' + o.cls : ''), data: Object.assign({ list }, o.tpl ? { tpl: o.tpl } : {}, o.at ? { at: o.at } : {}, o.data || {}) });
    },
    /* one-line capture form */
    quickAdd(list, o) {
      o = o || {};
      const id = nid();
      return `<form class="pl-quick" data-quickadd data-list="${esc(list)}" data-key="${esc(o.key || 'text')}"${o.tpl ? ` data-tpl="${esc(o.tpl)}"` : ''}${o.at ? ` data-at="${esc(o.at)}"` : ''} autocomplete="off">
        <label class="y-sr" for="${id}">${esc(o.label || o.ph || 'Add')}</label>
        <input class="y-input" id="${id}" name="q" placeholder="${esc(o.ph || 'Add an item')}" autocomplete="off">
        <button class="y-btn y-btn--${o.kind || 'secondary'}" type="submit">${I('plus')}<span>${esc(o.button || 'Add')}</span></button></form>`;
    },
    /* row tools: move up / down / remove */
    rowTools(list, i, len, o) {
      o = o || {};
      const n = i + 1, what = o.what || 'item';
      return `<span class="pl-rowtools">${o.move ? ui.iconBtn('prev', `Move ${what} ${n} up`, 'up', { list, i }, { cls: 'pl-up', disabled: i === 0 }) +
        ui.iconBtn('next', `Move ${what} ${n} down`, 'down', { list, i }, { cls: 'pl-down', disabled: i === len - 1 }) : ''}${o.remove === false ? '' : ui.iconBtn(o.removeIcon || 'close', `Remove ${what} ${n}`, 'remove', { list, i, what: o.label || '' })}</span>`;
    },
    /* editable checklist: [box] [text] [tools] */
    checklist(list, items, o) {
      o = o || {};
      const tk = o.textKey || 'text', dk = o.doneKey || 'done';
      const rows = items.map((it, i) => {
        const idx = o.index ? o.index(it, i) : i;
        const base = `${list}.${idx}`;
        return `<li class="pl-ci${it[dk] ? ' is-done' : ''}"${o.rowAttr ? o.rowAttr(it, idx) : ''}>
          ${ui.tick(`${base}.${dk}`, it[dk], `Done: ${it[tk] || 'item ' + (i + 1)}`, { rerender: o.rerender })}
          <div class="pl-ci-main">${o.editable === false ? `<span class="pl-ci-text">${esc(it[tk])}</span>` : ui.textarea(`${base}.${tk}`, it[tk], { label: o.itemLabel ? o.itemLabel(i) : `Item ${i + 1}`, ph: o.ph || 'Type an item', cls: 'pl-ci-input', auto: true, rows: 1 })}
          ${o.meta ? `<div class="pl-ci-meta">${o.meta(it, idx)}</div>` : ''}</div>
          ${o.extra ? o.extra(it, idx) : ''}${o.tools === false ? '' : ui.rowTools(list, idx, o.total || items.length, { move: o.move, what: o.what || 'item', label: it[tk] })}</li>`;
      }).join('');
      return `<ul class="pl-checklist${o.cls ? ' ' + o.cls : ''}">${rows}</ul>${o.empty && !items.length ? `<p class="pl-muted pl-list-empty">${esc(o.empty)}</p>` : ''}${o.add ? `<div class="pl-list-foot">${ui.add(o.add, list, { tpl: o.tpl })}</div>` : ''}`;
    },
    /* editable grid table: cols = [{ k, label, type, options, w, ph, title, html }] */
    table(list, rows, cols, o) {
      o = o || {};
      const tools = o.move ? '132px' : '48px';
      const tpl = cols.map(c => c.w || '1fr').join(' ') + (o.tools === false ? '' : ' ' + tools);
      const cell = (c, r, i) => {
        const idx = o.index ? o.index(r, i) : i;
        const bind = `${list}.${idx}.${c.k}`, v = r[c.k], lab = c.label || c.k;
        const title = c.title ? ' y-cell-title' : '';
        if (c.html) return `<span role="cell" class="pl-cell${title}" data-label="${esc(lab)}">${c.html(r, idx)}</span>`;
        if (c.type === 'check') return `<span role="cell" class="pl-cell pl-cell--check" data-label="${esc(lab)}">${ui.tick(bind, v, `${lab} ${i + 1}`, { rerender: c.rerender })}</span>`;
        if (c.type === 'select') return `<span role="cell" class="pl-cell${title}" data-label="${esc(lab)}">${ui.select(bind, v, typeof c.options === 'function' ? c.options(r) : c.options, { label: `${lab} ${i + 1}`, blank: c.blank, rerender: c.rerender })}</span>`;
        if (c.type === 'stars') return `<span role="cell" class="pl-cell" data-label="${esc(lab)}">${ui.stars(bind, v, `${lab} ${i + 1}`)}</span>`;
        return `<span role="cell" class="pl-cell${title}" data-label="${esc(lab)}">${ui.input(bind, v, { type: c.type, label: `${lab} ${i + 1}`, ph: c.ph, num: c.num })}</span>`;
      };
      const body = rows.map((r, i) => {
        const idx = o.index ? o.index(r, i) : i;
        return `<div class="y-table-row pl-trow${o.rowClass ? ' ' + o.rowClass(r, idx) : ''}" role="row">${cols.map(c => cell(c, r, i)).join('')}${o.tools === false ? '' : `<span role="cell" class="pl-cell pl-cell--tools">${ui.rowTools(list, idx, o.total || rows.length, { move: o.move, what: o.what || 'row', label: r[cols[0].k] })}</span>`}</div>`;
      }).join('');
      return `<div class="y-table pl-table${o.cls ? ' ' + o.cls : ''}" role="table" style="--y-cols:${tpl}">
        ${rows.length ? `<div class="y-table-row y-table-head" role="row">${cols.map(c => `<span role="columnheader">${esc(c.label || '')}</span>`).join('')}${o.tools === false ? '' : '<span role="columnheader"><span class="y-sr">Actions</span></span>'}</div>` : ''}
        ${body}</div>${!rows.length && o.empty ? `<p class="pl-muted pl-list-empty">${esc(o.empty)}</p>` : ''}${o.add ? `<div class="pl-list-foot">${ui.add(o.add, list, { tpl: o.tpl })}</div>` : ''}`;
    },
    /* record cards: one card per item, title field + grid of fields */
    records(list, items, o) {
      o = o || {};
      const cards = items.map((it, i) => {
        const idx = o.index ? o.index(it, i) : i;
        const base = `${list}.${idx}`;
        const fields = (o.fields || []).filter(f => !f.when || f.when(it)).map(f => {
          if (f.html) return `<div class="y-field${f.wide ? ' pl-wide' : ''}">${f.label ? `<span class="y-label">${esc(f.label)}</span>` : ''}${f.html(it, idx)}</div>`;
          if (f.type === 'check') return `<div class="y-field pl-field-check${f.wide ? ' pl-wide' : ''}">${ui.check(`${base}.${f.k}`, it[f.k], esc(f.label), { rerender: f.rerender })}</div>`;
          if (f.type === 'stars') return `<div class="y-field${f.wide ? ' pl-wide' : ''}"><span class="y-label">${esc(f.label)}</span>${ui.stars(`${base}.${f.k}`, it[f.k], f.label)}</div>`;
          return ui.field(f.label, `${base}.${f.k}`, it[f.k], { type: f.type, options: typeof f.options === 'function' ? f.options(it) : f.options, ph: f.ph, num: f.num, rows: f.rows || 2, cls: f.wide ? 'pl-wide' : '', blank: f.blank, rerender: f.rerender, hint: f.hint });
        }).join('');
        return `<article class="pl-rec${o.cardClass ? ' ' + o.cardClass(it, idx) : ''}"${o.cardAttr ? o.cardAttr(it, idx) : ''}>
          <header class="pl-rec-head">${o.lead ? o.lead(it, idx) : ''}<div class="pl-rec-title">${ui.input(`${base}.${o.titleKey || 'name'}`, it[o.titleKey || 'name'], { label: `${o.what || 'Item'} ${i + 1} name`, ph: o.titlePh || 'Name', cls: 'pl-title-input' })}${o.sub ? `<div class="pl-rec-sub">${o.sub(it, idx)}</div>` : ''}</div>
          ${ui.rowTools(list, idx, items.length, { move: o.move, what: (o.what || 'item').toLowerCase(), label: it[o.titleKey || 'name'] })}</header>
          ${o.top ? o.top(it, idx) : ''}<div class="pl-rec-grid">${fields}</div>${o.foot ? o.foot(it, idx) : ''}</article>`;
      }).join('');
      return `<div class="pl-recs${o.cls ? ' ' + o.cls : ''}">${cards}</div>${!items.length && o.empty ? o.empty : ''}${o.add ? `<div class="pl-list-foot">${ui.add(o.add, list, { tpl: o.tpl, kind: o.addKind })}</div>` : ''}`;
    },
    notes(bind, value, o) {
      o = o || {};
      return ui.panel(o.title || 'Notes', ui.textarea(bind, value, { rows: o.rows || 8, ph: o.ph || 'Anything you want to remember…', label: o.title || 'Notes', cls: 'pl-notes' }), { icon: 'edit', cls: o.cls, hint: o.hint });
    },
    /* countdown timer card, driven by the engine */
    timer(o) {
      o = o || {};
      return `<div class="pl-timer${o.cls ? ' ' + o.cls : ''}" data-timer-ui>
        <div class="pl-timer-face"><span class="pl-timer-label" data-timer-label>${esc(o.idle || 'Timer')}</span><span class="pl-timer-clock y-num" data-timer-clock role="timer" aria-live="off">0:00</span>${ui.meter(0, 'Time used', { cls: 'pl-timer-meter' })}</div>
        <div class="pl-timer-btns">
          <button type="button" class="y-btn y-btn--world" data-act="timer-toggle" data-timer-toggle>${I('timer')}<span>Start</span></button>
          <button type="button" class="y-btn y-btn--secondary y-btn--sm" data-act="timer-add" data-secs="60">${I('plus')}<span>1 min</span></button>
          <button type="button" class="y-btn y-btn--ghost y-btn--sm" data-act="timer-reset">${I('prev')}<span>Reset</span></button>
        </div></div>`;
    }
  };

  /* ---------- engine ---------- */
  function create(app) {
    const root = document.getElementById('app') || document.querySelector('.y-app');
    root.classList.add('y-app', 'pl-app');
    root.dataset.world = app.world || root.dataset.world || 'focus';
    const store = Y.store(app.slug + ':v1');
    const pages = app.pages;
    let state, pendingFocus = null, undo = null, tick = null, liveT = null;

    const ctx = {
      app, ui, D, num, has, uid, get, set, clone, plural, clock,
      get state() { return state; },
      get page() { return current(); },
      save, render, refresh, go,
      print: () => doPrint(),
      toast: Y.toast, confirm: Y.confirm,
      money(n, o) {
        o = o || {};
        const v = num(n);
        const cents = o.cents != null ? o.cents : Math.round(v * 100) % 100 !== 0;
        return Y.fmt.money(v, { currency: (state && state.currency) || 'USD', cents });
      },
      focus(sel) { pendingFocus = sel; },
      remember(snapshotLabel) { undo = { data: clone(state), label: snapshotLabel }; },
      undoToast
    };

    function blankState(kind) {
      const s = kind === 'sample' ? app.sample() : app.blank();
      s.ui = Object.assign({}, s.ui || {});
      s.ui.sample = kind === 'sample';
      s.ui.welcome = false;
      if (app.currency && !s.currency) s.currency = (state && state.currency) || 'USD';
      return norm(s);
    }
    function norm(s) {
      if (!s || typeof s !== 'object' || Array.isArray(s)) s = app.blank();
      s.v = 1;
      s.ui = Object.assign({ page: pages[0].id }, s.ui && typeof s.ui === 'object' ? s.ui : {});
      if (app.currency && typeof s.currency !== 'string') s.currency = 'USD';
      if (app.normalize) s = app.normalize(s, ctx) || s;
      if (!pages.some(p => p.id === s.ui.page)) s.ui.page = pages[0].id;
      return s;
    }
    const loaded = store.load(null);
    state = loaded ? norm(loaded) : norm(app.blank());
    if (!loaded) state.ui.welcome = true;
    // index.html?demo opens straight into the example (listing previews, showcase links) — only when nothing is saved yet
    if (!loaded && /(?:^|[?&])demo(?:=|&|$)/.test(location.search)) state = blankState('sample');
    const hashPage = location.hash.slice(1);
    if (pages.some(p => p.id === hashPage)) state.ui.page = hashPage;

    function current() { return pages.find(p => p.id === state.ui.page) || pages[0]; }
    function save(now) { store.save(state, now); }

    /* shell */
    const multi = pages.length > 1;
    root.innerHTML = `
      <header class="y-appbar pl-appbar">
        <div class="y-brand"><span class="y-mark" aria-hidden="true">y</span><span class="y-wordmark">yaykit</span><span class="y-product-name">${esc(app.name)}</span></div>
        <div class="y-appbar-actions">
          <span class="y-save" id="plSave" aria-live="polite"></span>
          <button class="y-btn y-btn--secondary" type="button" id="plImport">${I('upload')}<span>Import</span></button>
          <button class="y-btn y-btn--secondary" type="button" id="plExport">${I('download')}<span>Export</span></button>
          <button class="y-btn y-btn--world" type="button" id="plPrint">${I('print')}<span>Print</span></button>
        </div>
      </header>
      <main class="y-main pl-main" id="plMain">
        ${multi ? `<nav class="y-tabs pl-nav" role="tablist" aria-label="${esc(app.name)} sections" id="plNav"></nav>` : ''}
        <div id="plBanner"></div>
        <div class="pl-page" id="plPage" role="${multi ? 'tabpanel' : 'region'}" aria-label="${esc(app.name)}"></div>
        <div class="y-paper-shell y-print-target pl-sheet" id="plSheet" aria-hidden="true"></div>
        <details class="y-help pl-help" id="plHelp">
          <summary>${I('info')}About, privacy &amp; data</summary>
          <div class="pl-help-body">
            ${app.about ? `<div class="pl-about">${app.about}</div>` : ''}
            <p><b>Your data stays on this device.</b> ${esc(app.name)} runs in your browser from the file you downloaded — nothing is uploaded and there is no account. It saves automatically as you type. Browser storage is not a backup: click <b>Export</b> now and then (and before clearing your browser or switching computers); <b>Import</b> brings a backup back.</p>
            ${app.disclaimer ? `<p>${esc(app.disclaimer)}</p>` : ''}
            <div class="pl-data">
              ${app.currency ? `<label class="y-field pl-currency"><span class="y-label">Currency</span><select class="y-select" id="plCurrency">${optList(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD'].map(c => [c, c]), state.currency)}</select></label>` : ''}
              <button class="y-btn y-btn--secondary y-btn--sm" type="button" data-act="sample">${I('sparkle')}<span>Load example</span></button>
              <button class="y-btn y-btn--danger y-btn--sm" type="button" data-act="blank">${I('trash')}<span>Start over</span></button>
            </div>
          </div>
        </details>
      </main>`;
    const nav = $('#plNav', root), pageEl = $('#plPage', root), banner = $('#plBanner', root), sheet = $('#plSheet', root);
    $$('[data-icon]', root).forEach(el => { el.outerHTML = I(el.dataset.icon); });
    Y.saveBadge($('#plSave', root), store);

    function renderNav() {
      if (!nav) return;
      nav.innerHTML = pages.map(p => {
        const on = p.id === current().id;
        const b = p.badge ? p.badge(ctx) : '';
        return `<button type="button" class="y-tab pl-tab" role="tab" id="tab-${p.id}" aria-controls="plPage" aria-selected="${on}" tabindex="${on ? 0 : -1}" data-page="${p.id}">${I(p.icon || 'list')}<span>${esc(p.label)}</span>${b !== '' && b != null ? `<span class="pl-tab-badge y-num" data-badge="${p.id}">${esc(b)}</span>` : ''}</button>`;
      }).join('');
      pageEl.setAttribute('aria-labelledby', 'tab-' + current().id);
    }
    function renderBanner() {
      const html = state.ui.sample
        ? `<div class="y-banner pl-sample">${I('sparkle')}<span><b>You’re looking at example data.</b> Explore, then start your own — the example is only here to show how it works.</span>
            <span class="pl-sample-actions">${ui.btn('Start my own', { kind: 'world', sm: true, act: 'blank', data: { from: 'sample' } })}${ui.btn('Keep example', { kind: 'ghost', sm: true, act: 'sample-keep' })}</span></div>`
        : '';
      if (banner.__h !== html) { banner.innerHTML = html; banner.__h = html; }
    }
    function welcome() {
      if (!state.ui.welcome || current() !== pages[0]) return '';
      return `<section class="y-panel y-panel--soft pl-welcome"><span class="pl-welcome-art">${I('sparkle')}</span>
        <div><h2 class="pl-welcome-title">${esc(app.welcome || 'Start typing — it saves as you go.')}</h2>
        <p>Everything stays on this device. Want to see it filled in first? Load the example, then start your own when you’re ready.</p></div>
        <div class="pl-welcome-actions">${ui.btn('Load example', { kind: 'world', icon: 'sparkle', act: 'sample' })}${ui.btn('Got it', { kind: 'ghost', act: 'welcome-hide' })}</div></section>`;
    }

    function focusKey(el) {
      if (!el || !pageEl.contains(el)) return null;
      if (el.dataset.bind) return `[data-bind="${el.dataset.bind}"]`;
      if (el.dataset.act) {
        const d = el.dataset;
        return `[data-act="${d.act}"]` + ['list', 'i', 'page', 'bind', 'value', 'id', 'k'].filter(k => d[k] != null).map(k => `[data-${k}="${CSS.escape(d[k])}"]`).join('');
      }
      if (el.id) return '#' + CSS.escape(el.id);
      return null;
    }
    function render() {
      const active = document.activeElement;
      const keep = focusKey(active);
      const caret = active && 'selectionStart' in active ? (() => { try { return [active.selectionStart, active.selectionEnd]; } catch (e) { return null; } })() : null;
      const openFolds = $$('details[data-fold]', pageEl).reduce((m, d) => (m[d.dataset.fold] = d.open, m), {});
      root.dataset.page = current().id;
      renderNav();
      renderBanner();
      pageEl.innerHTML = welcome() + current().render(ctx);
      $$('details[data-fold]', pageEl).forEach(d => { if (openFolds[d.dataset.fold] != null) d.open = openFolds[d.dataset.fold]; });
      fitAll();
      refresh();
      updateTimer();
      const target = pendingFocus ? $(pendingFocus, pageEl) : keep ? $(keep, pageEl) : null;
      pendingFocus = null;
      if (target) {
        target.focus({ preventScroll: true });
        if (caret && target === $(keep, pageEl) && 'setSelectionRange' in target && target.type === 'text') { try { target.setSelectionRange(caret[0], caret[1]); } catch (e) { /* ignore */ } }
      }
    }
    function fit(ta) { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }
    function fitAll() { $$('.y-textarea--auto', pageEl).forEach(fit); }
    window.addEventListener('resize', fitAll, { passive: true });
    function refresh() {
      const page = current();
      if (page.slots) $$('[data-slot]', pageEl).forEach(el => {
        const fn = page.slots[el.dataset.slot];
        if (!fn) return;
        const html = fn(ctx, el.dataset.arg);
        if (el.__h !== html) { el.innerHTML = html; el.__h = html; }
      });
      pages.forEach(p => {
        if (!p.badge || !nav) return;
        const b = p.badge(ctx), el = $(`[data-badge="${p.id}"]`, nav);
        if ((b === '' || b == null) !== !el) renderNav();
        else if (el && el.textContent !== String(b)) el.textContent = b;
      });
      if (app.refresh) app.refresh(ctx);
    }
    function go(id, o) {
      if (!pages.some(p => p.id === id)) return;
      state.ui.page = id;
      save();
      render();
      if (!(o && o.keepScroll)) window.scrollTo({ top: 0 });
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    }

    /* undo for removals */
    function undoToast(msg) {
      let host = document.querySelector('.y-toasts');
      if (!host) { host = document.createElement('div'); host.className = 'y-toasts'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.appendChild(host); }
      host.querySelectorAll('.pl-undo').forEach(t => t.remove());
      const t = document.createElement('div');
      t.className = 'y-toast pl-undo';
      t.innerHTML = `<span>${esc(msg)}</span><button type="button" class="pl-undo-btn">Undo</button>`;
      host.appendChild(t);
      const snap = undo;
      $('button', t).addEventListener('click', () => {
        if (snap) { state = snap.data; undo = null; save(true); render(); Y.toast('Restored'); }
        t.remove();
      });
      setTimeout(() => { t.classList.add('is-leaving'); setTimeout(() => t.remove(), 160); }, 6000);
    }

    /* timer: one countdown per app, survives reloads */
    function T() { return state.timer || (state.timer = { label: '', total: 0, left: 0, endsAt: 0, running: false }); }
    function timeLeft() { const t = T(); return t.running ? (t.endsAt - Date.now()) / 1000 : t.left; }
    function updateTimer() {
      const t = state.timer, left = t ? timeLeft() : 0;
      const over = left < 0;
      if (t && t.running && over && !(app.timer && app.timer.overtime)) {
        t.running = false; t.left = 0; save(true);
        chime();
        Y.toast(app.timer && app.timer.doneText || 'Time’s up — nice work');
      }
      $$('[data-timer-clock]', root).forEach(el => {
        const txt = clock(t ? (app.timer && app.timer.overtime ? left : Math.max(0, left)) : 0);
        if (el.textContent !== txt) el.textContent = txt;
        el.classList.toggle('is-over', over && !!(app.timer && app.timer.overtime));
      });
      $$('[data-timer-label]', root).forEach(el => { const l = t && t.label ? t.label : el.dataset.idle || el.textContent; if (t && t.label && el.textContent !== l) el.textContent = l; });
      $$('[data-timer-ui] .pl-timer-meter > i', root).forEach(i => { i.style.width = (t && t.total ? Math.max(0, Math.min(100, (1 - Math.max(0, left) / t.total) * 100)) : 0) + '%'; });
      $$('[data-timer-toggle]', root).forEach(b => {
        const lab = t && t.running ? 'Pause' : t && t.total && t.left !== t.total && t.left > 0 ? 'Resume' : 'Start';
        const s = $('span', b); if (s && s.textContent !== lab) s.textContent = lab;
        b.setAttribute('aria-pressed', String(!!(t && t.running)));
      });
      $$('[data-timer-ui]', root).forEach(el => el.classList.toggle('is-running', !!(t && t.running)));
      if (app.timer && app.timer.onTick) app.timer.onTick(ctx, left);
      const need = t && t.running;
      if (need && !tick) tick = setInterval(updateTimer, 250);
      if (!need && tick) { clearInterval(tick); tick = null; }
    }
    function chime() {
      try {
        const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
        const a = new A(), o = a.createOscillator(), g = a.createGain();
        o.type = 'sine'; o.frequency.value = 880; g.gain.setValueAtTime(0.0001, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, a.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.9);
        o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 1);
      } catch (e) { /* sound is optional */ }
      if (navigator.vibrate) { try { navigator.vibrate(200); } catch (e) { /* ignore */ } }
    }
    const timerApi = {
      start(secs, label, ref) { const t = T(); t.total = Math.max(1, Math.round(secs)); t.left = t.total; t.label = label || ''; t.ref = ref || ''; t.endsAt = Date.now() + t.total * 1000; t.running = true; save(true); updateTimer(); },
      toggle() { const t = T(); if (t.running) { t.left = timeLeft(); t.running = false; } else { if (!t.total) { timerApi.start((app.timer && app.timer.defaultSecs) || 600, (app.timer && app.timer.defaultLabel) || 'Focus block'); return true; } if (t.left <= 0 && !(app.timer && app.timer.overtime)) t.left = t.total; t.endsAt = Date.now() + t.left * 1000; t.running = true; } save(true); updateTimer(); return true; },
      reset() { const t = T(); t.running = false; t.left = t.total; save(true); updateTimer(); },
      add(secs) { const t = T(); if (!t.total) { timerApi.start(secs, t.label); return; } if (t.running) t.endsAt += secs * 1000; else t.left = Math.max(0, t.left) + secs; t.total += secs; save(true); updateTimer(); },
      clear() { state.timer = { label: '', total: 0, left: 0, endsAt: 0, running: false }; save(true); updateTimer(); },
      get state() { return T(); },
      left: timeLeft
    };
    ctx.timer = timerApi;

    /* built-in actions */
    const coerce = v => v === 'true' ? true : v === 'false' ? false : v;
    const BUILTIN = {
      go(c, d) { go(d.page); return false; },
      set(c, d) { set(state, d.bind, coerce(d.value)); },
      toggle(c, d) { set(state, d.bind, !get(state, d.bind)); },
      add(c, d) {
        let list = get(state, d.list);
        if (!Array.isArray(list)) { list = []; set(state, d.list, list); }
        const key = d.tpl || d.list.split('.').filter(k => !/^\d+$/.test(k)).pop();
        const item = app.rows && app.rows[key] ? app.rows[key](ctx, d) : {};
        let at;
        if (d.at === 'top') { list.unshift(item); at = 0; } else { list.push(item); at = list.length - 1; }
        pendingFocus = `[data-bind^="${d.list}.${at}."]:not([type=checkbox])`;
      },
      remove(c, d) {
        const list = get(state, d.list);
        if (!Array.isArray(list)) return false;
        const i = +d.i, item = list[i];
        const label = d.what || (item && (item.name || item.text || item.title)) || '';
        ctx.remember();
        list.splice(i, 1);
        undoToast(label ? `Removed “${String(label).slice(0, 40)}”` : 'Removed');
        const next = list.length ? Math.min(i, list.length - 1) : null;
        pendingFocus = next != null ? `[data-act="remove"][data-list="${d.list}"][data-i="${next}"]` : `[data-act="add"][data-list="${d.list}"]`;
      },
      up(c, d) { const l = get(state, d.list), i = +d.i; if (i > 0) { [l[i - 1], l[i]] = [l[i], l[i - 1]]; pendingFocus = `[data-act="up"][data-list="${d.list}"][data-i="${i - 1}"]`; } },
      down(c, d) { const l = get(state, d.list), i = +d.i; if (i < l.length - 1) { [l[i + 1], l[i]] = [l[i], l[i + 1]]; pendingFocus = `[data-act="down"][data-list="${d.list}"][data-i="${i + 1}"]`; } },
      async sample() {
        if (!state.ui.welcome && !state.ui.sample && !(await Y.confirm({ title: 'Replace everything with the example?', body: 'Your current entries will be replaced. Export a backup first if you want to keep them.', ok: 'Load example', danger: true }))) return false;
        state = blankState('sample'); state.ui.page = pages[0].id; save(true); render(); window.scrollTo({ top: 0 }); Y.toast('Example loaded'); return false;
      },
      async blank(c, d) {
        const fromSample = d.from === 'sample' || state.ui.sample;
        const ok = await Y.confirm(fromSample
          ? { title: 'Clear the example and start your own?', ok: 'Start my own' }
          : { title: 'Start over?', body: 'This clears everything in this planner on this device. Export a backup first if you might need it.', ok: 'Clear everything', danger: true });
        if (!ok) return false;
        state = blankState('blank'); state.ui.page = pages[0].id; save(true); render(); window.scrollTo({ top: 0 });
        Y.toast(fromSample ? 'Ready — it’s all yours' : 'Cleared'); return false;
      },
      'welcome-hide'() { state.ui.welcome = false; },
      'sample-keep'() { state.ui.sample = false; },
      print() { doPrint(); return false; },
      'timer-start'(c, d) { timerApi.start(d.secs ? +d.secs : num(d.mins) * 60, d.label, d.ref); return false; },
      'timer-toggle'() { timerApi.toggle(); return false; },
      'timer-reset'() { timerApi.reset(); return false; },
      'timer-add'(c, d) { timerApi.add(+d.secs || 60); return false; },
      'timer-clear'() { timerApi.clear(); return false; }
    };

    async function run(act, el, e) {
      const page = current();
      const fn = (page.actions && page.actions[act]) || (app.actions && app.actions[act]) || BUILTIN[act];
      if (!fn) return false;
      if (e) e.preventDefault();
      const r = await fn(ctx, Object.assign({}, el.dataset, 'value' in el && el.tagName !== 'BUTTON' ? { value: el.value } : {}), el, e);
      if (r !== false) { state.ui.welcome = state.ui.welcome && act !== 'add'; save(); render(); }
      return true;
    }
    root.addEventListener('click', e => {
      const tab = e.target.closest('[data-page]');
      if (tab && nav && nav.contains(tab)) { go(tab.dataset.page); return; }
      const b = e.target.closest('[data-act]');
      if (!b || !root.contains(b) || b.disabled || b.type === 'submit') return;
      run(b.dataset.act, b, e);
    });
    root.addEventListener('submit', async e => {
      if (!pageEl.contains(e.target)) return; // e.g. <form method="dialog"> inside Yay.confirm
      const sf = e.target.closest('form[data-submit]');
      if (sf) { e.preventDefault(); run(sf.dataset.submit, sf, null); return; }
      const f = e.target.closest('form[data-quickadd]');
      if (!f) { e.preventDefault(); return; }
      e.preventDefault();
      const input = f.querySelector('input[name=q]'), v = input.value.trim();
      if (!v) { input.focus(); return; }
      const d = f.dataset;
      let list = get(state, d.list);
      if (!Array.isArray(list)) { list = []; set(state, d.list, list); }
      const key = d.tpl || d.list.split('.').filter(k => !/^\d+$/.test(k)).pop();
      const item = Object.assign(app.rows && app.rows[key] ? app.rows[key](ctx, d) : {}, { [d.key]: v });
      if (d.at === 'top') list.unshift(item); else list.push(item);
      const page = current();
      if (page.onQuickAdd) page.onQuickAdd(ctx, d, item);
      save();
      pendingFocus = `form[data-quickadd][data-list="${d.list}"] input[name=q]`;
      render();
    });
    root.addEventListener('input', e => {
      const el = e.target.closest('[data-bind]');
      if (!el || !pageEl.contains(el) || el.type === 'checkbox' || el.type === 'radio') return;
      set(state, el.dataset.bind, el.value);
      if (el.classList.contains('y-textarea--auto')) fit(el);
      if (app.onEdit) app.onEdit(ctx, el.dataset.bind, el.value);
      save();
      if (el.hasAttribute('data-live')) { clearTimeout(liveT); liveT = setTimeout(render, 160); }
      else if (!el.hasAttribute('data-rerender')) refresh();
    });
    root.addEventListener('change', e => {
      const oc = e.target.closest('[data-onchange]');
      if (oc && pageEl.contains(oc)) { run(oc.dataset.onchange, oc, null); return; }
      const el = e.target.closest('[data-bind]');
      if (!el || !pageEl.contains(el)) return;
      if (el.type === 'checkbox' || el.type === 'radio') {
        set(state, el.dataset.bind, el.type === 'checkbox' ? el.checked : el.value);
        if (app.onEdit) app.onEdit(ctx, el.dataset.bind, el.checked);
        save();
        const row = el.closest('.pl-ci'); if (row) row.classList.toggle('is-done', el.checked);
        if (el.hasAttribute('data-rerender')) render(); else refresh();
      } else if (el.hasAttribute('data-rerender')) render();
    });
    // one-line textareas (checklist items): Enter finishes the item instead of adding a line break
    root.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && e.target.matches && e.target.matches('textarea.pl-ci-input')) { e.preventDefault(); e.target.blur(); }
    });
    if (nav) Y.tablist(nav, t => go(t.dataset.page));

    /* app bar */
    $('#plExport', root).addEventListener('click', () => { store.flush(); Y.exportJSON(state, app.slug); state.ui.exportedAt = D.today(); save(); Y.toast('Backup downloaded'); });
    $('#plImport', root).addEventListener('click', async () => {
      try {
        const data = await Y.pickJSON();
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('That file is not a backup of this planner');
        if (app.accepts && !app.accepts(data)) throw new Error('That backup is from a different Yaykit app');
        state = norm(clone(data)); state.ui.welcome = false; state.ui.sample = false;
        save(true); render(); Y.toast('Backup imported');
      } catch (err) { if (err && err.message !== 'No file chosen') Y.toast(err.message || 'Could not read that file'); }
    });
    $('#plPrint', root).addEventListener('click', doPrint);
    const cur = $('#plCurrency', root);
    if (cur) cur.addEventListener('change', () => { state.currency = cur.value; save(); render(); });

    function doPrint() {
      store.flush();
      const page = current();
      if (page.sheet) {
        sheet.innerHTML = `<div class="y-paper pl-paper">${page.sheet(ctx)}</div>`;
        Y.print({ paper: true });
      } else {
        $$('details.pl-fold', pageEl).forEach(d => { if (!d.open) { d.open = true; d.dataset.printOpened = '1'; } });
        Y.print();
        setTimeout(() => $$('details[data-print-opened]', pageEl).forEach(d => { d.open = false; delete d.dataset.printOpened; }), 1200);
      }
    }

    if (app.open) app.open(ctx);
    render();
    window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (id && id !== state.ui.page) go(id); });
    window.__planner = ctx; // for tests and debugging
    return ctx;
  }

  window.Planner = { version: '1.0.0', create, ui, D, num, has, uid, get, set, clone, clock, plural };
})();
