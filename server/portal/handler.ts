// The portal's single entry point: (req, res) for any Node HTTP server.
// Builds the context once per process (config, storage driver, document
// store) and hands every request to the router.
import path from "node:path";
import { ConfigError, loadConfig } from "./config.js";
import { Db } from "./db.js";
import { sendJson, type Req, type Res } from "./http.js";
import { dispatch, type PortalContext } from "./routes.js";
import { BlobStorage } from "./storage/blob.js";
import { LocalStorage } from "./storage/local.js";

let ctx: PortalContext | null = null;

export function createContext(overrides: { localRoot?: string; now?: () => number } = {}): PortalContext {
  const cfg = loadConfig();
  const storage =
    cfg.storage === "blob"
      ? new BlobStorage()
      : new LocalStorage(overrides.localRoot ?? process.env.PORTAL_LOCAL_DIR ?? path.resolve(process.cwd(), ".data", "portal"), cfg.sessionSecret);
  return { cfg, db: new Db(storage), now: overrides.now };
}

export async function handlePortal(req: Req, res: Res): Promise<void> {
  try {
    ctx ??= createContext();
  } catch (e) {
    if (e instanceof ConfigError) {
      console.error("[portal]", e.message);
      return sendJson(res, 503, { error: "The submission portal isn't set up yet." });
    }
    throw e;
  }
  await dispatch(ctx, req, res);
}

/** Drops the cached context (tests, or after env changes in dev). */
export function resetPortal() {
  ctx = null;
}
