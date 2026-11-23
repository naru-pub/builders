// node --test test/: the page the 방명록 maker makes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const { render, DEFAULTS, TITLE, COLLECTION, SETTINGS, LIMITS } = createRequire(import.meta.url)(
  "../site/guestbook/page.js",
);

test("is called guestbook, whatever it is given", () => {
  const page = render({ title: "<script>x</script>", intro: "an-intro-marker" });
  assert.equal(TITLE, "guestbook");
  assert.ok(page.includes("<title>guestbook</title>"));
  assert.ok(page.includes("<h1>guestbook</h1>"));
  assert.ok(!page.includes("<script>x") && !page.includes("an-intro-marker"));
  assert.equal((page.match(/<h[1-6]/g) || []).length, 1);
});

test("loads its script and stylesheet on the site, and shows samples only in the preview", () => {
  const page = render({});
  assert.ok(page.includes('href="style.css"'));
  assert.ok(page.includes('<script type="module" src="guestbook.js"></script>'));
  assert.ok(page.includes('<ol id="entries" class="entries"></ol>'));

  const preview = render({}, { inlineStyle: "body{}" });
  assert.ok(preview.includes("<style>body{}</style>"));
  assert.ok(!preview.includes("guestbook.js"));
  assert.ok(preview.includes('class="entry"'));
});

test("has what guestbook.js looks for", () => {
  const page = render({});
  for (const id of ["write", "status", "entries", "empty", "more", "admin"])
    assert.ok(page.includes(`id="${id}"`), id);
  assert.ok(page.includes(`maxlength="${LIMITS.name}"`));
  assert.ok(page.includes(`maxlength="${LIMITS.message}"`));
});

test("declares the collection guestbook.js uses, open to read and to add only", () => {
  assert.deepEqual(SETTINGS, { read: "world", write: "create" });
  const script = readFileSync(new URL("../site/guestbook/guestbook.js", import.meta.url), "utf8");
  assert.ok(script.includes(`const COLLECTION = "${COLLECTION}";`));
  assert.ok(script.includes(`const LIMITS = { name: ${LIMITS.name}, message: ${LIMITS.message} };`));
  // Visitors' entries only ever reach the page as text.
  assert.ok(!/innerHTML/.test(script));
});

test("takes only the accents it offers", () => {
  assert.ok(render({ accent: "#378ADD" }).includes("--accent: #378ADD"));
  assert.ok(render({ accent: "red;}" }).includes(`--accent: ${DEFAULTS.accent}`));
});
