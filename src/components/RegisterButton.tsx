import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { REGISTER_PATH } from "@/config/site";
import { CTA } from "@/content/copy";

export interface RegisterButtonProps extends Omit<ComponentPropsWithoutRef<"a">, "href" | "children"> {
  /** Button text. Default `CTA.register` ("Register now"); keep it verbatim. */
  children?: ReactNode;
  /** `"solid"` = `.btn-portal` (default), `"ghost"` = `.btn-ghost`. */
  variant?: "solid" | "ghost";
  className?: string;
}

/**
 * The one Register button. Every instance is an in-app link to
 * REGISTER_PATH (`/register`), which explains who registers and embeds the
 * live Tally form. Size and visibility come from `className` (padding,
 * `hidden md:inline-flex`, …); other anchor props (`onClick`,
 * `aria-describedby`, …) pass through.
 *
 * @example
 * <RegisterButton className="px-8 py-4" />
 */
export default function RegisterButton({
  children = CTA.register,
  variant = "solid",
  className,
  ...rest
}: RegisterButtonProps) {
  return (
    <Link
      {...rest}
      to={REGISTER_PATH}
      className={cn(variant === "solid" ? "btn-portal" : "btn-ghost", "focus-ember", className)}
    >
      {children}
    </Link>
  );
}
