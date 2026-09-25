// @vitest-environment node
// The drafting-hall primitives must render on the server (no window, no
// document) and put their real content in the HTML.
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import BlueprintBackdrop from "@/components/blueprint/BlueprintBackdrop";
import Dimension from "@/components/blueprint/Dimension";
import Sheet from "@/components/blueprint/Sheet";
import WireSolid from "@/components/blueprint/WireSolid";
import CountUp from "@/components/motion/CountUp";
import DisplayHeading from "@/components/motion/DisplayHeading";
import DrawPath from "@/components/motion/DrawPath";
import Reveal from "@/components/motion/Reveal";
import RegisterBlock from "@/components/RegisterBlock";
import { CTA, PATHS, SECTIONS, WHO_REGISTERS } from "@/content/copy";
import { SPONSORS } from "@/config/sponsors";
import PathBand from "@/sections/glance/PathBand";
import SponsorMarquee from "@/sections/sponsors/SponsorMarquee";

describe("primitives render on the server", () => {
  it("Sheet: section, eyebrow, crop marks, no corner label", () => {
    const html = renderToString(
      <Sheet id="prizes" eyebrow={SECTIONS.prizes.eyebrow}>
        <p>body</p>
      </Sheet>,
    );
    expect(typeof window).toBe("undefined");
    expect(html).toContain('id="prizes"');
    expect(html).not.toContain("Sheet 02 / 06");
    expect(html).not.toContain("sheet-label");
    expect(html).toContain("crop-mark--br");
    expect(html).toContain("<p>body</p>");
  });

  it("DisplayHeading: every line in the HTML, outline word wired, lines spaced", () => {
    const html = renderToString(<DisplayHeading lines={SECTIONS.glance.lines} outline={SECTIONS.glance.outline} />);
    expect(html).toMatch(/^<h2/);
    // Read from copy.ts so the test follows the copy deck, not a snapshot of it.
    expect(html).toContain(`<span class="wire-text">${SECTIONS.glance.outline}</span>`);
    expect(html).toContain("data-reveal");
    expect(html.replace(/<[^>]+>/g, "")).toContain(SECTIONS.glance.lines.join(" "));
  });

  it("CountUp: renders the final figure", () => {
    expect(renderToString(<CountUp to={10000} prefix="$" suffix="+" />)).toContain("$10,000+");
  });

  it("Reveal, DrawPath, Dimension, WireSolid, BlueprintBackdrop render", () => {
    expect(renderToString(<Reveal as="p">hi</Reveal>)).toContain("data-reveal");
    expect(
      renderToString(
        <svg>
          <DrawPath d="M0 0H10" />
        </svg>,
      ),
    ).toContain("data-draw");
    expect(renderToString(<Dimension label="Ø 64" />)).toContain("Ø 64");
    const solid = renderToString(<WireSolid shape="cube" />);
    expect(solid).toMatch(/d="M[-\d.]+ [-\d.]+L/);
    expect(renderToString(<BlueprintBackdrop />)).toContain("draft-grid");
  });

  it("RegisterBlock: links to /register with the verbatim CTA and both notes", () => {
    const html = renderToString(
      <MemoryRouter>
        <RegisterBlock />
      </MemoryRouter>,
    );
    expect(html).toContain('href="/register"');
    expect(html).toContain(CTA.register);
    expect(html).toContain(WHO_REGISTERS.teachers.line);
    expect(html).toContain(WHO_REGISTERS.students.line);
  });

  it("SponsorMarquee: every sponsor is one announced, focusable link; copies are hidden", () => {
    const html = renderToString(
      <MemoryRouter>
        <SponsorMarquee />
      </MemoryRouter>,
    );
    for (const s of SPONSORS) {
      const links = html.split("<a ").filter((a) => a.startsWith(`href="${s.href}"`)).map((a) => a.slice(0, a.indexOf(">")));
      const announced = links.filter((a) => !a.includes('tabindex="-1"'));
      expect(announced, s.name).toHaveLength(1);
      expect(announced[0]).toContain('rel="sponsored noopener noreferrer"');
      expect(announced[0]).toContain('target="_blank"');
      expect(announced[0]).toContain(`aria-label="${s.name.replace(/&/g, "&amp;")} (opens in a new tab)"`);
    }
    expect(html).toContain('aria-hidden="true" class="flex motion-reduce:hidden"');
    expect(html).toContain('href="/partner"');
  });

  it("PathBand: one shared register route and the partner route", () => {
    const html = renderToString(
      <MemoryRouter>
        <PathBand />
      </MemoryRouter>,
    );
    expect(html).toContain(PATHS.routes.register.line);
    expect(html).toContain('href="/register"');
    expect(html).toContain('href="/partner"');
    expect(html).not.toContain('href="#teachers"');
  });
});
