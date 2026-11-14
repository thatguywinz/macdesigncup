import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SUBMIT_PATH } from "@/config/site";
import { CTA } from "@/content/copy";

export interface SubmitButtonProps extends Omit<ComponentPropsWithoutRef<"a">, "href" | "children"> {
  /** Button text. Default `CTA.submit` ("Submit here"); keep it verbatim. */
  children?: ReactNode;
  /** `"solid"` = `.btn-portal` (default), `"ghost"` = `.btn-ghost`. */
  variant?: "solid" | "ghost";
  className?: string;
}

/**
 * The one Submit here button: a plain `<a href="/submit">`. /submit is a
 * full page served by the submission portal build (vercel.json rewrites it),
 * not a route of this app, so it must never be a router `<Link>`. Size and
 * visibility come from `className`; other anchor props pass through.
 *
 * @example
 * <SubmitButton className="px-8 py-4" />
 */
export default function SubmitButton({
  children = CTA.submit,
  variant = "solid",
  className,
  ...rest
}: SubmitButtonProps) {
  return (
    <a
      {...rest}
      href={SUBMIT_PATH}
      className={cn(variant === "solid" ? "btn-portal" : "btn-ghost", "focus-ember", className)}
    >
      {children}
    </a>
  );
}
