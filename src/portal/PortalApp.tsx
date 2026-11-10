// The portal's routes. Its own page (portal.html), apart from the
// prerendered site, so none of this ships to the homepage.
//
//   /submit                 the entry form (needs the day's entry code)
//   /submit/edit/:id#k=…    the team's private edit link
//   /entry/:id              the share page: the model in 3D
//   /submissions            the public page of entries (organizers switch it on)
//   /judge                  judges' sign-in and dashboard
//   /judge/entry/:id        one entry, full details, marking
//   /judge/results          organizers: ranking, CSV
//   /judge/settings         organizers: deadline, entry code, close switch
import { Suspense, lazy, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import SubmitPage from "./pages/SubmitPage";
import NotFoundPage from "./pages/NotFoundPage";

const EntryPage = lazy(() => import("./pages/EntryPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const JudgeApp = lazy(() => import("./pages/judge/JudgeApp"));

const TITLES: [RegExp, string][] = [
  [/^\/submit\/edit/, "Edit your entry"],
  [/^\/submit/, "Submit your design"],
  [/^\/entry/, "Design"],
  [/^\/gallery/, "Gallery"],
  [/^\/judge/, "Judging"],
];

export default function PortalApp() {
  const { pathname } = useLocation();
  useEffect(() => {
    const t = TITLES.find(([re]) => re.test(pathname))?.[1];
    if (t && !pathname.startsWith("/entry")) document.title = `${t} · Mackenzie Design Cup`;
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <Suspense fallback={<div className="portal-shell" />}>
      <Routes>
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/submit/edit/:id" element={<SubmitPage />} />
        <Route path="/entry/:id" element={<EntryPage />} />
        <Route path="/submissions" element={<GalleryPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/judge/*" element={<JudgeApp />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
