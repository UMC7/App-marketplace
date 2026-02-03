// src/components/NotificationBell.js
import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";
import { useAuth } from "../context/AuthContext";
import { buildChatNotificationUrl, getChatParams, notificationDataMatchesChat } from "../utils/notificationRoutes";

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);

  const btnRef = useRef(null);
  const popRef = useRef(null);
  const navigate = useNavigate();

  // Helper: parse n.data (puede venir como objeto o string JSON)
  const parseData = (raw) => {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

const handleItemClick = async (e, n) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const d = parseData(n.data);
  const chatUrl = buildChatNotificationUrl(d);
  const chatParams = getChatParams(d);

  // Marcar como leída la notificación clicada
  if (n.is_read === false) {
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    setUnread((c) => Math.max(0, c - 1));
  }
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", n.id);

  if (error) {
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: false } : i)));
    setUnread((c) => c + 1);
  }

  // Si es notificación de chat: marcar como leídas todas las del mismo chat y actualizar contador al instante
  if (chatUrl && chatParams) {
    const sameChatIds = items
      .filter(
        (i) =>
          i.id !== n.id &&
          !i.is_read &&
          notificationDataMatchesChat(parseData(i.data), chatParams.offerId, chatParams.receiverId)
      )
      .map((i) => i.id);
    if (sameChatIds.length > 0) {
      await supabase.from("notifications").update({ is_read: true }).in("id", sameChatIds);
      setItems((prev) =>
        prev.map((i) => (sameChatIds.includes(i.id) ? { ...i, is_read: true } : i))
      );
      setUnread((c) => Math.max(0, c - sameChatIds.length));
    }
  }

  setOpen(false);

  const targetIsSeaJobs = d?.target === "seajobs" || d?.path === "/seajobs" || d?.path === "/yacht-works";
  const targetIsChat = d?.target === "chat" || (d?.offer_id && !targetIsSeaJobs);
  const jobId = d?.job_id || d?.query?.open;
  const offerId = d?.offer_id;

  let url = null;
  if (chatUrl) {
    url = chatUrl;
  } else if (targetIsSeaJobs && jobId) {
    const basePath = d?.path || "/yacht-works";
    url = `${basePath}?open=${encodeURIComponent(jobId)}`;
  } else if (targetIsChat && offerId) {
    url = `/yacht-works?open=${encodeURIComponent(offerId)}`;
  }

  if (url) {
    try {
      navigate(url);
    } catch {}
    setTimeout(() => {
      const now = window.location.pathname + window.location.search;
      if (now !== url) window.location.assign(url);
    }, 0);
  }
};

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

  // Realtime
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

  // Cerrar con click fuera y ESC
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!userId) return null;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      {/* Botón campana */}
      <button
        ref={btnRef}
        onClick={(e) => {
          // Evita burbujeo a contenedores con <Link to="/">
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="alerts-icon-text"
        aria-label="Alerts"
        style={{ position: "relative", background: "transparent", border: "none", color: "inherit" }}
      >
        {badge && <span className="chat-badge">{badge}</span>}
        <span className="material-icons">notifications_none</span>
        <small>Alerts</small>
      </button>

      {/* Dropdown pegado al botón */}
      {open && (
        <div
          ref={popRef}
          // Bloquea clicks internos para que no suban al header (evita redirecciones a landing)
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            position: "absolute",
            right: 0,
            top: 44,                 // justo bajo el botón
            width: 320,
            maxWidth: "90vw",
            maxHeight: 420,
            background: "var(--notif-bg, #ffffff)",
            color: "var(--notif-text, #081a3b)",
            border: "1px solid var(--notif-border, #e5e7eb)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "var(--notif-shadow, 0 10px 25px rgba(0,0,0,.15))",
            zIndex: 10000,           // por encima del navbar
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
                color: unread === 0 ? "var(--notif-muted, #6b7280)" : "var(--primary-color)",
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
              <li style={{ padding: 14, fontSize: 13, color: "var(--notif-muted, #6b7280)" }}>
                No notifications
              </li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  onClick={(e) => handleItemClick(e, n)}
                  style={{
                    padding: "10px 12px",
  borderBottom: "1px solid var(--notif-border, #3a3a3a)",
  background: n.is_read ? "transparent" : "var(--notif-unread, rgba(104,173,168,0.28))",
  boxShadow: n.is_read ? "none" : "inset 4px 0 0 0 var(--accent-color)", // ← barra turquesa
  cursor: "pointer",
                  }}
                  title={n.title || "Notification"}
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
