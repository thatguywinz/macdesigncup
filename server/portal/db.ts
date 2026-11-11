// The portal's three documents. At this event's size (about 80 students, a
// handful of judges) three JSON documents with compare-and-swap writes are
// simpler and cheaper than a database: a dashboard refresh is two reads, and
// concurrent writes retry instead of overwriting each other.
//
//   portal/entries.json   every entry (drafts and submitted)
//   portal/scores.json    every judge's marks
//   portal/settings.json  organizer overrides (deadline, closed)
//
// Uploaded files live beside them under portal/files/<entry id>/.
import type { Spec } from "../../src/portal/shared/checks.js";
import type { EntryRecord, Score } from "../../src/portal/shared/schema.js";
import { PreconditionFailed, type Storage } from "./storage/types.js";

export const DOCS = {
  entries: "portal/entries.json",
  scores: "portal/scores.json",
  settings: "portal/settings.json",
} as const;

export interface EntriesDoc {
  v: 1;
  entries: Record<string, EntryRecord>;
}

export interface JudgeSheet {
  name: string;
  role: "judge" | "admin";
  scores: Record<string, Score>;
}

export interface ScoresDoc {
  v: 1;
  /** judge key (normalized name) -> their sheet */
  judges: Record<string, JudgeSheet>;
}

export interface RoomsSetup {
  names: string[];
  start: string;
  /** When judging should be over: the schedule warns if teams run past it. */
  end: string;
  slotMinutes: number;
  /** judge key -> room name */
  judgeRooms: Record<string, string>;
}

export const DEFAULT_ROOMS: RoomsSetup = {
  names: ["WFL632", "WFL634", "WFL637"],
  start: "2026-11-16T14:10:00-05:00",
  end: "2026-11-16T15:20:00-05:00",
  // A 1-minute pitch, then 1 to 2 minutes of scoring while the next team sets up.
  slotMinutes: 3,
  judgeRooms: {},
};

export interface SettingsDoc {
  v: 1;
  /**
   * Organizer-managed judges list (display names). When it has names, only
   * those people can sign in as judges and only their marks count.
   */
  judges?: string[];
  /** When the theme is revealed (originality: files dated earlier are flagged). */
  revealAt?: string;
  /** Optional size spec for the theme. */
  spec?: Spec | null;
  /**
   * The public /submissions page: "off" (default), "all" submitted entries
   * that allow sharing, or only the ones organizers "selected" (gallery).
   */
  publicListing?: "off" | "all" | "selected";
  /**
   * Teams need the day's entry code to start an entry (default on). Off: the
   * form opens to anyone at the theme reveal time instead.
   */
  entryCodeOn?: boolean;
  /** Judging rooms: names, when judging starts, minutes per team, and which room each judge sits in. */
  rooms?: RoomsSetup;
  /** entry id -> its judging room and time (made by organizers after submissions close). */
  schedule?: Record<string, { room: string; at: string }>;
  /** Replaces the configured deadline (an organizer extended or moved it). */
  deadlineOverride: string | null;
  /** Organizer closed submissions early, whatever the clock says. */
  closed: boolean;
}

const EMPTY = {
  entries: (): EntriesDoc => ({ v: 1, entries: {} }),
  scores: (): ScoresDoc => ({ v: 1, judges: {} }),
  settings: (): SettingsDoc => ({ v: 1, deadlineOverride: null, closed: false }),
};

type DocName = keyof typeof DOCS;
type DocType = { entries: EntriesDoc; scores: ScoresDoc; settings: SettingsDoc };

/** Storage key for an upload: ids and the extension only, never the student's file name. */
/**
 * Storage namespace. Production uses the store's root; preview and
 * development deployments get their own folder, so testing a preview never
 * touches the live portal's entries (both use the same Blob store).
 * PORTAL_NAMESPACE overrides it (local tests against the real store).
 */
export function namespace(): string {
  const env = process.env;
  const ns = env.PORTAL_NAMESPACE ?? (env.VERCEL_ENV && env.VERCEL_ENV !== "production" ? env.VERCEL_ENV : "");
  const clean = ns.replace(/[^A-Za-z0-9_-]/g, "");
  return clean ? `${clean}/` : "";
}

export const filePath = (entryId: string, fileId: string, ext: string) => `${namespace()}portal/files/${entryId}/${fileId}.${ext}`;

export class Db {
  /** A very short read cache: a burst of dashboard polls costs one read. */
  private cache = new Map<string, { at: number; value: unknown; etag: string | null }>();

  constructor(
    readonly storage: Storage,
    private readonly cacheMs = 1500,
  ) {}

  async read<N extends DocName>(name: N, { fresh = false } = {}): Promise<DocType[N]> {
    const path = namespace() + DOCS[name];
    const hit = this.cache.get(path);
    if (!fresh && hit && Date.now() - hit.at < this.cacheMs) return structuredClone(hit.value) as DocType[N];
    const doc = await this.storage.getDoc<DocType[N]>(path);
    const value = doc?.value ?? (EMPTY[name]() as DocType[N]);
    this.cache.set(path, { at: Date.now(), value, etag: doc?.etag ?? null });
    return structuredClone(value);
  }

  /**
   * Read-modify-write with optimistic concurrency. `fn` may run more than
   * once (on a conflict it reruns against the fresh document), so keep it
   * free of side effects; it returns the result to hand back. Throwing from
   * `fn` aborts without writing.
   */
  async mutate<N extends DocName, R>(name: N, fn: (doc: DocType[N]) => R): Promise<R> {
    const path = namespace() + DOCS[name];
    for (let attempt = 0; attempt < 10; attempt++) {
      const current = await this.storage.getDoc<DocType[N]>(path);
      const doc = current?.value ?? (EMPTY[name]() as DocType[N]);
      const result = fn(doc);
      try {
        const etag = await this.storage.putDoc(path, doc, current?.etag ?? null);
        this.cache.set(path, { at: Date.now(), value: structuredClone(doc), etag });
        return result;
      } catch (e) {
        if (!(e instanceof PreconditionFailed)) throw e;
        this.cache.delete(path);
        // Back off a little, with jitter, before trying again.
        await new Promise((r) => setTimeout(r, 25 + Math.random() * 60 * (attempt + 1)));
      }
    }
    throw new Error(`Too many concurrent writes to ${path}. Try again.`);
  }
}
