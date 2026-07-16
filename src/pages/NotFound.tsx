import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { MODEL_NO } from "@/config/site";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_35%_at_50%_0%,hsl(24_100%_54%/0.08),transparent_70%)]"
        aria-hidden="true"
      />
      <div className="relative z-10 text-center">
        <p className="mono-label !text-ember/90">{MODEL_NO} · wrong hall</p>
        <h1 className="display-hero mt-6">
          4<span className="wire-text">0</span>4
        </h1>
        <p className="mt-6 font-body text-base font-light leading-relaxed text-concrete">
          This room isn't part of the exhibition.
        </p>
        <Link to="/" className="btn-ghost mt-10 px-8 py-4">
          ← Back to the gallery
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
