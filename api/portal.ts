// Vercel serverless function for the submission portal. vercel.json rewrites
// /api/portal/<anything> to /api/portal?__path=<anything>, so this one function
// serves the whole API (one function counts once against plan limits).
// Uploads never pass through here: browsers send files straight to the
// private Blob store with presigned URLs, so the 4.5 MB body limit is moot.
import type { IncomingMessage, ServerResponse } from "node:http";
import { handlePortal } from "../server/portal/handler.js";

export const config = { maxDuration: 30 };

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await handlePortal(req, res);
}
