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
 * /partner/register): small body type, chevrons between steps. The last step is the
 * current page (`aria-current="page"`, not a link). The names match the
 * BreadcrumbList JSON-LD (both read BREADCRUMBS in copy.ts).
 */
export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const last = items.length - 1;
  return (
    <nav aria-label={BREADCRUMBS.label} className={cn("font-body text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
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
                  className="focus-ember inline-flex min-h-11 items-center text-concrete transition-colors hover:text-foreground md:min-h-0"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="inline-flex min-h-11 items-center text-foreground/80 md:min-h-0">
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
