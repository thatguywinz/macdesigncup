// Organizers: the judging schedule. Rooms and times are given out by
// themselves when submissions close; "Give out time slots now" does it on
// demand (for teams already submitted). Big screen and spreadsheet from here.
import { useState } from "react";
import { CalendarClock, Download, ExternalLink } from "lucide-react";
import { ApiError, api, clock } from "../../api";
import ScheduleBoard, { scheduleCsv, useSchedule } from "../../components/ScheduleBoard";
import { JudgeShell, useMe } from "./context";

export default function SchedulePage() {
  const { signOut } = useMe();
  const { data, error, reload } = useSchedule(15_000);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const make = async () => {
    setBusy(true);
    setMsg("");
    try {
      await api("/judge/schedule", { method: "POST", body: { action: "make" } });
      reload();
      setMsg("Time slots given out.");
    } catch (e) {
      if ((e as ApiError).status === 401) return signOut();
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!data) return;
    const url = URL.createObjectURL(new Blob(["﻿" + scheduleCsv(data)], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "mdc-judging-schedule.csv" });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const last = data?.slots.length ? data.slots.reduce((m, s) => (s.at > m ? s.at : m), data.slots[0].at) : null;
  const ends = last && data ? new Date(Date.parse(last) + data.slotMinutes * 60_000).toISOString() : null;
  const overrun = !!(ends && data && Date.parse(ends) > Date.parse(data.end));

  return (
    <JudgeShell section="Schedule">
      <div className="flex flex-col gap-4 pt-10 md:flex-row md:items-end md:justify-between md:pt-12">
        <div>
          <h1 className="display-scene">Schedule</h1>
          <p className="mt-3 max-w-[44rem] font-body text-[15px] text-foreground/75">
            {data
              ? `Judging ${clock(data.start)} to ${clock(data.end)} in ${data.rooms.length} rooms, ${data.slotMinutes} minutes per team. When submissions close, every submitted team gets a room and time by itself, in the order they submitted. Teams see theirs on macdesigncup.ca/submit and on their edit link.`
              : "Loading…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/submit?screen" target="_blank" rel="noreferrer" className="btn-ghost p-btn focus-ember">
            <ExternalLink size={15} strokeWidth={1.5} /> Big screen
          </a>
          <button type="button" className="btn-ghost p-btn focus-ember" onClick={download} disabled={!data?.slots.length}>
            <Download size={15} strokeWidth={1.5} /> Download spreadsheet
          </button>
        </div>
      </div>

      {error && !data && <p className="p-notice p-notice--bad mt-6 font-body">{error}</p>}

      {data && (
        <div className="mt-6 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-bone/10 py-3 font-body text-[15px]">
            <span>
              <strong className="text-foreground">{data.slots.length}</strong> <span className="text-foreground/75">teams scheduled</span>
            </span>
            {(data.waiting ?? 0) > 0 && (
              <span className="text-ember">
                <strong>{data.waiting}</strong> submitted, waiting for a time slot
              </span>
            )}
            {ends && (
              <span className={overrun ? "text-ember" : "text-foreground/75"}>
                Last team finishes {clock(ends)}
                {overrun ? `, after the ${clock(data.end)} end` : ""}
              </span>
            )}
            <span className="text-concrete">{data.closed ? "Submissions closed" : "Submissions open"}</span>
          </div>
          {(data.waiting ?? 0) > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-portal p-btn focus-ember" onClick={make} disabled={busy}>
                <CalendarClock size={15} strokeWidth={1.5} /> {busy ? "Giving out time slots…" : `Give out time slots now (${data.waiting})`}
              </button>
              <span className="font-body text-sm text-concrete">
                {data.closed ? "Adds the teams without a slot to the end. Nobody who has one moves." : "Not needed: this happens by itself when submissions close."}
              </span>
            </div>
          )}
          {msg && (
            <p className="p-notice font-body text-sm" role="status">
              {msg}
            </p>
          )}
        </div>
      )}

      {data && (
        <div className="mt-8">
          {data.slots.length === 0 ? (
            <p className="font-body text-foreground/75">
              {data.closed ? "No submitted teams yet." : "Nobody has a time slot yet. They're given out by themselves when submissions close."}
            </p>
          ) : (
            <ScheduleBoard data={data} />
          )}
        </div>
      )}
    </JudgeShell>
  );
}
