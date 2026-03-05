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
  const debugMode = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("announceDebug") === "1";

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
        return null;
      }

      setAnnouncement(data as AnnouncementRow);
      return data as AnnouncementRow;
    } catch (err) {
      setAnnouncement(null);
      return null;
    }
  };

  useEffect(() => {
    // Fetch the latest active announcement on mount so visitors arriving later
    // will see the current announcement. Then subscribe to realtime changes
    // to keep the banner up-to-date.
    let mounted = true;
    (async () => {
      try {
        const fetched = await fetchAnnouncement();
        if (!mounted) return;
        if (fetched && fetched.id && dismissedId !== fetched.id) {
          setVisible(true);
        }
      } catch {}
    })();

    const ch = supabase
      .channel("announcement-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        (payload: any) => {
          try { console.debug("Announcement payload:", payload); } catch {}
          try {
            const eventType = payload?.event || payload?.type || payload?.eventType || payload?.action;
            const record = payload?.record || payload?.new || payload?.old || payload?.data || null;
            if (!record) return;

            const et = String(eventType).toUpperCase();

            // On INSERT or UPDATE (active true) show the announcement
            if (et.includes("INSERT") || (et.includes("UPDATE") && record && record.active)) {
              try { console.debug("Announcement show/updated:", record); } catch {}
              setAnnouncement(record as AnnouncementRow);
              if (dismissedId !== record.id) setVisible(true);
            }

            // On DELETE or UPDATE (active false) hide it
            if (et.includes("DELETE") || (et.includes("UPDATE") && record && record.active === false)) {
              try { console.debug("Announcement removed/deactivated:", record); } catch {}
              setVisible(false);
              setTimeout(() => setAnnouncement(null), 220);
            }
          } catch (err) {
            // ignore
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [dismissedId]);

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
    <div
      style={{
        left: "-3px",
        right: "-3px",
        width: "calc(100% + 6px)",
        overflow: "visible",
        boxSizing: "border-box",
      }}
      className="fixed top-0 z-[100000] bg-primary/95 text-primary-foreground border-b border-border/50 py-3 px-4"
    >
      <div className={`max-w-full mx-auto w-full relative transition-all duration-200 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}>
        <div className="w-full px-2 text-sm text-center">{announcement.message}</div>
      </div>
      <button
        onClick={handleDismiss}
        style={{ zIndex: 100001, top: 6, right: 8 }}
        className="absolute right-2 top-2 w-11 h-11 flex items-center justify-center rounded-full bg-primary-foreground/12 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
        aria-label="dismiss announcement"
        title="Dismiss"
      >
        <span style={{ fontSize: 18, lineHeight: 1 }} className="leading-none">×</span>
      </button>
    </div>
  );
};

export default AnnouncementBar;
