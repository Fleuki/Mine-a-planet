/* ==========================================================================
   assets.js — Tiny image cache for optional PNG art overrides.

   Loaded as a classic script from index.html; every top-level binding here is
   shared with the other modules. Load order matters — see index.html.
   ========================================================================== */
var cache = /* @__PURE__ */ new Map();
function getArt(url) {
  if (!url) return null;
  let e = cache.get(url);
  if (e) return e;
  e = { url, img: new Image(), ready: false, failed: false };
  e.img.decoding = "async";
  e.img.onload = () => {
    e.ready = true;
  };
  e.img.onerror = () => {
    e.failed = true;
  };
  e.img.src = url;
  cache.set(url, e);
  return e;
}
function preloadArt(urls) {
  for (const u of urls) if (u) getArt(u);
}
