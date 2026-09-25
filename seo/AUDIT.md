# SEO and GEO audit: Mackenzie Design Cup

Site: https://www.macdesigncup.ca (not yet live on this build)
Branch: `redesign/teacher-first-seo`, audited 2026-09-24 on the build of
06:17 that morning (no source file changed between that build and the last
measurement below).
Go-live steps: [`LAUNCH.md`](../LAUNCH.md).

## 1. Where it stands

The site is a prerendered React app. Every route ships as static HTML with its
own head, a JSON-LD graph, all headings, every FAQ answer and the venue
address, so crawlers and AI agents that run no JavaScript read the whole page.
The old live site sent every crawler the same 2,494-byte shell with an empty
`<div id="root">`. The technical side is done and guarded by the build
(`scripts/prerender.mjs` fails on anything a crawler would be hurt by) and by
`src/test/seo.test.ts` (29 of 29 SEO tests pass on this tree).

Lighthouse medians on this build: Home 90 on mobile and 96 on desktop,
`/register` 88 and `/partner` 95 on mobile, with 100 for accessibility, best
practices and SEO on every measured page (section 3). The old live site
scored 30 on mobile and 68 on desktop.

What code cannot do is make other sites mention the event. At the baseline
the site was not found for any of five test queries, including its own name
(section 4). For a one-day event, third-party listings and links (George
Brown Polytechnic, startGBC, TDSB channels, sponsors) are what search and
answer engines trust most. Those are owner asks: `LAUNCH.md` section 9,
and the growth list in section 12 here.

## 2. Method

- **Build:** the production build in `dist/` (`npm run build`: `vite build`,
  `vite build --ssr src/entry-server.tsx`, `node scripts/prerender.mjs`),
  built 2026-09-24 06:17. For Lighthouse it was copied to a snapshot so no
  other rebuild could land mid-run; the snapshot's files were hashed and
  still matched `dist/` after the last run.
- **Servers.** Lighthouse ran against `tmp/__perf_serve.mjs`: static files
  with brotli, like Vercel, and no `X-Robots-Tag`, like the www host. The
  head, status and header checks used `scripts/serve-dist.mjs`, which
  mirrors `vercel.json` (directory index, `cleanUrls`, `trailingSlash:
  false`, `404.html` with HTTP 404, all headers including the host switch).
  Both are HTTP/1.1 on one machine, so the numbers are indicative, and
  PageSpeed Insights on the live URL wins (`LAUNCH.md` section 7).
- **Lighthouse 13.5.0** CLI, headless Chrome, default simulated throttling
  (mobile: slow 4G, 150 ms RTT, 1.6 Mbps, 4x CPU; desktop: `--preset=desktop`),
  all four categories. Three runs each of Home mobile, Home desktop,
  `/register` mobile and `/partner` mobile, interleaved by round so any drift
  in machine load spreads across all four. Each metric is the median of its
  own three values. Raw JSON is in the session scratchpad, `perf-final/`.
- **Raw HTML:** `curl` of every route with a browser user agent and with
  OAI-SearchBot's, compared by hash; heads, H1s and JSON-LD parsed from the
  served files; every FAQ answer searched for in the visible HTML.
- **Old live site:** the baseline captured 2026-09-23 (screenshots, curl,
  Lighthouse 13.5.0 against the live URL; PSI's keyless quota was exhausted
  that day, so there is no PSI or field data), re-checked by `curl` on
  2026-09-24: still the same shell, same headers.
- **Structured data:** the prerender's graph checks, the unit tests, and a
  read of the served JSON-LD. The live validators come after launch
  (section 10).

## 3. Scores (local, this build)

### By category

| Category | Score | Method | How much it proves |
|---|---|---|---|
| Performance | 90 mobile, 96 desktop (Home) | Lighthouse, simulated throttling, median of 3 | Lab only. Good for direction; PSI and field data after launch decide |
| Accessibility | 100 on all four configs | Lighthouse (axe-core rules) | Automated rules catch only part of real accessibility. Earlier passes also scripted keyboard focus, reduced motion and overflow checks (`tmp/__a11y_*`, `tmp/__final_focus*`); this pass did not re-run them |
| Best practices | 100 on all four configs | Lighthouse | No console errors, no deprecated APIs, correct image aspect ratios. Says little about SEO |
| SEO (Lighthouse) | 100 on all four configs | Lighthouse, on the server with no `X-Robots-Tag` | Weak: the old empty-shell site also scored 100 (the audit runs on the JS-rendered DOM and does not check raw HTML, JSON-LD or soft 404s) |
| SEO (crawler view) | Pass on every route | `curl` with and without OAI-SearchBot, head and JSON-LD parse, 29 SEO unit tests, prerender checks | The strongest evidence here: this is what crawlers and AI agents actually receive |

On `scripts/serve-dist.mjs` the Lighthouse SEO score is **69**, by design:
the host switch in `vercel.json` sends `X-Robots-Tag: noindex, nofollow` to
every host except `www.macdesigncup.ca`, localhost included, and
`is-crawlable` is the only failing audit (confirmed with an SEO-only run,
`perf-final/seo-only-8410-home.json`). The brotli server sends no such header,
which is what www will do, so it scores 100.

### By page (medians of 3 runs)

| Page | Preset | Perf (runs) | A11y | Best pr. | SEO | FCP | LCP | TBT | CLS | Speed Index | Transfer |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | mobile | **90** (87, 91, 90) | 100 | 100 | 100 | 2.37 s | 3.15 s | 31 ms | 0.001 | 2.41 s | 452 KiB |
| `/` | desktop | **96** (97, 94, 96) | 100 | 100 | 100 | 0.49 s | 0.66 s | 158 ms | 0.019 | 0.81 s | 658 KiB |
| `/register` | mobile | **88** (88, 89, 88) | 100 | 100 | 100 | 2.25 s | 3.50 s | 0 ms | 0.010 | 2.25 s | 1,082 KiB* |
| `/partner` | mobile | **95** (94, 95, 95) | 100 | 100 | 100 | 2.26 s | 2.57 s | 0 ms | 0.000 | 2.26 s | 371 KiB |

\* 718 KiB of `/register` is the Tally form's own iframe (651 KiB of it
script from `tally.so` and `api.tally.so`, plus a Sentry error-reporting
call made from inside the iframe). The page itself is 363 KiB.

LCP elements: the H1 ("Design Cup" line) on Home, both presets; the intro
sentence on `/register`; the lede on `/partner`. All text, no images.

Compressed sizes on the brotli server: Home HTML 324,148 B raw, 34,766 B br;
main chunk 52,953 B br; vendor 82,928 B br; CSS 14,775 B br; the WebGL hall
(`GalleryScene`) 959,415 B raw, 211,056 B br, desktop only.

What still costs points:

- **Mobile LCP (Home 3.15 s, `/register` 3.50 s)** sits above the 2.5 s
  "good" line. The main thread is nearly idle (TBT 31 ms); the wait is the
  render-blocking stylesheet (15 KB br, Lighthouse estimates about 750 ms)
  and four web fonts (86 KiB) ahead of the H1. Levers: inline the first
  screen's CSS, preload the Anton file the H1 uses.
- **Desktop Home TBT (158 ms):** the WebGL hall spends about 1.27 s
  scripting at desktop CPU speed. It loads after `load` and an idle moment
  behind the CSS poster, so it does not delay LCP.
- **Desktop Home CLS (0.019):** the poster's door (`.hall-door`) moves once
  when the camera maths places it. Well under the 0.1 threshold.
- **Variance:** the first mobile Home run had a Speed Index of 5.0 s against
  2.3 and 2.4 s for the other two. The median ignores it; PSI will show
  whether it is real.

## 4. Before and after

Old live site: baseline 2026-09-23, re-checked by `curl` 2026-09-24 (deploy
of 2026-09-16, bundle `index-CdKXxcvF.js`). This build: local, section 2.

| Check | Old live site | This build |
|---|---|---|
| Raw HTML (JS off) | 2,494-byte shell, empty `#root`, 0 H1, no body text, identical on every path | Every route prerendered. Home: 324,148 B (34,766 B br), 1 H1, 7 H2, all 16 FAQ answers, the full address. `/register` 41,946 B, `/partner` 56,268 B |
| OAI-SearchBot | Same 2,494-byte shell | Byte-identical to what a browser gets, on every route |
| `<title>` | One 70-char title on every route | Five unique titles, 38 to 64 chars (section 5) |
| Meta description | One 342-char description on every route, saying "George Brown College" | Unique per route, 150 to 161 chars |
| Canonical | None | Absolute on `/`, `/register`, `/partner`; none on noindex routes |
| JSON-LD | None | One `@graph` per real page: Organization, HighSchool, WebSite, WebPage everywhere; Event, CollegeOrUniversity, FAQPage on Home; BreadcrumbList on the inner pages |
| Social tags | `og:title` and description only; no `og:image`, no `og:url` | `og:*` and `twitter:*` with a 1200x630 card on every real page |
| `<html lang>` | `en` | `en-CA` |
| `sitemap.xml` | Missing: HTTP 200 with the HTML shell | 3 URLs, `application/xml`, real `lastmod` |
| `robots.txt` | Five groups, all `Allow: /`, no `Sitemap:` line | One `User-agent: *` / `Allow: /` group plus the sitemap |
| `llms.txt` | Missing (HTML shell) | Present, indexable pages and the FAQ answers |
| Unknown URL | HTTP 200 with the shell (soft 404) | HTTP 404, prerendered `404.html`, noindex |
| Headers | HSTS only (Vercel's default) | Adds `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, CSP (report-only), and the `X-Robots-Tag` host switch |
| Venue facts | "George Brown College"; "51 Dockside Drive" on `/partner` | George Brown Polytechnic, Limberlost Place, 185 Queens Quay East everywhere; the prerender warns on "George Brown College" (and fails with `--strict`) |
| Lighthouse, Home mobile | Perf 30, LCP 7.1 s, TBT 4,160 ms | Perf 90, LCP 3.15 s, TBT 31 ms |
| Lighthouse, Home desktop | Perf 68, LCP 1.2 s, TBT 620 ms | Perf 96, LCP 0.66 s, TBT 158 ms |
| Lighthouse a11y / BP / SEO | 100 / 100 / 100 (the SEO 100 was shallow, section 3) | 100 / 100 / 100 on every measured page |
| Search presence | Not found for "Mackenzie Design Cup", "Mac Design Cup 2026", "macdesigncup" or two generic queries; a `site:` search found nothing | Unknown until launch. Measure in Search Console |

The Lighthouse rows are not like for like: the old numbers came from the
live Vercel URL over the internet, the new ones from a local server. Same
Lighthouse version and throttling, so the direction is solid; the exact gap
is approximate until PSI runs on the live URL.

## 5. Keyword, title and description map

One primary query per route, none used twice (the table lives in
`src/seo/routes.ts`; every fact in it is interpolated from
`src/config/site.ts`). Titles and descriptions below are copied from the
served HTML. The queries are chosen by intent: no keyword-volume tool was
available, so check them against Search Console's real queries a few weeks
after launch.

| Route | Primary query | `<title>` (chars) | Description (chars) | H1 | Robots |
|---|---|---|---|---|---|
| `/` | Mackenzie Design Cup; 3D design competition for high school students in Toronto | Mackenzie Design Cup · Toronto High School 3D Design Competition (64) | $10,000+ in prizes: our one-day 3D design competition for TDSB high school students and their teachers is Monday, November 16, 2026, at George Brown Polytechnic. (161) | Mackenzie Design Cup | index, follow, max-image-preview:large |
| `/register` | Mackenzie Design Cup registration | Mackenzie Design Cup Registration for Students and Teachers (59) | Teachers, register your whole group on one form. Students, sign yourself up, then bring a teacher from your school with you on Monday, November 16, 2026. (153) | Claim your spot. | index, follow, max-image-preview:large |
| `/partner` | sponsor a student design competition Toronto | Sponsor a Student 3D Design Competition in Toronto (50) | Put your company in front of TDSB students who design in 3D. We need sponsors, mentors, judges and speakers for Monday, November 16, 2026, in Toronto. (150) | Back the next build. | index, follow, max-image-preview:large |
| `/partner/register` | none (unlinked form page) | Partner Registration Form for the Mac Design Cup 2026 (53) | Tell us how your organization wants to back the Mac Design Cup on November 16, 2026: as a sponsor, mentor, judge, speaker or exhibitor. One form covers it. (155) | Partner Registration Form | noindex, follow |
| 404 | none | Sheet not found · Mackenzie Design Cup (38) | This sheet isn't in the drawing set. (36) | 404 | noindex, follow |

The Home description now leads with the prize, because a phone results page
cuts the snippet near 120 characters: the prize comes first and the date
starts at character 107. At 161 characters, the venue name at the end
(from character 136) is the part a desktop snippet may cut.

Secondary terms the Home page already carries in plain copy (headings, the
spec strip, FAQ answers): "Mac Design Cup" (the WebSite and Event
`alternateName`), "Mackenzie Design Cup 2026", "TDSB 3D design competition",
"grades 9 to 12", "Limberlost Place, George Brown Polytechnic, 185 Queens
Quay East", "register students" (teacher intent), "Snapmaker J1S 3D
printer".

`/partner/register` stays noindex until its form endpoint
(`api/partner-register.ts`, which needs Google Sheets credentials) is proven
end to end; partners reach the Tally form from `/partner` meanwhile.

## 6. Structured data

One `@graph` per page, generated from `site.ts`, `copy.ts` and
`sponsors.ts`, so the markup and the visible page read the same constants.

| Node | `@id` | On |
|---|---|---|
| Organization (the club: name, url, email, logo) | `/#organization` | every page |
| HighSchool (William Lyon Mackenzie Collegiate Institute: the club's parent and a sponsor) | `/#wlmac` | every page |
| WebSite (`inLanguage: en-CA`) | `/#website` | every page |
| WebPage (`dateModified`, breadcrumb; `about` the Event on `/`, `/register`, `/partner`) | `<url>#webpage` | every page |
| BreadcrumbList (matches the visible trail) | `<url>#breadcrumb` | `/register`, `/partner`, `/partner/register` |
| Event (dates, venue, organizer, 13 sponsors, student + teacher audiences) | `/#event` | `/` |
| Place (Limberlost Place, full PostalAddress, map; nested in the Event's `location`) | `/#venue` | `/` |
| CollegeOrUniversity (George Brown Polytechnic: contains the venue and is a sponsor) | `/#george-brown` | `/` |
| FAQPage (16 questions, answers character-identical to the page) | `/#faq` | `/` |

Served values checked on this build: `startDate 2026-11-16T08:00:00-05:00`,
`endDate 2026-11-16T16:00:00-05:00` (derived from `TIMES.end`, the working
end time), location "Limberlost Place, George Brown Polytechnic", 13
sponsors, and all 16 FAQ answers found word for word in the visible HTML.

Design choices:

- **One node per institution.** George Brown Polytechnic and WLMAC are each
  defined once under a stable `@id`, and `sponsor`, `containedInPlace` and
  `parentOrganization` all point at it.
- **`/register` and `/partner`** say `about: {"@id": "https://www.macdesigncup.ca/#event"}`.
  The Event is not copied onto them, since a partial second Event would look
  like broken markup. The build's graph check allows exactly this cross-page
  reference (`CROSS_PAGE_REFS`) and still requires Home to define it.

Honest labels (also in the `src/seo/jsonld.ts` header):

- **FAQ rich result:** retired by Google in May 2026. The FAQPage stays
  because it is true and answer engines read it.
- **Event rich result:** eligibility is uncertain for an event whose
  participants are minors who register through their schools. Expect a
  valid Event with no rich result.
- **No `offers`:** the cost is not announced. Add it when it is
  (`LAUNCH.md` section 8).
- **No `Organization.sameAs`:** the club has no confirmed public social
  accounts (`SOCIALS` TODO in `site.ts`; see the handle question in
  section 11).
- **`llms.txt`:** low value. No major engine has said it reads the file.
  It stays because it costs nothing, is generated from the same strings as
  the FAQ, and lists only the indexable pages.

## 7. Crawl and index

- `robots.txt`: one `User-agent: *` / `Allow: /` group plus the sitemap. No
  AI crawler is blocked, which suits an event that wants to be found.
- `sitemap.xml`: exactly `/`, `/register` and `/partner`, with `<lastmod>`
  2026-09-24 from `CONTENT_DATES` (content changes only), and no priority or
  changefreq.
- Canonicals are absolute on indexable routes; noindex routes carry none.
  Trailing slashes 308 away (`/partner/` to `/partner`), and unknown paths
  return the prerendered `404.html` with a real 404.
- Host switch: `X-Robots-Tag: noindex, nofollow` on every host but www.
  Checked locally: present for `localhost` and for a `*.vercel.app` Host
  header, absent for `Host: www.macdesigncup.ca`.
- IndexNow key: `public/d03270d27482f72254e59347f9da7640.txt`, served as
  `text/plain` (the POST is an owner step after launch, `LAUNCH.md`
  section 4).
- Social: `og:*` and `twitter:*` on every real page, with a 1200x630 card
  rendered from the brand (`scripts/og/`).

## 8. Fixed

### In the SEO pass

| ID | Fix | Evidence |
|---|---|---|
| SEO-02 | Event `endDate` from `TIMES.end` | served JSON-LD: `startDate 2026-11-16T08:00:00-05:00`, `endDate 2026-11-16T16:00:00-05:00` |
| SEO-03 | Lion image preloads removed from every page. `LionMark` paints a 7.5 KB still and fetches the 110 KB 128 px nod after load | Only the 7.5 KB still loads before LCP. Before: a 234 KB webp preloaded ahead of the CSS |
| SEO-07 | This file, `LAUNCH.md`, the IndexNow key file | |
| SEO-09 | One node per institution; `about` on `/register` and `/partner` | section 6 |
| A11Y-12 | Deep links jump instead of smooth-scrolling the whole page on arrival; in-page links stay smooth after the first input | `/#faq`, `/#register`, `/#timeline` and two FAQ items at 1440 and 390: 0 intermediate frames, target at top = 88 px |
| PERF-05 | Unused react-query, Sonner, Radix Toast and Tooltip providers removed from the app shell | Main chunk 381,096 B to 186,466 B min at the time (now 194,026 B min, 52,953 B br) |
| PERF-07 | Partner pages and react-hook-form split out; prerendered partner pages modulepreload their chunk and hydrate with it in hand | Home and `/register` fetch no partner chunk (confirmed again in this pass's network logs) |
| PERF-12 | `serve-dist.mjs` negotiates brotli or gzip with `Vary` and `Content-Length` | Home HTML 324,148 B to 34,766 B br |

### Since the SEO pass (checked in this final pass)

| Fix | Evidence |
|---|---|
| Phones never download three.js. Below 768 px wide or 500 px tall the hero stays a CSS hall; the 3D scene loads only on the stage layout, after `load` and an idle moment | Mobile Home requests only the main and vendor chunks; TBT median 31 ms (1.5 to 1.9 s in the SEO pass, 4,160 ms on the old site); mobile transfer 452 KiB (was 642 KiB) |
| The decorative sheet labels ("SHEET 02 / 06 · PRIZES · 1:1") are drawn by CSS from `data-label`, so they are out of the page text and the contrast audit | Desktop accessibility 100 (was 96); `color-contrast` passes with no items |
| Home description leads with the prize pool | section 5 |
| WebGL hall chunk slimmer | 1,017,395 B to 959,415 B min; 227,732 B to 211,056 B br |

Cleared in the final cleanup pass: the dead code left after PERF-05 (the
`src/components/ui/*` files, `use-toast` hooks and their packages) is
deleted; `public/lion/lion-mark.webp` (234 KB, unreferenced) moved to
`lion3d/lion-mark-source.webp` so it no longer deploys; `EVENT_END_DATE` is
gone from `site.ts`, and the Event `endDate` now comes from `TIMES.end`.

## 9. Crawler view, checked locally

| Path | Browser UA vs OAI-SearchBot | Status | JSON-LD blocks | H1 |
|---|---|---|---|---|
| `/` | identical bytes | 200 | 1 | 1 |
| `/register` | identical bytes | 200 | 1 | 1 |
| `/partner` | identical bytes | 200 | 1 | 1 |
| `/partner/register` | identical bytes | 200 (noindex meta) | 1 | 1 |
| `/no-such-page` | identical bytes | 404 | 0 | 1 |

Repeat on the live domain with every AI agent in `LAUNCH.md` section 6: the
Vercel Firewall can block bots that a local server never sees.

## 10. Live checks (fill in after launch)

Blank until run on the real domain. Never fill these from local numbers.

| Check | Date | Result |
|---|---|---|
| Apex 308 to www; www 200 with no X-Robots-Tag; preview host noindex | | |
| Security headers on www | | |
| Search Console domain property verified; sitemap submitted; 3 URLs inspected | | |
| Bing Webmaster verified; sitemap submitted | | |
| IndexNow key file live; POST status | | |
| Rich Results Test `/` | | |
| validator.schema.org `/`, `/register`, `/partner` | | |
| Crawler 200 checks (`LAUNCH.md` section 6), Vercel Firewall AI-bot rule state | | |
| PSI mobile / desktop: `/`, `/register`, `/partner` | | |
| Social card previews (LinkedIn, Facebook) | | |

## 11. Outstanding

### Owner asks (facts only the club can supply)

Each one is either shown today with a TODO in the code, or left off the site
until it is known. Nothing here was guessed.

1. **Tally form colours and branding.** The embedded form still uses Tally's
   default violet Submit button. In Tally's Design settings: button ember
   `#FF7214` with dark text `#090A0C`, text bone `#E9E1CE`, font Archivo
   (free in Tally). Keep `transparentBackground=1` in the embed URL. Removing
   "Made with Tally" needs Tally Pro; the site must not hide it. (TODO in
   `src/pages/Register.tsx`.)
2. **"80 TDSB students"** on `/partner` (the Audience highlight and the
   facts strip). Confirm the expected head count or it comes off. (TODOs in
   `src/pages/partner/index.tsx` and
   `src/pages/partner/sections/WhyPartnerSection.tsx`.)
3. **The `@wlmac.3ddesign` handle** in the partner form's media permission
   line (`src/pages/partner/components/PartnerForm.tsx`). Confirm it is the
   club's real account. If it is, send its URL (and any LinkedIn) so it goes
   into `SOCIALS` and the Organization's `sameAs`.
4. **Ken's surname and role** for "A talk from Ken" (Shop3D.ca) in the
   prize table (TODO in `src/config/site.ts`, `ON_THE_FLOOR`).
5. **Are the working times final?** 9:00 opening, design sessions 9:30 to
   2:30, judging 2:30, awards 3:30, end 4:00 (`TIMES` in `site.ts`). The page
   labels them working times and the Event's `endDate` follows `TIMES.end`.
   Once final, the "working times" notes can go.
6. **Are teachers fed?** The site says every student competing gets food
   all day from George Brown Polytechnic, and says nothing about teachers.
   Teachers will ask; one FAQ line answers it once known.
7. **Registration deadline.** None is published anywhere; the site says
   "Registration open · Limited spots". A date teachers can plan around goes
   in the FAQ and on `/register`, and later in the Event's `offers`.
8. **Fee basis.** The FAQ says the cost "will be free or a small fee". Per
   student, per school, or per team? Teachers need it for approval, and
   `offers` needs it too.
9. **`/partner/register`:** verify `api/partner-register.ts` (Google Sheets
   environment variables on Vercel) end to end, or delete the route. Until
   then it stays noindex.

Owner SEO steps: everything in `LAUNCH.md` sections 2 to 7, then the GEO
asks in section 9.

### Code, outside SEO

- Mobile LCP on Home and `/register` (section 3): critical CSS and an H1
  font preload.
- Desktop WebGL hall scripting, TBT 158 ms (section 3).

## 12. Growth recommendations

Impact labels are judgement, not measurement: nothing here has search
volume data behind it. High = likely to change whether teachers and answer
engines find the event this season; Low = worth doing only if time allows.

| Impact | Recommendation | Why |
|---|---|---|
| High | Verify Search Console and Bing, submit the sitemap, request indexing for the three pages (`LAUNCH.md` sections 3 and 4) | At the baseline the site was not in the index at all |
| High | Get the event listed on George Brown Polytechnic's and startGBC's event pages, linking `https://www.macdesigncup.ca/` | Venue and sponsor pages are the third-party sources answer engines cite, and they tie the name to the right place |
| High | Reach teachers through TDSB channels (board and school newsletters, department lists), each linking `/register` | Teachers are the ones who register groups, and they hear about events through the board, not through search |
| High | Win the brand query: use exactly "Mackenzie Design Cup" (short form "Mac Design Cup") with the same date and address everywhere | At the baseline "Mackenzie Design Cup" returned MacKenzie-Childs tableware and "Mac Design Cup" returned Apple's design awards. Consistent mentions are how the name gets its own result |
| Medium | Ask each of the 13 sponsors for a short post or news item linking the site | Relevant links from real organizations, and a reason for their audiences to share |
| Medium | Confirm the club's social accounts and add them as `sameAs` | Helps search engines tell the club apart from unrelated "Mackenzie" and "Mac Design" brands |
| Medium | Publish the cost, fee basis and registration deadline as soon as they are set, then add `offers` | Specific, quotable answers are what teachers search for and what answer engines lift into replies |
| Medium | After November 16, publish the results (winners, with permission, and photos of real work) on the same site | Keeps the domain's history for a 2027 edition instead of starting over |
| Low | Speed up mobile LCP (critical CSS, font preload) | Better for phones on slow networks; the ranking effect for a site this small is minor |
| Low | Chase generic queries such as "high school 3D design competition Toronto" | Established programs held them at the baseline (U of T's high school design competition, Skills Ontario); only links move them, not page changes |
| Low | Eventbrite or Luma listings | Only if the club wants them; they duplicate the site and must match its facts exactly |
