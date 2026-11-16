// The judging schedule: every team's room and time, one column per room.
// Shown on /submit once submissions close, on the organizers' Schedule tab,
// and full screen on the big screen. Refreshes itself.
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Maximize2, Minimize2, Search, X } from "lucide-react";
import { api } from "../api";

export interface ScheduleSlot {
  teamName: string;
  title: string;
  room: string;
  at: string;
}

export interface ScheduleData {
  closed: boolean;
  rooms: string[];
  slotMinutes: number;
  start: string;
  end: string;
  now: string;
  slots: ScheduleSlot[];
  /** Organizers only: submitted teams without a slot yet. */
  waiting?: number;
}

const time = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });

/** Loads /schedule and reloads it every `everyMs` (default 20 s). */
export function useSchedule(everyMs = 20_000) {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    api<ScheduleData>("/schedule")
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    load();
    const id = setInterval(load, everyMs);
    return () => clearInterval(id);
  }, [load, everyMs]);
  return { data, error, reload: load };
}

/** Folds case and accents so "equipe" finds "Équipe". */
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export default function ScheduleBoard({ data, big = false, search = true }: { data: ScheduleData; big?: boolean; search?: boolean }) {
  const [q, setQ] = useState("");
  const [clock, setClock] = useState(() => Date.now());
  // Server time can differ from this screen's clock: keep the offset.
  const skew = useMemo(() => Date.parse(data.now) - Date.now(), [data.now]);
  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);
  const now = clock + skew;
  const step = data.slotMinutes * 60_000;

  const found = q.trim() ? data.slots.filter((s) => fold(s.teamName).includes(fold(q)) || fold(s.title).includes(fold(q))) : [];

  // Every room that has a team, even one renamed in Settings after slots were given out.
  const rooms = [...new Set([...data.rooms, ...data.slots.map((x) => x.room)])].sort();
  const byRoom = new Map(rooms.map((r) => [r, data.slots.filter((s) => s.room === r)]));

  // Big screen: size the rows so the longest room fits the screen without
  // scrolling (about 27 teams a room on the day), within readable limits.
  const [fit, setFit] = useState<number | null>(null);
  const longest = Math.max(1, ...[...byRoom.values()].map((l) => l.length));
  useEffect(() => {
    if (!big) return;
    const size = () => {
      const board = document.querySelector(".sb--big .sb-rooms");
      const top = board ? board.getBoundingClientRect().top + window.scrollY : 220;
      const room = window.innerHeight - top - 70; // room-name header and a margin
      // A row is about 1.75x its font size tall.
      setFit(Math.max(11, Math.min(34, Math.floor(room / longest / 1.75))));
    };
    size();
    // Fine-tune: step down until the page no longer scrolls.
    let frame = 0;
    const settle = () => {
      const over = document.documentElement.scrollHeight - window.innerHeight;
      if (over > 0) setFit((f) => (f && f > 10 ? f - 1 : f));
      if (over > 0 && ++frame < 40) requestAnimationFrame(settle);
    };
    requestAnimationFrame(settle);
    window.addEventListener("resize", size);
    document.addEventListener("fullscreenchange", size);
    return () => {
      window.removeEventListener("resize", size);
      document.removeEventListener("fullscreenchange", size);
    };
  }, [big, longest]);

  return (
    <div className={`sb ${big ? "sb--big" : ""}`} style={big && fit ? ({ ["--sb-fit" as string]: `${fit}px` } as CSSProperties) : undefined}>
      {search && (
        <div className="sb-search">
          <label htmlFor="sb-q" className="sb-search-label">
            Find your team
          </label>
          <div className="sb-search-box">
            <Search aria-hidden="true" size={18} strokeWidth={1.5} />
            <input id="sb-q" className="p-input" placeholder="Type your team name" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
            {q && (
              <button type="button" className="sb-clear focus-ember" aria-label="Clear search" onClick={() => setQ("")}>
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
          {q.trim() && (
            <div className="sb-found" role="status">
              {found.length === 0 ? (
                <p className="font-body text-foreground/75">No team called "{q.trim()}". Check the spelling, or find an organizer.</p>
              ) : (
                <ul>
                  {found.slice(0, 5).map((s) => (
                    <li key={`${s.room}${s.at}`}>
                      <strong>{s.teamName}</strong>
                      <span>
                        {s.room} at {time(s.at)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {data.slots.length === 0 ? (
        <p className="sb-empty font-body">No teams scheduled yet.</p>
      ) : (
        <div className="sb-rooms" style={{ ["--sb-cols" as string]: rooms.length } as CSSProperties}>
          {rooms.map((room) => {
            const list = byRoom.get(room) ?? [];
            return (
              <section key={room} className="sb-room" aria-label={`Room ${room}`}>
                <h2 className="sb-room-name">
                  {room}
                  <span>{list.length} teams</span>
                </h2>
                <ol>
                  {list.map((s) => {
                    const at = Date.parse(s.at);
                    const state = now >= at + step ? "done" : now >= at ? "now" : "";
                    const hit = q.trim() && found.includes(s);
                    return (
                      <li key={s.at} className={`sb-slot ${state ? `sb-slot--${state}` : ""} ${hit ? "sb-slot--hit" : ""}`}>
                        <time dateTime={s.at}>{time(s.at)}</time>
                        <span className="sb-team">
                          {s.teamName}
                          {state === "now" && <em>Presenting now</em>}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** A Full screen / Exit full screen toggle for the big screen. */
export function FullscreenButton({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const f = () => setOn(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  if (typeof document !== "undefined" && !document.fullscreenEnabled) return null;
  return (
    <button
      type="button"
      className={`btn-ghost p-btn focus-ember ${className}`}
      onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {})}
    >
      {on ? <Minimize2 size={15} strokeWidth={1.5} /> : <Maximize2 size={15} strokeWidth={1.5} />}
      {on ? "Exit full screen" : "Full screen"}
    </button>
  );
}

/** The schedule as a spreadsheet (CSV): one row per team. */
export function scheduleCsv(data: ScheduleData) {
  const cell = (raw: string) => {
    // A leading = + - @ would run as a formula in a spreadsheet.
    const v = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
    return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  const rows = [["Time", "Room", "Team", "Design"], ...data.slots.map((s) => [time(s.at), s.room, s.teamName, s.title])];
  return rows.map((r) => r.map(cell).join(",")).join("\r\n");
}
