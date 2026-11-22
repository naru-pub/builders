// The 이력서 builder (https://naru.pub/docs/builders): the owner fills in the
// form, sees the page as it will be, and hands it to Naru as the builder
// "resume". What they wrote is kept in this browser (localStorage), so they
// can come back and change it.
import { photo as preparePhoto, propose } from "https://sdk.naru.pub/sdk/1.2.0/handoff.js";

(function () {
  "use strict";
  var Page = window.ResumePage;
  // Builders on this site share an origin, and so the browser's storage.
  var KEY = "naru-resume-builder";
  var form = document.getElementById("form");
  var preview = document.getElementById("preview");
  var status = document.getElementById("status");
  var pageStyle = "";
  var photo = null; // { blob, url, type }

  // The lists the owner adds to, and the fields of each item.
  var LISTS = {
    links: {
      max: 8,
      fields: [
        { key: "title", label: "이름", placeholder: "블로그", max: 40 },
        { key: "url", label: "주소", placeholder: "https://", type: "url" },
      ],
    },
    experience: {
      max: 12,
      fields: [
        { key: "org", label: "회사·단체", placeholder: "나루", max: 60 },
        { key: "title", label: "맡은 일", placeholder: "디자이너", max: 60 },
        { key: "period", label: "기간", placeholder: "2023.03 – 지금", max: 40 },
        { key: "details", label: "한 일", multiline: true, max: 1000 },
      ],
    },
    education: {
      max: 8,
      fields: [
        { key: "school", label: "학교", placeholder: "나루대학교", max: 60 },
        { key: "major", label: "전공", placeholder: "시각디자인", max: 60 },
        { key: "period", label: "기간", placeholder: "2015 – 2019", max: 40 },
      ],
    },
  };

  var values = Object.assign({}, read());
  Object.keys(LISTS).forEach(function (name) {
    if (!Array.isArray(values[name])) values[name] = [];
  });

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
  ["name", "role", "summary", "email", "phone", "location", "skills"].forEach(function (field) {
    var input = form.elements[field];
    input.value = values[field] || "";
    input.addEventListener("input", function () {
      values[field] = input.value;
      update();
    });
  });

  // Lists: each item's fields, a way to move it up, and to remove it.
  function drawList(name) {
    var config = LISTS[name];
    var list = document.getElementById(name);
    list.innerHTML = "";
    values[name].forEach(function (item, index) {
      var entry = document.createElement("li");
      config.fields.forEach(function (field) {
        var label = document.createElement("label");
        label.textContent = field.label + " ";
        var input = document.createElement(field.multiline ? "textarea" : "input");
        if (field.multiline) input.rows = 3;
        else if (field.type) input.type = field.type;
        if (field.placeholder) input.placeholder = field.placeholder;
        if (field.max) input.maxLength = field.max;
        input.value = item[field.key] || "";
        input.addEventListener("input", function () {
          values[name][index][field.key] = input.value;
          update();
        });
        label.append(input);
        entry.append(label);
      });
      var actions = document.createElement("div");
      actions.className = "entry-actions";
      if (index > 0) {
        var up = document.createElement("button");
        up.type = "button";
        up.className = "link";
        up.textContent = "위로";
        up.addEventListener("click", function () {
          var moved = values[name].splice(index, 1)[0];
          values[name].splice(index - 1, 0, moved);
          drawList(name);
          update();
        });
        actions.append(up);
      }
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "link danger";
      remove.textContent = "삭제";
      remove.addEventListener("click", function () {
        values[name].splice(index, 1);
        drawList(name);
        update();
      });
      actions.append(remove);
      entry.append(actions);
      list.append(entry);
    });
    form.querySelector('[data-add="' + name + '"]').hidden = values[name].length >= config.max;
  }
  Object.keys(LISTS).forEach(function (name) {
    form.querySelector('[data-add="' + name + '"]').addEventListener("click", function () {
      values[name].push({});
      drawList(name);
      update();
      // Straight to the new item's first field.
      var inputs = document.getElementById(name).querySelectorAll("li:last-child input, li:last-child textarea");
      if (inputs[0]) inputs[0].focus();
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
  var removePhoto = document.getElementById("photo-remove");
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
        removePhoto.hidden = false;
        status.textContent = "";
        update();
      },
      function () {
        status.textContent = "사진을 읽지 못했어요. 다른 사진을 골라 주세요.";
      },
    );
  });
  removePhoto.addEventListener("click", function () {
    photo = null;
    thumb.removeAttribute("src");
    removePhoto.hidden = true;
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
    propose({ builder: "resume", title: "이력서", files: files }).then(
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

  fetch("page.css")
    .then(function (response) { return response.text(); })
    .then(function (css) {
      pageStyle = css;
      Object.keys(LISTS).forEach(drawList);
      drawAccents();
      update();
    });
})();
