import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBMIT } from "@/content/copy";

/**
 * The one tiny note beside a Submit here button: "Closes 1:30 PM · No late
 * entries". Give it an `id` and point the button's `aria-describedby` at it.
 * `url` adds the address on a second line, for people who type it.
 */
export function SubmitNote({ id, url = false, className }: { id?: string; url?: boolean; className?: string }) {
  return (
    <span id={id} className={cn("inline-flex items-center gap-2 font-body text-[13px] leading-none", className)}>
      <Clock aria-hidden="true" size={14} strokeWidth={1.5} className="shrink-0 text-ember" />
      {url ? (
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-foreground/70">{SUBMIT.note}</span>
          <span className="truncate text-ember">{SUBMIT.url}</span>
        </span>
      ) : (
        <span className="text-foreground/70">{SUBMIT.note}</span>
      )}
    </span>
  );
}

/** The same note for screen readers only, for a Submit link with no room for it. */
export function SubmitSr({ id }: { id: string }) {
  return (
    <span id={id} className="sr-only">
      {SUBMIT.sr}
    </span>
  );
}
