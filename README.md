# Teleport 🌀

One portal for all the cartoon city maps. Every city page loads `teleport.js` from this site, which adds a 🌀 Teleport button and an in-world portal. Opening it shows this site's picker as a popup, with **three random** other cities each time.

Live: https://ruanhoo.github.io/teleport/

## Add a city
1. Add an entry to `cities.json` (this is the only list of cities; every site picks it up on its next load):

        { "id": "tokyo", "emoji": "🗼", "color": "#e8503a", "url": "https://ruanhoo.github.io/tokyo/",
          "en": "Tokyo", "zh": "东京", "tagEn": "Neon · ramen · temples", "tagZh": "霓虹 · 拉面 · 神社" }

   Set `"hidden": true` to keep a city out of the picker.
2. In the new city's page, load the client and start it:

        <script src="https://ruanhoo.github.io/teleport/teleport.js"></script>
        ...
        window.TELE && TELE.init({ here: 'tokyo', getLang: () => lang });   // 'en' | 'zh'

   Optional in-world portal: draw it with `TELE.draw(ctx, screenX, screenY, zoom, time, night)`, hit-test clicks with `TELE.hit(px, py, screenX, screenY, zoom)` and call `TELE.open()`; call `TELE.refresh()` after a language change. The toolbar button is added to an element with `id="tools"`.

No other site needs to change when the list changes.

## How it works
- `index.html` + `hub.js`: the picker. Embedded, it is a transparent full-page popup; opened directly, it works as a standalone page.
- `teleport.js`: the client. It talks to the popup with `postMessage` (origin-checked both ways), plays the swirl, then navigates to the city URL with `?from=<id>&lang=<lang>`; the destination shows a welcome toast.
- Browsers and GitHub Pages may cache `cities.json` for about ten minutes, so a new city can take that long to appear.
- Local testing: on a `localhost` page add `?hub=http://localhost:PORT/` to use a locally served copy of this site.
