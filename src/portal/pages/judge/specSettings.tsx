// Settings sections for the size spec and the theme reveal time.
import { useEffect, useState } from "react";
import type { Spec } from "../../shared/checks";

type Save = (body: Record<string, unknown>, message: string) => Promise<void> | void;

const toStr = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));
const toNum = (s: string) => (s.trim() === "" ? null : Number(s));

/** ISO -> value for <input type="datetime-local"> in this browser's time zone. */
function localInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SpecSection({ settings, busy, onSave }: { settings: { spec: Spec | null }; busy: boolean; onSave: Save }) {
  const spec = settings.spec;
  const [f, setF] = useState({ maxW: "", maxD: "", maxH: "", target: "", tol: "2", note: "" });
  useEffect(() => {
    setF({
      maxW: toStr(spec?.maxW),
      maxD: toStr(spec?.maxD),
      maxH: toStr(spec?.maxH),
      target: toStr(spec?.volume?.target),
      tol: toStr(spec?.volume?.tolerancePct ?? 2),
      note: spec?.note ?? "",
    });
  }, [spec]);
  const field = (key: keyof typeof f, label: string, unit: string) => (
    <label className="block">
      <span className="p-label">{label}</span>
      <span className="mt-2 flex items-center gap-2">
        <input className="p-input w-28" inputMode="decimal" value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} />
        <span className="font-body text-sm text-concrete">{unit}</span>
      </span>
    </label>
  );
  const body = () => ({
    spec: {
      maxW: toNum(f.maxW),
      maxD: toNum(f.maxD),
      maxH: toNum(f.maxH),
      volume: toNum(f.target) === null ? null : { target: toNum(f.target), tolerancePct: Number(f.tol || 0) },
      note: f.note,
    },
  });
  return (
    <section className="border-t border-bone/10 py-7">
      <h2 className="p-block-title">Size spec</h2>
      <p className="p-hint mt-1 max-w-[38rem]">
        Optional, if the theme comes with a size limit. Teams see a live pass or fail in their preview, judges see it on every entry and the
        viewer draws the limit as a box. Leave everything blank for no spec. A target volume works like a CAD speed-modelling check: the model's
        measured volume against a target, within a tolerance.
      </p>
      <div className="mt-5 flex flex-wrap gap-5">
        {field("maxW", "Max width", "mm")}
        {field("maxD", "Max depth", "mm")}
        {field("maxH", "Max height", "mm")}
      </div>
      <div className="mt-5 flex flex-wrap gap-5">
        {field("target", "Target volume", "cm³")}
        {field("tol", "Tolerance", "±%")}
      </div>
      <label className="mt-5 block max-w-[26rem]">
        <span className="p-label">Shown to teams as</span>
        <input className="p-input mt-2" placeholder="Fits in a 150 mm cube" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      </label>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="btn-ghost p-btn" disabled={busy} onClick={() => onSave(body(), "Spec saved.")}>
          Save spec
        </button>
        {spec && (
          <button type="button" className="btn-ghost p-btn" disabled={busy} onClick={() => onSave({ spec: null }, "Spec removed.")}>
            Remove spec
          </button>
        )}
      </div>
    </section>
  );
}

export function RevealInput({ value, busy, onSave }: { value: string; busy: boolean; onSave: (iso: string) => void }) {
  const [v, setV] = useState(() => localInput(value));
  useEffect(() => setV(localInput(value)), [value]);
  return (
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <input type="datetime-local" className="p-input w-auto" value={v} onChange={(e) => setV(e.target.value)} aria-label="Theme reveal time" />
      <button type="button" className="btn-ghost p-btn" disabled={busy || !v} onClick={() => onSave(new Date(v).toISOString())}>
        Save reveal time
      </button>
    </div>
  );
}
