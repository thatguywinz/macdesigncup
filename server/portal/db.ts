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
import { HttpError } from "./http.js";
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
  start: "2026-11-16T14:00:00-05:00", // judging starts 2:00 PM (organizers, 2026-11-14)
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
  /** When the schedule first made itself at the deadline. */
  autoScheduledAt?: string;
  /** Organizers cleared the schedule after the deadline: it doesn't make itself again until they press "make". */
  scheduleOff?: boolean;
  /** Top 5 meeting: entry id -> why it placed, written by organizers. */
  finalNotes?: Record<string, string>;
  /** Replaces the configured deadline (an organizer extended or moved it). */
  deadlineOverride: string | null;
  /** Organizer closed submissions early, whatever the clock says. */
  closed: boolean;
  /** When "Close submissions now" was ticked: an on-time Submit may still finish for FINISH_MINUTES after it. */
  closedAt?: string;
}

/** Return this from a mutate() callback that decided not to change anything. */
export const NO_CHANGE: unique symbol = Symbol("no change");

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

/** Entries are split over this many files (portal/entries/<n>.json) so saves at the same moment rarely collide. */
export const ENTRY_SHARDS = 8;

/** Which shard an entry id lives in (new entries; old ones stay where they are). */
export function shardOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % ENTRY_SHARDS;
}

export class Db {
  /** A very short read cache: a burst of dashboard polls costs one read. */
  private cache = new Map<string, { at: number; value: unknown; etag: string | null }>();

  constructor(
    readonly storage: Storage,
    private readonly cacheMs = 1500,
    private readonly writeBudgetMs = 20_000,
  ) {}

  /** Where a document lives: one file, or (entries) the old single file plus its shards. */
  private parts(name: DocName): string[] {
    const base = namespace() + DOCS[name];
    if (name !== "entries") return [base];
    return [base, ...Array.from({ length: ENTRY_SHARDS }, (_, i) => `${namespace()}portal/entries/${i}.json`)];
  }

  private async load<N extends DocName>(name: N) {
    const paths = this.parts(name);
    const got = await Promise.all(paths.map((p) => this.storage.getDoc<DocType[N]>(p)));
    if (name !== "entries") {
      return { paths, got, value: (got[0]?.value ?? EMPTY[name]()) as DocType[N], owner: new Map<string, number>() };
    }
    // Merge: every entry stays in the part that already holds it.
    const owner = new Map<string, number>();
    const merged = EMPTY.entries();
    got.forEach((g, i) => {
      for (const [id, e] of Object.entries((g?.value as EntriesDoc | undefined)?.entries ?? {})) {
        if (owner.has(id)) continue;
        owner.set(id, i);
        merged.entries[id] = structuredClone(e);
      }
    });
    return { paths, got, value: merged as DocType[N], owner };
  }

  async read<N extends DocName>(name: N, { fresh = false } = {}): Promise<DocType[N]> {
    const key = namespace() + DOCS[name];
    const hit = this.cache.get(key);
    if (!fresh && hit && Date.now() - hit.at < this.cacheMs) return structuredClone(hit.value) as DocType[N];
    const { value } = await this.load(name);
    this.cache.set(key, { at: Date.now(), value, etag: null });
    return structuredClone(value);
  }

  /**
   * Read-modify-write with optimistic concurrency. `fn` may run more than
   * once (on a conflict it reruns against the fresh document), so keep it
   * free of side effects; it returns the result to hand back. Throwing from
   * `fn` aborts without writing.
   *
   * Entries are split over ENTRY_SHARDS files by entry id, so teams saving at
   * the same moment mostly write different files: one shared file managed
   * only 2 to 3 writes a second, and a simulated deadline rush of 40 teams
   * failed a fifth of saves (tmp/load/cas-sim.ts). `fn` still sees every
   * entry; only the parts it changed are written, each with its ETag.
   */
  async mutate<N extends DocName, R>(name: N, fn: (doc: DocType[N]) => R): Promise<R> {
    const key = namespace() + DOCS[name];
    // Keep trying for a while rather than a fixed number of times (stays
    // well under the function's 60 s limit).
    const started = Date.now();
    for (let attempt = 0; attempt === 0 || Date.now() - started < this.writeBudgetMs; attempt++) {
      const { paths, got, value, owner } = await this.load(name);
      const result = fn(value);
      // Nothing to change: skip the write (and the ETag race with other writers).
      if (result === NO_CHANGE) return result;
      let writes: { i: number; doc: unknown }[];
      if (name === "entries") {
        const next = paths.map(() => EMPTY.entries());
        for (const [id, e] of Object.entries((value as EntriesDoc).entries)) next[owner.get(id) ?? 1 + shardOf(id)].entries[id] = e;
        writes = next
          .map((doc, i) => ({ i, doc }))
          .filter(({ i, doc }) => JSON.stringify((got[i]?.value as EntriesDoc | undefined)?.entries ?? {}) !== JSON.stringify(doc.entries));
      } else {
        writes = [{ i: 0, doc: value }];
      }
      try {
        for (const w of writes) await this.storage.putDoc(paths[w.i], w.doc, got[w.i]?.etag ?? null);
        this.cache.set(key, { at: Date.now(), value: structuredClone(value), etag: null });
        return result;
      } catch (e) {
        if (!(e instanceof PreconditionFailed)) throw e;
        this.cache.delete(key);
        // Back off with full jitter (growing, capped) so writers spread out.
        const cap = Math.min(1500, 60 * 1.5 ** attempt);
        await new Promise((r) => setTimeout(r, 20 + Math.random() * cap));
      }
    }
    throw new HttpError(503, "Lots of teams are saving right now. Wait a few seconds and try again.", { retryAfter: 3, busy: true });
  }
}
