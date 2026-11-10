// ─────────────────────────────────────────────
// Submission portal · video links. Teams can paste a link instead of
// uploading (the store is small; YouTube and Drive are not). Only hosts we can
// embed or at least open are accepted; each gets an embed URL for the share
// page and the judges' view, and a thumbnail where the host offers one.
// ─────────────────────────────────────────────

export type VideoHost = "youtube" | "vimeo" | "drive" | "loom" | "onedrive" | "dropbox";

export interface VideoLink {
  host: VideoHost;
  /** The link as the team gave it, normalized. */
  url: string;
  /** An iframe src that plays it, when the host allows embedding. */
  embed: string | null;
  /** A poster image URL, when the host offers one without signing in. */
  thumb: string | null;
}

export const VIDEO_HOST_NAMES: Record<VideoHost, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  drive: "Google Drive",
  loom: "Loom",
  onedrive: "OneDrive",
  dropbox: "Dropbox",
};

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** Parses a video link. Null when it isn't an https link on a host we support. */
export function parseVideoLink(raw: string): VideoLink | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase().replace(/^www\.|^m\./, "");
  const url = u.toString();

  if (host === "youtu.be" || host === "youtube.com" || host === "music.youtube.com") {
    let id = "";
    if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0];
    else if (u.pathname === "/watch") id = u.searchParams.get("v") ?? "";
    else {
      const m = /^\/(?:shorts|embed|live)\/([^/?#]+)/.exec(u.pathname);
      id = m?.[1] ?? "";
    }
    if (!YT_ID.test(id)) return null;
    return { host: "youtube", url, embed: `https://www.youtube-nocookie.com/embed/${id}`, thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const m = /\/(?:video\/)?(\d{6,12})(?:\/([0-9a-f]{6,}))?/.exec(u.pathname);
    if (!m) return null;
    const hash = m[2] ?? u.searchParams.get("h");
    return { host: "vimeo", url, embed: `https://player.vimeo.com/video/${m[1]}${hash ? `?h=${hash}` : ""}`, thumb: null };
  }
  if (host === "drive.google.com") {
    const m = /\/file\/d\/([A-Za-z0-9_-]{10,})/.exec(u.pathname);
    const id = m?.[1] ?? u.searchParams.get("id");
    if (!id || !/^[A-Za-z0-9_-]{10,}$/.test(id)) return null;
    return { host: "drive", url, embed: `https://drive.google.com/file/d/${id}/preview`, thumb: null };
  }
  if (host === "loom.com") {
    const m = /\/(?:share|embed)\/([0-9a-f]{32})/.exec(u.pathname);
    if (!m) return null;
    return { host: "loom", url, embed: `https://www.loom.com/embed/${m[1]}`, thumb: null };
  }
  if (host === "1drv.ms" || host === "onedrive.live.com" || host.endsWith(".sharepoint.com")) {
    return { host: "onedrive", url, embed: null, thumb: null };
  }
  if (host === "dropbox.com") {
    return { host: "dropbox", url, embed: null, thumb: null };
  }
  return null;
}

export const VIDEO_LINK_HINT = "YouTube (Unlisted is fine), Google Drive, Vimeo, Loom, OneDrive or Dropbox";

/** What the link check found when the server opened the link without signing in. */
export interface VideoCheck {
  status: "public" | "private" | "missing" | "unknown";
  /** Short, plain explanation for the team or judges. */
  note: string;
  at: string;
}
