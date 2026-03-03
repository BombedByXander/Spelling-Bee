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

const AnnouncementBanner = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed top-0 left-0 right-0 z-50 bg-primary/95 text-primary-foreground text-sm py-2 px-4">
    <div className="relative max-w-screen mx-auto">
      <span className="block text-center">{message}</span>
      <button
        onClick={onClose}
        aria-label="Dismiss announcement"
        className="absolute top-0 right-0 mt-1 mr-2 text-primary-foreground hover:text-primary transition-opacity"
      >
        ×
      </button>
    </div>
  </div>
);

const queryClient = new QueryClient();

const isAnnouncementsMissingError = (error: unknown) => {
  const err = error as { code?: string; message?: string } | null;
  const message = (err?.message || "").toLowerCase();
  return err?.code === "PGRST205" || err?.code === "42P01" || (message.includes("announcements") && message.includes("schema cache"));
};

const App = () => {
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    applyThemePreset(getStoredThemePreset());
  }, []);

  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const fetchAnnouncement = async (): Promise<boolean> => {
      try {
        const now = new Date().toISOString();
        // pick the earliest active banner that is currently in its date window
        const { data, error } = await supabase
          .from("announcements")
          .select("message, starts_at, ends_at, active")
          .eq("active", true)
          .lte("starts_at", now)
          .or(`ends_at.gte.${now},ends_at.is.null`)
          .order("starts_at", { ascending: true })
          .limit(1);

        if (error) {
          if (!mounted) return false;
          if (isAnnouncementsMissingError(error)) {
            setAnnouncement(null);
            setDismissed(false);
            return false;
          }
          setAnnouncement(null);
          setDismissed(false);
          return true;
        }

        if (!mounted) return;
        if (data && data.length > 0) {
          const a = data[0] as any;
          setAnnouncement(a.message);
          setDismissed(false);
        } else {
          setAnnouncement(null);
          setDismissed(false);
        }
        return true;
      } catch (e) {
        if (!mounted) return false;
        if (isAnnouncementsMissingError(e)) {
          setAnnouncement(null);
          setDismissed(false);
          return false;
        }
        setAnnouncement(null);
        setDismissed(false);
        return true;
      }
    };

    const init = async () => {
      const announcementsAvailable = await fetchAnnouncement();
      if (!announcementsAvailable || !mounted) return;

      subscription = supabase
        .channel("announcements")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "announcements",
          },
          () => {
            void fetchAnnouncement();
          }
        )
        .subscribe();
    };

    void init();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes announcement={announcement} dismissed={dismissed} onDismissAnnouncement={() => setDismissed(true)} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const AppRoutes = ({
  announcement,
  dismissed,
  onDismissAnnouncement,
}: {
  announcement: string | null;
  dismissed: boolean;
  onDismissAnnouncement: () => void;
}) => {
  const location = useLocation();
  const state = location.state as { backgroundLocation?: Location } | null;
  const backgroundLocation = state?.backgroundLocation;

  return (
    <div className="relative min-h-screen bg-background">
      <GlobalUpdatePopup />
      <GlobalRefreshNotice />
      {announcement && !dismissed && (
        <AnnouncementBanner
          message={announcement}
          onClose={onDismissAnnouncement}
        />
      )}
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