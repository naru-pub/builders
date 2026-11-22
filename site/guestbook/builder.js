// The 방명록 builder (https://naru.pub/docs/builders): the owner picks where
// their guestbook goes and its color, sees it as it will be,
// and hands it to Naru as the builder "guestbook" with the collection its
// page uses, which Naru creates once they approve. What they wrote is kept
// in this browser (localStorage), so they can come back and change it.
import { propose } from "https://sdk.naru.pub/sdk/1.2.0/handoff.js";

(function () {
  "use strict";
  var Page = window.GuestbookPage;
  // Builders on this site share an origin, and so the browser's storage.
  var KEY = "naru-guestbook-builder";
  // Where the page goes: its own folder, beside the owner's home page, or
  // the home page itself.
  var PLACES = {
    folder: { target: "guestbook/", help: "사이트의 /guestbook/ 주소에 방명록을 따로 만들어요. 첫 페이지는 그대로예요." },
    home: { target: "", help: "사이트 첫 페이지(index.html)를 방명록으로 바꿔요. 원래 첫 페이지는 보관한 뒤 바꿔요." },
  };
  var form = document.getElementById("form");
  var preview = document.getElementById("preview");
  var status = document.getElementById("status");
  var placeHelp = document.getElementById("place-help");
  var pageStyle = "";
  var pageScript = "";

  var values = read();

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(values));
    } catch (e) {
      // A private window keeps nothing; the builder still works.
    }
  }

  function place() {
    return PLACES[values.place] ? values.place : "folder";
  }

  var queued = 0;
  function update() {
    save();
    placeHelp.textContent = PLACES[place()].help;
    cancelAnimationFrame(queued);
    queued = requestAnimationFrame(function () {
      preview.srcdoc = Page.render(values, { inlineStyle: pageStyle });
    });
  }

  // Where it goes.
  Array.prototype.forEach.call(form.elements.place, function (input) {
    input.checked = input.value === place();
    input.addEventListener("change", function () {
      values.place = input.value;
      update();
    });
  });

  // Accent colors.
  var accents = document.getElementById("accents");
  Page.ACCENTS.forEach(function (color) {
    var button = document.createElement("button");
    button.type = "button";
    button.style.background = color;
    button.setAttribute("aria-label", color);
    button.addEventListener("click", function () {
      values.accent = color;
      drawAccents();
      update();
    });
    accents.append(button);
  });
  function drawAccents() {
    var current = values.accent || Page.DEFAULTS.accent;
    Array.prototype.forEach.call(accents.children, function (button) {
      button.setAttribute("aria-pressed", String(button.getAttribute("aria-label") === current));
    });
  }

  // The handoff: the page, its style and script, and the collection it uses.
  var apply = document.getElementById("apply");
  apply.addEventListener("click", function () {
    var collections = {};
    collections[Page.COLLECTION] = Page.SETTINGS;
    apply.disabled = true;
    status.textContent = "나루에서 확인해 주세요…";
    propose({
      builder: "guestbook",
      title: "방명록",
      target: PLACES[place()].target,
      collections: collections,
      files: [
        { path: "index.html", data: Page.render(values, {}) },
        { path: "style.css", data: pageStyle },
        { path: "guestbook.js", data: pageScript },
      ],
    }).then(
      function (result) {
        apply.disabled = false;
        status.textContent = result.applied
          ? "띄웠어요. " + result.url
          : "띄우지 않았어요.";
      },
      function (error) {
        apply.disabled = false;
        status.textContent = error.message;
      },
    );
  });

  // The page's stylesheet and script, handed over as they are.
  Promise.all(
    ["page.css", "guestbook.js"].map(function (path) {
      return fetch(path).then(function (response) {
        if (!response.ok) throw new Error(path);
        return response.text();
      });
    }),
  ).then(
    function (texts) {
      pageStyle = texts[0];
      pageScript = texts[1];
      drawAccents();
      update();
    },
    function () {
      apply.disabled = true;
      status.textContent = "페이지를 불러오지 못했어요. 새로 고침해 주세요.";
    },
  );
})();
