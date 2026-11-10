// Who is signed in, and the frame every judge page shares.
import { createContext, useContext, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import Shell from "../../components/Shell";

export interface Me {
  role: "judge" | "admin";
  name: string;
}

export const MeContext = createContext<{ me: Me; signOut: () => void } | null>(null);

export function useMe() {
  const v = useContext(MeContext);
  if (!v) throw new Error("useMe outside JudgeApp");
  return v;
}

/** The judge pages' frame: nav between dashboard / results / settings. */
export function JudgeShell({ children, section = "Judging" }: { children: ReactNode; section?: string }) {
  const { me, signOut } = useMe();
  const tab = ({ isActive }: { isActive: boolean }) =>
    `focus-ember inline-flex min-h-9 items-center px-2.5 font-body text-sm transition-colors ${isActive ? "text-foreground" : "text-concrete hover:text-foreground"}`;
  return (
    <Shell
      section={section}
      wide
      right={
        <>
          <nav aria-label="Judging" className="hidden items-center md:flex">
            <NavLink to="/judge" end className={tab}>
              Entries
            </NavLink>
            {me.role === "admin" && (
              <>
                <NavLink to="/judge/results" className={tab}>
                  Results
                </NavLink>
                <NavLink to="/judge/settings" className={tab}>
                  Settings
                </NavLink>
              </>
            )}
          </nav>
          <span className="mx-2 hidden h-5 w-px bg-bone/15 md:block" aria-hidden="true" />
          <span className="hidden max-w-[12rem] truncate font-body text-sm text-foreground/80 sm:inline">
            {me.name}
            {me.role === "admin" && <span className="ml-1.5 text-ember">organizer</span>}
          </span>
          <button type="button" className="btn-ghost p-btn p-btn-sm ml-1" onClick={signOut} aria-label="Sign out">
            <LogOut size={15} strokeWidth={1.5} />
          </button>
        </>
      }
    >
      {me.role === "admin" && (
        <nav aria-label="Judging" className="-mx-1 flex gap-1 border-b border-bone/10 py-2 md:hidden">
          <NavLink to="/judge" end className={tab}>
            Entries
          </NavLink>
          <NavLink to="/judge/results" className={tab}>
            Results
          </NavLink>
          <NavLink to="/judge/settings" className={tab}>
            Settings
          </NavLink>
        </nav>
      )}
      {children}
    </Shell>
  );
}

