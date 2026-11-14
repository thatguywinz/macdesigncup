import { useId } from "react";
import { cn } from "@/lib/utils";
import SubmitButton from "./SubmitButton";
import { SubmitNote } from "./nav/SubmitNote";

export interface SubmitBlockProps {
  /** `"start"` (default) or `"center"`. */
  align?: "start" | "center";
  /** Show the button on phones. Default `true`. Pass `false` where the mobile
   *  sticky bar is already on screen, so a phone shows one Submit at a time. */
  mobileButton?: boolean;
  /** Extra classes for the button (size overrides). */
  buttonClassName?: string;
  className?: string;
}

/**
 * The primary call to action on the day: the `CTA.submit` button (to
 * `/submit`) plus the tiny deadline note, which also describes the button.
 *
 * @example
 * <SubmitBlock mobileButton={false} />
 */
export default function SubmitBlock({
  align = "start",
  mobileButton = true,
  buttonClassName,
  className,
}: SubmitBlockProps) {
  const noteId = useId();
  return (
    <div className={cn("flex flex-col gap-4", align === "center" ? "items-center" : "items-start", className)}>
      <SubmitButton
        className={cn("px-8 py-4", !mobileButton && "hidden md:inline-flex", buttonClassName)}
        aria-describedby={noteId}
      />
      <SubmitNote id={noteId} />
    </div>
  );
}
