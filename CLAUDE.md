# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this is

**Mine a Planet** — a browser idle/clicker game in Russian. You place mining
drones around a planet, they chip ore out of it, you sell the ore, buy upgrades,
spin a gacha roulette for better drones, fuse duplicates, and unlock the next
planet. It targets **Yandex Games** (portal SDK, ads, cloud saves) but runs
fully standalone in any browser, where it falls back to `localStorage`.

There is **no build step, no framework, no dependencies**. It is hand-written
HTML/CSS/vanilla JS drawn onto a single `<canvas>` plus a DOM HUD on top.
Open `index.html` and it runs.

## Layout

```
index.html              Document skeleton + the ordered <script> tags. Markup only.
src/css/styles.css      All styling. Space-glass theme driven by :root CSS vars.
src/js/
  sdk.js                Yandex Games SDK bridge (Platform). Ads, cloud save,
                        graceful local-mode fallback when YaGames is absent.
  config.js             Static data & balance: 12 ores, 10 planets, 27 drones,
                        8 rarities, 9 upgrade tracks, 4 cosmic events,
                        24 achievements, gem shop, fusion + star rules.
  state.js              Save shape, migrations, and the `Game` class — every
                        gameplay rule (tick, sell, roll, fuse, upgrade, daily,
                        offline earnings) lives here. No DOM, no canvas.
  background.js         Parallax starfield / nebula behind the planet.
  assets.js             Tiny image cache for optional PNG art overrides.
  render.js             `WorldRenderer`: the planet sphere, its surface strip,
                        the dock ring and where each drone sits on screen.
  particles.js          Particles and floating damage/reward text.
  sprites.js            Procedural canvas art: drone chassis, ore gems, planet
                        icons, star badges. No image files required.
  audio.js              `AudioEngine`. WebAudio-synthesised SFX, no audio files.
  ui.js                 All DOM wiring: HUD, hotbar, modals, inventory, toasts.
  main.js               Entry point: canvas sizing, input, the rAF loop, boot.
tools/smoke.mjs         Headless boot check (Playwright).
.github/workflows/      deploy.yml -> GitHub Pages, ci.yml -> smoke test on PRs.
```

`assets/` is optional. Drop PNGs in and point `DRONE_ART`, `PLANET_ART` or
`ORE_ART` in `config.js` at them; anything not listed keeps drawing itself, and
a listed file that 404s falls back to the procedural art rather than breaking.
Drone and ore sprites need a real alpha channel — they composite over the
planet. `PLANET_ART` takes a **seamless ~2.2:1 surface map, not a planet face**:
the renderer scrolls it so the planet keeps rotating. See `assets/README.md` and
`docs/asset-prompts.md`.

## The one structural rule: script order

These files were unbundled from a single generated `index.html`. They are
**classic scripts, not ES modules** — they share one global script scope and
they are loaded in a fixed order:

```
sdk → config → state → background → assets → render → particles → sprites → audio → ui → main
```

Data before state, state before renderers, renderers before UI, UI before the
entry point. `main.js` reads `document.getElementById("game")` at top level,
which is why every tag carries `defer`.

Consequences to keep in mind:

- A new top-level `var`/`function`/`class` in any file is visible everywhere.
  **Names must stay globally unique** across `src/js/`.
- Adding a file means adding a `<script defer>` to `index.html` in the right
  slot. Nothing discovers files automatically.
- Do not add `import`/`export` to one file in isolation — that switches it to
  module scope and its globals silently vanish for everyone else. Converting is
  an all-or-nothing change across all eleven files.

## Running it

```bash
python3 -m http.server 8123   # then open http://localhost:8123/
```

A plain `file://` open mostly works too, but use the server — it matches how
Pages serves the game.

## Checking a change

```bash
npm i -D playwright && npx playwright install chromium
python3 -m http.server 8123 &
node tools/smoke.mjs
```

It boots the page in headless Chromium and fails on any console error, a game
that did not boot, a loader that never went away, or a modal that will not open.
That is deliberately shallow — it catches broken script order, syntax errors and
missing globals, which is what actually breaks here. It is not gameplay testing;
balance and feel still need a human playing the game.

## Deployment

`.github/workflows/deploy.yml` publishes to GitHub Pages on every push to
`main`. It copies `index.html`, `src/` and `assets/` (if present) into `_site`
and uploads that — there is nothing to compile. Pages must be set to
**Source: GitHub Actions** in repository settings for the first run to succeed.

The Yandex build is the same files; `Platform` detects the absent SDK and
switches to local mode, so the Pages deploy is a genuine playable build rather
than a demo.

## Conventions

- **Language.** Player-facing strings are Russian. Code identifiers, comments
  and commit messages are English.
- **Balance changes belong in `config.js`.** If a number is tunable, it should
  be a named entry there, not a literal buried in `state.js` or `ui.js`.
- **`state.js` stays DOM-free.** It emits events (`on`/`emit`); `ui.js`
  subscribes. Keeping that line clean is what makes the rules testable.
- **Saves are versioned.** The key is `mineaplanet.save.v1` and `migrate()` in
  `main.js` merges an old save into the current default shape. If you add a
  field to `createDefaultState()`, make sure `migrate()` fills it in for players
  who already have a save — a missing field is a crash on load, not a fresh
  start.
- **Art is procedural by default.** Prefer extending `sprites.js` over adding
  binary assets; it keeps the game a single fast-loading page.
- **Canvas work is per-frame.** `main.js` runs one rAF loop with a delta; do not
  add independent `setInterval` render loops.

## Gotchas

- The source was originally TypeScript run through a bundler, so you will find
  down-levelled patterns (`var x = class {}`, `(_a = foo) == null ? void 0 : _a`).
  Leave them alone unless you are touching that code anyway.
- `Platform` methods must never throw when the SDK is missing — the whole
  standalone build depends on those fallbacks.
- Ads are throttled (Yandex requires ≥60s between interstitials). Do not call
  them from a render path.
