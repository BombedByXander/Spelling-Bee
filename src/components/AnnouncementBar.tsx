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

  if (!announcement) return null;
  if (dismissedId === announcement.id) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] bg-primary/95 text-primary-foreground border-b border-border/50 py-3 px-4 flex items-center justify-between">
      <div className="max-w-7xl mx-auto w-full px-2 text-sm">{announcement.message}</div>
      <button
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, announcement.id);
            setDismissedId(announcement.id);
          } catch {}
        }}
        className="ml-3 text-primary-foreground/80 hover:text-primary-foreground"
        aria-label="dismiss announcement"
      >
        ×
      </button>
    </div>
  );
};

export default AnnouncementBar;
