import { Fragment } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BREADCRUMBS } from "@/content/copy";

export interface Crumb {
  label: string;
  /** Omit on the last crumb (the current page). */
  to?: string;
}

interface BreadcrumbsProps {
  items: readonly Crumb[];
  className?: string;
}

/**
 * The visible breadcrumb trail on the inner routes (/register, /partner,
 * /partner/register), set like a drawing's sheet path: Space Mono caps, an
 * ember tick in front, bone chevrons between steps. The last step is the
 * current page (`aria-current="page"`, not a link). The names match the
 * BreadcrumbList JSON-LD (both read BREADCRUMBS in copy.ts).
 */
export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const last = items.length - 1;
  return (
    <nav aria-label={BREADCRUMBS.label} className={cn("font-mono text-[11px] uppercase tracking-[0.24em]", className)}>
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <li aria-hidden="true" className="flex items-center">
          <span className="block h-px w-6 bg-ember/70" />
        </li>
        {items.map((item, i) => (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 && (
              <li aria-hidden="true" className="text-foreground/35">
                ›
              </li>
            )}
            <li className="flex items-center">
              {item.to && i !== last ? (
                <Link
                  to={item.to}
                  className="focus-ember inline-flex min-h-11 items-center text-concrete transition-colors hover:text-ember md:min-h-0"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="inline-flex min-h-11 items-center text-foreground/90 md:min-h-0">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
