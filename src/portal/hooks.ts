import { useEffect, useState } from "react";
import { api } from "./api";
import type { PortalStatus } from "./shared/schema";

export type Status = PortalStatus & { devDefaults: boolean; storage: string };

/** The portal's open/closed state and deadline. Refreshes every minute. */
export function usePortalStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let alive = true;
    let retry = 0;
    const load = () =>
      api<Status>("/status")
        .then((s) => {
          if (!alive) return;
          setStatus(s);
          setOffset(Date.parse(s.now) - Date.now());
        })
        // A failed first load would leave the form waiting a minute: try again soon.
        .catch(() => {
          if (alive) retry = window.setTimeout(load, 3000);
        });
    void load();
    const t = window.setInterval(load, 60_000);
    return () => {
      alive = false;
      window.clearInterval(t);
      window.clearTimeout(retry);
    };
  }, []);
  return { status, serverOffset: offset };
}

/** The current time, ticking every `ms`. */
export function useNow(ms = 1000, offset = 0) {
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    setNow(Date.now() + offset);
    const t = window.setInterval(() => setNow(Date.now() + offset), ms);
    return () => window.clearInterval(t);
  }, [ms, offset]);
  return now;
}

/** "1:04:09" / "12:30" until a time; "" once it has passed. */
export function countdown(to: number, now: number): string {
  const s = Math.max(0, Math.floor((to - now) / 1000));
  if (s <= 0) return "";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

// ── Entries started on this device ────────────
// A convenience so a team that closes the tab can find its edit link again
// on the same laptop. The edit link itself stays the real key.
const STORE = "mdc-portal-entries";

export interface SavedEntry {
  id: string;
  key: string;
  title: string;
  at: string;
}

export function savedEntries(): SavedEntry[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => x && typeof x.id === "string" && typeof x.key === "string") : [];
  } catch {
    return [];
  }
}

export function rememberEntry(e: SavedEntry) {
  try {
    const rest = savedEntries().filter((x) => x.id !== e.id);
    localStorage.setItem(STORE, JSON.stringify([e, ...rest].slice(0, 6)));
  } catch {
    /* private mode: the link still works */
  }
}

export function forgetEntry(id: string) {
  try {
    localStorage.setItem(STORE, JSON.stringify(savedEntries().filter((x) => x.id !== id)));
  } catch {
    /* ignore */
  }
}

export function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return match;
}
