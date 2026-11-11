// Step 2 of the form: the presentation video. A short guide to what a good
// video shows and how to record it, then either a link (checked: does it
// open without signing in?) or a small upload.
import { useState, type ReactNode } from "react";
import { CheckCircle2, CircleAlert, CircleHelp, Link2, Upload } from "lucide-react";
import { api } from "../api";
import { Field } from "./fields";
import { parseVideoLink, VIDEO_LINK_HINT, type VideoCheck } from "../shared/video";

export function VideoGuide() {
  return (
    <details className="group">
      <summary className="focus-ember cursor-pointer list-none font-body text-sm text-ember marker:hidden">How to record and share a video</summary>
      <ul className="mt-3 flex flex-col gap-1.5 font-body text-sm leading-relaxed text-foreground/85">
        <li>
          <span className="text-foreground">Record:</span> Windows <kbd className="p-mono">Win</kbd>+<kbd className="p-mono">Alt</kbd>+<kbd className="p-mono">R</kbd>, Mac{" "}
          <kbd className="p-mono">Cmd</kbd>+<kbd className="p-mono">Shift</kbd>+<kbd className="p-mono">5</kbd>, or a turntable render from your CAD app. 30 seconds to 2 minutes is plenty.
        </li>
        <li>
          <span className="text-foreground">YouTube:</span> upload as <b>Unlisted</b> (not Private) and copy the link.
        </li>
        <li>
          <span className="text-foreground">Google Drive:</span> Share → General access → <b>Anyone with the link</b>, copy the link.
        </li>
      </ul>
    </details>
  );
}

const CHECK_ICON: Record<VideoCheck["status"], ReactNode> = {
  public: <CheckCircle2 size={16} strokeWidth={1.8} className="text-[#9fd59a]" aria-hidden="true" />,
  private: <CircleAlert size={16} strokeWidth={1.8} className="text-[#ff7a6b]" aria-hidden="true" />,
  missing: <CircleAlert size={16} strokeWidth={1.8} className="text-[#ff7a6b]" aria-hidden="true" />,
  unknown: <CircleHelp size={16} strokeWidth={1.8} className="text-concrete" aria-hidden="true" />,
};

/** The "link or upload" choice, the link field and its access check. */
export function VideoChoice({
  mode,
  onMode,
  link,
  onLink,
  error,
  upload,
  savedCheck,
}: {
  mode: "link" | "upload";
  onMode: (m: "link" | "upload") => void;
  link: string;
  onLink: (v: string) => void;
  error?: string;
  /** The upload picker, rendered by the form. */
  upload: ReactNode;
  savedCheck?: VideoCheck | null;
}) {
  const [check, setCheck] = useState<VideoCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  const shown = check ?? savedCheck ?? null;

  async function runCheck() {
    setCheckError("");
    setCheck(null);
    if (!parseVideoLink(link)) {
      setCheckError(`Use a share link from ${VIDEO_LINK_HINT}.`);
      return;
    }
    setChecking(true);
    try {
      setCheck(await api<VideoCheck>("/video-check", { body: { url: link } }));
    } catch (e) {
      setCheckError((e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4" data-field-error={error ? "true" : undefined}>
      <div className="p-seg self-start" role="radiogroup" aria-label="How you're sending your video">
        <label>
          <input type="radio" name="videomode" className="sr-only" checked={mode === "link"} onChange={() => onMode("link")} />
          <Link2 size={15} strokeWidth={1.6} className="mr-1.5" aria-hidden="true" /> Paste a link
        </label>
        <label>
          <input type="radio" name="videomode" className="sr-only" checked={mode === "upload"} onChange={() => onMode("upload")} />
          <Upload size={15} strokeWidth={1.6} className="mr-1.5" aria-hidden="true" /> Upload the file
        </label>
      </div>
      {mode === "link" ? (
        <Field label="Video link" hint={`${VIDEO_LINK_HINT}. Make sure anyone with the link can watch it.`} error={error ?? (checkError || undefined)}>
          {(p) => (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                {...p}
                type="url"
                inputMode="url"
                className="p-input"
                placeholder="https://youtu.be/…"
                value={link}
                onChange={(e) => {
                  onLink(e.target.value);
                  setCheck(null);
                }}
              />
              <button type="button" className="btn-ghost p-btn shrink-0" onClick={runCheck} disabled={checking || !link.trim()}>
                {checking ? "Checking…" : "Check link"}
              </button>
            </div>
          )}
        </Field>
      ) : (
        upload
      )}
      {mode === "link" && shown && (
        <p className="flex items-start gap-2 font-body text-sm text-foreground/85" role="status">
          <span className="mt-0.5">{CHECK_ICON[shown.status]}</span>
          <span>
            {shown.note}
            {shown.status === "unknown" && " Open it in a private window to be sure judges can watch it."}
          </span>
        </p>
      )}
      {mode === "upload" && error && <p className="p-error">{error}</p>}
    </div>
  );
}
