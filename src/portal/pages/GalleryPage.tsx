// /submissions (and the old /gallery): the public page of entries, when
// organizers switch it on in Settings: every submitted entry that allows
// sharing, or only the ones they picked. Award winners first. Each card opens
// the entry's page: video, 3D model, description. Scores never appear here.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Box, Search, Video } from "lucide-react";
import Shell from "../components/Shell";
import { api } from "../api";
import type { PublicEntry } from "../shared/schema";

interface Listing {
  mode: "off" | "all" | "selected";
  entries: PublicEntry[];
}

export default function GalleryPage() {
  const [data, setData] = useState<Listing | null>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    document.title = "Submissions · Mackenzie Design Cup";
    api<Listing>("/submissions")
      .then(setData)
      .catch(() => setData({ mode: "off", entries: [] }));
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data?.entries ?? [];
    return q ? list.filter((e) => [e.title, e.credit, ...e.software].some((s) => s.toLowerCase().includes(q))) : list;
  }, [data, query]);

  return (
    <Shell section="Submissions" wide>
      <div className="flex flex-col gap-6 pt-12 md:flex-row md:items-end md:justify-between md:pt-16">
        <div>
          <h1 className="display-scene">Submissions</h1>
          <p className="mt-4 max-w-[40rem] font-body text-lg leading-relaxed text-foreground/75">
            Designs from the Mackenzie Design Cup 2026, each made in a single day. Open one to watch the team's video and turn the model around.
          </p>
        </div>
        {data && data.entries.length > 6 && (
          <label className="relative block md:w-72">
            <span className="sr-only">Search submissions</span>
            <Search size={15} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-concrete" aria-hidden="true" />
            <input className="p-input pl-9" placeholder="Title, team, software" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        )}
      </div>
      {data === null ? (
        <p className="mt-12 font-body text-concrete" role="status">
          Loading…
        </p>
      ) : data.mode === "off" ? (
        <p className="mt-12 max-w-[36rem] font-body text-foreground/75">Submissions aren't public yet. They appear here after judging.</p>
      ) : shown.length === 0 ? (
        <p className="mt-12 max-w-[34rem] font-body text-foreground/75">{data.entries.length ? "Nothing matches." : "Nothing here yet."}</p>
      ) : (
        <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {shown.map((e) => (
            <li key={e.id}>
              <Link to={`/entry/${e.id}`} className="j-card focus-ember group h-full">
                <div className="j-thumb relative">
                  {e.thumb || e.images[0] ? (
                    <img src={(e.thumb ?? e.images[0]).url} alt="" loading="lazy" className="transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="grid h-full place-items-center text-concrete">
                      <Video size={28} strokeWidth={1.2} aria-hidden="true" />
                    </div>
                  )}
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
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  {e.award && <span className="p-tag p-tag--solid mb-1 self-start">{e.award}</span>}
                  <span className="font-body text-lg font-semibold tracking-[-0.01em] text-bone">{e.title}</span>
                  <span className="font-body text-sm text-concrete">by {e.credit}</span>
                  {e.software.length > 0 && <span className="font-body text-[13px] text-concrete/80">{e.software.join(", ")}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
