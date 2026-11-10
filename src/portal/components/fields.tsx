import { useId, type ReactNode } from "react";

/** A labelled control with its hint and error, wired for screen readers. */
export function Field({
  label,
  hint,
  error,
  optional,
  children,
  counter,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  counter?: { value: number; max: number };
  children: (props: { id: string; "aria-describedby"?: string; "aria-invalid"?: boolean }) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  return (
    <div data-field-error={error ? "true" : undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="p-label">
          {label}
          {optional && <span className="ml-1.5 font-normal text-concrete">optional</span>}
        </label>
        {counter && (
          <span className={`p-mono text-[11px] ${counter.value > counter.max ? "text-[hsl(6_90%_66%)]" : "text-concrete"}`} aria-hidden="true">
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {hint && (
        <p id={hintId} className="p-hint mt-1">
          {hint}
        </p>
      )}
      <div className="mt-2">{children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}</div>
      {error && (
        <p id={errId} className="p-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function Block({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="p-block">
      <div>
        <h2 className="p-block-title">{title}</h2>
        {note && <p className="p-hint mt-1.5 max-w-[22rem]">{note}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </section>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="p-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
      <span style={{ transform: `scaleX(${value})` }} />
    </div>
  );
}
