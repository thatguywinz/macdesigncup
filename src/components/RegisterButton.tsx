import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { REGISTRATION_URL } from "@/config/site";

interface RegisterButtonProps {
  children?: React.ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
}

/**
 * The single, working primary CTA. Resolves to REGISTRATION_URL — the live
 * Tally registration form, opened in a new tab. The internal-route branch
 * stays only in case registration ever moves back in-app.
 */
export default function RegisterButton({
  children = "Register",
  variant = "solid",
  className,
}: RegisterButtonProps) {
  const isInternal = REGISTRATION_URL.startsWith("/");
  const cls = cn(variant === "solid" ? "btn-portal" : "btn-ghost", className);

  if (isInternal) {
    return (
      <Link to={REGISTRATION_URL} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <a href={REGISTRATION_URL} target="_blank" rel="noreferrer" className={cls}>
      {children}
    </a>
  );
}
