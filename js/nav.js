/* ============================================================
   nav.js — "Clean URLs online, real files offline"
   ------------------------------------------------------------
   The HTML links point at real files (index.html, about.html,
   contact.html), which ALWAYS work: double-clicked offline, on
   GitHub Pages, anywhere.

   When the site is running online (not file:// and not a local
   dev server), this script quietly rewrites those links to the
   clean versions:
       about.html   ->  about
       contact.html ->  contact
       index.html   ->  ./   (the folder itself)
   If this script ever fails to load, the .html links still work.
   ============================================================ */
(function () {
  var host = location.hostname;
  var isLocal =
    location.protocol === "file:" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    /\.local$/.test(host);

  if (isLocal) return; // offline: leave the .html links untouched

  // 1) Rewrite navigation links to clean URLs
  var links = document.querySelectorAll("a[href]");
  for (var i = 0; i < links.length; i++) {
    var href = links[i].getAttribute("href");
    var m = href.match(/^(index|about|contact)\.html(#.*)?$/);
    if (!m) continue;
    var clean = m[1] === "index" ? "./" : m[1];
    links[i].setAttribute("href", clean + (m[2] || ""));
  }

  // 2) If someone lands on /about.html, tidy the address bar to /about
  var path = location.pathname;
  var tidy = path.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
  if (tidy !== path && window.history && history.replaceState) {
    history.replaceState(null, "", tidy + location.search + location.hash);
  }
})();
