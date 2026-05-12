import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CADLoadingScreen from "./components/CADLoadingScreen.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [loadingDone, setLoadingDone] = useState(false);

  return (
    <>
      {!loadingDone && (
        <CADLoadingScreen onComplete={() => setLoadingDone(true)} />
      )}

      {/* Site content — rendered underneath but only visible after loading */}
      <div
        style={{
          opacity: loadingDone ? 1 : 0,
          transition: 'opacity 0.6s ease',
          visibility: loadingDone ? 'visible' : 'hidden',
        }}
      >
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </div>
    </>
  );
};

export default App;
