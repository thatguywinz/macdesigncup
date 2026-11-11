// /entry/:id: the share page. The model fills the stage; the words sit
// beside it. Shows only what the team chose to make public: the title, the
// credit line (first names or team name), software, their description and
// images. Never surnames, schools, emails or the project file.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Link2 } from "lucide-react";
import Shell from "../components/Shell";
import { ApiError, api } from "../api";
import { isViewable, type ViewableExt } from "../shared/formats";
import type { PublicEntry } from "../shared/schema";
import ModelViewer from "../viewer/ModelViewer";
import VideoPlayer from "../components/VideoPlayer";

export default function EntryPage() {
  const { id = "" } = useParams();
  const [entry, setEntry] = useState<PublicEntry | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<PublicEntry>(`/entry/${id}`)
      .then((e) => {
        setEntry(e);
        document.title = `${e.title} · Mackenzie Design Cup`;
      })
      .catch((e: ApiError) => setError(e.status === 404 ? "This design isn't available. The link may be incomplete, or its team made it private." : e.message));
  }, [id]);

  if (error) {
    return (
      <Shell section="Design">
        <div className="max-w-[40rem] py-24">
          <h1 className="display-scene">Not available</h1>
          <p className="mt-4 font-body text-lg text-foreground/75">{error}</p>
          <p className="mt-8 font-body">
            <a href="/" className="p-link focus-ember">
              Mackenzie Design Cup
            </a>
          </p>
        </div>
      </Shell>
    );
  }

  const model = entry?.model && isViewable(entry.model.ext) ? entry.model : null;

  return (
    <Shell section="Design" wide right={entry ? <CopyLink /> : null}>
      <div className="grid items-start gap-8 pt-6 md:pt-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_27rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* The team's cover picture leads, then their video, then the 3D model. */}
          {entry && entry.images[0] && (
            <a href={entry.images[0].url} target="_blank" rel="noopener noreferrer" className="focus-ember block overflow-hidden rounded-[2px] border border-bone/10 bg-[#0d0e10]">
              <img src={entry.images[0].url} alt={`${entry.title}, cover`} className="max-h-[78vh] w-full object-contain" />
            </a>
          )}
          {entry && (entry.video || entry.videoLink) && <VideoPlayer title={entry.title} file={entry.video} link={entry.videoLink} poster={entry.thumb?.url} />}
          {(!entry || model) && (
            <ModelViewer
              source={model ? { kind: "url", url: model.url, ext: model.ext as ViewableExt } : null}
              upAxis={entry?.upAxis ?? "y"}
              label={entry ? `${entry.title}, 3D model` : "3D model"}
              className={entry && (entry.video || entry.videoLink || entry.images.length) ? "aspect-[16/10] w-full" : "h-[62vh] min-h-[340px] w-full lg:h-[calc(100dvh-7.5rem)]"}
              empty={<span className="font-body text-sm text-concrete">{entry ? "No model to show." : ""}</span>}
            />
          )}
        </div>

        <article className="min-w-0 pb-6 lg:sticky lg:top-20">
          {!entry ? (
            <p className="font-body text-concrete" role="status">
              Loading…
            </p>
          ) : (
            <>
              {entry.award && <p className="p-tag p-tag--solid mb-4">{entry.award}</p>}
              <h1 className="font-body text-[clamp(2rem,1.4rem+2.2vw,3rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-bone">{entry.title}</h1>
              <p className="mt-3 font-body text-lg text-foreground/80">by {entry.credit}</p>
              {entry.software.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Software">
                  {entry.software.map((s) => (
                    <li key={s} className="p-tag">
                      {s}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-8 border-t border-bone/10 pt-6">
                <h2 className="font-body text-sm font-medium text-concrete">The idea</h2>
                <p className="mt-2 whitespace-pre-line font-body text-[16px] leading-relaxed text-foreground/85">{entry.summary}</p>
              </div>
              {entry.process && (
                <div className="mt-7">
                  <h2 className="font-body text-sm font-medium text-concrete">More from the team</h2>
                  <p className="mt-2 whitespace-pre-line font-body text-[16px] leading-relaxed text-foreground/85">{entry.process}</p>
                </div>
              )}

              {entry.images.length > 1 && (
                <div className="mt-8">
                  <h2 className="font-body text-sm font-medium text-concrete">More pictures</h2>
                  <ul className="mt-3 grid grid-cols-2 gap-2">
                    {entry.images.slice(1).map((img, i) => (
                      <li key={img.id}>
                        <a href={img.url} target="_blank" rel="noopener noreferrer" className="focus-ember block overflow-hidden rounded-[2px] border border-bone/10">
                          <img src={img.url} alt={`${entry.title}, picture ${i + 2}`} className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-[1.03]" loading="lazy" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-10 border-t border-bone/10 pt-5 font-body text-sm text-concrete">
                Modelled in one day at the{" "}
                <a href="/" className="p-link focus-ember">
                  Mackenzie Design Cup 2026
                </a>
                , Toronto.
              </p>
            </>
          )}
        </article>
      </div>
    </Shell>
  );
}

function CopyLink() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn-ghost p-btn p-btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href.split("#")[0]);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* blocked */
        }
      }}
    >
      {copied ? <Check size={15} strokeWidth={2} /> : <Link2 size={15} strokeWidth={1.5} />}
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
