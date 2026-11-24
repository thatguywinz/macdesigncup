// /submissions (and the old /gallery): the public page of entries, when
// organizers switch it on in Settings: every submitted entry that allows
// sharing, or only the ones they picked. The placed teams (1st to 5th, as
// announced at the closing ceremony) lead in a Winners section; scores and
// the full ranking never appear here. Each card opens the entry's page.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Camera, Mail, Search, Video } from "lucide-react";
import Shell from "../components/Shell";
import { api } from "../api";
import type { PublicEntry } from "../shared/schema";
import { CONTACT_EMAIL } from "@/config/site";

interface Listing {
  mode: "off" | "all" | "selected";
  entries: PublicEntry[];
}

/** "1st place" -> 1 ... "5th place" -> 5; anything else isn't a place. */
const placeOf = (award: string) => {
  const m = /^(\d)(st|nd|rd|th) place$/.exec(award);
  return m ? Number(m[1]) : 0;
};
const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th"];

export default function GalleryPage() {
  const [data, setData] = useState<Listing | null>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    document.title = "Submissions · Mackenzie Design Cup";
    api<Listing>("/submissions")
      .then(setData)
      .catch(() => setData({ mode: "off", entries: [] }));
  }, []);

  const all = useMemo(() => data?.entries ?? [], [data]);
  const winners = useMemo(
    () => all.filter((e) => placeOf(e.award)).sort((a, b) => placeOf(a.award) - placeOf(b.award)),
    [all],
  );
  const q = query.trim().toLowerCase();
  // Searching looks through every design, winners included, in one list.
  const shown = useMemo(
    () => (q ? all.filter((e) => [e.title, e.credit, ...e.software].some((s) => s.toLowerCase().includes(q))) : all.filter((e) => !placeOf(e.award))),
    [all, q],
  );
  const open = data && data.mode !== "off";

  return (
    <Shell section="Submissions" wide>
      <header className="pt-12 md:pt-16">
        <p className="p-mono text-concrete">Mackenzie Design Cup 2026 · November 16</p>
        <h1 className="mt-3 font-display text-[clamp(3rem,8vw,6rem)] uppercase leading-[0.9] tracking-[0.005em] text-bone">Submissions</h1>
        <p className="mt-5 max-w-[42rem] font-body text-lg leading-relaxed text-foreground/75">
          {open && all.length ? `${all.length} designs, ` : "Designs "}
          each modelled in a single day after the theme reveal. Open one to see the team's pictures and turn the 3D model around.
        </p>
      </header>

      {data === null ? (
        <p className="mt-12 font-body text-concrete" role="status">
          Loading…
        </p>
      ) : !open ? (
        <p className="mt-12 max-w-[36rem] font-body text-foreground/75">Submissions aren't public yet. They appear here after judging.</p>
      ) : (
        <>
          <Notes />

          {winners.length > 0 && !q && (
            <section aria-labelledby="winners" className="mt-16">
              <h2 id="winners" className="font-display text-[clamp(2rem,4vw,3rem)] uppercase leading-none text-bone">
                Winners
              </h2>
              <p className="mt-3 max-w-[40rem] font-body text-foreground/70">The top five, as announced at the closing ceremony.</p>
              <ol className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                {winners[0] && (
                  <li className="lg:row-span-2">
                    <WinnerCard e={winners[0]} big />
                  </li>
                )}
                {winners.slice(1, 3).map((e) => (
                  <li key={e.id}>
                    <WinnerCard e={e} />
                  </li>
                ))}
              </ol>
              {winners.length > 3 && (
                <ol className="mt-6 grid gap-6 sm:grid-cols-2">
                  {winners.slice(3).map((e) => (
                    <li key={e.id}>
                      <WinnerCard e={e} />
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}

          <section aria-labelledby="all-designs" className="mt-20">
            <div className="flex flex-col gap-5 border-t border-bone/10 pt-8 md:flex-row md:items-end md:justify-between">
              <h2 id="all-designs" className="font-display text-[clamp(2rem,4vw,3rem)] uppercase leading-none text-bone">
                {q ? "Search" : winners.length ? "Every other design" : "Every design"}
              </h2>
              {all.length > 6 && (
                <label className="relative block md:w-80">
                  <span className="sr-only">Search submissions</span>
                  <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-concrete" aria-hidden="true" />
                  <input className="p-input pl-9" placeholder="Title, name, software" value={query} onChange={(e) => setQuery(e.target.value)} />
                </label>
              )}
            </div>
            {shown.length === 0 ? (
              <p className="mt-10 max-w-[34rem] font-body text-foreground/75">{all.length ? "Nothing matches." : "Nothing here yet."}</p>
            ) : (
              <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {shown.map((e) => (
                  <li key={e.id}>
                    <Card e={e} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </Shell>
  );
}

function Notes() {
  return (
    <div className="mt-10 grid gap-4 md:grid-cols-2">
      <p className="p-notice flex gap-3 font-body text-foreground/85">
        <Mail size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-ember" aria-hidden="true" />
        <span>
          <strong className="font-semibold text-bone">Winners:</strong> prizes are on their way and we'll be in touch by email. If you placed and haven't heard from us in 1 to 2 weeks, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="p-link focus-ember whitespace-nowrap">
            {CONTACT_EMAIL}
          </a>
          .
        </span>
      </p>
      <p className="p-notice p-notice--calm flex gap-3 font-body text-foreground/85">
        <Camera size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-concrete" aria-hidden="true" />
        <span>
          <strong className="font-semibold text-bone">Photos and video from the day are coming soon.</strong> Our photographers are sorting through them so that only people who gave media consent appear.
        </span>
      </p>
    </div>
  );
}

const coverOf = (e: PublicEntry) => e.thumb ?? e.images[0] ?? null;

function Badges({ e }: { e: PublicEntry }) {
  if (!(e.video || e.videoLink) && !e.hasModel) return null;
  return (
    <span className="absolute bottom-2 left-2 flex gap-1">
      {(e.video || e.videoLink) && (
        <span className="p-tag gap-1 border-transparent bg-background/85">
          <Video size={12} strokeWidth={1.6} aria-hidden="true" /> Video
        </span>
      )}
      {e.hasModel && (
        <span className="p-tag gap-1 border-transparent bg-background/85">
          <Box size={12} strokeWidth={1.6} aria-hidden="true" /> 3D
        </span>
      )}
    </span>
  );
}

function WinnerCard({ e, big }: { e: PublicEntry; big?: boolean }) {
  const place = placeOf(e.award);
  const cover = coverOf(e);
  return (
    <Link to={`/entry/${e.id}`} className="j-card focus-ember group h-full" aria-label={`${e.award}: ${e.title} by ${e.credit}`}>
      <div className={`relative overflow-hidden bg-[#0d0e10] ${big ? "aspect-[4/3] lg:aspect-auto lg:min-h-0 lg:flex-1" : "aspect-[16/10]"}`}>
        {cover ? (
          <img src={cover.url} alt="" loading={place <= 3 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center text-concrete">
            <Box size={28} strokeWidth={1.2} aria-hidden="true" />
          </div>
        )}
        <Badges e={e} />
      </div>
      <div className="flex items-start gap-4 p-5">
        <span
          aria-hidden="true"
          className={`font-display uppercase leading-[0.85] ${place === 1 ? "text-[clamp(3rem,6vw,4.5rem)] text-ember" : place <= 3 ? "text-[2.75rem] text-ember" : "text-[2.25rem] text-bone/70"}`}
        >
          {ORDINAL[place]}
        </span>
        <span className="flex min-w-0 flex-col gap-1 pt-1">
          <span className={`font-body font-semibold tracking-[-0.01em] text-bone ${big ? "text-2xl" : "text-lg"}`}>{e.title}</span>
          <span className="font-body text-sm text-concrete">by {e.credit}</span>
        </span>
      </div>
    </Link>
  );
}

function Card({ e }: { e: PublicEntry }) {
  const cover = coverOf(e);
  return (
    <Link to={`/entry/${e.id}`} className="j-card focus-ember group h-full">
      <div className="j-thumb relative">
        {cover ? (
          <img src={cover.url} alt="" loading="lazy" className="transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="grid h-full place-items-center text-concrete">
            <Box size={28} strokeWidth={1.2} aria-hidden="true" />
          </div>
        )}
        <Badges e={e} />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        {e.award && <span className="p-tag p-tag--solid mb-1 self-start">{e.award}</span>}
        <span className="font-body text-lg font-semibold tracking-[-0.01em] text-bone">{e.title}</span>
        <span className="font-body text-sm text-concrete">by {e.credit}</span>
        {e.software.length > 0 && <span className="font-body text-[13px] text-concrete/80">{e.software.join(", ")}</span>}
      </div>
    </Link>
  );
}
