// src/components/NotificationBell.jsx
import { useEffect, useState, useMemo } from "react";
import supabase from "../supabase";
import { useAuth } from "../context/AuthContext";

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);

  // Carga inicial
  useEffect(() => {
    if (!userId) return;

    (async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      const { data: listRows } = await supabase
        .from("notifications")
        .select("id, title, body, data, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(15);

      setUnread(count ?? 0);
      setItems(listRows ?? []);
    })();
  }, [userId]);

  // Realtime: nuevas notificaciones y cambios de leído
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notif_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setItems((prev) => [payload.new, ...prev].slice(0, 15));
          setUnread((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setItems((prev) => prev.map((i) => (i.id === payload.new.id ? payload.new : i)));
          if (payload?.old?.is_read === false && payload?.new?.is_read === true) {
            setUnread((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const hasUnread = unread > 0;
  const badge = useMemo(() => (hasUnread ? (unread > 99 ? "99+" : unread) : null), [unread, hasUnread]);

  const markAllAsRead = async () => {
    if (!userId || unread === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (!error) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  if (!userId) return null;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      {/* Botón con EXACTA estructura de tus iconos vecinos */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="alerts-icon-text"
        aria-label="Alerts"
        style={{ position: "relative", background: "transparent", border: "none", color: "inherit" }}
      >
        {badge && <span className="chat-badge">{badge}</span>}
        <span className="material-icons">notifications_none</span>
        <small>Alerts</small>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 44,
            width: 320,
            maxWidth: "90vw",
            maxHeight: 420,
            background: "var(--notif-bg, #ffffff)",
            color: "var(--notif-text, #081a3b)",
            border: "1px solid var(--notif-border, #e5e7eb)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "var(--notif-shadow, 0 10px 25px rgba(0,0,0,.15))",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              borderBottom: "1px solid var(--notif-border, #e5e7eb)",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
            <button
              onClick={markAllAsRead}
              disabled={unread === 0}
              style={{
                background: "transparent",
                border: "none",
                color: unread === 0 ? "var(--notif-muted, #6b7280)" : "#2563eb",
                fontSize: 12,
                cursor: unread === 0 ? "default" : "pointer",
              }}
              title="Mark all as read"
            >
              Mark all as read
            </button>
          </div>

          <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: 360, overflowY: "auto" }}>
            {items.length === 0 ? (
              <li style={{ padding: 14, fontSize: 13, color: "var(--notif-muted, #6b7280)" }}>No notifications</li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid var(--notif-border, #e5e7eb)",
                    background: n.is_read ? "transparent" : "var(--notif-unread, #eff6ff)",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title || "Notification"}</div>
                  {n.body && <div style={{ fontSize: 13, marginTop: 2 }}>{n.body}</div>}
                  <div style={{ fontSize: 11, color: "var(--notif-muted, #6b7280)", marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}