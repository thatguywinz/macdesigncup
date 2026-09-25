import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { WHO_REGISTERS } from "@/content/copy";

/**
 * The one tiny note beside a Register button: "Students and teachers" (one
 * form for everyone). Give it an `id` and point the button's
 * `aria-describedby` at it.
 */
export function WhoRegistersNote({ id, className }: { id?: string; className?: string }) {
  return (
    <span
      id={id}
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[10px] uppercase leading-none tracking-[0.2em] text-foreground/75",
        className,
      )}
    >
      <Users aria-hidden="true" size={14} strokeWidth={1.5} className="shrink-0 text-ember" />
      {WHO_REGISTERS.note}
    </span>
  );
}

/** The same rule for screen readers only, for a Register link with no room for the note. */
export function WhoRegistersSr({ id }: { id: string }) {
  return (
    <span id={id} className="sr-only">
      {WHO_REGISTERS.sr}
    </span>
  );
}
