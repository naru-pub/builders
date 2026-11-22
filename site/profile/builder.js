// The 소개 페이지 builder (https://naru.pub/docs/builders): the owner fills in
// the form, sees the page as it will be, and hands it to Naru. What they wrote
// is kept in this browser (localStorage), so they can come back and change it.
import { photo as preparePhoto, propose } from "https://sdk.naru.pub/sdk/1.2.0/handoff.js";

(function () {
  "use strict";
  var Page = window.ProfilePage;
  var KEY = "naru-profile-builder";
  var MAX_LINKS = 12;
  var form = document.getElementById("form");
  var preview = document.getElementById("preview");
  var status = document.getElementById("status");
  var linksList = document.getElementById("links");
  var pageStyle = "";
  var photo = null; // { blob, url, type }

  var values = Object.assign({ links: [] }, read());

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

  function photoName() {
    if (!photo) return null;
    return photo.type === "image/png" ? "photo.png" : "photo.jpg";
  }

  var queued = 0;
  function update() {
    save();
    cancelAnimationFrame(queued);
    queued = requestAnimationFrame(function () {
      preview.srcdoc = Page.render(values, {
        inlineStyle: pageStyle,
        photoUrl: photo ? photo.url : null,
      });
    });
  }

  // Text fields.
  ["name", "tagline", "about"].forEach(function (field) {
    var input = form.elements[field];
    input.value = values[field] || "";
    input.addEventListener("input", function () {
      values[field] = input.value;
      update();
    });
  });

  // The layout.
  Array.prototype.forEach.call(form.elements.layout, function (input) {
    input.checked = input.value === (values.layout || Page.DEFAULTS.layout);
    input.addEventListener("change", function () {
      values.layout = input.value;
      update();
    });
  });

  // Links.
  function drawLinks() {
    linksList.innerHTML = "";
    values.links.forEach(function (link, index) {
      var item = document.createElement("li");
      var title = document.createElement("input");
      title.placeholder = "이름";
      title.maxLength = 40;
      title.value = link.title || "";
      title.addEventListener("input", function () {
        values.links[index].title = title.value;
        update();
      });
      var url = document.createElement("input");
      url.placeholder = "https://";
      url.type = "url";
      url.value = link.url || "";
      url.addEventListener("input", function () {
        values.links[index].url = url.value;
        update();
      });
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "link";
      remove.textContent = "삭제";
      remove.addEventListener("click", function () {
        values.links.splice(index, 1);
        drawLinks();
        update();
      });
      item.append(title, url, remove);
      linksList.append(item);
    });
    document.getElementById("link-add").hidden = values.links.length >= MAX_LINKS;
  }
  document.getElementById("link-add").addEventListener("click", function () {
    values.links.push({ title: "", url: "" });
    drawLinks();
    update();
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

  function dataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve({ blob: blob, url: String(reader.result) }); };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // The photo: resized and stripped of its metadata in this browser.
  var thumb = document.getElementById("photo-thumb");
  var remove = document.getElementById("photo-remove");
  document.getElementById("photo").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    status.textContent = "사진을 준비하고 있어요…";
    preparePhoto(file).then(dataUrl).then(
      function (prepared) {
        // A data URL, which the sandboxed preview can load as well.
        photo = { blob: prepared.blob, url: prepared.url, type: prepared.blob.type };
        thumb.src = photo.url;
        remove.hidden = false;
        status.textContent = "";
        update();
      },
      function () {
        status.textContent = "사진을 읽지 못했어요. 다른 사진을 골라 주세요.";
      },
    );
  });
  remove.addEventListener("click", function () {
    photo = null;
    thumb.removeAttribute("src");
    remove.hidden = true;
    update();
  });

  // The handoff.
  var apply = document.getElementById("apply");
  apply.addEventListener("click", function () {
    var name = photoName();
    var page = Page.render(Object.assign({}, values, { photo: name }), {});
    var files = [
      { path: "index.html", data: page },
      { path: "style.css", data: pageStyle },
    ];
    if (photo) files.push({ path: name, data: photo.blob });
    apply.disabled = true;
    status.textContent = "나루에서 확인해 주세요…";
    propose({ builder: "profile", title: "소개 페이지", files: files }).then(
      function (result) {
        apply.disabled = false;
        status.textContent = result.applied
          ? "적용했어요. " + result.url
          : "적용하지 않았어요.";
      },
      function (error) {
        apply.disabled = false;
        status.textContent = error.message;
      },
    );
  });

  fetch("page.css")
    .then(function (response) { return response.text(); })
    .then(function (css) {
      pageStyle = css;
      drawLinks();
      drawAccents();
      update();
    });
})();
