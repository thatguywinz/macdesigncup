import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { REGISTER_PATH } from "@/config/site";
import { NOT_FOUND } from "@/content/copy";
import RegisterBlock from "@/components/RegisterBlock";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";

/** The pages that do exist. */
const INDEX: ReadonlyArray<{ label: string; to: string }> = [
  { label: NOT_FOUND.links.home, to: "/" },
  { label: NOT_FOUND.links.register, to: REGISTER_PATH },
  { label: NOT_FOUND.links.faq, to: "/#faq" },
  { label: NOT_FOUND.links.partner, to: "/partner" },
];

/**
 * 404. The one line, then everything that does exist: the Register call to
 * action and a short list of the real pages. Fits a phone screen without
 * scrolling. The route is noindex (set by the head table).
 */
const NotFound = () => {
  return (
    <div className="relative flex min-h-[100svh] flex-col bg-background">
      <SiteNav />
      <main
        id="main"
        className="relative z-10 flex flex-1 items-center px-5 pb-16 pt-[calc(var(--nav-h)+2rem)] md:px-10 md:pb-24 md:pt-[calc(var(--nav-h)+3rem)] lg:px-16"
      >
        <div className="mx-auto grid w-full max-w-[1100px] gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-end md:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-ember">404</p>
            <h1 className="display-scene mt-3">{NOT_FOUND.title}</h1>
            <p className="mt-4 max-w-[34ch] font-body text-lg leading-relaxed text-foreground/75">{NOT_FOUND.line}</p>
            <RegisterBlock className="mt-8 gap-4" />
          </div>

          <nav aria-label={NOT_FOUND.index}>
            <ul className="border-t border-bone/10">
              {INDEX.map((item) => (
                <li key={item.to} className="border-b border-bone/10">
                  <Link
                    to={item.to}
                    className="focus-ember group flex min-h-[52px] items-center gap-4 py-2 font-body text-base text-foreground/85 transition-colors hover:text-foreground"
                  >
                    <span className="flex-1">{item.label}</span>
                    <ArrowRight
                      aria-hidden="true"
                      size={16}
                      strokeWidth={1.5}
                      className="text-ember transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default NotFound;
