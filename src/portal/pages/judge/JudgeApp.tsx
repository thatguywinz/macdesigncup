// /judge/*: judges and organizers. One sign-in (name + passcode); the
// passcode decides the role. Everything below needs the session cookie.
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import Shell from "../../components/Shell";
import { JudgeShell, MeContext, type Me } from "./context";
import { Field } from "../../components/fields";
import { ApiError, api } from "../../api";
import JudgeList from "./JudgeList";
import JudgeEntryPage from "./JudgeEntryPage";
import ResultsPage from "./ResultsPage";
import LivePage from "./LivePage";
import SettingsPage from "./SettingsPage";

export default function JudgeApp() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const [roster, setRoster] = useState<string[]>([]);
  const navigate = useNavigate();

  // Who's signed in; when nobody is, the judges list for the name picker.
  const loadMe = useCallback(
    () =>
      api<{ role: Me["role"] | null; name?: string; roster?: string[] }>("/judge/me")
        .then((r) => {
          setRoster(r.roster ?? []);
          setMe(r.role ? { role: r.role, name: r.name ?? "" } : null);
        })
        .catch(() => setMe(null)),
    [],
  );

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const signOut = useCallback(() => {
    // Re-ask after signing out: the name list only comes with a signed-out answer.
    void api("/judge/logout", { body: {} })
      .catch(() => {})
      .then(loadMe)
      .finally(() => navigate("/judge"));
  }, [navigate, loadMe]);

  if (me === undefined) return <div className="portal-shell" />;
  if (!me) return <SignIn onIn={setMe} roster={roster} />;

  return (
    <MeContext.Provider value={{ me, signOut }}>
      <Routes>
        <Route index element={<JudgeList />} />
        <Route path="entry/:id" element={<JudgeEntryPage />} />
        <Route path="practice" element={<JudgeEntryPage practice />} />
        <Route path="live" element={me.role === "admin" ? <LivePage /> : <OrganizersOnly />} />
        <Route path="results" element={me.role === "admin" ? <ResultsPage /> : <OrganizersOnly />} />
        <Route path="settings" element={me.role === "admin" ? <SettingsPage /> : <OrganizersOnly />} />
        <Route path="*" element={<JudgeList />} />
      </Routes>
    </MeContext.Provider>
  );
}

function OrganizersOnly() {
  return (
    <JudgeShell>
      <p className="py-20 font-body text-foreground/75">
        This page is for organizers.{" "}
        <Link to="/judge" className="p-link focus-ember">
          Back to entries
        </Link>
      </p>
    </JudgeShell>
  );
}

const OTHER = "__other__";

/**
 * Judges pick their name from the organizers' list (no typos that would lock
 * them out); organizers choose "Someone else" and type theirs. A judge's card
 * links to /judge?as=<name>, which preselects it.
 */
function SignIn({ onIn, roster }: { onIn: (me: Me) => void; roster: string[] }) {
  const preset = (() => {
    const as = new URLSearchParams(window.location.search).get("as") ?? "";
    return roster.find((n) => n.toLowerCase() === as.trim().toLowerCase()) ?? "";
  })();
  const [pick, setPick] = useState(preset || (roster.length ? "" : OTHER));
  const [typed, setTyped] = useState("");
  const name = pick === OTHER ? typed : pick;
  const [passcode, setPasscode] = useState("");
  const [errors, setErrors] = useState<{ name?: string; passcode?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const r = await api<Me>("/judge/login", { body: { name, passcode } });
      onIn(r);
    } catch (err) {
      const ae = err as ApiError;
      const field = ae.body?.field as "name" | "passcode" | undefined;
      setErrors(field ? { [field]: ae.message } : { form: ae.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell section="Judging">
      <div className="grid gap-12 py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:py-24">
        <div>
          <h1 className="display-scene">Judges sign in</h1>
          <p className="mt-4 max-w-[30rem] font-body text-lg leading-relaxed text-foreground/75">
            {roster.length
              ? "Pick your name, then enter the passcode from your judging card."
              : "Use your full name so your marks are yours alone. The passcode is on your judging card."}
          </p>
        </div>
        <form onSubmit={submit} noValidate className="flex max-w-[26rem] flex-col gap-6">
          {roster.length > 0 && (
            <Field label="Your name" error={pick !== OTHER ? errors.name : undefined}>
              {(p) => (
                <select {...p} className="p-select" value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="" disabled>
                    Choose your name
                  </option>
                  {roster.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                  <option value={OTHER}>Someone else (organizers)</option>
                </select>
              )}
            </Field>
          )}
          {pick === OTHER && (
            <Field label={roster.length ? "Name" : "Your name"} error={errors.name}>
              {(p) => <input {...p} className="p-input" autoComplete="name" value={typed} onChange={(e) => setTyped(e.target.value)} />}
            </Field>
          )}
          <Field label="Passcode" error={errors.passcode}>
            {(p) => <input {...p} type="password" className="p-input" autoComplete="current-password" value={passcode} onChange={(e) => setPasscode(e.target.value)} />}
          </Field>
          {errors.form && (
            <p className="p-notice p-notice--bad font-body text-sm" role="alert">
              {errors.form}
            </p>
          )}
          <button type="submit" className="btn-portal p-btn self-start" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </Shell>
  );
}
