// The 방명록 on the owner's site: reads the entries of the site's `guestbook`
// collection, newest first, and adds a visitor's. The builder declares the
// collection (anyone reads it, anyone adds to it, no one but the owner
// changes or deletes), so it exists once the owner applies the page. The
// owner signs in here (관리) to delete entries.
// https://github.com/naru-pub/builders, site/guestbook/.
import { createNaru, NaruError } from "https://sdk.naru.pub/sdk/1/naru.js";

const COLLECTION = "guestbook";
// As page.js's LIMITS: what one entry may hold.
const LIMITS = { name: 40, message: 1000 };
const PAGE_SIZE = 20;
const NAME_KEY = "naru-guestbook-name";
const DRAFT_KEY = "naru-guestbook-draft";

const naru = createNaru();
const book = naru.collection(COLLECTION);
const form = document.getElementById("write");
const status = document.getElementById("status");
const list = document.getElementById("entries");
const empty = document.getElementById("empty");
const more = document.getElementById("more");
const adminButton = document.getElementById("admin");
const when = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" });
let admin = null;
let cursor = null;

const store = {
  get(storage, key) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  },
  set(storage, key, value) {
    try {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    } catch {
      // A private window keeps nothing; the page still works.
    }
  },
};

/** What a stored value shows as: visitors write anything, so only text, cut to its limit. */
function text(value, limit) {
  return typeof value === "string" ? value.slice(0, limit) : "";
}

function failure(error, fallback) {
  // SDK 1.1.0's messages are written for visitors.
  return error instanceof NaruError ? error.message : fallback;
}

function entry(document) {
  const item = window.document.createElement("li");
  item.className = "entry";
  item.dataset.id = document.id;
  const meta = window.document.createElement("p");
  meta.className = "meta";
  const name = window.document.createElement("strong");
  name.textContent = text(document.data?.name, LIMITS.name) || "이름 없음";
  const time = window.document.createElement("time");
  time.dateTime = document.createdAt;
  time.textContent = when.format(new Date(document.createdAt));
  meta.append(name, " ", time);
  const message = window.document.createElement("p");
  message.className = "message";
  message.textContent = text(document.data?.message, LIMITS.message);
  item.append(meta, message);
  if (admin) item.append(deleteButton(document.id, item));
  return item;
}

function deleteButton(id, item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "quiet danger";
  button.textContent = "삭제";
  button.addEventListener("click", async () => {
    if (!confirm("이 글을 지울까요? 되돌릴 수 없어요.")) return;
    button.disabled = true;
    try {
      await admin.collection(COLLECTION).delete(id);
      item.remove();
      empty.hidden = list.children.length > 0;
    } catch (error) {
      button.disabled = false;
      status.textContent = failure(error, "글을 지우지 못했어요.");
    }
  });
  return button;
}

async function load() {
  more.disabled = true;
  try {
    const page = await book.list({
      sort: [[{ metadata: "createdAt" }, "desc"]],
      size: PAGE_SIZE,
      after: cursor ?? undefined,
    });
    for (const document of page.documents) list.append(entry(document));
    cursor = page.nextCursor;
    more.hidden = !cursor;
    empty.hidden = list.children.length > 0;
  } catch (error) {
    status.textContent = failure(error, "글을 불러오지 못했어요. 잠시 뒤에 다시 와 주세요.");
  } finally {
    more.disabled = false;
  }
}

form.elements.name.value = store.get(localStorage, NAME_KEY) ?? "";
form.elements.message.value = store.get(sessionStorage, DRAFT_KEY) ?? "";
form.elements.message.addEventListener("input", () =>
  store.set(sessionStorage, DRAFT_KEY, form.elements.message.value || null),
);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = form.elements.name.value.trim().slice(0, LIMITS.name);
  const message = form.elements.message.value.trim().slice(0, LIMITS.message);
  if (!name || !message) {
    status.textContent = "이름과 남길 말을 모두 적어 주세요.";
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = "남기는 중…";
  try {
    const saved = await book.add({ name, message });
    list.prepend(entry(saved));
    empty.hidden = true;
    form.elements.message.value = "";
    store.set(sessionStorage, DRAFT_KEY, null);
    store.set(localStorage, NAME_KEY, name);
    status.textContent = "남겼어요. 고맙습니다!";
  } catch (error) {
    // A lost answer may still have saved it: reload before trying again.
    status.textContent = failure(error, "남기지 못했어요. 새로 고침한 뒤 다시 해 주세요.");
  } finally {
    button.disabled = false;
  }
});

more.addEventListener("click", load);

// The owner: signed in, each entry gets a delete button.
adminButton.addEventListener("click", async () => {
  if (admin) {
    await admin.signOut().catch(() => {});
    location.reload();
    return;
  }
  // The browser leaves for Naru and comes back here.
  await naru.auth.signIn({ collections: [COLLECTION] });
});

try {
  admin = await naru.auth.session();
} catch {
  admin = null;
}
if (admin) adminButton.textContent = "관리 끝내기";
await load();
