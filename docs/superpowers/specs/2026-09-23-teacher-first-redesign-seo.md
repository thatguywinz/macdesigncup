# MDC 2026 · Teacher-first redesign, drafting-hall visuals, production SEO

Branch: `redesign/teacher-first-seo`. **Never push, never deploy, never touch `main`, never commit** (the user publishes later; pushing `main` IS the Vercel deploy). Other people's untracked files (`List of Changes for Website.pdf`, `tmp/`) are left alone; put throwaway scripts in `tmp/` (Node resolves `@playwright/test` only from inside the repo).

## 1. What the user asked for (verbatim intent)
1. Everywhere says **George Brown Polytechnic**, never "George Brown College".
2. **Teacher-centric as well as student-centric.** Every Register button says teachers are welcome to sign up their students, and students may sign themselves up but need a supporting teacher from their school who comes with them. (The live Tally form already branches Student / Teacher; no form changes needed.)
3. **Reduce the slop and the clutter** across the whole site.
4. **Hero:** replace the spiral sculptures (torus knots) with **sponsor logos**; remove the hero badges and keep only "$10,000+ in prizes" + "1st place takes home …"; make the **Enter button** more pristine, clearer and easier.
5. Real address: **Limberlost Place, 185 Queens Quay East**. Date is **Monday, November 16, 2026**.
6. After entering, it is "text, text, text" and too much scrolling. Add **visuals**, make the **nav more prominent** (which sections exist, where you are), move **sponsors earlier**, add **scroll animations** and other motion, and **3D-design elements**: sketch-looking drawings and lines in the background so it feels like a 3D design competition.
7. Add the **startGBC** logo (done: `src/components/sponsor-images/startgbc.svg`, in `src/config/sponsors.ts`).
8. Run the `website-production` skill adapted to a competition site: full SEO + GEO so it ranks, is citable, and feels great.

## 2. Binding constraints
- **Visual direction stays:** dark concrete gallery, bone-cream Anton display type, Space Mono labels, molten ember orange, electric-blue neon accents. We *extend* it into a **drafting hall** (see §4). No new palette, no gradients on buttons, no rounded-lg shadow-md cards, no emoji, no three identical feature cards, max two button styles (`btn-portal` solid, `btn-ghost` outline).
- **No em dashes in any visible string** (comments are fine). `copy.md` rules in `src/content/copy.ts` header bind every new string. Use strings from `src/content/copy.ts` and facts from `src/config/site.ts`; add new strings to copy.ts rather than inline JSX when they are headings, CTAs, FAQ, or facts.
- **Truthfulness:** no invented facts, times, counts, directions, prices, quotes, awards. Blank beats fake. Cost is TBA; teams TBD; exact clock times except doors 8:00 AM are not announced; no transit directions unless from an official George Brown page.
- **Motion:** honor `prefers-reduced-motion` (framer `MotionConfig reducedMotion="user"` at the root plus explicit static fallbacks for scroll-scrubbed pieces). **No pinning / horizontal scroll below 768px.**
- **SSR/hydration-safe code everywhere** (the site is now prerendered, §7): no `window`/`document`/`matchMedia`/`localStorage`/`Date.now()`/`Math.random()` during render. Read them in effects. First client render must equal the server render; use `useHydrated()` for anything that must differ.
- Performance: transforms/opacity only for animation; per-frame work writes to the DOM through refs/motion values, never React state per frame; decorative SVG is cheap; the WebGL hero stops rendering when off-screen.

## 3. Facts (the only facts allowed)
All in `src/config/site.ts` with sources in comments: SITE_URL `https://www.macdesigncup.ca`; event Mon Nov 16 2026, doors 8:00 AM (-05:00); venue Limberlost Place, George Brown Polytechnic, 185 Queens Quay East, Toronto, ON M5A 1B6, Waterfront Campus; audience TDSB high school students grades 9 to 12, each with a teacher from their school; prizes (`PRIZE_POOL`, `GRAND_PRIZE*`, `PRIZE_EXTRAS`, `EVERY_BUILDER`, `ON_THE_FLOOR`; Siemens/TriMech software value never published); contact `CONTACT_EMAIL`; sponsors `src/config/sponsors.ts` (13, incl. startGBC; `hero: true` marks the 8 shown in the 3D hall). Registration CTAs go to `/register` (`REGISTER_PATH`), which embeds the Tally form.

## 4. Design language additions: "the drafting hall"
The gallery's walls now carry technical drawings. A CAD/blueprint layer sits behind content: faint drafting grid, construction lines, dimension callouts, crop/registration marks, sheet title labels, and wireframe solids drawn in 1px bone lines at low opacity with sparing ember accents. Lines **draw themselves** as you scroll. It must stay quiet: decoration at roughly 6 to 16% opacity, one wireframe object per section at most, fewer and smaller on phones. The user complained about clutter; decoration never competes with content.

Shared primitives (built in the Foundation phase, in `src/components/blueprint/` and `src/components/motion/`; APIs below are the contract other agents code against):
- `<BlueprintBackdrop />`: fixed, full-viewport, `aria-hidden`, `pointer-events-none`, behind all content (below `main`). Two-level drafting grid (minor ~8px, major ~64px) in bone at ~2 to 5% opacity, faded by a radial mask, drifting with slight parallax on scroll. Renders nothing heavy.
- `<Sheet id eyebrow sheetNo title className children>`: the section shell. Renders `<section id>` with consistent padding (`py-12 md:py-16 xl:py-20`, see §9.3), corner crop marks, a desktop-only left ruler with ticks, a top-right mono sheet label (`SHEET 02 / 06 · PRIZES · 1:1`, aria-hidden), and the section eyebrow with an ember rule that draws in on view.
- `<DisplayHeading as="h2" lines={[...]} outline="word" />`: Anton display heading; each line masked and slides up on view; the `outline` substring renders as `.wire-text`. Class `display-scene` sizing by default, prop for `display-hero`.
- `<Reveal delay y as>`: fade/rise on view, once. Adds `data-reveal` so a `<noscript>` rule can force it visible.
- `<DrawPath d progress|inView pathLength strokeWidth className />` + `useSectionProgress(ref, offset)` returning a framer `MotionValue<number>` 0..1: SVG strokes that draw with scroll progress (or once in view). Reduced motion: fully drawn.
- `<WireSolid shape="cube|octahedron|icosahedron|cylinder|cone|prism" size spin="scroll|time|both" className />`: an SVG wireframe solid projected in JS, rotation driven by scroll (and a slow idle drift), writing the path `d` via refs, never React state per frame. Desktop decoration; hidden below `md` unless explicitly asked.
- `<Dimension orientation length label />`: CAD dimension line with end ticks and a centred mono label (e.g. `Ø 64`, `1:1`, `420`), decorative.
- `<RegisterBlock align variant />`: the primary Register button (`CTA.register`, to `/register`) plus the two-line WHO_REGISTERS note (Teachers · …, Students · …) with lucide icons (`Users`, `User`, strokeWidth 1.5, 16px). Used by Glance, Teachers, final CTA. The mobile sticky bar uses the button plus two short lines, "Teachers sign up students" / "Students bring a teacher" (`MOBILE_BAR.lines`), which also describe the button.
- `useHydrated()` hook; `useInViewOnce` if needed.
- Fonts: **self-host** via `@fontsource`: Anton 400, Space Mono 400/700, and replace Inter with **Archivo** (variable, 300 to 600) as the body face (CLAUDE.md bans Inter). Remove the Google Fonts `@import`.

## 5. Page architecture (home, in order)
Nav is fixed and visible from the first frame, over the hero too.

| # | id | Section | Owner |
|---|---|---|---|
| 0 | `top` | **Hero**: 3D hall, scroll-driven entry | Hero |
| 1 | `glance` | **At a glance**: statement, countdown, spec strip, RegisterBlock | Sections-A |
| 2 | `prizes` | **Prizes**: $10,000+, 1st-place printer drawing, the table | Sections-A |
| 3 | `sponsors` | **Sponsors**: logo grid + partner slot | Sections-A |
| 4 | `day` | **The day**: scrollytelling timeline + what to bring | Sections-B |
| 5 | `teachers` | **For teachers**: steps, what students leave with, form-sheet visual, RegisterBlock | Sections-B |
| 6 | `faq` | **FAQ**: filter All / Students / Teachers, native `<details>` | Chrome |
| 7 | `register` | **Final CTA** | Chrome |
| - | footer | Titleblock footer with `<address>` | Chrome |

Legacy anchors: `#why` and `#timeline` alias to `#day` (empty `<span id>` anchors inside the day sheet); `#register` stays on the final CTA.

### 5.0 Hero (`src/components/hero/*`)
- No more scroll lock and no gate state. The hero is the first section of a normally scrolling page. The site's content is always in the DOM (SEO, no-JS, deep links).
- **Desktop (≥768px, motion OK): scroll-driven entry.** Section is ~200svh with a sticky 100svh stage. Scroll progress 0 to 1 dollies the camera up the runway and through the portal; the overlay copy fades out early (by ~0.3); an ember flood rises near the end so the next section starts out of the portal's light. Scrolling back reverses it cleanly. Pass progress into the canvas via a ref or motion value read in `useFrame`, never via React state per frame.
- **Mobile or reduced motion:** a plain 100svh hero (CSS-only switch via `md:` and `motion-reduce:` so SSR matches), no dolly.
- **Enter button:** one line, `CTA.enter` with a down arrow, a crisp high-contrast slab at the door (no three-line stack, no flicker, at most one slow ring), 44px+ tap target, a legible `or scroll` chip below it. Clicking smooth-scrolls to `#glance` (on desktop this plays the dolly because the dolly is scroll-driven).
- **Sponsor logos replace every torus knot**, including the giant upper-right knot and its shards. The `HERO_SPONSORS` (8) stand on the pedestals as lit logo plaques: thin dark slabs or floating cut-outs with the logo knocked out in bone (canvas `source-in` knockout from the image alpha, like the CSS filter), gently bobbing, facing the camera enough to read. Phones show fewer. The spot the giant knot occupied may take a large **wireframe (line-drawn) 3D printer** as the hall's centrepiece object, drawn with edges/lines in bone and ember: the 1st-place prize as a blueprint hologram. Stylised, never presented as a product photo.
- Overlay copy: `HERO.eyebrow` (short form on phones), `<h1>` Mackenzie / Design Cup (the page's only H1), `HERO.deck`, `HERO.prize`. Delete the placard badge and the "Est. 2026 / gate locked" corner label. Keep the subtle type parallax.
- WebGL stops rendering (frameloop `never`/`demand`) when the hero is off-screen. The server render outputs a static poster (dark hall + CSS portal glow + the overlay copy) so the prerendered page is complete without WebGL.
- Verify across aspect ratios (21:9, 16:9, 16:10, 3:2, 4:3, 5:4, portrait) with a **fresh browser per viewport** and `headless: false` for small/portrait (headless WebGL goes black otherwise; see memory `mdc-hero-visual-verification`).

### 5.1 At a glance (`GlanceSection`)
`SECTIONS.glance` heading + body, the existing `Countdown` (restyled into the drafting language, SSR-safe: renders dashes until mounted), and a **spec strip** of four cells, each with a small line-drawn glyph that draws in: When (Mon, Nov 16, 2026 · Doors open 8:00 AM), Where (Limberlost Place · George Brown Polytechnic, 185 Queens Quay East, with a `Map ↗` link to `VENUE_MAP_URL`), Who (TDSB students, grades 9 to 12 · each with a teacher from their school), Cost (To be announced · registered schools hear first). Then `RegisterBlock`. Short: this section fits roughly one viewport on desktop.

### 5.2 Prizes (`PrizesSection`)
Heading `$10,000+ / in prizes.` with the figure counting up once in view (SSR renders the final figure; reduced motion shows it static). Visual anchor: a large **isometric line drawing of a desktop 3D printer** (generic, stylised: frame, bed, gantry, dual toolheads, spool) that draws itself with scroll, with one ember CAD dimension over it, `1st place` (`SECTIONS.prizes.callouts`, shown from `xl`; below `xl` the legend's `1st place` eyebrow carries it). The printer's name, value and spools live only in the legend beside it. Then the three compact groups (Also up for grabs / Every builder gets / On the floor) as tight lists with sponsor credits in mono. Phones: printer drawing smaller above, lists stacked; nothing duplicated.

### 5.3 Sponsors (`SponsorsSection`)
Heading from `SECTIONS.sponsors` (`{n}` = `SPONSORS.length`). A **static grid** of all sponsor logos (7 columns xl, 5 lg, 4 md, 3 on phones and sm) in drafting cells whose borders draw in staggered; logos use `.sponsor-logo` knockout, link out (`target=_blank rel="sponsored noopener noreferrer"`, with an sr-only "(opens in a new tab)"), hover lifts to full opacity. The last cell is the dashed ember "Your logo here · Partner with us" slot linking `/partner`. Drop the marquee rail (the grid shows every sponsor at once, which sponsors prefer). One-line body copy.

### 5.4 The day (`DaySection`)
Heading `Doors at eight. / Awards by evening.` Desktop: **scrollytelling**. Left column sticky: one object (a stylised cup, the competition's namesake, as a *design object*) that evolves as the 5 steps scroll past: loose sketch strokes, then construction lines and dimensions, then a wireframe mesh, then a solid ember-lit render, then on screen under a spotlight for the awards. Right column: the 5 `SECTIONS.day.steps` with a progress line that fills and waypoint diamonds that light. Below: the `Bring` list and the timing note. Phones and reduced motion: no sticky; the illustration shows its final state once, above a compact vertical timeline. Include the `#why` and `#timeline` alias anchors.

### 5.5 For teachers (`TeachersSection`)
Heading `Bring your students / to Limberlost Place.` + lede. Three numbered steps (`SECTIONS.teachers.steps`) connected by a drawn construction line. Visual anchor: a **drafting-sheet illustration of the teacher registration form** (a title block reading `REGISTRATION · TEACHER`, field boxes labelled School / Number of students / Names / Grades drawn as blueprint lines, empty, no fake data). (Students signing up on their own are covered by the RegisterBlock's Students line and FAQ "Can I register myself?"; the separate `solo` paragraph was cut.) The "What each of your students gets" list from `EVERY_BUILDER` (short forms), `RegisterBlock`, and the contact line with a mailto link.

### 5.6 FAQ (`FAQSection`)
Heading `Questions? / Answered.` Filter chips All / Students / Teachers (buttons with `aria-pressed`; state is client-only but every item stays in the DOM; filtered-out items get `hidden`). Each item is a native `<details>/<summary>` (answers are in the HTML for crawlers; no Radix accordion, which unmounts closed panels). The "More questions? Ask us" box with `mailto:CONTACT_EMAIL?subject=...`. Answers render the exact `FAQS` strings (the JSON-LD reads the same strings); the "Where is it?" answer gets a `Map ↗` link after the text.

### 5.7 Final CTA (`CTASection`, id `register`)
Pill `SECTIONS.register.pill` (large, legible), heading `Build the / Impossible.`, the prize line, `RegisterBlock` centred is fine here (it is a closer, not a hero), and a mono line: date · venue name · street. No other buttons.

### 5.8 Nav, mobile menu, sticky bar, footer
- **Nav** (`SiteNav`): always visible (subtle transparent over the hero, solid `bg-background/85 backdrop-blur border-b` after ~40px). Left: lion mark + `MDC` + full name `Mackenzie Design Cup` (from `lg`). Centre: numbered section links (`01 At a glance … 06 FAQ`, from `NAV_LINKS`) with **scrollspy**: the active link lights ember with a sliding underline indicator; `aria-current="true"` on the active one. Along the bottom edge of the nav, a thin **drafting ruler scroll-progress bar** (ticks, ember fill). Right: `Partner` text link and the Register button (`CTA.register`, hidden on phones where the sticky bar holds it). Below `lg`, links move into `MobileNavMenu` (also add Partner and Register there).
- **Wordmark click** scrolls to top (no gate any more). Skip link stays.
- **MobileRegisterBar:** `CTA.register` to `/register` plus two short lines (`MOBILE_BAR.lines`: "Teachers sign up students" / "Students bring a teacher"), in a labelled `<aside>` landmark. Hide it while the final CTA section or the footer is on screen (avoid two CTAs stacked).
- **Footer:** a CAD **title block**: descriptor (`FOOTER.descriptor`), `<address>` with `VENUE_NAME`, `VENUE_STREET`, `Toronto, ON M5A 1B6` and a map link, date + doors, email, links (sections, Partner with us, Register now), `© 2026`. Remove "All rights reserved" boilerplate if it adds nothing; keep `MODEL_NO · TAGLINE`.

## 6. Other routes
- `/register`: H1 "Claim your spot." The two WHO_REGISTERS paths explained as two side-by-side cards (Teachers / Students, each saying what the form will ask, from §3), the Tally embed (load Tally's `https://tally.so/widgets/embed.js` so `dynamicHeight` works, with a sane min-height fallback), the "Form not loading? Open it in a new tab" fallback to `REGISTRATION_URL`, back link to `/`, and SiteNav/footer consistency. No em dashes.
- `/partner` + `/partner/register`: replace "George Brown College" and "51 Dockside Drive" with the Polytechnic + Limberlost Place facts from `site.ts`; fix any visible em dashes; keep the page otherwise (it is a separate audience). Breadcrumb trail (Home › Partner) visible above its hero.
- 404: keep the line, add links to Home, Register, FAQ, and the Register CTA; must be noindex.

## 7. SEO + GEO (website-production, adapted)
- **Prerender every route to static HTML at build time** (`vite build` + `vite build --ssr src/entry-server.tsx` + `scripts/prerender.mjs`). `main.tsx` hydrates when `#root` has children. Output `dist/index.html`, `dist/register/index.html`, `dist/partner/index.html`, `dist/partner/register/index.html`, `dist/404.html`. Raw HTML must contain every heading, body copy, all FAQ answers, the address and all JSON-LD with JS off.
- **Head per route** from one table `src/seo/routes.ts`: unique `<title>` (~50 to 60 chars, phrase a person would say), description (we/you voice, ~150 to 160 chars, one fact), absolute canonical, `og:*` + `twitter:*` (`summary_large_image`), `og:image` 1200×630, `robots` (404 noindex). A client `RouteHead` effect keeps `document.title`/description/canonical in sync on client navigation.
- **JSON-LD, one `@graph` per page, generated from `site.ts`/`copy.ts`/`sponsors.ts`:** `Organization` (#organization: the club, email, logo, url), `WebSite` (#website, `inLanguage: en-CA`, no SearchAction), `WebPage` per route (`isPartOf`, `about` → #event on home, `dateModified` from a per-route constant), `Event` (#event: `name`, `alternateName` "Mac Design Cup", `startDate` 2026-11-16T08:00:00-05:00, `endDate` 2026-11-16T16:00:00-05:00 (derived from `TIMES.end`, the working end time), `eventStatus` EventScheduled, `eventAttendanceMode` OfflineEventAttendanceMode, `location` Place with full PostalAddress, `organizer` → #organization, `sponsor` [each sponsor as Organization name+url], `audience` EducationalAudience student + teacher, `image`, `description`, `url`; no `offers` because cost is TBA), `FAQPage` on home with character-identical answers, `BreadcrumbList` on /partner, /register, /partner/register.
- `public/robots.txt`: one `User-agent: *` / `Allow: /` group + `Sitemap: https://www.macdesigncup.ca/sitemap.xml`. `public/sitemap.xml`: indexable routes, real `lastmod`, no priority/changefreq. `public/llms.txt` (honestly low-value). `site.webmanifest` + theme-color. `<html lang="en-CA">`.
- `public/og-image.png` 1200×630: a typed card composed from the brand (lion mark, wordmark, date, venue, $10,000+), rendered with Playwright from an HTML template kept in `scripts/og/`. Never stock/AI.
- `vercel.json`: remove the catch-all SPA rewrite (unknown paths then get the prerendered `404.html` with a real 404); keep asset caching; add `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy`; a `Content-Security-Policy-Report-Only`; and the **host switch**: `X-Robots-Tag: noindex, nofollow` on every host except `www.macdesigncup.ca` (Vercel header rule with `missing: [{type: host}]`). Verify the vercel.json schema against Vercel docs (context7).
- Internal links: body copy links to `/register`, `/partner`, `#faq`, the map.
- Deliverables: `seo/AUDIT.md` (scores with method, findings, keyword + title + description map, what was fixed, outstanding owner asks), `LAUNCH.md` (go-live runbook for this repo: merge to main is the deploy; Search Console + Bing Webmaster verification and sitemap submission; IndexNow; Rich Results + schema validator on the live URL; crawler 200 checks; PSI re-check).

## 8. Verification (every phase)
- Never call UI done from code alone. Screenshot 1440×900 and 390×844 (plus the hero aspect sweep) with Playwright scripts in `tmp/`, fresh browser per viewport, `headless: false` for small/portrait WebGL. Emulate reduced motion for one pass. Check console errors (hydration warnings included), horizontal overflow at 390/768/1024/1440, keyboard focus order, one H1 per page.
- Build + prerender + typecheck + lint + tests green before handing back.

## 9. Implemented primitive APIs (contract)
Built in the Foundation phase. Everything below is stable: code against it, do not fork it. Imports use the `@/` alias. Every primitive is SSR-safe (renders on the server with no `window`; `src/test/primitives-ssr.test.tsx` proves it), writes per-frame values through motion values or refs (never React state), and goes static and fully drawn for reduced motion after mount.

### 9.0 Ground rules the primitives rely on
- **Fonts:** self-hosted via `@fontsource`, imported in `src/main.tsx`: Anton 400 (`font-display`), Space Mono 400/700 (`font-mono`), Archivo Variable 100 to 900 (`font-body`, family `"Archivo Variable"`; use weights 300 to 600). No Google Fonts, no Inter.
- **Root motion config:** `App.tsx` wraps all routes in `<MotionConfig reducedMotion="user">` (transforms skipped for reduced motion, opacity still fades). App's hash-scroll effect: a location with `#id` scrolls that element into view one frame after render; a path change without a hash scrolls to top. Arrivals (first load or a route change) scroll instantly until the visitor's first input; in-page hash changes stay smooth.
- **Hydration:** never branch markup on framer's `useReducedMotion()` (it reads `matchMedia` on the first client render). Use `useReducedMotionSafe()` for behaviour, `motion-reduce:` Tailwind variants for first-paint differences. Existing offenders not fixed here: `LionMark` (picture vs img) and `Countdown` (`Date.now()` in render).
- **No JS:** `index.html` has `<noscript><style>[data-reveal]{opacity:1!important;transform:none!important}[data-draw]{stroke-dasharray:none!important;stroke-dashoffset:0!important}</style></noscript>`. Anything that starts hidden must carry `data-reveal` (or `data-draw` for SVG strokes).
- **Tailwind only scans `src/**`.** A class used only in `tmp/` or `scripts/` is not generated.
- **Stacking:** page wrapper `relative bg-background` > `<BlueprintBackdrop/>` (fixed, `z-0`) > `<SiteNav/>` (fixed `z-50`) > `<main id="main" className="relative z-10">`. Sections paint over the grid; give a section an opaque background only if it must hide the grid (the hero does).

### 9.1 Hooks
**`useHydrated(): boolean`** (`@/hooks/useHydrated`, default + named export). `false` on the server and first client render, `true` after mount.
```tsx
const hydrated = useHydrated();
return <span>{hydrated ? localTime : "--:--"}</span>;
```
**`useReducedMotionSafe(): boolean`** (`@/hooks/useReducedMotionSafe`, default + named). `false` until mounted, then the live `(prefers-reduced-motion: reduce)` value (follows OS changes).
```tsx
const reduced = useReducedMotionSafe();
useEffect(() => { if (!reduced) return startIdleLoop(); }, [reduced]);
```
There is no `useInViewOnce`: use framer's `useInView(ref, { once: true, margin: "0px 0px -12% 0px" })` (SSR-safe, `false` on the server).

### 9.2 Motion (`src/components/motion/`)
**Tokens** (`@/components/motion/tokens`): `EASE = [0.22, 1, 0.36, 1]`, `DURATION = { reveal: 0.8, draw: 1.4, count: 1.6 }` (seconds), `VIEWPORT_ONCE = { once: true, margin: "0px 0px -12% 0px" }`.

**`<Reveal>`** (default export `@/components/motion/Reveal`). Fades and rises in once on view; `data-reveal`.
| prop | type | default |
|---|---|---|
| `as` | `"div" \| "section" \| "article" \| "aside" \| "header" \| "footer" \| "figure" \| "p" \| "span" \| "ul" \| "ol" \| "li" \| "dl"` | `"div"` |
| `delay` | seconds | `0` |
| `y` | px risen | `18` |
| `className`, `id`, `style`, `children` | | |
```tsx
<Reveal as="p" delay={0.1} className="max-w-xl text-concrete">{SECTIONS.glance.body}</Reveal>
```

**`<DisplayHeading>`** (default export `@/components/motion/DisplayHeading`). Anton heading; each line sits in a clip band (`.display-line`) and slides up on view, staggered. Lines are joined by a space in the HTML, so crawlers and screen readers read a sentence.
| prop | type | default |
|---|---|---|
| `lines` (required) | `readonly ReactNode[]` (strings or nodes such as `<CountUp/>`) | |
| `as` | `"h1" \| "h2" \| "h3"` | `"h2"` |
| `outline` | substring set in wire type (first match in each string line) | none |
| `outlineClassName` | | `"wire-text"` (`"wire-text-ember"` also exists) |
| `size` | `"scene"` (`.display-scene`) \| `"hero"` (`.display-hero`) | `"scene"` |
| `delay` / `stagger` | seconds | `0` / `0.09` |
| `reveal` | `false` = static heading, no mask or motion (use for an above-the-fold LCP h1) | `true` |
| `id`, `className`, `lineClassName` | | |
```tsx
<DisplayHeading lines={SECTIONS.glance.lines} outline={SECTIONS.glance.outline} />
<DisplayHeading as="h1" size="hero" reveal={false} lines={HERO.h1} />
```

**`useSectionProgress(ref, offset?, options?) => MotionValue<number>`** (named + default export `@/components/motion/useSectionProgress`). 0..1 scroll progress of `ref` (an `HTMLElement` ref) through the viewport, from framer `useScroll`. Reads 0 on the server. `options.reducedMotion`: `"end"` (default, holds 1 = fully drawn), `"start"` (holds 0), `"live"` (keeps following scroll). Also exports `SECTION_OFFSETS` and `type ScrollOffset`:
- `through` `["start end", "end start"]` (default), `enter` `["start end", "start 0.3"]`, `centre` `["start end", "center center"]`, `pinned` `["start start", "end end"]` (a tall section behind a sticky stage).
```tsx
const ref = useRef<HTMLDivElement>(null);
const progress = useSectionProgress(ref, SECTION_OFFSETS.enter);
```

**`<DrawPath>`** (default export `@/components/motion/DrawPath`). A `motion.path` that draws itself; render it inside your own `<svg viewBox>`. `data-draw`. Other SVG path props (`strokeLinejoin`, `opacity`, `transform`, …) pass through, except `vectorEffect` (and do not pass `strokeDasharray`: the draw owns the dash): non-scaling-stroke breaks the dash-based draw (the line comes out dashed), so draw in a viewBox near pixel scale, or for a stretched straight rule use `preserveAspectRatio="none"` with the cross axis at 1 unit = 1px.
| prop | type | default |
|---|---|---|
| `d` (required) | path data | |
| `progress` | `MotionValue<number>` 0..1: scroll-scrubbed (draws and un-draws with it) | none |
| `range` | `readonly [start, end]` slice of `progress` this path draws over | `[0, 1]` |
| `inView` | without `progress`: draw once on view; `false` = static, fully drawn | `true` |
| `delay` / `duration` | seconds, in-view mode | `0` / `1.4` |
| `strokeWidth` | viewBox units | `1` |
| `className` | stroke colour: `draft-stroke` \| `draft-stroke-faint` \| `draft-stroke-strong` \| `draft-stroke-ember` | `"draft-stroke"` |
```tsx
<svg viewBox="0 0 600 200" className="w-full" aria-hidden="true">
  <DrawPath d="M20 180 L300 20 L580 180" progress={progress} range={[0.1, 0.6]} />
  <DrawPath d="M20 180 H580" className="draft-stroke-ember" delay={0.3} />
</svg>
```

**`<CountUp>`** (default export `@/components/motion/CountUp`). Counts up once on view by writing `textContent` (min-width held, so nothing shifts). The server, no-JS and crawlers get the final text; it never moves if already on screen at mount or for reduced motion. Pass a stable `format` (module-level), or the count restarts on every render.
| prop | type | default |
|---|---|---|
| `to` (required) | number (the server-rendered value) | |
| `from` | number | `0` |
| `duration` | seconds | `1.6` |
| `format` | `(n: number) => string` | rounded, `en-CA` grouping |
| `prefix` / `suffix` | string | `""` |
| `className` | | (`tabular-nums` always applied) |
```tsx
<DisplayHeading lines={[<CountUp key="pool" to={PRIZE_POOL_NUMBER} prefix="$" suffix="+" />, "in prizes."]} outline="in prizes." />
```

### 9.3 Blueprint (`src/components/blueprint/`)
**`<BlueprintBackdrop grain? className? />`** (default export). Fixed full-viewport drafting grid (`.draft-grid` + `.draft-grid-fade`), minor lines fainter on phones, drifting up at 0.06x scroll (transform only; static for reduced motion). `grain` (default `true`) also renders the existing `.grain-overlay` (the only layer above content; `pointer-events: none`). Once per page, first child of the page wrapper.
```tsx
<div className="relative min-h-screen bg-background"><BlueprintBackdrop /><SiteNav /><main id="main" className="relative z-10">…</main></div>
```

**`<Sheet>`** (default export) + `SheetEyebrow` + `SHEET_COUNT = 6`. The section shell: `<section id>` with `overflow-x-clip px-5 py-12 md:px-10 md:py-16 lg:px-16 xl:py-20`, `<CropMarks/>` at its corners, a `lg+` left ruler (`.draft-ruler-y`, faded ends), an aria-hidden `md+` corner label (`SHEET 02 / 06 · PRIZES · 1:1`), then a `relative mx-auto w-full max-w-[1300px]` container holding the eyebrow and children. Extra `<section>` props (`aria-labelledby`, `data-*`, `style`) pass through.
| prop | type | default |
|---|---|---|
| `id` (required) | anchor | |
| `eyebrow` | e.g. `SECTIONS.prizes.eyebrow` ("02 · Prizes"); the number is set in ember, followed by an ember rule that draws in | none (no eyebrow) |
| `sheetNo` | number in the corner label | parsed from `eyebrow` |
| `title` | name in the corner label | parsed from `eyebrow` |
| `scale` | | `"1:1"` |
| `ruler` / `marks` | booleans | `true` / `true` |
| `className` (section), `containerClassName` (inner container), `children` | | |
No label is rendered when there is neither a number nor a name. `SheetEyebrow({ children: string, className? })` renders the same eyebrow standalone.
```tsx
<Sheet id="prizes" eyebrow={SECTIONS.prizes.eyebrow}>…</Sheet>
<Sheet id="register" marks={false} ruler={false} className="text-center">…</Sheet>
```

**`<CropMarks inset? className? />`** (default export). Four printer's crop marks around the positioned parent's corners. Default inset 14px phones / 28px `md+` (smaller marks on phones); a number fixes the inset in px.
```tsx
<figure className="draft-panel relative p-10"><CropMarks inset={12} />…</figure>
```

**`<Dimension>`** (default export). Decorative CAD dimension (aria-hidden): end ticks with 45deg slashes, hairline halves that draw outward from a centred mono label.
| prop | type | default |
|---|---|---|
| `label` (required) | `"Ø 64"`, `"1:1"`, `"420"`, `"1st place"` | |
| `orientation` | `"horizontal" \| "vertical"` (vertical label reads bottom to top) | `"horizontal"` |
| `length` | px number or CSS length (vertical needs a sized parent for `%`) | `"100%"` |
| `tone` | `"bone" \| "ember"` | `"bone"` |
| `draw` | draw in on view | `true` |
| `className` | | |
```tsx
<Dimension label="1st place" tone="ember" length={260} />
<Dimension orientation="vertical" label="420" className="absolute -left-10 inset-y-0" />
```

**`<WireSolid>`** (default export; `type WireShape`). A perspective-projected wireframe solid in SVG (JS vertex projection, `d` written through refs). Visible edges and curved-surface silhouettes solid, hidden edges dashed and fainter, an optional ember accent edge (cube/octahedron/icosahedron/prism: one ridge; cylinder: top rim; cone: base rim). Yaw follows scroll progress plus a slow idle drift (0.05 rad/s, runs only while on screen); reduced motion: still, in its resting pose. aria-hidden, no pointer events, `hidden md:block` unless `mobile`. Spec budget: one per section at most.
| prop | type | default |
|---|---|---|
| `shape` (required) | `"cube" \| "octahedron" \| "icosahedron" \| "cylinder" \| "cone" \| "prism"` | |
| `size` | px number or CSS length (box edge) | `160` |
| `spin` | `"scroll" \| "time" \| "both"` | `"both"` |
| `progress` | external `MotionValue<number>` | its own `through` pass |
| `turns` | yaw turns over progress 0 to 1 | `0.5` |
| `pose` | `[yaw, pitch]` radians | `[0.62, 0.5]` |
| `accent` | ember accent edge | `false` |
| `hidden` | `"dashed" \| "solid" \| "none"` (back edges) | `"dashed"` |
| `mobile` | show below `md` | `false` |
| `label` | dimension line under it, e.g. `"240"` | none |
| `className` | outer box; ink via `[--wire-a:0.1]` (edge alpha, default 0.16) or `text-*` colour | |
```tsx
<WireSolid shape="icosahedron" size={220} accent label="Ø 220" className="absolute right-10 top-24" />
```
The engine is `@/components/blueprint/wireGeometry` (`getSolid(shape)`, `projectSolid(solid, yaw, pitch) => { visible, hidden, accent }` path strings in a viewBox of `±VIEW_EXTENT` (1.32), `CAMERA_DISTANCE` 4.5): pure and deterministic, reusable for custom line drawings.

### 9.4 Register
**`<RegisterButton>`** (default export `@/components/RegisterButton`). Always a react-router `<Link to={REGISTER_PATH}>` (`/register`). Props: `children` (default `CTA.register`, keep verbatim), `variant: "solid" | "ghost"` (`.btn-portal` / `.btn-ghost`, default solid), `className` (size and visibility), plus any anchor prop (`onClick`, `aria-describedby`, …). Always has `.focus-ember`.
```tsx
<RegisterButton className="hidden px-5 py-2.5 text-[11px] md:inline-flex" />
```
**`<RegisterBlock>`** (default export `@/components/RegisterBlock`). The button plus the two WHO_REGISTERS lines (lucide `Users` / `User`, 16px, stroke 1.5, ember); the button is `aria-describedby` the note.
| prop | type | default |
|---|---|---|
| `align` | `"start" \| "center"` | `"start"` |
| `variant` | `"stacked"` (note under the button) \| `"inline"` (note beside it from `md`, behind a hairline) | `"stacked"` |
| `mobileButton` | show the button below `md`; pass `false` where the sticky bar is on screen (Glance, Teachers). The final CTA keeps it because the bar hides there | `true` |
| `buttonClassName`, `className` | | |
```tsx
<RegisterBlock mobileButton={false} />
<RegisterBlock align="center" />
```

### 9.5 Page skeleton and stubs (to be replaced)
- `src/pages/Index.tsx`: `BlueprintBackdrop`, `SiteNav`, `main#main` (Hero, Glance, Prizes, Sponsors, Day, Teachers, FAQ, CTA), `SiteFooter`, `MobileRegisterBar`. No gate, no scroll lock, no ArrivalFlash. No mobile bottom padding on the wrapper: the sticky bar steps aside while #register or the footer is on screen.
- `SiteNav` takes no props; the wordmark smooth-scrolls to top on `/` (clears any hash; App then scrolls to top) and links home elsewhere; links from `NAV_LINKS`; Register via `RegisterButton`.
- Stubs, each marked `STUB (Foundation phase)` in its JSDoc: `src/components/hero/Hero.tsx` (static 100svh poster, `section#top`, the page's only `<h1>`, CSS portal glow, Enter link to `#glance`), `src/sections/GlanceSection.tsx` (cube `WireSolid`, RegisterBlock), `PrizesSection.tsx` (CountUp heading, ember Dimension, 1st place), `DaySection.tsx` (steps on a scroll-drawn rule; already has the `#why` / `#timeline` `.anchor-alias` spans), `TeachersSection.tsx` (octahedron, RegisterBlock). `SponsorsSection` now reads `SPONSORS` from `src/config/sponsors.ts` (13 logos incl. startGBC); FAQ/CTA/footer only had their "George Brown College" strings fixed.
- Deleted: `IntroSection`, `ExhibitsSection`, `TimelineSection`, `ProcessSection`, `hero/HeroGate`. `hero/GalleryScene.tsx` was rebuilt in the Hero phase (its CTA styles are `.hall-cta*` in `hero/hero.css`); the old `.hero-cta*` gate CSS was deleted in the integration pass.

### 9.6 Global CSS added to `src/index.css` (it belongs to nobody from here on)
Tokens on `:root`: `--draft-ink` (= `--bone`), `--draft-grid-minor` 0.022, `--draft-grid-major` 0.045, `--draft-faint` 0.07, `--draft-soft` 0.13, `--draft-strong` 0.22, `--draft-ember` 0.6 (use as `hsl(var(--draft-ink) / var(--draft-soft))`), `--nav-h` 4.5rem (the nav must stay within it; `html` has `scroll-padding-top: calc(var(--nav-h) + 1rem)` (and, below 768px, a `scroll-padding-bottom` that clears the sticky Register bar), so anchor jumps, `scrollIntoView` and keyboard focus all clear the fixed nav; never add `scroll-margin-top` to targets as well (the two add up), and code that scrolls with `window.scrollTo` reads `scrollPaddingTop` from `document.documentElement`; override `--nav-h` on `:root` from a later stylesheet if the nav grows). `html` is now `position: relative` (framer `useScroll({ target })` wants a positioned scroll root).
| class | what |
|---|---|
| `.display-scene` (resized) | `clamp(2.5rem, 0.9rem + 4.6vw, 5.5rem)`: a copy-deck line holds one line on desktop |
| `.display-line` | a DisplayHeading clip band (`clip-path` inset, generous above and at the sides) |
| `.draft-grid` | two-level grid; pitch via `--grid-minor` (8px) / `--grid-major` (64px) |
| `.draft-grid-fade` | radial mask fading any layer toward the edges |
| `.draft-panel` | drawing plate for an illustration: hairline border, 16/80px grid, 55% background |
| `.draft-hatch` | 45deg section-cut hatching (reserved or empty cells, e.g. the partner slot) |
| `.draft-stroke`, `-faint`, `-strong`, `-ember` | SVG stroke colours at the draft alphas; `fill: none`; width stays with the attribute |
| `.crop-mark` + `--tl` / `--tr` / `--bl` / `--br` | zero-size mark placed on a corner point; tune `--crop-len` (14px), `--crop-gap` (6px) |
| `.sheet-label` | 10px Space Mono caps label, concrete at 62%. A purely decorative label is passed as `data-label` and drawn by `::before` (kept out of page text and contrast audits); a caption that carries meaning stays in the markup at a legible contrast |
| `.draft-ruler-y` | vertical ruler (12px wide, give it a height) |
| `.dim`, `.dim--v`, `.dim--ember`, `.dim-line`, `.dim-end(--a/--b)`, `.dim-label` | the Dimension parts |
| `.wire-solid`, `-edge`, `-hidden`, `-dashed`, `-accent` | the WireSolid ink (`--wire-a`) |
| `.anchor-alias` | empty `<span id>` that aliases an old anchor (nav clearance comes from `html`'s scroll-padding) |
| `.focus-ember` | 1px ember `:focus-visible` outline, 3px offset |
Still available from before: `.mono-label`, `.display-giant`, `.display-hero`, `.wire-text`, `.wire-text-ember`, `.ember-text`, `.text-ember`, `.btn-portal`, `.btn-ghost`, `.ember-rule`, `.sponsor-logo`, `.grain-overlay`, `.scene-vignette`, keyframes `blink`, `pulse-ring`, `loader-sweep`. Removed in the integration pass as unused: `.hero-cta*`, `.text-neon`, `.text-gradient`, `.text-glow`, `.btn-register`, `.concrete-panel`, `.neon-rule`, `.sponsor-rail`, `.rotate-tiny*`, `.draft-dashed`, `.draft-ruler-x`, keyframes `ember-flicker`, `float-y`, `scroll-cue`, `hint-in`, `gate-shake`.

### 9.7 Tests added
`src/test/wire-geometry.test.ts` (edge classification, determinism, every shape inside the viewBox at any pose) and `src/test/primitives-ssr.test.tsx` (node environment: every primitive renders on the server with its real content). `src/test/setup.ts` now guards `window` so node-environment tests can run.
