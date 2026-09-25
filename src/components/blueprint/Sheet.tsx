import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SheetProps extends Omit<ComponentPropsWithoutRef<"section">, "id" | "title" | "children"> {
  /** Section anchor (`glance`, `prizes`, `sponsors`, `day`, `faq`, `register`). */
  id: string;
  /** Classes for the inner max-width container (default `max-w-[1300px]`). */
  containerClassName?: string;
  children?: ReactNode;
}

/**
 * The section shell. Renders `<section id>` with the site's one section
 * rhythm (`py-14 md:py-24 xl:py-28`, `px-5 md:px-10 lg:px-16`), then a
 * centred `max-w-[1300px]` container: whitespace, not rules, between sections. Extra
 * props (`aria-labelledby`, `data-*`, `style`) go on the `<section>`.
 *
 * @example
 * <Sheet id="prizes">
 *   <DisplayHeading lines={SECTIONS.prizes.lines} />
 * </Sheet>
 */
export default function Sheet({ id, className, containerClassName, children, ...rest }: SheetProps) {
  return (
    <section
      id={id}
      // overflow-x: clip keeps full-bleed rows (the sponsor wall) from widening
      // the page on phones. `clip` is not a scroll container, so sticky
      // children (The day, FAQ) keep sticking.
      className={cn(
        "relative overflow-x-clip px-5 py-14 md:px-10 md:py-24 lg:px-16 xl:py-28",
        className,
      )}
      {...rest}
    >
      <div className={cn("relative mx-auto w-full max-w-[1300px]", containerClassName)}>{children}</div>
    </section>
  );
}
