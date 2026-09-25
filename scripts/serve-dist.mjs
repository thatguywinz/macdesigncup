// A small Vercel-like static server for checking the prerendered build locally.
// `vite preview` is the wrong tool for that: it answers /partner and unknown
// URLs with the HOME page and a 200, which hides the 404 and fakes hydration
// mismatches. This one mirrors vercel.json:
//   - directory index (/partner -> partner/index.html)
//   - trailingSlash: false  (/partner/ -> 308 /partner)
//   - cleanUrls: true       (/x.html and /x/index.html -> 308 without them)
//   - unknown paths -> 404.html with HTTP 404
//   - the "headers" rules from vercel.json, including the host switch
//     (`missing` host), so curl -H "Host: www.macdesigncup.ca" behaves like prod
//   - compression: text responses go out brotli (or gzip) when the client
//     accepts it, as Vercel serves them. Without it a local Lighthouse run
//     measures ~300 KB of raw HTML and a 1 MB raw GalleryScene chunk that
//     production never sends, and overstates mobile LCP 2 to 3x.
//
// Usage: node scripts/serve-dist.mjs [dir=dist] [port=4173]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(repo, process.argv[2] || "dist");
const port = Number(process.argv[3] || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".jpg": "image/jpeg",
  ".json": "application/json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
};

// vercel.json header rules: `source` is treated as an anchored regex, which is
// exact for the patterns this project uses.
let rules = [];
try {
  rules = JSON.parse(fs.readFileSync(path.join(repo, "vercel.json"), "utf8")).headers ?? [];
} catch {
  /* no vercel.json: no extra headers */
}
const hostOf = (req) => String(req.headers.host ?? "").replace(/:\d+$/, "");
const conditionMet = (cond, req) => {
  if (cond.type !== "host") return false;
  const host = hostOf(req);
  const v = cond.value;
  return typeof v === "string" ? new RegExp(v).test(host) : v?.eq === host;
};
function headersFor(pathname, req) {
  const out = {};
  for (const rule of rules) {
    if (!new RegExp(`^${rule.source}$`).test(pathname)) continue;
    if (rule.has && !rule.has.every((c) => conditionMet(c, req))) continue;
    if (rule.missing && rule.missing.some((c) => conditionMet(c, req))) continue;
    for (const h of rule.headers) out[h.key] = h.value;
  }
  return out;
}

const isFile = (p) => {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
};

// Already-compressed formats (png, webp, woff2, ...) go out as they are.
const compressible = new Set([".html", ".js", ".css", ".svg", ".json", ".xml", ".txt", ".webmanifest", ".map"]);
/** file + encoding -> { mtimeMs, body }: each file is compressed once per build. */
const encoded = new Map();
/** The encoding to use for this request, preferring brotli, or null for identity. */
function negotiate(req, ext) {
  if (!compressible.has(ext)) return null;
  const accepted = String(req.headers["accept-encoding"] ?? "")
    .split(",")
    .map((part) => part.trim().split(";"))
    .filter(([, q]) => !q || Number(q.trim().replace(/^q=/, "")) > 0)
    .map(([name]) => name.trim().toLowerCase());
  if (accepted.includes("br")) return "br";
  if (accepted.includes("gzip")) return "gzip";
  return null;
}
const brotliOptions = (raw) => ({
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length,
  },
});
function compressed(file, encoding) {
  const key = `${file}\0${encoding}`;
  const { mtimeMs } = fs.statSync(file);
  const hit = encoded.get(key);
  if (hit && hit.mtimeMs === mtimeMs) return hit.body;
  const raw = fs.readFileSync(file);
  const body = encoding === "br" ? zlib.brotliCompressSync(raw, brotliOptions(raw)) : zlib.gzipSync(raw, { level: 9 });
  encoded.set(key, { mtimeMs, body });
  return body;
}
/**
 * Brotli at quality 11 takes a moment on the 1 MB GalleryScene chunk: compress
 * the build on the zlib thread pool at startup, so a first cold Lighthouse run
 * does not measure that as server time (a request that beats the warm-up
 * compresses its file on the spot).
 */
async function warm(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await warm(full);
    else if (compressible.has(path.extname(entry.name))) {
      try {
        const { mtimeMs } = fs.statSync(full);
        const raw = fs.readFileSync(full);
        const body = await new Promise((resolve, reject) =>
          zlib.brotliCompress(raw, brotliOptions(raw), (err, out) => (err ? reject(err) : resolve(out))),
        );
        const key = `${full}\0br`;
        if (!encoded.has(key)) encoded.set(key, { mtimeMs, body });
      } catch {
        /* a file that vanished mid-walk: the request path handles it */
      }
    }
  }
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const p = decodeURIComponent(url.pathname);
    const redirect = (to) => {
      res.writeHead(308, { Location: (to || "/") + url.search });
      res.end();
    };
    if (p !== "/" && p.endsWith("/")) return redirect(p.slice(0, -1)); // trailingSlash: false
    if (/(^|\/)index(\.html)?$/.test(p)) return redirect(p.replace(/\/?index(\.html)?$/, "")); // cleanUrls
    if (p.endsWith(".html")) return redirect(p.slice(0, -5)); // cleanUrls

    const candidates = [path.join(root, p), path.join(root, `${p}.html`), path.join(root, p, "index.html")];
    const file = candidates.find((c) => c.startsWith(root) && isFile(c));
    const send = (f, status) => {
      const ext = path.extname(f);
      const encoding = negotiate(req, ext);
      const headers = {
        "Content-Type": types[ext] || "application/octet-stream",
        ...headersFor(p, req),
      };
      // Tell caches the body depends on Accept-Encoding for every compressible
      // type, whichever encoding this request got.
      if (compressible.has(ext)) headers.Vary = "Accept-Encoding";
      if (encoding) {
        const body = compressed(f, encoding);
        res.writeHead(status, { ...headers, "Content-Encoding": encoding, "Content-Length": body.length });
        return res.end(req.method === "HEAD" ? undefined : body);
      }
      res.writeHead(status, { ...headers, "Content-Length": fs.statSync(f).size });
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(f).pipe(res);
    };
    if (file) return send(file, 200);
    const notFound = path.join(root, "404.html");
    if (isFile(notFound)) return send(notFound, 404);
    res.writeHead(404);
    res.end("Not found");
  })
  .listen(port, () => {
    console.log(`serving ${root} on http://localhost:${port}`);
    const t0 = Date.now();
    warm(root).then(
      () => console.log(`brotli cache warm (${encoded.size} files, ${Date.now() - t0} ms)`),
      () => {},
    );
  });
