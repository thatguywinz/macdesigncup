import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes, useLocation } from "react-router-dom";import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Register from "./pages/Register.tsx";
import PartnerPage from "./pages/partner/index.tsx";
import PartnerRegister from "./pages/partner/Register.tsx";

const queryClient = new QueryClient();

const App = () => {
  const { pathname, hash } = useLocation();

  // Land at the top on a real page change, but never fight an in-page anchor:
  // a "#faq" click is also a location change, and resetting scroll there is
  // what used to snap visitors back to the hero mid-jump.
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      // Wait a frame so the target section has actually mounted and laid out.
      const raf = requestAnimationFrame(() => {
        const target = document.getElementById(id);
        // No such section on this page (e.g. a stale deep link) — go to the top
        // rather than leaving the click with no visible effect at all.
        if (target) target.scrollIntoView({ block: "start" });
        else window.scrollTo(0, 0);
      });
      return () => cancelAnimationFrame(raf);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            {/* Partner routes */}
            <Route path="/partner" element={<PartnerPage />} />
            <Route path="/partner/register" element={<PartnerRegister />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
