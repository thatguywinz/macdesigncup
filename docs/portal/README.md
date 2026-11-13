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
| `/entry/<id>` | anyone with the link | The entry's page: video, 3D model (if any), title, first names, description, renders. |
| `/submissions` | anyone | Public page of entries. Organizers switch it on in Settings: off, every entry, or only picked ones. |
| `/judge` | judges | Sign in (name + judge passcode), "up next for you", every submitted entry, marking. |
| `/judge/live` | organizers | The judging floor live: who has marked what, entries nobody has reached, each judge's pace, top five. |
| `/judge/results` | organizers | Ranking by average total, per-criterion averages, notes, CSV. |
| `/judge/settings` | organizers | Entry code on/off, deadline (move or extend), "close submissions now". |

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

## What a team submits (three steps)

1. **Your design**: entry code (if on), title, a few words on what it is and
   how it fits the theme (up to 80 words), and at least one picture (render or
   screenshot). The first picture is the entry's cover. A video, 3D model, CAD
   link, sketches, project file and a note for judges are optional, folded
   under "Add more".
2. **Your team**: names, schools, grades, contact email, team name, and how the
   public page credits them.
3. **Submit**: software, AI use (pure prompt-to-3D isn't allowed), the
   own-work confirmation.

Text boxes are limited by words, not characters (summary 80, extra note 120,
AI note 40, files note 60), with a live "12/80 words" counter. To submit, an
entry needs one thing to look at: a picture, a video or a model.

The form and the "Submitted" page both show **"Then you present: be ready"**:
judging 2:10 to 3:20 PM in WFL632/634/637, present from your own laptop
(HDMI or USB-C), a 1-minute pitch, and the rubric's four categories with
what top marks look like. A **Needed to submit** checklist ticks off as they
go. What a team types is kept on that laptop until the entry is first saved.

### Entry code: on or off

In `/judge/settings`, organizers choose:

- **Teams type the entry code** (default): safer, only people in the room can
  start an entry.
- **No entry code**: easier. The form opens to anyone at the **theme reveal
  time** (also in Settings, default 9:10 AM Nov 16) and shows a "opens at"
  screen before that. To test it before the day, move the reveal time earlier.

## Earlier notes: what a team submits

- **Entry code**: shown at the front of the room after the theme reveal, so
  nobody can submit from home before the theme is out.
- **Title**, **how it answers the theme** (judges read this before the team
  presents), **what to look for** (optional).
- **3D model**, required: GLB, STL, OBJ, 3MF or PLY, up to 250 MB. GLB keeps
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

- The organizers' rubric (`src/portal/shared/judging.ts`): Innovation &
  Originality, Technicality, Relevance to Theme, Communication & Presentation,
  each 0 to 25 in four levels (0-6, 7-12, 13-19, 20-25), total out of 100. A
  judge taps the level whose description fits, then the exact points. The
  wording is the rubric's general version: the theme-specific one is revealed
  at the opening ceremony and must not go in the code (it's public).
- **Rooms and schedule** (`/judge/settings`): name the rooms, set the start
  time, end time and minutes per team (default 3: a 1-minute pitch plus
  scoring while the next team sets up), put each judge in a room, then press **Make the
  schedule** after submissions close. Every team sees "Your judging: room
  WFL634 at 2:22 PM" on its entry page; each judge's dashboard opens on their
  room in time order, and "Save and judge next" follows it. Making it again
  only adds new entries; nobody's time moves. The Live board shows the
  schedule per room.
- **Judges list**: in `/judge/settings`, organizers enter each judge's name. Once
  the list has names, only those people can sign in as judges and only their
  marks count, so someone who overhears the passcode can't add made-up judges.
  Marks from anyone not on the list show on Results as "not counted".
- Each judge sees only their own marks. The dashboard refreshes every 20
  seconds, so entries show up as teams submit (early judging from 1:30 PM).
- **Up next for you**: each judge's dashboard and "Save and judge next" go to
  the entry they haven't marked that has the fewest marks so far (oldest
  first), so every entry gets a first look before any gets a third.
- The entry page has no timer (the room schedule keeps time). It shows a
  three-step "how to mark" strip, then one block per rubric category, and a
  save bar (total, which categories are done, **Save and judge next**) that
  stays at the bottom of the screen. Marks not saved yet are kept in that
  browser tab if the judge moves to another entry and comes back.
- **Practice entry** (`/judge/practice`): a made-up entry (a sample model in
  `public/portal/practice/`) with the real judge screen. Nothing is sent or
  saved, so organizers can see exactly what judges see and judges can warm up.
  Linked from the dashboard (judges who haven't marked anything yet, and the
  "No entries yet" message).
- **Organizer guide**: organizers' dashboard opens with a folding guide (what a
  judge does, what to press on the day, whether the organizer's own marks
  count). Folding it is remembered on that browser.
- **Live** (`/judge/live`, organizers): entries down the side, judges across
  the top, a filled cell per mark, fewest-marked entries first; each judge's
  count and last mark time (orange after 20 idle minutes); the running top
  five. **Hide scores** keeps marks off a projected screen. Refreshes every 10 s.
- The entry page doubles as the presentation screen: full screen, turntable,
  wireframe, dimensions, plus every file to download.
- Organizers see the ranking (average of judges' totals), each judge's total,
  notes, and a CSV that includes names, schools, grades and contact emails.
- Organizers can pin an award, add an entry to the gallery, hide it from the
  public, reopen editing, mark it late, or delete it.

## Measurements and the size spec

Modelled on how CAD speed-modelling tournaments check accuracy (the model's
measured volume or mass against a target, within a tolerance).

- The viewer measures every model from the file itself: width × depth × height
  in millimetres, volume (only for a closed, watertight solid), surface area,
  triangle count, and whether the mesh is closed. Teams pick the units their
  file is in (STL and OBJ don't say); a model that comes out a few millimetres
  across gets a "was this exported in metres?" hint.
- Judges' viewers re-measure from the uploaded file, so what judges see doesn't
  depend on the team's browser.
- **Size spec** (optional, `/judge/settings`): max width / depth / height and/or a
  target volume ± %. Teams see pass/fail live before they submit; the viewer
  draws the limit as a dashed box (red when the model doesn't fit); judges see
  the check on each entry and "Outside spec" on its card. A footprint limit
  counts either way round, so a model turned 90° still fits.

## Sketches and process

- **Sketches and progress shots**: up to 8 screenshots of sketches, the
  feature tree or timeline. Teams press **Save draft** during the day to
  upload them (a draft needs only a title); the server stamps each upload with
  its own clock, so judges see a real timeline that can't be backdated.
- **CAD document link**: an optional view-only link (Onshape, Fusion a360.co,
  Tinkercad, 3DEXPERIENCE or Google Drive only) so judges can open the history.
- The judge page's **Process** panel shows the timeline, the link, what the
  model file says exported it, and the team's note about their files.

## Originality checks

Evidence, never verdicts. Nothing is rejected automatically and no team is
told it cheated: metadata can be missing or wrong, and a false accusation
against a student costs more than a missed one.

| Check | Level | What it looks at |
| --- | --- | --- |
| Same model file as another entry | needs review | SHA-256 of the whole file (both entries get it) |
| Same geometry as another entry | needs review | same triangle count, area and size within 0.2% |
| File metadata mentions a download site | needs review | Sketchfab, Thingiverse, Printables, GrabCAD, ... in the exporter/header/comments |
| Made with an AI 3D generator, not disclosed | needs review | Meshy, Tripo, Rodin, ... named in the file while the form says no AI |
| Made with an AI 3D generator (disclosed) | info | the same, when the team said they used it |
| File dated before the theme reveal | needs review | 3MF/GLB creation date earlier than the reveal (2 h slack) |
| Exported from different software | info | exporter isn't in the team's software list (often just a conversion) |
| No process evidence | info | no sketches, CAD link or project file |

- Word lists match whole words only and are tested against near-misses
  ("Onshape" isn't "Shap-E", "tripod" isn't "Tripo").
- Judges see each check with its exact evidence. **Only organizers decide**:
  "Looks fine, clear it" or "Confirm it's a problem" (and Reopen).
- The team sees a neutral note on their edit page (never another team's name)
  and can answer in "Anything judges should know about your files?"; judges
  see that answer next to the evidence. A cleared check disappears for the team.
- The reveal time defaults to the 9:10 AM opening; change it in Settings.

## The deadline

The form shows a countdown under the header (days, then hours, minutes and
seconds; orange in the last 30 minutes, red in the last 5) that stays in view
while teams scroll. It uses the server's deadline and clock, so a moved
deadline or a laptop with the wrong time still shows the right countdown.

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
apply). Models and project files can be up to 250 MB each; model files over
100 MB skip the fingerprint and metadata checks (reading them whole could
outlast the function's 30 s). On the Hobby plan Blob has monthly limits on storage (1 GB) and
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
