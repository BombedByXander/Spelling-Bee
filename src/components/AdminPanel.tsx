import React, { useEffect, useState } from "react";
import { Shield, Star, Users, Plus, RefreshCw, MessageSquare, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OWNER_USER_ID, isOwnerUser } from "@/lib/roles";

interface Props {
  open: boolean;
  onClose: () => void;
  canManageRoles?: boolean;
  currentUserId?: string;
}

interface UserRow {
  id: string;
  display_name: string;
  username: string | null;
  stars: number;
  total_correct: number;
  best_streak: number;
}

interface FeedbackRow {
  id: string;
  display_name: string | null;
  user_id: string | null;
  message: string;
  created_at: string;
  category?: string | null;
}

interface AnnouncementRow {
  id: string;
  message: string;
  active: boolean;
  created_at: string;
}

type AppRole = "admin" | "moderator" | "user";

interface RoleRow {
  user_id: string;
  role: AppRole;
}

type AdminTab = "users" | "feedback" | "announcements";

const AdminPanel = ({ open, onClose, canManageRoles = false, currentUserId }: Props) => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [rolesByUserId, setRolesByUserId] = useState<Record<string, AppRole>>({});
  const [pendingRoles, setPendingRoles] = useState<Record<string, AppRole>>({});
  const [savingRoleUserId, setSavingRoleUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>("users");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [giveAmountStr, setGiveAmountStr] = useState("");
  const [giveLoading, setGiveLoading] = useState(false);
  const [giveError, setGiveError] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [newAnnouncementMessage, setNewAnnouncementMessage] = useState<string>("");
  const [newAnnouncementActive, setNewAnnouncementActive] = useState<boolean>(true);
  const [announcementsLoading, setAnnouncementsLoading] = useState<boolean>(false);
  // feedback editing removed — edits are no longer allowed via admin panel

  const roleRank: Record<AppRole, number> = {
    user: 1,
    moderator: 2,
    admin: 3,
  };

  const totalStars = users.reduce((sum, user) => sum + Number(user.stars || 0), 0);

  const fetchUsers = async (query = search) => {
    try {
      setLoading(true);
      let request = supabase
        .from("profiles")
        .select("id, display_name, username, stars, total_correct, best_streak")
        .order("total_correct", { ascending: false })
        .limit(5000);

      const normalizedQuery = query.trim();
      if (normalizedQuery) {
        const escaped = normalizedQuery.replace(/,/g, "\\,").replace(/%/g, "\\%").replace(/_/g, "\\_");
        request = request.or(`display_name.ilike.%${escaped}%,username.ilike.%${escaped}%`);
      }

      const [{ data, error }, { data: roleRows, error: roleError }] = await Promise.all([
        request,
        (supabase as any).from("user_roles").select("user_id, role").limit(10000),
      ]);

      if (error || roleError) {
        console.error("Error fetching users:", error);
        if (roleError) console.error("Error fetching user roles:", roleError);
        setPanelError("Could not load users.");
        return;
      }

      const nextRoles: Record<string, AppRole> = {};
      ((roleRows ?? []) as RoleRow[]).forEach((row) => {
        const current = nextRoles[row.user_id];
        if (!current || roleRank[row.role] > roleRank[current]) {
          nextRoles[row.user_id] = row.role;
        }
      });

      setUsers((data ?? []) as UserRow[]);
      setRolesByUserId(nextRoles);
      setPendingRoles((previous) => {
        const merged: Record<string, AppRole> = { ...previous };
        (data ?? []).forEach((user) => {
          const resolvedRole = (nextRoles[user.id] || "user") as AppRole;
          if (!merged[user.id]) merged[user.id] = resolvedRole;
        });
        return merged;
      });
    } catch (error) {
      console.error("Exception fetching users:", error);
      setPanelError("Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  const getResolvedRole = (userId: string): AppRole => {
    if (isOwnerUser(userId)) return "admin";
    return rolesByUserId[userId] || "user";
  };

  const handleSaveRole = async (targetUserId: string) => {
    if (!canManageRoles) {
      setPanelError("You do not have permission to manage roles.");
      return;
    }

    if (targetUserId === OWNER_USER_ID) {
      setPanelError("Owner role cannot be changed.");
      return;
    }

    const nextRole = pendingRoles[targetUserId] || getResolvedRole(targetUserId);
    setSavingRoleUserId(targetUserId);
    setPanelError(null);

    const { error: deleteError } = await (supabase as any)
      .from("user_roles")
      .delete()
      .eq("user_id", targetUserId);

    if (deleteError) {
      setSavingRoleUserId(null);
      setPanelError(deleteError.message || "Failed to update role.");
      return;
    }

    if (nextRole !== "user") {
      const { error: insertError } = await (supabase as any)
        .from("user_roles")
        .insert({ user_id: targetUserId, role: nextRole });

      if (insertError) {
        setSavingRoleUserId(null);
        setPanelError(insertError.message || "Failed to update role.");
        return;
      }
    }

    setRolesByUserId((previous) => {
      const next = { ...previous };
      if (nextRole === "user") delete next[targetUserId];
      else next[targetUserId] = nextRole;
      return next;
    });

    setSavingRoleUserId(null);
  };

  const fetchFeedback = async () => {
    try {
      setFeedbackLoading(true);
      const { data, error } = await supabase
        .from("feedback_submissions")
        .select("id, display_name, user_id, message, created_at, category")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error fetching feedback:", error);
        setPanelError("Could not load feedback.");
        return;
      }

      setFeedback((data ?? []) as FeedbackRow[]);
    } catch (error) {
      console.error("Exception fetching feedback:", error);
      setPanelError("Could not load feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      const { data, error } = await supabase
        .from("announcements")
        .select("id, message, active, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        console.error("Error fetching announcements:", error);
        setAnnouncements([]);
        return;
      }

      try { console.debug("Fetched announcements:", data?.length ?? 0); } catch {}
      setAnnouncements((data ?? []) as AnnouncementRow[]);
    } catch (err) {
      console.error("Exception fetching announcements:", err);
      setAnnouncements([]);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const refreshAll = async () => {
    setPanelError(null);
    await Promise.all([fetchUsers(search), fetchFeedback()]);
  };

  useEffect(() => {
    if (!open) return;
    setPanelError(null);
    void Promise.all([fetchUsers(""), fetchFeedback(), fetchAnnouncements()]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      if (search.length > 0) {
        fetchUsers(search);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, open]);

  useEffect(() => {
    if (!open) return;

    const feedbackChannel = supabase
      .channel("admin-feedback-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback_submissions" },
        () => {
          void fetchFeedback();
        }
      )
      .subscribe();

    const announcementsChannel = supabase
      .channel("admin-announcements-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          void fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feedbackChannel);
      supabase.removeChannel(announcementsChannel);
    };
  }, [open]);

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    if (tab !== "announcements") return;
    // focus and scroll the announcements area into view so admins see controls
    const id = setTimeout(() => {
      try {
        const textarea = containerRef.current?.querySelector('textarea');
        if (textarea) {
          (textarea as HTMLTextAreaElement).focus();
          textarea.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      } catch (e) {
        // ignore
      }
    }, 80);
    return () => clearTimeout(id);
  }, [open, tab]);

  if (!open) return null;

  const handleGiveXp = async () => {
    if (!selectedUser) return;

    const targetId = selectedUser.id;
    const raw = giveAmountStr.trim();
    if (raw === "") return;

    const amount = parseInt(raw, 10);
    if (Number.isNaN(amount)) {
      setGiveError("Enter a valid integer");
      return;
    }

    setGiveLoading(true);
    setGiveError(null);

    try {
      // Read current stars (tolerant if missing)
      const { data: currentProfile, error: currentProfileError } = await supabase
        .from("profiles")
        .select("stars")
        .eq("id", targetId)
        .single();

      if (currentProfileError) {
        setGiveError(currentProfileError.message || "Failed to read current XP");
        return;
      }

      const currentStars = Number((currentProfile as any)?.stars || 0);
      const newStars = currentStars + amount;

      // Apply update and read the new value back in one operation
      const { data, error } = await supabase
        .from("profiles")
        .update({ stars: newStars })
        .eq("id", targetId)
        .select("stars")
        .single();

      if (error) {
        setGiveError(error.message || "Failed to grant XP");
        console.error("Give XP error:", error);
        return;
      }

      const updatedStars = Number((data as any)?.stars ?? newStars);
      setUsers((prev) => prev.map((u) => (u.id === targetId ? { ...u, stars: updatedStars } : u)));
      setSelectedUser(null);
      setGiveAmountStr("");
    } catch (err) {
      console.error("Exception giving XP:", err);
      setGiveError("An unexpected error occurred while granting XP.");
    } finally {
      setGiveLoading(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm("Delete this feedback entry?")) return;
    setPanelError(null);

    const { error } = await supabase
      .from("feedback_submissions")
      .delete()
      .eq("id", id);

    if (error) {
      setPanelError(error.message || "Failed to delete feedback.");
      return;
    }

    await fetchFeedback();
  };
  const startEditFeedback = (entry: FeedbackRow) => {
    setEditingFeedbackId(entry.id);
    setEditMessage(entry.message);
    setEditCategory(entry.category ?? null);
    setPanelError(null);
  };

  const handleSaveFeedback = async (id: string) => {
    if (!window.confirm("Save changes to this feedback entry?")) return;
    setEditLoading(true);
    setPanelError(null);

    const { error } = await supabase
      .from("feedback_submissions")
      .update({ message: editMessage, category: editCategory })
      .eq("id", id);

    if (error) {
      setPanelError(error.message || "Could not update feedback.");
      setEditLoading(false);
      return;
    }

    await fetchFeedback();
    setEditingFeedbackId(null);
    setEditMessage("");
    setEditCategory(null);
    setEditLoading(false);
  };

  const cancelEdit = () => {
    setEditingFeedbackId(null);
    setEditMessage("");
    setEditCategory(null);
    setPanelError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-5xl max-h-[85vh] mx-4 rounded-2xl bg-card/95 border border-border backdrop-blur-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <h2 className="text-lg font-extrabold font-mono text-primary text-glow tracking-tight">Admin Panel</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">×</button>
        </div>

        <div className="px-5 pt-4 border-b border-border/60 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setTab("users")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono border ${tab === "users" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            Users
          </button>
          <button
            onClick={() => setTab("feedback")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono border ${tab === "feedback" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            Feedback
          </button>
          <button
            onClick={() => setTab("announcements")}
            className={`px-3 py-1.5 rounded-md text-xs font-mono border ${tab === "announcements" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            Announcements
          </button>
          <button onClick={refreshAll} className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1" title="Refresh all">
            <RefreshCw size={16} className={loading || feedbackLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {panelError && <div className="px-5 py-2 text-xs text-destructive border-b border-border/60">{panelError}</div>}

        

        <div ref={containerRef} className="flex-1 overflow-y-auto px-5 py-3">
          {tab === "users" && (
            <div className="mt-0">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full mb-3 px-3 py-2 bg-input border border-border rounded-lg text-sm font-mono text-foreground placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-mono">{users.length} users</span>
                </div>
                <button
                  onClick={() => fetchUsers(search)}
                  disabled={loading}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Refresh users"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
              </div>
              {loading ? (
                <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>
              ) : (
                <div className="space-y-1">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="py-2 px-3 rounded-lg bg-card/40 border border-border/30 hover:bg-card/60 cursor-pointer transition-colors"
                      onClick={() => {
                        setSelectedUser(user);
                        setGiveAmountStr("");
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-sm text-foreground font-medium">{user.display_name}</span>
                          {user.username && <span className="text-xs text-muted-foreground font-mono ml-2">@{user.username}</span>}
                          {isOwnerUser(user.id) && (
                            <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded border border-primary/70 text-primary">OWNER</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-mono">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Star size={10} className="text-[hsl(45_95%_55%)]" /> {user.stars} XP
                          </span>
                          <span className="text-muted-foreground">{user.total_correct} correct</span>
                          <span className="text-primary font-bold">{user.best_streak} 🔥</span>
                        </div>
                      </div>

                      {canManageRoles && (
                        <div className="mt-2 flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                          <select
                            value={pendingRoles[user.id] || getResolvedRole(user.id)}
                            disabled={user.id === OWNER_USER_ID}
                            onChange={(event) => {
                              const selected = event.target.value as AppRole;
                              setPendingRoles((previous) => ({ ...previous, [user.id]: selected }));
                            }}
                            className="rounded-md border border-border bg-card/60 px-2 py-1 text-[10px] font-mono text-foreground"
                          >
                            <option value="user">user</option>
                            <option value="moderator">moderator</option>
                            <option value="admin">admin</option>
                          </select>
                          <button
                            onClick={() => handleSaveRole(user.id)}
                            disabled={savingRoleUserId === user.id || user.id === OWNER_USER_ID || currentUserId === user.id}
                            className="text-[10px] font-mono px-2 py-1 rounded border border-primary/60 text-primary hover:bg-primary/10 disabled:opacity-50"
                          >
                            {savingRoleUserId === user.id ? "Saving..." : "Save role"}
                          </button>
                          <span className="text-[10px] font-mono text-muted-foreground">current: {getResolvedRole(user.id)}</span>
                        </div>
                      )}
                      {!canManageRoles && (
                        <p className="mt-2 text-[10px] font-mono text-muted-foreground">role: {getResolvedRole(user.id)}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "feedback" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary mb-2">
                <MessageSquare size={14} />
                <span className="text-xs font-mono font-semibold">Moderate feedback</span>
              </div>
              {feedbackLoading ? (
                <p className="text-center text-muted-foreground text-sm py-8">Loading feedback...</p>
              ) : feedback.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No feedback found.</p>
              ) : (
                feedback.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-border/60 bg-card/40 p-3">
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {entry.display_name || (entry.user_id ? "User" : "Guest")} • {new Date(entry.created_at).toLocaleString()}
                    </p>
                    <>
                      {editingFeedbackId === entry.id ? (
                        <div>
                          <textarea
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            className="w-full mt-1 px-2 py-1 rounded bg-input border border-border text-sm text-foreground"
                            rows={4}
                          />
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={editCategory ?? ""}
                                onChange={(e) => setEditCategory(e.target.value || null)}
                                className="rounded-md border border-border bg-card/60 px-2 py-1 text-[10px] font-mono text-foreground"
                              >
                                <option value="">(none)</option>
                                <option value="bug">🪲 bug</option>
                                <option value="critical">❕ critical</option>
                                <option value="feedback">💬 feedback</option>
                              </select>
                              <span className="text-[10px] text-muted-foreground font-mono">{new Date(entry.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveFeedback(entry.id)}
                                disabled={editLoading}
                                className="inline-flex items-center gap-1 text-xs rounded-md px-2 py-1 bg-primary text-primary-foreground"
                              >
                                {editLoading ? "Saving..." : "Save"}
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={editLoading}
                                className="inline-flex items-center gap-1 text-xs border border-border rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{entry.message}</p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {entry.category ? (
                                <span className="text-sm">{entry.category === 'bug' ? '🪲' : entry.category === 'critical' ? '❕' : '💬'}</span>
                              ) : null}
                              <span className="text-[10px] text-muted-foreground font-mono">{new Date(entry.created_at).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEditFeedback(entry)}
                                className="inline-flex items-center gap-1 text-xs border border-border rounded-md px-2 py-1 text-foreground hover:bg-card/60"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteFeedback(entry.id)}
                                className="inline-flex items-center gap-1 text-xs border border-destructive/70 rounded-md px-2 py-1 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  </div>
                ))
              )}
            

          {tab === "announcements" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Shield size={14} />
                <span className="text-xs font-mono font-semibold">Site announcements</span>
              </div>

              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <p className="text-[10px] text-muted-foreground mb-2">Debug: {announcementsLoading ? "loading..." : `${announcements.length} announcements`}</p>
                <label className="text-[10px] font-mono text-muted-foreground">Message</label>
                <textarea
                  value={newAnnouncementMessage}
                  onChange={(e) => setNewAnnouncementMessage(e.target.value)}
                  rows={3}
                  className="w-full mt-1 px-2 py-1 rounded bg-input border border-border text-sm text-foreground"
                />
                <div className="mt-2 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-[10px] font-mono">
                    <input type="checkbox" checked={newAnnouncementActive} onChange={(e) => setNewAnnouncementActive(e.target.checked)} />
                    Active
                  </label>
                  <div className="ml-auto">
                    <button
                      onClick={async () => {
                        setPanelError(null);
                        if (!newAnnouncementMessage.trim()) {
                          setPanelError("Enter a message.");
                          return;
                        }
                        setAnnouncementsLoading(true);
                        const { data: created, error } = await supabase
                          .from("announcements")
                          .insert({ message: newAnnouncementMessage.trim(), active: newAnnouncementActive })
                          .select();
                        try { console.debug("Create announcement result:", { created, error }); } catch {}

                        if (error) {
                          setPanelError(error.message || "Could not create announcement.");
                        } else {
                          setNewAnnouncementMessage("");
                          setNewAnnouncementActive(true);
                          await fetchAnnouncements();
                        }
                        setAnnouncementsLoading(false);
                      }}
                      className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm"
                    >
                      {announcementsLoading ? "Creating..." : "Create announcement"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {announcements.map((a) => (
                  <div key={a.id} className="rounded-lg border border-border/60 bg-card/30 p-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{a.message}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          setPanelError(null);
                          const { error } = await supabase
                            .from("announcements")
                            .update({ active: !a.active })
                            .eq("id", a.id);
                          if (error) setPanelError(error.message || "Could not update announcement.");
                          else await fetchAnnouncements();
                        }}
                        className={`px-2 py-1 text-xs rounded-md ${a.active ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}
                      >
                        {a.active ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm("Delete this announcement?")) return;
                          setPanelError(null);
                          const { error } = await supabase.from("announcements").delete().eq("id", a.id);
                          if (error) setPanelError(error.message || "Could not delete announcement.");
                          else await fetchAnnouncements();
                        }}
                        className="px-2 py-1 text-xs border border-destructive/70 rounded-md text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      </div>

      {selectedUser && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="w-full max-w-sm mx-4 p-6 rounded-2xl bg-card border border-border backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold font-mono text-primary">Give XP to {selectedUser.display_name}</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Current XP: <strong>{selectedUser.stars}</strong>
              </p>
              <label className="block text-sm font-medium mb-1">XP delta (integer):</label>
              <input
                type="text"
                value={giveAmountStr}
                onChange={(e) => setGiveAmountStr(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground font-mono"
                placeholder="e.g. 999999 or -250"
              />
            </div>
            {giveError && <p className="text-red-500 text-sm mb-3">{giveError}</p>}
            <button
              onClick={handleGiveXp}
              disabled={giveLoading || giveAmountStr.trim() === ""}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={16} />
              {giveLoading ? "Granting..." : "Grant XP"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
