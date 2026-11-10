# Submission portal

Part of the site, kept apart from the marketing pages. Teams submit their
design on the day; every entry gets a link that shows the model in 3D; judges
score entries from a dashboard; organizers see the ranking and export a CSV.

It is not linked from the homepage, not in the sitemap, and every page and API
response says `noindex`.

| URL | Who | What |
| --- | --- | --- |
| `/submit` | teams | The entry form. Needs the day's **entry code**. |
| `/submit/edit/<id>#k=<key>` | that team | Private edit link, shown after submitting. Works until the deadline. |
| `/entry/<id>` | anyone with the link | Share page: the model in 3D, title, first names, description, renders. |
| `/gallery` | anyone | Entries organizers tick "Show in the gallery" (after the event). |
| `/judge` | judges | Sign in (name + judge passcode), every submitted entry, marking. |
| `/judge/results` | organizers | Ranking by average total, per-criterion averages, notes, CSV. |
| `/judge/settings` | organizers | Entry code, deadline (move or extend), "close submissions now". |

## Try it locally

```sh
npm run dev                      # http://localhost:8080/submit
npm run portal:models            # sample models in .data/demo-models/
npm run portal:seed              # 6 sample entries, marked by 2 judges (needs Chrome)
```

The local preview uses fixed passcodes and saves everything under `.data/portal`
(git-ignored). Delete that folder to start over.

| | Local preview |
| --- | --- |
| Entry code | `MDC-DEMO` |
| Judge passcode | `judge-demo` |
| Organizer passcode | `admin-demo` |

To try the production build instead: `npm run build && npm run preview`
(http://localhost:4173). Same API, same local storage.

## What a team submits

- **Entry code**: shown at the front of the room after the theme reveal, so
  nobody can submit from home before the theme is out.
- **Title**, **how it answers the theme** (judges read this before the team
  presents), **what to look for** (optional).
- **3D model**, required: GLB, STL, OBJ, 3MF or PLY, up to 80 MB. GLB keeps
  colours and materials. A live 3D preview shows it before they submit, with a
  "stand it up" switch for Z-up CAD exports.
- **Renders or screenshots**, up to 4 (optional).
- **Project file** (.f3d, .blend, .step, ...), judges only (optional).
- **Team**: 1 to 4 members, each with full name, school, grade. Optional team
  name. A contact email for prize follow-up.
- **Software** used, and **AI tools**: none, or what they helped with (the
  rules allow it but ask for minimal use).
- **Sharing**: credit by first names ("Avery L. and Sam O.") or team name;
  public link on or off. Surnames, schools and emails are never public.
- **Confirmation**: modelled at the event, after the theme reveal, their own work.

When they press Submit entry, the page saves the details, uploads each file
with a progress bar, saves a still of the 3D preview as the entry's card
image, and marks it submitted. They then get the share link and the private
edit link (with a button to email both to themselves). The page also remembers
entries started on that laptop.

## Judging

- Four criteria, 1 to 10 each, total out of 40. **The criteria are a starting
  point: confirm or change them in `src/portal/shared/judging.ts` before Nov 16.**
- **Judges list**: in `/judge/settings`, organizers enter each judge's name. Once
  the list has names, only those people can sign in as judges and only their
  marks count, so someone who overhears the passcode can't add made-up judges.
  Marks from anyone not on the list show on Results as "not counted".
- Each judge sees only their own marks. The dashboard refreshes every 20
  seconds, so entries show up as teams submit (early judging from 1:30 PM).
- The entry page doubles as the presentation screen: full screen, turntable,
  wireframe, dimensions, plus every file to download.
- Organizers see the ranking (average of judges' totals), each judge's total,
  notes, and a CSV that includes names, schools, grades and contact emails.
- Organizers can pin an award, add an entry to the gallery, hide it from the
  public, reopen editing, mark it late, or delete it.

## The deadline

Submissions close at **2:00 PM on Nov 16** (`PORTAL_DEADLINE`, default
`2026-11-16T14:00:00-05:00`). Organizers can move it or close early from
`/judge/settings`.

A team whose upload is still running at 2:00 gets 10 more minutes to finish,
and only if their entry was started before 2:00. Those entries are flagged
**late** for the judges (the rules say late entries aren't judged; the flag
leaves that call to the judges). Submitted entries lock at 2:00 exactly.

## Deploying (when you say publish)

Nothing here is deployed yet. To turn it on in the Vercel project:

1. **Storage**: Vercel dashboard → Storage → Create → **Blob**, access
   **Private**. Connect it to the project (Production and Preview), and tick
   *"Add a read-write token env var"* so `BLOB_READ_WRITE_TOKEN` is set.
2. **Environment variables** (Production and Preview):

   | Name | Value |
   | --- | --- |
   | `PORTAL_ENTRY_CODE` | The code for the slide. Something short but not guessable, e.g. `WAVE-4827`. |
   | `PORTAL_JUDGE_PASSCODE` | 8+ characters, goes on the judges' sheet. |
   | `PORTAL_ADMIN_PASSCODE` | 10+ characters, organizers only, different from the judges'. |
   | `PORTAL_SESSION_SECRET` | 32+ random characters (`openssl rand -base64 32`). |
   | `PORTAL_DEADLINE` | Optional. ISO time, default 2:00 PM Nov 16. |

   If any of these are missing on Vercel, the API answers 503 instead of
   running with the local passcodes.
3. Deploy a **preview** first and run one real submission from a phone and a
   laptop: upload a model, open the share link, sign in as a judge, mark it.
   The Vercel Blob path is covered by unit tests (signing, URL shapes) but has
   not been run against a real store yet, so this preview check matters.
4. On the day: enter the judges' names in `/judge/settings` before judging
   starts, and put the entry code on the slide after the theme reveal.
5. Merge to `main`.

Limits worth knowing: files go straight from the browser to the private Blob
store (never through the function, so the 4.5 MB function limit doesn't
apply). On the Hobby plan Blob has monthly limits on storage (1 GB) and
operations; 80 entries of typical size fit comfortably, but check the Usage
tab after the event.

## Security, in short

- No accounts. Teams prove ownership with a 256-bit edit key that lives only
  in their link's `#fragment` (never sent in URLs to the server; sent as a
  header) and is stored hashed. Share links use 12-character random ids.
- Judges and organizers get a signed, HttpOnly, SameSite=Strict cookie scoped
  to `/api/portal`, valid 14 hours. Changing a passcode signs everyone out.
- Every write needs a custom header and a same-origin `Origin`, so another
  site can't post on someone's behalf.
- Uploads are signed for one exact storage path and size and expire in 20
  minutes. After upload the server checks the real size and the file's first
  bytes against its type (a renamed `.html` is rejected and deleted).
- Files are never public: every download is a presigned URL that expires in
  30 minutes.
- Wrong entry codes and wrong passcodes are rate-limited per IP. Only failures
  count, and the right code or passcode always works, because the whole venue
  probably shares one IP. Upload signing is limited per entry.
- Public pages never see uploaded file names (they can hold surnames); stored
  files are named by random id. The stored content type must match the type
  the upload was signed for.
- The public share page and gallery only ever get the title, first names or
  team name, software, description and images. Tests check that emails,
  surnames and schools don't leak.

## Files

- `portal.html`, `src/portal/` – the portal's own React app (its own bundle,
  built by `vite.portal.config.ts`; the prerendered site is untouched)
- `src/portal/viewer/` – the 3D viewer (three.js / react-three-fiber)
- `src/portal/shared/` – formats, field rules and rubric shared by browser and server
- `server/portal/` – the API; `api/portal.ts` is the Vercel function
- `scripts/portal/` – sample models and the demo seed
- `npx vitest run server` – API, storage and validation tests
