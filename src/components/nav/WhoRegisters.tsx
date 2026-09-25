import { User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_BAR, WHO_REGISTERS } from "@/content/copy";

const ROWS = [
  { key: "teachers", Icon: Users, ...WHO_REGISTERS.teachers },
  { key: "students", Icon: User, ...WHO_REGISTERS.students },
] as const;

/**
 * The two WHO_REGISTERS lines as a compact list (lucide Users / User, 16px,
 * stroke 1.5, ember), for a Register link that has room under it, such as
 * the mobile menu's Register row. Give it an `id` and point the link's
 * `aria-describedby` at it.
 */
export function WhoRegistersList({ id, className }: { id?: string; className?: string }) {
  return (
    <ul id={id} className={cn("space-y-2", className)}>
      {ROWS.map(({ key, Icon, label, line }) => (
        <li key={key} className="flex items-start gap-3">
          <Icon aria-hidden="true" size={16} strokeWidth={1.5} className="mt-[3px] shrink-0 text-ember" />
          <p className="text-pretty font-body text-sm font-light leading-snug text-concrete">
            <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/85">
              {label}
            </span>{" "}
            {line}{" "}
          </p>
        </li>
      ))}
    </ul>
  );
}

/**
 * The same two lines for screen readers only: the description of a Register
 * link with no room for a visible note (the desktop nav button, the footer).
 */
export function WhoRegistersSr({ id }: { id: string }) {
  return (
    <span id={id} className="sr-only">
      {ROWS.map(({ key, label, line }) => (
        <span key={key}>
          {label}: {line}{" "}
        </span>
      ))}
    </span>
  );
}

/**
 * The phone sticky bar's caption (and, from 1440px, the desktop nav's note
 * beside its Register button): two lines, the label set in the body face
 * at medium weight, the clause after it lighter. No icons and no tracking, so
 * each line holds at 360px and the bar keeps its height.
 */
export function WhoRegistersShort({ id, className }: { id?: string; className?: string }) {
  return (
    <span id={id} className={cn("flex flex-col font-body text-xs leading-[1.35]", className)}>
      <span>
        <span className="font-semibold text-foreground">{WHO_REGISTERS.teachers.label}</span>{" "}
        <span className="text-foreground/75">{MOBILE_BAR.lines.teachers}</span>
      </span>{" "}
      <span>
        <span className="font-semibold text-foreground">{WHO_REGISTERS.students.label}</span>{" "}
        <span className="text-foreground/75">{MOBILE_BAR.lines.students}</span>
      </span>
    </span>
  );
}
