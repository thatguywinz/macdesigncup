# LAUNCH.md: go-live runbook for macdesigncup.ca

The steps between "the branch is ready" and "search engines and AI answer
engines know the Mackenzie Design Cup exists". Most of it happens once, after
the first deploy of the prerendered site; section 8 repeats whenever facts
change. The SEO reasoning and the measurements behind it are in
[`seo/AUDIT.md`](seo/AUDIT.md).

Canonical origin: **https://www.macdesigncup.ca** (`SITE_URL` in
`src/config/site.ts`). Every canonical, sitemap entry, JSON-LD `@id` and
social tag points there.

The commands below are POSIX shell (macOS Terminal, Linux, or Git Bash on
Windows).

## 0. Before merging

```sh
npm ci
npx tsc --noEmit -p tsconfig.app.json
npm run lint
npm test
npm run build        # client + SSR bundle + scripts/prerender.mjs
npm run preview      # node scripts/serve-dist.mjs dist 4173 (brotli, Vercel-like 404s and headers)
```

`npm run build` fails on anything a crawler would be hurt by: a server-side
Suspense fallback, a missing asset, an `<h1>` count other than one, head tags
outside `<head>`, broken JSON-LD or a dangling `@id`, a missing FAQ answer or
address. Content problems (a banned string such as "George Brown College", a
breadcrumb that does not match the visible trail) only print under
`prerender warnings:`; the build should end with no such block. To make them
fail too, run `node scripts/prerender.mjs --strict` after the build. If it
prints `public/sitemap.xml is stale` or `public/llms.txt is stale`, run
`node scripts/prerender.mjs --write-public` and commit the result.

## 1. Deploy

- **Merging to `main` is the deploy.** Vercel's git integration builds every
  push to `main` (`vercel.json`: `npm run build`, output `dist/`). There is no
  separate deploy step.
- This machine's `vercel` CLI is logged into a different team and cannot see
  the project. To confirm a deploy, ask GitHub:
  `gh api repos/thatguywinz/macdesigncup/deployments --jq '.[0] | {id, environment, created_at}'`,
  then `gh api repos/thatguywinz/macdesigncup/deployments/<id>/statuses --jq '.[0] | {state, environment_url}'`.
- Rollback: Vercel dashboard, Deployments, pick the last good production
  deployment, **Instant Rollback**.

## 2. Domain, route and header checks (owner, Vercel dashboard + a terminal)

Run these as soon as the deploy is live. Record the results in
`seo/AUDIT.md` section 10.

1. **Vercel, Project, Settings, Domains:** `www.macdesigncup.ca` is the
   production domain and `macdesigncup.ca` redirects to it with a **308**.
   Confirm the domain is registered and its DNS points at Vercel. If www is
   not the production domain, the host switch below noindexes the live site.
2. **Redirects and the 404:**

   ```sh
   curl -sI https://macdesigncup.ca/ | grep -iE '^(HTTP|location)'
   # expect: 308, location: https://www.macdesigncup.ca/
   curl -sI https://www.macdesigncup.ca/partner/ | grep -iE '^(HTTP|location)'
   # expect: 308 to /partner (trailingSlash: false)
   curl -sI https://www.macdesigncup.ca/no-such-page | grep -iE '^HTTP'
   # expect: 404 (the prerendered 404.html, noindex). The old site answered 200 here.
   ```
3. **Every route, with and without an AI search agent's user agent.** Each
   page must return the same prerendered HTML to a browser and to
   OAI-SearchBot, with its JSON-LD and one `<h1>` in the raw response. (The
   old site also returned identical bytes to both, but they were an empty
   shell, so the JSON-LD and H1 counts are the real test.)

   ```sh
   SITE=https://www.macdesigncup.ca
   OAI='Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)'
   for p in / /register /partner /partner/register /no-such-page; do
     a=$(curl -s "$SITE$p" | cksum | cut -d' ' -f1)
     b=$(curl -s -A "$OAI" "$SITE$p" | cksum | cut -d' ' -f1)
     html=$(curl -s -A "$OAI" "$SITE$p")
     code=$(curl -s -o /dev/null -w '%{http_code}' -A "$OAI" "$SITE$p")
     printf '%-18s status=%s same=%s jsonld=%s h1=%s\n' "$p" "$code" \
       "$([ "$a" = "$b" ] && echo yes || echo NO)" \
       "$(echo "$html" | grep -c 'application/ld+json')" \
       "$(echo "$html" | grep -o '<h1' | wc -l | tr -d ' ')"
   done
   # expect: status=200 on the four pages and 404 on /no-such-page; same=yes on every line;
   # jsonld=1 and h1=1 on the four pages; jsonld=0 and h1=1 on the 404.
   ```

   The same loop on the local build (2026-09-24) gave exactly that.
4. **Headers on www:**

   ```sh
   curl -sI https://www.macdesigncup.ca/ | grep -iE '^(strict-transport-security|x-content-type-options|referrer-policy|x-frame-options|permissions-policy|content-security-policy-report-only|x-robots-tag):'
   # expect the first six and NO x-robots-tag line
   asset=$(curl -s https://www.macdesigncup.ca/ | grep -oE '/assets/index-[^"]+\.js' | head -1)
   curl -sI "https://www.macdesigncup.ca$asset" | grep -i '^cache-control'
   # expect: public, max-age=31536000, immutable
   curl -sI https://www.macdesigncup.ca/sitemap.xml | grep -iE '^(HTTP|content-type)'
   # expect: 200, application/xml (the old site served its HTML shell here)
   ```

   The CSP is report-only: it never blocks anything, and violations show only
   in the browser console. Open the live `/register` with the console open
   and check the Tally form loads with no CSP reports before ever making the
   policy enforcing.
5. **The host switch, www against a `*.vercel.app` URL.** `vercel.json` sends
   `X-Robots-Tag: noindex, nofollow` on every host except
   `www.macdesigncup.ca`, so previews never compete with the real site.

   ```sh
   curl -sI https://www.macdesigncup.ca/ | grep -i '^x-robots-tag'
   # expect: nothing
   curl -sI https://<a-deployment>.vercel.app/ | grep -iE '^(HTTP|x-robots-tag)'
   # expect: x-robots-tag: noindex, nofollow
   ```

   Take the `*.vercel.app` URL from the deployment's page in Vercel. If it
   answers **401**, Deployment Protection is on: Vercel's Standard Protection
   covers previews and the production `*.vercel.app` URLs, but not the custom
   domain. A 401 page is never indexed either, so that is fine. To see the
   header anyway, create a secret under Settings, Deployment Protection,
   **Protection Bypass for Automation**, and add
   `-H "x-vercel-protection-bypass: <secret>"` to the second `curl`.
6. **Deployment Protection:** production must be public. Protection on the
   `*.vercel.app` URLs is fine, but never on `www.macdesigncup.ca`.

## 3. Search Console and Bing Webmaster Tools (owner)

1. **Google Search Console:** add a **Domain property** for `macdesigncup.ca`
   and verify it with the DNS TXT record Google gives you (at the registrar or
   in Vercel DNS). A domain property covers www and the apex together.
2. **Sitemaps:** submit `https://www.macdesigncup.ca/sitemap.xml`. It lists
   exactly `/`, `/register` and `/partner`; `/partner/register` is noindex on
   purpose (see `src/seo/routes.ts`).
3. **URL Inspection:** inspect `/`, `/register` and `/partner`, check that the
   rendered HTML has the page text and the JSON-LD, then **Request indexing**
   for each.
4. **Bing Webmaster Tools:** **Import from Google Search Console** (fastest),
   or verify by DNS, then submit the same sitemap. Bing's index also feeds
   Copilot and DuckDuckGo, and several AI search tools draw on it.
5. A few weeks after launch, read Search Console's **Performance** report for
   the queries people actually used, and compare them with the keyword map in
   `seo/AUDIT.md` section 5. That map was chosen by intent, without volume
   data.

## 4. IndexNow (owner, after the deploy is live)

The key file ships with the site:
`public/d03270d27482f72254e59347f9da7640.txt`, served at
`https://www.macdesigncup.ca/d03270d27482f72254e59347f9da7640.txt`. It holds
exactly the key and nothing else (a test in `src/test/seo.test.ts` enforces
that). Do not rename it or add a newline.

```sh
# 1. The key file is live and exact:
curl -s https://www.macdesigncup.ca/d03270d27482f72254e59347f9da7640.txt; echo
# expect: d03270d27482f72254e59347f9da7640

# 2. Tell IndexNow (Bing, Yandex, Seznam, Naver and others share it) about the three pages:
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://api.indexnow.org/indexnow \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d '{
    "host": "www.macdesigncup.ca",
    "key": "d03270d27482f72254e59347f9da7640",
    "keyLocation": "https://www.macdesigncup.ca/d03270d27482f72254e59347f9da7640.txt",
    "urlList": [
      "https://www.macdesigncup.ca/",
      "https://www.macdesigncup.ca/register",
      "https://www.macdesigncup.ca/partner"
    ]
  }'
# expect: 200 or 202. 403 means the key file is missing or not exact; 422 means a URL is not on the host.
```

Google does not use IndexNow. For Google, use URL Inspection (section 3).

## 5. Structured data (owner or agent, on the live URLs)

1. **Rich Results Test** (search.google.com/test/rich-results) on
   `https://www.macdesigncup.ca/`. Expected: the Event and FAQ items parse
   with no errors. Honest expectations, recorded in `src/seo/jsonld.ts`: the
   FAQ rich result was retired in May 2026, and Event rich results may not
   show for an event whose participants are minors, so "valid but no rich
   result" is the likely outcome, and that is fine. The markup still tells
   Google and AI answer engines the date, times, venue, organizer and
   sponsors.
2. **Schema Markup Validator** (validator.schema.org) on `/`, `/register`
   and `/partner`: no errors. `/register` and `/partner` point `about` at the
   Home Event's `@id` (`https://www.macdesigncup.ca/#event`) by design, and
   the validator reports it as a link, not an error.
3. Record the date and result of each run in `seo/AUDIT.md` section 10.

## 6. Crawler access checks (agent, after deploy)

`robots.txt` allows everyone, but the Vercel Firewall can still block bots at
the edge. First, in **Vercel, Project, Firewall**, check that no Bot
Protection or **AI Bots** managed rule is set to deny or challenge. Then check
that each agent gets a 200 and the real page:

```sh
for ua in \
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
  "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" \
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)" \
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)" \
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ChatGPT-User/1.0; +https://openai.com/bot)" \
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)" \
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)" \
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-SearchBot/1.0; +Claude-SearchBot@anthropic.com)" \
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)" \
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)" \
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)" \
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; DuckAssistBot/1.2; +http://duckduckgo.com/duckassistbot.html)" \
  "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)" \
  "Mozilla/5.0 (compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)" \
  "CCBot/2.0 (https://commoncrawl.org/faq/)"; do
  for path in / /register /partner /robots.txt /sitemap.xml /llms.txt; do
    code=$(curl -s -o /dev/null -w '%{http_code}' -A "$ua" "https://www.macdesigncup.ca$path")
    printf '%s  %-14s %s\n' "$code" "$path" "$(echo "$ua" | grep -oE '[A-Za-z-]+[Bb]ot[A-Za-z-]*|ChatGPT-User|Claude-User|Perplexity-User|meta-externalagent' | head -1)"
  done
done
# Every line should start with 200. On a page path, also check the body is the prerendered page:
curl -s -A "GPTBot/1.2" https://www.macdesigncup.ca/ | grep -c 'application/ld+json'   # expect 1
```

Record the results table in `seo/AUDIT.md` section 10. Google-Extended and
Applebot-Extended are robots.txt tokens, not user agents, so nothing is
curled for them; the single `User-agent: * / Allow: /` group already covers
them.

## 7. Performance and social cards (agent or owner)

1. **PageSpeed Insights** (pagespeed.web.dev) for `/`, `/register` and
   `/partner`, mobile and desktop. Record performance, LCP, INP (field, once
   CrUX has data), CLS and TBT in `seo/AUDIT.md` section 10. The local lab
   medians to compare against (Lighthouse 13.5.0, simulated throttling, 3
   runs each, brotli, 2026-09-24):

   | Page | Preset | Perf | LCP | TBT | CLS |
   |---|---|---|---|---|---|
   | `/` | mobile | 90 | 3.15 s | 31 ms | 0.001 |
   | `/` | desktop | 96 | 0.66 s | 158 ms | 0.019 |
   | `/register` | mobile | 88 | 3.50 s | 0 ms | 0.010 |
   | `/partner` | mobile | 95 | 2.57 s | 0 ms | 0.000 |

   Local runs were HTTP/1.1 on one machine, so production numbers win. If
   PSI's SEO score is below 100, check first that the page has no
   `x-robots-tag` header (section 2, step 5).
2. **Social cards:** paste `https://www.macdesigncup.ca/` into the LinkedIn
   Post Inspector and the Facebook Sharing Debugger. Expect the 1200x630
   `og-image.png` card, the page title and the description from
   `src/seo/routes.ts`.

## 8. When facts change

Facts live in `src/config/site.ts`, strings in `src/content/copy.ts`, and
the head table in `src/seo/routes.ts`. After a change:

1. Bump the affected routes' dates in `CONTENT_DATES` (`src/seo/routes.ts`).
   They feed the sitemap `<lastmod>` and `WebPage.dateModified`. Only bump a
   date when the words changed, never to the build date.
2. `npm run build`, then `node scripts/prerender.mjs --write-public` if it
   says the sitemap or llms.txt is stale. Commit and merge.
3. Re-run the IndexNow POST (section 4) with the changed URLs, and request
   indexing in Search Console for them.
4. Specific cases (the open questions are listed in `seo/AUDIT.md`
   section 11):
   - **Cost announced:** state the fee basis too (per student, per school or
     per team) in the FAQ answer "What does it cost?" and the spec strip in
     `copy.ts`. Then add `offers` (price, `priceCurrency: "CAD"`,
     `availability`, `url: /register`, `validFrom`) to the Event in
     `src/seo/jsonld.ts`, and only then. Today there is no `offers` because
     the cost is not set.
   - **Registration deadline set:** add it to the FAQ and to `/register`'s
     facts line in `copy.ts`. Once `offers` exists, the same date can go in
     its `availabilityEnds`.
   - **Teachers' food confirmed:** extend the FAQ answer "Is food provided
     for students?" (or add a teacher question) in `copy.ts`.
   - **Final run-of-day published:** update `TIMES` in `site.ts`. The
     Event's `endDate` is derived from `TIMES.end`, so it follows
     automatically. If the times are final, drop the "working times" wording
     (`SECTIONS.day.note`, `SECTIONS.teachers.when`, the "What time does the
     day end?" answer).
   - **Head count or Ken's details confirmed:** "80 TDSB students" lives in
     `src/pages/partner/index.tsx` and
     `src/pages/partner/sections/WhyPartnerSection.tsx`; Ken's line is
     `ON_THE_FLOOR` in `site.ts`.
   - **Event postponed or cancelled:** set `eventStatus` to
     `EventPostponed` / `EventCancelled` (plus `previousStartDate` when
     rescheduled) instead of deleting the Event.
   - **Club social accounts confirmed** (including whether `@wlmac.3ddesign`,
     named in the partner form, is the club's): add them to `SOCIALS` in
     `site.ts` and as `sameAs` on the Organization node in
     `src/seo/jsonld.ts`.
   - **`/partner/register` endpoint proven end to end:** flip its row to
     indexable (`noindex` off, `sitemap` on) in `src/seo/routes.ts`, and
     update the two tests in `src/test/seo.test.ts` that assert it is out of
     the index.

## 9. Owner-side GEO asks (these matter most)

For event queries, Google and AI answer engines trust third-party mentions
more than the site's own words. None of these can be done from the repo:

1. **George Brown Polytechnic:** ask for the event on the Waterfront Campus
   or Limberlost Place events page, linking `https://www.macdesigncup.ca/`.
2. **startGBC:** ask for a listing or news post on its events page (it is
   already a sponsor).
3. **TDSB channels:** whatever the board and its schools use to reach
   teachers (newsletters, school announcements, department mailing lists),
   each linking `/register`, which is the page teachers need.
4. **Sponsors:** ask each sponsor to post a short "we're sponsoring the
   Mackenzie Design Cup" news item or social post that links the site
   (Shop3D.ca, Siemens, TriMech, Ansys, Stratasys, Scrimba, Aseprite, Applied
   Precision 3D, Chatforce, Agile Manufacturing).
5. **WLMAC:** a link from `wlmac.ca` (the club's school) to the site.
6. **Event listings:** Eventbrite or Luma listings with the same name, date
   and address, linking back, if the club wants them.
7. Use one name everywhere: "Mackenzie Design Cup" (with "Mac Design Cup"
   as the short form), Monday, November 16, 2026, Limberlost Place, George
   Brown Polytechnic, 185 Queens Quay East. Consistent facts across sources
   are what answer engines cite. At the baseline, "Mackenzie Design Cup"
   returned MacKenzie-Childs tableware and "Mac Design Cup" returned Apple's
   design awards, so the name needs these mentions to earn its own result.
8. **After the event:** publish the results (winners, with permission, and
   photos of real work) on this site, so the domain keeps its history for a
   2027 edition. Leave the 2026 Event in the markup as it is: schema.org has
   no "past" status, and its dates already say it happened.
