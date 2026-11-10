// Opens a team's video link the way a judge without an account would, and
// reports whether it plays: "public" (anyone with the link), "private" (asks
// to sign in or request access), "missing" (deleted or mistyped) or "unknown"
// (the host gave no clear answer). Best effort, never blocking: only hosts we
// parse, a short timeout, and the team is told what to fix.
import { parseVideoLink, VIDEO_HOST_NAMES, type VideoCheck } from "../../src/portal/shared/video.js";

const TIMEOUT = 6000;

async function get(url: string, opts: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...opts, signal: AbortSignal.timeout(TIMEOUT), headers: { "User-Agent": "Mozilla/5.0 (link check)", ...(opts.headers ?? {}) } });
}

export async function checkVideoLink(raw: string, now = () => new Date().toISOString()): Promise<VideoCheck> {
  const at = now();
  // Tests run offline.
  if (process.env.PORTAL_SKIP_VIDEO_CHECK) return { status: "unknown", note: "Not checked (test run).", at };
  const v = parseVideoLink(raw);
  if (!v) return { status: "unknown", note: "That isn't a link we can check.", at };
  const name = VIDEO_HOST_NAMES[v.host];
  try {
    if (v.host === "youtube" || v.host === "vimeo" || v.host === "loom") {
      // oEmbed answers for videos anyone with the link can watch (YouTube Unlisted included).
      const api =
        v.host === "youtube"
          ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(v.url)}`
          : v.host === "vimeo"
            ? `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(v.url)}`
            : `https://www.loom.com/v1/oembed?url=${encodeURIComponent(v.url)}`;
      const r = await get(api);
      if (r.ok) return { status: "public", note: `Plays for anyone with the link on ${name}.`, at };
      if (r.status === 401 || r.status === 403) return { status: "private", note: `${name} says this video is private. Set it to Unlisted or Public.`, at };
      if (r.status === 404 || r.status === 400) return { status: "missing", note: `${name} can't find this video. Check the link.`, at };
      return { status: "unknown", note: `${name} didn't say whether this plays (HTTP ${r.status}).`, at };
    }
    if (v.host === "drive") {
      // Drive redirects a restricted file to the Google sign-in page.
      const r = await get(v.url.replace(/\/(edit|view)(\?.*)?$/, "/view"), { redirect: "manual" });
      const loc = r.headers.get("location") ?? "";
      if (r.status >= 300 && r.status < 400 && /accounts\.google\.com|ServiceLogin/.test(loc)) {
        return { status: "private", note: "Google Drive asks judges to sign in. Share it as Anyone with the link → Viewer.", at };
      }
      if (r.status === 404) return { status: "missing", note: "Google Drive can't find this file. Check the link.", at };
      if (r.ok) {
        const html = (await r.text()).slice(0, 200_000);
        if (/accounts\.google\.com\/ServiceLogin|You need access|Request access/i.test(html)) {
          return { status: "private", note: "Google Drive asks judges to request access. Share it as Anyone with the link → Viewer.", at };
        }
        return { status: "public", note: "Opens for anyone with the link on Google Drive.", at };
      }
      return { status: "unknown", note: `Google Drive answered HTTP ${r.status}.`, at };
    }
    // OneDrive and Dropbox: does the link open without signing in?
    const r = await get(v.url, { redirect: "manual" });
    const loc = r.headers.get("location") ?? "";
    if (/login\.live\.com|login\.microsoftonline\.com|dropbox\.com\/login/.test(loc)) {
      return { status: "private", note: `${name} asks judges to sign in. Change the link to anyone-can-view.`, at };
    }
    if (r.status === 404) return { status: "missing", note: `${name} can't find this file. Check the link.`, at };
    if (r.ok || (r.status >= 300 && r.status < 400)) return { status: "public", note: `${name} opened it without signing in.`, at };
    return { status: "unknown", note: `${name} answered HTTP ${r.status}.`, at };
  } catch {
    return { status: "unknown", note: `Couldn't reach ${name} to check. Open the link in a private window to be sure.`, at };
  }
}
