// Settings: judging rooms and the schedule. Organizers name the rooms, set
// when judging starts and how long each team gets, put each judge in a room,
// then press "Make the schedule" once submissions close. Every team then sees
// its room and time on its entry page, and each judge gets their room's queue.
import { useEffect, useState } from "react";
import { when } from "../../api";

export interface RoomsSettings {
  names: string[];
  start: string;
  end: string;
  slotMinutes: number;
  judgeRooms: Record<string, string>;
}

/** ISO -> value for <input type="datetime-local"> in this browser's time zone. */
function localInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Same key the server uses for a judge's name. */
const keyOf = (name: string) =>
  name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export default function RoomsSection({
  rooms,
  judges,
  scheduled,
  scheduleEnds,
  open,
  busy,
  onSave,
  onSchedule,
}: {
  rooms: RoomsSettings;
  judges: string[];
  scheduled: number;
  scheduleEnds: string | null;
  open: boolean;
  busy: boolean;
  onSave: (body: Record<string, unknown>, msg: string) => void;
  onSchedule: (action: "make" | "clear") => void;
}) {
  const [names, setNames] = useState(rooms.names.join(", "));
  const [start, setStart] = useState(localInput(rooms.start));
  const [end, setEnd] = useState(localInput(rooms.end));
  const [minutes, setMinutes] = useState(String(rooms.slotMinutes));
  const [seats, setSeats] = useState<Record<string, string>>({});
  useEffect(() => {
    setNames(rooms.names.join(", "));
    setStart(localInput(rooms.start));
    setEnd(localInput(rooms.end));
    setMinutes(String(rooms.slotMinutes));
    setSeats(Object.fromEntries(judges.map((j) => [j, rooms.judgeRooms[keyOf(j)] ?? ""])));
  }, [rooms, judges]);

  const roomList = names
    .split(/[,\n]/)
    .map((n) => n.trim())
    .filter(Boolean);

  return (
    <section className="border-t border-bone/10 py-7">
      <h2 className="p-block-title">Judging rooms and schedule</h2>
      <p className="p-hint mt-1 max-w-[38rem]">
        The schedule makes itself the moment submissions close: every team gets a room and a time, shown on their entry page, and each judging pair
        works through their room in order. Pressing the button adds any entries without a time; entries that have one keep it.
      </p>

      <div className="mt-5 grid max-w-[46rem] gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <label className="block">
          <span className="p-label">Rooms</span>
          <input className="p-input mt-2" value={names} onChange={(e) => setNames(e.target.value)} aria-describedby="rooms-hint" />
          <span id="rooms-hint" className="p-hint mt-1 block">
            Separated by commas.
          </span>
        </label>
        <label className="block">
          <span className="p-label">Judging starts</span>
          <input type="datetime-local" className="p-input mt-2 w-auto" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="block">
          <span className="p-label">Judging ends</span>
          <input type="datetime-local" className="p-input mt-2 w-auto" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <label className="block">
          <span className="p-label">Minutes per team</span>
          <input type="number" min={1} max={30} className="p-input mt-2 w-24" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </label>
      </div>

      {judges.length > 0 && (
        <div className="mt-6 max-w-[38rem]">
          <p className="p-label">Which room each judge is in</p>
          <ul className="mt-2 flex flex-col divide-y divide-bone/10 border-y border-bone/10">
            {judges.map((j) => (
              <li key={j} className="flex items-center justify-between gap-3 py-2 font-body text-[15px]">
                <span className="truncate text-foreground">{j}</span>
                <select className="p-select w-40" value={seats[j] ?? ""} onChange={(e) => setSeats((s) => ({ ...s, [j]: e.target.value }))} aria-label={`Room for ${j}`}>
                  <option value="">Any room</option>
                  {roomList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        className="btn-ghost p-btn mt-4"
        disabled={busy || !roomList.length || !start || !end}
        onClick={() =>
          onSave(
            { rooms: { names: roomList, start: new Date(start).toISOString(), end: new Date(end).toISOString(), slotMinutes: Number(minutes), judgeRooms: Object.fromEntries(Object.entries(seats).filter(([, r]) => r)) } },
            "Rooms saved.",
          )
        }
      >
        Save rooms
      </button>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <button type="button" className="btn-portal p-btn" disabled={busy} onClick={() => onSchedule("make")}>
          {scheduled ? "Add new entries to the schedule" : "Make the schedule"}
        </button>
        {scheduled > 0 && (
          <button type="button" className="btn-ghost p-btn" disabled={busy} onClick={() => onSchedule("clear")}>
            Clear it
          </button>
        )}
        <span className="font-body text-sm text-concrete">
          {scheduled ? `${scheduled} ${scheduled === 1 ? "entry has" : "entries have"} a time. See it on Live.` : `Starts ${when(rooms.start)}.`}
          {open && !scheduled ? " It's made by itself when submissions close." : ""}
        </span>
      </div>
      {scheduleEnds && (
        <p className={`mt-3 max-w-[38rem] font-body text-sm ${Date.parse(scheduleEnds) > Date.parse(rooms.end) ? "p-notice p-notice--bad" : "text-foreground/80"}`}>
          {Date.parse(scheduleEnds) > Date.parse(rooms.end)
            ? `The last team finishes at ${when(scheduleEnds)}, after judging ends (${when(rooms.end)}). Shorten the minutes per team or add a room, then clear and make it again.`
            : `The last team finishes at ${when(scheduleEnds)}.`}
        </p>
      )}
    </section>
  );
}
