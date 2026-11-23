// node --test test/: the page the 이력서 maker makes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const { render, DEFAULTS } = createRequire(import.meta.url)("../site/resume/page.js");

test("escapes what the owner writes, everywhere", () => {
  const evil = "<script>x</script>";
  const page = render({
    name: evil,
    role: evil,
    summary: `${evil}\nnext`,
    location: evil,
    skills: evil,
    experience: [{ org: evil, title: evil, period: evil, details: evil }],
    education: [{ school: evil, major: evil, period: evil }],
    links: [{ title: evil, url: "https://a.example" }],
  });
  assert.ok(!page.includes("<script>"));
  assert.ok(page.includes("&lt;script&gt;x&lt;/script&gt;<br />next"));
});

test("links an address or number only when it is one", () => {
  const page = render({
    email: "me@example.com",
    phone: "+82 10-1234-5678",
    links: [
      { title: "블로그", url: "/blog/" },
      { title: "나쁜", url: "javascript:alert(1)" },
    ],
  });
  assert.ok(page.includes('href="mailto:me@example.com"'));
  assert.ok(page.includes('href="tel:+821012345678"'));
  assert.ok(page.includes('href="/blog/"'));
  assert.ok(!page.includes("javascript:"));
  assert.ok(page.includes("<li>나쁜</li>"));
  const odd = render({ email: 'x" onclick="y', phone: "call me" });
  assert.ok(!odd.includes("mailto:") && !odd.includes("tel:"));
});

test("leaves out what is empty", () => {
  const page = render({ experience: [{}, { org: " " }], education: [], skills: " , " });
  assert.ok(page.includes(`<title>${DEFAULTS.name}</title>`));
  for (const heading of ["소개", "경력", "학력", "기술"])
    assert.ok(!page.includes(`<h2>${heading}</h2>`), heading);
  assert.ok(!page.includes('class="contacts"'));
  assert.ok(!page.includes('class="photo"'));
});

test("lays out what is filled in, in order", () => {
  const page = render({
    name: "나루",
    role: "디자이너",
    summary: "소개",
    experience: [
      { org: "가", title: "팀장", period: "2023 – 지금", details: "한 일" },
      { org: "나" },
    ],
    education: [{ school: "학교", major: "전공", period: "2015 – 2019" }],
    skills: "Figma, 영어\n글쓰기",
  });
  assert.ok(page.includes("<title>나루 · 디자이너</title>"));
  assert.ok(page.indexOf("<h3>가") < page.indexOf("<h3>나"));
  assert.ok(page.indexOf("<h2>경력</h2>") < page.indexOf("<h2>학력</h2>"));
  assert.ok(page.includes("<li>Figma</li><li>영어</li><li>글쓰기</li>"));
  assert.ok(page.includes('href="style.css"'));
  assert.ok(render({ photo: "photo.jpg" }).includes('src="photo.jpg"'));
  assert.ok(render({}, { inlineStyle: "b{}" }).includes("<style>b{}</style>"));
});

test("takes only the accents it offers", () => {
  assert.ok(render({ accent: "#378ADD" }).includes("--accent: #378ADD"));
  assert.ok(render({ accent: "red;}" }).includes(`--accent: ${DEFAULTS.accent}`));
});
