// Teleport client, loaded by every city page from https://ruanhoo.github.io/teleport/teleport.js
// It adds the toolbar button, draws the in-world portal, opens the picker (hosted on the teleport site) as a popup,
// plays the swirl transition and shows the arrival toast. The list of cities lives only in ./cities.json.
//
// A city page needs: this script tag, TELE.init({ here: '<its id in cities.json>', getLang: () => lang }),
// TELE.draw(...) for the portal object and TELE.hit(...) / TELE.open() for clicks.
(() => {
  'use strict';
  const HUB = (() => {
    try { const h = new URLSearchParams(location.search).get('hub'); if (h && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(h)) return h; } catch (e) { /* ignore */ }
    return 'https://ruanhoo.github.io/teleport/';
  })();
  const HUB_ORIGIN = new URL(HUB).origin;
  const T = {
    en: { btn: 'Teleport', welcome: 'Welcome to {to}! Teleported in from {from}.', portal: 'Teleport' },
    zh: { btn: '传送', welcome: '欢迎来到{to}！你刚从{from}传送过来。', portal: '传送门' },
  };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { here: '', getLang: () => 'en', fx: null, btn: null, frame: null, ready: false, pending: false, list: null };
  const lang = () => (state.getLang() === 'zh' ? 'zh' : 'en');
  const t = (k) => T[lang()][k];
  const CITIES = [];
  const trusted = (u) => { try { const x = new URL(u); return x.origin === HUB_ORIGIN || x.origin === 'https://ruanhoo.github.io'; } catch (e) { return false; } };

  const CSS = `
#teleFx{position:fixed;inset:0;z-index:99;pointer-events:none;background:conic-gradient(from 0deg,#7b5cff,#2fd3ff,#ff9ebb,#ffc93c,#7b5cff);clip-path:circle(0% at 50% 50%);opacity:0}
#teleFx.in{pointer-events:auto;opacity:1;animation:teleIn .75s cubic-bezier(.5,0,.8,.4) forwards}
#teleFx.out{opacity:1;clip-path:circle(150% at 50% 50%);animation:teleOut .9s ease-in forwards}
#teleFx::after{content:"";position:absolute;inset:0;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(255,255,255,0) 55%);animation:teleSpin 1.2s linear infinite}
@keyframes teleIn{from{clip-path:circle(0% at 50% 50%);filter:hue-rotate(0)}to{clip-path:circle(150% at 50% 50%);filter:hue-rotate(160deg)}}
@keyframes teleOut{from{clip-path:circle(150% at 50% 50%);filter:hue-rotate(160deg)}to{clip-path:circle(0% at 50% 50%);filter:hue-rotate(0)}}
@keyframes teleSpin{to{transform:rotate(1turn)}}
#teleFrame{position:fixed;inset:0;width:100%;height:100%;border:0;z-index:90;display:none;background:transparent;color-scheme:normal}
#teleFrame.show{display:block}
#teleToast{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:95;background:#fff6c9;border:3px solid #2d2a32;border-radius:999px;box-shadow:3px 3px 0 #2d2a32;padding:8px 16px;font:600 14px var(--font,system-ui);color:#2d2a32;max-width:92vw;text-align:center;transition:opacity .5s}
@media (prefers-reduced-motion:reduce){#teleFx.in,#teleFx.out,#teleFx::after{animation:none}}`;

  function ensureDom() {
    if (state.fx) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    state.fx = document.createElement('div'); state.fx.id = 'teleFx'; state.fx.setAttribute('aria-hidden', 'true'); document.body.appendChild(state.fx);
    window.addEventListener('message', onMessage);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }
  function ensureFrame() {
    if (state.frame) return;
    const f = document.createElement('iframe'); f.id = 'teleFrame'; f.title = 'Teleport'; f.setAttribute('allowtransparency', 'true');
    f.src = `${HUB}?here=${encodeURIComponent(state.here)}&lang=${lang()}`;
    document.body.appendChild(f); state.frame = f;
  }
  const post = (m) => { if (state.frame && state.frame.contentWindow) state.frame.contentWindow.postMessage(m, HUB_ORIGIN); };
  function onMessage(e) {
    if (!state.frame || e.source !== state.frame.contentWindow || e.origin !== HUB_ORIGIN) return;
    const m = e.data || {};
    if (m.type === 'teleport:ready') { state.ready = true; if (state.pending) { state.pending = false; post({ type: 'teleport:open', here: state.here, lang: lang() }); } }
    else if (m.type === 'teleport:close') close();
    else if (m.type === 'teleport:go' && trusted(m.url)) { state.frame.classList.remove('show'); go(m.url); }
  }
  function open() {
    ensureDom(); ensureFrame(); state.frame.classList.add('show');
    if (state.ready) post({ type: 'teleport:open', here: state.here, lang: lang() }); else state.pending = true;
  }
  function close() {
    if (state.frame) state.frame.classList.remove('show');
    state.pending = false;
    if (state.btn && document.activeElement !== state.btn) { try { state.btn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }
  function go(url) {
    ensureDom();
    const target = `${url}${url.includes('?') ? '&' : '?'}from=${encodeURIComponent(state.here)}&lang=${lang()}`;
    if (reduce) { location.href = target; return; }
    state.fx.className = 'in';
    setTimeout(() => { location.href = target; }, 780);
  }
  function label() { if (state.btn) { const s = state.btn.querySelector('span:last-child'); if (s) s.textContent = t('btn'); } }
  function addButton() {
    const bar = document.getElementById('tools'); if (!bar || document.getElementById('bTele')) return;
    const b = document.createElement('button'); b.className = 'tb'; b.id = 'bTele'; b.type = 'button';
    b.innerHTML = '<span class="i">🌀</span><span></span>'; b.addEventListener('click', open); bar.appendChild(b); state.btn = b; label();
  }
  function loadCities() {
    if (state.list) return state.list;
    state.list = fetch(`${HUB}cities.json`, { cache: 'no-cache' }).then((r) => r.json()).then((j) => { CITIES.splice(0, CITIES.length, ...(j.cities || [])); return CITIES; }).catch(() => CITIES);
    return state.list;
  }
  function arrival() {
    const q = new URLSearchParams(location.search); const fromId = q.get('from');
    if (!fromId || fromId === state.here) return;
    ensureDom();
    if (!reduce) { state.fx.className = 'out'; setTimeout(() => { state.fx.className = ''; }, 950); }
    try { q.delete('from'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); } catch (e) { /* ignore */ }
    loadCities().then((list) => {
      const nm = (id) => { const c = list.find((x) => x.id === id); return c ? (lang() === 'zh' ? c.zh : c.en) : ''; };
      const from = nm(fromId); if (!from) return;
      const toast = document.createElement('div'); toast.id = 'teleToast'; toast.setAttribute('role', 'status');
      toast.textContent = t('welcome').replace('{to}', nm(state.here)).replace('{from}', from);
      document.body.appendChild(toast); setTimeout(() => { toast.style.opacity = '0'; }, 4200); setTimeout(() => toast.remove(), 4800);
    });
  }
  function init(opts) { state.here = opts.here; state.getLang = opts.getLang || state.getLang; ensureDom(); addButton(); arrival(); }
  function refresh() { label(); if (state.ready && state.frame && state.frame.classList.contains('show')) post({ type: 'teleport:lang', lang: lang() }); }

  // the in-world portal: a stone ring with a swirling middle. (X, Y) is its base on screen, k the zoom.
  function draw(g, X, Y, k, time, night) {
    const R = 30; const cy = -R - 8;
    g.save(); g.translate(X, Y); g.scale(k, k); g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = '#2d2a32'; g.lineWidth = Math.max(1.3 / k, 2.6);
    g.fillStyle = 'rgba(45,42,50,.22)'; g.beginPath(); g.ellipse(0, 3, R * 0.95, 8, 0, 0, 6.2832); g.fill();
    // plinth
    g.fillStyle = '#b8b2a6'; g.beginPath(); g.moveTo(-24, 2); g.lineTo(-20, -6); g.lineTo(20, -6); g.lineTo(24, 2); g.closePath(); g.fill(); g.stroke();
    // swirl disc
    g.save(); g.beginPath(); g.ellipse(0, cy, R - 4, R + 2, 0, 0, 6.2832); g.clip();
    const grd = g.createRadialGradient(0, cy, 2, 0, cy, R + 4); grd.addColorStop(0, '#ffffff'); grd.addColorStop(0.35, '#9be3ff'); grd.addColorStop(0.75, '#8f7be0'); grd.addColorStop(1, '#5a3fc0');
    g.fillStyle = grd; g.fillRect(-R - 4, cy - R - 6, R * 2 + 8, R * 2 + 12);
    g.lineWidth = Math.max(1 / k, 2.2); g.strokeStyle = 'rgba(255,255,255,.9)';
    for (let a = 0; a < 3; a++) {
      g.beginPath();
      for (let i = 0; i <= 26; i++) { const f = i / 26; const ang = time * 2.2 + a * 2.0944 + f * 5.2; const r = f * (R - 2); const x = Math.cos(ang) * r; const y = cy + Math.sin(ang) * r * 1.08; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke();
    }
    g.restore();
    // stone ring
    g.strokeStyle = '#2d2a32'; g.lineWidth = Math.max(1.3 / k, 2.6) * 2.4; g.beginPath(); g.ellipse(0, cy, R, R + 6, 0, 0, 6.2832); g.stroke();
    g.strokeStyle = '#d8d2c6'; g.lineWidth = Math.max(1.3 / k, 2.6) * 1.1; g.beginPath(); g.ellipse(0, cy, R, R + 6, 0, 0, 6.2832); g.stroke();
    // sparkles
    g.fillStyle = night > 0.3 ? '#fff6a8' : '#ffffff'; g.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) { const a = time * 1.3 + i * 1.57; const r = R + 10 + Math.sin(time * 3 + i) * 4; const x = Math.cos(a) * r; const y = cy + Math.sin(a) * (r + 4) * 0.9; g.beginPath(); g.arc(x, y, 2.2, 0, 6.2832); g.fill(); g.stroke(); }
    g.restore();
  }
  // screen-space hit test for a click at (px, py) given the portal base at (X, Y)
  const hit = (px, py, X, Y, k) => Math.hypot(px - X, (py - (Y - 38 * k)) * 0.85) < 44 * k + 8;
  window.TELE = { init, open, close, go, refresh, draw, hit, CITIES, portalLabel: () => t('portal') };
})();
