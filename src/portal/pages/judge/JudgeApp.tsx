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
import SettingsPage from "./SettingsPage";

export default function JudgeApp() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    api<{ role: Me["role"] | null; name?: string }>("/judge/me")
      .then((r) => setMe(r.role ? { role: r.role, name: r.name ?? "" } : null))
      .catch(() => setMe(null));
  }, []);

  const signOut = useCallback(() => {
    void api("/judge/logout", { body: {} }).finally(() => {
      setMe(null);
      navigate("/judge");
    });
  }, [navigate]);

  if (me === undefined) return <div className="portal-shell" />;
  if (!me) return <SignIn onIn={setMe} />;

  return (
    <MeContext.Provider value={{ me, signOut }}>
      <Routes>
        <Route index element={<JudgeList />} />
        <Route path="entry/:id" element={<JudgeEntryPage />} />
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

function SignIn({ onIn }: { onIn: (me: Me) => void }) {
  const [name, setName] = useState("");
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
            Use your full name so your marks are yours alone. The passcode is on your judging sheet.
          </p>
        </div>
        <form onSubmit={submit} noValidate className="flex max-w-[26rem] flex-col gap-6">
          <Field label="Your name" error={errors.name}>
            {(p) => <input {...p} className="p-input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
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
