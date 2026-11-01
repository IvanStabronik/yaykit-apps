(function () {
  'use strict';
  const mem = new Map();   // the buyers' data on this origin stays untouched
  Storage.prototype.getItem = k => (mem.has(String(k)) ? mem.get(String(k)) : null);
  Storage.prototype.setItem = (k, v) => { mem.set(String(k), String(v)); };
  Storage.prototype.removeItem = k => { mem.delete(String(k)); };
  Storage.prototype.clear = () => mem.clear();
  if (!/(?:^|[?&])demo(?:=|&|$)/.test(location.search)) history.replaceState(null, '', location.pathname + '?demo' + location.hash);
  addEventListener('DOMContentLoaded', () => {
    const bar = document.createElement('aside');
    bar.className = 'demo-bar';
    bar.innerHTML = '<span><b>Free demo</b> with example data. Nothing is saved.</span><a class="y-btn y-btn--world" target="_blank" rel="noopener" href="https://yaykit.etsy.com/listing/4603867730">Get the full app on Etsy</a>';
    document.body.prepend(bar);
  });
})();
