import { useId } from "react";
import { User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { WHO_REGISTERS } from "@/content/copy";
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

const ROWS = [
  { key: "teachers", Icon: Users, ...WHO_REGISTERS.teachers },
  { key: "students", Icon: User, ...WHO_REGISTERS.students },
] as const;

/**
 * The primary Register call to action: the `CTA.register` button (to
 * `/register`) plus the two-line "who registers" note, Teachers and
 * Students, with lucide icons (16px, stroke 1.5). The button is described by
 * the note (`aria-describedby`), so screen readers hear both.
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
      <ul
        id={noteId}
        className={cn(
          "space-y-1.5 text-left",
          inline && "md:border-l md:border-line md:pl-10",
        )}
      >
        {ROWS.map(({ key, Icon, label, line }) => (
          <li key={key} className="flex items-start gap-2.5">
            <Icon
              aria-hidden="true"
              size={16}
              strokeWidth={1.5}
              className="mt-[2px] shrink-0 text-ember/80"
            />
            <p className="font-body text-sm font-light leading-snug text-concrete">
              <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-foreground/85">
                {label}
              </span>{" "}
              {line}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
