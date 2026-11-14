// The home page clock counts down to the submission deadline and, once it
// has passed, says submissions are closed instead of showing zeros.
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Countdown from "@/components/Countdown";
import { SUBMIT_DEADLINE, TIMES } from "@/config/site";
import { SECTIONS } from "@/content/copy";

const C = SECTIONS.glance.countdown;
const DEADLINE = new Date(SUBMIT_DEADLINE).getTime();

afterEach(() => {
  vi.useRealTimers();
});

describe("Countdown", () => {
  it("targets 1:30 PM Toronto time on Nov 16, 2026", () => {
    expect(new Date(SUBMIT_DEADLINE).toISOString()).toBe("2026-11-16T18:30:00.000Z");
    expect(TIMES.submit).toBe("1:30 PM");
    expect(C.when).toBe("Mon, Nov 16, 1:30 PM");
  });

  it("counts down to the deadline", () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    // 1 day, 2 hours, 3 minutes and 4 seconds before.
    vi.setSystemTime(DEADLINE - (86_400_000 + 2 * 3_600_000 + 3 * 60_000 + 4_000));
    render(<Countdown />);
    expect(screen.getByText(C.until)).toBeInTheDocument();
    expect(screen.getByText(C.when)).toBeInTheDocument();
    const cells = screen.getByRole("timer").textContent ?? "";
    expect(cells).toContain("01");
    expect(cells).toContain("02");
    expect(cells).toContain("03");
    expect(cells).toContain("04");
  });

  it("says submissions are closed once the deadline passes, never zeros", () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    vi.setSystemTime(DEADLINE - 1_500);
    render(<Countdown />);
    expect(screen.getByRole("timer")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3_000);
    });
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(screen.getByText(C.done)).toBeInTheDocument();
    expect(screen.getByText(C.doneWhen)).toBeInTheDocument();
  });

  it("is closed straight away after the deadline", () => {
    vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
    vi.setSystemTime(DEADLINE + 60 * 60_000);
    render(<Countdown />);
    expect(screen.getByText(C.done)).toBeInTheDocument();
    expect(screen.queryByText("00")).not.toBeInTheDocument();
  });
});
