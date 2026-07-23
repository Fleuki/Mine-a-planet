# Custom art (drones & planets)

The game draws every drone and planet **procedurally** by default. You can
override any of them with your own art (e.g. sprites generated in Claude
Design) — no code changes needed beyond registering the file.

## Drones

1. Export a sprite as **SVG** (preferred, crisp at any size) or **PNG**
   (transparent background), roughly **square** (~256×320), with the drone
   **facing down**: head at the top, drill pointing toward the **bottom**.
2. Drop it in `src/assets/drones/` (e.g. `celestia.svg`).
3. Register it in `src/js/config.js` → `DRONE_ART`:

   ```js
   export const DRONE_ART = {
     celestia: 'assets/drones/celestia.svg',
   };
   ```

The sprite then replaces that drone everywhere — on the planet, in the
hangar, the roulette, the collection index, and results. Any drone without
an entry keeps its procedural look, so you can convert them one at a time.

`assets/drones/celestia.svg` is a working example — replace it with your own.

### Note on animation
A static sprite (PNG/SVG) does **not** spin its drill on its own — the game
still bobs it and fires the mining beam, so it stays lively, but internal
part animation from a Claude Design artifact won't carry over automatically.
If you want a spinning drill or frame animation, send the art as **separate
layers** (body + drill) or a **sprite sheet** and it can be wired up.

## Planets

1. Export a **square** image (~512×512), the planet disc filling the frame.
2. Drop it in `src/assets/planets/` (e.g. `void.png`).
3. Register it in `src/js/config.js` → `PLANET_ART` keyed by tier (0-based,
   the index into `PLANETS`):

   ```js
   export const PLANET_ART = {
     9: 'assets/planets/void.png',
   };
   ```

A static planet image **loses the procedural rotation**. If you want the
planet to keep spinning, either keep it procedural (I can enrich those with
clouds / city lights / rings instead) or provide a wide seamless surface
strip and it can scroll like the built-in planets.
