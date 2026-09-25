// RouteHead keeps the live <head> in step with client-side navigation. These
// cases pin the robots / canonical / social behaviour per kind of route, so a
// visitor who navigates (instead of loading fresh) sees the same head the
// prerender would have served for that URL.
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import RouteHead from "@/seo/RouteHead";
import {
  HOME_ROUTE,
  NOT_FOUND_ROUTE,
  PARTNER_REGISTER_ROUTE,
  PARTNER_ROUTE,
  ROBOTS_INDEX,
  ROBOTS_NOINDEX,
  absoluteUrl,
} from "@/seo/routes";

const meta = (sel: string) => document.head.querySelector<HTMLMetaElement>(`meta[${sel}]`)?.content;
const canonical = () => document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;

let go: (to: string) => void = () => {};
function Driver() {
  const navigate = useNavigate();
  useEffect(() => {
    go = (to) => navigate(to);
  }, [navigate]);
  return null;
}

const mount = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Driver />
      <RouteHead />
    </MemoryRouter>,
  );

afterEach(() => {
  document.head.innerHTML = "";
  document.title = "";
});

describe("RouteHead", () => {
  it("gives an indexable page its title, index robots, canonical and social tags", () => {
    mount("/partner");
    expect(document.title).toBe(PARTNER_ROUTE.title);
    expect(meta('name="robots"')).toBe(ROBOTS_INDEX);
    expect(canonical()).toBe(absoluteUrl("/partner"));
    expect(meta('property="og:url"')).toBe(absoluteUrl("/partner"));
  });

  it("drops the canonical on the noindex /partner/register but keeps its social tags", () => {
    mount("/partner");
    act(() => go("/partner/register"));
    expect(document.title).toBe(PARTNER_REGISTER_ROUTE.title);
    expect(meta('name="robots"')).toBe(ROBOTS_NOINDEX);
    expect(canonical()).toBeUndefined();
    expect(meta('property="og:url"')).toBe(absoluteUrl("/partner/register"));
    expect(meta('name="twitter:title"')).toBe(PARTNER_REGISTER_ROUTE.title);
  });

  it("restores the canonical when navigating back to an indexable page", () => {
    mount("/partner/register");
    expect(canonical()).toBeUndefined();
    act(() => go("/"));
    expect(document.title).toBe(HOME_ROUTE.title);
    expect(meta('name="robots"')).toBe(ROBOTS_INDEX);
    expect(canonical()).toBe(absoluteUrl("/"));
  });

  it("treats an unknown path as the 404: noindex, no canonical", () => {
    mount("/");
    act(() => go("/no-such-sheet"));
    expect(document.title).toBe(NOT_FOUND_ROUTE.title);
    expect(meta('name="robots"')).toBe(ROBOTS_NOINDEX);
    expect(canonical()).toBeUndefined();
  });
});
