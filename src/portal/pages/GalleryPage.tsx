// /gallery: the entries organizers chose to show after the event, award
// winners first. Each card opens the entry's share page.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Shell from "../components/Shell";
import { api } from "../api";
import type { PublicEntry } from "../shared/schema";

export default function GalleryPage() {
  const [entries, setEntries] = useState<PublicEntry[] | null>(null);
  useEffect(() => {
    api<{ entries: PublicEntry[] }>("/gallery")
      .then((r) => setEntries(r.entries))
      .catch(() => setEntries([]));
  }, []);

  return (
    <Shell section="Gallery" wide>
      <div className="pt-12 md:pt-16">
        <h1 className="display-scene">Gallery</h1>
        <p className="mt-4 max-w-[38rem] font-body text-lg leading-relaxed text-foreground/75">
          Designs from the Mackenzie Design Cup 2026, each modelled in a single day. Open one to turn it around in 3D.
        </p>
      </div>
      {entries === null ? (
        <p className="mt-12 font-body text-concrete" role="status">
          Loading…
        </p>
      ) : entries.length === 0 ? (
        <p className="mt-12 max-w-[34rem] font-body text-foreground/75">Nothing here yet. Entries appear once the judges have finished.</p>
      ) : (
        <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {entries.map((e) => (
            <li key={e.id}>
              <Link to={`/entry/${e.id}`} className="j-card focus-ember group h-full">
                <div className="j-thumb">
                  {e.thumb || e.images[0] ? (
                    <img src={(e.thumb ?? e.images[0]).url} alt="" loading="lazy" className="transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  {e.award && <span className="p-tag p-tag--solid mb-1 self-start">{e.award}</span>}
                  <span className="font-body text-lg font-semibold tracking-[-0.01em] text-bone">{e.title}</span>
                  <span className="font-body text-sm text-concrete">by {e.credit}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}
