import { useId } from "react";
import { cn } from "@/lib/utils";
import { WhoRegistersNote } from "./nav/WhoRegisters";
import RegisterButton from "./RegisterButton";

export interface RegisterBlockProps {
  /** `"start"` (default) or `"center"` (closers only, e.g. the final CTA). */
  align?: "start" | "center";
  /** `"stacked"` (default): the note sits under the button.
   *  `"inline"`: from `md`, the note sits beside the button behind a hairline. */
  variant?: "stacked" | "inline";
  /** Show the button on phones. Default `true`. Pass `false` where the mobile
   *  sticky bar is already on screen, so a phone shows one Register at a time
   *  (the note still shows). The final CTA keeps it: the bar hides there. */
  mobileButton?: boolean;
  /** Extra classes for the button (size overrides). */
  buttonClassName?: string;
  className?: string;
}

/**
 * The primary Register call to action: the `CTA.register` button (to
 * `/register`) plus the tiny "Students and teachers" note (one form for
 * everyone). The button is described by the note (`aria-describedby`).
 *
 * @example
 * <RegisterBlock mobileButton={false} />
 * <RegisterBlock align="center" />
 */
export default function RegisterBlock({
  align = "start",
  variant = "stacked",
  mobileButton = true,
  buttonClassName,
  className,
}: RegisterBlockProps) {
  const noteId = useId();
  const center = align === "center";
  const inline = variant === "inline";

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        center ? "items-center" : "items-start",
        inline && "md:flex-row md:items-center md:gap-10",
        className,
      )}
    >
      <RegisterButton
        className={cn("px-8 py-4", !mobileButton && "hidden md:inline-flex", buttonClassName)}
        aria-describedby={noteId}
      />
      <WhoRegistersNote id={noteId} className={cn(inline && "md:border-l md:border-line md:py-2 md:pl-10")} />
    </div>
  );
}
