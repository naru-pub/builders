// The 방명록 this maker makes, as plain HTML: every value escaped, so what
// the owner writes is only ever text. The entries are not in the page: on the
// owner's site guestbook.js reads and adds them through Naru Data (the
// `guestbook` collection, which anyone reads and anyone adds to). The
// maker's preview runs no scripts, so it shows a few sample entries
// instead. Loaded by the maker (window.GuestbookPage) and by its tests
// (module.exports).
(function (root) {
  "use strict";

  var ACCENTS = ["#1D9E75", "#378ADD", "#EF9F27", "#D4537E", "#7F77DD", "#444441"];
  var DEFAULTS = { accent: ACCENTS[0] };
  // The page's one name, as its title and its only heading.
  var TITLE = "guestbook";
  // The collection the page reads and adds to, as the maker declares it.
  var COLLECTION = "guestbook";
  var SETTINGS = { read: "world", write: "create" };
  // What one entry may hold; guestbook.js checks the same before adding.
  var LIMITS = { name: 40, message: 1000 };
  var SAMPLES = [
    { name: "나루", message: "방명록을 열었어요. 편하게 한마디 남겨 주세요!", when: "방금" },
    { name: "지나가던 사람", message: "사이트 예뻐요.\n또 올게요 :)", when: "어제" },
  ];

  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function sampleEntries() {
    return SAMPLES.map(function (entry) {
      return (
        '<li class="entry">' +
        '<p class="meta"><strong>' + escape(entry.name) + "</strong> " +
        "<time>" + escape(entry.when) + "</time></p>" +
        '<p class="message">' + escape(entry.message) + "</p>" +
        "</li>"
      );
    }).join("");
  }

  /**
   * The page from the owner's values: { accent }. With
   * `inlineStyle`, the stylesheet goes in the page and sample entries stand
   * in for the real ones (the maker's preview); otherwise it links
   * style.css and loads guestbook.js.
   */
  function render(input, options) {
    var values = Object.assign({}, DEFAULTS, input || {});
    var accent = ACCENTS.indexOf(values.accent) >= 0 ? values.accent : DEFAULTS.accent;
    var preview = !!(options && options.inlineStyle);
    var head = preview
      ? "<style>" + options.inlineStyle + "</style>"
      : '<link rel="stylesheet" href="style.css" />\n' +
        '<script type="module" src="guestbook.js"></script>';
    return (
      "<!doctype html>\n" +
      '<html lang="ko" style="--accent: ' + accent + '">\n' +
      "<head>\n" +
      '<meta charset="utf-8" />\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
      "<title>" + TITLE + "</title>\n" +
      head + "\n" +
      "</head>\n" +
      "<body>\n" +
      "<main>\n" +
      "<h1>" + TITLE + "</h1>\n" +
      '<form id="write" class="write">\n' +
      '<label>이름 <input name="name" maxlength="' + LIMITS.name + '" autocomplete="nickname" required /></label>\n' +
      '<label>남길 말 <textarea name="message" rows="3" maxlength="' + LIMITS.message + '" required></textarea></label>\n' +
      '<button type="submit">남기기</button>\n' +
      '<p id="status" class="status" role="status"></p>\n' +
      "</form>\n" +
      '<ol id="entries" class="entries">' + (preview ? sampleEntries() : "") + "</ol>\n" +
      '<p id="empty" class="empty" hidden>아직 남긴 글이 없어요. 처음으로 남겨 주세요.</p>\n' +
      '<button id="more" type="button" class="more" hidden>더 보기</button>\n' +
      "</main>\n" +
      "<footer>\n" +
      '<a href="https://naru.pub">나루</a>에 띄운 방명록 · ' +
      '<button id="admin" type="button" class="quiet">관리</button>\n' +
      "</footer>\n" +
      "</body>\n" +
      "</html>\n"
    );
  }

  var api = {
    render: render,
    ACCENTS: ACCENTS,
    DEFAULTS: DEFAULTS,
    TITLE: TITLE,
    COLLECTION: COLLECTION,
    SETTINGS: SETTINGS,
    LIMITS: LIMITS,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.GuestbookPage = api;
})(this);
