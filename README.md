# Naru makers

[makers.naru.pub](https://makers.naru.pub): Naru's own makers,
websites that make someone's [Naru](https://naru.pub) site. A visitor makes
their page here and presses 나루에 띄우기; the maker hands the files to
Naru, where the site's owner sees what would change and applies it. They use
the same handoff as anyone's maker, the SDK's
[`handoff.js`](https://naru.pub/docs/launch).

`site/` is what makers.naru.pub serves:

- `index.html`: the list of makers. It is not a maker itself.
- `profile/`: 소개 페이지, a photo, a name, a line, an introduction, links and
  an accent color, laid out as a card or as a link page (its links as big
  buttons first).
- `resume/`: 이력서, a name and role, contacts, experience, education and
  skills, also laid out for printing.
- `guestbook/`: 방명록, where visitors leave a name and a message, as its own
  page (`guestbook/`) or the site's home page. It hands Naru the site's
  `guestbook` collection with the page (`propose({ collections })`): anyone
  reads it and adds to it, only the owner deletes. The page's
  `guestbook.js` reads and adds entries with the Naru Data SDK, and the
  owner signs in on the page (관리) to delete them. It works on sites with
  the database.
- `shared/`: the form and preview styles every maker uses.

In each maker, `page.js` makes the page and `page.css` is its stylesheet,
handed over as the site's `style.css`; `maker.js` is the form and the
handoff. What the visitor writes stays in their browser (`localStorage`), so
they can come back to it. The Naru apps list the makers in 내 사이트.

Each maker is a folder of `site/`, named in `propose({ maker })` after
its folder, and keeps what it stores in the browser under its own key:
makers on one site share an origin.

## Develop

No build step. Serve `site/` and open a maker:

```bash
python3 -m http.server -d site 8000
```

It hands files to naru.pub as it would from makers.naru.pub, so try it with
your own Naru site: nothing is written until you approve it there.

```bash
node --test "test/*.test.mjs"
```

## Publish

Pushes to `main` publish `site/` to makers.naru.pub once the tests pass:
the `deploy` job in `.github/workflows/main.yml` runs Naru's
[deploy action](https://github.com/naru-pub/actions), which signs in with the
workflow's GitHub token. It needs this repository's `main` registered as a
deploy target of the `makers` site, at its root, on
[naru.pub/github](https://naru.pub/github).

## License

[MIT](LICENSE).
