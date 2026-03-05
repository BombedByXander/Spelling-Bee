import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, type Location } from "react-router-dom";
import Index from "./pages/Index";

import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import Pass from "./pages/Pass";
import ReplayViewer from "./pages/ReplayViewer";
import Updates from "./pages/Updates";
import NotFound from "./pages/NotFound";
import GlobalUpdatePopup from "@/components/GlobalUpdatePopup";
import GlobalRefreshNotice from "@/components/GlobalRefreshNotice";
import { supabase } from "@/integrations/supabase/client";
import { applyThemePreset, getStoredThemePreset } from "@/lib/theme";
import AnnouncementBar from "@/components/AnnouncementBar";
import RandomSideCircle from "@/components/RandomSideCircle";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    applyThemePreset(getStoredThemePreset());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AnnouncementBar />
        <RandomSideCircle />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const AppRoutes = () => {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const backgroundLocation = state?.backgroundLocation;

  return (
    <div className="relative min-h-screen bg-background">
      <GlobalUpdatePopup />
      <GlobalRefreshNotice />
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<Index />} />

        <Route path="/auth" element={<Auth />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pass" element={<Pass />} />
        <Route path="/updates" element={<Updates />} />
        <Route path="/replay/:shareCode" element={<ReplayViewer />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route
            path="/settings"
            element={
              <div className="fixed inset-0 z-40 overflow-y-auto bg-background/95 backdrop-blur-sm">
                <Settings />
              </div>
            }
          />
          <Route
            path="/dashboard"
            element={
              <div className="fixed inset-0 z-40 overflow-y-auto bg-background/95 backdrop-blur-sm">
                <Dashboard />
              </div>
            }
          />
          <Route
            path="/pass"
            element={
              <div className="fixed inset-0 z-40 overflow-y-auto bg-background/95 backdrop-blur-sm">
                <Pass />
              </div>
            }
          />
        </Routes>
      )}
    </div>
  );
};

export default App;