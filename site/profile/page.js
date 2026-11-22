// The 소개 페이지 this builder makes, as plain HTML: every value escaped, so
// what the owner writes is only ever text, and links limited to the site's own
// paths, http(s), mailto and tel. Loaded by the builder (window.ProfilePage)
// and by its tests (module.exports).
(function (root) {
  "use strict";

  var ACCENTS = ["#EF9F27", "#378ADD", "#1D9E75", "#D4537E", "#7F77DD", "#444441"];
  // card: the introduction first, its links below. links: a link page, its
  // links as big buttons right under the name, the introduction after them.
  var LAYOUTS = ["card", "links"];
  var DEFAULTS = {
    layout: "card",
    name: "나루",
    tagline: "나루에 띄운 작은 홈페이지예요.",
    about: "",
    links: [],
    accent: ACCENTS[0],
  };
  var LOGO = "https://naru.pub/logo.png";

  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** A link a page may carry, or null. */
  function safeLink(value) {
    if (typeof value !== "string" || !value || value.length > 2000) return null;
    if (value.charAt(0) === "/") return value.charAt(1) === "/" ? null : value;
    try {
      var url = new URL(value);
      return ["http:", "https:", "mailto:", "tel:"].indexOf(url.protocol) >= 0 ? value : null;
    } catch (e) {
      return null;
    }
  }

  /**
   * The page from the owner's values: { layout, name, tagline, about, links, accent }
   * and `photo`, the photo's file name on the site if there is one. With
   * `inlineStyle`, the stylesheet goes in the page (the builder's preview);
   * otherwise it links style.css.
   */
  function render(input, options) {
    var values = Object.assign({}, DEFAULTS, input || {});
    var name = values.name || DEFAULTS.name;
    var tagline = values.tagline || DEFAULTS.tagline;
    var accent = ACCENTS.indexOf(values.accent) >= 0 ? values.accent : DEFAULTS.accent;
    var layout = LAYOUTS.indexOf(values.layout) >= 0 ? values.layout : DEFAULTS.layout;
    var photo = (options && options.photoUrl) || values.photo || LOGO;
    var links = (values.links || []).filter(function (link) {
      return link && (link.title || safeLink(link.url));
    });
    var style = options && options.inlineStyle
      ? "<style>" + options.inlineStyle + "</style>"
      : '<link rel="stylesheet" href="style.css" />';
    var about = values.about
      ? '<p class="about">' + escape(values.about).replace(/\n/g, "<br />") + "</p>"
      : "";
    var list = links.length
      ? '<ul class="links">' +
        links.map(function (link) {
          var href = safeLink(link.url) || "#";
          return '<li><a href="' + escape(href) + '">' + escape(link.title || link.url) + "</a></li>";
        }).join("") +
        "</ul>"
      : "";
    return (
      "<!doctype html>\n" +
      '<html lang="ko" style="--accent: ' + accent + '">\n' +
      "<head>\n" +
      '<meta charset="utf-8" />\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
      "<title>" + escape(name) + "</title>\n" +
      '<meta name="description" content="' + escape(tagline) + '" />\n' +
      '<meta property="og:title" content="' + escape(name) + '" />\n' +
      '<meta property="og:description" content="' + escape(tagline) + '" />\n' +
      style + "\n" +
      "</head>\n" +
      "<body>\n" +
      '<main class="card layout-' + layout + '">\n' +
      '<img class="avatar" src="' + escape(photo) + '" alt="" width="112" height="112" />\n' +
      "<h1>" + escape(name) + "</h1>\n" +
      '<p class="tagline">' + escape(tagline) + "</p>\n" +
      (layout === "links" ? list + about : about + list) + "\n" +
      "</main>\n" +
      '<footer><a href="https://naru.pub">나루</a>에 띄운 홈페이지</footer>\n' +
      "</body>\n" +
      "</html>\n"
    );
  }

  var api = {
    render: render,
    safeLink: safeLink,
    ACCENTS: ACCENTS,
    LAYOUTS: LAYOUTS,
    DEFAULTS: DEFAULTS,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ProfilePage = api;
})(this);
