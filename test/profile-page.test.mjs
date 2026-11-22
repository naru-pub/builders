// node builders/test/profile-page.test.mjs: the page the 소개 페이지 builder makes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { render, safeLink, DEFAULTS } = createRequire(import.meta.url)("../site/profile/page.js");

test("escapes what the owner writes", () => {
  const page = render({ name: "<script>x</script>", tagline: '"q"', about: "a\n<b>" });
  assert.ok(page.includes("<title>&lt;script&gt;x&lt;/script&gt;</title>"));
  assert.ok(page.includes("&quot;q&quot;"));
  assert.ok(page.includes("a<br />&lt;b&gt;"));
  assert.ok(!page.includes("<script>"));
});

test("keeps only links a page may carry", () => {
  for (const link of ["https://a.example", "/blog/", "mailto:me@example.com", "tel:+8210"])
    assert.equal(safeLink(link), link);
  for (const link of ["javascript:alert(1)", "//evil.example", "data:text/html,x", ""])
    assert.equal(safeLink(link), null);
  const page = render({ links: [{ title: "x", url: "javascript:alert(1)" }] });
  assert.ok(page.includes('<a href="#">x</a>'));
});

test("reads well with nothing written, linking its stylesheet and photo", () => {
  const page = render({});
  assert.ok(page.includes(`<title>${DEFAULTS.name}</title>`));
  assert.ok(page.includes('href="style.css"'));
  assert.ok(page.includes("logo.png"));
  assert.ok(render({ photo: "photo.jpg" }).includes('src="photo.jpg"'));
  assert.ok(render({}, { inlineStyle: "body{}" }).includes("<style>body{}</style>"));
});

test("puts the links first, as buttons, on a link page", () => {
  const values = { about: "소개", links: [{ title: "블로그", url: "/blog/" }] };
  const card = render(values);
  assert.ok(card.includes('class="card layout-card"'));
  assert.ok(card.indexOf('class="about"') < card.indexOf('class="links"'));
  const links = render({ ...values, layout: "links" });
  assert.ok(links.includes('class="card layout-links"'));
  assert.ok(links.indexOf('class="links"') < links.indexOf('class="about"'));
  assert.ok(render({ layout: '"><script>' }).includes('class="card layout-card"'));
});

test("takes only the accents it offers", () => {
  assert.ok(render({ accent: "#378ADD" }).includes("--accent: #378ADD"));
  assert.ok(render({ accent: "red;}" }).includes(`--accent: ${DEFAULTS.accent}`));
});
