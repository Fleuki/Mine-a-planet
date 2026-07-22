// ============================================================================
//  External art loader. Lets hand-made / Claude-designed sprites (PNG or SVG)
//  override the procedural drone and planet drawing. Everything is optional —
//  when a file is missing or still loading, the renderer falls back to the
//  procedural art, so the game never blocks on assets.
// ============================================================================

const cache = new Map();   // url -> { url, img, ready, failed }

// Returns a cache entry for a url (kicking off the load on first request), or
// null when url is falsy. Check `.ready` before drawing `.img`.
export function getArt(url) {
  if (!url) return null;
  let e = cache.get(url);
  if (e) return e;
  e = { url, img: new Image(), ready: false, failed: false };
  e.img.decoding = 'async';
  e.img.onload = () => { e.ready = true; };
  e.img.onerror = () => { e.failed = true; };
  e.img.src = url;
  cache.set(url, e);
  return e;
}

// Warm the cache for a list of urls (call once on boot).
export function preloadArt(urls) {
  for (const u of urls) if (u) getArt(u);
}

// True when a ready-to-draw image exists for the url.
export function artReady(url) {
  const e = url && cache.get(url);
  return !!(e && e.ready);
}
