// The judge entry page's evidence panels: what the model measures (and the
// size spec), how it was made (sketches, progress shots with server times,
// CAD link, file metadata), and the originality checks with organizers'
// decisions.
import { useState } from "react";
import { ExternalLink, ShieldAlert, ShieldCheck } from "lucide-react";
import { api, clock } from "../../api";
import { formatMeasure, hasSpec, specCheck, type Measure, type Spec } from "../../shared/checks";
import type { CheckView, JudgeEntry } from "../../shared/schema";

const pass = "text-[#9fd59a]";
const failCls = "text-[#ff7a6b]";

// ── Measurements ──────────────────────────────

export function MeasurePanel({ measure, spec, reported }: { measure: Measure | null; spec: Spec | null; reported: Measure | null }) {
  const lines = measure && hasSpec(spec) ? specCheck(measure, spec) : [];
  // The team's browser measured too; a big difference means the units or the file changed.
  const largest = (m: Measure) => Math.max(m.w, m.d, m.h);
  const drift = !!measure && !!reported && Math.abs(largest(measure) / Math.max(largest(reported), 1e-9) - 1) > 0.01;
  return (
    <section aria-labelledby="measure-h" className="mt-8 border-t border-bone/10 pt-6">
      <h2 id="measure-h" className="font-body text-lg font-semibold tracking-[-0.01em] text-bone">
        Measurements
      </h2>
      {!measure ? (
        <p className="p-hint mt-2">Measured from the model once it loads.</p>
      ) : (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 font-body text-sm">
            <div>
              <dt className="text-concrete">Size (W × D × H)</dt>
              <dd className="p-mono mt-0.5 text-foreground">{formatMeasure(measure)}</dd>
            </div>
            <div>
              <dt className="text-concrete">Volume</dt>
              <dd className="p-mono mt-0.5 text-foreground">{measure.volume !== null ? `${(measure.volume / 1000).toFixed(2)} cm³` : "n/a (open mesh)"}</dd>
            </div>
            <div>
              <dt className="text-concrete">Surface area</dt>
              <dd className="p-mono mt-0.5 text-foreground">{(measure.area / 100).toFixed(1)} cm²</dd>
            </div>
            <div>
              <dt className="text-concrete">Mesh</dt>
              <dd className="mt-0.5 text-foreground">{measure.closed ? "Closed solid" : "Open (not watertight)"}</dd>
            </div>
          </dl>
          {lines.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1 font-body text-sm" aria-label="Size spec">
              {lines.map((l) => (
                <li key={l.label} className={l.ok === false ? failCls : l.ok ? pass : "text-concrete"}>
                  {l.ok === false ? "✕" : l.ok ? "✓" : "–"} {l.label}: {l.text}
                </li>
              ))}
            </ul>
          )}
          {drift && <p className="p-hint mt-3">The team's preview measured a different size. Check the units they picked.</p>}
          <p className="p-hint mt-3">Measured in your browser from the uploaded file.</p>
        </>
      )}
    </section>
  );
}

// ── Process ───────────────────────────────────

const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: /T00:00:00(\.000)?Z$/.test(iso) ? "UTC" : "America/Toronto" });

export function ProcessPanel({ entry }: { entry: JudgeEntry }) {
  const shots = entry.files.filter((f) => f.slot === "progress").sort((a, b) => String(a.uploadedAt).localeCompare(String(b.uploadedAt)));
  const model = entry.files.find((f) => f.slot === "model");
  const meta = entry.modelMeta;
  return (
    <section aria-labelledby="process-h" className="mt-8 border-t border-bone/10 pt-6">
      <h2 id="process-h" className="font-body text-lg font-semibold tracking-[-0.01em] text-bone">
        Process
      </h2>
      {entry.cadLink && (
        <a
          href={entry.cadLink}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ember mt-3 inline-flex items-center gap-2 font-body text-sm text-ember hover:text-foreground"
        >
          <ExternalLink size={15} strokeWidth={1.5} /> Open their CAD document (sketches and history)
        </a>
      )}
      {shots.length > 0 ? (
        <ol className="mt-4 flex flex-col gap-3" aria-label="Sketches and progress shots, in upload order">
          {shots.map((f, i) => (
            <li key={f.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="p-mono pt-1 text-[12px] text-concrete">{clock(f.uploadedAt)}</span>
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="focus-ember block overflow-hidden rounded-[2px] border border-bone/10">
                <img src={f.url} alt={`Progress shot ${i + 1}, uploaded ${clock(f.uploadedAt)}`} className="max-h-44 w-full object-cover object-top" loading="lazy" />
              </a>
            </li>
          ))}
          {model?.uploadedAt && (
            <li className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
              <span className="p-mono text-[12px] text-concrete">{clock(model.uploadedAt)}</span>
              <span className="font-body text-sm text-foreground/80">Final model uploaded</span>
            </li>
          )}
        </ol>
      ) : (
        <p className="p-hint mt-3">No sketches or progress shots. Ask to see their feature tree or timeline when they present.</p>
      )}
      <p className="p-hint mt-4">
        Times are when our server received each file, so they can't be backdated.
        {meta?.generator ? ` The model file names its exporter as “${meta.generator}”.` : " The model file doesn't name its exporter."}
        {meta?.created ? ` It says it was created ${day(meta.created)}.` : ""}
      </p>
      {entry.filesNote && (
        <p className="mt-3 font-body text-sm text-foreground/85">
          <span className="text-concrete">Team's note about their files: </span>
          {entry.filesNote}
        </p>
      )}
    </section>
  );
}

// ── Originality checks ────────────────────────

export function ChecksPanel({ entry, admin, onChange }: { entry: JudgeEntry; admin: boolean; onChange: (e: JudgeEntry) => void }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const review = entry.checks.filter((c) => c.level === "review");
  const info = entry.checks.filter((c) => c.level === "info");

  async function decide(c: CheckView, status: "cleared" | "confirmed" | null) {
    setBusy(c.id);
    setError("");
    try {
      const r = await api<{ entry: JudgeEntry }>(`/judge/entries/${entry.id}/checks/${c.id}`, { method: "PUT", body: { status } });
      onChange(r.entry);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  const border = (c: CheckView) =>
    c.review?.status === "cleared" ? "border-bone/10" : c.review?.status === "confirmed" ? "border-[hsl(var(--destructive)/0.6)]" : "border-ember/50";

  return (
    <section aria-labelledby="checks-h" className="mt-8 border-t border-bone/10 pt-6">
      <h2 id="checks-h" className="font-body text-lg font-semibold tracking-[-0.01em] text-bone">
        Originality checks
      </h2>
      <p className="p-hint mt-1">Evidence from the files, not a verdict. Organizers decide; the team only sees a neutral note.</p>
      {entry.checks.length === 0 && (
        <p className="mt-3 flex items-center gap-2 font-body text-sm text-foreground/80">
          <ShieldCheck size={16} strokeWidth={1.5} className={pass} /> Nothing found.
        </p>
      )}
      <ul className="mt-3 flex flex-col gap-3">
        {review.map((c) => (
          <li key={c.id} className={`border p-3 ${border(c)}`}>
            <p className="flex flex-wrap items-center gap-2 font-body text-[15px] font-medium text-foreground">
              <ShieldAlert size={16} strokeWidth={1.5} className={c.review?.status === "cleared" ? "text-concrete" : "text-ember"} />
              {c.title}
              {!c.review && <span className="p-tag p-tag--ember">Needs review</span>}
              {c.review?.status === "cleared" && <span className="p-tag">Cleared by {c.review.by}</span>}
              {c.review?.status === "confirmed" && <span className="p-tag p-tag--bad">Confirmed by {c.review.by}</span>}
            </p>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-foreground/80">{c.detail}</p>
            {admin && (
              <div className="mt-3 flex flex-wrap gap-2">
                {c.review ? (
                  <button type="button" className="btn-ghost p-btn p-btn-sm" disabled={busy === c.id} onClick={() => decide(c, null)}>
                    Reopen
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn-ghost p-btn p-btn-sm" disabled={busy === c.id} onClick={() => decide(c, "cleared")}>
                      Looks fine, clear it
                    </button>
                    <button
                      type="button"
                      className="btn-ghost p-btn p-btn-sm border-[hsl(var(--destructive)/0.6)] text-[hsl(6_90%_66%)]"
                      disabled={busy === c.id}
                      onClick={() => decide(c, "confirmed")}
                    >
                      Confirm it's a problem
                    </button>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
        {info.map((c) => (
          <li key={c.id} className="border border-bone/10 p-3">
            <p className="font-body text-[15px] font-medium text-foreground/90">{c.title}</p>
            <p className="mt-1 font-body text-sm leading-relaxed text-foreground/70">{c.detail}</p>
          </li>
        ))}
      </ul>
      {error && <p className="p-notice p-notice--bad mt-3 font-body text-sm">{error}</p>}
    </section>
  );
}
