// Plays a submission's video: an uploaded file (a short-lived private URL in a
// <video>), or a linked one in the host's own player (YouTube, Drive, Vimeo,
// Loom). Hosts that can't be embedded (OneDrive, Dropbox) get an open link.
import { ExternalLink, Video } from "lucide-react";
import type { FileView } from "../shared/schema";
import { VIDEO_HOST_NAMES, type VideoHost } from "../shared/video";

export interface LinkedVideo {
  url: string;
  host: string;
  embed: string | null;
}

export default function VideoPlayer({
  file,
  link,
  title,
  className = "",
  localUrl,
  poster,
}: {
  file?: FileView | null;
  link?: LinkedVideo | null;
  title: string;
  className?: string;
  /** A picked file not uploaded yet (blob: URL), for the form's preview. */
  localUrl?: string | null;
  /** A still to show before it plays (the entry's card image). */
  poster?: string | null;
}) {
  const src = localUrl ?? file?.url ?? null;
  if (src) {
    return (
      <div className={`overflow-hidden rounded-[2px] border border-bone/10 bg-black ${className}`}>
        <video src={src} poster={poster ?? undefined} controls playsInline preload={poster ? "none" : "metadata"} className="aspect-video w-full bg-black" aria-label={`${title}, video`} />
      </div>
    );
  }
  if (link?.embed) {
    return (
      <div className={`overflow-hidden rounded-[2px] border border-bone/10 bg-black ${className}`}>
        <iframe
          src={link.embed}
          title={`${title}, video`}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          loading="lazy"
        />
      </div>
    );
  }
  if (link) {
    const host = VIDEO_HOST_NAMES[link.host as VideoHost] ?? "the host";
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`focus-ember flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-[2px] border border-bone/10 bg-[#0d0e10] font-body text-[15px] text-foreground/85 hover:text-foreground ${className}`}
      >
        <Video size={28} strokeWidth={1.3} className="text-ember" aria-hidden="true" />
        <span className="inline-flex items-center gap-1.5">
          Watch on {host} <ExternalLink size={14} strokeWidth={1.5} aria-hidden="true" />
        </span>
      </a>
    );
  }
  return null;
}

/**
 * A still from a video file (about a second in), as a PNG, for the entry's
 * card when there's no 3D model to capture. Null if the browser can't decode it.
 */
export function captureVideoFrame(file: File, maxWidth = 960): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    let settled = false;
    const done = (b: Blob | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(b);
    };
    const timer = window.setTimeout(() => done(null), 8000);
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = url;
    v.addEventListener("error", () => done(null), { once: true });
    v.addEventListener(
      "loadedmetadata",
      () => {
        v.currentTime = Math.min(1, (v.duration || 2) / 3);
      },
      { once: true },
    );
    v.addEventListener(
      "seeked",
      () => {
        const scale = Math.min(1, maxWidth / (v.videoWidth || maxWidth));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round((v.videoWidth || 640) * scale));
        c.height = Math.max(1, Math.round((v.videoHeight || 360) * scale));
        const ctx = c.getContext("2d");
        if (!ctx) return done(null);
        ctx.drawImage(v, 0, 0, c.width, c.height);
        window.clearTimeout(timer);
        c.toBlob((b) => done(b), "image/png");
      },
      { once: true },
    );
  });
}
