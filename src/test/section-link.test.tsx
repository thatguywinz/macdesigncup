import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SectionLink from "@/components/SectionLink";

const scrollIntoView = vi.fn();

describe("SectionLink", () => {
  beforeEach(() => {
    scrollIntoView.mockClear();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
  });

  it("scrolls on every click, including repeated clicks to the current hash", () => {
    render(
      <MemoryRouter initialEntries={["/partner#why"]}>
        <SectionLink href="#why">Why partner</SectionLink>
        <section id="why">Partner details</section>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Why partner" });
    fireEvent.click(link);
    fireEvent.click(link);

    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(scrollIntoView).toHaveBeenLastCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });
});
