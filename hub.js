// The teleport picker. It lives here so the list of cities is maintained in exactly one place (cities.json).
// City pages embed this page in a transparent popup (see teleport.js) and talk to it with postMessage.
(() => {
  'use strict';
  const T = {
    en: { title: '🌀 Teleport', sub: 'Pick a destination. Hold on to your hat!', go: 'Teleport ➜', close: 'Close', hint: 'Three random destinations. Open the portal again for a different set ✨', none: 'No other worlds yet. Check back soon!' },
    zh: { title: '🌀 传送门', sub: '选一个目的地，抓紧帽子！', go: '传送 ➜', close: '关闭', hint: '随机三个目的地，再开一次传送门会有不同的惊喜 ✨', none: '暂时没有其他城市，敬请期待！' },
  };
  const QS = new URLSearchParams(location.search);
  const embedded = window.parent !== window;
  const OK_PARENT = /^(https:\/\/ruanhoo\.github\.io|http:\/\/localhost(:\d+)?|http:\/\/127\.0\.0\.1(:\d+)?)$/;
  const root = document.getElementById('tele');
  let cities = []; let here = QS.get('here') || QS.get('from') || ''; let lang = QS.get('lang') === 'zh' ? 'zh' : 'en';
  let shown = []; let total = 0; let loaded = false; let wantOpen = !embedded;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const t = (k) => T[lang][k];
  const name = (c) => (lang === 'zh' ? c.zh : c.en);
  if (!embedded) document.body.classList.add('solo');

  function reshuffle() {
    const others = cities.filter((c) => c.id !== here);
    total = others.length;
    for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
    shown = others.slice(0, 3);
  }
  function render() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    root.setAttribute('aria-label', t('title'));
    root.innerHTML = `<div class="box"><button class="x" type="button" aria-label="${esc(t('close'))}">×</button><h2>${esc(t('title'))}</h2><p class="s">${esc(t('sub'))}</p>` +
      (shown.length ? shown.map((c) => `<button class="c" type="button" data-id="${esc(c.id)}"><span class="e" style="background:${esc(c.color)}33">${esc(c.emoji)}</span><span><div class="n">${esc(name(c))}</div><div class="g">${esc(lang === 'zh' ? c.tagZh : c.tagEn)}</div></span><span class="b">${esc(t('go'))}</span></button>`).join('') : `<p class="s">${esc(t('none'))}</p>`) +
      (total > shown.length ? `<p class="hint">${esc(t('hint'))}</p>` : '') + '</div>';
  }
  function show() {
    if (!loaded) { wantOpen = true; return; }
    reshuffle(); render(); root.classList.add('show');
    const f = root.querySelector('.c'); if (f) f.focus();
  }
  function close() {
    if (embedded) { root.classList.remove('show'); window.parent.postMessage({ type: 'teleport:close' }, '*'); }
  }
  function go(id) {
    const c = cities.find((x) => x.id === id); if (!c) return;
    if (embedded) { root.classList.remove('show'); window.parent.postMessage({ type: 'teleport:go', id: c.id, url: c.url }, '*'); } else location.href = `${c.url}?from=teleport&lang=${lang}`;
  }
  root.addEventListener('click', (e) => {
    if (e.target.closest('.x') || (e.target === root && embedded)) { close(); return; }
    const c = e.target.closest('.c'); if (c) go(c.dataset.id);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  window.addEventListener('message', (e) => {
    if (!embedded || e.source !== window.parent || !OK_PARENT.test(e.origin)) return;
    const m = e.data || {};
    if (m.type === 'teleport:open') { here = String(m.here || ''); lang = m.lang === 'zh' ? 'zh' : 'en'; show(); }
    else if (m.type === 'teleport:lang') { lang = m.lang === 'zh' ? 'zh' : 'en'; if (root.classList.contains('show')) render(); }
  });
  fetch('cities.json', { cache: 'no-cache' }).then((r) => r.json()).then((j) => {
    cities = (j.cities || []).filter((c) => !c.hidden); loaded = true;
    if (embedded) window.parent.postMessage({ type: 'teleport:ready' }, '*');
    if (wantOpen) show();
  }).catch(() => { if (embedded) window.parent.postMessage({ type: 'teleport:close' }, '*'); });
})();
