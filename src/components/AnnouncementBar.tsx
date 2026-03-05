import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "announcement:dismissed:id";

interface AnnouncementRow {
  id: string;
  message: string;
  active: boolean;
  created_at: string;
}

const AnnouncementBar = () => {
  const [announcement, setAnnouncement] = useState<AnnouncementRow | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [visible, setVisible] = useState<boolean>(false);

  const fetchAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("id, message, active, created_at")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        setAnnouncement(null);
        return;
      }

      setAnnouncement(data as AnnouncementRow);
    } catch (err) {
      setAnnouncement(null);
    }
  };

  useEffect(() => {
    void fetchAnnouncement();

    const ch = supabase
      .channel("announcement-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          void fetchAnnouncement();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
  }, []);

  useEffect(() => {
    if (!announcement) return;
    // trigger entrance animation
    setVisible(false);
    // next frame -> set visible
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [announcement]);

  if (!announcement) return null;
  if (dismissedId === announcement.id) return null;

  const handleDismiss = () => {
    // animate out then persist dismissal
    setVisible(false);
    setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, announcement.id);
        setDismissedId(announcement.id);
      } catch {}
    }, 220);
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[60] py-3 px-4">
      <div
        className={`mx-auto max-w-7xl w-full relative rounded-md border border-border/20 bg-primary/95 text-primary-foreground shadow-lg transition-all duration-200 ease-out transform ${
          visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95"
        }`}
      >
        <div className="w-full px-4 py-2 text-sm text-center">{announcement.message}</div>
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground/90 hover:text-primary-foreground"
          aria-label="dismiss announcement"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
