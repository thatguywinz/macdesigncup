import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/anton/latin-400.css";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import "@fontsource-variable/archivo/wght.css";
// portal.css first: its component classes then come before Tailwind's
// utilities in the bundle, so a utility on the same element (pl-9, w-auto)
// still wins, as it does on the main site.
import "./portal.css";
import "../index.css";
import PortalApp from "./PortalApp";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <PortalApp />
  </BrowserRouter>,
);
