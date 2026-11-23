// The 이력서 this maker makes, as plain HTML: every value escaped, so what
// the owner writes is only ever text; links limited to the site's own paths,
// http(s), mailto and tel; and sections with nothing in them left out. Loaded
// by the maker (window.ResumePage) and by its tests (module.exports).
(function (root) {
  "use strict";

  var ACCENTS = ["#2E6B61", "#378ADD", "#D4537E", "#7F77DD", "#C76A1A", "#444441"];
  var DEFAULTS = {
    name: "나루",
    role: "",
    summary: "",
    email: "",
    phone: "",
    location: "",
    links: [],
    experience: [],
    education: [],
    skills: "",
    accent: ACCENTS[0],
  };
  var EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
  var PHONE = /^\+?[\d\s()-]{4,20}$/;

  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /** Text with its line breaks kept. */
  function lines(value) {
    return escape(value).replace(/\n/g, "<br />");
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

  /** An address as the owner wrote it, made a link only when it is one. */
  function contact(text, href) {
    return href
      ? '<li><a href="' + escape(href) + '">' + escape(text) + "</a></li>"
      : "<li>" + escape(text) + "</li>";
  }

  /** The filled-in items of a list, each with at least one of `keys`. */
  function filled(list, keys) {
    return (Array.isArray(list) ? list : []).filter(function (item) {
      return item && keys.some(function (key) {
        return typeof item[key] === "string" && item[key].trim();
      });
    });
  }

  function section(title, body) {
    return body ? '<section>\n<h2>' + title + "</h2>\n" + body + "</section>\n" : "";
  }

  /**
   * The page from the owner's values (DEFAULTS' keys) and `photo`, the
   * photo's file name on the site if there is one. With `inlineStyle`, the
   * stylesheet goes in the page (the maker's preview); otherwise it links
   * style.css.
   */
  function render(input, options) {
    var values = Object.assign({}, DEFAULTS, input || {});
    var name = (values.name || "").trim() || DEFAULTS.name;
    var role = (values.role || "").trim();
    var accent = ACCENTS.indexOf(values.accent) >= 0 ? values.accent : DEFAULTS.accent;
    var photo = (options && options.photoUrl) || values.photo || "";
    var style = options && options.inlineStyle
      ? "<style>" + options.inlineStyle + "</style>"
      : '<link rel="stylesheet" href="style.css" />';

    var email = (values.email || "").trim();
    var phone = (values.phone || "").trim();
    var place = (values.location || "").trim();
    var contacts = [];
    if (email) contacts.push(contact(email, EMAIL.test(email) ? "mailto:" + email : null));
    if (phone)
      contacts.push(contact(phone, PHONE.test(phone) ? "tel:" + phone.replace(/[^\d+]/g, "") : null));
    if (place) contacts.push(contact(place, null));
    filled(values.links, ["title", "url"]).forEach(function (link) {
      contacts.push(contact(link.title || link.url, safeLink(link.url)));
    });

    var experience = filled(values.experience, ["org", "title", "period", "details"]).map(function (item) {
      return (
        '<article class="item">\n' +
        (item.period ? '<p class="period">' + escape(item.period) + "</p>\n" : "") +
        "<h3>" + escape(item.org || "") +
        (item.title ? ' <span class="item-role">' + escape(item.title) + "</span>" : "") +
        "</h3>\n" +
        (item.details ? '<p class="details">' + lines(item.details) + "</p>\n" : "") +
        "</article>\n"
      );
    }).join("");
    var education = filled(values.education, ["school", "major", "period"]).map(function (item) {
      return (
        '<article class="item">\n' +
        (item.period ? '<p class="period">' + escape(item.period) + "</p>\n" : "") +
        "<h3>" + escape(item.school || "") +
        (item.major ? ' <span class="item-role">' + escape(item.major) + "</span>" : "") +
        "</h3>\n" +
        "</article>\n"
      );
    }).join("");
    var skills = String(values.skills || "")
      .split(/[,\n]/)
      .map(function (skill) { return skill.trim(); })
      .filter(Boolean)
      .slice(0, 40);

    var description = role || name + "의 이력서";
    return (
      "<!doctype html>\n" +
      '<html lang="ko" style="--accent: ' + accent + '">\n' +
      "<head>\n" +
      '<meta charset="utf-8" />\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
      "<title>" + escape(name) + (role ? " · " + escape(role) : "") + "</title>\n" +
      '<meta name="description" content="' + escape(description) + '" />\n' +
      '<meta property="og:title" content="' + escape(name) + '" />\n' +
      '<meta property="og:description" content="' + escape(description) + '" />\n' +
      style + "\n" +
      "</head>\n" +
      "<body>\n" +
      '<main class="resume">\n' +
      '<header class="top">\n' +
      (photo
        ? '<img class="photo" src="' + escape(photo) + '" alt="" width="96" height="96" />\n'
        : "") +
      "<div>\n" +
      "<h1>" + escape(name) + "</h1>\n" +
      (role ? '<p class="role">' + escape(role) + "</p>\n" : "") +
      (contacts.length ? '<ul class="contacts">' + contacts.join("") + "</ul>\n" : "") +
      "</div>\n" +
      "</header>\n" +
      section("소개", values.summary ? '<p class="summary">' + lines(values.summary) + "</p>\n" : "") +
      section("경력", experience) +
      section("학력", education) +
      section(
        "기술",
        skills.length
          ? '<ul class="skills">' + skills.map(function (skill) {
              return "<li>" + escape(skill) + "</li>";
            }).join("") + "</ul>\n"
          : "",
      ) +
      "</main>\n" +
      '<footer><a href="https://naru.pub">나루</a>에 띄운 홈페이지</footer>\n' +
      "</body>\n" +
      "</html>\n"
    );
  }

  var api = { render: render, safeLink: safeLink, ACCENTS: ACCENTS, DEFAULTS: DEFAULTS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ResumePage = api;
})(this);
